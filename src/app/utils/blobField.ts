// Shared shape for the orbiting-blob field-function technique used by both
// Lava Lamp and Metaballs (inverse-square falloff: r² / (dist² + 1) per
// blob, summed). Their blob-orbit generation uses different tuned
// constants per gradient (orbit radius, angle speed, wobble) so that part
// stays inline in each file rather than being forced through one
// parameterized function — but the field-sum math itself is identical, so
// it lives here once.
export interface FieldBlob {
  x: number;
  y: number;
  r: number;
}

// Metaballs' per-pixel loop only needs the summed field value before
// mapping it to a color, so it can call this directly. Lava Lamp's loop
// fuses per-blob color-weighting into the same pass (to avoid a second
// iteration over every blob per pixel), so it keeps its own inline
// accumulation instead of calling this — see drawLavaLamp.ts.
export function sumBlobField(px: number, py: number, blobs: FieldBlob[]): number {
  let field = 0;
  for (let b = 0; b < blobs.length; b++) {
    const dx = px - blobs[b].x;
    const dy = py - blobs[b].y;
    const dist2 = dx * dx + dy * dy;
    field += (blobs[b].r * blobs[b].r) / (dist2 + 1);
  }
  return field;
}
