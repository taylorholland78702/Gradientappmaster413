import { describe, it, expect } from 'vitest';
import {
  EXPORT_SIZES, EXPORT_ASPECTS, VIDEO_SIZES, VIDEO_LENGTHS, EXPORT_MAX_EDGE, EXPORT_MAX_PIXELS, wallpaperTarget, centerCrop,
} from './exportOptions';

const ids = (xs: { id: string }[]) => xs.map(x => x.id);

describe('export options', () => {
  it('offers 4K for both PNG and video', () => {
    expect(ids(EXPORT_SIZES)).toContain('4k');
    expect(ids(VIDEO_SIZES)).toContain('4k');
    expect(EXPORT_SIZES.find(o => o.id === '4k')?.longEdge).toBe(3840);
    expect(VIDEO_SIZES.find(o => o.id === '4k')?.longEdge).toBe(3840);
  });

  it('has unique ids in every list', () => {
    for (const list of [EXPORT_SIZES, EXPORT_ASPECTS, VIDEO_SIZES, VIDEO_LENGTHS]) {
      expect(new Set(ids(list)).size).toBe(list.length);
    }
  });

  it('keeps "screen" first and sizes ascending', () => {
    expect(EXPORT_SIZES[0].id).toBe('screen');
    expect(VIDEO_SIZES[0].id).toBe('screen');
    for (const list of [EXPORT_SIZES, VIDEO_SIZES]) {
      const edges = list.map(o => o.longEdge);
      expect(edges).toEqual([...edges].sort((a, b) => a - b));
    }
  });

  it('keeps the largest PNG inside the canvas ceilings', () => {
    const biggest = Math.max(...EXPORT_SIZES.map(o => o.longEdge));
    expect(biggest).toBeLessThanOrEqual(EXPORT_MAX_EDGE);
    expect(EXPORT_MAX_PIXELS).toBeGreaterThan(EXPORT_MAX_EDGE);
  });
});

describe('wallpaperTarget', () => {
  it('is 8K on the long edge, shaped like the screen', () => {
    expect(wallpaperTarget(1920, 1080)).toEqual({ w: 7680, h: 4320 });
    const t = wallpaperTarget(1440, 900);
    expect(t.w).toBe(7680);
    expect(t.w / t.h).toBeCloseTo(1440 / 900, 2);
  });
  it('keeps portrait and landscape as the device reports them', () => {
    const p = wallpaperTarget(390, 844), l = wallpaperTarget(844, 390);
    expect(p.w).toBe(l.h); expect(p.h).toBe(l.w);
  });
  it('stays inside the canvas ceilings', () => {
    for (const [w, h] of [[1920, 1080], [1440, 900], [390, 844], [3440, 1440], [1000, 1000]]) {
      const t = wallpaperTarget(w, h);
      expect(Math.max(t.w, t.h)).toBeLessThanOrEqual(EXPORT_MAX_EDGE);
      expect(t.w * t.h).toBeLessThanOrEqual(EXPORT_MAX_PIXELS);
      expect(t.w / t.h).toBeCloseTo(w / h, 1);
    }
  });
  it('never returns an empty image', () => {
    const t = wallpaperTarget(0, 0);
    expect(t.w).toBeGreaterThanOrEqual(1); expect(t.h).toBeGreaterThanOrEqual(1);
  });
});

describe('centerCrop', () => {
  it('takes the centered region with the wanted shape', () => {
    expect(centerCrop(1000, 1000, 2)).toEqual({ x: 0, y: 250, w: 1000, h: 500 });
    expect(centerCrop(1000, 500, 1)).toEqual({ x: 250, y: 0, w: 500, h: 500 });
  });
  it('keeps everything when no shape is asked for', () => {
    expect(centerCrop(800, 600, 0)).toEqual({ x: 0, y: 0, w: 800, h: 600 });
  });
});
