import { describe, it, expect } from 'vitest';
import { paletteStats, lightnessBucket, saturationBucket, contrastBucket, speedBucket } from './paletteStats';

describe('palette stats', () => {
  it('reads a dark muted palette as dark, muted and low contrast', () => {
    const s = paletteStats([{ r: 30, g: 28, b: 34 }, { r: 40, g: 38, b: 46 }, { r: 52, g: 50, b: 58 }])!;
    expect(lightnessBucket(s.lightness)).toBe('dark palette');
    expect(saturationBucket(s.saturation)).toBe('muted palette');
    expect(contrastBucket(s.contrast)).toBe('low-contrast palette');
  });
  it('reads vivid colours as vivid, and a black-to-white spread as high contrast', () => {
    const v = paletteStats([{ r: 255, g: 0, b: 80 }, { r: 255, g: 180, b: 0 }, { r: 0, g: 120, b: 255 }])!;
    expect(saturationBucket(v.saturation)).toBe('vivid palette');
    const c = paletteStats([{ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }])!;
    expect(contrastBucket(c.contrast)).toBe('high-contrast palette');
  });
  it('is null for no colours, and buckets speeds', () => {
    expect(paletteStats([])).toBeNull();
    expect([0.5, 1, 2, 4, 5, 10].map(speedBucket)).toEqual(['slow (1 or less)', 'slow (1 or less)', 'medium (2-4)', 'medium (2-4)', 'fast (5+)', 'fast (5+)']);
  });
});
