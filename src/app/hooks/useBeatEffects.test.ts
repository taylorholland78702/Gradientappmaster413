import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '../testUtils/renderHook';
import { useBeatEffects, shakeCoverScale, type UseBeatEffectsParams } from './useBeatEffects';
import type { ColorRGB } from '../constants/gradientEffects';

const colors: ColorRGB[] = [{ r: 1, g: 2, b: 3 }, { r: 4, g: 5, b: 6 }, { r: 7, g: 8, b: 9 }];

function params(over: Partial<UseBeatEffectsParams> = {}) {
  const canvas = document.createElement('canvas');
  const wrapper = document.createElement('div');
  const p = {
    isAudioEnabled: true, isAudioReactive: true,
    contrastBeatEnabled: false, canvasRef: { current: canvas },
    contrastPulseRef: { current: 0 }, saturationPulseRef: { current: 0 }, audioSubBassLevel: 0,
    shakeBeatEnabled: false, subBassOnsetTick: 0, shakeWrapperRef: { current: wrapper }, shakeRef: { current: { x: 0, y: 0 } },
    paletteBeatEnabled: false, bassOnsetTick: 0,
    gradientColors: colors, setGradientColors: vi.fn(), setTargetColors: vi.fn(),
    audioEnergy: 0, musicIntensityRef: { current: 1 }, lastReseedTimeRef: { current: -1e9 }, setStructuralSeed: vi.fn(),
    ...over,
  } as UseBeatEffectsParams;
  return { p, canvas, wrapper };
}

describe('useBeatEffects', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

  it('snaps to a new palette of the same length on a bass hit', () => {
    const { p } = params({ paletteBeatEnabled: true, bassOnsetTick: 1 });
    const h = renderHook(useBeatEffects, p);
    expect(p.setGradientColors).toHaveBeenCalledTimes(1);
    const next = (p.setTargetColors as ReturnType<typeof vi.fn>).mock.calls[0][0]() as ColorRGB[];
    expect(next).toHaveLength(3);
    for (const c of next) for (const v of [c.r, c.g, c.b]) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(255); }
    h.unmount();
  });

  it('does not snap the palette when the toggle is off, audio is off, or before the first hit', () => {
    for (const over of [{ paletteBeatEnabled: false, bassOnsetTick: 1 }, { paletteBeatEnabled: true, bassOnsetTick: 1, isAudioEnabled: false }, { paletteBeatEnabled: true, bassOnsetTick: 0 }]) {
      const { p } = params(over); const h = renderHook(useBeatEffects, p);
      expect(p.setGradientColors).not.toHaveBeenCalled();
      h.unmount();
    }
  });

  it('rerolls the structure on an energetic hit, then waits out the cooldown', () => {
    vi.spyOn(performance, 'now').mockReturnValue(10_000);
    const { p } = params({ bassOnsetTick: 1, audioEnergy: 1 });
    const h = renderHook(useBeatEffects, p);
    expect(p.setStructuralSeed).toHaveBeenCalledTimes(1);
    h.rerender({ ...p, bassOnsetTick: 2 });
    expect(p.setStructuralSeed).toHaveBeenCalledTimes(1);          // inside the 4 s cooldown
    (performance.now as ReturnType<typeof vi.fn>).mockReturnValue(20_000);
    h.rerender({ ...p, bassOnsetTick: 3 });
    expect(p.setStructuralSeed).toHaveBeenCalledTimes(2);
    h.unmount();
  });

  it('ignores a quiet hit for the reseed', () => {
    const { p } = params({ bassOnsetTick: 1, audioEnergy: 0.1 });
    const h = renderHook(useBeatEffects, p);
    expect(p.setStructuralSeed).not.toHaveBeenCalled();
    h.unmount();
  });

  it('a sub-bass hit pulses contrast on the canvas, which then fades back to nothing', () => {
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(() => cb(0), 16) as unknown as number);
    vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id));
    const { p, canvas } = params({ contrastBeatEnabled: true, audioSubBassLevel: 5 });
    const h = renderHook(useBeatEffects, p);
    vi.advanceTimersByTime(20);
    expect(canvas.style.filter).toContain('contrast(');
    vi.advanceTimersByTime(2000);
    expect(canvas.style.filter).toBe('');
    h.unmount(); vi.unstubAllGlobals();
  });

  it('a sub-bass onset shakes the wrapper and settles back', () => {
    vi.spyOn(Math, 'random').mockReturnValue(1);          // the shake direction is random; make it a big one
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(() => cb(0), 16) as unknown as number);
    vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id));
    const { p, wrapper } = params({ shakeBeatEnabled: true, subBassOnsetTick: 1 });
    const h = renderHook(useBeatEffects, p);
    vi.advanceTimersByTime(20);
    expect(wrapper.style.transform).toContain('translate(');
    expect(wrapper.style.transform).toContain('scale(');
    vi.advanceTimersByTime(2000);
    expect(wrapper.style.transform).toBe('');
    h.unmount(); vi.unstubAllGlobals();
  });
});

describe('shake cover scale', () => {
  const box = (l: number, t: number, r: number, b: number) => ({ getBoundingClientRect: () => ({ left: l, top: t, right: r, bottom: b, width: r - l, height: b - t }) }) as unknown as HTMLElement;
  it('grows enough that the canvas keeps covering its area, and is 1 at rest', () => {
    const wrapper = box(0, 0, 1000, 800), canvas = box(100, 0, 1000, 800);
    expect(shakeCoverScale(0, 0, canvas, wrapper)).toBe(1);
    // canvas edges sit 400px (left: 500-100) and 500px from the centre: a 6px nudge needs 6/400
    expect(shakeCoverScale(6, 0, canvas, wrapper)).toBeCloseTo(1 + 6 / 400, 5);
    expect(shakeCoverScale(0, -4, canvas, wrapper)).toBeCloseTo(1 + 4 / 400, 5);
  });
});
