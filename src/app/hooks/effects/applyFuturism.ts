// Stroboscopic multiplication — Balla's "Dynamism of a Dog on a Leash" /
// Duchamp's "Nude Descending a Staircase": the same form repeated along a
// motion vector at falling opacity, reading as movement frozen mid-stride
// rather than a single static pose. Pure Canvas 2D drawImage compositing
// (snapshot the current frame, redraw it several times offset along a
// fixed direction with decreasing globalAlpha) rather than per-pixel math
// — cheap regardless of real canvas size since it's GPU compositing, no
// working-resolution cap needed like the ImageData-based effects this
// session.
let snapshot: HTMLCanvasElement | null = null;

export function applyFuturism(P: any): void { // eslint-disable-line @typescript-eslint/no-explicit-any
  const { displayWidth, displayHeight, futurismEchoes, futurismSpread, ctx, canvas } = P;
  if (canvas.width === 0 || canvas.height === 0) return;

  if (!snapshot) snapshot = document.createElement('canvas');
  if (snapshot.width !== canvas.width || snapshot.height !== canvas.height) {
    snapshot.width = canvas.width;
    snapshot.height = canvas.height;
  }
  (snapshot.getContext('2d') as CanvasRenderingContext2D).drawImage(canvas, 0, 0);

  const echoes = Math.max(1, Math.round(futurismEchoes));
  // Fixed forward-motion direction (up and to the right) rather than a
  // third slider — enough directions already vary via Spread/Echoes to
  // keep this feeling distinct shuffle to shuffle.
  const angleRad = (-30 * Math.PI) / 180;
  const stepX = Math.cos(angleRad) * futurismSpread;
  const stepY = Math.sin(angleRad) * futurismSpread;

  ctx.save();
  ctx.clearRect(0, 0, displayWidth, displayHeight);
  for (let i = echoes - 1; i >= 0; i--) {
    ctx.globalAlpha = i === 0 ? 1 : (1 - i / echoes) * 0.55;
    ctx.drawImage(snapshot, i * stepX, i * stepY, displayWidth, displayHeight);
  }
  ctx.restore();
}
