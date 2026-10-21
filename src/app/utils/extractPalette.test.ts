import { describe, it, expect } from 'vitest';
import { extractPalette } from './extractPalette';

const solid = (r: number, g: number, b: number, n: number) => Array.from({ length: n }, () => [r, g, b, 255]).flat();

describe('extractPalette', () => {
  it('finds the dominant colors of a two-color image, dark first', () => {
    const px = [...solid(250, 240, 10, 60), ...solid(5, 10, 120, 40)];
    const out = extractPalette(px, 2);
    expect(out).toHaveLength(2);
    expect(out[0].b).toBeGreaterThan(100);
    expect(out[1].r).toBeGreaterThan(200);
  });

  it('is deterministic and skips transparent pixels', () => {
    const px = [...solid(10, 200, 30, 20), 0, 0, 0, 0, 255, 255, 255, 0];
    expect(extractPalette(px, 3)).toEqual(extractPalette(px, 3));
    expect(extractPalette([0, 0, 0, 0], 3)).toEqual([]);
  });
});
