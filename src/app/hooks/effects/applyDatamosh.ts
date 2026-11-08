import { getScratchCanvas } from '../../utils/scratchCanvas';
import type { EffectCtx } from '../canvasDrawTypes';

let lastTime = 0;
let time = 0;
let lastRefresh = 0;
let primed = false;
let lastW = 0;
let lastH = 0;

const hash = (n: number): number => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// Datamosh: broken video compression imitated block by block. Most blocks are not updated from the new frame; they keep
// their last picture and drift along a motion vector, so old content smears and melts across the new one. A share of
// blocks still refresh from the live frame each step, and every few seconds the whole frame refreshes at once (the
// keyframe) before the smearing starts again.
export function applyDatamosh(P: EffectCtx): void {
  const { ctx, canvas, displayWidth: W, displayHeight: H, moshBlock, moshSmear, moshDrift, moshRefresh } = P;
  if (canvas.width === 0 || canvas.height === 0 || W < 16 || H < 16) return;
  const now = performance.now();
  time += lastTime ? Math.min(0.05, (now - lastTime) / 1000) : 0;
  lastTime = now;

  const bs = Math.max(8, Math.min(96, Math.round(moshBlock ?? 24)));
  const smear = Math.max(0, Math.min(1, moshSmear ?? 0.7));
  const drift = Math.max(0, Math.min(1, moshDrift ?? 0.4));
  const every = Math.max(0.5, moshRefresh ?? 3);

  const fresh = getScratchCanvas('moshNew', W, H);
  fresh.getContext('2d')!.drawImage(canvas, 0, 0, W, H);
  const prev = getScratchCanvas('moshPrev', W, H);
  if (!primed || lastW !== W || lastH !== H || time - lastRefresh > every) {
    prev.getContext('2d')!.drawImage(fresh, 0, 0);
    primed = true; lastW = W; lastH = H; lastRefresh = time;
    return;
  }

  const out = getScratchCanvas('moshOut', W, H);
  const octx = out.getContext('2d')!;
  const step = Math.floor(time * 1.5);
  for (let by = 0; by * bs < H; by++) {
    for (let bx = 0; bx * bs < W; bx++) {
      const x = bx * bs, y = by * bs;
      const w = Math.min(bs, W - x), h = Math.min(bs, H - y);
      if (hash(bx * 13.1 + by * 7.7 + step * 3.3) < smear) {
        const vx = (hash(bx * 3.7 + by * 1.3 + step) - 0.5) * 2 * drift * bs * 1.6;
        const vy = (hash(bx * 1.9 + by * 5.1 + step + 9) - 0.5) * 2 * drift * bs * 1.6;
        octx.drawImage(prev, x + vx, y + vy, w, h, x, y, w, h);
      } else {
        octx.drawImage(fresh, x, y, w, h, x, y, w, h);
      }
    }
  }
  prev.getContext('2d')!.drawImage(out, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(out, 0, 0, W, H);
}
