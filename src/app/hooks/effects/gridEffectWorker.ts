// Runs drawGridEffectPixels (see gridEffectDraw.ts) against an
// OffscreenCanvas inside a Worker — same reasoning as halftoneWorker.ts.
// Grid draws a radial-gradient-filled shape per cell (up to
// (rows+1)*(columns+1) of them, each its own save/translate/rotate/fill),
// which was one of the heavier effects in the registry.
import { drawGridEffectPixels } from './gridEffectDraw';

let offscreen: OffscreenCanvas | null = null;
let offCtx: OffscreenCanvasRenderingContext2D | null = null;

export interface GridEffectWorkerRequest {
  buffer: ArrayBuffer;
  displayWidth: number;
  displayHeight: number;
  gridRows: number;
  gridColumns: number;
  gridShapeSize: number;
  gridSides: number;
  gridRotation: number;
  gridVariation: number;
}

export interface GridEffectWorkerResponse {
  buffer: ArrayBuffer;
  displayWidth: number;
  displayHeight: number;
}

self.onmessage = (e: MessageEvent<GridEffectWorkerRequest>) => {
  const { buffer, displayWidth, displayHeight, gridRows, gridColumns, gridShapeSize, gridSides, gridRotation, gridVariation } = e.data;

  if (!offscreen || offscreen.width !== displayWidth || offscreen.height !== displayHeight) {
    offscreen = new OffscreenCanvas(displayWidth, displayHeight);
    offCtx = offscreen.getContext('2d') as OffscreenCanvasRenderingContext2D;
  }

  // Grid always starts from a black background fill on the main thread
  // (see applyGridEffect.ts) before drawing shapes on top — replicate that
  // here so the worker's output matches exactly.
  offCtx!.fillStyle = '#000';
  offCtx!.fillRect(0, 0, displayWidth, displayHeight);

  drawGridEffectPixels(offCtx!, {
    displayWidth, displayHeight, gridRows, gridColumns, gridShapeSize,
    gridSides, gridRotation, gridVariation,
    pixels: new Uint8ClampedArray(buffer),
  });

  const result = offCtx!.getImageData(0, 0, displayWidth, displayHeight);
  const response: GridEffectWorkerResponse = { buffer: result.data.buffer, displayWidth, displayHeight };
  (self as unknown as Worker).postMessage(response, [result.data.buffer]);
};
