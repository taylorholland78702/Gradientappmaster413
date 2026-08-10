// Pure halftone-dot drawing logic, extracted from applyHalftone.ts so it can
// run unchanged on either the main thread (applyHalftone.ts, synchronous
// fallback) or inside a Worker against an OffscreenCanvas 2D context
// (halftoneWorker.ts) — OffscreenCanvasRenderingContext2D implements the
// same fillStyle/fillRect/globalCompositeOperation/beginPath/arc/fill
// surface this function actually uses, so the exact same code works in
// both places with zero duplication of the drawing math itself.
export interface HalftoneDrawCtx {
  fillStyle: string | CanvasGradient | CanvasPattern;
  globalCompositeOperation: string;
  fillRect(x: number, y: number, w: number, h: number): void;
  beginPath(): void;
  arc(x: number, y: number, r: number, start: number, end: number): void;
  fill(): void;
}

export interface HalftoneDrawOptions {
  displayWidth: number;
  displayHeight: number;
  centerX: number;
  centerY: number;
  halftoneSize: number;
  halftoneCMYK: boolean;
  halftoneMove: boolean;
  halftoneVariation: number;
  halftoneTime: number;
  // Raw RGBA pixel buffer to sample from (e.g. ImageData.data) — kept as a
  // plain array-like rather than a full ImageData object so this also
  // accepts the Uint8ClampedArray reconstructed from a transferred
  // ArrayBuffer inside the worker.
  pixels: Uint8ClampedArray;
}

export function drawHalftonePixels(ctx: HalftoneDrawCtx, opts: HalftoneDrawOptions): void {
  const { displayWidth, displayHeight, centerX, centerY, halftoneCMYK, halftoneMove, halftoneVariation, halftoneTime, pixels } = opts;
  const sz = opts.halftoneSize;
  const getHTPixel = (px: number, py: number): [number, number, number] => {
    const ix = Math.max(0, Math.min(displayWidth - 1, Math.round(px)));
    const iy = Math.max(0, Math.min(displayHeight - 1, Math.round(py)));
    const idx = (iy * displayWidth + ix) * 4;
    return [pixels[idx], pixels[idx + 1], pixels[idx + 2]];
  };

  if (halftoneCMYK) {
    // CMYK halftone: 4 rotated dot grids, multiply blend
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, displayWidth, displayHeight);
    ctx.globalCompositeOperation = 'multiply';
    const diag = Math.sqrt(displayWidth * displayWidth + displayHeight * displayHeight) / 2 + sz * 2;
    const steps = Math.min(Math.ceil(diag * 2 / sz), 100);
    const cmykChannels = [
      { angle: 15, color: 'rgba(0,255,255,1)' }, // Cyan
      { angle: 75, color: 'rgba(255,0,255,1)' }, // Magenta
      { angle: 0, color: 'rgba(255,255,0,1)' }, // Yellow
      { angle: 45, color: 'rgba(0,0,0,1)' }, // Key (black)
    ];
    for (let ci = 0; ci < cmykChannels.length; ci++) {
      const ch = cmykChannels[ci];
      const angleRad = ch.angle * Math.PI / 180;
      const cosA = Math.cos(angleRad), sinA = Math.sin(angleRad);
      ctx.fillStyle = ch.color;
      for (let gi = -steps; gi <= steps; gi++) {
        for (let gj = -steps; gj <= steps; gj++) {
          const rx = gi * sz, ry = gj * sz;
          let px = centerX + rx * cosA - ry * sinA;
          let py = centerY + rx * sinA + ry * cosA;
          if (halftoneMove) {
            const seed = Math.sin(gi * 127.1 + gj * 311.7 + ci * 7.31) * 43758.5453;
            const seedFrac = seed - Math.floor(seed);
            const jAngle = seedFrac * Math.PI * 2;
            const jAmt = Math.sin(halftoneTime * 2 + seedFrac * 20) * sz * 0.18;
            px += Math.cos(jAngle) * jAmt;
            py += Math.sin(jAngle) * jAmt;
          }
          if (px < -sz || px > displayWidth + sz || py < -sz || py > displayHeight + sz) continue;
          const [r, g, b] = getHTPixel(px, py);
          const rn = r / 255, gn = g / 255, bn = b / 255;
          const k = 1 - Math.max(rn, gn, bn);
          const denom = k === 1 ? 1 : (1 - k);
          const c = k === 1 ? 0 : (1 - rn - k) / denom;
          const m = k === 1 ? 0 : (1 - gn - k) / denom;
          const y = k === 1 ? 0 : (1 - bn - k) / denom;
          const channelVal = ci === 0 ? c : ci === 1 ? m : ci === 2 ? y : k;
          const s2 = Math.sin(px * 12.9898 + py * 78.233 + (halftoneMove ? halftoneTime * 1000 : 0)) * 43758.5453;
          const vf = 1 + ((s2 - Math.floor(s2)) - 0.5) * halftoneVariation;
          const dotR = channelVal * (sz / 2) * 0.95 * vf;
          if (dotR < 0.3) continue;
          ctx.beginPath();
          ctx.arc(px, py, dotR, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  } else {
    // Standard halftone
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, displayWidth, displayHeight);
    const htHalfCols = Math.ceil(displayWidth / sz / 2) + 1;
    const htHalfRows = Math.ceil(displayHeight / sz / 2) + 1;
    for (let hr = -htHalfRows; hr <= htHalfRows; hr++) {
      for (let hc = -htHalfCols; hc <= htHalfCols; hc++) {
        let x = centerX + hc * sz;
        let y = centerY + hr * sz;
        if (halftoneMove) {
          const seed = Math.sin(hc * 127.1 + hr * 311.7) * 43758.5453;
          const seedFrac = seed - Math.floor(seed);
          const jAngle = seedFrac * Math.PI * 2;
          const jAmt = Math.sin(halftoneTime * 2 + seedFrac * 20) * sz * 0.18;
          x += Math.cos(jAngle) * jAmt;
          y += Math.sin(jAngle) * jAmt;
        }
        const [pr, pg, pb] = getHTPixel(x, y);
        const br = (pr + pg + pb) / 3;
        const s = Math.sin(x * 12.9898 + y * 78.233 + (halftoneMove ? halftoneTime * 1000 : 0)) * 43758.5453;
        const vf = 1 + ((s - Math.floor(s)) - 0.5) * halftoneVariation;
        const dotR = (br / 255) * (sz / 2) * vf;
        ctx.fillStyle = `rgb(${pr},${pg},${pb})`;
        ctx.beginPath();
        ctx.arc(x, y, dotR, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
