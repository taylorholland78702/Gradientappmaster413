import { describe, it, expect } from 'vitest';
import { rotateHue } from './useCanvasDraw';

describe('rotateHue', () => {
  const red = { r: 255, g: 0, b: 0 };

  it('returns colors unchanged for 0 degrees', () => {
    expect(rotateHue([red], 0)).toEqual([red]);
  });

  it('returns colors unchanged for a full 360-degree rotation', () => {
    const result = rotateHue([red], 360);
    expect(result[0].r).toBeCloseTo(red.r, -1);
    expect(result[0].g).toBeCloseTo(red.g, -1);
    expect(result[0].b).toBeCloseTo(red.b, -1);
  });

  it('passes grayscale colors through unchanged regardless of degrees', () => {
    const gray = { r: 128, g: 128, b: 128 };
    expect(rotateHue([gray], 90)).toEqual([gray]);
  });

  it('rotating red by 120 degrees lands near green', () => {
    const [result] = rotateHue([red], 120);
    expect(result.g).toBeGreaterThan(result.r);
    expect(result.g).toBeGreaterThan(result.b);
  });

  it('normalizes negative and >360 degree inputs to the same result', () => {
    const a = rotateHue([red], 45);
    const b = rotateHue([red], 45 - 360);
    const c = rotateHue([red], 45 + 360);
    expect(a).toEqual(b);
    expect(a).toEqual(c);
  });

  it('does not mutate the input array', () => {
    const input = [{ r: 10, g: 20, b: 30 }];
    const snapshot = JSON.parse(JSON.stringify(input));
    rotateHue(input, 77);
    expect(input).toEqual(snapshot);
  });
});
