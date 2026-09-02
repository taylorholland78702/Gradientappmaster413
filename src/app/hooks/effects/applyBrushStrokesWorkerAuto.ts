// Web Worker-backed Auto wrapper for Brush Strokes — see
// workerAutoEffect.ts.
import { getDownscaleWorkingSize, captureDownscaledSource } from '../../utils/downscaleCapture';
import { createWorkerAutoEffect } from './workerAutoEffect';
import { applyBrushStrokes } from './applyBrushStrokes';
import type { BrushStrokesWorkerRequest, BrushStrokesWorkerResponse } from './brushStrokesWorker';

const MAX_DIM = 480;

const workerAuto = createWorkerAutoEffect<BrushStrokesWorkerRequest, BrushStrokesWorkerResponse>({
  workerUrl: new URL('./brushStrokesWorker.ts', import.meta.url),
  effectName: 'Brush Strokes',
  cpuFallback: applyBrushStrokes,
  shouldRun: (P) => P.canvas.width !== 0 && P.canvas.height !== 0,
  buildRequest: (P) => {
    const { canvas, displayWidth, displayHeight, brushStrokesSize, brushStrokesLength, brushStrokesDriftTime } = P;
    const { w, h } = getDownscaleWorkingSize(displayWidth, displayHeight, MAX_DIM);
    const snapshot = captureDownscaledSource('brushStrokesWorkerSnapshot', canvas, w, h);
    return {
      buffer: snapshot.data.buffer,
      extra: { displayWidth, displayHeight, brushStrokesSize, brushStrokesLength, brushStrokesDriftTime, sampleWidth: w, sampleHeight: h },
    };
  },
});

// Drift clock lives here, on the main thread, incremented on every call
// regardless of whether a worker request is currently in flight — not
// inside workerAutoEffect.ts's "one request at a time" gating, and not as
// state owned by the worker script itself. If a worker round trip never
// completes (this genuinely happens for OffscreenCanvas-backed workers in
// at least one real environment — confirmed via instrumentation during
// development, no error thrown, request just never resolves), the code
// permanently falls back to drawing this effect on the main thread every
// frame; a clock owned by the worker would freeze forever in exactly that
// case, silently undoing the drift with no visible error. Passed through
// P to both the CPU fallback and the worker request builder above, so
// either path always gets a live value.
let brushStrokesDriftTime = 0;
export function applyBrushStrokesWorkerAuto(P: any): void { // eslint-disable-line @typescript-eslint/no-explicit-any
  brushStrokesDriftTime += 0.004;
  workerAuto({ ...P, brushStrokesDriftTime });
}
