import { describe, it, expect } from 'vitest';
import { quantize, applyPalette } from 'gifenc';
import { ditherRGBA, mapToPalette, quantizeFrame } from './gifDither';

// A smooth full-frame hue sweep, like the Angle gradient: the worst case for a 256-colour GIF.
function sweep(w: number, h: number) {
  const d = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const t = x / w, i = (y * w + x) * 4;
    d[i] = 128 + 127 * Math.sin(t * 6.283); d[i + 1] = 128 + 127 * Math.sin(t * 6.283 + 2.09); d[i + 2] = 128 + 127 * Math.sin(t * 6.283 + 4.19) * (0.6 + 0.4 * y / h); d[i + 3] = 255;
  }
  return d;
}

// How far the picture is from the original once you look at it from a distance: the error of 8x8 block averages.
function blurredError(original: Uint8ClampedArray, coded: Uint8ClampedArray, w: number, h: number) {
  let sum = 0, n = 0;
  for (let by = 0; by + 8 <= h; by += 8) for (let bx = 0; bx + 8 <= w; bx += 8) {
    for (let c = 0; c < 3; c++) {
      let a = 0, b = 0;
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const i = ((by + y) * w + bx + x) * 4 + c; a += original[i]; b += coded[i]; }
      sum += Math.abs(a - b) / 64; n++;
    }
  }
  return sum / n;
}

function decode(index: Uint8Array, palette: number[][]) {
  const out = new Uint8ClampedArray(index.length * 4);
  index.forEach((p, i) => { out[i * 4] = palette[p][0]; out[i * 4 + 1] = palette[p][1]; out[i * 4 + 2] = palette[p][2]; out[i * 4 + 3] = 255; });
  return out;
}

describe('ditherRGBA', () => {
  it('leaves alpha alone and stays inside 0..255', () => {
    const d = new Uint8ClampedArray([0, 255, 128, 77, 255, 0, 3, 200]);
    const out = ditherRGBA(d, 2, 1, 40);
    expect(out[3]).toBe(77); expect(out[7]).toBe(200);
    expect(Math.min(...out)).toBeGreaterThanOrEqual(0); expect(Math.max(...out)).toBeLessThanOrEqual(255);
  });
  it('moves each channel by at most half the amplitude', () => {
    const d = new Uint8ClampedArray(16 * 16 * 4).fill(100);
    const out = ditherRGBA(d, 16, 16, 14);
    for (let i = 0; i < out.length; i += 4) expect(Math.abs(out[i] - 100)).toBeLessThanOrEqual(7);
  });
  it('is the same every time and does not change the input', () => {
    const d = sweep(24, 16), copy = new Uint8ClampedArray(d);
    expect(Array.from(ditherRGBA(d, 24, 16))).toEqual(Array.from(ditherRGBA(d, 24, 16)));
    expect(Array.from(d)).toEqual(Array.from(copy));
  });
  it('averages out to the original colour', () => {
    const d = new Uint8ClampedArray(64 * 64 * 4).fill(120);
    const out = ditherRGBA(d, 64, 64);
    let s = 0; for (let i = 0; i < out.length; i += 4) s += out[i];
    expect(s / (64 * 64)).toBeCloseTo(120, 0);
  });
});

describe('GIF frames', () => {
  const conic = (w: number, h: number) => {
    const d = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const a = Math.atan2(y - h / 2, x - w / 2) / 6.283 + 0.5, r = Math.hypot(x - w / 2, y - h / 2) / w, i = (y * w + x) * 4;
      d[i] = 150 + 100 * Math.sin(a * 6.283) - 60 * r; d[i + 1] = 170 + 80 * Math.sin(a * 6.283 + 2.09) - 40 * r; d[i + 2] = 200 + 55 * Math.sin(a * 6.283 + 4.19) - 80 * r; d[i + 3] = 255;
    }
    return d;
  };

  it('matches a smooth hue sweep far better than gifenc\'s own 5-6-5 lookup, seen from a distance', () => {
    const w = 280, h = 176, src = conic(w, h);
    const palette = quantize(src, 256);
    const before = blurredError(src, decode(applyPalette(src, palette), palette), w, h);
    const { palette: p2, index } = quantizeFrame(src, w, h);
    const after = blurredError(src, decode(index, p2), w, h);
    expect(after).toBeLessThan(before * 0.6);
  });

  it('mapToPalette picks the nearest colour and handles every channel value', () => {
    const palette = [[0, 0, 0], [255, 255, 255], [255, 0, 0]];
    const px = new Uint8ClampedArray([5, 5, 5, 255, 250, 250, 250, 255, 240, 20, 10, 255, 128, 128, 128, 255]);
    expect(Array.from(mapToPalette(px, palette)).slice(0, 3)).toEqual([0, 1, 2]);
    const all = new Uint8ClampedArray(256 * 4); for (let v = 0; v < 256; v++) all.set([v, 255 - v, v, 255], v * 4);
    expect(mapToPalette(all, palette).length).toBe(256);
  });

  it('a flat colour stays one colour (dithering must not create noise out of nothing the palette can hold)', () => {
    const flat = new Uint8ClampedArray(32 * 32 * 4); for (let i = 0; i < flat.length; i += 4) flat.set([200, 40, 90, 255], i);
    const { palette, index } = quantizeFrame(flat, 32, 32);
    const colours = new Set(Array.from(index).map(i => palette[i].join()));
    expect(colours.size).toBeLessThanOrEqual(2);
  });
});
