import type { EffectCtx } from '../canvasDrawTypes';

// Where the smear pattern is. Advanced by real time so the Speed slider holds steady at any frame rate.
let phase = 0;
let lastTime = 0;

const hash = (n: number): number => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// Pixel-stretch glitch: the picture is cut into bands of rows (or columns), and in the bands that are picked each
// row holds one pixel and drags it sideways into a long streak. The picked bands and where the streaks start change a
// few times a second, with each start drifting between changes, so the picture keeps its shape and sheds flat streaks.
export function applyRowSmear(P: EffectCtx): void {
  const { getDisplayImageData, putScaledImageData, rowSmearLength, rowSmearAmount, rowSmearDirection, rowSmearSpeed } = P;
  const img = getDisplayImageData();
  const w = img.width, h = img.height;
  if (w < 2 || h < 2) return;

  const now = performance.now();
  const dt = lastTime ? Math.min(0.05, (now - lastTime) / 1000) : 0;
  lastTime = now;
  phase += dt * Math.max(0, rowSmearSpeed ?? 1);

  const horizontal = rowSmearDirection !== 'vertical';
  const lines = horizontal ? h : w;
  const span = horizontal ? w : h;
  const amount = Math.max(0, Math.min(1, rowSmearAmount ?? 0.5));
  const maxLen = Math.max(1, Math.round((Math.max(1, rowSmearLength ?? 40) / 100) * span));
  const tick = Math.floor(phase * 1.5);
  const drift = (phase * 1.5 - tick) * span * 0.25;
  const px = new Uint32Array(img.data.buffer);

  for (let line = 0, band = 0; line < lines; band++) {
    const bandSize = 2 + Math.floor(hash(band * 1.7) * lines * 0.06);
    const end = Math.min(lines, line + bandSize);
    if (hash(band * 3.3 + tick * 13.1) < amount) {
      const start = Math.floor((hash(band * 5.9 + tick * 7.7) * span + drift) % span);
      const len = Math.max(2, Math.floor(maxLen * (0.35 + 0.65 * hash(band * 9.1 + tick * 2.3))));
      const dir = hash(band * 2.9 + tick * 4.1) > 0.5 ? 1 : -1;
      const from = dir > 0 ? start : Math.max(0, start - len);
      const to = dir > 0 ? Math.min(span, start + len) : start;
      for (let l = line; l < end; l++) {
        if (horizontal) {
          const row = l * w;
          const held = px[row + start];
          for (let x = from; x < to; x++) px[row + x] = held;
        } else {
          const held = px[start * w + l];
          for (let y = from; y < to; y++) px[y * w + l] = held;
        }
      }
    }
    line = end;
  }
  putScaledImageData(img);
}
