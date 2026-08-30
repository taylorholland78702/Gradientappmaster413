import { getScratchImageData } from '../../utils/scratchCanvas';

// Deterministic pseudo-random in [0,1) from two integers — same hash shape
// used by applyPhoto.ts's shatter tiles. No time input, so the bleed
// pattern and paper grain are stable frame-to-frame rather than swimming
// like Liquid's animated warp — a painting that's already dry, not one
// still moving.
function hash2(a: number, b: number): number {
  let h = a * 374761393 + b * 668265263;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967295;
}

export function applyWatercolor(P: any): void { // eslint-disable-line @typescript-eslint/no-explicit-any
  const { displayWidth, displayHeight, watercolorBleed, watercolorGrain, ctx, canvas, putScaledImageData, getDisplayImageData } = P;
  if (canvas.width === 0 || canvas.height === 0) return;

  const w = displayWidth, h = displayHeight;
  const src = getDisplayImageData();
  const s = src.data;
  const out = getScratchImageData('watercolor', ctx, w, h);
  const o = out.data;

  for (let y = 0; y < h; y++) {
    const yu = y > 0 ? y - 1 : 0;
    const yd = y < h - 1 ? y + 1 : h - 1;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;

      // Cheap edge magnitude from horizontal/vertical luminance deltas
      // (4-neighbor, not a full Sobel kernel) — pigment bleeds further
      // right at a color boundary and barely moves in a flat wash.
      const xl = x > 0 ? x - 1 : 0;
      const xr = x < w - 1 ? x + 1 : w - 1;
      const iL = (y * w + xl) * 4, iR = (y * w + xr) * 4;
      const iU = (yu * w + x) * 4, iD = (yd * w + x) * 4;
      const lL = s[iL] * 0.299 + s[iL + 1] * 0.587 + s[iL + 2] * 0.114;
      const lR = s[iR] * 0.299 + s[iR + 1] * 0.587 + s[iR + 2] * 0.114;
      const lU = s[iU] * 0.299 + s[iU + 1] * 0.587 + s[iU + 2] * 0.114;
      const lD = s[iD] * 0.299 + s[iD + 1] * 0.587 + s[iD + 2] * 0.114;
      const edge = Math.min(1, (Math.abs(lR - lL) + Math.abs(lD - lU)) / 2 / 180);

      const angle = hash2(x, y) * Math.PI * 2;
      const jitter = 0.5 + hash2(x + 4096, y + 4096) * 0.5;
      const mag = watercolorBleed * (0.25 + edge * 2.5) * jitter;
      const sx = Math.max(0, Math.min(w - 1, Math.round(x + Math.cos(angle) * mag)));
      const sy = Math.max(0, Math.min(h - 1, Math.round(y + Math.sin(angle) * mag)));
      const si = (sy * w + sx) * 4;

      // Paper grain — coarse (2px) so it reads as fibrous paper texture
      // rather than pixel-level static.
      const paperN = hash2(x >> 1, y >> 1);
      const paperMul = 1 - watercolorGrain * 0.18 + paperN * watercolorGrain * 0.32;

      o[i] = s[si] * paperMul;
      o[i + 1] = s[si + 1] * paperMul;
      o[i + 2] = s[si + 2] * paperMul;
      o[i + 3] = 255;
    }
  }

  putScaledImageData(out);
}
