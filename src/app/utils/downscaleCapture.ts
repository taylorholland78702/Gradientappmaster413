// Shared "capture the canvas at a capped working resolution" helper —
// every heavier per-pixel effect this session (Oil Paint, Watercolor,
// Dada, Surrealism) needed its own version of this to keep cost roughly
// constant regardless of the real canvas size (see oilPaintDownscale.ts's
// comment for the fuller story on why an uncapped version could freeze a
// large real window). Each caller gets its own cached canvas (via its own
// call to makeDownscaleCapture) rather than sharing one globally, so two
// of these effects active at once in Multi-FX don't thrash a shared cache.
export function makeDownscaleCapture(maxDim: number) {
  let canvas: HTMLCanvasElement | null = null;

  return {
    getWorkingSize(displayWidth: number, displayHeight: number): { w: number; h: number } {
      const longEdge = Math.max(displayWidth, displayHeight, 1);
      const scale = Math.min(1, maxDim / longEdge);
      return {
        w: Math.max(1, Math.round(displayWidth * scale)),
        h: Math.max(1, Math.round(displayHeight * scale)),
      };
    },
    capture(source: HTMLCanvasElement, w: number, h: number): ImageData {
      if (!canvas) canvas = document.createElement('canvas');
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      const ctx = canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(source, 0, 0, w, h);
      return ctx.getImageData(0, 0, w, h);
    },
  };
}
