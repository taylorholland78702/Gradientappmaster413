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

  // Each source pixel's intensity bucket never changes, so work it out once.
  const bucketOf = new Uint8Array(w * h);
  for (let i = 0, p = 0; i < bucketOf.length; i++, p += 4) {
    let bucket = Math.floor(((src[p] + src[p + 1] + src[p + 2]) / 3 / 256) * lv);
    if (bucket >= lv) bucket = lv - 1;
    bucketOf[i] = bucket;
  }

  const intensityCount = new Int32Array(lv);
  const sumR = new Int32Array(lv);
  const sumG = new Int32Array(lv);
  const sumB = new Int32Array(lv);

  // Adds (sign 1) or removes (sign -1) one column of the window: the pixels at column cx for rows y-r+oy..y+r+oy,
  // edges clamped exactly as the full scan clamps them.
  const column = (cx: number, y: number, sign: 1 | -1) => {
    cx = cx < 0 ? 0 : cx >= w ? w - 1 : cx;
    for (let ny = y - r + oy; ny <= y + r + oy; ny++) {
      const cy = ny < 0 ? 0 : ny >= h ? h - 1 : ny;
      const pi = cy * w + cx;
      const si = pi * 4;
      const b = bucketOf[pi];
      intensityCount[b] += sign;
      sumR[b] += sign * src[si];
      sumG[b] += sign * src[si + 1];
      sumB[b] += sign * src[si + 2];
    }
  };

  // Slide the window along each row: moving one pixel right drops its leftmost column and adds a new rightmost one,
  // so the cost per pixel is O(radius) instead of O(radius^2). The counts are identical to rescanning the window.
  for (let y = 0; y < h; y++) {
    intensityCount.fill(0);
    sumR.fill(0);
    sumG.fill(0);
    sumB.fill(0);
    for (let nx = -r + ox; nx <= r + ox; nx++) column(nx, y, 1);

    for (let x = 0; x < w; x++) {
      if (x > 0) {
        column(x - 1 - r + ox, y, -1);
        column(x + r + ox, y, 1);
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
