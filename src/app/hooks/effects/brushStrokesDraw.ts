// Pure Brush Strokes drawing logic, extracted from applyBrushStrokes.ts —
// same reasoning as gridEffectDraw.ts/halftoneDraw.ts: shared unchanged
// between the main-thread fallback and a Worker running it against an
// OffscreenCanvas.
//
// Each stroke's angle follows the local luminance contour (perpendicular
// to the brightness gradient) rather than a fixed direction — the classic
// non-photorealistic-rendering trick that makes strokes read as "painted
// along the shape" instead of a uniform hatch pattern. A flat area with no
// real gradient falls back to a per-cell hash angle so strokes there still
// vary instead of all pointing the same way.
export interface BrushStrokesDrawCtx {
  fillStyle: string | CanvasGradient | CanvasPattern;
  fillRect(x: number, y: number, w: number, h: number): void;
  save(): void;
  restore(): void;
  translate(x: number, y: number): void;
  rotate(angle: number): void;
  scale(x: number, y: number): void;
  beginPath(): void;
  arc(x: number, y: number, r: number, start: number, end: number): void;
  fill(): void;
}

export interface BrushStrokesDrawOptions {
  displayWidth: number;
  displayHeight: number;
  brushStrokesSize: number;
  brushStrokesLength: number;
  // Raw RGBA snapshot to sample color and local contrast from — already
  // downsampled by the caller (matches Oil Paint/Impasto's own capped
  // working-resolution capture), since the gradient-direction scan and
  // per-stroke sampling only need to be as detailed as the stroke grid
  // itself, not full display resolution.
  sampleWidth: number;
  sampleHeight: number;
  pixels: Uint8ClampedArray | null;
}

// Module-level clock — see applyAuraGlow.ts's agTime: purely cosmetic,
// no undo/redo or Display-mode value depends on it.
let brushTime = 0;

export function drawBrushStrokes(ctx: BrushStrokesDrawCtx, opts: BrushStrokesDrawOptions): void {
  const { displayWidth, displayHeight, brushStrokesSize, brushStrokesLength, sampleWidth, sampleHeight, pixels } = opts;
  // A very slow overall drift on top of each stroke's shape-following
  // angle — as if the whole canvas of strokes were still being worked,
  // resettling rather than sitting frozen the instant it's painted.
  brushTime += 0.004;

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, displayWidth, displayHeight);
  if (!pixels) return;

  const sxScale = sampleWidth / displayWidth;
  const syScale = sampleHeight / displayHeight;

  const lumAt = (sx: number, sy: number): number => {
    const cx = sx < 0 ? 0 : sx >= sampleWidth ? sampleWidth - 1 : sx;
    const cy = sy < 0 ? 0 : sy >= sampleHeight ? sampleHeight - 1 : sy;
    const i = (cy * sampleWidth + cx) * 4;
    return pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
  };
  const colorAt = (sx: number, sy: number): [number, number, number] => {
    const cx = Math.max(0, Math.min(sampleWidth - 1, Math.round(sx)));
    const cy = Math.max(0, Math.min(sampleHeight - 1, Math.round(sy)));
    const i = (cy * sampleWidth + cx) * 4;
    return [pixels[i], pixels[i + 1], pixels[i + 2]];
  };

  const spacing = Math.max(4, brushStrokesSize);
  const thickness = spacing * 0.6;
  const length = spacing * Math.max(1, brushStrokesLength);
  const cols = Math.ceil(displayWidth / spacing) + 1;
  const rows = Math.ceil(displayHeight / spacing) + 1;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Deterministic per-cell hash for jitter and the flat-area fallback
      // angle — stable frame to frame (no Math.random()) so strokes don't
      // swim in place while everything else is static.
      const hash = Math.abs(Math.sin(r * 12.9898 + c * 78.233) * 43758.5453) % 1;
      const jx = (hash - 0.5) * spacing * 0.6;
      const jy = (Math.abs(Math.sin(r * 78.233 + c * 12.9898) * 43758.5453) % 1 - 0.5) * spacing * 0.6;
      const cx = c * spacing + spacing / 2 + jx;
      const cy = r * spacing + spacing / 2 + jy;
      if (cx < -spacing || cx > displayWidth + spacing || cy < -spacing || cy > displayHeight + spacing) continue;

      const sx = cx * sxScale, sy = cy * syScale;
      const step = Math.max(1, spacing * 0.4 * sxScale);
      const gx = lumAt(sx + step, sy) - lumAt(sx - step, sy);
      const gy = lumAt(sx, sy + step) - lumAt(sx, sy - step);
      const gradMag = Math.sqrt(gx * gx + gy * gy);
      // Perpendicular to the brightness gradient — tangent to the local
      // contour — reads as strokes following the shape's edge rather than
      // crossing it.
      const wobble = Math.sin(brushTime + hash * Math.PI * 2) * 0.25;
      const angle = (gradMag > 2 ? Math.atan2(gx, -gy) : hash * Math.PI * 2) + wobble;

      const [r0, g0, b0] = colorAt(sx, sy);
      ctx.fillStyle = `rgb(${r0},${g0},${b0})`;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.scale(length / thickness, 1);
      ctx.beginPath();
      ctx.arc(0, 0, thickness / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
