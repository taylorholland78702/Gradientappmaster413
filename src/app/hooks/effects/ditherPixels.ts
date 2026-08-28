// Pure Dither pixel math, extracted from applyDither.ts — unlike
// halftoneDraw.ts/gridEffectDraw.ts this needs no Canvas 2D context at
// all (no arc/fill/gradient calls), just in-place array mutation, so it
// runs identically on the main thread or inside a Worker with zero
// context-shimming.
//
// The Floyd-Steinberg branch (ditherType !== 'bayer') has a genuine
// sequential data dependency — each pixel's rounding error diffuses into
// its right/below neighbors as the loop progresses — so this must run as
// a single ordered pass; that's true whichever thread it runs on, a
// Worker doesn't change it, it just moves the sequential work off the
// main thread.
export function ditherPixels(data: Uint8ClampedArray, displayWidth: number, displayHeight: number, ditherType: string, ditherLevels: number, ditherScale = 1): void {
  const bayer = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  const lv = Math.max(2, ditherLevels);
  const st = 255 / (lv - 1);
  // Block size in screen pixels each bayer matrix cell covers — 1 is the
  // original per-pixel sampling, higher values read as a chunkier,
  // lower-fidelity dither pattern.
  const scale = Math.max(1, Math.round(ditherScale));

  if (ditherType === 'bayer') {
    for (let y = 0; y < displayHeight; y++) {
      for (let x = 0; x < displayWidth; x++) {
        const i = (y * displayWidth + x) * 4;
        const by = Math.floor(y / scale) % 4;
        const bx = Math.floor(x / scale) % 4;
        const t = (bayer[by][bx] / 16) * st;
        for (let c = 0; c < 3; c++) {
          const v = Math.round(data[i + c] / st) * st;
          data[i + c] = data[i + c] + t > v + st / 2 ? Math.min(255, v + st) : v;
        }
      }
    }
  } else {
    for (let y = 0; y < displayHeight; y++) {
      for (let x = 0; x < displayWidth; x++) {
        const i = (y * displayWidth + x) * 4;
        for (let c = 0; c < 3; c++) {
          const old = data[i + c];
          const nv = Math.round(old / st) * st;
          data[i + c] = nv;
          const e = old - nv;
          if (x + 1 < displayWidth) data[i + 4 + c] += e * .44;
          if (y + 1 < displayHeight) {
            if (x > 0) data[i + displayWidth * 4 - 4 + c] += e * .19;
            data[i + displayWidth * 4 + c] += e * .31;
            if (x + 1 < displayWidth) data[i + displayWidth * 4 + 4 + c] += e * .06;
          }
        }
      }
    }
  }
}
