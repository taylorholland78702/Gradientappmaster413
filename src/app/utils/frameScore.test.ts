import { describe, it, expect } from 'vitest';
import { frameFeatures, scoreFrame, bestCandidate, GOOD_ENOUGH } from './frameScore';

const W = 64, H = 40;
const image = (px: (x: number, y: number) => [number, number, number]) => {
  const d = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const [r, g, b] = px(x, y); const i = (y * W + x) * 4; d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255; }
  return d;
};
const seeded = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const score = (d: Uint8ClampedArray, g: string) => scoreFrame(frameFeatures(d, W, H), g);

const flat = image(() => [128, 128, 128]);
const black = image(() => [4, 4, 6]);
// A smooth diagonal ramp through colours (what a good gradient looks like).
const ramp = image((x, y) => { const t = (x / W + y / H) / 2; return [Math.round(255 * Math.abs(Math.sin(t * 3.1))), Math.round(255 * t), Math.round(255 * (1 - t) * 0.8 + 40)]; });
const greyRamp = image((x, y) => { const v = Math.round(255 * (x / W + y / H) / 2); return [v, v, v]; });
const noise = (() => { const r = seeded(5); return image(() => [Math.round(r() * 255), Math.round(r() * 255), Math.round(r() * 255)]); })();
// A few bright shapes on black.
const dots = image((x, y) => ((x % 16 < 3 && y % 13 < 3) ? [255, 200, 120] : [3, 3, 8]));
// A glowing disc on black, a dark-ground gradient at its best.
const disc = image((x, y) => { const d = Math.hypot(x - 32, y - 20); const v = Math.max(0, 1 - d / 22); return [Math.round(255 * v), Math.round(150 * v * v), Math.round(255 * v * 0.7)].map(c => Math.min(255, c + 4)) as [number, number, number]; });

describe('frame features', () => {
  it('measure brightness, colour and detail', () => {
    const f = frameFeatures(ramp, W, H);
    expect(f.sd).toBeGreaterThan(30);
    expect(f.colourfulness).toBeGreaterThan(0.3);
    expect(f.detail).toBeLessThan(0.05);
    expect(frameFeatures(flat, W, H).sd).toBeLessThan(0.5);
    expect(frameFeatures(greyRamp, W, H).colourfulness).toBeLessThan(0.05);
    expect(frameFeatures(noise, W, H).detail).toBeGreaterThan(0.15);
  });
});

describe('frame score', () => {
  it('rates flat and near-black frames as poor', () => {
    expect(score(flat, 'smoke')).toBeLessThan(0.3);
    expect(score(black, 'smoke')).toBeLessThan(0.2);
  });
  it('rates a smooth colourful gradient as good, above a grey one and above noise', () => {
    const good = score(ramp, 'smoke');
    expect(good).toBeGreaterThan(GOOD_ENOUGH);
    expect(good).toBeGreaterThan(score(greyRamp, 'smoke') + 0.1);
    expect(good).toBeGreaterThan(score(noise, 'smoke') + 0.1);
  });
  it('judges shapes on black by dark-ground rules, not as a failed field', () => {
    expect(score(disc, 'eclipse')).toBeGreaterThan(0.45);
    expect(score(disc, 'eclipse')).toBeGreaterThan(score(disc, 'smoke'));
    expect(score(dots, 'particles')).toBeGreaterThan(score(dots, 'smoke'));
  });
  it('stays between 0 and 1', () => {
    for (const d of [flat, black, ramp, greyRamp, noise, dots, disc]) for (const g of ['smoke', 'eclipse', 'voronoi', 'particles']) {
      const s = score(d, g); expect(s).toBeGreaterThanOrEqual(0); expect(s).toBeLessThanOrEqual(1);
    }
  });
});

describe('choosing the look to keep', () => {
  it('takes the best score that is not dull', () => {
    const best = bestCandidate([{ score: 0.9, dull: true, value: 'a' }, { score: 0.4, dull: false, value: 'b' }, { score: 0.55, dull: false, value: 'c' }]);
    expect(best?.value).toBe('c');
  });
  it('falls back to the best of the dull ones, and handles none', () => {
    expect(bestCandidate([{ score: 0.1, dull: true, value: 'a' }, { score: 0.2, dull: true, value: 'b' }])?.value).toBe('b');
    expect(bestCandidate([])).toBeNull();
  });
});
