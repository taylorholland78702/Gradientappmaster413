import { impastoPixels } from './impastoPixels';
import { getDownscaleWorkingSize, captureDownscaledSource } from '../../utils/downscaleCapture';

// Impasto's Sobel pass is O(width*height) (cheap per-pixel, no radius
// scan), so it could run at full display resolution, but capping keeps its
// cost bounded and predictable regardless of actual window size — see
// downscaleCapture.ts.
const MAX_DIM = 480;

export function applyImpasto(P: any): void { // eslint-disable-line @typescript-eslint/no-explicit-any
  const { displayWidth, displayHeight, impastoStrength, impastoLightAngle, canvas, putLowResImageData } = P;
  if (canvas.width === 0 || canvas.height === 0) return;
  const { w, h } = getDownscaleWorkingSize(displayWidth, displayHeight, MAX_DIM);
  const src = captureDownscaledSource('impasto', canvas, w, h);
  impastoPixels(src.data, w, h, impastoStrength, impastoLightAngle);
  putLowResImageData(src);
}
