import { describe, it, expect } from 'vitest';
import { sanitizeSnapshot } from './sanitizeSnapshot';
import { MULTI_FX_COST_BUDGET, totalCost } from '../constants/effectCost';
import { EFFECT_IDS } from '../constants/effectRegistry';

describe('sanitizeSnapshot', () => {
  it('clamps absurd numbers to the control range', () => {
    const out = sanitizeSnapshot({ gridRows: 1e9, gridColumns: -5, halftoneSize: 0.0001, kaleidoscopeSegments: 1e6 });
    expect(out.gridRows).toBeLessThanOrEqual(100);
    expect(out.gridColumns).toBeGreaterThanOrEqual(2);
    expect(out.halftoneSize).toBeGreaterThanOrEqual(2);
    expect(out.kaleidoscopeSegments).toBeLessThanOrEqual(100);
  });
  it('drops non-numbers from numeric fields', () => {
    expect('gridRows' in sanitizeSnapshot({ gridRows: 'many' as unknown as number })).toBe(false);
    expect('gridRows' in sanitizeSnapshot({ gridRows: NaN })).toBe(false);
  });
  it('falls back to a known gradient', () => {
    expect(sanitizeSnapshot({ gradientType: { x: 1 } }).gradientType).toBe('angle');
    expect(sanitizeSnapshot({ gradientType: 'nope' }).gradientType).toBe('angle');
    expect(sanitizeSnapshot({ gradientType: 'noise' }).gradientType).toBe('noise');
  });
  it('keeps only known effects within the cost budget', () => {
    const out = sanitizeSnapshot({ activeEffects: [...EFFECT_IDS, ...EFFECT_IDS, 'bogus', 7, 'fisheye'] });
    expect(out.activeEffects).not.toContain('bogus');
    expect(out.activeEffects).not.toContain('fisheye');
    expect(new Set(out.activeEffects).size).toBe(out.activeEffects.length);
    expect(totalCost(out.activeEffects as never)).toBeLessThanOrEqual(MULTI_FX_COST_BUDGET);
  });
  it('drops malformed colors and survives junk input', () => {
    expect('gradientColors' in sanitizeSnapshot({ gradientColors: [{ r: 'x' }] })).toBe(false);
    expect(sanitizeSnapshot(null as unknown as Record<string, unknown>)).toEqual({});
    expect(sanitizeSnapshot({ gradientColors: [{ r: 1, g: 2, b: 3 }, { r: 4, g: 5, b: 6 }] }).gradientColors).toHaveLength(2);
  });
});
