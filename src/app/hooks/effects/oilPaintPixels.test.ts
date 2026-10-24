import { describe, it, expect } from 'vitest';
import { oilPaintPixels } from './oilPaintPixels';

// The previous implementation, kept as the reference: rescan the whole window for every pixel.
function naive(data: Uint8ClampedArray, w: number, h: number, radius: number, levels: number, offX = 0, offY = 0) {
  const r = Math.max(1, Math.round(radius)), ox = Math.round(offX), oy = Math.round(offY), lv = Math.max(4, Math.round(levels));
  const src = new Uint8ClampedArray(data);
  const cnt = new Int32Array(lv), sr = new Int32Array(lv), sg = new Int32Array(lv), sb = new Int32Array(lv);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    cnt.fill(0); sr.fill(0); sg.fill(0); sb.fill(0);
    for (let ny = y - r + oy; ny <= y + r + oy; ny++) {
      const cy = ny < 0 ? 0 : ny >= h ? h - 1 : ny;
      for (let nx = x - r + ox; nx <= x + r + ox; nx++) {
        const cx = nx < 0 ? 0 : nx >= w ? w - 1 : nx;
        const si = (cy * w + cx) * 4;
        let b = Math.floor(((src[si] + src[si + 1] + src[si + 2]) / 3 / 256) * lv); if (b >= lv) b = lv - 1;
        cnt[b]++; sr[b] += src[si]; sg[b] += src[si + 1]; sb[b] += src[si + 2];
      }
    }
    let mb = 0, mc = 0; for (let b = 0; b < lv; b++) if (cnt[b] > mc) { mc = cnt[b]; mb = b; }
    const di = (y * w + x) * 4; data[di] = sr[mb] / mc; data[di + 1] = sg[mb] / mc; data[di + 2] = sb[mb] / mc;
  }
}

function noise(w: number, h: number, seed: number) {
  const d = new Uint8ClampedArray(w * h * 4); let s = seed;
  for (let i = 0; i < d.length; i++) { s = (s * 1664525 + 1013904223) >>> 0; d[i] = i % 4 === 3 ? 255 : (s >>> 24); }
  return d;
}

describe('oilPaintPixels', () => {
  it.each([
    [17, 11, 1, 8, 0, 0], [24, 16, 3, 16, 0, 0], [30, 20, 6, 8, 2.4, -1.7], [9, 9, 12, 8, -5, 6], [40, 7, 4, 32, 3.2, 0.4],
  ])('matches the full-window scan exactly (%ix%i, radius %f, %i levels, offset %f,%f)', (w, h, radius, levels, ox, oy) => {
    const a = noise(w, h, w * 31 + h); const b = new Uint8ClampedArray(a);
    oilPaintPixels(a, w, h, radius, levels, ox, oy);
    naive(b, w, h, radius, levels, ox, oy);
    expect(Array.from(a)).toEqual(Array.from(b));
  });

  it('leaves alpha untouched', () => {
    const d = noise(12, 12, 5); const alpha = d.filter((_, i) => i % 4 === 3);
    oilPaintPixels(d, 12, 12, 2, 8);
    expect(Array.from(d.filter((_, i) => i % 4 === 3))).toEqual(Array.from(alpha));
  });

  it('a flat image stays flat', () => {
    const d = new Uint8ClampedArray(10 * 10 * 4).fill(120);
    oilPaintPixels(d, 10, 10, 3, 8);
    expect(new Set(d).size).toBe(1);
  });
});
