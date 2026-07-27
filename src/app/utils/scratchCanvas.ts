// Several effects need a same-size scratch canvas to snapshot/transform the
// main canvas into each frame. Each one used to call
// document.createElement('canvas') fresh on every single frame — fine for
// one effect alone, but in Multi-FX mode with several of these stacked,
// that's several fresh canvas allocations 60x/sec. iOS Safari has a
// notoriously low, separate memory ceiling for canvas/GPU backing stores
// that isn't reflected in normal JS heap metrics, and can silently
// accumulate until the tab gets killed — exactly the kind of crash-under-
// load this factory is meant to rule out. One cache per call site (each
// effect keeps its own, keyed by a name it passes in), resized in place
// only when the requested dimensions actually change, otherwise reused.
const scratchCanvases = new Map<string, HTMLCanvasElement>();

export function getScratchCanvas(key: string, width: number, height: number): HTMLCanvasElement {
  let c = scratchCanvases.get(key);
  if (!c) {
    c = document.createElement('canvas');
    scratchCanvases.set(key, c);
  }
  if (c.width !== width || c.height !== height) {
    c.width = width;
    c.height = height;
  }
  return c;
}

// Same idea as getScratchCanvas above, but for the output ImageData buffer
// itself — several full-resolution per-pixel effects (Chromatic, Liquid,
// Fisheye, Blur's zoom/radial modes, Slit-Scan, Wave) called
// `ctx.createImageData(displayWidth, displayHeight)` fresh every single
// frame just to build their output, a full-canvas RGBA allocation (~8MB at
// 1080p) 60x/sec. One cache per call site, resized (i.e. reallocated) only
// when dimensions actually change — otherwise the same backing
// Uint8ClampedArray is handed back and the caller overwrites it in place.
const scratchImageData = new Map<string, ImageData>();

export function getScratchImageData(key: string, ctx: CanvasRenderingContext2D, width: number, height: number): ImageData {
  let d = scratchImageData.get(key);
  if (!d || d.width !== width || d.height !== height) {
    d = ctx.createImageData(width, height);
    scratchImageData.set(key, d);
  }
  return d;
}

// A raw reusable Uint8ClampedArray, for effects that build many small/
// variable-size ImageData objects in a loop within a single frame (VHS's
// glitch slices — up to ~65 per frame) rather than one full-canvas buffer.
// `new ImageData(view, w, h)` accepts any Uint8ClampedArray whose length is
// exactly w*h*4, including a `.subarray()` view into a larger, reused
// backing array — so each iteration only needs to size the view, not
// allocate a fresh backing array.
const scratchPixelBuffers = new Map<string, Uint8ClampedArray>();

export function getScratchPixelBuffer(key: string, minLength: number): Uint8ClampedArray {
  let b = scratchPixelBuffers.get(key);
  if (!b || b.length < minLength) {
    b = new Uint8ClampedArray(minLength);
    scratchPixelBuffers.set(key, b);
  }
  return b;
}
