import { describe, it, expect } from 'vitest';
import {
  EXPORT_SIZES, EXPORT_ASPECTS, VIDEO_SIZES, VIDEO_LENGTHS, EXPORT_MAX_EDGE, EXPORT_MAX_PIXELS, wallpaperTarget,
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
  it('is the screen in real pixels', () => {
    expect(wallpaperTarget(390, 844, 3)).toEqual({ w: 1170, h: 2532 });
    expect(wallpaperTarget(1440, 900, 2)).toEqual({ w: 2880, h: 1800 });
    expect(wallpaperTarget(1920, 1080, 1)).toEqual({ w: 1920, h: 1080 });
  });
  it('keeps portrait and landscape as the device reports them', () => {
    const p = wallpaperTarget(390, 844, 3), l = wallpaperTarget(844, 390, 3);
    expect(p.w).toBe(l.h); expect(p.h).toBe(l.w);
  });
  it('scales down, keeping the shape, when a screen is past the canvas ceilings', () => {
    const t = wallpaperTarget(6016, 3384, 3);   // an 18k-wide virtual screen
    expect(Math.max(t.w, t.h)).toBeLessThanOrEqual(EXPORT_MAX_EDGE);
    expect(t.w * t.h).toBeLessThanOrEqual(EXPORT_MAX_PIXELS);
    expect(t.w / t.h).toBeCloseTo(6016 / 3384, 2);
  });
  it('never returns an empty image', () => {
    expect(wallpaperTarget(0, 0, 0)).toEqual({ w: 1, h: 1 });
  });
});
