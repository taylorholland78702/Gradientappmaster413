// Web Worker-backed Auto wrapper for Grid — same shape as
// applyHalftoneWorkerAuto.ts (see that file for the fuller explanation of
// the one-frame-latency tradeoff). Grid doesn't receive a pre-fetched
// imageData from the caller the way Halftone does (it snapshots the live
// canvas itself via getScratchCanvas), so this wrapper does that same
// snapshot before handing pixels to the worker.
import { getScratchCanvas } from '../../utils/scratchCanvas';
import { applyGridEffect } from './applyGridEffect';
import type { GridEffectWorkerRequest, GridEffectWorkerResponse } from './gridEffectWorker';

let worker: Worker | null = null;
let workerFailed = false;
let pending = false;
let lastResult: { imageData: ImageData; displayWidth: number; displayHeight: number } | null = null;
// Captured on every applyGridEffectWorkerAuto call so the onmessage handler
// below — set up once, lazily, and long-lived across calls — can still
// reach whichever component instance's ref is current. See the wake-up
// comment in that handler for why this exists.
let latestDirtyRef: { current: boolean } | null = null;

export function detectGridEffectWorkerSupport(): boolean {
  return typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined' && !workerFailed;
}

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./gridEffectWorker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<GridEffectWorkerResponse>) => {
      pending = false;
      const { buffer, displayWidth, displayHeight } = e.data;
      lastResult = {
        imageData: new ImageData(new Uint8ClampedArray(buffer), displayWidth, displayHeight),
        displayWidth,
        displayHeight,
      };
      // The main draw loop stops calling draw() once colors/angle/zoom have
      // converged and nothing else is animating (see InteractiveGradient.tsx's
      // isAnimating/hasConverged check) — for a static gradient this can
      // happen within a couple of frames. If that convergence lands right as
      // this response arrives, the freshly-computed (correct) result would
      // never actually get painted: the loop already stopped calling draw(),
      // so whatever was on screen the moment it went idle — possibly an
      // in-between frame from a rapid effect toggle — stays there
      // indefinitely. Marking dirty forces at least one more draw so this
      // result is the one that ends up on screen before the loop goes idle
      // again.
      if (latestDirtyRef) latestDirtyRef.current = true;
    };
    worker.onerror = (err) => {
      console.error('Grid effect worker failed, falling back to main thread:', err);
      workerFailed = true;
      pending = false;
    };
  }
  return worker;
}

export function applyGridEffectWorkerAuto(P: any): void { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!detectGridEffectWorkerSupport()) {
    applyGridEffect(P);
    return;
  }

  const { canvas, displayWidth, displayHeight, gridRows, gridColumns, gridShapeSize, gridSides, gridRotation, gridVariation, putScaledImageData, drawParamsDirtyRef } = P;
  if (canvas.width === 0 || canvas.height === 0) return;
  if (drawParamsDirtyRef) latestDirtyRef = drawParamsDirtyRef;

  if (!lastResult || lastResult.displayWidth !== displayWidth || lastResult.displayHeight !== displayHeight) {
    applyGridEffect(P);
  } else {
    // putScaledImageData, not raw ctx.putImageData — see
    // applyHalftoneWorkerAuto.ts for why (effectiveResolutionMultiplier
    // scaling would otherwise clip this to the canvas's top-left corner).
    putScaledImageData(lastResult.imageData);
  }

  if (!pending) {
    pending = true;
    try {
      // Same snapshot the main-thread path takes (see applyGridEffect.ts):
      // draw the live canvas into a scratch buffer, then read its pixels.
      // A fresh snapshot each call, so transferring its buffer to the
      // worker below is safe.
      const tempCanvas = getScratchCanvas('gridEffectWorkerSnapshot', displayWidth, displayHeight);
      const gCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
      if (!gCtx) throw new Error('no 2d context for snapshot');
      gCtx.drawImage(canvas, 0, 0, displayWidth, displayHeight);
      const snapshot = gCtx.getImageData(0, 0, displayWidth, displayHeight);

      const w = getWorker();
      const request: GridEffectWorkerRequest = {
        buffer: snapshot.data.buffer,
        displayWidth, displayHeight, gridRows, gridColumns, gridShapeSize,
        gridSides, gridRotation, gridVariation,
      };
      w.postMessage(request, [request.buffer]);
    } catch (err) {
      console.error('Grid effect worker postMessage failed, falling back to main thread:', err);
      workerFailed = true;
      pending = false;
    }
  }
}
