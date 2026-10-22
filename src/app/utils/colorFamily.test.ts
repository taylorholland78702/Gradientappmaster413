import { describe, it, expect } from 'vitest';
import { paletteFamily, hueDistance, inFamily, generateFamilyPalette } from './colorFamily';

const warm = [{ r: 40, g: 5, b: 0 }, { r: 200, g: 60, b: 20 }, { r: 255, g: 170, b: 60 }];
const cool = [{ r: 0, g: 10, b: 40 }, { r: 20, g: 90, b: 220 }, { r: 120, g: 200, b: 255 }];
const grey = [{ r: 20, g: 20, b: 20 }, { r: 130, g: 130, b: 130 }, { r: 240, g: 240, b: 240 }];

describe('color family', () => {
  it('reads warm and cool palettes at opposite ends of the wheel and calls grey neutral', () => {
    const w = paletteFamily(warm), c = paletteFamily(cool);
    expect(w.neutral).toBe(false);
    expect(hueDistance(w.hue, c.hue)).toBeGreaterThan(120);
    expect(paletteFamily(grey).neutral).toBe(true);
  });

  it('measures hue distance around the wheel', () => {
    expect(hueDistance(350, 10)).toBe(20);
    expect(hueDistance(0, 180)).toBe(180);
  });

  it('accepts palettes in the family and rejects others, including greys', () => {
    const anchor = paletteFamily(warm);
    expect(inFamily(warm, anchor)).toBe(true);
    expect(inFamily(cool, anchor)).toBe(false);
    expect(inFamily(grey, anchor)).toBe(false);
    expect(inFamily(cool, paletteFamily(grey))).toBe(true);
  });

  it('generates palettes that stay in the family, dark to light', () => {
    const anchor = paletteFamily(cool);
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 20; i++) {
      const p = generateFamilyPalette(anchor, 5, i % 2 === 0, rand);
      expect(p).toHaveLength(5);
      expect(inFamily(p, anchor, 55)).toBe(true);
      expect(p[0].r + p[0].g + p[0].b).toBeLessThan(p[4].r + p[4].g + p[4].b);
    }
  });
});
