import type { ColorRGB } from '../constants/gradientEffects';

// How a palette reads, in three numbers, so a marking session can say which kinds of palette were kept: how light it is,
// how vivid, and how far apart its lightest and darkest colours are.
export interface PaletteStats { lightness: number; saturation: number; contrast: number }

function hsl({ r, g, b }: ColorRGB): { l: number; s: number } {
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B), l = (max + min) / 2, d = max - min;
  return { l, s: d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1)) };
}

export function paletteStats(colors: readonly ColorRGB[]): PaletteStats | null {
  if (colors.length === 0) return null;
  const all = colors.map(hsl);
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const ls = all.map(c => c.l);
  const round = (v: number) => +v.toFixed(3);
  return { lightness: round(mean(ls)), saturation: round(mean(all.map(c => c.s))), contrast: round(Math.max(...ls) - Math.min(...ls)) };
}

// Buckets for reading the results: dark / mid / light, muted / medium / vivid, flat / contrasty, slow / medium / fast.
export const lightnessBucket = (v: number) => (v < 0.35 ? 'dark palette' : v < 0.6 ? 'mid palette' : 'light palette');
export const saturationBucket = (v: number) => (v < 0.35 ? 'muted palette' : v < 0.7 ? 'medium palette' : 'vivid palette');
export const contrastBucket = (v: number) => (v < 0.35 ? 'low-contrast palette' : 'high-contrast palette');
export const speedBucket = (v: number) => (v <= 1 ? 'slow (1 or less)' : v <= 4 ? 'medium (2-4)' : 'fast (5+)');
