import { describe, it, expect } from 'vitest';
import { generatePalette, luma, pickPalette, scorePalette } from './shufflePalette';
import { ShuffleHistory } from './shuffleHistory';
import { hexToRgb, hslToRgb } from './color';
import { isDullPalette } from './frameQuality';
import { PALETTE_PRESETS } from '../constants/palettePresets';
import type { ColorRGB } from '../constants/gradientEffects';

const seeded = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const spreadOf = (c: ColorRGB[]) => Math.max(...c.map(luma)) - Math.min(...c.map(luma));

// What Shuffle's random palette used to be: harmonic hues at similar saturation and lightness, no ramp.
function oldPalette(count: number, rng: () => number): ColorRGB[] {
  const baseHue = rng() * 360, scheme = rng();
  return Array.from({ length: count }, (_, i) => {
    const hue = scheme < 0.4 ? (baseHue + (i - 1) * 30 + (rng() * 20 - 10) + 360) % 360
      : scheme < 0.7 ? (baseHue + (i % 2 === 0 ? 0 : 150 + rng() * 60) + (rng() * 20 - 10) + 360) % 360
        : (baseHue + i * 120 + (rng() * 30 - 15) + 360) % 360;
    return hslToRgb(hue, 60 + rng() * 35, 42 + rng() * 28);
  });
}

const GRADIENTS = { smooth: 'smoke', 'dark-ground': 'eclipse', pattern: 'voronoi', particles: 'particles' } as const;

describe('generated palettes', () => {
  it('have the right number of valid colours', () => {
    const rng = seeded(1);
    for (const g of Object.values(GRADIENTS)) {
      for (const count of [2, 3, 5, 6, 8]) {
        const p = generatePalette({ gradient: g, count, rng });
        expect(p).toHaveLength(count);
        for (const c of p) for (const v of [c.r, c.g, c.b]) { expect(Number.isFinite(v)).toBe(true); expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(255); }
      }
    }
  });

  it('always span a wide brightness range, and are never dull', () => {
    const rng = seeded(2);
    for (const g of Object.values(GRADIENTS)) {
      for (let i = 0; i < 300; i++) {
        const p = generatePalette({ gradient: g, count: 6, rng });
        expect(spreadOf(p), g).toBeGreaterThan(0.4);
        expect(isDullPalette(p, g), g).toBe(false);
      }
    }
  });

  it('start from a dark colour on dark-ground gradients', () => {
    const rng = seeded(3);
    let darkStart = 0;
    for (let i = 0; i < 300; i++) {
      const p = generatePalette({ gradient: 'eclipse', count: 5, rng });
      expect(Math.min(...p.map(luma))).toBeLessThan(0.12);
      if (luma(p[0]) < 0.12) darkStart++;
    }
    expect(darkStart / 300).toBeGreaterThan(0.8);       // most rise from dark; a few peak in the middle
  });

  it('use few distinct colours on pattern gradients', () => {
    const rng = seeded(4);
    for (let i = 0; i < 100; i++) {
      // Six slots from at most four anchors: neighbours blend, so there are long runs between anchors.
      const p = generatePalette({ gradient: 'voronoi', count: 6, rng });
      const steps = p.slice(1).map((c, k) => Math.hypot(c.r - p[k].r, c.g - p[k].g, c.b - p[k].b));
      expect(steps.filter(s => s < 1)).toHaveLength(0);
    }
  });

  it('are varied: different base hues and schemes', () => {
    const rng = seeded(5);
    const first = new Set(Array.from({ length: 60 }, () => { const c = generatePalette({ gradient: 'smoke', count: 5, rng })[2]; return Math.round(c.r / 40) * 100 + Math.round(c.g / 40) * 10 + Math.round(c.b / 40); }));
    expect(first.size).toBeGreaterThan(15);
  });
});

describe('palette score', () => {
  const rgb = (hex: string[]) => hex.map(hexToRgb);
  it('prefers a wide brightness range over flat colours', () => {
    const ramp = rgb(['#05060f', '#1b1b4a', '#4a3f9f', '#f0e0ff']);
    const flat = rgb(['#7a5ad0', '#7ad05a', '#d07a5a', '#5ad0c0']);
    expect(scorePalette(ramp, 'smoke')).toBeGreaterThan(scorePalette(flat, 'smoke') + 2);
  });
  it('wants a dark base on dark-ground gradients', () => {
    const dark = rgb(['#05060f', '#2a1a6a', '#8f5aff', '#ffe0ff']);
    const bright = rgb(['#6a5acd', '#8f7aff', '#b9a8ff', '#ffffff']);
    expect(scorePalette(dark, 'eclipse')).toBeGreaterThan(scorePalette(bright, 'eclipse'));
  });
  it('marks a washed-out grey palette down', () => {
    const grey = rgb(['#202020', '#707070', '#a0a0a0', '#e0e0e0']);
    const colour = rgb(['#20103a', '#7a3a9f', '#d0609f', '#ffe0c0']);
    expect(scorePalette(colour, 'smoke')).toBeGreaterThan(scorePalette(grey, 'smoke'));
  });
});

describe('choosing a ready-made palette', () => {
  it('favours better-scoring palettes, and still reaches others', () => {
    const rng = seeded(6);
    const h = new ShuffleHistory();
    const counts = new Map<string, number>();
    for (let i = 0; i < 1500; i++) {
      const p = pickPalette(PALETTE_PRESETS, x => x.colors.map(hexToRgb), 'eclipse', h, rng);
      counts.set(p.name, (counts.get(p.name) ?? 0) + 1);
    }
    expect(counts.size).toBeGreaterThan(PALETTE_PRESETS.length * 0.8);
    const best = Math.max(...counts.values());
    expect(best / 1500).toBeLessThan(0.12);          // no single palette dominates
  });
});

describe('before and after (600 palettes each, six colours)', () => {
  const N = 600;
  const measure = (make: (g: string, rng: () => number) => ColorRGB[]) => {
    const out: Record<string, { spread: number; flat: number; dull: number; darkBase: number }> = {};
    for (const [kind, g] of Object.entries(GRADIENTS)) {
      const rng = seeded(77);
      let spread = 0, flat = 0, dull = 0, darkBase = 0;
      for (let i = 0; i < N; i++) {
        const p = make(g, rng);
        const s = spreadOf(p);
        spread += s; if (s < 0.3) flat++; if (isDullPalette(p, g)) dull++; if (Math.min(...p.map(luma)) < 0.1) darkBase++;
      }
      out[kind] = { spread: +(spread / N).toFixed(2), flat: +(flat / N).toFixed(3), dull: +(dull / N).toFixed(3), darkBase: +(darkBase / N).toFixed(2) };
    }
    return out;
  };
  const before = measure((g, rng) => oldPalette(6, rng));
  const after = measure((g, rng) => generatePalette({ gradient: g, count: 6, rng }));
  it('widens the brightness range and removes flat palettes', () => {
    console.info('palettes before/after', JSON.stringify({ before, after }));
    for (const kind of Object.keys(GRADIENTS)) {
      expect(after[kind].spread).toBeGreaterThan(before[kind].spread + 0.15);
      expect(after[kind].flat).toBeLessThan(before[kind].flat / 3 + 0.001);
    }
    expect(after['dark-ground'].darkBase).toBeGreaterThan(0.98);
  });
});
