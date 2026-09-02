import { getScratchImageData } from '../../utils/scratchCanvas';
import { getDownscaleWorkingSize, captureDownscaledSource } from '../../utils/downscaleCapture';
import { hash2 } from '../../utils/valueNoise';
import { TWO_PI } from '../../constants/gradientEffects';

// Working resolution cap — see downscaleCapture.ts. Keeps cost roughly
// constant regardless of the real canvas size, and keeps panel/border sizes
// (defined in absolute pixels) looking consistent across screen sizes too.
const MAX_DIM = 640;

// Module-level clock — see applyAuraGlow.ts's agTime for why this is a
// plain accumulator rather than threaded state: purely cosmetic, no
// undo/redo or Display-mode value depends on it.
let dadaTime = 0;

// Photomontage cut-up: slices whatever's already on the canvas into a grid
// of panels, then reassembles it with each panel reading from a different
// (deterministically hashed, so it's stable frame to frame) part of the
// same image, flipped or rotated 180°, with a torn-paper border between
// panels — the classic Dada technique of recombining found material into
// something incongruous, applied to the gradient itself rather than
// requiring an uploaded photo.
export function applyDada(P: any): void { // eslint-disable-line @typescript-eslint/no-explicit-any
  const { displayWidth, displayHeight, dadaPanels, dadaChaos, ctx, canvas, putLowResImageData } = P;
  if (canvas.width === 0 || canvas.height === 0) return;

  const { w, h } = getDownscaleWorkingSize(displayWidth, displayHeight, MAX_DIM);
  const src = captureDownscaledSource('dada', canvas, w, h);
  const s = src.data;
  const out = getScratchImageData('dada', ctx, w, h);
  const o = out.data;

  const cols = Math.max(1, Math.round(dadaPanels));
  const rows = Math.max(1, Math.round(dadaPanels * (h / w)));
  const cellW = w / cols;
  const cellH = h / rows;
  const borderPx = Math.max(1, Math.min(w, h) * 0.006);

  // Each panel's sampling window creeps in its own slow, independent
  // ellipse (phase seeded per panel via hash2) — the montage keeps
  // resettling rather than sitting frozen once cut, on top of whatever
  // jitter dadaChaos already adds.
  dadaTime += 0.02;

  for (let y = 0; y < h; y++) {
    const panelY = Math.min(rows - 1, Math.floor(y / cellH));
    const ly = y - panelY * cellH;
    const distTop = ly, distBottom = cellH - ly;
    for (let x = 0; x < w; x++) {
      const panelX = Math.min(cols - 1, Math.floor(x / cellW));
      const lx = x - panelX * cellW;

      const transform = Math.floor(hash2(panelX, panelY) * 4);
      let tx = lx, ty = ly;
      if (transform === 1) tx = cellW - lx;
      else if (transform === 2) ty = cellH - ly;
      else if (transform === 3) { tx = cellW - lx; ty = cellH - ly; }

      const jitterX = (hash2(panelX + 500, panelY + 500) - 0.5) * 2 * dadaChaos * w;
      const jitterY = (hash2(panelX + 900, panelY + 900) - 0.5) * 2 * dadaChaos * h;
      const driftPhase = hash2(panelX + 200, panelY + 200) * TWO_PI;
      const driftX = Math.sin(dadaTime + driftPhase) * cellW * 0.04;
      const driftY = Math.cos(dadaTime * 0.8 + driftPhase) * cellH * 0.04;

      let sx = Math.round(panelX * cellW + tx + jitterX + driftX);
      let sy = Math.round(panelY * cellH + ty + jitterY + driftY);
      sx = ((sx % w) + w) % w;
      sy = ((sy % h) + h) % h;

      const si = (sy * w + sx) * 4;
      const i = (y * w + x) * 4;

      // Torn-paper gutter — a thin pale seam right at each panel edge,
      // fading in over the last few pixels rather than a hard 1px line.
      const distLeft = lx, distRight = cellW - lx;
      const edgeDist = Math.min(distTop, distBottom, distLeft, distRight);
      const seam = edgeDist < borderPx ? 1 - edgeDist / borderPx : 0;

      o[i] = s[si] + (235 - s[si]) * seam;
      o[i + 1] = s[si + 1] + (235 - s[si + 1]) * seam;
      o[i + 2] = s[si + 2] + (235 - s[si + 2]) * seam;
      o[i + 3] = 255;
    }
  }

  putLowResImageData(out);
}
