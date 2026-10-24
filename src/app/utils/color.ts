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

// Interpolates between two palette colors by `t` (0-1) in OKLab, a perceptually uniform space: the midpoint between
// saturated colors stays vivid instead of the dim, grey one a straight sRGB lerp gives (blue to yellow through grey).
export function blendRgb(c1: ColorRGB, c2: ColorRGB, t: number): ColorRGB {
  const [L1, a1, b1] = rgbToOklab(c1.r, c1.g, c1.b);
  const [L2, a2, b2] = rgbToOklab(c2.r, c2.g, c2.b);
  return oklabToRgb(L1 + (L2 - L1) * t, a1 + (a2 - a1) * t, b1 + (b2 - b1) * t);
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
  colors: ColorRGB[], stops: number[] | null, bias: number, sharp: number, steps: number,
): ColorRGB[] {
  const seg: PaletteSegment = { i0: 0, f: 0 };
  const n = colors.length;
  const out: ColorRGB[] = [];
  for (let s = 0; s < steps; s++) {
    if (n === 0) break;
    paletteSegmentFor(steps === 1 ? 0 : s / (steps - 1), n, stops, bias, sharp, seg);
    out.push(n === 1 ? colors[0] : blendRgb(colors[seg.i0], colors[seg.i0 + 1], seg.f));
  }
  return out;
}

// Resamples a palette to `targetLength` colors: evenly picks when shrinking, interpolates when growing.
export function adjustColorArrayLength(colors: ColorRGB[], targetLength: number): ColorRGB[] {
  if (colors.length === targetLength) {
    return colors;
  }

  if (colors.length > targetLength) {
    // If we have more colors than needed, evenly sample them
    const step = colors.length / targetLength;
    return Array.from({ length: targetLength }, (_, i) => {
      const index = Math.floor(i * step);
      return colors[index];
    });
  }

  // If we need more colors, interpolate between existing ones
  const result: ColorRGB[] = [];
  const step = (colors.length - 1) / (targetLength - 1);

  for (let i = 0; i < targetLength; i++) {
    const position = i * step;
    const index = Math.floor(position);
    const fraction = position - index;

    if (index >= colors.length - 1) {
      result.push(colors[colors.length - 1]);
    } else {
      const color1 = colors[index];
      const color2 = colors[index + 1];
      result.push({
        r: Math.round(color1.r + (color2.r - color1.r) * fraction),
        g: Math.round(color1.g + (color2.g - color1.g) * fraction),
        b: Math.round(color1.b + (color2.b - color1.b) * fraction),
      });
    }
  }

  return result;
}
