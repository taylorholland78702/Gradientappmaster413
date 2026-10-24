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
  it('rates a smooth gradient above a flat frame, noise as not good enough, and oversaturated colour below a restrained one', () => {
    expect(score(ramp, 'smoke')).toBeGreaterThan(score(flat, 'smoke') + 0.2);
    expect(score(noise, 'smoke')).toBeLessThan(GOOD_ENOUGH);
    const f = frameFeatures(ramp, W, H);
    expect(scoreFrame({ ...f, colourfulness: 0.7 }, 'smoke')).toBeGreaterThan(scoreFrame({ ...f, colourfulness: 1.6 }, 'smoke'));
  });
  it('puts GOOD_ENOUGH where about half of the marked looks (kept and skipped) fall below it, so a poor roll gets retried', () => {
    const all = [...SESSION_1, ...SESSION_2].map(([g, sd, colourfulness, detail, entropy, lit, mean]) => scoreFrame({ mean, sd, colourfulness, detail, entropy, lit }, g));
    const below = all.filter(v => v < GOOD_ENOUGH).length / all.length;
    expect(below).toBeGreaterThan(0.3);
    expect(below).toBeLessThan(0.7);
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

// 60 looks marked Keep or Skip in the marking tool (two sessions of 30): [gradient, sd, colourfulness, detail, entropy, lit,
// mean, kept]. The score is fitted to these, so this guards against it drifting back to ranking them near or below chance.
type Marked = [string, number, number, number, number, number, number, boolean];
const SESSION_1: Marked[] = [
  ['noise', 11.15, 0.506, 0.0371, 0.358, 1, 208.0, true],
  ['tunnel', 34.48, 0.487, 0.1124, 0.787, 0.998, 114.1, true],
  ['shapes', 29.24, 1.38, 0.0339, 0.647, 1, 147.4, false],
  ['caustics', 23.38, 0.514, 0.0385, 0.641, 1, 115.5, true],
  ['grid', 23.64, 1.057, 0.0614, 0.57, 1, 146.8, false],
  ['hatch', 35.38, 0.185, 0.0774, 0.797, 0.999, 116.3, true],
  ['windmill', 22.08, 1.178, 0.0492, 0.553, 1, 142.5, false],
  ['windmill', 21.41, 1.03, 0.036, 0.533, 1, 197.6, true],
  ['radial-burst', 53.55, 0.85, 0.1584, 0.758, 0.532, 52.0, true],
  ['radial-burst', 76.65, 0.352, 0.2186, 0.818, 0.954, 181.1, true],
  ['radial', 24.09, 0.674, 0.017, 0.518, 1, 142.1, false],
  ['light-beam', 30.88, 0.814, 0.0183, 0.573, 0.991, 148.5, false],
  ['grid', 33.08, 1.062, 0.0341, 0.64, 1, 124.4, false],
  ['radial', 31.55, 1.521, 0.0122, 0.59, 1, 129.8, false],
  ['windmill', 28.14, 1.522, 0.1376, 0.7, 1, 154.3, false],
  ['grid', 26.59, 0.777, 0.103, 0.687, 1, 149.7, false],
  ['julia', 9.99, 0.436, 0.0178, 0.362, 1, 186.7, true],
  ['grid', 16.48, 0.795, 0.0136, 0.528, 1, 140.2, false],
  ['smoke', 51.31, 0.971, 0.1227, 0.828, 1, 136.4, true],
  ['shapes', 37.5, 1.42, 0.0355, 0.67, 1, 138.5, false],
  ['noise', 26.85, 1.189, 0.0795, 0.648, 1, 164.0, true],
  ['glass', 32.74, 1.355, 0.0465, 0.759, 1, 176.9, true],
  ['radial', 27.28, 1.288, 0.0294, 0.544, 1, 153.1, false],
  ['radial', 23.61, 1.885, 0.02, 0.512, 1, 168.9, false],
  ['lava-lamp', 26.65, 0.897, 0.0352, 0.677, 0.999, 110.9, true],
  ['grid', 25.13, 1.116, 0.0339, 0.632, 1, 174.4, false],
  ['radial', 4.27, 1.651, 0.0028, 0.252, 1, 192.5, false],
  ['radial', 32.3, 2.097, 0.0166, 0.413, 1, 147.7, true],
  ['windmill', 64.04, 1.072, 0.228, 0.879, 0.638, 73.2, true],
  ['shapes', 38.93, 1.639, 0.0197, 0.655, 1, 139.7, true],
];
const SESSION_2: Marked[] = [
  ['stack', 15.0, 0.7457, 0.00728, 0.4992, 1, 143.0, true],
  ['noise', 26.07, 0.2507, 0.02491, 0.6679, 1, 151.2, true],
  ['marble', 44.6, 0.4364, 0.04121, 0.8675, 0.9652, 107.8, true],
  ['holographic', 41.52, 1.401, 0.17107, 0.7223, 1, 211.4, true],
  ['shapes', 31.85, 0.5425, 0.08066, 0.7245, 1, 106.9, true],
  ['angle', 22.12, 1.7334, 0.02067, 0.5251, 1, 179.3, false],
  ['spectral', 62.16, 1.44, 0.02274, 0.653, 1, 185.8, true],
  ['radial-burst', 43.44, 0.5936, 0.015, 0.7417, 1, 191.4, true],
  ['radial', 61.55, 1.3073, 0.04084, 0.7614, 0.9684, 108.6, true],
  ['radial', 43.55, 0, 0.15507, 0.6381, 0.3719, 34.5, true],
  ['julia', 36.6, 0.9771, 0.02074, 0.6309, 1, 187.2, true],
  ['waves', 42.45, 0.8706, 0.02876, 0.8491, 0.9129, 98.1, false],
  ['radial-burst', 61.96, 0.3731, 0.02139, 0.642, 0.3645, 45.2, false],
  ['grid', 49.04, 2.0032, 0.09139, 0.7624, 1, 137.6, false],
  ['grid', 33.34, 1.3509, 0.05138, 0.7311, 1, 144.0, false],
  ['light-beam', 57.18, 0.3714, 0.04161, 0.8333, 0.5793, 64.8, false],
  ['grid', 23.83, 0.5165, 0.05625, 0.5984, 1, 125.6, false],
  ['curtains', 34.39, 1.3804, 0.02904, 0.7467, 0.9891, 128.0, false],
  ['angle', 31.01, 0.8716, 0.0089, 0.6768, 1, 81.9, false],
  ['embers', 25.65, 0.1557, 0.02584, 0.6387, 0.7242, 47.2, true],
  ['windmill', 66.49, 1.2692, 0.03032, 0.9415, 0.9965, 159.0, false],
  ['radial-burst', 85.09, 0.3205, 0.05446, 0.8257, 0.6078, 98.9, true],
  ['windmill', 27.34, 1.1375, 0.02433, 0.5394, 1, 129.8, false],
  ['julia', 19.92, 0.3954, 0.00807, 0.3409, 1, 205.6, false],
  ['grid', 13.62, 0.9583, 0.03343, 0.4384, 1, 124.4, true],
  ['radial', 25.23, 1.2099, 0.01821, 0.5261, 1, 151.0, false],
  ['grid', 24.44, 0.6805, 0.02521, 0.6491, 1, 159.9, false],
  ['grid', 29.17, 0.8894, 0.05062, 0.6676, 1, 144.6, false],
  ['grid', 28.63, 0.9328, 0.02564, 0.6263, 1, 124.9, false],
  ['radial', 39.42, 1.8926, 0.01683, 0.4044, 1, 205.3, false],
];

const agreement = (marked: Marked[]) => {
  const scored = marked.map(([g, sd, colourfulness, detail, entropy, lit, mean, kept]) => ({ kept, s: scoreFrame({ mean, sd, colourfulness, detail, entropy, lit }, g) }));
  const keeps = scored.filter(x => x.kept), skips = scored.filter(x => !x.kept);
  let wins = 0;
  for (const k of keeps) for (const s of skips) wins += k.s > s.s ? 1 : k.s === s.s ? 0.5 : 0;
  return wins / (keeps.length * skips.length);
};

describe('agreement with marked looks', () => {
  it('ranks kept looks above skipped ones clearly better than chance, in each session and overall', () => {
    expect(agreement(SESSION_1)).toBeGreaterThan(0.62);
    expect(agreement(SESSION_2)).toBeGreaterThan(0.62);
    expect(agreement([...SESSION_1, ...SESSION_2])).toBeGreaterThan(0.65);
  });
});
