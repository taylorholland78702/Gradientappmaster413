import type { ColorRGB } from '../constants/gradientEffects';

// For the manual swatch picker (native <input type="color">, which speaks
// hex) — the app's own color state is ColorRGB {r,g,b} everywhere else.
export const rgbToHex = ({ r, g, b }: ColorRGB): string =>
  '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');

export const hexToRgb = (hex: string): ColorRGB => {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

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

// How a gradient interpolates between two adjacent palette colors. 'srgb' is
// the plain per-channel lerp every gradient used before this setting existed
// (and stays the default, so existing looks and presets are unchanged).
// 'oklab' blends in a perceptually uniform space, which avoids the dim, grey
// midpoints a straight sRGB lerp produces between saturated colors (blue →
// yellow passing through grey). 'oklch' does the same but travels around the
// hue wheel instead of cutting across it, so transitions stay vivid.
export type ColorBlend = 'srgb' | 'linear' | 'oklab' | 'oklch';
export const COLOR_BLEND_MODES: ColorBlend[] = ['srgb', 'linear', 'oklab', 'oklch'];

// Set once per frame from the draw params (useCanvasDraw) rather than threaded
// through every gradient's draw function — ~15 interpolation sites across the
// CPU and WebGL paths all need the same answer, and only one gradient is ever
// drawing at a time.
let activeColorBlend: ColorBlend = 'srgb';
export const setActiveColorBlend = (mode: ColorBlend | undefined) => { activeColorBlend = mode ?? 'srgb'; };
export const getActiveColorBlend = (): ColorBlend => activeColorBlend;
// Matches `uBlendMode` in the GLSL (glShared's blendColorsGLSL).
export const colorBlendIndex = (mode: ColorBlend): number => (mode === 'oklab' ? 1 : mode === 'oklch' ? 2 : mode === 'linear' ? 3 : 0);

const srgbToLinear = (v: number): number => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};
const linearToSrgb = (v: number): number => {
  const c = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, c * 255));
};

type Lab = [number, number, number];

// Björn Ottosson's OKLab: https://bottosson.github.io/posts/oklab/
function rgbToOklab(r: number, g: number, b: number): Lab {
  const lr = srgbToLinear(r), lg = srgbToLinear(g), lb = srgbToLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabToRgb(L: number, a: number, b: number): ColorRGB {
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);
  return {
    r: linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  };
}

// Below this chroma a color is effectively grey and its hue angle is noise —
// borrow the other endpoint's hue instead so grey → color doesn't swing
// through the whole wheel.
const ACHROMATIC_CHROMA = 0.004;

// Interpolates between two palette colors by `t` (0-1) in the given space
// (defaults to the frame's active mode). The 'srgb' path is bit-for-bit the
// lerp the call sites used to inline, so switching the default is a no-op.
export function blendRgb(c1: ColorRGB, c2: ColorRGB, t: number, mode: ColorBlend = activeColorBlend): ColorRGB {
  if (mode === 'srgb') {
    return { r: c1.r + (c2.r - c1.r) * t, g: c1.g + (c2.g - c1.g) * t, b: c1.b + (c2.b - c1.b) * t };
  }
  if (mode === 'linear') {
    // Light-accurate mixing: average in linear light, not in the gamma-encoded values.
    const mix = (a: number, b: number) => linearToSrgb(srgbToLinear(a) + (srgbToLinear(b) - srgbToLinear(a)) * t);
    return { r: mix(c1.r, c2.r), g: mix(c1.g, c2.g), b: mix(c1.b, c2.b) };
  }
  const [L1, a1, b1] = rgbToOklab(c1.r, c1.g, c1.b);
  const [L2, a2, b2] = rgbToOklab(c2.r, c2.g, c2.b);
  if (mode === 'oklab') {
    return oklabToRgb(L1 + (L2 - L1) * t, a1 + (a2 - a1) * t, b1 + (b2 - b1) * t);
  }
  const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2);
  let h1 = Math.atan2(b1, a1), h2 = Math.atan2(b2, a2);
  if (C1 < ACHROMATIC_CHROMA) h1 = h2;
  else if (C2 < ACHROMATIC_CHROMA) h2 = h1;
  let dh = h2 - h1;
  if (dh > Math.PI) dh -= 2 * Math.PI;
  else if (dh < -Math.PI) dh += 2 * Math.PI;
  const L = L1 + (L2 - L1) * t;
  const C = C1 + (C2 - C1) * t;
  const h = h1 + dh * t;
  return oklabToRgb(L, C * Math.cos(h), C * Math.sin(h));
}

// Treble-driven hue rotation applied to a palette color when audio reactivity
// is on — shared by the canvas-gradient path (addGradientStops) and the
// WebGL Radial port, so both react to treble identically.
export function shiftHueByTreble(color: ColorRGB, trebleLevel: number): ColorRGB {
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));

  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }

  h = (h + trebleLevel / 360) % 1;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let newR, newG, newB;
  if (s === 0) {
    newR = newG = newB = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    newR = hue2rgb(p, q, h + 1 / 3);
    newG = hue2rgb(p, q, h);
    newB = hue2rgb(p, q, h - 1 / 3);
  }

  return { r: Math.round(newR * 255), g: Math.round(newG * 255), b: Math.round(newB * 255) };
}

// ---------------------------------------------------------------------------
// Palette mapping: stop positions, Bias, Sharpness
//
// Every gradient samples its palette as "t in 0..1 -> color". By default the N
// palette colors sit at evenly spaced positions and neighbors blend linearly.
// Three global controls reshape that mapping without touching any gradient:
//   stops — where each color sits along 0..1 (null / wrong length = even)
//   bias  — slides the midpoint; 0.5 is neutral, higher gives more of the
//           palette's later colors (a power curve on t)
//   sharp — 0 is the plain linear blend between neighbors; toward 1 the
//           blend collapses into a narrow smoothstep (hard bands)
// All defaults reproduce the pre-existing mapping exactly. The same math is
// duplicated in GLSL (paletteLookup in glShared.ts's BLEND_COLORS_GLSL) and
// they must stay in step.
// ---------------------------------------------------------------------------
export const DEFAULT_PALETTE_BIAS = 0.5;
export const DEFAULT_PALETTE_SHARP = 0;
// bias 0.5 -> gamma 1 (neutral); 1 -> ~0.30 (raises t, favors late colors);
// 0 -> ~3.3 (lowers t, favors early colors).
export const biasToGamma = (bias: number): number => Math.exp((0.5 - bias) * 2.4);

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

// Width of the smoothstep that replaces the linear blend at sharp = 1.
const SHARP_MIN_HALF_WIDTH = 0.03;
export function sharpenFraction(f: number, sharp: number): number {
  if (sharp <= 0) return f;
  const half = 0.5 - (0.5 - SHARP_MIN_HALF_WIDTH) * sharp;
  const e0 = 0.5 - half, e1 = 0.5 + half;
  const x = clamp01((f - e0) / (e1 - e0));
  const smooth = x * x * (3 - 2 * x);
  return f + (smooth - f) * sharp;
}

export const evenStops = (n: number): number[] =>
  n <= 1 ? [0] : Array.from({ length: n }, (_, i) => i / (n - 1));

export interface PaletteSegment { i0: number; f: number }

// Pure core: which pair of palette colors `t` falls between (i0 and i0 + 1) and
// how far along that pair (f, 0..1). Writes into `out` so the CPU hot loops
// (per-pixel) allocate nothing.
export function paletteSegmentFor(
  t: number, n: number, stops: number[] | null, bias: number, sharp: number, out: PaletteSegment,
): PaletteSegment {
  if (n <= 1) { out.i0 = 0; out.f = 0; return out; }
  let tt = clamp01(t);
  if (bias !== DEFAULT_PALETTE_BIAS) tt = Math.pow(tt, biasToGamma(bias));
  let i0: number, f: number;
  if (stops && stops.length === n) {
    i0 = 0;
    for (let k = 1; k < n - 1; k++) {
      if (tt >= stops[k]) i0 = k; else break;
    }
    const a = stops[i0], b = stops[i0 + 1];
    f = b > a ? clamp01((tt - a) / (b - a)) : (tt >= b ? 1 : 0);
  } else {
    const pos = tt * (n - 1);
    i0 = Math.min(Math.floor(pos), n - 2);
    f = pos - i0;
  }
  out.i0 = i0;
  out.f = sharpenFraction(f, sharp);
  return out;
}

// Set once per frame from the draw params, like the Blend mode above — every
// per-pixel palette lookup (CPU loops, GL uniform upload) reads it.
let activeStops: number[] | null = null;
let activeBias = DEFAULT_PALETTE_BIAS;
let activeSharp = DEFAULT_PALETTE_SHARP;
export function setActivePaletteMap(stops: number[] | null | undefined, bias: number | undefined, sharp: number | undefined) {
  activeStops = stops ?? null;
  activeBias = bias ?? DEFAULT_PALETTE_BIAS;
  activeSharp = sharp ?? DEFAULT_PALETTE_SHARP;
}
export const getActivePaletteMap = () => ({ stops: activeStops, bias: activeBias, sharp: activeSharp });

const sharedSegment: PaletteSegment = { i0: 0, f: 0 };
// Allocation-free lookup against the frame's active mapping. The returned
// object is reused — read i0/f immediately.
export function paletteSegment(t: number, n: number): PaletteSegment {
  return paletteSegmentFor(t, n, activeStops, activeBias, activeSharp, sharedSegment);
}

// Samples the palette into `steps` colors for drawing a preview strip; takes
// every input explicitly (no module state) so a UI can preview settings that
// aren't the live ones.
export function samplePalette(
  colors: ColorRGB[], stops: number[] | null, bias: number, sharp: number, blend: ColorBlend, steps: number,
): ColorRGB[] {
  const seg: PaletteSegment = { i0: 0, f: 0 };
  const n = colors.length;
  const out: ColorRGB[] = [];
  for (let s = 0; s < steps; s++) {
    if (n === 0) break;
    paletteSegmentFor(steps === 1 ? 0 : s / (steps - 1), n, stops, bias, sharp, seg);
    out.push(n === 1 ? colors[0] : blendRgb(colors[seg.i0], colors[seg.i0 + 1], seg.f, blend));
  }
  return out;
}
