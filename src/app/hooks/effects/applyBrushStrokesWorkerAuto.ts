// Web Worker-backed Auto wrapper for Brush Strokes — same shape as
// applyGridEffectWorkerAuto.ts (see applyHalftoneWorkerAuto.ts for the
// fuller explanation of the one-frame-latency tradeoff).
import { getScratchCanvas } from '../../utils/scratchCanvas';
import { applyBrushStrokes } from './applyBrushStrokes';
import type { BrushStrokesWorkerRequest, BrushStrokesWorkerResponse } from './brushStrokesWorker';

const MAX_DIM = 480;

let worker: Worker | null = null;
let workerFailed = false;
let pending = false;
let lastResult: { imageData: ImageData; displayWidth: number; displayHeight: number } | null = null;

export function detectBrushStrokesWorkerSupport(): boolean {
  return typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined' && !workerFailed;
}

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./brushStrokesWorker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<BrushStrokesWorkerResponse>) => {
      pending = false;
      const { buffer, displayWidth, displayHeight } = e.data;
      lastResult = {
        imageData: new ImageData(new Uint8ClampedArray(buffer), displayWidth, displayHeight),
        displayWidth,
        displayHeight,
      };
    };
    worker.onerror = (err) => {
      console.error('Brush Strokes worker failed, falling back to main thread:', err);
      workerFailed = true;
      pending = false;
    };
  }
  return worker;
}

export function applyBrushStrokesWorkerAuto(P: any): void { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!detectBrushStrokesWorkerSupport()) {
    applyBrushStrokes(P);
    return;
  }

  const { canvas, displayWidth, displayHeight, brushStrokesSize, brushStrokesLength, putScaledImageData } = P;
  if (canvas.width === 0 || canvas.height === 0) return;

  if (!lastResult || lastResult.displayWidth !== displayWidth || lastResult.displayHeight !== displayHeight) {
    applyBrushStrokes(P);
  } else {
    // putScaledImageData, not raw ctx.putImageData — see
    // applyHalftoneWorkerAuto.ts for why.
    putScaledImageData(lastResult.imageData);
  }

  if (!pending) {
    pending = true;
    try {
      const longEdge = Math.max(displayWidth, displayHeight, 1);
      const scale = Math.min(1, MAX_DIM / longEdge);
      const w = Math.max(1, Math.round(displayWidth * scale));
      const h = Math.max(1, Math.round(displayHeight * scale));
      const tempCanvas = getScratchCanvas('brushStrokesWorkerSnapshot', w, h);
      const bCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
      if (!bCtx) throw new Error('no 2d context for snapshot');
      bCtx.clearRect(0, 0, w, h);
      bCtx.drawImage(canvas, 0, 0, w, h);
      const snapshot = bCtx.getImageData(0, 0, w, h);

      const wk = getWorker();
      const request: BrushStrokesWorkerRequest = {
        buffer: snapshot.data.buffer,
        displayWidth, displayHeight, brushStrokesSize, brushStrokesLength,
        sampleWidth: w, sampleHeight: h,
      };
      wk.postMessage(request, [request.buffer]);
    } catch (err) {
      console.error('Brush Strokes worker postMessage failed, falling back to main thread:', err);
      workerFailed = true;
      pending = false;
    }
  }
}
