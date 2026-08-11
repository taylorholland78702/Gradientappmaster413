// Web Worker-backed Auto wrapper for Triangulate — same shape as
// applyHalftoneWorkerAuto.ts/applyGridEffectWorkerAuto.ts. Triangulate
// snapshots the live canvas itself (at full physical/DPR resolution, not
// display resolution — see resolutionMultiplier in triangulateDraw.ts),
// same pattern as Grid.
import { getScratchCanvas } from '../../utils/scratchCanvas';
import { applyTriangulate } from './applyTriangulate';
import type { TriangulateWorkerRequest, TriangulateWorkerResponse } from './triangulateWorker';

let worker: Worker | null = null;
let workerFailed = false;
let pending = false;
let lastResult: { imageData: ImageData; displayWidth: number; displayHeight: number } | null = null;

export function detectTriangulateWorkerSupport(): boolean {
  return typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined' && !workerFailed;
}

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./triangulateWorker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<TriangulateWorkerResponse>) => {
      pending = false;
      const { buffer, displayWidth, displayHeight } = e.data;
      lastResult = {
        imageData: new ImageData(new Uint8ClampedArray(buffer), displayWidth, displayHeight),
        displayWidth,
        displayHeight,
      };
    };
    worker.onerror = (err) => {
      console.error('Triangulate worker failed, falling back to main thread:', err);
      workerFailed = true;
      pending = false;
    };
  }
  return worker;
}

export function applyTriangulateWorkerAuto(P: any): void { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!detectTriangulateWorkerSupport()) {
    applyTriangulate(P);
    return;
  }

  const { ctx, canvas, displayWidth, displayHeight, centerX, centerY, triangleSize, triangulateVariation, resolutionMultiplier, isFirstEffect, audioModulation } = P;

  if (!lastResult || lastResult.displayWidth !== displayWidth || lastResult.displayHeight !== displayHeight) {
    applyTriangulate(P);
  } else {
    ctx.putImageData(lastResult.imageData, 0, 0);
  }

  if (!pending) {
    pending = true;
    try {
      const tCanvas = getScratchCanvas('triangulateWorkerSnapshot', canvas.width, canvas.height);
      const tCtx = tCanvas.getContext('2d', { willReadFrequently: true });
      if (!tCtx) throw new Error('no 2d context for snapshot');
      tCtx.drawImage(canvas, 0, 0);
      const snapshot = tCtx.getImageData(0, 0, tCanvas.width, tCanvas.height);
      const tSz = Math.max(10, triangleSize + (isFirstEffect ? Math.floor(audioModulation * 40) : 0));

      const w = getWorker();
      const request: TriangulateWorkerRequest = {
        buffer: snapshot.data.buffer,
        sampleWidth: tCanvas.width, sampleHeight: tCanvas.height,
        displayWidth, displayHeight, centerX, centerY,
        triangleSize: tSz, triangulateVariation, resolutionMultiplier,
      };
      w.postMessage(request, [request.buffer]);
    } catch (err) {
      console.error('Triangulate worker postMessage failed, falling back to main thread:', err);
      workerFailed = true;
      pending = false;
    }
  }
}
