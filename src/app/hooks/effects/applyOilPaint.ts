import { oilPaintPixels } from './oilPaintPixels';
import { getDownscaleWorkingSize, captureDownscaledSource } from '../../utils/downscaleCapture';

// Oil Paint's neighborhood scan is O(width * height * radius^2) — see
// downscaleCapture.ts for why this cap exists.
const MAX_DIM = 420;

// Module-level clock — see applyAuraGlow.ts's agTime: purely cosmetic,
// no undo/redo or Display-mode value depends on it.
let oilPaintTime = 0;

export function applyOilPaint(P: any): void { // eslint-disable-line @typescript-eslint/no-explicit-any
  const { displayWidth, displayHeight, oilPaintRadius, oilPaintLevels, canvas, putLowResImageData } = P;
  if (canvas.width === 0 || canvas.height === 0) return;
  const { w, h } = getDownscaleWorkingSize(displayWidth, displayHeight, MAX_DIM);
  const src = captureDownscaledSource('oilPaint', canvas, w, h);
  // Slow circular drift of the neighborhood-scan window — the daubs keep
  // migrating instead of sitting fixed the instant they're computed.
  oilPaintTime += 0.01;
  const offX = Math.sin(oilPaintTime) * Math.max(1, oilPaintRadius * 0.4);
  const offY = Math.cos(oilPaintTime * 0.7) * Math.max(1, oilPaintRadius * 0.4);
  oilPaintPixels(src.data, w, h, oilPaintRadius, oilPaintLevels, offX, offY);
  putLowResImageData(src);
}
