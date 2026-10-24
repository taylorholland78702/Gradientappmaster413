import { describe, it, expect } from 'vitest';
import { percentRange, toPercent, fromPercent } from './sliderScale';

describe('slider scale', () => {
  const r = percentRange(0.3, 3, 0.05)!;

  it('uses 0-100 only for sliders that move in fractions', () => {
    expect(r).toEqual({ min: 0.3, max: 3, step: 0.05 });
    expect(percentRange(2, 16, 1)).toBeNull();
    expect(percentRange(0, 360, 1)).toBeNull();
    expect(percentRange(undefined, 10, 0.1)).toBeNull();
    expect(percentRange(5, 5, 0.1)).toBeNull();
    expect(percentRange('0.1', '3', '0.1')).toEqual({ min: 0.1, max: 3, step: 0.1 });
  });

  it('maps the ends and the middle', () => {
    expect(toPercent(0.3, r)).toBe(0);
    expect(toPercent(3, r)).toBe(100);
    expect(toPercent(1.65, r)).toBe(50);
    expect(fromPercent(0, r)).toBeCloseTo(0.3);
    expect(fromPercent(100, r)).toBeCloseTo(3);
    expect(fromPercent(50, r)).toBeCloseTo(1.65);
  });

  it('rounds to a whole number and stays inside 0-100', () => {
    expect(toPercent(0.84166, r)).toBe(20);
    expect(toPercent(-5, r)).toBe(0);
    expect(toPercent(99, r)).toBe(100);
    expect(fromPercent(150, r)).toBeCloseTo(3);
    expect(fromPercent(-20, r)).toBeCloseTo(0.3);
  });

  it('lands exactly on the round numbers that mean something', () => {
    // "Unchanged" is 1: halfway on 0.5-1.5, and 26% on 0.3-3 (as the 0.1-step slider used to offer).
    expect(fromPercent(50, percentRange(0.5, 1.5, 0.05)!)).toBe(1);
    expect(fromPercent(26, percentRange(0.3, 3, 0.1)!)).toBe(1);
    expect(fromPercent(50, percentRange(0, 2, 0.05)!)).toBe(1);
    expect(fromPercent(0, percentRange(0.1, 3, 0.1)!)).toBe(0.1);
    expect(fromPercent(100, percentRange(0.1, 3, 0.1)!)).toBe(3);
  });

  it('works for a range that includes negatives', () => {
    const e = percentRange(-2, 2, 0.05)!;
    expect(toPercent(0, e)).toBe(50);
    expect(fromPercent(75, e)).toBeCloseTo(1);
  });

  it('a value dragged to a percent comes back to the same percent', () => {
    for (let p = 0; p <= 100; p++) expect(toPercent(fromPercent(p, r), r)).toBe(p);
  });
});
