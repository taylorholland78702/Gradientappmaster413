import { getScratchImageData } from '../../utils/scratchCanvas';
import { hash2 } from '../../utils/valueNoise';
import { makeDownscaleCapture } from '../../utils/downscaleCapture';

const dc = makeDownscaleCapture(640);

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h, s, l];
}

function hue2rgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) { const v = l * 255; return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    hue2rgb(p, q, h + 1 / 3) * 255,
    hue2rgb(p, q, h) * 255,
    hue2rgb(p, q, h - 1 / 3) * 255,
  ];
}

// Warhol-style repeat grid: the WHOLE source image (not a crop) is redrawn
// into every tile, each tile hue-shifted by its own hashed amount and
// lightly posterized for the flat, screen-printed comic-color look.
export function applyPopArt(P: any): void { // eslint-disable-line @typescript-eslint/no-explicit-any
  const { displayWidth, displayHeight, popTiles, popHueShift, ctx, canvas, putLowResImageData } = P;
  if (canvas.width === 0 || canvas.height === 0) return;

  const { w, h } = dc.getWorkingSize(displayWidth, displayHeight);
  const src = dc.capture(canvas, w, h);
  const s = src.data;
  const out = getScratchImageData('pop-art', ctx, w, h);
  const o = out.data;

  const gridN = Math.max(1, Math.round(popTiles));
  const tileW = w / gridN, tileH = h / gridN;
  const posterizeLevels = 7;
  const step = 255 / (posterizeLevels - 1);

  for (let y = 0; y < h; y++) {
    const ty = Math.min(gridN - 1, Math.floor(y / tileH));
    const ly = y - ty * tileH;
    const srcY = Math.max(0, Math.min(h - 1, Math.round((ly / tileH) * h)));
    for (let x = 0; x < w; x++) {
      const tx = Math.min(gridN - 1, Math.floor(x / tileW));
      const lx = x - tx * tileW;
      const srcX = Math.max(0, Math.min(w - 1, Math.round((lx / tileW) * w)));

      const si = (srcY * w + srcX) * 4;
      let r = s[si], g = s[si + 1], b = s[si + 2];

      if (popHueShift > 0) {
        const [hh, ss, ll] = rgbToHsl(r, g, b);
        const shift = hash2(tx, ty) * (popHueShift / 360);
        [r, g, b] = hslToRgb((hh + shift) % 1, ss, ll);
      }

      r = Math.round(r / step) * step;
      g = Math.round(g / step) * step;
      b = Math.round(b / step) * step;

      const i = (y * w + x) * 4;
      o[i] = r;
      o[i + 1] = g;
      o[i + 2] = b;
      o[i + 3] = 255;
    }
  }

  // Thin white gutter between tiles — the printed-grid/contact-sheet seam.
  const gutterPx = Math.max(1, Math.min(w, h) * 0.006);
  for (let ty = 1; ty < gridN; ty++) {
    const y0 = Math.round(ty * tileH);
    for (let dy = -gutterPx; dy <= gutterPx; dy++) {
      const y = y0 + Math.round(dy);
      if (y < 0 || y >= h) continue;
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        o[i] = 255; o[i + 1] = 255; o[i + 2] = 255;
      }
    }
  }
  for (let tx = 1; tx < gridN; tx++) {
    const x0 = Math.round(tx * tileW);
    for (let dx = -gutterPx; dx <= gutterPx; dx++) {
      const x = x0 + Math.round(dx);
      if (x < 0 || x >= w) continue;
      for (let y = 0; y < h; y++) {
        const i = (y * w + x) * 4;
        o[i] = 255; o[i + 1] = 255; o[i + 2] = 255;
      }
    }
  }

  putLowResImageData(out);
}
