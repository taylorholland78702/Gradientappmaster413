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
