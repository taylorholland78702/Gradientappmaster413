import { getScratchImageData } from '../../utils/scratchCanvas';

// Deterministic pseudo-random in [0,1) from two integers — same hash shape
// used by applyPhoto.ts's shatter tiles.
function hash2(a: number, b: number): number {
  let h = a * 374761393 + b * 668265263;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967295;
}

// Bilinear-interpolated value noise — unlike a raw per-pixel hash (which
// jumps randomly from one pixel to its neighbor and reads as static/grain),
// this varies smoothly across space, so regions tens of pixels wide drift
// together. That coherence is what makes the warp below read as flowing
// pigment instead of scrambled noise.
function valueNoise(x: number, y: number): number {
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const fx = x - x0, fy = y - y0;
  const v00 = hash2(x0, y0), v10 = hash2(x0 + 1, y0);
  const v01 = hash2(x0, y0 + 1), v11 = hash2(x0 + 1, y0 + 1);
  const vx0 = v00 + (v10 - v00) * fx;
  const vx1 = v01 + (v11 - v01) * fx;
  return vx0 + (vx1 - vx0) * fy;
}

// Working resolution cap — same reasoning as oilPaintDownscale.ts: the
// smear below samples several taps per pixel plus a handful of noise
// evaluations, cheap at the ~800px this was developed at but scales with
// real window size, so a large display could turn this from "one pass" to
// "visibly janky" without a bound. 640 keeps the wash texture's scale
// (which is defined in absolute pixels) looking consistent across screen
// sizes too, not just fast.
const MAX_DIM = 640;
let smallCanvas: HTMLCanvasElement | null = null;

function captureDownscaled(canvas: HTMLCanvasElement, w: number, h: number): ImageData {
  if (!smallCanvas) smallCanvas = document.createElement('canvas');
  if (smallCanvas.width !== w || smallCanvas.height !== h) {
    smallCanvas.width = w;
    smallCanvas.height = h;
  }
  const sctx = smallCanvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
  sctx.clearRect(0, 0, w, h);
  sctx.drawImage(canvas, 0, 0, w, h);
  return sctx.getImageData(0, 0, w, h);
}

export function applyWatercolor(P: any): void { // eslint-disable-line @typescript-eslint/no-explicit-any
  const { displayWidth, displayHeight, watercolorBleed, watercolorGrain, ctx, canvas, putLowResImageData } = P;
  if (canvas.width === 0 || canvas.height === 0) return;

  const longEdge = Math.max(displayWidth, displayHeight, 1);
  const scale = Math.min(1, MAX_DIM / longEdge);
  const w = Math.max(1, Math.round(displayWidth * scale));
  const h = Math.max(1, Math.round(displayHeight * scale));

  const src = captureDownscaled(canvas, w, h);
  const s = src.data;
  const out = getScratchImageData('watercolor', ctx, w, h);
  const o = out.data;

  // Warp field scale is in working-buffer pixels, so it stays proportional
  // to the (now capped) canvas rather than the real display size.
  const warpScale = 1 / 50;
  const warpMag = watercolorBleed * 4;
  const TAPS = 4;

  for (let y = 0; y < h; y++) {
    const yu = y > 0 ? y - 1 : 0;
    const yd = y < h - 1 ? y + 1 : h - 1;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;

      // Edge magnitude from horizontal/vertical luminance deltas — pigment
      // pools (darkens/saturates) right at a color boundary, same as a
      // real wash drying unevenly at its edge.
      const xl = x > 0 ? x - 1 : 0;
      const xr = x < w - 1 ? x + 1 : w - 1;
      const iL = (y * w + xl) * 4, iR = (y * w + xr) * 4;
      const iU = (yu * w + x) * 4, iD = (yd * w + x) * 4;
      const lL = s[iL] * 0.299 + s[iL + 1] * 0.587 + s[iL + 2] * 0.114;
      const lR = s[iR] * 0.299 + s[iR + 1] * 0.587 + s[iR + 2] * 0.114;
      const lU = s[iU] * 0.299 + s[iU + 1] * 0.587 + s[iU + 2] * 0.114;
      const lD = s[iD] * 0.299 + s[iD + 1] * 0.587 + s[iD + 2] * 0.114;
      const edge = Math.min(1, (Math.abs(lR - lL) + Math.abs(lD - lU)) / 2 / 140);

      // Coherent low-frequency warp direction — stronger near edges (that's
      // where a real wash actually moves) than in the middle of a flat fill.
      const nx = valueNoise(x * warpScale, y * warpScale) * 2 - 1;
      const ny = valueNoise(x * warpScale + 37.1, y * warpScale + 91.7) * 2 - 1;
      const mag = warpMag * (0.35 + edge * 1.8);
      const dx = nx * mag, dy = ny * mag;

      // Short directional smear from the source pixel out to its warped
      // position — several taps averaged, not one displaced sample, so the
      // boundary blends into a soft streak instead of a crisp displaced edge.
      let rAcc = 0, gAcc = 0, bAcc = 0;
      for (let t = 0; t < TAPS; t++) {
        const f = t / (TAPS - 1);
        const sx = Math.max(0, Math.min(w - 1, Math.round(x + dx * f)));
        const sy = Math.max(0, Math.min(h - 1, Math.round(y + dy * f)));
        const si = (sy * w + sx) * 4;
        rAcc += s[si]; gAcc += s[si + 1]; bAcc += s[si + 2];
      }
      let r = rAcc / TAPS, g = gAcc / TAPS, b = bAcc / TAPS;

      // Edge pooling — darken and lightly saturate toward the boundary,
      // the way concentrated pigment collects as a wash dries.
      const pool = 1 - edge * 0.35;
      const lum = r * 0.299 + g * 0.587 + b * 0.114;
      r = lum + (r - lum) * (1 + edge * 0.4);
      g = lum + (g - lum) * (1 + edge * 0.4);
      b = lum + (b - lum) * (1 + edge * 0.4);
      r *= pool; g *= pool; b *= pool;

      // Paper texture — a large soft blotch layer (cold-press paper's
      // uneven absorption) plus a much subtler fine fiber layer on top.
      const blotch = valueNoise(x * 0.12, y * 0.12);
      const fiber = hash2(x, y) - 0.5;
      const paperMul = (1 - watercolorGrain * 0.22 + blotch * watercolorGrain * 0.4) * (1 + fiber * watercolorGrain * 0.06);

      o[i] = r * paperMul;
      o[i + 1] = g * paperMul;
      o[i + 2] = b * paperMul;
      o[i + 3] = 255;
    }
  }

  putLowResImageData(out);
}
