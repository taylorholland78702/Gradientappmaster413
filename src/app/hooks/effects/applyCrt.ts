import { getScratchImageData } from '../../utils/scratchCanvas';

export function applyCrt(P: any): void {
  const {
    ctx,
    canvas,
    displayWidth,
    displayHeight,
    putScaledImageData,
    getDisplayImageData,
    crtIntensity,
    crtScanlineSpacing,
  } = P;
  // RGB-subpixel/scanline mask only — no barrel curvature, corner vignette,
  // or black bezel, so the effect reads as a cathode-ray pixel grid over
  // the full frame rather than a curved TV tube with a visible edge.
  if (canvas.width === 0 || canvas.height === 0) return;
  const amt = Math.max(0, Math.min(1, crtIntensity ?? 0.6));
  if (amt <= 0) return;
  const spacing = Math.max(1, Math.round(crtScanlineSpacing ?? 2));
  const src = getDisplayImageData();
  const dst = getScratchImageData('crt', ctx, displayWidth, displayHeight);
  for (let y = 0; y < displayHeight; y++) {
    for (let x = 0; x < displayWidth; x++) {
      const i = (y * displayWidth + x) * 4;

      // RGB subpixel triad mask — every 3rd column tints toward one
      // channel, faint scanline darkening every `spacing`th row.
      const col = x % 3;
      const rowDark = (y % spacing === 0) ? 1 : (1 - 0.35 * amt);
      const subR = col === 0 ? 1 : (1 - 0.5 * amt);
      const subG = col === 1 ? 1 : (1 - 0.5 * amt);
      const subB = col === 2 ? 1 : (1 - 0.5 * amt);

      dst.data[i]     = src.data[i]     * rowDark * subR;
      dst.data[i + 1] = src.data[i + 1] * rowDark * subG;
      dst.data[i + 2] = src.data[i + 2] * rowDark * subB;
      dst.data[i + 3] = 255;
    }
  }
  putScaledImageData(dst);
}
