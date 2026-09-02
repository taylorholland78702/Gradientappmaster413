import { getDownscaleWorkingSize, captureDownscaledSource } from '../../utils/downscaleCapture';
import { drawBrushStrokes } from './brushStrokesDraw';

// Sampling at a capped working resolution (like Oil Paint/Impasto) rather
// than full display size — the stroke grid itself is already coarser than
// the display, so a full-res sample buys no extra fidelity and just costs
// more to read/transfer. See downscaleCapture.ts.
const MAX_DIM = 480;

export function applyBrushStrokes(P: any): void { // eslint-disable-line @typescript-eslint/no-explicit-any
  const { displayWidth, displayHeight, brushStrokesSize, brushStrokesLength, brushStrokesDriftTime, canvas, ctx } = P;
  if (canvas.width === 0 || canvas.height === 0) return;
  const { w, h } = getDownscaleWorkingSize(displayWidth, displayHeight, MAX_DIM);

  let pixels: Uint8ClampedArray | null = null;
  try {
    pixels = captureDownscaledSource('brushStrokes', canvas, w, h).data;
  } catch (e) { pixels = null; }

  drawBrushStrokes(ctx, {
    displayWidth, displayHeight, brushStrokesSize, brushStrokesLength,
    sampleWidth: w, sampleHeight: h, pixels, brushTime: brushStrokesDriftTime ?? 0,
  });
}
