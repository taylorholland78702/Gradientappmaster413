import { getScratchCanvas } from '../../utils/scratchCanvas';
import type { EffectCtx } from '../canvasDrawTypes';

// Where the zoom loop is, 0..1. Kept between draws (and advanced by real time, not by draw count) so the speed holds
// steady whatever the frame rate; one full loop takes two seconds at Speed 1.
let phase = 0;
let lastTime = 0;

// Droste-style echo: the frame is redrawn as a stack of inset copies of itself, each a fixed ratio smaller than the
// last and all shrinking toward one vanishing point, with hard stepped edges. Moving the phase slides every copy down
// to the size of the next one, so the corridor streams toward the vanishing point and loops without a jump.
export function applyNestedFrames(P: EffectCtx): void {
  const {
    ctx, canvas, displayWidth: W, displayHeight: H,
    nestedFramesCount, nestedFramesShrink, nestedFramesX, nestedFramesY, nestedFramesSpeed,
  } = P;
  if (canvas.width === 0 || canvas.height === 0 || W < 2 || H < 2) return;

  const now = performance.now();
  const dt = lastTime ? Math.min(0.05, (now - lastTime) / 1000) : 0;
  lastTime = now;
  phase = (phase + dt * 0.5 * Math.max(0, nestedFramesSpeed ?? 0.5)) % 1;

  const count = Math.max(1, Math.min(16, Math.round(nestedFramesCount ?? 7)));
  const shrink = Math.max(0.3, Math.min(0.97, nestedFramesShrink ?? 0.82));
  const vx = (Math.max(0, Math.min(100, nestedFramesX ?? 50)) / 100) * W;
  const vy = (Math.max(0, Math.min(100, nestedFramesY ?? 50)) / 100) * H;

  // The copies are cut from a snapshot, so each one shows the original frame rather than the copies already drawn.
  const src = getScratchCanvas('nestedFramesSrc', W, H);
  const sctx = src.getContext('2d')!;
  sctx.clearRect(0, 0, W, H);
  sctx.drawImage(canvas, 0, 0, W, H);

  for (let i = 0; i <= count; i++) {
    const s = Math.pow(shrink, i + 1 - phase);
    const w = W * s, h = H * s;
    if (w < 1 || h < 1) break;
    ctx.drawImage(src, 0, 0, W, H, Math.round(vx * (1 - s)), Math.round(vy * (1 - s)), Math.round(w), Math.round(h));
  }
}
