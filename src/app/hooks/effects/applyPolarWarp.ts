import type { EffectCtx } from '../canvasDrawTypes';
import { makeClock, runWarp } from './warpCommon';

const clock = makeClock();

// Mirror-repeat: 0..1 up, 1..0 down, so tiling the picture never shows a seam where its edges meet.
const tri = (x: number): number => 1 - Math.abs(2 * (((x * 0.5) % 1 + 1) % 1) - 1);

// Re-maps the picture through polar coordinates. Tunnel wraps it around the point and tiles it down into the
// distance, so the picture streams into a wormhole; Unwrap does the reverse, bending a circle of the picture out
// into a flat band. Repeat sets how many times the picture is tiled around the point.
export function applyPolarWarp(P: EffectCtx): void {
  const { polarMode, polarRepeat, polarTwist, polarX, polarY, polarSpeed } = P;
  const phase = clock(polarSpeed ?? 0.5);
  const repeat = Math.max(1, Math.round(polarRepeat ?? 2));
  const twist = polarTwist ?? 0.3;
  const mode = polarMode ?? 'tunnel';
  runWarp(P, 'polar', (x, y, out, w, h) => {
    const cx = (Math.max(0, Math.min(100, polarX ?? 50)) / 100) * w;
    const cy = (Math.max(0, Math.min(100, polarY ?? 50)) / 100) * h;
    const maxR = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy));
    const dx = x - cx, dy = y - cy;
    if (mode === 'tunnel') {
      const r = Math.max(0.03, Math.hypot(dx, dy) / maxR);
      const a = Math.atan2(dy, dx) / (Math.PI * 2) + 0.5;
      const depth = 1 / r;
      const u = tri((a * repeat + twist * depth * 0.1 + phase * 0.05) * 2);
      const v = tri((depth * 0.12 + phase * 0.4) * 2);
      out[0] = u * (w - 1); out[1] = v * (h - 1);
      out[2] = Math.min(1, r * 3.2);
    } else {
      const a = (x / w) * Math.PI * 2 * repeat + phase * 0.5 + twist * (y / h) * 2;
      const rad = (y / h) * maxR;
      out[0] = cx + Math.cos(a) * rad; out[1] = cy + Math.sin(a) * rad;
    }
    return true;
  });
}
