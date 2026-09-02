// Runs drawBrushStrokes (see brushStrokesDraw.ts) against an
// OffscreenCanvas inside a Worker — same reasoning as gridEffectWorker.ts.
// Brush Strokes draws a rotated, elongated daub per grid cell (up to
// (rows+1)*(columns+1) of them, each its own save/translate/rotate/scale/
// fill), the same class of per-cell-shape cost as Grid.
import { drawBrushStrokes } from './brushStrokesDraw';

let offscreen: OffscreenCanvas | null = null;
let offCtx: OffscreenCanvasRenderingContext2D | null = null;

export interface BrushStrokesWorkerRequest {
  buffer: ArrayBuffer;
  displayWidth: number;
  displayHeight: number;
  brushStrokesSize: number;
  brushStrokesLength: number;
  brushStrokesDriftTime: number;
  sampleWidth: number;
  sampleHeight: number;
}

export interface BrushStrokesWorkerResponse {
  buffer: ArrayBuffer;
  displayWidth: number;
  displayHeight: number;
}

self.onmessage = (e: MessageEvent<BrushStrokesWorkerRequest>) => {
  const { buffer, displayWidth, displayHeight, brushStrokesSize, brushStrokesLength, brushStrokesDriftTime, sampleWidth, sampleHeight } = e.data;

  if (!offscreen || offscreen.width !== displayWidth || offscreen.height !== displayHeight) {
    offscreen = new OffscreenCanvas(displayWidth, displayHeight);
    offCtx = offscreen.getContext('2d') as OffscreenCanvasRenderingContext2D;
  }

  drawBrushStrokes(offCtx!, {
    displayWidth, displayHeight, brushStrokesSize, brushStrokesLength,
    sampleWidth, sampleHeight,
    pixels: new Uint8ClampedArray(buffer),
    brushTime: brushStrokesDriftTime,
  });

  const result = offCtx!.getImageData(0, 0, displayWidth, displayHeight);
  const response: BrushStrokesWorkerResponse = { buffer: result.data.buffer, displayWidth, displayHeight };
  (self as unknown as Worker).postMessage(response, [result.data.buffer]);
};
