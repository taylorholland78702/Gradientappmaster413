// Web Worker-backed Auto wrapper for Triangulate — see workerAutoEffect.ts.
// Snapshots the live canvas itself at full physical/DPR resolution (not
// display resolution — see resolutionMultiplier in triangulateDraw.ts),
// same pattern as Grid.
import { getScratchCanvas } from '../../utils/scratchCanvas';
import { createWorkerAutoEffect } from './workerAutoEffect';
import { applyTriangulate } from './applyTriangulate';
import type { TriangulateWorkerRequest, TriangulateWorkerResponse } from './triangulateWorker';

export const applyTriangulateWorkerAuto = createWorkerAutoEffect<TriangulateWorkerRequest, TriangulateWorkerResponse>({
  workerUrl: new URL('./triangulateWorker.ts', import.meta.url),
  effectName: 'Triangulate',
  cpuFallback: applyTriangulate,
  buildRequest: (P) => {
    const { canvas, displayWidth, displayHeight, centerX, centerY, triangleSize, triangulateVariation, resolutionMultiplier, isFirstEffect, audioModulation } = P;
    const tCanvas = getScratchCanvas('triangulateWorkerSnapshot', canvas.width, canvas.height);
    const tCtx = tCanvas.getContext('2d', { willReadFrequently: true });
    if (!tCtx) throw new Error('no 2d context for snapshot');
    tCtx.drawImage(canvas, 0, 0);
    const snapshot = tCtx.getImageData(0, 0, tCanvas.width, tCanvas.height);
    const tSz = Math.max(10, triangleSize + (isFirstEffect ? Math.floor(audioModulation * 40) : 0));
    return {
      buffer: snapshot.data.buffer,
      extra: {
        sampleWidth: tCanvas.width, sampleHeight: tCanvas.height,
        displayWidth, displayHeight, centerX, centerY,
        triangleSize: tSz, triangulateVariation, resolutionMultiplier,
      },
    };
  },
});
