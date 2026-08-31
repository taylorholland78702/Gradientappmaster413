// Same "render small, upscale" cap as oilPaintDownscale.ts — Impasto's
// Sobel pass is only O(width*height) (cheap per-pixel, no radius scan), so
// it could run at full display resolution, but capping keeps its cost
// bounded and predictable regardless of actual window size, and a modest
// working resolution is plenty for the daub-scale texture this produces
// once stretched back up.
const MAX_DIM = 480;
let smallCanvas: HTMLCanvasElement | null = null;

export function getImpastoWorkingSize(displayWidth: number, displayHeight: number): { w: number; h: number } {
  const longEdge = Math.max(displayWidth, displayHeight, 1);
  const scale = Math.min(1, MAX_DIM / longEdge);
  return {
    w: Math.max(1, Math.round(displayWidth * scale)),
    h: Math.max(1, Math.round(displayHeight * scale)),
  };
}

export function captureImpastoSource(canvas: HTMLCanvasElement, w: number, h: number): ImageData {
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
