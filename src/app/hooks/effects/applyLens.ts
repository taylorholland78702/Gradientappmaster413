import type { EffectCtx } from '../canvasDrawTypes';
import { makeClock, runWarp } from './warpCommon';

const clock = makeClock();

// A lens dropped on the picture at a movable point. Bulge magnifies the middle, Pinch squeezes it, Twirl swirls it
// (the swirl breathes with Speed), and Sphere wraps the picture onto a ball that rolls with Speed. Outside the lens
// radius the picture is untouched.
export function applyLens(P: EffectCtx): void {
  const { lensMode, lensStrength, lensRadius, lensX, lensY, lensSpeed } = P;
  const phase = clock(lensSpeed ?? 0.3);
  const s = Math.max(0, Math.min(1, lensStrength ?? 0.6));
  const mode = lensMode ?? 'bulge';
  runWarp(P, 'lens', (x, y, out, w, h) => {
    const cx = (Math.max(0, Math.min(100, lensX ?? 50)) / 100) * w;
    const cy = (Math.max(0, Math.min(100, lensY ?? 50)) / 100) * h;
    const R = Math.max(4, (Math.max(10, lensRadius ?? 60) / 100) * Math.min(w, h) * 0.5);
    const dx = x - cx, dy = y - cy;
    const r = Math.hypot(dx, dy) / R;
    if (r >= 1) return false;
    if (mode === 'bulge') {
      const f = 1 - s * (1 - r * r) * 0.85;
      out[0] = cx + dx * f; out[1] = cy + dy * f;
    } else if (mode === 'pinch') {
      const f = 1 + s * (1 - r * r) * 1.5;
      out[0] = cx + dx * f; out[1] = cy + dy * f;
    } else if (mode === 'twirl') {
      const ang = (s * 6 * (1 - r) * (1 - r)) * (1 + 0.4 * Math.sin(phase * 1.5));
      const co = Math.cos(ang), si = Math.sin(ang);
      out[0] = cx + dx * co - dy * si; out[1] = cy + dx * si + dy * co;
    } else {
      const nx = dx / R, ny = dy / R, z = Math.sqrt(Math.max(0, 1 - r * r));
      const lon = Math.atan2(nx, z) + phase;
      const lat = Math.asin(Math.max(-1, Math.min(1, ny)));
      const span = 4 * R;
      let u = ((lon / (Math.PI / 2)) * R) % span;
      if (u > span / 2) u -= span;
      if (u < -span / 2) u += span;
      out[0] = cx + u; out[1] = cy + (lat / (Math.PI / 2)) * R;
      out[2] = 1 - s * 0.6 * r * r;
    }
    return true;
  });
}
