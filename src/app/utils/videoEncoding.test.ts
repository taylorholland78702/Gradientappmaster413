import { describe, it, expect } from 'vitest';
import { pickVideoMultiplier, evenVideoScale, videoEncoderCandidates, videoCodecKind, VIDEO_EDGE_LADDER, VIDEO_MAX_EDGE, PHONE_VIDEO_MAX_EDGE } from './videoEncoding';

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

describe('8K and bitrate', () => {
  it('takes 8K only when it is asked for and the encoder accepts it', async () => {
    const yes = async () => true;
    expect(longEdge(1280, 720, await pickVideoMultiplier(1280, 720, yes))).toBeLessThanOrEqual(3844);
    expect(longEdge(1280, 720, await pickVideoMultiplier(1280, 720, yes, VIDEO_MAX_EDGE))).toBeGreaterThanOrEqual(7678);
    expect(longEdge(1280, 720, await pickVideoMultiplier(1280, 720, async (w, h) => Math.max(w, h) <= 3840, VIDEO_MAX_EDGE))).toBeLessThanOrEqual(3844);
  });

  it('lets a phone go up to 4K but never 8K', async () => {
    expect(PHONE_VIDEO_MAX_EDGE).toBe(3840);
    const m = await pickVideoMultiplier(390, 844, async () => true, PHONE_VIDEO_MAX_EDGE);
    expect(longEdge(390, 844, m)).toBeLessThanOrEqual(3844);
    expect(longEdge(390, 844, m)).toBeGreaterThanOrEqual(3838);
  });

  it('asks for H.264 up to 4K and HEVC above it', () => {
    const small = videoEncoderCandidates(3840, 2160, 30);
    const big = videoEncoderCandidates(7680, 4320, 30);
    expect(small.every(c => videoCodecKind(c.codec) === 'avc')).toBe(true);
    expect(big.every(c => videoCodecKind(c.codec) === 'hevc')).toBe(true);
  });

  it('gives bigger frames more bitrate: about 60 Mbps at 4K, about 120 at 8K, and never less than the old flat rates', () => {
    const rate = (w: number, h: number) => videoEncoderCandidates(w, h, 30)[0].bitrate ?? 0;
    expect(rate(3840, 2160)).toBeGreaterThan(55_000_000);
    expect(rate(7680, 4320)).toBeGreaterThan(rate(3840, 2160));
    expect(rate(7680, 4320)).toBeGreaterThan(110_000_000);
    expect(rate(7680, 4320)).toBeLessThanOrEqual(150_000_000);
    expect(rate(1280, 720)).toBeGreaterThanOrEqual(20_000_000);
  });

  it('keeps the 8K size at the top of the ladder', () => {
    expect(VIDEO_EDGE_LADDER[0]).toBe(7680);
  });
});
