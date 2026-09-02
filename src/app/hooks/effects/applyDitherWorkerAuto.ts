// Web Worker-backed Auto wrapper for Dither — see workerAutoEffect.ts. No
// OffscreenCanvas step here since ditherWorker.ts is pure array math; this
// still calls the main-thread-only putScaledImageData (inside the shared
// factory) to composite the (possibly one-frame-stale) result back onto the
// real canvas respecting DPR scaling, same as the original applyDither.ts.
import { createWorkerAutoEffect } from './workerAutoEffect';
import { applyDither } from './applyDither';
import type { DitherWorkerRequest, DitherWorkerResponse } from './ditherWorker';

// Module-level clock — see applyAuraGlow.ts's agTime: purely cosmetic,
// no undo/redo or Display-mode value depends on it. Computed here (main
// thread) rather than inside ditherWorker.ts since buildRequest already
// runs once per call regardless of which thread does the pixel math.
let ditherPhaseTime = 0;

export const applyDitherWorkerAuto = createWorkerAutoEffect<DitherWorkerRequest, DitherWorkerResponse>({
  workerUrl: new URL('./ditherWorker.ts', import.meta.url),
  effectName: 'Dither',
  requiresOffscreenCanvas: false,
  cpuFallback: applyDither,
  buildRequest: (P) => {
    const { displayWidth, displayHeight, ditherType, ditherLevels, ditherScale, getDisplayImageData } = P;
    // Fresh snapshot each call (getDisplayImageData always returns a new
    // ImageData), so transferring its buffer to the worker is safe.
    const snapshot = getDisplayImageData();
    ditherPhaseTime += 0.08;
    return {
      buffer: snapshot.data.buffer,
      extra: { displayWidth, displayHeight, ditherType, ditherLevels, ditherScale, ditherPhase: ditherPhaseTime },
    };
  },
});
