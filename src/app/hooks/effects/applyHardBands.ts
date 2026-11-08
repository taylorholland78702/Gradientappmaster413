import type { EffectCtx } from '../canvasDrawTypes';

// Gradient map with hard stops: the picture's brightness is split into a few flat steps and each step is filled with
// one colour of the palette, dark to light along it. Whatever is underneath (a smooth gradient, a photo, another
// effect) comes out as flat bands of palette colour with sharp edges. Brightness is stretched to the frame's own range
// first, so a dim or low-contrast frame still uses every step.
export function applyHardBands(P: EffectCtx): void {
  const { getDisplayImageData, putScaledImageData, gradientColors, hardBandsSteps, hardBandsBlend } = P;
  if (!gradientColors?.length) return;
  const img = getDisplayImageData();
  const px = new Uint32Array(img.data.buffer);
  const d = img.data;
  const steps = Math.max(2, Math.min(16, Math.round(hardBandsSteps ?? 5)));
  const blend = Math.max(0, Math.min(1, hardBandsBlend ?? 0));

  const sample = (t: number): [number, number, number] => {
    const n = gradientColors.length;
    if (n === 1) return [gradientColors[0].r, gradientColors[0].g, gradientColors[0].b];
    const pos = Math.max(0, Math.min(1, t)) * (n - 1);
    const i = Math.min(n - 2, Math.floor(pos));
    const f = pos - i;
    const a = gradientColors[i], b = gradientColors[i + 1];
    return [a.r + (b.r - a.r) * f, a.g + (b.g - a.g) * f, a.b + (b.b - a.b) * f];
  };
  const stepColors = Array.from({ length: steps }, (_, k) => sample(k / (steps - 1)));

  // The frame's own brightness range, from a sparse sample.
  let lo = 255, hi = 0;
  for (let i = 0; i < d.length; i += 4 * 11) {
    const l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    if (l < lo) lo = l;
    if (l > hi) hi = l;
  }
  const range = Math.max(16, hi - lo);

  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const t = Math.max(0, Math.min(1, (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2] - lo) / range));
    const band = stepColors[Math.min(steps - 1, Math.floor(t * steps))];
    let r = band[0], g = band[1], b = band[2];
    if (blend > 0) {
      const smooth = sample(t);
      r += (smooth[0] - r) * blend; g += (smooth[1] - g) * blend; b += (smooth[2] - b) * blend;
    }
    px[p] = (px[p] & 0xff000000) | ((b & 255) << 16) | ((g & 255) << 8) | (r & 255);
  }
  putScaledImageData(img);
}
