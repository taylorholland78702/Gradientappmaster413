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
  it('rates a smooth gradient above a flat frame', () => {
    expect(score(ramp, 'smoke')).toBeGreaterThan(score(flat, 'smoke') + 0.05);
  });
  it('stops rewarding detail once it is far more than any marked look had (busy noise)', () => {
    const f = frameFeatures(ramp, W, H);
    expect(scoreFrame({ ...f, detail: 0.6 }, 'smoke')).toBeLessThan(scoreFrame({ ...f, detail: 0.2 }, 'smoke'));
  });
  it('prefers more detail and contrast, and ignores colourfulness', () => {
    const f = frameFeatures(ramp, W, H);
    expect(scoreFrame({ ...f, detail: 0.1 }, 'smoke')).toBeGreaterThan(scoreFrame({ ...f, detail: 0.02 }, 'smoke'));
    expect(scoreFrame({ ...f, sd: 60 }, 'smoke')).toBeGreaterThan(scoreFrame({ ...f, sd: 20 }, 'smoke'));
    expect(scoreFrame({ ...f, colourfulness: 0.3 }, 'smoke')).toBe(scoreFrame({ ...f, colourfulness: 1.6 }, 'smoke'));
  });
  it('puts GOOD_ENOUGH where about half of the marked looks (kept and skipped) fall below it, so a poor roll gets retried', () => {
    const all = [...SESSION_1, ...SESSION_2, ...SESSION_3, ...SESSION_6.map(r => r.slice(0, 8) as Marked)].map(([g, sd, colourfulness, detail, entropy, lit, mean]) => scoreFrame({ mean, sd, colourfulness, detail, entropy, lit }, g));
    const below = all.filter(v => v < GOOD_ENOUGH).length / all.length;
    expect(below).toBeGreaterThan(0.35);
    expect(below).toBeLessThan(0.65);
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

// 90 looks marked Keep or Skip in the marking tool (three sessions of 30): [gradient, sd, colourfulness, detail, entropy, lit,
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

// Marked before the score was refit, so it was never fitted to: a held-out check (the new score ranks it 72%).
const SESSION_3: Marked[] = [
  ['grid', 31.57, 1.2274, 0.03884, 0.6227, 1, 139.5, false],
  ['radial-burst', 35.24, 0.4881, 0.01505, 0.781, 0.9559, 85.8, false],
  ['radial-burst', 54.62, 0.8121, 0.18344, 0.8353, 0.6711, 65.4, true],
  ['radial', 9.976, 0.5147, 0.006975, 0.417, 1, 207.8, false],
  ['bands', 26.75, 0, 0.02388, 0.584, 1, 213.4, true],
  ['grid', 33.01, 1.1238, 0.05093, 0.6374, 1, 156.8, true],
  ['shapes', 29.33, 1.5083, 0.01769, 0.5996, 1, 126.1, false],
  ['radial-burst', 44.43, 0.8638, 0.02038, 0.8488, 0.8949, 98.5, false],
  ['mercury', 57.08, 0.8608, 0.11015, 0.9028, 0.9992, 145.3, true],
  ['grid', 18.85, 1.2275, 0.06067, 0.5722, 1, 129.7, true],
  ['waves', 39.33, 0.3786, 0.03112, 0.4005, 0.5902, 46.7, false],
  ['vortex', 34.41, 0.2759, 0.02926, 0.226, 0.0773, 13.5, true],
  ['flow-mesh', 29.49, 0.7586, 0.02717, 0.7239, 1, 157.6, true],
  ['radial', 21.54, 0.9149, 0.006198, 0.4768, 1, 141.1, false],
  ['eclipse', 41.55, 0.7845, 0.0716, 0.7485, 0.6246, 48.7, true],
  ['rays', 44.7, 0.8237, 0.10611, 0.8573, 0.9922, 103.0, true],
  ['grid', 23.88, 1.4627, 0.05894, 0.5758, 1, 130.4, true],
  ['grid', 29.08, 0.9794, 0.02526, 0.6477, 1, 144.5, false],
  ['radial-burst', 47.24, 0.6537, 0.01351, 0.4684, 0.9953, 198.4, true],
  ['spectral', 29.14, 0.419, 0.01118, 0.6003, 1, 195.9, true],
  ['radial', 10.69, 0.4454, 0.006587, 0.3708, 1, 147.1, false],
  ['radial', 8.535, 0.5996, 0.0021, 0.1992, 1, 153.1, false],
  ['bands', 21.78, 0.0028, 0.09557, 0.5402, 1, 227.0, true],
  ['glass', 9.276, 0.5936, 0.03175, 0.3404, 1, 222.3, true],
  ['spectral', 23.83, 0.844, 0.008024, 0.5339, 1, 77.2, true],
  ['shapes', 20.96, 0.6341, 0.02815, 0.5899, 1, 145.6, true],
  ['noise', 45.67, 1.1971, 0.18164, 0.7056, 1, 120.7, true],
  ['embers', 30.43, 0.3585, 0.08637, 0.5908, 0.4633, 37.7, true],
  ['windmill', 46.13, 0.7298, 0.10062, 0.78, 1, 183.7, false],
  ['bands', 39.36, 0.5251, 0.01938, 0.7679, 1, 150.4, true],
];

// Marked after every look had effects and with a Love button: [gradient, sd, colourfulness, detail, entropy, lit, mean,
// kept, loved].
const SESSION_6: [...Marked, boolean][] = [
  ['windmill', 89.42, 0.8477, 0.26164, 0.56, 0.6664, 120.5, true, false],
  ['radial', 106.69, 0.4771, 0.21796, 0.3708, 0.2926, 67.35, false, false],
  ['marble', 19.8, 0.4632, 0.04574, 0.5544, 1, 190.4, false, false],
  ['flower', 22.36, 0.3854, 0.0234, 0.6062, 0.9793, 63.1, true, false],
  ['eclipse', 38.6, 0.8562, 0.02278, 0.561, 0.8906, 103.9, true, true],
  ['radial-burst', 55.29, 0.1291, 0.04809, 0.2224, 0.1059, 17.85, true, false],
  ['tunnel', 37.23, 0.92, 0.05097, 0.7828, 0.9984, 132.5, true, false],
  ['caustics', 30.25, 0.5519, 0.1223, 0.7139, 1, 121.6, true, false],
  ['grid', 22.49, 0.7571, 0.08125, 0.5459, 1, 139.6, true, true],
  ['shapes', 70.9, 0.4435, 0.12131, 0.6625, 0.6254, 83.1, false, false],
  ['metaballs', 34.7, 0.2812, 0.0415, 0.752, 0.9914, 129.2, true, false],
  ['radial', 66.42, 0.5597, 0.18477, 0.2843, 0.1449, 25.66, true, false],
  ['grid', 66.06, 0.4311, 0.11313, 0.2024, 0.1055, 22.19, true, true],
  ['raindrops', 74.75, 0.9819, 0.24171, 0.7929, 0.9141, 191.4, true, true],
  ['tunnel', 51.48, 1.2408, 0.05277, 0.8509, 1, 125.1, false, false],
  ['grid', 19.41, 0.48, 0.02634, 0.5833, 1, 140.8, true, false],
  ['marble', 24.43, 0.4848, 0.09063, 0.6528, 1, 151.3, false, false],
  ['radial-burst', 39.35, 0.3193, 0.02077, 0.7079, 1, 175.3, false, false],
  ['grid', 26.36, 1.0108, 0.03734, 0.6698, 1, 160.9, true, false],
  ['radial-burst', 39.87, 0.3774, 0.0246, 0.6924, 0.5016, 42.3, false, false],
  ['radial-burst', 39.66, 0.3715, 0.02657, 0.6716, 0.4785, 39.7, false, false],
  ['grid', 74.27, 1.279, 0.23968, 0.4023, 0.2344, 38.7, true, true],
  ['iridescent', 23.16, 0.6325, 0.04379, 0.6076, 1, 201.4, true, false],
  ['metaballs', 53.75, 0.4696, 0.04443, 0.7109, 1, 182.7, false, false],
  ['truchet', 39.42, 0.6132, 0.16827, 0.6702, 0.423, 45.7, true, false],
  ['shapes', 27.31, 0.6256, 0.04163, 0.627, 1, 160.3, true, false],
  ['grid', 86.25, 0.5849, 0.2825, 0.6783, 0.4121, 63.6, true, true],
  ['radial-burst', 88.24, 1.0768, 0.35312, 0.7243, 0.5836, 97.6, true, false],
  ['radial', 12.23, 0.4404, 0.04735, 0.438, 1, 140.6, false, false],
  ['marble', 76.49, 0.1259, 0.20703, 0.577, 0.3289, 45.15, true, true],
];

const agreement = (marked: Marked[]) => {
  const scored = marked.map(([g, sd, colourfulness, detail, entropy, lit, mean, kept]) => ({ kept, s: scoreFrame({ mean, sd, colourfulness, detail, entropy, lit }, g) }));
  const keeps = scored.filter(x => x.kept), skips = scored.filter(x => !x.kept);
  let wins = 0;
  for (const k of keeps) for (const s of skips) wins += k.s > s.s ? 1 : k.s === s.s ? 0.5 : 0;
  return wins / (keeps.length * skips.length);
};

describe('agreement with marked looks', () => {
  it('ranks kept looks above skipped ones better than chance, in each session and overall', () => {
    expect(agreement(SESSION_1)).toBeGreaterThan(0.58);
    expect(agreement(SESSION_2)).toBeGreaterThan(0.58);
    expect(agreement(SESSION_3)).toBeGreaterThan(0.58);
    expect(agreement(SESSION_6.map(r => r.slice(0, 8) as Marked))).toBeGreaterThan(0.58);
    expect(agreement([...SESSION_1, ...SESSION_2, ...SESSION_3])).toBeGreaterThan(0.6);
  });
  it('puts the loved looks above the rest', () => {
    const scored = SESSION_6.map(([g, sd, colourfulness, detail, entropy, lit, mean, , loved]) => ({ loved, s: scoreFrame({ mean, sd, colourfulness, detail, entropy, lit }, g) }));
    const love = scored.filter(x => x.loved), rest = scored.filter(x => !x.loved);
    let wins = 0;
    for (const a of love) for (const b of rest) wins += a.s > b.s ? 1 : a.s === b.s ? 0.5 : 0;
    expect(wins / (love.length * rest.length)).toBeGreaterThan(0.7);
  });
});
