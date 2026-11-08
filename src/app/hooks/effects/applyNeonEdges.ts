import { getScratchCanvas } from '../../utils/scratchCanvas';
import type { EffectCtx } from '../canvasDrawTypes';

// Edge detection drawn as neon: a Sobel pass over the picture's brightness finds the outlines, each outline takes
// its colour from the picture (pushed to full brightness), and the rest of the frame dims toward black. A blurred
// copy of the lines added on top gives the glow.
export function applyNeonEdges(P: EffectCtx): void {
  const { ctx, getDisplayImageData, displayWidth: W, displayHeight: H, neonStrength, neonGlow, neonDim } = P;
  const img = getDisplayImageData();
  const w = img.width, h = img.height;
  if (w < 3 || h < 3) return;
  const d = img.data;
  const strength = Math.max(0.1, neonStrength ?? 2);
  const keep = 1 - Math.max(0, Math.min(1, neonDim ?? 0.85));

  const luma = new Float32Array(w * h);
  for (let p = 0, i = 0; p < luma.length; p++, i += 4) luma[p] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];

  const lines = getScratchCanvas('neonLines', w, h);
  const lctx = lines.getContext('2d')!;
  const edge = lctx.createImageData(w, h);
  const e = edge.data;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      const gx = luma[p - w + 1] + 2 * luma[p + 1] + luma[p + w + 1] - luma[p - w - 1] - 2 * luma[p - 1] - luma[p + w - 1];
      const gy = luma[p + w - 1] + 2 * luma[p + w] + luma[p + w + 1] - luma[p - w - 1] - 2 * luma[p - w] - luma[p - w + 1];
      const m = Math.min(1, (Math.hypot(gx, gy) / 255) * strength);
      const i = p * 4;
      const peak = Math.max(d[i], d[i + 1], d[i + 2], 1);
      e[i] = (d[i] / peak) * 255 * m; e[i + 1] = (d[i + 1] / peak) * 255 * m; e[i + 2] = (d[i + 2] / peak) * 255 * m; e[i + 3] = 255;
    }
  }
  lctx.putImageData(edge, 0, 0);

  for (let i = 0; i < d.length; i += 4) { d[i] *= keep; d[i + 1] *= keep; d[i + 2] *= keep; }
  const base = getScratchCanvas('neonBase', w, h);
  base.getContext('2d')!.putImageData(img, 0, 0);

  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(base, 0, 0, W, H);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const glow = Math.max(0, neonGlow ?? 6);
  if (glow > 0) {
    ctx.filter = `blur(${glow}px)`;
    ctx.drawImage(lines, 0, 0, W, H);
    ctx.filter = 'none';
  }
  ctx.drawImage(lines, 0, 0, W, H);
  ctx.restore();
}
