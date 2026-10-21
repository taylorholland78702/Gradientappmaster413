import type { ColorRGB } from '../constants/gradientEffects';

// A small k-means over an image's pixels, returning k representative colors
// ordered dark to light (the order a palette ramp reads best in). Deterministic:
// seeds are spread evenly through the pixels sorted by luminance, so the same
// image always gives the same palette.
export function extractPalette(rgba: Uint8ClampedArray | number[], k: number, iterations = 12): ColorRGB[] {
  const pixels: [number, number, number][] = [];
  for (let i = 0; i + 3 < rgba.length; i += 4) {
    if (rgba[i + 3] < 128) continue;
    pixels.push([rgba[i], rgba[i + 1], rgba[i + 2]]);
  }
  if (pixels.length === 0 || k < 1) return [];
  const lum = (p: number[]) => 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2];
  const sorted = pixels.slice().sort((a, b) => lum(a) - lum(b));
  let centers = Array.from({ length: k }, (_, i) => sorted[Math.min(sorted.length - 1, Math.floor(((i + 0.5) / k) * sorted.length))].slice());

  for (let it = 0; it < iterations; it++) {
    const sums = centers.map(() => [0, 0, 0, 0]);
    for (const p of pixels) {
      let best = 0, bestD = Infinity;
      for (let c = 0; c < centers.length; c++) {
        const dr = p[0] - centers[c][0], dg = p[1] - centers[c][1], db = p[2] - centers[c][2];
        const d = dr * dr + dg * dg + db * db;
        if (d < bestD) { bestD = d; best = c; }
      }
      const s = sums[best];
      s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; s[3]++;
    }
    centers = centers.map((c, i) => (sums[i][3] ? [sums[i][0] / sums[i][3], sums[i][1] / sums[i][3], sums[i][2] / sums[i][3]] : c));
  }
  return centers
    .sort((a, b) => lum(a) - lum(b))
    .map(([r, g, b]) => ({ r: Math.round(r), g: Math.round(g), b: Math.round(b) }));
}
