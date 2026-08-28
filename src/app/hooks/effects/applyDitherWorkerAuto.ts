// Web Worker-backed Auto wrapper for Dither — same shape as
// applyHalftoneWorkerAuto.ts/applyGridEffectWorkerAuto.ts. No OffscreenCanvas
// step here since ditherWorker.ts is pure array math; this wrapper still
// needs to call the main-thread-only putScaledImageData to composite the
// (possibly one-frame-stale) result back onto the real canvas respecting
// DPR scaling, same as the original applyDither.ts did.
import { applyDither } from './applyDither';
import type { DitherWorkerRequest, DitherWorkerResponse } from './ditherWorker';

let worker: Worker | null = null;
let workerFailed = false;
let pending = false;
let lastResult: { imageData: ImageData; displayWidth: number; displayHeight: number } | null = null;

export function detectDitherWorkerSupport(): boolean {
  return typeof Worker !== 'undefined' && !workerFailed;
}

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./ditherWorker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<DitherWorkerResponse>) => {
      pending = false;
      const { buffer, displayWidth, displayHeight } = e.data;
      lastResult = {
        imageData: new ImageData(new Uint8ClampedArray(buffer), displayWidth, displayHeight),
        displayWidth,
        displayHeight,
      };
    };
    worker.onerror = (err) => {
      console.error('Dither worker failed, falling back to main thread:', err);
      workerFailed = true;
      pending = false;
    };
  }
  return worker;
}

export function applyDitherWorkerAuto(P: any): void { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!detectDitherWorkerSupport()) {
    applyDither(P);
    return;
  }

  const { displayWidth, displayHeight, ditherType, ditherLevels, ditherScale, putScaledImageData, getDisplayImageData } = P;

  if (!lastResult || lastResult.displayWidth !== displayWidth || lastResult.displayHeight !== displayHeight) {
    applyDither(P);
  } else {
    putScaledImageData(lastResult.imageData);
  }

  if (!pending) {
    pending = true;
    try {
      // Fresh snapshot each call (getDisplayImageData always returns a new
      // ImageData), so transferring its buffer to the worker is safe.
      const snapshot = getDisplayImageData();
      const w = getWorker();
      const request: DitherWorkerRequest = {
        buffer: snapshot.data.buffer,
        displayWidth, displayHeight, ditherType, ditherLevels, ditherScale,
      };
      w.postMessage(request, [request.buffer]);
    } catch (err) {
      console.error('Dither worker postMessage failed, falling back to main thread:', err);
      workerFailed = true;
      pending = false;
    }
  }
}
