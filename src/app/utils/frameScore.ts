import type { GradientType } from '../constants/gradientEffects';
import { gradientKind } from '../constants/shuffleTaste';

// How good a drawn frame looks, from its pixels. The dull-frame check in frameQuality.ts only catches the failures
// (flat, black, white). This scores everything else too, so Shuffle can try a few looks and keep the best: wide
// contrast, real colour, a rich spread of brightness, a sensible amount of detail (not flat, not noise) and, for
// gradients that are shapes on black, a sensible amount of the frame lit.

export interface FrameFeatures {
  mean: number;            // average brightness, 0-255
  sd: number;              // brightness spread, 0-255
  colourfulness: number;   // Hasler-Susstrunk colourfulness, about 0 (grey) to 1 (vivid)
  detail: number;          // mean brightness change between neighbouring pixels, 0-1
  entropy: number;         // how evenly brightness is spread over 16 levels, 0-1
  lit: number;             // share of pixels brighter than 12%
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// `data` is RGBA pixels (a small downscale of the canvas).
export function frameFeatures(data: ArrayLike<number>, width: number, height: number): FrameFeatures {
  const n = width * height;
  const luma = new Float32Array(n);
  let sum = 0, sum2 = 0, lit = 0;
  let rgSum = 0, rgSum2 = 0, ybSum = 0, ybSum2 = 0;
  const bins = new Array<number>(16).fill(0);
  for (let i = 0; i < n; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    const l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    luma[i] = l;
    sum += l; sum2 += l * l;
    if (l > 0.12) lit++;
    bins[Math.min(15, Math.floor(l * 16))]++;
    const rg = r - g, yb = 0.5 * (r + g) - b;
    rgSum += rg; rgSum2 += rg * rg; ybSum += yb; ybSum2 += yb * yb;
  }
  const mean = sum / n;
  const sd = Math.sqrt(Math.max(0, sum2 / n - mean * mean));
  const sdOf = (s: number, s2: number) => Math.sqrt(Math.max(0, s2 / n - (s / n) * (s / n)));
  const colourfulness = (Math.hypot(sdOf(rgSum, rgSum2), sdOf(ybSum, ybSum2)) + 0.3 * Math.hypot(rgSum / n, ybSum / n)) / 80;
  let change = 0, pairs = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (x + 1 < width) { change += Math.abs(luma[i] - luma[i + 1]); pairs++; }
      if (y + 1 < height) { change += Math.abs(luma[i] - luma[i + width]); pairs++; }
    }
  }
  let h = 0;
  for (const c of bins) if (c > 0) { const p = c / n; h -= p * Math.log2(p); }
  return { mean: mean * 255, sd: sd * 255, colourfulness, detail: pairs ? change / pairs : 0, entropy: h / 4, lit: lit / n };
}

// 1 inside [lo, hi], falling off linearly to 0 over `softLow` below it and `softHigh` above it.
const band = (v: number, lo: number, hi: number, softLow: number, softHigh = softLow) =>
  clamp01(1 - (v < lo ? (lo - v) / softLow : v > hi ? (v - hi) / softHigh : 0));

// 0 to 1. Roughly: under 0.3 is poor, over 0.6 is good.
export function scoreFrame(f: FrameFeatures, gradient: GradientType | string): number {
  const kind = gradientKind(gradient);
  const sparse = kind === 'particles';
  const darkGround = kind === 'dark-ground' || sparse;
  const contrast = clamp01(f.sd / (darkGround ? 45 : 55));
  const colour = clamp01(f.colourfulness / 0.55);
  const richness = clamp01(f.entropy / 0.8);
  // Detail: a gentle field has a little, a pattern more; none is flat and a lot is noise.
  const detail = sparse ? band(f.detail, 0.002, 0.08, 0.002, 0.05) : kind === 'pattern' ? band(f.detail, 0.02, 0.14, 0.02, 0.08) : band(f.detail, 0.004, 0.07, 0.004, 0.05);
  // Shapes on black should light a fair part of the frame, but not all of it.
  const lit = sparse ? band(f.lit, 0.02, 0.35, 0.2) : darkGround ? band(f.lit, 0.12, 0.7, 0.25) : band(f.lit, 0.55, 1, 0.3);
  return 0.25 * contrast + 0.2 * colour + 0.1 * richness + 0.25 * detail + 0.2 * lit;
}

// Picks the frame to keep: the best-scoring one that is not dull, or, when every one was dull, the best-scoring.
export interface FrameCandidate<T> { score: number; dull: boolean; value: T }
export function bestCandidate<T>(candidates: readonly FrameCandidate<T>[]): FrameCandidate<T> | null {
  if (candidates.length === 0) return null;
  const pool = candidates.some(c => !c.dull) ? candidates.filter(c => !c.dull) : candidates;
  return pool.reduce((best, c) => (c.score > best.score ? c : best));
}

// Score at or above which a look is good enough to stop trying others.
export const GOOD_ENOUGH = 0.62;
