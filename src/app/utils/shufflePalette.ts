import type { ColorRGB } from '../constants/gradientEffects';
import { gradientKind, type GradientKind } from '../constants/shuffleTaste';
import { adjustColorArrayLength, hslToRgb, rgbToHsl } from './color';
import { pickWeighted, type ShuffleHistory } from './shuffleHistory';

// Palettes for Shuffle, built from rules. A palette picked purely at random tends to have colours of similar
// brightness, which reads as flat: the hues can be lovely and there is still no gradient to see. These palettes
// are made the way a designer would: pick a hue harmony, give the colours a lightness ramp (a dark anchor, mids,
// and one bright accent), and use fewer distinct colours for pattern gradients. A scorer judges ready-made palettes
// by the same rules, so Shuffle can prefer the better ones.

// Brightness as isDullPalette reads it, 0-1.
export const luma = (c: ColorRGB): number => (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255;

type Scheme = 'analogous' | 'complementary' | 'split' | 'triad' | 'mono-accent';
type Ramp = 'rise' | 'fall' | 'peak';

// How likely each hue harmony is for each kind of gradient.
const SCHEME_WEIGHTS: Record<GradientKind, Record<Scheme, number>> = {
  smooth: { analogous: 0.35, complementary: 0.2, split: 0.2, triad: 0.1, 'mono-accent': 0.15 },
  'dark-ground': { analogous: 0.3, complementary: 0.15, split: 0.2, triad: 0.0, 'mono-accent': 0.35 },
  pattern: { analogous: 0.1, complementary: 0.3, split: 0.2, triad: 0.25, 'mono-accent': 0.15 },
  particles: { analogous: 0.3, complementary: 0.15, split: 0.15, triad: 0.0, 'mono-accent': 0.4 },
};

const wrap = (h: number) => ((h % 360) + 360) % 360;

// The hue offsets (from the base hue) a scheme uses, in order; the last one is the accent where there is one.
function schemeHues(scheme: Scheme, n: number, rng: () => number): number[] {
  const jitter = () => (rng() - 0.5) * 16;
  switch (scheme) {
    case 'analogous': return Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * (22 + rng() * 10) + jitter());
    case 'complementary': return Array.from({ length: n }, (_, i) => (i < Math.ceil(n / 2) ? i * 12 : 180 + (i - Math.ceil(n / 2)) * 12) + jitter());
    case 'split': return Array.from({ length: n }, (_, i) => [0, 150, 210][i % 3] + Math.floor(i / 3) * 14 + jitter());
    case 'triad': return Array.from({ length: n }, (_, i) => [0, 120, 240][i % 3] + Math.floor(i / 3) * 16 + jitter());
    default: return Array.from({ length: n }, (_, i) => (i === n - 1 ? 150 + rng() * 60 : i * 10) + jitter());   // one colour family plus an accent
  }
}

// An sRGB colour at a hue and saturation whose brightness (luma) is as close to `target` as possible.
function colourAtLuma(h: number, s: number, target: number): ColorRGB {
  let lo = 2, hi = 98, best = hslToRgb(h, s, 50);
  for (let i = 0; i < 14; i++) {
    const mid = (lo + hi) / 2;
    best = hslToRgb(h, s, mid);
    if (luma(best) < target) lo = mid; else hi = mid;
  }
  return best;
}

// Target brightness for each position of an n-colour ramp. Always spans a wide range so there is something to see.
function rampLumas(ramp: Ramp, n: number, dark: boolean, rng: () => number): number[] {
  const low = dark ? 0.02 + rng() * 0.05 : 0.07 + rng() * 0.09;
  const high = 0.8 + rng() * 0.13;
  const t = (i: number) => (n === 1 ? 0.5 : i / (n - 1));
  // Slightly eased so the middle colours do not bunch up around the centre brightness.
  const ease = (x: number) => x * x * (3 - 2 * x) * 0.35 + x * 0.65;
  const rise = Array.from({ length: n }, (_, i) => low + (high - low) * ease(t(i)));
  if (ramp === 'rise') return rise;
  if (ramp === 'fall') return rise.reverse();
  // peak: dark at both ends, the brightest colour in the middle (a light band)
  return Array.from({ length: n }, (_, i) => low + (high - low) * Math.sin(Math.PI * t(i)));
}

export interface GenerateOptions {
  gradient: string | null;
  count: number;
  rng?: () => number;
}

export function generatePalette({ gradient, count, rng = Math.random }: GenerateOptions): ColorRGB[] {
  const kind = gradientKind(gradient);
  const dark = kind === 'dark-ground' || kind === 'particles';
  // Pattern gradients read best with a few distinct colours; the rest take more.
  const anchors = Math.max(2, Math.min(count, kind === 'pattern' ? 3 + (rng() < 0.4 ? 1 : 0) : 4 + (rng() < 0.5 ? 1 : 0)));
  const scheme = pickWeighted(Object.keys(SCHEME_WEIGHTS[kind]) as Scheme[], s => SCHEME_WEIGHTS[kind][s], rng);
  // Dark grounds mostly rise from black to a light accent; others may also fall or peak.
  const ramp: Ramp = dark ? (rng() < 0.85 ? 'rise' : 'peak') : pickWeighted<Ramp>(['rise', 'fall', 'peak'], r => ({ rise: 0.45, fall: 0.3, peak: 0.25 })[r], rng);
  const baseHue = rng() * 360;
  const hues = schemeHues(scheme, anchors, rng);
  const lumas = rampLumas(ramp, anchors, dark, rng);
  const maxLuma = Math.max(...lumas), minLuma = Math.min(...lumas);

  const colours = hues.map((offset, i) => {
    // The extremes are tints (lower saturation); the middle carries the colour. The brightest colour is the accent.
    const extreme = Math.abs((lumas[i] - minLuma) / Math.max(1e-6, maxLuma - minLuma) - 0.5) * 2;   // 0 mid, 1 at an end
    const sat = (62 + rng() * 30) * (1 - 0.35 * extreme * extreme);
    return colourAtLuma(wrap(baseHue + offset), Math.max(18, sat), lumas[i]);
  });
  return count === colours.length ? colours : adjustColorArrayLength(colours, count);
}

// How good a ready-made palette is for a gradient, by the same rules. Roughly -4 to +8.
export function scorePalette(colours: readonly ColorRGB[], gradient: string | null): number {
  if (colours.length === 0) return -9;
  const kind = gradientKind(gradient);
  const lumas = colours.map(luma);
  const spread = Math.max(...lumas) - Math.min(...lumas);
  let score = Math.min(spread, 0.7) * 6 - 1;                       // a wide brightness range is the main thing
  if (kind === 'dark-ground' || kind === 'particles') score += Math.min(...lumas) < 0.1 ? 2 : -2;
  if (kind === 'pattern') {
    // Neighbouring colours should be told apart.
    let distinct = 0;
    for (let i = 1; i < colours.length; i++) {
      const [h1, s1] = rgbToHsl(colours[i - 1].r, colours[i - 1].g, colours[i - 1].b);
      const [h2, s2] = rgbToHsl(colours[i].r, colours[i].g, colours[i].b);
      const dh = Math.min(Math.abs(h1 - h2), 360 - Math.abs(h1 - h2));
      if (dh > 25 || Math.abs(luma(colours[i]) - luma(colours[i - 1])) > 0.12 || Math.abs(s1 - s2) > 30) distinct++;
    }
    score += (distinct / Math.max(1, colours.length - 1)) * 2;
  }
  // Washed-out palettes (every colour nearly grey) read as dull.
  const meanSat = colours.reduce((a, c) => a + rgbToHsl(c.r, c.g, c.b)[1], 0) / colours.length;
  if (meanSat < 18) score -= 2;
  return score;
}

// Picks among ready-made palettes, preferring well-scored ones and ones not shown lately.
export function pickPalette<T extends { name: string; colors: string[] }>(
  pool: readonly T[], toColours: (p: T) => ColorRGB[], gradient: string | null, history: ShuffleHistory, rng: () => number = Math.random, temperature = 2,
  learned: (name: string) => number = () => 1,
): T {
  return pickWeighted(pool, p => history.weight('palette', p.name) * learned(p.name) * Math.exp(scorePalette(toColours(p), gradient) / temperature), rng);
}
