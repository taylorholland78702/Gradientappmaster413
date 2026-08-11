// Pure-ish Chroma Trails drawing logic, extracted from
// applyChromaticTrails.ts. Unlike halftoneDraw.ts/gridEffectDraw.ts/
// triangulateDraw.ts, this effect is genuinely stateful — it reads and
// rewrites a persistent decaying trail buffer every call, not just a
// snapshot of the current frame — so unlike the other three, this
// function takes the trail buffer's own 2D context as an argument rather
// than being fully side-effect-free. On the main thread that's a
// <canvas> element's context (chromaticTrailsBufferRef); inside
// chromaticTrailsWorker.ts it's a persistent OffscreenCanvas the worker
// keeps alive across messages — same instance across every call, exactly
// like the ref does on the main thread.
//
// Uses the real CanvasRenderingContext2D/OffscreenCanvasRenderingContext2D
// union directly (rather than a hand-rolled minimal interface like the
// other three) since this needs several drawImage overloads and
// globalCompositeOperation, and both real context types already agree on
// that surface exactly.
export type ChromaticTrailsCtx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export interface ChromaticTrailsOptions {
  displayWidth: number;
  displayHeight: number;
  ctW: number;
  ctH: number;
  chromaticTrailsOffset: number;
  chromaticTrailsDecay: number;
  // Raw RGBA snapshot of the current frame, already downsampled to
  // ctW x ctH by the caller (matches what applyChromaticTrails.ts's
  // ctTmp scratch canvas held).
  currentFramePixels: Uint8ClampedArray;
  // A reusable scratch 2D context sized ctW x ctH, used only to turn
  // currentFramePixels back into something drawImage-able (putImageData
  // doesn't composite with globalCompositeOperation, drawImage does) —
  // callers should keep this around across calls the same way
  // getScratchCanvas already does elsewhere, not recreate it every frame.
  scratchCtx: ChromaticTrailsCtx;
}

export function runChromaticTrails(outputCtx: ChromaticTrailsCtx, trailCtx: ChromaticTrailsCtx, opts: ChromaticTrailsOptions): void {
  const { displayWidth, displayHeight, ctW, ctH, chromaticTrailsOffset, chromaticTrailsDecay, currentFramePixels, scratchCtx } = opts;
  const ctOff = Math.max(1, Math.round(chromaticTrailsOffset * 0.5));

  // Fringe + decay the existing trail: R sampled from the left, B from the
  // right, G stays put, alpha scaled down by the decay factor.
  const ctBufData = trailCtx.getImageData(0, 0, ctW, ctH);
  const ctBd = ctBufData.data;
  const ctFringed = trailCtx.createImageData(ctW, ctH);
  const ctFd = ctFringed.data;
  for (let y = 0; y < ctH; y++) {
    for (let x = 0; x < ctW; x++) {
      const i = (y * ctW + x) * 4;
      const rx = Math.max(0, Math.min(ctW - 1, x - ctOff));
      const bx = Math.max(0, Math.min(ctW - 1, x + ctOff));
      const ri = (y * ctW + rx) * 4;
      const bi = (y * ctW + bx) * 4;
      ctFd[i] = ctBd[ri];
      ctFd[i + 1] = ctBd[i + 1];
      ctFd[i + 2] = ctBd[bi + 2];
      ctFd[i + 3] = Math.round(ctBd[i + 3] * chromaticTrailsDecay);
    }
  }
  trailCtx.putImageData(ctFringed, 0, 0);

  // Turn the current frame's raw pixels back into a drawImage-able source
  // via the shared scratch context. Cast needed because the ImageData
  // constructor's TS signature wants a Uint8ClampedArray<ArrayBuffer>
  // specifically (excluding SharedArrayBuffer) — currentFramePixels is
  // always backed by a plain ArrayBuffer in practice (from getImageData /
  // a transferred postMessage buffer), never a SharedArrayBuffer.
  const currentFrameImageData = new ImageData(currentFramePixels as Uint8ClampedArray<ArrayBuffer>, ctW, ctH);
  scratchCtx.putImageData(currentFrameImageData, 0, 0);
  const ctTmp = scratchCtx.canvas;

  outputCtx.clearRect(0, 0, displayWidth, displayHeight);
  (outputCtx as CanvasRenderingContext2D).drawImage(trailCtx.canvas as CanvasImageSource, 0, 0, ctW, ctH, 0, 0, displayWidth, displayHeight);
  outputCtx.globalCompositeOperation = 'lighten';
  (outputCtx as CanvasRenderingContext2D).drawImage(ctTmp as CanvasImageSource, 0, 0, ctW, ctH, 0, 0, displayWidth, displayHeight);
  outputCtx.globalCompositeOperation = 'source-over';

  // Feed the fresh (undecayed) frame back into the trail buffer for next call.
  trailCtx.globalCompositeOperation = 'lighten';
  (trailCtx as CanvasRenderingContext2D).drawImage(ctTmp as CanvasImageSource, 0, 0);
  trailCtx.globalCompositeOperation = 'source-over';
}
