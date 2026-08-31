import { oilPaintPixels } from './oilPaintPixels';
import { getDownscaleWorkingSize, captureDownscaledSource } from '../../utils/downscaleCapture';

// Oil Paint's neighborhood scan is O(width * height * radius^2) — see
// downscaleCapture.ts for why this cap exists.
const MAX_DIM = 420;

export function applyOilPaint(P: any): void { // eslint-disable-line @typescript-eslint/no-explicit-any
  const { displayWidth, displayHeight, oilPaintRadius, oilPaintLevels, canvas, putLowResImageData } = P;
  if (canvas.width === 0 || canvas.height === 0) return;
  const { w, h } = getDownscaleWorkingSize(displayWidth, displayHeight, MAX_DIM);
  const src = captureDownscaledSource('oilPaint', canvas, w, h);
  oilPaintPixels(src.data, w, h, oilPaintRadius, oilPaintLevels);
  putLowResImageData(src);
}
