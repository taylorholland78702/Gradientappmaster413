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
export function ditherPixels(data: Uint8ClampedArray, displayWidth: number, displayHeight: number, ditherType: string, ditherLevels: number, ditherScale = 1, ditherPhase = 0): void {
  const bayer = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  const lv = Math.max(2, ditherLevels);
  const st = 255 / (lv - 1);
  // Block size in screen pixels each bayer matrix cell covers — 1 is the
  // original per-pixel sampling, higher values read as a chunkier,
  // lower-fidelity dither pattern.
  const scale = Math.max(1, Math.round(ditherScale));
  // Bayer only (Floyd-Steinberg's error diffusion has a genuine sequential
  // data dependency on the source pixels — there's no clean phase to
  // offset without changing what the algorithm means): marching the 4x4
  // matrix diagonally makes the ordered pattern visibly crawl instead of
  // sitting fixed over a static source.
  const phaseOffset = Math.floor(ditherPhase);

  if (ditherType === 'bayer') {
    for (let y = 0; y < displayHeight; y++) {
      for (let x = 0; x < displayWidth; x++) {
        const i = (y * displayWidth + x) * 4;
        const by = (Math.floor(y / scale) + phaseOffset) % 4;
        const bx = (Math.floor(x / scale) + phaseOffset) % 4;
        const t = (bayer[by][bx] / 16) * st;
        for (let c = 0; c < 3; c++) {
          const v = Math.round(data[i + c] / st) * st;
          data[i + c] = data[i + c] + t > v + st / 2 ? Math.min(255, v + st) : v;
        }
      }
    }
  } else if (scale === 1) {
    floydSteinberg(data, displayWidth, displayHeight, st);
  } else {
    // Chunkier error diffusion: dither a picture `scale` times smaller (each block averaged), then blow it back up.
    const sw = Math.ceil(displayWidth / scale), sh = Math.ceil(displayHeight / scale);
    const small = new Uint8ClampedArray(sw * sh * 4);
    for (let by = 0; by < sh; by++) {
      for (let bx = 0; bx < sw; bx++) {
        let r = 0, g = 0, b = 0, n = 0;
        for (let y = by * scale; y < Math.min(displayHeight, (by + 1) * scale); y++) {
          for (let x = bx * scale; x < Math.min(displayWidth, (bx + 1) * scale); x++) {
            const i = (y * displayWidth + x) * 4;
            r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
          }
        }
        const o = (by * sw + bx) * 4;
        small[o] = r / n; small[o + 1] = g / n; small[o + 2] = b / n; small[o + 3] = 255;
      }
    }
    floydSteinberg(small, sw, sh, st);
    for (let y = 0; y < displayHeight; y++) {
      for (let x = 0; x < displayWidth; x++) {
        const i = (y * displayWidth + x) * 4;
        const o = ((Math.floor(y / scale)) * sw + Math.floor(x / scale)) * 4;
        data[i] = small[o]; data[i + 1] = small[o + 1]; data[i + 2] = small[o + 2];
      }
    }
  }
}

// Floyd-Steinberg error diffusion in place (RGB; alpha untouched).
function floydSteinberg(data: Uint8ClampedArray, width: number, height: number, st: number): void {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        const old = data[i + c];
        const nv = Math.round(old / st) * st;
        data[i + c] = nv;
        const e = old - nv;
        if (x + 1 < width) data[i + 4 + c] += e * .44;
        if (y + 1 < height) {
          if (x > 0) data[i + width * 4 - 4 + c] += e * .19;
          data[i + width * 4 + c] += e * .31;
          if (x + 1 < width) data[i + width * 4 + 4 + c] += e * .06;
        }
      }
    }
  }
}
