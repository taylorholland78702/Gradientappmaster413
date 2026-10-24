import type { EffectCtx } from '../canvasDrawTypes';
// Shared machinery for the "off-main-thread with one-frame latency" Worker
// pattern used by Grid, Triangulate, Halftone, Dither, and Brush Strokes:
// draw() is synchronous and can't block on an async postMessage reply
// without SharedArrayBuffer+Atomics, so instead of stalling the frame, each
// of these always paints whatever the worker last finished (from the
// previous frame's pixels) and kicks off a new computation for the CURRENT
// frame's pixels in the background. At a steady frame rate this reads as
// one-frame-old — usually imperceptible — in exchange for genuinely heavy
// per-effect work (thousands of ctx.arc()+fill() calls, full-canvas
// mode-filtering, etc.) never blocking the main thread.
//
// Was five near-identical copies of this same module-level state machine
// (worker/pending/lastResult/latestDirtyRef, getWorker with onmessage/
// onerror, the apply-function's stale-check/postMessage shell) before being
// consolidated here — each effect now only supplies what actually differs:
// its CPU fallback, how to snapshot the canvas into a request, and (for
// Halftone/Grid/Brush Strokes) a guard for when there's nothing to do yet.
export interface WorkerAutoConfig<TRequest extends { buffer: ArrayBuffer }> {
  workerUrl: URL;
  // Human-readable name for console error messages.
  effectName: string;
  // ditherWorker.ts is pure array math and needs no OffscreenCanvas — every
  // other worker here rasterizes into one, so this defaults to true.
  requiresOffscreenCanvas?: boolean;
  cpuFallback: (P: EffectCtx) => void;
  // Checked before anything else runs each call — mirrors each effect's own
  // early-return guard (Halftone: no imageData fetched yet; Grid/Brush
  // Strokes: a zero-size canvas). Default: always run.
  shouldRun?: (P: EffectCtx) => boolean;
  // Snapshots the canvas and builds the worker request's non-buffer fields.
  // May throw (e.g. no 2d context for the snapshot) — the caller catches it
  // and permanently falls back to the CPU path for the rest of the session,
  // same as every original of these five files did.
  buildRequest: (P: EffectCtx) => { buffer: ArrayBuffer; extra: Omit<TRequest, 'buffer'> };
  // Set when buildRequest reads the live canvas (Grid, Triangulate, Brush Strokes). The request must
  // then be built BEFORE the last result is painted: otherwise each frame's input is the effect's own
  // previous output, and the effect feeds on itself. Grid with shapes that leave gaps goes black within
  // a couple of seconds, and Triangulate drifts darker and darker. Leave unset when the request's pixels
  // come from the caller (Halftone, Dither): there the CPU fallback still needs the buffer intact.
  snapshotBeforePaint?: boolean;
}

export function createWorkerAutoEffect<
  TRequest extends { buffer: ArrayBuffer },
  TResponse extends { buffer: ArrayBuffer; displayWidth: number; displayHeight: number },
>(config: WorkerAutoConfig<TRequest>): (P: EffectCtx) => void {
  let worker: Worker | null = null;
  let workerFailed = false;
  let pending = false;
  let lastResult: { imageData: ImageData; displayWidth: number; displayHeight: number } | null = null;
  // Captured on every call so the onmessage handler below — set up once,
  // lazily, and long-lived across calls — can still reach whichever
  // component instance's ref is current.
  let latestDirtyRef: { current: boolean } | null = null;

  function detectSupport(): boolean {
    if (workerFailed || typeof Worker === 'undefined') return false;
    if (config.requiresOffscreenCanvas !== false && typeof OffscreenCanvas === 'undefined') return false;
    return true;
  }

  function getWorker(): Worker {
    if (!worker) {
      worker = new Worker(config.workerUrl, { type: 'module' });
      worker.onmessage = (e: MessageEvent<TResponse>) => {
        pending = false;
        const { buffer, displayWidth, displayHeight } = e.data;
        lastResult = {
          imageData: new ImageData(new Uint8ClampedArray(buffer), displayWidth, displayHeight),
          displayWidth,
          displayHeight,
        };
        // The main draw loop stops calling draw() once colors/angle/zoom
        // have converged and nothing else is animating (see
        // InteractiveGradient.tsx's isAnimating/hasConverged check) — for a
        // static gradient this can happen within a couple of frames. If
        // that convergence lands right as this response arrives, the
        // freshly-computed (correct) result would never actually get
        // painted: the loop already stopped calling draw(), so whatever was
        // on screen the moment it went idle — possibly an in-between frame
        // from a rapid effect toggle — stays there indefinitely. Marking
        // dirty forces at least one more draw so this result is the one
        // that ends up on screen before the loop goes idle again.
        if (latestDirtyRef) latestDirtyRef.current = true;
      };
      worker.onerror = (err) => {
        console.error(`${config.effectName} worker failed, falling back to main thread:`, err);
        workerFailed = true;
        pending = false;
      };
    }
    return worker;
  }

  return function applyWorkerAuto(P: EffectCtx): void {
    if (!detectSupport()) {
      config.cpuFallback(P);
      return;
    }
    if (config.shouldRun && !config.shouldRun(P)) return;

    const { displayWidth, displayHeight, putScaledImageData, drawParamsDirtyRef } = P;
    if (drawParamsDirtyRef) latestDirtyRef = drawParamsDirtyRef;

    // Canvas-reading effects snapshot the input first, while the canvas still holds this frame's
    // pre-effect picture (see snapshotBeforePaint).
    let early: { buffer: ArrayBuffer; extra: Omit<TRequest, 'buffer'> } | null = null;
    if (config.snapshotBeforePaint && !pending) {
      try {
        early = config.buildRequest(P);
      } catch (err) {
        console.error(`${config.effectName} worker postMessage failed, falling back to main thread:`, err);
        workerFailed = true;
      }
    }

    if (!lastResult || lastResult.displayWidth !== displayWidth || lastResult.displayHeight !== displayHeight) {
      config.cpuFallback(P);
    } else {
      // putScaledImageData, not raw ctx.putImageData — the canvas's actual
      // device-pixel backing store can be smaller than displayWidth/
      // displayHeight (effectiveResolutionMultiplier < 1 on large/high-DPR
      // screens), with a transform scaling it back up for normal drawing
      // calls. Raw putImageData ignores that transform and clips the
      // result to a small rectangle in the corner instead of filling the
      // canvas.
      putScaledImageData(lastResult.imageData);
    }

    if (!pending && !workerFailed) {
      pending = true;
      try {
        const { buffer, extra } = early ?? config.buildRequest(P);
        const w = getWorker();
        const request = { buffer, ...extra } as TRequest;
        w.postMessage(request, [buffer]);
      } catch (err) {
        console.error(`${config.effectName} worker postMessage failed, falling back to main thread:`, err);
        workerFailed = true;
        pending = false;
      }
    }
  };
}
