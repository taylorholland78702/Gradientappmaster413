import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createWorkerAutoEffect } from './workerAutoEffect';
import type { EffectCtx } from '../canvasDrawTypes';

// The wrapper only reads these four fields; the test supplies just those.
const asCtx = (p: object) => p as unknown as EffectCtx;

// Minimal stand-ins for the browser APIs the worker wrapper touches.
class FakeWorker {
  static last: FakeWorker | null = null;
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;
  posted: unknown[] = [];
  constructor() { FakeWorker.last = this; }
  postMessage(msg: unknown) { this.posted.push(msg); }
  reply(w: number, h: number) {
    this.onmessage?.({ data: { buffer: new ArrayBuffer(w * h * 4), displayWidth: w, displayHeight: h } } as MessageEvent);
  }
}
class FakeImageData {
  constructor(public data: Uint8ClampedArray, public width: number, public height: number) {}
}

const W = 4, H = 4;

function setup(snapshotBeforePaint: boolean | undefined) {
  const order: string[] = [];
  const effect = createWorkerAutoEffect<{ buffer: ArrayBuffer }, { buffer: ArrayBuffer; displayWidth: number; displayHeight: number }>({
    workerUrl: new URL('file:///fake-worker.ts'),
    effectName: 'Test effect',
    snapshotBeforePaint,
    cpuFallback: () => { order.push('cpu'); },
    buildRequest: () => { order.push('snapshot'); return { buffer: new ArrayBuffer(W * H * 4), extra: {} }; },
  });
  const P = () => asCtx({
    displayWidth: W, displayHeight: H,
    putScaledImageData: () => { order.push('paint'); },
    drawParamsDirtyRef: { current: false },
  });
  return { order, effect, P };
}

describe('createWorkerAutoEffect', () => {
  beforeEach(() => {
    FakeWorker.last = null;
    vi.stubGlobal('Worker', FakeWorker);
    vi.stubGlobal('OffscreenCanvas', class {});
    vi.stubGlobal('ImageData', FakeImageData);
  });
  afterEach(() => { vi.unstubAllGlobals(); });

  it('snapshots the canvas before painting the last result when snapshotBeforePaint is set', () => {
    const { order, effect, P } = setup(true);
    effect(P());                       // first frame: no result yet, CPU fallback paints
    expect(order).toEqual(['snapshot', 'cpu']);
    FakeWorker.last!.reply(W, H);      // the worker answers
    order.length = 0;
    effect(P());                       // next frame paints the result, then asks for a new one
    expect(order).toEqual(['snapshot', 'paint']);
    expect(FakeWorker.last!.posted.length).toBe(2);
  });

  it('keeps the original order (paint, then build) when it is not set', () => {
    const { order, effect, P } = setup(undefined);
    effect(P());
    expect(order).toEqual(['cpu', 'snapshot']);
    FakeWorker.last!.reply(W, H);
    order.length = 0;
    effect(P());
    expect(order).toEqual(['paint', 'snapshot']);
  });

  it('does not queue a second request while one is outstanding', () => {
    const { effect, P } = setup(true);
    effect(P());
    effect(P());
    effect(P());
    expect(FakeWorker.last!.posted.length).toBe(1);
  });

  it('falls back to the CPU path for good if building the request throws', () => {
    const order: string[] = [];
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const effect = createWorkerAutoEffect<{ buffer: ArrayBuffer }, { buffer: ArrayBuffer; displayWidth: number; displayHeight: number }>({
      workerUrl: new URL('file:///fake-worker.ts'), effectName: 'Test effect', snapshotBeforePaint: true,
      cpuFallback: () => { order.push('cpu'); },
      buildRequest: () => { throw new Error('no 2d context'); },
    });
    const P = asCtx({ displayWidth: W, displayHeight: H, putScaledImageData: () => {}, drawParamsDirtyRef: { current: false } });
    effect(P);
    effect(P);
    expect(order).toEqual(['cpu', 'cpu']);
    expect(FakeWorker.last?.posted ?? []).toEqual([]);
    errSpy.mockRestore();
  });
});
