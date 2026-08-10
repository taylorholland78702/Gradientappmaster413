import { describe, it, expect } from 'vitest';
import { hslToRgb, rgbToHsl } from './color';

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
