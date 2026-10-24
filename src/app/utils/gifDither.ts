// Ordered (Bayer) dithering for GIF frames. A GIF frame has at most 256 colours, so a smooth gradient that sweeps
// through many hues turns into visible bands. Nudging each pixel by a small, fixed, position-dependent amount
// before it is matched to the palette makes neighbouring pixels pick different palette colours in proportion, so
// the eye averages them back to the smooth colour. The pattern is fixed per position, so it does not shimmer
// between frames.

import { quantize } from 'gifenc';

const BAYER_8 = [
  0, 32, 8, 40, 2, 34, 10, 42,
  48, 16, 56, 24, 50, 18, 58, 26,
  12, 44, 4, 36, 14, 46, 6, 38,
  60, 28, 52, 20, 62, 30, 54, 22,
  3, 35, 11, 43, 1, 33, 9, 41,
  51, 19, 59, 27, 49, 17, 57, 25,
  15, 47, 7, 39, 13, 45, 5, 37,
  63, 31, 55, 23, 61, 29, 53, 21,
];

// Returns a copy of RGBA `data` with each colour channel offset by up to +/- amplitude/2 (alpha untouched).
export function ditherRGBA(data: Uint8ClampedArray, width: number, height: number, amplitude = 10): Uint8ClampedArray {
  const out = new Uint8ClampedArray(data);
  for (let y = 0; y < height; y++) {
    const row = (y & 7) * 8;
    for (let x = 0; x < width; x++) {
      const offset = ((BAYER_8[row + (x & 7)] + 0.5) / 64 - 0.5) * amplitude;
      const i = (y * width + x) * 4;
      out[i] = data[i] + offset;       // Uint8ClampedArray rounds and clamps
      out[i + 1] = data[i + 1] + offset;
      out[i + 2] = data[i + 2] + offset;
    }
  }
  return out;
}

// Maps RGBA pixels to the nearest palette entry. gifenc's applyPalette looks colours up through a 5-6-5 bit key, which
// is itself coarse enough to band a smooth gradient (32 levels of red and blue). This uses a 6-bit-per-channel key and
// finds the true nearest palette colour once per key, so the only banding left is the palette's own.
export function mapToPalette(rgba: Uint8ClampedArray, palette: number[][]): Uint8Array {
  const count = palette.length;
  const pr = new Int16Array(count), pg = new Int16Array(count), pb = new Int16Array(count);
  for (let i = 0; i < count; i++) { pr[i] = palette[i][0]; pg[i] = palette[i][1]; pb[i] = palette[i][2]; }
  const cache = new Int16Array(1 << 18).fill(-1);
  const out = new Uint8Array(rgba.length / 4);
  for (let p = 0, i = 0; p < out.length; p++, i += 4) {
    const r = rgba[i], g = rgba[i + 1], b = rgba[i + 2];
    const key = ((r >> 2) << 12) | ((g >> 2) << 6) | (b >> 2);
    let best = cache[key];
    if (best < 0) {
      let bestDist = Infinity; best = 0;
      for (let k = 0; k < count; k++) {
        const dr = pr[k] - r, dg = pg[k] - g, db = pb[k] - b;
        const d = dr * dr * 2 + dg * dg * 4 + db * db * 3;   // weighted toward green, as the eye is
        if (d < bestDist) { bestDist = d; best = k; if (d === 0) break; }
      }
      cache[key] = best;
    }
    out[p] = best;
  }
  return out;
}

// One GIF frame: a 256-colour palette for the frame, then each (dithered) pixel matched to it.
export function quantizeFrame(rgba: Uint8ClampedArray, width: number, height: number): { palette: number[][]; index: Uint8Array } {
  const palette = quantize(rgba, 256);
  return { palette, index: mapToPalette(ditherRGBA(rgba, width, height), palette) };
}
