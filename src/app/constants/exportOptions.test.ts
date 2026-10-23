import { describe, it, expect } from 'vitest';
import {
  EXPORT_SIZES, EXPORT_ASPECTS, VIDEO_SIZES, VIDEO_LENGTHS, EXPORT_MAX_EDGE, EXPORT_MAX_PIXELS,
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
