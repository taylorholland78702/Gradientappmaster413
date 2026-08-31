import { getScratchCanvas } from '../../utils/scratchCanvas';
import { drawBrushStrokes } from './brushStrokesDraw';

// Sampling at a capped working resolution (like Oil Paint/Impasto) rather
// than full display size — the stroke grid itself is already coarser than
// the display, so a full-res sample buys no extra fidelity and just costs
// more to read/transfer.
const MAX_DIM = 480;

export function applyBrushStrokes(P: any): void { // eslint-disable-line @typescript-eslint/no-explicit-any
  const { displayWidth, displayHeight, brushStrokesSize, brushStrokesLength, canvas, ctx } = P;
  if (canvas.width === 0 || canvas.height === 0) return;
  const longEdge = Math.max(displayWidth, displayHeight, 1);
  const scale = Math.min(1, MAX_DIM / longEdge);
  const w = Math.max(1, Math.round(displayWidth * scale));
  const h = Math.max(1, Math.round(displayHeight * scale));

  const tempCanvas = getScratchCanvas('brushStrokes', w, h);
  const bCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
  if (!bCtx) return;
  bCtx.clearRect(0, 0, w, h);
  bCtx.drawImage(canvas, 0, 0, w, h);
  let pixels: Uint8ClampedArray | null = null;
  try {
    pixels = bCtx.getImageData(0, 0, w, h).data;
  } catch (e) { pixels = null; }

  drawBrushStrokes(ctx, {
    displayWidth, displayHeight, brushStrokesSize, brushStrokesLength,
    sampleWidth: w, sampleHeight: h, pixels,
  });
}
