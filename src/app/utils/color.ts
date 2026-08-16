import type { ColorRGB } from '../constants/gradientEffects';

export const hslToRgb = (h: number, s: number, l: number): ColorRGB => {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
};

export const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s * 100, l * 100];
};

export interface PaletteAdjust {
  hue: number; // degrees, -180..180, 0 = no shift
  saturation: number; // percent, 0..200, 100 = unchanged
  brightness: number; // -100..100, 0 = unchanged
  contrast: number; // -100..100, 0 = unchanged
}

// Global palette-level color grading — hue rotation, saturation scale,
// brightness offset, and contrast, applied to the whole gradientColors
// array. Mirrors rotateHue in useCanvasDraw.ts: a single transform composed
// at one choke point rather than a control threaded through every gradient's
// draw function. Early-returns the same array reference when every value is
// at its default so idle sliders cost nothing per frame.
export function adjustPalette(colors: ColorRGB[], adjust: PaletteAdjust): ColorRGB[] {
  const { hue } = adjust;
  const saturation = Math.max(30, adjust.saturation);
  // Clamped here (not just at the ColorTab slider) so any source of an
  // out-of-range value — a preset/undo-snapshot saved before the slider
  // bounds were narrowed, or the adjacent number-input box, which HTML
  // doesn't hard-clamp the way a range slider does — still can't reach the
  // combined brightness+contrast region where a varied palette clips to
  // solid black/white/gray (contrast scales the brightness offset too, so
  // the two compound well before either alone would).
  const brightness = Math.max(-25, Math.min(25, adjust.brightness));
  const contrast = Math.max(-25, Math.min(25, adjust.contrast));
  if (hue === 0 && adjust.saturation === 100 && adjust.brightness === 0 && adjust.contrast === 0) return colors;

  // Standard contrast formula (used by most photo-editing tools): scales
  // deviation from the midpoint (128) by a factor derived from the -255..255
  // contrast range — our slider is -100..100, so it's rescaled by 2.55 first.
  const c = contrast * 2.55;
  const contrastFactor = (259 * (c + 255)) / (255 * (259 - c));
  const brightnessOffset = brightness * 2.55;

  return colors.map(({ r, g, b }) => {
    const [h, s, l] = rgbToHsl(r, g, b);
    const adjustedHsl = hslToRgb((h + hue + 360) % 360, Math.max(0, Math.min(100, s * (saturation / 100))), l);
    const nr = contrastFactor * (adjustedHsl.r + brightnessOffset - 128) + 128;
    const ng = contrastFactor * (adjustedHsl.g + brightnessOffset - 128) + 128;
    const nb = contrastFactor * (adjustedHsl.b + brightnessOffset - 128) + 128;
    return {
      r: Math.round(Math.max(0, Math.min(255, nr))),
      g: Math.round(Math.max(0, Math.min(255, ng))),
      b: Math.round(Math.max(0, Math.min(255, nb))),
    };
  });
}
