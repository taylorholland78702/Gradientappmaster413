export interface RGB {
  r: number;
  g: number;
  b: number;
}

export type PaletteMode = 'linear' | 'banded' | 'cyclic';

// Symmetric power curve pivoting on 0.5: amount === 1 is a no-op (identity),
// amount > 1 pushes mid-values toward the edges (sharper transitions between
// colors), amount < 1 flattens everything toward the middle color. Used to
// let a single "Contrast" slider reshape any gradient's existing 0-1 field
// value before it's mapped to a palette color, instead of duplicating a
// bespoke curve per gradient.
export function applyFieldContrast(t: number, amount: number): number {
  if (amount === 1) return t;
  const centered = t - 0.5;
  const sign = centered < 0 ? -1 : 1;
  const shaped = sign * Math.pow(Math.abs(centered) * 2, amount) * 0.5;
  return Math.min(1, Math.max(0, shaped + 0.5));
}

// Maps a 0-1 field value to an interpolated palette color. 'banded' quantizes
// into `bands` discrete steps (posterized look); 'cyclic' repeats the full
// palette `bands` times across the field instead of stretching it once
// end-to-end. `bands` is reused as "repeat count" for cyclic mode rather than
// introducing a second field, since both are just an integer knob on the
// same underlying quantize-or-repeat math.
export function mapValueToColor(t: number, colors: RGB[], mode: PaletteMode, bands: number): RGB {
  let tt = ((t % 1) + 1) % 1;
  if (mode === 'banded') {
    const steps = Math.max(2, Math.round(bands));
    tt = Math.min(1, Math.floor(tt * steps) / (steps - 1));
  } else if (mode === 'cyclic') {
    const repeats = Math.max(1, Math.round(bands));
    tt = (tt * repeats) % 1;
  }
  const n = colors.length;
  const pos = tt * (n - 1);
  const idx = Math.floor(pos);
  const frac = pos - idx;
  const c1 = colors[idx] || colors[0] || { r: 255, g: 255, b: 255 };
  const c2 = colors[Math.min(idx + 1, n - 1)] || c1;
  return {
    r: c1.r + (c2.r - c1.r) * frac,
    g: c1.g + (c2.g - c1.g) * frac,
    b: c1.b + (c2.b - c1.b) * frac,
  };
}

// Convenience wrapper combining both steps for the common case of "reshape
// this field value, then map it to a color."
export function getMappedColor(t: number, colors: RGB[], contrast: number, mode: PaletteMode, bands: number): RGB {
  return mapValueToColor(applyFieldContrast(t, contrast), colors, mode, bands);
}
