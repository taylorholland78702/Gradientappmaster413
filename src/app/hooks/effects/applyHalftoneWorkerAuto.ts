// Web Worker-backed Auto wrapper for Halftone — see workerAutoEffect.ts.
// Halftone is the one of these five that receives a pre-fetched imageData
// from the caller (see buildEffectCtx in useCanvasDraw.ts) rather than
// snapshotting the canvas itself, so buildRequest just forwards its buffer.
import { createWorkerAutoEffect } from './workerAutoEffect';
import { applyHalftone } from './applyHalftone';
import type { HalftoneWorkerRequest, HalftoneWorkerResponse } from './halftoneWorker';

export const applyHalftoneWorkerAuto = createWorkerAutoEffect<HalftoneWorkerRequest, HalftoneWorkerResponse>({
  workerUrl: new URL('./halftoneWorker.ts', import.meta.url),
  effectName: 'Halftone',
  cpuFallback: applyHalftone,
  shouldRun: (P) => !!P.imageData,
  buildRequest: (P) => {
    const { imageData, displayWidth, displayHeight, centerX, centerY, halftoneSize, halftoneCMYK, halftoneMove, halftoneVariation, halftoneTimeRef } = P;
    // imageData was fetched fresh for this effect call (getDisplayImageData
    // always returns a brand-new ImageData), so transferring its backing
    // buffer here doesn't affect anything else reading the canvas this
    // frame.
    return {
      buffer: imageData.data.buffer,
      extra: {
        displayWidth, displayHeight, centerX, centerY,
        halftoneSize, halftoneCMYK, halftoneMove, halftoneVariation,
        halftoneTime: halftoneTimeRef.current,
      },
    };
  },
});
