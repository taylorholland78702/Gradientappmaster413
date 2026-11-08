import { getScratchCanvas } from '../../utils/scratchCanvas';
import type { EffectCtx } from '../canvasDrawTypes';

type Grade = { gain: [number, number, number]; lift: number; contrast: number; saturation: number };

// A colour response per stock, applied before the shoulder and grain: gain tints, lift raises the blacks, contrast
// bends the curve around mid grey and saturation scales the colour.
const GRADES: Record<string, Grade> = {
  warm: { gain: [1.07, 1.0, 0.9], lift: 6, contrast: 1.05, saturation: 1.05 },
  cool: { gain: [0.92, 1.0, 1.08], lift: 4, contrast: 1.05, saturation: 0.95 },
  faded: { gain: [1.0, 1.02, 0.98], lift: 26, contrast: 0.82, saturation: 0.8 },
  punchy: { gain: [1.02, 1.0, 1.0], lift: 0, contrast: 1.3, saturation: 1.25 },
};

const clamp01 = (v: number | undefined, d: number): number => Math.max(0, Math.min(1, v ?? d));

// Film print emulation: a stock's colour response, a soft highlight shoulder (bright areas roll off instead of
// clipping), luminance-weighted grain that is strongest in the midtones, and halation, the red-orange glow that spreads
// around bright edges because light scatters back through the film base.
export function applyFilmStock(P: EffectCtx): void {
  const { ctx, canvas, getDisplayImageData, putScaledImageData, displayWidth: W, displayHeight: H, filmStockLook, filmStockHalation, filmStockGrain, filmStockRoll } = P;
  const img = getDisplayImageData();
  const d = img.data;
  const g = GRADES[filmStockLook ?? 'warm'] ?? GRADES.warm;
  const roll = clamp01(filmStockRoll, 0.5), grain = clamp01(filmStockGrain, 0.3), halation = clamp01(filmStockHalation, 0.4);
  const knee = 0.62;
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i], gr = d[i + 1], b = d[i + 2];
    const luma = 0.299 * r + 0.587 * gr + 0.114 * b;
    r = luma + (r - luma) * g.saturation; gr = luma + (gr - luma) * g.saturation; b = luma + (b - luma) * g.saturation;
    r = (r * g.gain[0] - 128) * g.contrast + 128 + g.lift;
    gr = (gr * g.gain[1] - 128) * g.contrast + 128 + g.lift;
    b = (b * g.gain[2] - 128) * g.contrast + 128 + g.lift;
    // Highlight shoulder.
    r = shoulder(r / 255, knee, roll) * 255; gr = shoulder(gr / 255, knee, roll) * 255; b = shoulder(b / 255, knee, roll) * 255;
    if (grain > 0) {
      const l = (0.299 * r + 0.587 * gr + 0.114 * b) / 255;
      const n = (Math.random() - 0.5) * grain * 70 * (1 - Math.abs(l - 0.5) * 1.2);
      r += n; gr += n; b += n;
    }
    d[i] = r; d[i + 1] = gr; d[i + 2] = b;
  }
  putScaledImageData(img);
  if (halation > 0) {
    const glow = getScratchCanvas('filmStockGlow', W, H);
    const gctx = glow.getContext('2d')!;
    gctx.clearRect(0, 0, W, H);
    gctx.filter = `blur(${Math.round(5 + halation * 14)}px) brightness(1.5) contrast(2.2) sepia(1) saturate(5) hue-rotate(-28deg)`;
    gctx.drawImage(canvas, 0, 0, W, H);
    gctx.filter = 'none';
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = halation * 0.65;
    ctx.drawImage(glow, 0, 0, W, H);
    ctx.restore();
  }
}

// Above the knee a value is compressed toward 1 instead of clipped; roll sets how soft that compression is.
function shoulder(x: number, knee: number, roll: number): number {
  if (x <= knee) return x < 0 ? 0 : x;
  const over = (x - knee) / (1 - knee);
  return knee + (1 - knee) * (over / (1 + roll * 2 * over)) * (1 + roll * 2);
}
