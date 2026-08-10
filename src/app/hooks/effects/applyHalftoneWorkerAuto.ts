// Web Worker-backed Auto wrapper for Halftone — same fallback-detection
// shape as the GL Auto wrappers elsewhere in this codebase (try the faster
// path, fall back to the known-good synchronous one on any failure or lack
// of support), just trading "GPU vs CPU" for "off main thread vs on it".
//
// Accepts one frame of latency by design (see the Web Worker migration
// discussion this came out of): draw() is synchronous and can't block on
// an async postMessage reply without SharedArrayBuffer+Atomics, so instead
// of stalling this frame, this always draws whatever the worker last
// finished (from the previous frame's pixels) and kicks off a new
// computation for the CURRENT frame's pixels in the background. At a
// steady frame rate this reads as a one-frame-old Halftone — usually
// imperceptible — in exchange for the actual per-dot vector drawing
// (thousands of ctx.arc()+fill() calls) never blocking the main thread.
import { applyHalftone } from './applyHalftone';
import type { HalftoneWorkerRequest, HalftoneWorkerResponse } from './halftoneWorker';

let worker: Worker | null = null;
let workerFailed = false;
let pending = false;
let lastResult: { imageData: ImageData; displayWidth: number; displayHeight: number } | null = null;

export function detectHalftoneWorkerSupport(): boolean {
  return typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined' && !workerFailed;
}

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./halftoneWorker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<HalftoneWorkerResponse>) => {
      pending = false;
      const { buffer, displayWidth, displayHeight } = e.data;
      lastResult = {
        imageData: new ImageData(new Uint8ClampedArray(buffer), displayWidth, displayHeight),
        displayWidth,
        displayHeight,
      };
    };
    // Any worker-level failure (e.g. OffscreenCanvas 2D context creation
    // throwing on a browser that lied about supporting it) permanently
    // falls back to the synchronous path for the rest of the session
    // rather than retrying every frame.
    worker.onerror = (err) => {
      console.error('Halftone worker failed, falling back to main thread:', err);
      workerFailed = true;
      pending = false;
    };
  }
  return worker;
}

export function applyHalftoneWorkerAuto(P: any): void { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!detectHalftoneWorkerSupport()) {
    applyHalftone(P);
    return;
  }

  const { ctx, imageData, displayWidth, displayHeight, centerX, centerY, halftoneSize, halftoneCMYK, halftoneMove, halftoneVariation, halftoneTimeRef } = P;
  if (!imageData) return;

  // No completed result yet (first-ever call, or the last one was
  // discarded below for a size mismatch) — draw synchronously this one
  // time so there's never a blank/missing frame while the worker warms up.
  if (!lastResult || lastResult.displayWidth !== displayWidth || lastResult.displayHeight !== displayHeight) {
    applyHalftone(P);
  } else {
    ctx.putImageData(lastResult.imageData, 0, 0);
  }

  if (!pending) {
    pending = true;
    try {
      const w = getWorker();
      // imageData was fetched fresh for this effect call (see
      // buildEffectCtx in useCanvasDraw.ts — getDisplayImageData() always
      // returns a brand-new ImageData), so transferring its backing buffer
      // here doesn't affect anything else reading the canvas this frame.
      const request: HalftoneWorkerRequest = {
        buffer: imageData.data.buffer,
        displayWidth, displayHeight, centerX, centerY,
        halftoneSize, halftoneCMYK, halftoneMove, halftoneVariation,
        halftoneTime: halftoneTimeRef.current,
      };
      w.postMessage(request, [request.buffer]);
    } catch (err) {
      console.error('Halftone worker postMessage failed, falling back to main thread:', err);
      workerFailed = true;
      pending = false;
    }
  }
}
