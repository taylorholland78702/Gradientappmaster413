import { describe, it, expect } from 'vitest';
import { buildSlitScanMap, gatherSlitScan, slitScanMapKey } from './slitScanSampling';

// The per-pixel loops this module replaced, kept verbatim as the reference.
function reference(direction: string, buf: { data: Uint8ClampedArray }[], W: number, H: number, ssBufW: number, ssBufH: number, ssDownsample: number, int: number) {
  const out = new Uint8ClampedArray(W * H * 4);
  const frameSel = Math.min(int, 1);
  const midBuf = (buf.length - 1) / 2;
  const sampleBuf = (sx: number, sy: number) => {
    const bx = Math.max(0, Math.min(ssBufW - 1, Math.round(sx * ssDownsample)));
    const by = Math.max(0, Math.min(ssBufH - 1, Math.round(sy * ssDownsample)));
    return (by * ssBufW + bx) * 4;
  };
  const put = (i: number, sf: { data: Uint8ClampedArray }, si: number) => { out[i] = sf.data[si]; out[i + 1] = sf.data[si + 1]; out[i + 2] = sf.data[si + 2]; out[i + 3] = sf.data[si + 3]; };
  if (direction === 'horizontal') {
    for (let y = 0; y < H; y++) {
      const fi = Math.min(Math.floor((y / H) * (buf.length - 1) * frameSel), buf.length - 1); const sf = buf[fi];
      const shift = Math.round(((fi - midBuf) / midBuf) * int * W * 0.35);
      for (let x = 0; x < W; x++) { const sx = ((x + shift) % W + W) % W; put((y * W + x) * 4, sf, sampleBuf(sx, y)); }
    }
  } else if (direction === 'vertical') {
    for (let x = 0; x < W; x++) {
      const fi = Math.min(Math.floor((x / W) * (buf.length - 1) * frameSel), buf.length - 1); const sf = buf[fi];
      const shift = Math.round(((fi - midBuf) / midBuf) * int * H * 0.35);
      for (let y = 0; y < H; y++) { const sy = ((y + shift) % H + H) % H; put((y * W + x) * 4, sf, sampleBuf(x, sy)); }
    }
  } else if (direction === 'radial') {
    const cx = W / 2, cy = H / 2; const md = Math.sqrt(cx * cx + cy * cy);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const d = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
      const fi = Math.min(Math.floor((d / md) * (buf.length - 1) * frameSel), buf.length - 1); const sf = buf[fi];
      const normOffset = Math.min((d / md) * frameSel, 1) * 2 - 1; const shift = normOffset * int * md * 0.35;
      const sd = ((d + shift) % md + md) % md; const k = d > 0 ? sd / d : 0;
      const sx = Math.max(0, Math.min(W - 1, Math.round(cx + (x - cx) * k))); const sy = Math.max(0, Math.min(H - 1, Math.round(cy + (y - cy) * k)));
      put((y * W + x) * 4, sf, sampleBuf(sx, sy));
    }
  } else {
    const cx = W / 2, cy = H / 2;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const angle = Math.atan2(y - cy, x - cx); const norm = (angle + Math.PI) / (Math.PI * 2);
      const fi = Math.min(Math.floor(norm * (buf.length - 1) * frameSel), buf.length - 1); const sf = buf[fi];
      const d = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy)); const normOffset = Math.min(norm * frameSel, 1) * 2 - 1;
      const sAngle = angle + normOffset * int * 1.6; let sd = d * (1 - normOffset * int * 0.25); if (sd < 0) sd = -sd;
      const sx = Math.max(0, Math.min(W - 1, Math.round(cx + Math.cos(sAngle) * sd))); const sy = Math.max(0, Math.min(H - 1, Math.round(cy + Math.sin(sAngle) * sd)));
      put((y * W + x) * 4, sf, sampleBuf(sx, sy));
    }
  }
  return out;
}

function frames(n: number, w: number, h: number) {
  let s = 99;
  return Array.from({ length: n }, () => { const d = new Uint8ClampedArray(w * h * 4); for (let i = 0; i < d.length; i++) { s = (s * 1664525 + 1013904223) >>> 0; d[i] = s >>> 24; } return { data: d }; });
}

describe('slit-scan sampling', () => {
  it.each(['horizontal', 'vertical', 'radial', 'circular', 'something-else'])('%s: the lookup table gives the same picture as the per-pixel loops', (direction) => {
    for (const [W, H, n, int] of [[37, 23, 12, 0.6], [64, 40, 30, 1], [50, 31, 60, 2.5]] as const) {
      const ds = 0.5, bw = Math.max(1, Math.round(W * ds)), bh = Math.max(1, Math.round(H * ds));
      const buf = frames(n, bw, bh);
      const expected = reference(direction, buf, W, H, bw, bh, ds, int);
      const map = buildSlitScanMap({ direction, width: W, height: H, bufLen: n, intensity: int, bufW: bw, bufH: bh, downsample: ds });
      const out = new Uint32Array(W * H);
      gatherSlitScan(out, buf.map(f => new Uint32Array(f.data.buffer)), map, int);
      expect(Array.from(new Uint8ClampedArray(out.buffer))).toEqual(Array.from(expected));
    }
  });

  it('the cache key changes with every setting that changes the picture', () => {
    const base = { direction: 'horizontal', width: 100, height: 60, bufLen: 30, intensity: 1, bufW: 50, bufH: 30, downsample: 0.5 };
    const k = slitScanMapKey(base);
    for (const change of [{ direction: 'vertical' }, { width: 101 }, { height: 61 }, { bufLen: 31 }, { intensity: 1.1 }, { bufW: 51 }, { bufH: 31 }]) {
      expect(slitScanMapKey({ ...base, ...change })).not.toBe(k);
    }
    expect(slitScanMapKey({ ...base })).toBe(k);
  });

  it('radial and circular tables survive the buffer filling up (the frame is picked per pixel)', () => {
    for (const direction of ['radial', 'circular']) {
      const a = { direction, width: 100, height: 60, bufLen: 12, intensity: 1, bufW: 50, bufH: 30, downsample: 0.5 };
      expect(slitScanMapKey({ ...a, bufLen: 40 })).toBe(slitScanMapKey(a));
      expect(slitScanMapKey({ ...a, intensity: 2 })).not.toBe(slitScanMapKey(a));
    }
  });

  it('one radial table gives the right picture for every buffer length as the buffer fills', () => {
    const W = 41, H = 27, ds = 0.5, bw = 21, bh = 14, int = 1.3;
    const map = buildSlitScanMap({ direction: 'radial', width: W, height: H, bufLen: 12, intensity: int, bufW: bw, bufH: bh, downsample: ds });
    for (const n of [12, 13, 25, 47, 60]) {
      const buf = frames(n, bw, bh);
      const out = new Uint32Array(W * H);
      gatherSlitScan(out, buf.map(f => new Uint32Array(f.data.buffer)), map, int);
      expect(Array.from(new Uint8ClampedArray(out.buffer))).toEqual(Array.from(reference('radial', buf, W, H, bw, bh, ds, int)));
    }
  });
});
