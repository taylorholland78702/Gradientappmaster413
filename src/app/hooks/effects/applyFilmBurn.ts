import { isFlashReduced } from '../useReduceFlash';
import type { EffectCtx } from '../canvasDrawTypes';

let time = 0;
let lastTime = 0;
let flashLeft = 0;

// Film damage laid over the picture: burn glows that drift in from the edges, dust and hairs, vertical scratches, an
// exposure flicker like the head of a reel, and occasional hot frames. Flicker and Flash are the parts that can strobe,
// so both follow the Reduce flashing setting: with it on, Flash is off and Flicker is held to a faint, slow wobble.
export function applyFilmBurn(P: EffectCtx): void {
  const { ctx, canvas, displayWidth: W, displayHeight: H, filmBurnAmount, filmBurnDust, filmBurnScratches, filmBurnFlicker, filmBurnFlash, filmBurnSpeed } = P;
  if (canvas.width === 0 || canvas.height === 0 || W < 16 || H < 16) return;
  const now = performance.now();
  const dt = lastTime ? Math.min(0.05, (now - lastTime) / 1000) : 0;
  lastTime = now;
  time += dt * Math.max(0, filmBurnSpeed ?? 1);
  const clamp01 = (v: number | undefined) => Math.max(0, Math.min(1, v ?? 0));
  const burn = clamp01(filmBurnAmount), dust = clamp01(filmBurnDust), scratches = clamp01(filmBurnScratches);
  const reduced = isFlashReduced();
  const flicker = reduced ? Math.min(0.1, clamp01(filmBurnFlicker)) : clamp01(filmBurnFlicker);
  const flash = reduced ? 0 : clamp01(filmBurnFlash);

  ctx.save();
  if (burn > 0) {
    ctx.globalCompositeOperation = 'screen';
    const blobs = [
      { x: 0.1 + 0.15 * Math.sin(time * 0.3), y: 0.35 + 0.25 * Math.sin(time * 0.21 + 1), r: 0.8 },
      { x: 0.92 + 0.08 * Math.sin(time * 0.27 + 2), y: 0.7 + 0.2 * Math.sin(time * 0.17), r: 0.75 },
      { x: 0.5 + 0.3 * Math.sin(time * 0.13 + 4), y: -0.05, r: 0.7 },
    ];
    for (const b of blobs) {
      const R = b.r * Math.max(W, H);
      const g = ctx.createRadialGradient(b.x * W, b.y * H, 0, b.x * W, b.y * H, R);
      g.addColorStop(0, `rgba(255,190,70,${burn})`);
      g.addColorStop(0.45, `rgba(235,70,15,${0.7 * burn})`);
      g.addColorStop(1, 'rgba(120,10,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
  }
  ctx.globalCompositeOperation = 'source-over';
  if (dust > 0) {
    const count = Math.round(dust * 160);
    for (let k = 0; k < count; k++) {
      const x = Math.random() * W, y = Math.random() * H, r = 0.4 + Math.random() * 1.4;
      ctx.fillStyle = Math.random() < 0.7 ? `rgba(255,255,255,${0.35 + Math.random() * 0.5})` : `rgba(0,0,0,${0.4 + Math.random() * 0.4})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 0.8;
    for (let k = 0; k < Math.round(dust * 4); k++) {
      const x = Math.random() * W, y = Math.random() * H, len = 6 + Math.random() * 22;
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + len * 0.5, y + (Math.random() - 0.5) * len, x + len * (Math.random() - 0.5) * 2, y + len * 0.6);
      ctx.stroke();
    }
  }
  if (scratches > 0) {
    ctx.lineWidth = 1;
    for (let k = 0; k < Math.round(scratches * 6); k++) {
      if (Math.random() < 0.5) continue;
      const x = Math.random() * W, y0 = Math.random() * H * 0.6, len = H * (0.2 + Math.random() * 0.6);
      ctx.strokeStyle = `rgba(255,255,255,${0.2 + Math.random() * 0.4})`;
      ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x + (Math.random() - 0.5) * 6, Math.min(H, y0 + len)); ctx.stroke();
    }
  }
  if (flicker > 0) {
    // Dim the frame by a different random amount every draw, like uneven exposure.
    ctx.fillStyle = `rgba(0,0,0,${flicker * 0.35 * Math.random()})`;
    ctx.fillRect(0, 0, W, H);
  }
  if (flash > 0) {
    if (flashLeft <= 0 && Math.random() < dt * flash * 1.2) flashLeft = 0.07;
    if (flashLeft > 0) {
      flashLeft -= dt;
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(255,140,40,0.7)';
      ctx.fillRect(0, 0, W, H);
    }
  }
  ctx.restore();
}
