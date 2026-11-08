import { getScratchCanvas, getScratchImageData } from '../../utils/scratchCanvas';
import type { EffectCtx } from '../canvasDrawTypes';

// Frames are warped at a capped width and drawn back up, which reads the same for a smooth remap and keeps the
// per-pixel work flat however large the canvas is.
const WARP_MAX_WIDTH = 480;

// Says where each output pixel reads from: write the source position (in working-resolution pixels) to out[0], out[1]
// and a brightness multiplier to out[2] (starts at 1). Return false to leave the pixel as it is.
export type WarpMap = (x: number, y: number, out: number[], w: number, h: number) => boolean;

export function runWarp(P: EffectCtx, key: string, map: WarpMap): void {
  const { ctx, canvas, displayWidth: W, displayHeight: H } = P;
  if (canvas.width === 0 || canvas.height === 0 || W < 2 || H < 2) return;
  const scale = Math.min(1, WARP_MAX_WIDTH / W);
  const w = Math.max(2, Math.round(W * scale)), h = Math.max(2, Math.round(H * scale));

  const src = getScratchCanvas(key + 'Src', w, h);
  const sctx = src.getContext('2d', { willReadFrequently: true })!;
  sctx.clearRect(0, 0, w, h);
  sctx.drawImage(canvas, 0, 0, w, h);
  const input = sctx.getImageData(0, 0, w, h).data;
  const output = getScratchImageData(key + 'Out', sctx, w, h);
  const o = output.data;

  const at = [0, 0, 1];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      at[2] = 1;
      if (!map(x, y, at, w, h)) {
        o[i] = input[i]; o[i + 1] = input[i + 1]; o[i + 2] = input[i + 2]; o[i + 3] = input[i + 3];
        continue;
      }
      const sx = Math.max(0, Math.min(w - 1.001, at[0])), sy = Math.max(0, Math.min(h - 1.001, at[1]));
      const x0 = Math.floor(sx), y0 = Math.floor(sy);
      const fx = sx - x0, fy = sy - y0;
      const a = (y0 * w + x0) * 4, b = a + 4, c = a + w * 4, d = c + 4;
      const k = at[2];
      for (let ch = 0; ch < 3; ch++) {
        const top = input[a + ch] + (input[b + ch] - input[a + ch]) * fx;
        const bottom = input[c + ch] + (input[d + ch] - input[c + ch]) * fx;
        o[i + ch] = (top + (bottom - top) * fy) * k;
      }
      o[i + 3] = 255;
    }
  }

  const dst = getScratchCanvas(key + 'Dst', w, h);
  dst.getContext('2d')!.putImageData(output, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(dst, 0, 0, W, H);
}

// Real-time phase: advances by real seconds times a speed, so a Speed slider holds steady at any frame rate.
export function makeClock() {
  let phase = 0;
  let last = 0;
  return (speed: number): number => {
    const now = performance.now();
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    phase += dt * Math.max(0, speed);
    return phase;
  };
}
