import { describe, it, expect, vi } from 'vitest';
import { addGradientStops } from './gradientStops';

const fakeGradient = () => { const stops: [number, string][] = []; return { stops, g: { addColorStop: vi.fn((o: number, c: string) => stops.push([o, c])) } as unknown as CanvasGradient }; };
const red = { r: 255, g: 0, b: 0 }, blue = { r: 0, g: 0, b: 255 };

describe('addGradientStops', () => {
  it('spreads colors evenly', () => {
    const { g, stops } = fakeGradient(); addGradientStops(g, [red, blue], false, 0);
    expect(stops).toEqual([[0, 'rgb(255,0,0)'], [1, 'rgb(0,0,255)']]);
  });
  it('hard edge makes flat bands with a duplicate stop at each boundary', () => {
    const { g, stops } = fakeGradient(); addGradientStops(g, [red, blue], true, 0);
    expect(stops).toEqual([[0, 'rgb(255,0,0)'], [0.5, 'rgb(255,0,0)'], [0.5, 'rgb(0,0,255)'], [1, 'rgb(0,0,255)']]);
  });
  it('one color gives one stop; none gives nothing', () => {
    const one = fakeGradient(); addGradientStops(one.g, [red], false, 0);
    expect(one.stops).toEqual([[0, 'rgb(255,0,0)']]);
    const none = fakeGradient(); addGradientStops(none.g, [], false, 0);
    expect(none.stops).toEqual([]);
  });
  it('replaces invalid colors with gray and clamps channels', () => {
    const { g, stops } = fakeGradient(); addGradientStops(g, [{ r: NaN, g: 0, b: 0 }, { r: 999, g: -5, b: 10 }], false, 0);
    expect(stops).toEqual([[0, 'rgb(128,128,128)'], [1, 'rgb(255,0,10)']]);
  });
  it('treble shifts the hue only when above zero', () => {
    const quiet = fakeGradient(); addGradientStops(quiet.g, [red, blue], false, 0);
    const loud = fakeGradient(); addGradientStops(loud.g, [red, blue], false, 0.9);
    expect(loud.stops).not.toEqual(quiet.stops);
  });
});
