// Pure Oil Paint pixel math, shared between the main-thread fallback
// (applyOilPaint.ts) and the Worker (oilPaintWorker.ts) — the classic
// "mode filter" oil-painting look: each pixel becomes the average color of
// whichever narrow intensity band is most common in its neighborhood,
// rather than a blur (which would average every band together). That's
// what produces clumpy, edge-preserving daubs instead of a soft smear.
// centerOffsetX/Y: a slow, caller-driven drift of the neighborhood-scan
// window relative to the output pixel — the daubs keep migrating rather
// than sitting fixed the instant they're computed. Purely cosmetic, so
// defaults to 0 (no drift) for any caller that doesn't pass it.
export function oilPaintPixels(data: Uint8ClampedArray, displayWidth: number, displayHeight: number, radius: number, levels: number, centerOffsetX = 0, centerOffsetY = 0): void {
  const r = Math.max(1, Math.round(radius));
  const ox = Math.round(centerOffsetX);
  const oy = Math.round(centerOffsetY);
  const lv = Math.max(4, Math.round(levels));
  const w = displayWidth, h = displayHeight;
  // Read from a snapshot of the source pixels so a pixel's own already-
  // painted output never leaks into a neighboring pixel's neighborhood scan.
  const src = new Uint8ClampedArray(data);

  const intensityCount = new Int32Array(lv);
  const sumR = new Int32Array(lv);
  const sumG = new Int32Array(lv);
  const sumB = new Int32Array(lv);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      intensityCount.fill(0);
      sumR.fill(0);
      sumG.fill(0);
      sumB.fill(0);

      for (let ny = y - r + oy; ny <= y + r + oy; ny++) {
        const cy = ny < 0 ? 0 : ny >= h ? h - 1 : ny;
        for (let nx = x - r + ox; nx <= x + r + ox; nx++) {
          const cx = nx < 0 ? 0 : nx >= w ? w - 1 : nx;
          const si = (cy * w + cx) * 4;
          const rr = src[si], gg = src[si + 1], bb = src[si + 2];
          let bucket = Math.floor(((rr + gg + bb) / 3 / 256) * lv);
          if (bucket >= lv) bucket = lv - 1;
          intensityCount[bucket]++;
          sumR[bucket] += rr;
          sumG[bucket] += gg;
          sumB[bucket] += bb;
        }
      }

      let maxBucket = 0, maxCount = 0;
      for (let b = 0; b < lv; b++) {
        if (intensityCount[b] > maxCount) { maxCount = intensityCount[b]; maxBucket = b; }
      }

      const di = (y * w + x) * 4;
      data[di] = sumR[maxBucket] / maxCount;
      data[di + 1] = sumG[maxBucket] / maxCount;
      data[di + 2] = sumB[maxBucket] / maxCount;
      // Alpha (data[di+3]) is left untouched — same as src.
    }
  }
}
