import { describe, it, expect } from 'vitest';
import { canvasSizeScale, orientedGrid, REFERENCE_CANVAS_SIZE } from './canvasScale';

describe('canvasSizeScale', () => {
  it('leaves a desktop-sized canvas or larger alone', () => {
    expect(canvasSizeScale(1300, 900)).toBe(1);
    expect(canvasSizeScale(2400, 1300)).toBe(1);
  });
  it('shrinks pixel sizes on a phone, the same in either orientation', () => {
    const portrait = canvasSizeScale(390, 760), landscape = canvasSizeScale(760, 390);
    expect(portrait).toBeCloseTo(landscape, 6);
    expect(portrait).toBeGreaterThan(0.4); expect(portrait).toBeLessThan(0.6);
  });
  it('never goes below its floor', () => {
    expect(canvasSizeScale(10, 10)).toBe(0.35);
    expect(REFERENCE_CANVAS_SIZE).toBeGreaterThan(0);
  });
});

describe('orientedGrid', () => {
  it('keeps rows and columns on the shape the look was made for', () => {
    expect(orientedGrid({ gridRows: 10, gridColumns: 30, canvasAspect: 1.8 }, true)).toEqual({ rows: 10, columns: 30 });
  });
  it('swaps them on the other shape', () => {
    expect(orientedGrid({ gridRows: 10, gridColumns: 30, canvasAspect: 1.8 }, false)).toEqual({ rows: 30, columns: 10 });
    expect(orientedGrid({ gridRows: 30, gridColumns: 10, canvasAspect: 0.5 }, true)).toEqual({ rows: 10, columns: 30 });
  });
  it('treats a look with no recorded shape as landscape', () => {
    expect(orientedGrid({ gridRows: 10, gridColumns: 30 }, false)).toEqual({ rows: 30, columns: 10 });
    expect(orientedGrid({ gridRows: 10, gridColumns: 30 }, true)).toEqual({ rows: 10, columns: 30 });
  });
});
