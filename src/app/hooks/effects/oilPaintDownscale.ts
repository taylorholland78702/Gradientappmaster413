// Oil Paint's neighborhood scan is O(width * height * radius^2) — at the
// real display resolution of an actual browser window (often 1500-3000px+
// wide, not the ~800px this was first tested at), a single computation can
// take multiple seconds even offloaded to a Worker. Since the WorkerAuto
// wrapper only ever shows the LAST completed result and only starts a new
// one once the previous finishes, a multi-second-per-frame cost reads as a
// canvas that's stopped responding — changing the gradient underneath it
// doesn't visibly do anything until that one computation eventually
// finishes. Capping the working resolution bounds the per-frame cost to
// roughly the same constant regardless of actual window size, the same
// "render small, upscale" trick Angle/Marble's own gradients already use
// (see putLowResImageData in useCanvasDraw.ts) — the daub size this
// produces, relative to the shrunk buffer, still reads as oil paint once
// stretched back up.
const MAX_DIM = 420;
let smallCanvas: HTMLCanvasElement | null = null;

export function getOilPaintWorkingSize(displayWidth: number, displayHeight: number): { w: number; h: number } {
  const longEdge = Math.max(displayWidth, displayHeight, 1);
  const scale = Math.min(1, MAX_DIM / longEdge);
  return {
    w: Math.max(1, Math.round(displayWidth * scale)),
    h: Math.max(1, Math.round(displayHeight * scale)),
  };
}

export function captureOilPaintSource(canvas: HTMLCanvasElement, w: number, h: number): ImageData {
  if (!smallCanvas) smallCanvas = document.createElement('canvas');
  if (smallCanvas.width !== w || smallCanvas.height !== h) {
    smallCanvas.width = w;
    smallCanvas.height = h;
  }
  const sctx = smallCanvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
  sctx.clearRect(0, 0, w, h);
  sctx.drawImage(canvas, 0, 0, w, h);
  return sctx.getImageData(0, 0, w, h);
}
