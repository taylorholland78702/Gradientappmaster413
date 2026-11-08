import { effectSpeedsLive } from '../../constants/effectSpeeds';
import { getScratchCanvas, getScratchImageData, getScratchPixelBuffer } from '../../utils/scratchCanvas';
import { smearChroma } from './analogSignal';
import type { EffectCtx } from '../canvasDrawTypes';

// Module-level clock — a plain time accumulator rather than a dedicated
// ref threaded through useMiscState/animValuesRef/useSnapshot, since this
// is purely a cosmetic phase with no undo/redo or Display-mode sync value
// depending on it (same reasoning as applyAuraGlow.ts's agTime).
let crtTime = 0;
let moireSin = new Float32Array(0);
let moireCos = new Float32Array(0);

export function applyCrt(P: EffectCtx): void {
  const {
    ctx,
    canvas,
    displayWidth,
    displayHeight,
    putScaledImageData,
    getDisplayImageData,
    crtIntensity,
    crtScanlineSpacing,
    crtCurve,
    crtGlow,
    crtBleed,
    crtFlicker,
    crtGlass,
    crtMoire,
    crtDrift,
  } = P;
  // RGB-subpixel/scanline mask only — no barrel curvature, corner vignette,
  // or black bezel, so the effect reads as a cathode-ray pixel grid over
  // the full frame rather than a curved TV tube with a visible edge.
  if (canvas.width === 0 || canvas.height === 0) return;
  const amt = Math.max(0, Math.min(1, crtIntensity ?? 0.6));
  if (amt <= 0) return;
  const spacing = Math.max(1, Math.round(crtScanlineSpacing ?? 2));
  // Slow downward roll, like a real tube's scan drifting out of vertical
  // sync — a fixed, non-reactive creep rather than anything audio-driven.
  crtTime += 0.05 * effectSpeedsLive.crt;
  const rollOffset = Math.floor(crtTime);
  const src = getDisplayImageData();
  const dst = getScratchImageData('crt', ctx, displayWidth, displayHeight);
  const clamp01 = (v: number | undefined) => Math.max(0, Math.min(1, v ?? 0));
  const curve = clamp01(crtCurve), glow = clamp01(crtGlow), bleed = clamp01(crtBleed), flicker = clamp01(crtFlicker);
  const glass = clamp01(crtGlass), moire = clamp01(crtMoire), drift = clamp01(crtDrift);
  // Moire: a slow diagonal interference pattern, built from sin(ax + by + c) = sin(ax)cos(by + c) + cos(ax)sin(by + c)
  // so each pixel costs a multiply rather than a trig call.
  if (moire > 0 && (moireSin.length !== displayWidth)) {
    moireSin = new Float32Array(displayWidth); moireCos = new Float32Array(displayWidth);
    for (let x = 0; x < displayWidth; x++) { moireSin[x] = Math.sin(x * 0.09); moireCos[x] = Math.cos(x * 0.09); }
  }

  // Signal first, then glass: colour bleeds sideways off its edges, then the picture is bent onto a bulging tube face
  // (sampled from further out toward the edges, with the corners falling into shadow and past the edge to black).
  let pix: Uint8ClampedArray = src.data;
  if (bleed > 0) {
    const pre = getScratchPixelBuffer('crt-pre', src.data.length);
    pre.set(src.data);
    smearChroma(pre, displayWidth, displayHeight, Math.max(1, Math.round(bleed * 10)));
    pix = pre;
  }
  if (curve > 0) {
    const bent = getScratchPixelBuffer('crt-bent', src.data.length);
    const w = displayWidth, h = displayHeight;
    for (let y = 0; y < h; y++) {
      const ny = (y / (h - 1)) * 2 - 1;
      for (let x = 0; x < w; x++) {
        const nx = (x / (w - 1)) * 2 - 1;
        const r2 = nx * nx + ny * ny;
        const f = 1 + curve * 0.16 * r2;
        const sx = Math.round(((nx * f + 1) / 2) * (w - 1)), sy = Math.round(((ny * f + 1) / 2) * (h - 1));
        const o = (y * w + x) * 4;
        if (sx < 0 || sx >= w || sy < 0 || sy >= h) { bent[o] = 0; bent[o + 1] = 0; bent[o + 2] = 0; bent[o + 3] = 255; continue; }
        const si = (sy * w + sx) * 4;
        const shade = 1 - curve * 0.4 * r2 * r2;
        bent[o] = pix[si] * shade; bent[o + 1] = pix[si + 1] * shade; bent[o + 2] = pix[si + 2] * shade; bent[o + 3] = 255;
      }
    }
    pix = bent;
  }
  const flick = 1 - flicker * 0.25 * Math.random();
  for (let y = 0; y < displayHeight; y++) {
    const rowArg = y * 0.05 + crtTime * 0.3;
    const rowSin = Math.sin(rowArg), rowCos = Math.cos(rowArg);
    for (let x = 0; x < displayWidth; x++) {
      const i = (y * displayWidth + x) * 4;

      // RGB subpixel triad mask — every 3rd column tints toward one
      // channel, faint scanline darkening every `spacing`th row.
      const col = x % 3;
      const moireK = moire > 0 ? 1 - moire * 0.2 * (0.5 + 0.5 * (moireSin[x] * rowCos + moireCos[x] * rowSin)) : 1;
      const rowDark = ((y + rollOffset) % spacing === 0) ? 1 : (1 - 0.35 * amt);
      const subR = col === 0 ? 1 : (1 - 0.5 * amt);
      const subG = col === 1 ? 1 : (1 - 0.5 * amt);
      const subB = col === 2 ? 1 : (1 - 0.5 * amt);

      dst.data[i]     = pix[i]     * flick * moireK * rowDark * subR;
      dst.data[i + 1] = pix[i + 1] * flick * moireK * rowDark * subG;
      dst.data[i + 2] = pix[i + 2] * flick * moireK * rowDark * subB;
      dst.data[i + 3] = 255;
    }
  }
  putScaledImageData(dst);
  // Camera sway, as if the screen were being filmed by hand: the whole frame drifts and breathes a little.
  if (drift > 0) {
    const snap = getScratchCanvas('crt-drift', displayWidth, displayHeight);
    snap.getContext('2d')!.drawImage(canvas, 0, 0, displayWidth, displayHeight);
    const zoom = 1 + drift * 0.02;
    ctx.save();
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, displayWidth, displayHeight);
    ctx.translate(displayWidth / 2 + Math.sin(crtTime * 0.9) * drift * 8, displayHeight / 2 + Math.cos(crtTime * 0.7) * drift * 5);
    ctx.scale(zoom, zoom);
    ctx.drawImage(snap, -displayWidth / 2, -displayHeight / 2, displayWidth, displayHeight);
    ctx.restore();
  }
  // Phosphor glow: a blurred copy of the lit picture added back over itself.
  if (glow > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = glow * 0.7;
    ctx.filter = `blur(${Math.round(4 + glow * 8)}px)`;
    ctx.drawImage(canvas, 0, 0, displayWidth, displayHeight);
    ctx.restore();
  }
  // Glass: a soft diagonal reflection across the face of the screen.
  if (glass > 0) {
    const g = ctx.createLinearGradient(0, 0, displayWidth * 0.8, displayHeight * 0.8);
    g.addColorStop(0, `rgba(255,255,255,${0.3 * glass})`);
    g.addColorStop(0.28, `rgba(255,255,255,${0.08 * glass})`);
    g.addColorStop(0.45, 'rgba(255,255,255,0)');
    ctx.save();
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, displayWidth, displayHeight);
    ctx.restore();
  }
}
