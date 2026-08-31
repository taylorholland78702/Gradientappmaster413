import { getScratchImageData } from '../../utils/scratchCanvas';
import { getDownscaleWorkingSize, captureDownscaledSource } from '../../utils/downscaleCapture';
import { valueNoise } from '../../utils/valueNoise';

// Working resolution cap — see downscaleCapture.ts.
const MAX_DIM = 640;

// Two classic Surrealist devices on whatever's already on the canvas:
// a Dalí-esque vertical melt/sag (each column streaks downward by its own
// smoothly-varying amount, so it reads as dripping rather than a uniform
// stretch) and an uncanny mirror-symmetry blend (each pixel partially
// ghosted with its horizontal mirror, the "double" trope). Both are 0 at
// their sliders' minimum, so a photo/gradient with neither dialed up looks
// untouched.
export function applySurrealism(P: any): void { // eslint-disable-line @typescript-eslint/no-explicit-any
  const { displayWidth, displayHeight, surrealMelt, surrealMirror, ctx, canvas, putLowResImageData } = P;
  if (canvas.width === 0 || canvas.height === 0) return;

  const { w, h } = getDownscaleWorkingSize(displayWidth, displayHeight, MAX_DIM);
  const src = captureDownscaledSource('surrealism', canvas, w, h);
  const s = src.data;
  const out = getScratchImageData('surrealism', ctx, w, h);
  const o = out.data;

  // Per-column drip magnitude, precomputed once — smooth low-frequency
  // noise so neighboring columns drip similar amounts (streaks, not static).
  const dripScale = 1 / 40;
  const maxDrip = surrealMelt * h * 0.4;
  const dripByColumn = new Float32Array(w);
  for (let x = 0; x < w; x++) {
    dripByColumn[x] = maxDrip * (0.15 + 0.85 * valueNoise(x * dripScale, 12.4));
  }
  const mirrorBlend = Math.min(0.5, surrealMirror * 0.5);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;

      // Lower rows pull from further up their own column — the drip grows
      // toward the bottom instead of shifting the whole column uniformly.
      const sy = Math.max(0, Math.min(h - 1, Math.round(y - dripByColumn[x] * (y / h))));
      const si = (sy * w + x) * 4;
      let r = s[si], g = s[si + 1], b = s[si + 2];

      if (mirrorBlend > 0) {
        const mx = w - 1 - x;
        const mi = (sy * w + mx) * 4;
        r = r + (s[mi] - r) * mirrorBlend;
        g = g + (s[mi + 1] - g) * mirrorBlend;
        b = b + (s[mi + 2] - b) * mirrorBlend;
      }

      o[i] = r;
      o[i + 1] = g;
      o[i + 2] = b;
      o[i + 3] = 255;
    }
  }

  putLowResImageData(out);
}
