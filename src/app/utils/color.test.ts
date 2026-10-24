import { describe, it, expect } from 'vitest';
import {
  hslToRgb, rgbToHsl, adjustColorArrayLength, blendRgb, paletteSegmentFor, sharpenFraction, biasToGamma, evenStops, samplePalette,
  type PaletteSegment,
} from './color';

describe('hslToRgb / rgbToHsl', () => {
  it('round-trips pure red, green, blue', () => {
    const cases: Array<[number, number, number]> = [[0, 100, 50], [120, 100, 50], [240, 100, 50]];
    for (const [h, s, l] of cases) {
      const rgb = hslToRgb(h, s, l);
      const [h2, s2, l2] = rgbToHsl(rgb.r, rgb.g, rgb.b);
      expect(h2).toBeCloseTo(h, 0);
      expect(s2).toBeCloseTo(s, 0);
      expect(l2).toBeCloseTo(l, 0);
    }
  });

  it('produces white for l=100 regardless of hue/saturation', () => {
    expect(hslToRgb(200, 80, 100)).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('produces black for l=0 regardless of hue/saturation', () => {
    expect(hslToRgb(200, 80, 0)).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('produces gray (h=0, s=0) for a true grayscale RGB triple', () => {
    const [h, s] = rgbToHsl(128, 128, 128);
    expect(h).toBe(0);
    expect(s).toBe(0);
  });

  it('clamps output channels to the 0-255 byte range', () => {
    const rgb = hslToRgb(0, 100, 50);
    for (const channel of [rgb.r, rgb.g, rgb.b]) {
      expect(channel).toBeGreaterThanOrEqual(0);
      expect(channel).toBeLessThanOrEqual(255);
    }
  });
});

describe('blendRgb', () => {
  const blue = { r: 0, g: 0, b: 255 };
  const yellow = { r: 255, g: 255, b: 0 };
  const red = { r: 255, g: 0, b: 0 };
  const lum = (c: { r: number; g: number; b: number }) => 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;

  it('srgb mode is the plain per-channel lerp', () => {
    expect(blendRgb(blue, yellow, 0.5, 'srgb')).toEqual({ r: 127.5, g: 127.5, b: 127.5 });
  });

  it('reproduces both endpoints in every mode', () => {
    for (const mode of ['srgb', 'linear', 'oklab', 'oklch'] as const) {
      for (const [c, t] of [[blue, 0], [yellow, 1]] as const) {
        const out = blendRgb(blue, yellow, t, mode);
        expect(out.r).toBeCloseTo(c.r, 0);
        expect(out.g).toBeCloseTo(c.g, 0);
        expect(out.b).toBeCloseTo(c.b, 0);
      }
    }
  });

  it('oklab keeps the blue→yellow midpoint saturated where srgb collapses to grey', () => {
    const srgb = blendRgb(blue, yellow, 0.5, 'srgb');
    const oklab = blendRgb(blue, yellow, 0.5, 'oklab');
    expect(Math.max(srgb.r, srgb.g, srgb.b) - Math.min(srgb.r, srgb.g, srgb.b)).toBeCloseTo(0, 5);
    expect(Math.max(oklab.r, oklab.g, oklab.b) - Math.min(oklab.r, oklab.g, oklab.b)).toBeGreaterThan(5);
  });

  it('oklch routes through intermediate hues instead of straight across the wheel', () => {
    const mid = blendRgb(red, blue, 0.5, 'oklch');
    // Red→blue the short way passes through magenta/purple: strong red AND blue, little green.
    expect(mid.g).toBeLessThan(mid.r);
    expect(mid.g).toBeLessThan(mid.b);
    expect(lum(mid)).toBeGreaterThan(0);
  });

  it('stays inside the 0-255 byte range for out-of-gamut midpoints', () => {
    for (const mode of ['oklab', 'oklch'] as const) {
      const out = blendRgb({ r: 0, g: 255, b: 0 }, { r: 255, g: 0, b: 255 }, 0.37, mode);
      for (const v of [out.r, out.g, out.b]) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(255);
      }
    }
  });
});

describe('palette mapping', () => {
  const seg = (t: number, n: number, stops: number[] | null = null, bias = 0.5, sharp = 0): PaletteSegment =>
    ({ ...paletteSegmentFor(t, n, stops, bias, sharp, { i0: 0, f: 0 }) });

  it('defaults reproduce the original even, linear mapping exactly', () => {
    for (const n of [2, 3, 5, 8]) {
      for (let k = 0; k <= 40; k++) {
        const t = k / 40;
        const pos = t * (n - 1);
        const expectIdx = Math.min(Math.floor(pos), n - 2);
        const got = seg(t, n);
        expect(got.i0).toBe(expectIdx);
        expect(got.f).toBeCloseTo(pos - expectIdx, 12);
      }
    }
  });

  it('even custom stops match the default mapping', () => {
    for (let k = 0; k <= 20; k++) {
      const t = k / 20;
      const a = seg(t, 4), b = seg(t, 4, evenStops(4));
      expect(b.i0).toBe(a.i0);
      expect(b.f).toBeCloseTo(a.f, 12);
    }
  });

  it('custom stops move where each color sits', () => {
    const stops = [0, 0.2, 0.9, 1];
    expect(seg(0.1, 4, stops)).toEqual({ i0: 0, f: 0.5 });
    expect(seg(0.2, 4, stops)).toEqual({ i0: 1, f: 0 });
    expect(seg(0.55, 4, stops).i0).toBe(1);
    expect(seg(0.55, 4, stops).f).toBeCloseTo(0.5, 12);
    expect(seg(0.95, 4, stops).i0).toBe(2);
  });

  it('holds the first/last color outside the outermost stops', () => {
    const stops = [0.3, 0.7];
    expect(seg(0.1, 2, stops)).toEqual({ i0: 0, f: 0 });
    expect(seg(0.9, 2, stops)).toEqual({ i0: 0, f: 1 });
  });

  it('ignores stops whose length no longer matches the palette', () => {
    expect(seg(0.5, 5, [0, 0.1, 1])).toEqual(seg(0.5, 5));
  });

  it('bias 0.5 is neutral; higher favors later colors, lower earlier ones', () => {
    expect(biasToGamma(0.5)).toBe(1);
    const mid = (b: number) => { const g = seg(0.5, 2, null, b); return g.i0 + g.f; };
    expect(mid(0.5)).toBeCloseTo(0.5, 12);
    expect(mid(0.9)).toBeGreaterThan(0.5);
    expect(mid(0.1)).toBeLessThan(0.5);
  });

  it('sharpness 0 leaves the blend untouched and 1 collapses it toward hard bands', () => {
    expect(sharpenFraction(0.3, 0)).toBe(0.3);
    expect(sharpenFraction(0.5, 1)).toBeCloseTo(0.5, 12);
    expect(sharpenFraction(0.2, 1)).toBeLessThan(0.01);
    expect(sharpenFraction(0.8, 1)).toBeGreaterThan(0.99);
    // monotonic at partial sharpness
    let prev = -1;
    for (let k = 0; k <= 50; k++) {
      const v = sharpenFraction(k / 50, 0.6);
      expect(v).toBeGreaterThanOrEqual(prev - 1e-12);
      prev = v;
    }
  });

  it('samples a preview strip through the same mapping', () => {
    const colors = [{ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }];
    const strip = samplePalette(colors, null, 0.5, 0, 'srgb', 5);
    expect(strip.map((c) => Math.round(c.r))).toEqual([0, 64, 128, 191, 255]);
    const hard = samplePalette(colors, [0, 1], 0.5, 1, 'srgb', 5);
    expect(hard[0].r).toBeCloseTo(0, 5);
    expect(hard[4].r).toBeCloseTo(255, 5);
    expect(hard[1].r).toBeLessThan(2);
    expect(hard[3].r).toBeGreaterThan(253);
  });
});

describe('adjustColorArrayLength', () => {
  const c = (r: number) => ({ r, g: 0, b: 0 });
  it('returns the same palette when the length already matches', () => {
    const colors = [c(0), c(100)];
    expect(adjustColorArrayLength(colors, 2)).toBe(colors);
  });
  it('picks evenly spaced colors when shrinking', () => {
    expect(adjustColorArrayLength([c(0), c(10), c(20), c(30)], 2)).toEqual([c(0), c(20)]);
  });
  it('interpolates when growing, keeping the end colors', () => {
    const out = adjustColorArrayLength([c(0), c(100)], 5);
    expect(out.map(x => x.r)).toEqual([0, 25, 50, 75, 100]);
  });
});
