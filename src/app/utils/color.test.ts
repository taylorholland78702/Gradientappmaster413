import { describe, it, expect } from 'vitest';
import { hslToRgb, rgbToHsl, blendRgb } from './color';

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
    for (const mode of ['srgb', 'oklab', 'oklch'] as const) {
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
