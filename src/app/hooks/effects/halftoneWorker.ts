// Runs drawHalftonePixels (see halftoneDraw.ts) against an OffscreenCanvas
// inside a Worker instead of the main thread — Halftone is a per-dot vector
// draw (ctx.arc + fill, potentially thousands of calls per frame at a small
// dot size or the CMYK 4-channel mode), which was one of the heaviest
// effects in the registry and could visibly stall the main thread (slider
// drags, button clicks) during a dense frame. See applyHalftoneWorkerAuto.ts
// for the main-thread side of this — it accepts one frame of latency,
// caching whatever this worker last finished while a new computation for
// the current frame's pixels is already in flight.
import { drawHalftonePixels } from './halftoneDraw';

let offscreen: OffscreenCanvas | null = null;
let offCtx: OffscreenCanvasRenderingContext2D | null = null;

export interface HalftoneWorkerRequest {
  buffer: ArrayBuffer;
  displayWidth: number;
  displayHeight: number;
  centerX: number;
  centerY: number;
  halftoneSize: number;
  halftoneCMYK: boolean;
  halftoneMove: boolean;
  halftoneVariation: number;
  halftoneTime: number;
}

export interface HalftoneWorkerResponse {
  buffer: ArrayBuffer;
  displayWidth: number;
  displayHeight: number;
}

self.onmessage = (e: MessageEvent<HalftoneWorkerRequest>) => {
  const { buffer, displayWidth, displayHeight, centerX, centerY, halftoneSize, halftoneCMYK, halftoneMove, halftoneVariation, halftoneTime } = e.data;

  if (!offscreen || offscreen.width !== displayWidth || offscreen.height !== displayHeight) {
    offscreen = new OffscreenCanvas(displayWidth, displayHeight);
    offCtx = offscreen.getContext('2d') as OffscreenCanvasRenderingContext2D;
  }

  drawHalftonePixels(offCtx!, {
    displayWidth, displayHeight, centerX, centerY,
    halftoneSize, halftoneCMYK, halftoneMove, halftoneVariation, halftoneTime,
    pixels: new Uint8ClampedArray(buffer),
  });

  const result = offCtx!.getImageData(0, 0, displayWidth, displayHeight);
  const response: HalftoneWorkerResponse = { buffer: result.data.buffer, displayWidth, displayHeight };
  (self as unknown as Worker).postMessage(response, [result.data.buffer]);
};
