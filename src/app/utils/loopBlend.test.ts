import { describe, it, expect } from 'vitest';
import { LoopAssembler, mixFrames, planLoop } from './loopBlend';

const frame = (v: number) => new Uint8ClampedArray([v, v, v, 255]);

describe('planLoop', () => {
  it('captures the loop plus a quarter of it for the dissolve', () => {
    expect(planLoop(4, 20)).toEqual({ fps: 20, frames: 80, overlap: 20, captureFrames: 100 });
  });
  it('caps the dissolve so memory stays bounded', () => {
    expect(planLoop(30, 30).overlap).toBe(45);
  });
  it('always has at least one frame to dissolve and one that is not', () => {
    const p = planLoop(0.05, 30);
    expect(p.overlap).toBeGreaterThanOrEqual(1);
    expect(p.overlap).toBeLessThan(p.frames);
  });
});

describe('mixFrames', () => {
  it('alpha 0 keeps the first, alpha 1 the second', () => {
    expect(Array.from(mixFrames(new Uint8ClampedArray(4), frame(10), frame(200), 0))).toEqual([10, 10, 10, 255]);
    expect(Array.from(mixFrames(new Uint8ClampedArray(4), frame(10), frame(200), 1))).toEqual([200, 200, 200, 255]);
    expect(Array.from(mixFrames(new Uint8ClampedArray(4), frame(0), frame(100), 0.5))).toEqual([50, 50, 50, 255]);
  });
});

describe('LoopAssembler', () => {
  const run = (N: number, M: number) => {
    const plan = { fps: 10, frames: N, overlap: M, captureFrames: N + M };
    const a = new LoopAssembler(plan);
    const out: number[] = [];
    // frame k has value k (a ramp), so every output can be read back
    for (let k = 0; k < N + M; k++) { const r = a.push(frame(k)); if (r) out.push(r[0]); }
    return { out, a };
  };

  it('emits exactly N frames from N + M captured', () => {
    const { out, a } = run(20, 5);
    expect(out).toHaveLength(20);
    expect(a.done).toBe(true);
  });

  it('starts at frame M and runs untouched to the end of the capture window', () => {
    const { out } = run(20, 5);
    expect(out.slice(0, 15)).toEqual(Array.from({ length: 15 }, (_, i) => 5 + i));
  });

  it('ends with the extra frames dissolving into the first ones: the first of them is exactly the next real frame', () => {
    const { out } = run(20, 5);
    expect(out[15]).toBe(20);                               // f[N]: follows f[N-1] with no jump
    // the rest are mixes of f[N+i] and f[i], moving toward f[i]
    for (let i = 1; i < 5; i++) expect(out[15 + i]).toBe(Math.round((20 + i) * (1 - i / 5) + i * (i / 5)));
  });

  it('the last frame is mostly the first captured frames, so it flows into f[M] when the loop restarts', () => {
    const N = 40, M = 10;
    const a = new LoopAssembler({ fps: 10, frames: N, overlap: M, captureFrames: N + M });
    const colour = (k: number) => new Uint8ClampedArray([k < N ? 0 : 255, 0, 0, 255]); // late frames are red, early ones black
    let last: Uint8ClampedArray | null = null;
    for (let k = 0; k < N + M; k++) { const r = a.push(colour(k)); if (r) last = r; }
    expect(last![0]).toBeLessThan(40);                        // 1/M of red at i = M-1
  });

  it('keeps its own copy of the first frames, so the caller can reuse its buffer', () => {
    const plan = { fps: 10, frames: 6, overlap: 2, captureFrames: 8 };
    const a = new LoopAssembler(plan);
    const buf = new Uint8ClampedArray(4);
    const outs: number[] = [];
    for (let k = 0; k < 8; k++) { buf.fill(k * 10); const r = a.push(buf); if (r) outs.push(r[0]); }
    // output 4 is the dissolve of f[6] (60) into f[0] (0) at alpha 0 => 60; output 5 at alpha .5 of f[7] (70) and f[1] (10) => 40
    expect(outs.slice(-2)).toEqual([60, 40]);
  });
});
