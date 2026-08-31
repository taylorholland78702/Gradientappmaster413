import { getScratchCanvas } from './scratchCanvas';

// Shared "render small, upscale" cap used by every per-pixel effect whose
// cost scales with canvas area (Oil Paint, Impasto, Watercolor, Dada,
// Surrealism, Brush Strokes) — at the real display resolution of an actual
// browser window (often 1500-3000px+ wide) their per-pixel loops could take
// multiple seconds per frame otherwise. Capping the working resolution
// bounds the per-frame cost to roughly the same constant regardless of
// actual window size; each effect's own daub/stroke/warp scale, defined in
// working-buffer pixels, stays visually consistent across screen sizes too.
//
// Was duplicated near-identically across six files (each with its own
// MAX_DIM, module-level scratch canvas, and copy of this exact scale-and-
// capture logic) before being consolidated here.
export interface DownscaleWorkingSize {
  w: number;
  h: number;
}

export function getDownscaleWorkingSize(displayWidth: number, displayHeight: number, maxDim: number): DownscaleWorkingSize {
  const longEdge = Math.max(displayWidth, displayHeight, 1);
  const scale = Math.min(1, maxDim / longEdge);
  return {
    w: Math.max(1, Math.round(displayWidth * scale)),
    h: Math.max(1, Math.round(displayHeight * scale)),
  };
}

// `key` is a getScratchCanvas cache key — pass a name unique to the calling
// effect (and distinct from any other scratch canvas/ImageData key it uses)
// so each effect keeps its own reused backing canvas rather than fighting
// over a shared one.
export function captureDownscaledSource(key: string, canvas: HTMLCanvasElement, w: number, h: number): ImageData {
  const small = getScratchCanvas(key, w, h);
  const sctx = small.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
  sctx.clearRect(0, 0, w, h);
  sctx.drawImage(canvas, 0, 0, w, h);
  return sctx.getImageData(0, 0, w, h);
}
