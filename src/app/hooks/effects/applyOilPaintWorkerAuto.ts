// Web Worker-backed Auto wrapper for Oil Paint — same shape as
// applyDitherWorkerAuto.ts. No OffscreenCanvas step since oilPaintWorker.ts
// is pure array math; this wrapper still needs the main-thread-only
// putScaledImageData to composite the (possibly one-frame-stale) result
// back onto the real canvas respecting DPR scaling.
import { applyOilPaint } from './applyOilPaint';
import type { OilPaintWorkerRequest, OilPaintWorkerResponse } from './oilPaintWorker';

let worker: Worker | null = null;
let workerFailed = false;
let pending = false;
let lastResult: { imageData: ImageData; displayWidth: number; displayHeight: number } | null = null;

export function detectOilPaintWorkerSupport(): boolean {
  return typeof Worker !== 'undefined' && !workerFailed;
}

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./oilPaintWorker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<OilPaintWorkerResponse>) => {
      pending = false;
      const { buffer, displayWidth, displayHeight } = e.data;
      lastResult = {
        imageData: new ImageData(new Uint8ClampedArray(buffer), displayWidth, displayHeight),
        displayWidth,
        displayHeight,
      };
    };
    worker.onerror = (err) => {
      console.error('Oil Paint worker failed, falling back to main thread:', err);
      workerFailed = true;
      pending = false;
    };
  }
  return worker;
}

export function applyOilPaintWorkerAuto(P: any): void { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!detectOilPaintWorkerSupport()) {
    applyOilPaint(P);
    return;
  }

  const { displayWidth, displayHeight, oilPaintRadius, oilPaintLevels, putScaledImageData, getDisplayImageData } = P;

  if (!lastResult || lastResult.displayWidth !== displayWidth || lastResult.displayHeight !== displayHeight) {
    applyOilPaint(P);
  } else {
    putScaledImageData(lastResult.imageData);
  }

  if (!pending) {
    pending = true;
    try {
      const snapshot = getDisplayImageData();
      const w = getWorker();
      const request: OilPaintWorkerRequest = {
        buffer: snapshot.data.buffer,
        displayWidth, displayHeight, oilPaintRadius, oilPaintLevels,
      };
      w.postMessage(request, [request.buffer]);
    } catch (err) {
      console.error('Oil Paint worker postMessage failed, falling back to main thread:', err);
      workerFailed = true;
      pending = false;
    }
  }
}
