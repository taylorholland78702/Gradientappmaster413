import { getMappedColor } from '../../utils/fieldCurve';

// Wallpaper-group symmetric tiling — distinct from Truchet's random-tile
// approach: every tile shares one kaleidoscope-folded motif (angle mirrored
// into a 1/symmetry wedge) and alternates 90-degree rotation checkerboard-
// style between neighbors, producing a repeating, non-random pattern.
// Half-res + putLowResImageData like Plasma/Julia, since the per-pixel
// trig here is too expensive at full display resolution every frame.
export function drawTiling(P: any): CanvasGradient | undefined {
  const {
    ctx,
    canvas,
    displayWidth,
    displayHeight,
    gradientColors,
    putLowResImageData,
    tilingSize,
    tilingSymmetry,
    tilingComplexity,
    tilingRotation,
    tilingAnimTime,
    tilingRowOffset,
  } = P;
  const gradient: CanvasGradient | undefined = undefined;
  if (canvas.width === 0 || canvas.height === 0) return gradient;

  const renderW = Math.max(1, Math.round(displayWidth * 0.5));
  const renderH = Math.max(1, Math.round(displayHeight * 0.5));
  const invScale = 2;
  const imageData = ctx.createImageData(renderW, renderH);
  const data = imageData.data;

  const tileSize = Math.max(8, tilingSize ?? 120) * 0.5;
  const symmetry = Math.max(2, Math.round(tilingSymmetry ?? 6));
  const sectorAngle = (Math.PI * 2) / symmetry;
  const complexity = Math.max(0.5, tilingComplexity ?? 3);
  const rotRad = ((tilingRotation ?? 0) + (tilingAnimTime ?? 0)) * Math.PI / 180;
  const cosR = Math.cos(rotRad);
  const sinR = Math.sin(rotRad);

  for (let py = 0; py < renderH; py++) {
    for (let px = 0; px < renderW; px++) {
      const fx = px * invScale;
      const fy = py * invScale;

      // Row offset — brick/halftone-style stagger: every other tile row
      // is shifted horizontally, same idea as Emoji's row offset. Applied
      // to the sampling x before tile-column math so it shifts whole
      // tiles rather than distorting the motif inside them.
      const tileIndexY = Math.floor(fy / tileSize);
      const rowStaggerAmt = (((tileIndexY % 2) + 2) % 2 === 1) ? (tilingRowOffset ?? 0) * 0.5 : 0;
      const sfx = fx - rowStaggerAmt;
      const tileIndexX = Math.floor(sfx / tileSize);
      let lx = (sfx / tileSize - tileIndexX - 0.5) * tileSize;
      let ly = (fy / tileSize - tileIndexY - 0.5) * tileSize;

      // p4-style alternating 90-degree rotation between neighboring tiles
      if ((tileIndexX + tileIndexY) % 2 !== 0) {
        const rx = -ly, ry = lx;
        lx = rx; ly = ry;
      }
      // Global rotation on top of the per-tile checkerboard rotation
      const gx = lx * cosR - ly * sinR;
      const gy = lx * sinR + ly * cosR;

      const angle = Math.atan2(gy, gx);
      const radius = Math.sqrt(gx * gx + gy * gy);
      let folded = ((angle % sectorAngle) + sectorAngle) % sectorAngle;
      if (folded > sectorAngle / 2) folded = sectorAngle - folded;

      const value = (
        Math.sin(radius * complexity * 0.15 + folded * symmetry) +
        Math.sin(radius * complexity * 0.08) +
        1
      ) / 4 + 0.5;

      const color = getMappedColor(value, gradientColors, 1, 'linear', 1);
      const idx = (py * renderW + px) * 4;
      data[idx] = Math.round(color.r);
      data[idx + 1] = Math.round(color.g);
      data[idx + 2] = Math.round(color.b);
      data[idx + 3] = 255;
    }
  }
  putLowResImageData(imageData);
  return gradient;
}
