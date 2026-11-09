// A small JPEG of the canvas as it looks right now, for the look filmstrip. Kept to a 120px long edge so a handful of
// them cost almost nothing to hold. Returns null when the canvas is not ready to be read.
const THUMB_LONG_EDGE = 120;
let scratch: HTMLCanvasElement | null = null;

export function captureLookThumb(canvas: HTMLCanvasElement | null): string | null {
  if (!canvas || canvas.width < 2 || canvas.height < 2) return null;
  try {
    const k = THUMB_LONG_EDGE / Math.max(canvas.width, canvas.height);
    const w = Math.max(1, Math.round(canvas.width * k)), h = Math.max(1, Math.round(canvas.height * k));
    scratch ??= document.createElement('canvas');
    if (scratch.width !== w || scratch.height !== h) { scratch.width = w; scratch.height = h; }
    const ctx = scratch.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(canvas, 0, 0, w, h);
    return scratch.toDataURL('image/jpeg', 0.7);
  } catch {
    return null;
  }
}
