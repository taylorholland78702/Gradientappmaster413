// Runs runChromaticTrails (see chromaticTrailsDraw.ts) inside a Worker.
// Unlike halftoneWorker.ts/gridEffectWorker.ts/triangulateWorker.ts, this
// worker holds genuinely persistent state across messages — the trail
// buffer itself lives here (trailCanvas/trailCtx below), the same role
// chromaticTrailsBufferRef plays on the main thread's fallback path — not
// just a reusable scratch surface recomputed fresh each call.
import { runChromaticTrails } from './chromaticTrailsDraw';

let outputCanvas: OffscreenCanvas | null = null;
let outputCtx: OffscreenCanvasRenderingContext2D | null = null;
let trailCanvas: OffscreenCanvas | null = null;
let trailCtx: OffscreenCanvasRenderingContext2D | null = null;
let scratchCanvas: OffscreenCanvas | null = null;
let scratchCtx: OffscreenCanvasRenderingContext2D | null = null;

export interface ChromaticTrailsWorkerRequest {
  buffer: ArrayBuffer;
  displayWidth: number;
  displayHeight: number;
  ctW: number;
  ctH: number;
  chromaticTrailsOffset: number;
  chromaticTrailsDecay: number;
}

export interface ChromaticTrailsWorkerResponse {
  buffer: ArrayBuffer;
  displayWidth: number;
  displayHeight: number;
}

self.onmessage = (e: MessageEvent<ChromaticTrailsWorkerRequest>) => {
  const { buffer, displayWidth, displayHeight, ctW, ctH, chromaticTrailsOffset, chromaticTrailsDecay } = e.data;

  if (!outputCanvas || outputCanvas.width !== displayWidth || outputCanvas.height !== displayHeight) {
    outputCanvas = new OffscreenCanvas(displayWidth, displayHeight);
    outputCtx = outputCanvas.getContext('2d');
  }
  // Trail buffer resets (starts fresh/empty) whenever its size changes —
  // same as chromaticTrailsBufferRef's create-a-new-canvas-on-resize
  // behavior on the main thread.
  if (!trailCanvas || trailCanvas.width !== ctW || trailCanvas.height !== ctH) {
    trailCanvas = new OffscreenCanvas(ctW, ctH);
    trailCtx = trailCanvas.getContext('2d', { willReadFrequently: true });
  }
  if (!scratchCanvas || scratchCanvas.width !== ctW || scratchCanvas.height !== ctH) {
    scratchCanvas = new OffscreenCanvas(ctW, ctH);
    scratchCtx = scratchCanvas.getContext('2d', { willReadFrequently: true });
  }

  runChromaticTrails(outputCtx!, trailCtx!, {
    displayWidth, displayHeight, ctW, ctH, chromaticTrailsOffset, chromaticTrailsDecay,
    currentFramePixels: new Uint8ClampedArray(buffer),
    scratchCtx: scratchCtx!,
  });

  const result = outputCtx!.getImageData(0, 0, displayWidth, displayHeight);
  const response: ChromaticTrailsWorkerResponse = { buffer: result.data.buffer, displayWidth, displayHeight };
  (self as unknown as Worker).postMessage(response, [result.data.buffer]);
};
