import type { EffectCtx } from '../canvasDrawTypes';
import { makeClock } from './warpCommon';

const clock = makeClock();

const hash = (n: number): number => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// Rectangles of the frame jump sideways, and inside each one the red and blue channels are pulled apart so the edges
// fringe. The set of blocks is re-rolled several times a second (faster with Speed), like a bad digital signal.
export function applyGlitchBlocks(P: EffectCtx): void {
  const { getDisplayImageData, putScaledImageData, glitchBlocksCount, glitchBlocksShift, glitchBlocksSplit, glitchBlocksSpeed } = P;
  const img = getDisplayImageData();
  const w = img.width, h = img.height;
  if (w < 8 || h < 8) return;
  const tick = Math.floor(clock(glitchBlocksSpeed ?? 1) * 6);
  const count = Math.max(1, Math.min(60, Math.round(glitchBlocksCount ?? 12)));
  const shift = (Math.max(0, glitchBlocksShift ?? 20) / 100) * w;
  const split = Math.max(0, Math.round(glitchBlocksSplit ?? 8));
  const d = img.data;
  const orig = new Uint8ClampedArray(d);
  const clampX = (x: number) => (x < 0 ? 0 : x > w - 1 ? w - 1 : x);

  for (let k = 0; k < count; k++) {
    const seed = tick * 31.7 + k * 4.3;
    const bw = Math.max(8, Math.floor((0.1 + hash(seed) * 0.35) * w));
    const bh = Math.max(2, Math.floor((0.02 + hash(seed + 1) * 0.1) * h));
    const bx = Math.floor(hash(seed + 2) * (w - bw)), by = Math.floor(hash(seed + 3) * (h - bh));
    const dx = Math.round((hash(seed + 4) * 2 - 1) * shift);
    for (let y = by; y < by + bh; y++) {
      const row = y * w;
      for (let x = bx; x < bx + bw; x++) {
        const o = (row + x) * 4;
        const sx = x - dx;
        d[o] = orig[(row + clampX(sx + split)) * 4];
        d[o + 1] = orig[(row + clampX(sx)) * 4 + 1];
        d[o + 2] = orig[(row + clampX(sx - split)) * 4 + 2];
      }
    }
  }
  putScaledImageData(img);
}
