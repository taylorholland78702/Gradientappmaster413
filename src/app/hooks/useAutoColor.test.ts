import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '../testUtils/renderHook';
import { useAutoColor, type UseAutoColorParams } from './useAutoColor';
import type { ColorRGB } from '../constants/gradientEffects';

const colors: ColorRGB[] = [{ r: 100, g: 100, b: 100 }, { r: 200, g: 50, b: 50 }, { r: 20, g: 90, b: 220 }];

function run(overrides: Partial<UseAutoColorParams> = {}) {
  let target = colors;
  const setTargetColors = vi.fn((u: unknown) => { target = typeof u === 'function' ? (u as (p: ColorRGB[]) => ColorRGB[])(target) : (u as ColorRGB[]); });
  const hook = renderHook(useAutoColor, { isAutoColor: true, gradientType: 'angle', gradientColors: colors, setTargetColors, baseAIColors: null, ...overrides } as UseAutoColorParams);
  return { hook, setTargetColors, get target() { return target; } };
}

describe('useAutoColor', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('does nothing while Auto Color is off', () => {
    const r = run({ isAutoColor: false });
    vi.advanceTimersByTime(5000);
    expect(r.setTargetColors).not.toHaveBeenCalled();
    r.hook.unmount();
  });

  it('nudges the palette every 800 ms and keeps channels in range', () => {
    const r = run();
    vi.advanceTimersByTime(800 * 20);
    expect(r.setTargetColors).toHaveBeenCalledTimes(20);
    expect(r.target).toHaveLength(3);
    for (const c of r.target) for (const v of [c.r, c.g, c.b]) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(255); }
    expect(r.target).not.toEqual(colors);
    r.hook.unmount();
  });

  it('stays within 30 of an AI-picked base palette', () => {
    const base = colors.map(c => ({ ...c }));
    const r = run({ baseAIColors: base });
    vi.advanceTimersByTime(800 * 60);
    r.target.forEach((c, i) => {
      expect(Math.abs(c.r - base[i].r)).toBeLessThanOrEqual(30);
      expect(Math.abs(c.g - base[i].g)).toBeLessThanOrEqual(30);
      expect(Math.abs(c.b - base[i].b)).toBeLessThanOrEqual(30);
    });
    r.hook.unmount();
  });

  it('does not hang with a two-color palette', () => {
    const two = colors.slice(0, 2);
    const r = run({ gradientColors: two });
    vi.advanceTimersByTime(800 * 5);
    expect(r.setTargetColors).toHaveBeenCalled();
    r.hook.unmount();
  });

  it('stops the timer on unmount', () => {
    const r = run(); r.hook.unmount();
    vi.advanceTimersByTime(5000);
    expect(r.setTargetColors).not.toHaveBeenCalled();
  });
});
