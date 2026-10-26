import { getScratchImageData } from '../../utils/scratchCanvas';
import { getActivePaletteMap, samplePalette } from '../../utils/color';
import type { StyleFieldId } from './drawStyleFieldGL';
import type { DrawCtx } from '../canvasDrawTypes';

// The styled-field gradients are WebGL2 shaders. Where WebGL2 is missing (or a
// shader won't compile) this draws a cheap CPU stand-in instead: not the exact
// look, but the same family of picture — glow on a dark ground, soft bands, or a
// soft noise field — colored from the live palette, scale and clock. It renders at
// reduced resolution and is stretched up, like the other CPU gradients.

const hash = (x: number, y: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const smooth = (t: number) => t * t * (3 - 2 * t);
const vnoise = (x: number, y: number) => {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = smooth(x - ix), fy = smooth(y - iy);
  const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
};
const fbm = (x: number, y: number) => {
  let v = 0, a = 0.5;
  for (let i = 0; i < 3; i++) { v += a * vnoise(x, y); x = x * 2.02 + 1.7; y = y * 2.02 + 9.2; a *= 0.5; }
  return v / 0.875;
};
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

type Family = 'glow' | 'bands' | 'field';
const FAMILY: Record<StyleFieldId, Family> = {
  'edge-glow': 'glow', curtains: 'glow', eclipse: 'glow', rays: 'glow',
  bokeh: 'glow', vortex: 'glow', spectral: 'glow', embers: 'glow',
  waves: 'bands', ribbon: 'bands', bands: 'bands',
  smoke: 'field', glass: 'field', mesh: 'field', mercury: 'field', contour: 'field', tunnel: 'field',
  prism: 'field', raindrops: 'field', holographic: 'field',
  drape: 'field', 'flow-mesh': 'field', iridescent: 'field',
};

// Light intensity (0..~1.2) for the dark-ground looks, at plane position (x, y),
// screen position (u, v), time t.
function glowIntensity(id: StyleFieldId, x: number, y: number, u: number, v: number, t: number): number {
  const r = Math.hypot(x, y), a = Math.atan2(y, x);
  switch (id) {
    case 'eclipse': {
      const R = 0.82;
      const side = 0.62 + 0.38 * Math.cos(a - t * 0.12 - 0.8);
      return (Math.exp(-(((r - R) / 0.075) ** 2)) * 1.15 + (r > R ? Math.exp(-(r - R) * 2.1) * 0.55 : 0)) * side;
    }
    case 'vortex': {
      const q = Math.hypot(x, y * 1.75);
      const aa = Math.atan2(y * 1.75, x);
      const R = 1.32;
      const hot = Math.pow(0.5 + 0.5 * Math.cos(aa * 2 - t * 0.5), 2.5);
      return Math.exp(-(((q - R) / 0.12) ** 2)) * (0.28 + 0.95 * hot) + Math.exp(-Math.abs(q - R) * 2) * 0.3 * (0.45 + 0.55 * hot);
    }
    case 'rays': {
      const spokes = 0.5 + 0.5 * Math.sin(a * 14 + t * 0.28);
      const reach = clamp01((r - 0.15) / 1.65);
      return (0.1 + 0.55 * reach) * (0.55 + 0.75 * spokes * spokes) + 0.28 * v;
    }
    case 'edge-glow': {
      const wob = (vnoise(x * 0.9, t * 0.1) - 0.45) * 0.3;
      return Math.exp(-Math.pow(Math.max(1 - v + wob + 0.2, 0) / 0.44, 1.35)) + 0.1 * Math.exp(-Math.pow(v / 0.3, 1.6));
    }
    case 'curtains': {
      const xx = x * 1.1;
      const fold = 0.5 + 0.5 * Math.sin(xx * 2.2 + 1.5 * Math.sin(xx * 1.1 + t * 0.15) + t * 0.2);
      const fb = 1 - v;
      const crest = 0.55 + 0.8 * fold;
      return (0.3 + 0.7 * fold) * clamp01((crest - fb) / crest) * 0.7 + 0.14 * Math.exp(-Math.pow(fb / 0.22, 1.5));
    }
    case 'spectral': {
      const d = Math.hypot(x + 2.2, y + 1.7);
      const D = 2.45 + 0.2 * Math.sin(t * 0.18);
      return Math.exp(-(((d - D) / 0.95) ** 2));
    }
    default: {
      // bokeh / embers: soft dots on a jittered grid
      const sc = id === 'bokeh' ? 1.2 : 2.4;
      const qx = x * sc + t * 0.02, qy = y * sc - t * (id === 'embers' ? 0.25 : 0.016);
      const ix = Math.floor(qx), iy = Math.floor(qy);
      let I = 0;
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
        const cx = ix + i, cy = iy + j;
        if (hash(cx, cy) < 0.35) continue;
        const px = cx + 0.2 + 0.6 * hash(cx + 3, cy), py = cy + 0.2 + 0.6 * hash(cx, cy + 7);
        const rad = id === 'bokeh' ? 0.2 + 0.15 * hash(cx, cy + 1) : 0.07;
        const d = Math.hypot(qx - px, qy - py);
        I += id === 'bokeh' ? clamp01((rad - d) / (rad * 0.3)) * 0.55 : Math.exp(-((d / rad) ** 2)) * 1.2;
      }
      return I;
    }
  }
}

// Palette position (0..1) for the band and field looks.
function fieldValue(id: StyleFieldId, x: number, y: number, u: number, v: number, t: number): number {
  switch (id) {
    case 'waves': case 'ribbon': {
      const w = y * 1.1 + 0.3 * Math.sin(x * 1.0 + t * 0.26) + 0.09 * Math.sin(x * 2.4 - t * 0.33);
      return 0.5 + 0.5 * Math.sin(w * (id === 'ribbon' ? 2.2 : 4.2));
    }
    case 'bands': {
      const w = y * 0.8 + 0.25 * Math.sin(x * 0.9 + t * 0.2) + 0.12 * Math.sin(x * 2.1 - t * 0.27 + y);
      const s = (0.5 + 0.5 * Math.sin(w * 1.4)) * 6;
      const f = s - Math.floor(s);
      return (Math.floor(s) + smooth(clamp01((f - 0.88) / 0.12))) / 6;
    }
    case 'tunnel': {
      const r = Math.max(Math.hypot(u - 0.5, v - 0.5) * 2, 0.02);
      return (1 / r * 0.5 + t * 0.35 + Math.atan2(v - 0.5, u - 0.5) * 0.1) % 1;
    }
    case 'contour': {
      const f = fbm(x * 0.45 + t * 0.02, y * 0.45);
      const k = f * 14;
      return Math.abs(k - Math.round(k)) < 0.12 ? 1 : clamp01(f * 1.25 - 0.1) * 0.5;
    }
    case 'prism': {
      const s = (x * 0.85 + y * 0.52) * 3.4 + Math.sin(y * 1.7 + t * 0.18) * 0.9;
      return (hash(Math.floor(s), 3.1) * 0.7 + (s - Math.floor(s)) * 0.45 + t * 0.03) % 1;
    }
    case 'mesh': case 'flow-mesh': case 'drape': case 'glass': case 'mercury': {
      const wx = fbm(x * 0.55 + t * 0.05, y * 0.55), wy = fbm(x * 0.55 + 4, y * 0.55 - t * 0.04);
      return clamp01(fbm(x * 0.5 + wx * 1.5, y * 0.5 + wy * 1.5 + t * 0.03) * 1.15);
    }
    case 'holographic': case 'iridescent':
      return (fbm(x * 0.6 + t * 0.03, y * 0.6 - t * 0.02) * 2.2 + (x * 0.2 + y * 0.35) + t * 0.04) % 1;
    default: {
      // smoke, raindrops, halftone-screen: warped fbm
      const qx = fbm(x + t * 0.08, y), qy = fbm(x + 5.2, y + 1.3 - t * 0.06);
      return clamp01(fbm(x + 3.2 * qx, y + 3.2 * qy) * 1.2);
    }
  }
}

export function drawStyleFieldCPU(id: StyleFieldId, P: DrawCtx): CanvasGradient | undefined {
  const { ctx, displayWidth, displayHeight, gradientColors, fieldScale, fieldAnimTime, structuralSeed, zoom, putLowResImageData } = P;
  if (!gradientColors?.length) return undefined;
  const W = Math.max(8, Math.min(320, Math.round(displayWidth * 0.3)));
  const H = Math.max(8, Math.round(W * displayHeight / displayWidth));
  const img = getScratchImageData('styleCpu', ctx, W, H);
  const d = img.data;

  const { stops, bias, sharp } = getActivePaletteMap();
  const LUT_N = 128;
  const lut = samplePalette(gradientColors, stops ?? null, bias ?? 0.5, sharp ?? 0, LUT_N);
  const at = (t: number) => lut[Math.min(LUT_N - 1, Math.max(0, Math.round(t * (LUT_N - 1))))];

  const t = fieldAnimTime ?? 0;
  const scale = 3 * (fieldScale ?? 1) / Math.max(0.05, zoom ?? 1);
  const seed = ((structuralSeed ?? 0) % 97);
  const family = FAMILY[id] ?? 'field';
  const deep = at(0);
  for (let py = 0; py < H; py++) {
    const v = py / (H - 1);
    for (let px = 0; px < W; px++) {
      const u = px / (W - 1);
      const x = (u - 0.5) * (W / H) * scale + seed * 1.7;
      const y = (v - 0.5) * scale + seed * 2.3;
      let r: number, g: number, b: number;
      if (family === 'glow') {
        // Position without the seed offset, so the light stays where the frame centers it.
        const cx = (u - 0.5) * (W / H) * scale, cy = (v - 0.5) * scale;
        const I = Math.max(0, glowIntensity(id, cx, cy, u, v, t));
        const c = at(clamp01(0.12 + 0.88 * I));
        const k = clamp01(I / 0.8);
        const lum = 0.3 + 0.7 * smooth(clamp01(I));
        r = (deep.r * 0.1 * (1 - k) + c.r * k) * lum;
        g = (deep.g * 0.1 * (1 - k) + c.g * k) * lum;
        b = (deep.b * 0.1 * (1 - k) + c.b * k) * lum;
      } else {
        const c = at(clamp01(fieldValue(id, x, y, u, v, t)));
        r = c.r; g = c.g; b = c.b;
      }
      const i = (py * W + px) * 4;
      d[i] = r > 255 ? 255 : r; d[i + 1] = g > 255 ? 255 : g; d[i + 2] = b > 255 ? 255 : b; d[i + 3] = 255;
    }
  }
  putLowResImageData(img);
  return undefined;
}
