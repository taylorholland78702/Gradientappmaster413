import { describe, it, expect } from 'vitest';
import { varyLook, nudgeHue, lookVariation } from './shuffleLook';
import { GRADIENT_LOOKS, LOOK_DEFAULTS, type GradientLook } from '../constants/gradientLooks';
import { MODULATABLE_PARAMS } from '../constants/modulatableParams';
import { hexToRgb, rgbToHsl } from './color';

const seeded = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const allLooks = Object.entries(GRADIENT_LOOKS).flatMap(([g, looks]) => (looks ?? []).map(l => ({ g, look: l })));
const range = (key: string) => { const p = MODULATABLE_PARAMS.find(x => x.key === key); return p ? [p.min, p.max] as const : null; };

describe('varying a look', () => {
  it('changes nothing at zero', () => {
    const look = allLooks[0].look;
    expect(varyLook(look, 0)).toBe(look);
  });

  it('keeps the name and the palette, and never leaves the slider range', () => {
    const rng = seeded(1);
    for (const { look } of allLooks) {
      for (let i = 0; i < 5; i++) {
        const v = varyLook(look, 0.2, rng);
        expect(v.name).toBe(look.name);
        expect(v.colors).toBe(look.colors);
        if (v.scale !== undefined) { expect(v.scale).toBeGreaterThanOrEqual(0.3); expect(v.scale).toBeLessThanOrEqual(3); }
        if (v.speed !== undefined) { expect(v.speed).toBeGreaterThanOrEqual(0); expect(v.speed).toBeLessThanOrEqual(3); }
        for (const [key, value] of Object.entries(v.params ?? {})) {
          const r = range(key);
          if (typeof value === 'number' && r) { expect(value, `${look.name} ${key}`).toBeGreaterThanOrEqual(r[0]); expect(value, `${look.name} ${key}`).toBeLessThanOrEqual(r[1]); }
        }
      }
    }
  });

  it('keeps whole-number settings whole and text settings as they were', () => {
    const rng = seeded(2);
    const look: GradientLook = { name: 't', colors: ['#000000', '#ffffff'], params: { voronoiCellCount: 19, noiseType: 'ridged', noiseScale: 25 } };
    for (let i = 0; i < 50; i++) {
      const v = varyLook(look, 0.2, rng);
      expect(Number.isInteger(v.params!.voronoiCellCount as number)).toBe(true);
      expect(v.params!.noiseType).toBe('ridged');
    }
  });

  it('moves values only a little, by about the amount asked', () => {
    const rng = seeded(3);
    const look: GradientLook = { name: 't', colors: ['#000000', '#ffffff'], scale: 1.5, speed: 1, params: { noiseScale: 25 } };
    let maxScale = 0, maxNoise = 0;
    for (let i = 0; i < 400; i++) {
      const v = varyLook(look, 0.1, rng);
      maxScale = Math.max(maxScale, Math.abs(v.scale! - 1.5) / 1.5);
      maxNoise = Math.max(maxNoise, Math.abs((v.params!.noiseScale as number) - 25) / 25);
    }
    expect(maxScale).toBeLessThan(0.101); expect(maxScale).toBeGreaterThan(0.05);
    expect(maxNoise).toBeLessThan(0.11);
    // Shared fields at a whole number (1) still move: they are not counts.
    const plain = varyLook({ name: 't', colors: ['#000000', '#ffffff'], scale: 1, speed: 1 }, 0.15, seeded(9));
    expect(plain.scale === 1 && plain.speed === 1).toBe(false);
  });

  it('actually varies, so two shuffles from one look differ', () => {
    const rng = seeded(4);
    const look: GradientLook = { name: 't', colors: ['#000000', '#ffffff'], scale: 1, speed: 1, params: { noiseScale: 25, noiseWarp: 1.5 } };
    const seen = new Set(Array.from({ length: 30 }, () => JSON.stringify(varyLook(look, 0.15, rng))));
    expect(seen.size).toBeGreaterThan(25);
  });

  it('leaves bias and sharpness off when the look does not set them', () => {
    const v = varyLook({ name: 't', colors: ['#000000', '#ffffff'] }, 0.2, seeded(5));
    expect(v.bias).toBeUndefined(); expect(v.sharp).toBeUndefined();
    expect(v.contrast).toBeDefined();
    expect(Math.abs(v.contrast! - LOOK_DEFAULTS.contrast)).toBeLessThan(0.6);
  });

  it('varies more for a stronger mood', () => {
    expect(lookVariation(1)).toBeGreaterThan(lookVariation(0));
    expect(lookVariation(0)).toBeGreaterThan(0.05);
    expect(lookVariation(1)).toBeLessThan(0.25);
  });
});

describe('turning a palette', () => {
  it('turns the hue and keeps brightness and saturation about the same', () => {
    const colours = ['#2b1055', '#c33764', '#ff7b54', '#ffd479'].map(hexToRgb);
    const turned = nudgeHue(colours, 30);
    colours.forEach((c, i) => {
      const [h1, s1, l1] = rgbToHsl(c.r, c.g, c.b);
      const [h2, s2, l2] = rgbToHsl(turned[i].r, turned[i].g, turned[i].b);
      expect(Math.abs(l1 - l2)).toBeLessThan(2);
      expect(Math.abs(s1 - s2)).toBeLessThan(4);
      const dh = Math.min(Math.abs(h2 - h1 - 30), 360 - Math.abs(h2 - h1 - 30));
      expect(dh).toBeLessThan(4);
    });
  });
  it('returns an equal copy at zero', () => {
    const c = [{ r: 1, g: 2, b: 3 }];
    const out = nudgeHue(c, 0);
    expect(out).toEqual(c); expect(out[0]).not.toBe(c[0]);
  });
});
