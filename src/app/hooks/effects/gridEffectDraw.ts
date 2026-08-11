// Pure Grid-effect drawing logic, extracted from applyGridEffect.ts —
// same reasoning as halftoneDraw.ts: shared unchanged between the
// main-thread fallback and a Worker running it against an OffscreenCanvas.
export interface GridEffectDrawCtx {
  fillStyle: string | CanvasGradient | CanvasPattern;
  save(): void;
  restore(): void;
  translate(x: number, y: number): void;
  rotate(angle: number): void;
  beginPath(): void;
  closePath(): void;
  arc(x: number, y: number, r: number, start: number, end: number): void;
  rect(x: number, y: number, w: number, h: number): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  fill(): void;
  createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): CanvasGradient;
}

export interface GridEffectDrawOptions {
  displayWidth: number;
  displayHeight: number;
  gridRows: number;
  gridColumns: number;
  gridShapeSize: number;
  gridSides: number;
  gridRotation: number;
  gridVariation: number;
  // Raw RGBA snapshot of whatever the canvas looked like before this
  // effect ran — Grid samples both each cell's center and its top-left
  // corner from this fixed buffer, unlike Halftone which only samples once
  // per dot. null when the caller's getImageData read failed (matches the
  // original try/catch fallback: draw dark placeholder shapes instead of
  // skipping the frame entirely).
  pixels: Uint8ClampedArray | null;
}

export function drawGridEffectPixels(ctx: GridEffectDrawCtx, opts: GridEffectDrawOptions): void {
  const { displayWidth, displayHeight, gridShapeSize, gridSides, gridRotation, gridVariation, pixels } = opts;
  const gridRowsSafeFx = Math.max(2, opts.gridRows);
  const gridColumnsSafeFx = Math.max(2, opts.gridColumns);
  const cw = displayWidth / gridColumnsSafeFx, ch = displayHeight / gridRowsSafeFx;

  const sampleGrid = (px: number, py: number): [number, number, number] => {
    if (!pixels) return [0, 0, 0];
    const sx = Math.max(0, Math.min(displayWidth - 1, Math.round(px)));
    const sy = Math.max(0, Math.min(displayHeight - 1, Math.round(py)));
    const i = (sy * displayWidth + sx) * 4;
    return [pixels[i], pixels[i + 1], pixels[i + 2]];
  };

  for (let r = 0; r < gridRowsSafeFx + 1; r++) {
    for (let c = 0; c < gridColumnsSafeFx + 1; c++) {
      const x = c * cw, y = r * ch;
      const vx = gridVariation > 0 ? (Math.random() - 0.5) * cw * gridVariation : 0;
      const vy = gridVariation > 0 ? (Math.random() - 0.5) * ch * gridVariation : 0;
      const cx = x + cw / 2 + vx, cy = y + ch / 2 + vy;
      const rad = Math.min(cw, ch) / 2 * (gridShapeSize / 25) * (gridVariation > 0 ? 1 + (Math.random() - 0.5) * gridVariation * 0.5 : 1);
      const scx = Math.min(Math.max(0, cx), displayWidth - 1);
      const scy = Math.min(Math.max(0, cy), displayHeight - 1);
      const sex = Math.min(Math.max(0, x), displayWidth - 1);
      const sey = Math.min(Math.max(0, y), displayHeight - 1);
      let cc = '#000', ec = '#000';
      if (pixels) {
        const cp = sampleGrid(scx, scy);
        cc = `rgb(${cp[0]},${cp[1]},${cp[2]})`;
        const ep = sampleGrid(sex, sey);
        ec = `rgb(${ep[0]},${ep[1]},${ep[2]})`;
      } else { cc = '#000'; ec = '#333'; }
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
      g.addColorStop(0, cc);
      g.addColorStop(1, ec);
      ctx.fillStyle = g;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((gridRotation * Math.PI) / 180 + (gridVariation > 0 ? Math.random() * gridVariation * Math.PI : 0));
      ctx.translate(-cx, -cy);
      ctx.beginPath();
      if (gridSides === 1) {
        // Dot (circle)
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      } else if (gridSides === 2) {
        // Line (vertical line with thickness = rad)
        ctx.rect(cx - rad, cy - displayHeight * 2, rad * 2, displayHeight * 4);
      } else if (gridSides > 2) {
        // Polygon (3+ sides)
        for (let i = 0; i < gridSides; i++) {
          const a = (i * 2 * Math.PI / gridSides) - (gridSides % 2 === 1 ? Math.PI / 2 : 0);
          const px = cx + rad * Math.cos(a), py = cy + rad * Math.sin(a);
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
}
