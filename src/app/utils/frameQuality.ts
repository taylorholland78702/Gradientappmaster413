import type { ColorRGB, GradientType } from '../constants/gradientEffects';
import { frameFeatures, type FrameFeatures } from './frameScore';

// Judges whether a shuffled look is worth showing. Shuffle rolls a gradient, a palette and a stack of effects at
// random; some combinations wash out to a flat field (trails or blur smearing everything together), or land on
// near-black or near-white. The thresholds come from 150 recorded shuffles: a flat frame has almost no contrast.

export interface FrameStats { mean: number; sd: number }

// Gradients that are mostly dark ground with a few bright shapes: low average brightness is how they look.
const DARK_GROUND: ReadonlySet<string> = new Set([
  'eclipse', 'vortex', 'light-beam', 'edge-glow', 'curtains', 'rays', 'bokeh', 'embers',
  'flower', 'radial-burst', 'lava-lamp', 'metaballs', 'truchet', 'stack',
]);
// A handful of dots on black: contrast is naturally tiny, so there is nothing to judge.
const SPARSE: ReadonlySet<string> = new Set(['particles', 'attractor', 'fireworks', 'lightning']);

export const FLAT_SD = 7;
export const NEAR_BLACK_MEAN = 8;
export const NEAR_WHITE_MEAN = 240;
export const EMPTY_SD = 14;

export function isDullFrame({ mean, sd }: FrameStats, gradientType: GradientType | string): boolean {
  if (SPARSE.has(gradientType)) return false;
  if (sd < FLAT_SD) return true;
  if (!DARK_GROUND.has(gradientType) && mean < NEAR_BLACK_MEAN && sd < EMPTY_SD) return true;
  if (mean > NEAR_WHITE_MEAN && sd < EMPTY_SD) return true;
  return false;
}

// Palette check on the colors a shuffle is easing toward (the canvas still shows the old ones for a moment).
export function isDullPalette(colors: ColorRGB[], gradientType: GradientType | string): boolean {
  if (SPARSE.has(gradientType) || colors.length === 0) return false;
  const lum = colors.map(c => (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255);
  const mean = lum.reduce((a, b) => a + b, 0) / lum.length;
  const spread = Math.max(...lum) - Math.min(...lum);
  if (spread < 0.04) return true;                       // every color nearly the same brightness: no gradient to see
  if (!DARK_GROUND.has(gradientType) && mean < 0.05) return true;
  return mean > 0.95;
}

let scratch: HTMLCanvasElement | null = null;
// Average brightness and contrast of what is on the canvas right now, from a 48x30 downscale.
export function measureCanvas(canvas: HTMLCanvasElement): FrameStats | null {
  try {
    scratch ??= Object.assign(document.createElement('canvas'), { width: 48, height: 30 });
    const ctx = scratch.getContext('2d', { willReadFrequently: true });
    if (!ctx || canvas.width === 0 || canvas.height === 0) return null;
    ctx.drawImage(canvas, 0, 0, 48, 30);
    const d = ctx.getImageData(0, 0, 48, 30).data;
    let s = 0, s2 = 0;
    const n = d.length / 4;
    for (let i = 0; i < d.length; i += 4) { const l = (d[i] + d[i + 1] + d[i + 2]) / 3; s += l; s2 += l * l; }
    const mean = s / n;
    return { mean, sd: Math.sqrt(Math.max(0, s2 / n - mean * mean)) };
  } catch {
    return null;
  }
}

let featureScratch: HTMLCanvasElement | null = null;
// Everything about what is on the canvas right now that the shuffle judges: the brightness stats plus the richer
// features (colour, detail, spread). One downscale serves both.
export function measureFrame(canvas: HTMLCanvasElement): { stats: FrameStats; features: FrameFeatures } | null {
  try {
    featureScratch ??= Object.assign(document.createElement('canvas'), { width: 64, height: 40 });
    const ctx = featureScratch.getContext('2d', { willReadFrequently: true });
    if (!ctx || canvas.width === 0 || canvas.height === 0) return null;
    ctx.drawImage(canvas, 0, 0, 64, 40);
    const d = ctx.getImageData(0, 0, 64, 40).data;
    const features = frameFeatures(d, 64, 40);
    // Same definition of brightness and spread the dull-frame thresholds were set with (plain channel average).
    let s = 0, s2 = 0;
    const n = d.length / 4;
    for (let i = 0; i < d.length; i += 4) { const l = (d[i] + d[i + 1] + d[i + 2]) / 3; s += l; s2 += l * l; }
    const mean = s / n;
    return { stats: { mean, sd: Math.sqrt(Math.max(0, s2 / n - mean * mean)) }, features };
  } catch {
    return null;
  }
}
