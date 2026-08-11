// Runs drawTrianglePixels (see triangulateDraw.ts) against an
// OffscreenCanvas inside a Worker — same reasoning as halftoneWorker.ts.
import { drawTrianglePixels } from './triangulateDraw';

let offscreen: OffscreenCanvas | null = null;
let offCtx: OffscreenCanvasRenderingContext2D | null = null;

export interface TriangulateWorkerRequest {
  buffer: ArrayBuffer;
  sampleWidth: number;
  sampleHeight: number;
  displayWidth: number;
  displayHeight: number;
  centerX: number;
  centerY: number;
  triangleSize: number;
  triangulateVariation: number;
  resolutionMultiplier: number;
}

export interface TriangulateWorkerResponse {
  buffer: ArrayBuffer;
  displayWidth: number;
  displayHeight: number;
}

self.onmessage = (e: MessageEvent<TriangulateWorkerRequest>) => {
  const { buffer, sampleWidth, sampleHeight, displayWidth, displayHeight, centerX, centerY, triangleSize, triangulateVariation, resolutionMultiplier } = e.data;

  if (!offscreen || offscreen.width !== displayWidth || offscreen.height !== displayHeight) {
    offscreen = new OffscreenCanvas(displayWidth, displayHeight);
    offCtx = offscreen.getContext('2d') as OffscreenCanvasRenderingContext2D;
  }

  drawTrianglePixels(offCtx!, {
    displayWidth, displayHeight, centerX, centerY, triangleSize, triangulateVariation, resolutionMultiplier,
    sampleWidth, sampleHeight,
    pixels: new Uint8ClampedArray(buffer),
  });

  const result = offCtx!.getImageData(0, 0, displayWidth, displayHeight);
  const response: TriangulateWorkerResponse = { buffer: result.data.buffer, displayWidth, displayHeight };
  (self as unknown as Worker).postMessage(response, [result.data.buffer]);
};
