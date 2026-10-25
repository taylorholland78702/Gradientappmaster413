import { describe, it, expect } from 'vitest';
import { pickVideoMultiplier, evenVideoScale, VIDEO_EDGE_LADDER } from './videoEncoding';

const longEdge = (w: number, h: number, mult: number) => Math.max(Math.floor(w * mult), Math.floor(h * mult));

describe('pickVideoMultiplier', () => {
  it('takes 4K when the encoder accepts it', async () => {
    const m = await pickVideoMultiplier(1280, 720, async () => true);
    expect(longEdge(1280, 720, m)).toBeGreaterThanOrEqual(3838);
  });
  it('steps down until the encoder accepts the size (a phone that stops at 1080p)', async () => {
    const m = await pickVideoMultiplier(390, 844, async (w, h) => Math.max(w, h) <= 1930);
    expect(longEdge(390, 844, m)).toBeGreaterThanOrEqual(1918);
    expect(longEdge(390, 844, m)).toBeLessThanOrEqual(1930);
  });
  it('stays at the smallest size when nothing is supported or WebCodecs is missing', async () => {
    const small = VIDEO_EDGE_LADDER[VIDEO_EDGE_LADDER.length - 1];
    expect(longEdge(390, 844, await pickVideoMultiplier(390, 844, async () => false))).toBeLessThanOrEqual(small + 4);
    expect(longEdge(390, 844, await pickVideoMultiplier(390, 844, null))).toBeLessThanOrEqual(small + 4);
  });
  it('always yields even dimensions', () => {
    for (const [w, h] of [[390, 844], [393, 852], [1281, 721]]) {
      const m = evenVideoScale(w, h, 3840);
      expect(Math.floor(w * m) % 2).toBe(0);
      expect(Math.floor(h * m) % 2).toBe(0);
    }
  });
});

describe('pickVideoMultiplier on phones', () => {
  it('never goes above the phone cap, even when 4K would be accepted', async () => {
    const m = await pickVideoMultiplier(390, 844, async () => true, 2560);
    expect(longEdge(390, 844, m)).toBeLessThanOrEqual(2564);
    expect(longEdge(390, 844, m)).toBeGreaterThanOrEqual(2558);
  });
});
