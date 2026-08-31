// Web Worker-backed Auto wrapper for Brush Strokes — see
// workerAutoEffect.ts.
import { getDownscaleWorkingSize, captureDownscaledSource } from '../../utils/downscaleCapture';
import { createWorkerAutoEffect } from './workerAutoEffect';
import { applyBrushStrokes } from './applyBrushStrokes';
import type { BrushStrokesWorkerRequest, BrushStrokesWorkerResponse } from './brushStrokesWorker';

const MAX_DIM = 480;

export const applyBrushStrokesWorkerAuto = createWorkerAutoEffect<BrushStrokesWorkerRequest, BrushStrokesWorkerResponse>({
  workerUrl: new URL('./brushStrokesWorker.ts', import.meta.url),
  effectName: 'Brush Strokes',
  cpuFallback: applyBrushStrokes,
  shouldRun: (P) => P.canvas.width !== 0 && P.canvas.height !== 0,
  buildRequest: (P) => {
    const { canvas, displayWidth, displayHeight, brushStrokesSize, brushStrokesLength } = P;
    const { w, h } = getDownscaleWorkingSize(displayWidth, displayHeight, MAX_DIM);
    const snapshot = captureDownscaledSource('brushStrokesWorkerSnapshot', canvas, w, h);
    return {
      buffer: snapshot.data.buffer,
      extra: { displayWidth, displayHeight, brushStrokesSize, brushStrokesLength, sampleWidth: w, sampleHeight: h },
    };
  },
});
