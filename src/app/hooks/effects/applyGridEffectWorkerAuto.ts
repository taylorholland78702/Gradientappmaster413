// Web Worker-backed Auto wrapper for Grid — see workerAutoEffect.ts. Grid
// doesn't receive a pre-fetched imageData from the caller the way Halftone
// does, so buildRequest below snapshots the live canvas itself via
// getScratchCanvas before handing pixels to the worker.
import { getScratchCanvas } from '../../utils/scratchCanvas';
import { createWorkerAutoEffect } from './workerAutoEffect';
import { applyGridEffect } from './applyGridEffect';
import type { GridEffectWorkerRequest, GridEffectWorkerResponse } from './gridEffectWorker';

export const applyGridEffectWorkerAuto = createWorkerAutoEffect<GridEffectWorkerRequest, GridEffectWorkerResponse>({
  workerUrl: new URL('./gridEffectWorker.ts', import.meta.url),
  effectName: 'Grid effect',
  cpuFallback: applyGridEffect,
  shouldRun: (P) => P.canvas.width !== 0 && P.canvas.height !== 0,
  buildRequest: (P) => {
    const { canvas, displayWidth, displayHeight, gridRows, gridColumns, gridShapeSize, gridSides, gridRotation, gridVariation } = P;
    // Same snapshot the main-thread path takes (see applyGridEffect.ts):
    // draw the live canvas into a scratch buffer, then read its pixels.
    const tempCanvas = getScratchCanvas('gridEffectWorkerSnapshot', displayWidth, displayHeight);
    const gCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    if (!gCtx) throw new Error('no 2d context for snapshot');
    gCtx.drawImage(canvas, 0, 0, displayWidth, displayHeight);
    const snapshot = gCtx.getImageData(0, 0, displayWidth, displayHeight);
    return {
      buffer: snapshot.data.buffer,
      extra: { displayWidth, displayHeight, gridRows, gridColumns, gridShapeSize, gridSides, gridRotation, gridVariation },
    };
  },
});
