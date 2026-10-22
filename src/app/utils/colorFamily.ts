import type { ColorRGB } from '../constants/gradientEffects';
import { hslToRgb, rgbToHsl } from './color';

// "Color family": the hue a palette is built around. Shuffle can be told to stay in it, so a
// run of shuffles (Auto Shuffle especially) feels like one mood instead of a slot machine.

// Palettes this grey have no meaningful hue; they fit any family.
const NEUTRAL_CHROMA = 0.10;

export interface Family { hue: number; neutral: boolean }

// Circular mean of the palette's hues, each weighted by how colorful (and how far from black or
// white) it is, so a near-black first color doesn't drag the answer around.
export function paletteFamily(colors: { r: number; g: number; b: number }[]): Family {
  let x = 0, y = 0, weight = 0;
  for (const c of colors) {
    const [h, s, l] = rgbToHsl(c.r, c.g, c.b);
    const w = (s / 100) * (1 - Math.abs(2 * (l / 100) - 1));
    x += Math.cos((h * Math.PI) / 180) * w;
    y += Math.sin((h * Math.PI) / 180) * w;
    weight += w;
  }
  const chroma = colors.length ? weight / colors.length : 0;
  if (chroma < NEUTRAL_CHROMA || (x === 0 && y === 0)) return { hue: 0, neutral: true };
  return { hue: ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360, neutral: false };
}

export const hueDistance = (a: number, b: number): number => {
  const d = Math.abs(((a - b) % 360 + 360) % 360);
  return d > 180 ? 360 - d : d;
};

// Does this palette sit in the family within `tolerance` degrees? A grey palette has no family, so it
// only fits when the anchor is itself neutral.
export function inFamily(colors: { r: number; g: number; b: number }[], anchor: Family, tolerance = 40): boolean {
  if (anchor.neutral) return true;
  const f = paletteFamily(colors);
  return !f.neutral && hueDistance(f.hue, anchor.hue) <= tolerance;
}

// A fresh palette of `n` colors in the family: hues fanned a little either side of the anchor,
// lightness climbing from dark to light (starting very dark for the dark-ground gradients).
export function generateFamilyPalette(anchor: Family, n: number, dark: boolean, rand: () => number = Math.random): ColorRGB[] {
  const base = anchor.neutral ? rand() * 360 : anchor.hue;
  const spread = 28;
  const count = Math.max(2, n);
  return Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1);
    const hue = (base + (t - 0.5) * 2 * spread + (rand() - 0.5) * 12 + 360) % 360;
    const sat = anchor.neutral ? 8 + rand() * 12 : 55 + rand() * 35 - (t > 0.85 ? 25 : 0);
    const lit = dark ? 4 + t * 78 : 18 + t * 66;
    return hslToRgb(hue, sat, lit);
  });
}
