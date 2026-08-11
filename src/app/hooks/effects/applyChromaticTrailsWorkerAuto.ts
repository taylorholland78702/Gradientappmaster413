// Web Worker-backed Auto wrapper for Chroma Trails — same shape as
// applyHalftoneWorkerAuto.ts and friends, with one extra wrinkle: the
// trail buffer's accumulated state lives entirely inside the worker (see
// chromaticTrailsWorker.ts), separate from chromaticTrailsBufferRef used
// by the one-off synchronous fallback frame. Both start empty, so there's
// no visible discontinuity switching from the fallback frame to the
// worker-cached ones — a decaying trail converges to a similar look
// within a few frames regardless of the exact starting point.
import { getScratchCanvas } from '../../utils/scratchCanvas';
import { applyChromaticTrails } from './applyChromaticTrails';
import type { ChromaticTrailsWorkerRequest, ChromaticTrailsWorkerResponse } from './chromaticTrailsWorker';

let worker: Worker | null = null;
let workerFailed = false;
let pending = false;
let lastResult: { imageData: ImageData; displayWidth: number; displayHeight: number } | null = null;

export function detectChromaticTrailsWorkerSupport(): boolean {
  return typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined' && !workerFailed;
}

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./chromaticTrailsWorker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<ChromaticTrailsWorkerResponse>) => {
      pending = false;
      const { buffer, displayWidth, displayHeight } = e.data;
      lastResult = {
        imageData: new ImageData(new Uint8ClampedArray(buffer), displayWidth, displayHeight),
        displayWidth,
        displayHeight,
      };
    };
    worker.onerror = (err) => {
      console.error('Chroma Trails worker failed, falling back to main thread:', err);
      workerFailed = true;
      pending = false;
    };
  }
  return worker;
}

export function applyChromaticTrailsWorkerAuto(P: any): void { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!detectChromaticTrailsWorkerSupport()) {
    applyChromaticTrails(P);
    return;
  }

  const { ctx, canvas, displayWidth, displayHeight, chromaticTrailsOffset, chromaticTrailsDecay } = P;
  if (canvas.width === 0 || canvas.height === 0) return;

  if (!lastResult || lastResult.displayWidth !== displayWidth || lastResult.displayHeight !== displayHeight) {
    applyChromaticTrails(P);
  } else {
    ctx.putImageData(lastResult.imageData, 0, 0);
  }

  if (!pending) {
    pending = true;
    try {
      const ctDownsample = 0.5;
      const ctW = Math.max(1, Math.round(displayWidth * ctDownsample));
      const ctH = Math.max(1, Math.round(displayHeight * ctDownsample));
      const ctTmp = getScratchCanvas('chromaticTrailsWorkerSnapshot', ctW, ctH);
      const ctTmpCtx = ctTmp.getContext('2d', { willReadFrequently: true });
      if (!ctTmpCtx) throw new Error('no 2d context for snapshot');
      ctTmpCtx.drawImage(canvas, 0, 0, ctW, ctH);
      const snapshot = ctTmpCtx.getImageData(0, 0, ctW, ctH);

      const w = getWorker();
      const request: ChromaticTrailsWorkerRequest = {
        buffer: snapshot.data.buffer,
        displayWidth, displayHeight, ctW, ctH,
        chromaticTrailsOffset, chromaticTrailsDecay,
      };
      w.postMessage(request, [request.buffer]);
    } catch (err) {
      console.error('Chroma Trails worker postMessage failed, falling back to main thread:', err);
      workerFailed = true;
      pending = false;
    }
  }
}
