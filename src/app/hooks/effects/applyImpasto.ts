import { impastoPixels } from './impastoPixels';
import { getImpastoWorkingSize, captureImpastoSource } from './impastoDownscale';

export function applyImpasto(P: any): void { // eslint-disable-line @typescript-eslint/no-explicit-any
  const { displayWidth, displayHeight, impastoStrength, impastoLightAngle, canvas, putLowResImageData } = P;
  if (canvas.width === 0 || canvas.height === 0) return;
  const { w, h } = getImpastoWorkingSize(displayWidth, displayHeight);
  const src = captureImpastoSource(canvas, w, h);
  impastoPixels(src.data, w, h, impastoStrength, impastoLightAngle);
  putLowResImageData(src);
}
