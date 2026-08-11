// Pure Triangulate drawing logic, extracted from applyTriangulate.ts —
// same reasoning as halftoneDraw.ts/gridEffectDraw.ts.
export interface TriangulateDrawCtx {
  fillStyle: string | CanvasGradient | CanvasPattern;
  fillRect(x: number, y: number, w: number, h: number): void;
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  fill(): void;
}

export interface TriangulateDrawOptions {
  displayWidth: number;
  displayHeight: number;
  centerX: number;
  centerY: number;
  // Already includes the isFirstEffect audio-modulation bump applied by
  // the caller (see applyTriangulate.ts / applyTriangulateWorkerAuto.ts) —
  // this function just draws at whatever cell size it's given.
  triangleSize: number;
  triangulateVariation: number;
  resolutionMultiplier: number;
  // Physical-pixel dimensions of the snapshot `pixels` was sampled from
  // (tCanvas.width/height on the main thread — full-DPR canvas size, not
  // displayWidth/displayHeight).
  sampleWidth: number;
  sampleHeight: number;
  pixels: Uint8ClampedArray;
}

export function drawTrianglePixels(ctx: TriangulateDrawCtx, opts: TriangulateDrawOptions): void {
  const { displayWidth, displayHeight, centerX, centerY, triangleSize: tSz, triangulateVariation, resolutionMultiplier, sampleWidth, sampleHeight, pixels } = opts;

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, displayWidth, displayHeight);

  const sample = (px: number, py: number): [number, number, number] => {
    const sx = Math.max(0, Math.min(sampleWidth - 1, Math.round(px)));
    const sy = Math.max(0, Math.min(sampleHeight - 1, Math.round(py)));
    const i = (sy * sampleWidth + sx) * 4;
    return [pixels[i], pixels[i + 1], pixels[i + 2]];
  };

  const tHalfCols = Math.ceil(displayWidth / tSz / 2) + 1;
  const tHalfRows = Math.ceil(displayHeight / tSz / 2) + 1;
  const triVariation = triangulateVariation ?? 0;

  for (let r = -tHalfRows; r <= tHalfRows; r++) {
    for (let c = -tHalfCols; c <= tHalfCols; c++) {
      const x = centerX + c * tSz - tSz / 2;
      const y = centerY + r * tSz - tSz / 2;
      const cellHash = Math.abs(Math.sin(r * 12.9898 + c * 78.233)) % 1;
      const flipped = triVariation > 0 && cellHash < triVariation;
      const sxA = Math.max(0, Math.min(displayWidth - 1, x + tSz / 2)) * resolutionMultiplier;
      const syA = Math.max(0, Math.min(displayHeight - 1, y + tSz / 2)) * resolutionMultiplier;
      const dA = sample(sxA, syA);
      ctx.fillStyle = `rgb(${dA[0]},${dA[1]},${dA[2]})`;
      ctx.beginPath();
      if (flipped) {
        ctx.moveTo(x + tSz, y);
        ctx.lineTo(x, y);
        ctx.lineTo(x, y + tSz);
      } else {
        ctx.moveTo(x, y);
        ctx.lineTo(x + tSz, y);
        ctx.lineTo(x + tSz, y + tSz);
      }
      ctx.fill();
      const sxB = Math.max(0, Math.min(displayWidth - 1, x + tSz / 3)) * resolutionMultiplier;
      const syB = Math.max(0, Math.min(displayHeight - 1, y + tSz / 3)) * resolutionMultiplier;
      const dB = sample(sxB, syB);
      ctx.fillStyle = `rgb(${dB[0]},${dB[1]},${dB[2]})`;
      ctx.beginPath();
      if (flipped) {
        ctx.moveTo(x + tSz, y);
        ctx.lineTo(x + tSz, y + tSz);
        ctx.lineTo(x, y + tSz);
      } else {
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + tSz);
        ctx.lineTo(x + tSz, y + tSz);
      }
      ctx.fill();
    }
  }
}
