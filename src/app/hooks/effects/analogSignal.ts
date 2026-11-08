// Composite-video colour bleed: colour (chroma) is carried at a lower bandwidth than brightness (luma), so on an analog
// signal the colour smears sideways, trailing to the right of the edge it belongs to, while brightness stays sharp.
// Each row is split into luma and chroma, the chroma is averaged over a window that trails the pixel, and the two are put back together.
export function smearChroma(d: Uint8ClampedArray, w: number, h: number, radius: number): void {
  const win = radius * 2 + 1;
  const lum = new Float32Array(w), cr = new Float32Array(w), cg = new Float32Array(w), cb = new Float32Array(w);
  for (let y = 0; y < h; y++) {
    const base = y * w * 4;
    for (let x = 0; x < w; x++) {
      const i = base + x * 4;
      const l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      lum[x] = l; cr[x] = d[i] - l; cg[x] = d[i + 1] - l; cb[x] = d[i + 2] - l;
    }
    let sr = 0, sg = 0, sb = 0;
    for (let k = -win + 1; k <= 0; k++) {
      const j = k < 0 ? 0 : k;
      sr += cr[j]; sg += cg[j]; sb += cb[j];
    }
    for (let x = 0; x < w; x++) {
      const i = base + x * 4;
      d[i] = lum[x] + sr / win; d[i + 1] = lum[x] + sg / win; d[i + 2] = lum[x] + sb / win;
      const add = x + 1 < w ? x + 1 : w - 1, drop = x - win + 1 < 0 ? 0 : x - win + 1;
      sr += cr[add] - cr[drop]; sg += cg[add] - cg[drop]; sb += cb[add] - cb[drop];
    }
  }
}
