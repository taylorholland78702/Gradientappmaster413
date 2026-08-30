import { oilPaintPixels } from './oilPaintPixels';
import { getOilPaintWorkingSize, captureOilPaintSource } from './oilPaintDownscale';

export function applyOilPaint(P: any): void { // eslint-disable-line @typescript-eslint/no-explicit-any
  const { displayWidth, displayHeight, oilPaintRadius, oilPaintLevels, canvas, putLowResImageData } = P;
  if (canvas.width === 0 || canvas.height === 0) return;
  const { w, h } = getOilPaintWorkingSize(displayWidth, displayHeight);
  const src = captureOilPaintSource(canvas, w, h);
  oilPaintPixels(src.data, w, h, oilPaintRadius, oilPaintLevels);
  putLowResImageData(src);
}
