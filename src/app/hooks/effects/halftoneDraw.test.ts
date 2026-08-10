import { describe, it, expect, vi } from 'vitest';
import { drawHalftonePixels, type HalftoneDrawCtx } from './halftoneDraw';

// A minimal fake 2D context that just records calls — enough to verify
// drawHalftonePixels exercises the right drawing path without needing a
// real Canvas/OffscreenCanvas backend (unavailable in jsdom).
function makeFakeCtx() {
  const calls: string[] = [];
  const ctx: HalftoneDrawCtx = {
    fillStyle: '',
    globalCompositeOperation: 'source-over',
    fillRect: vi.fn(() => calls.push('fillRect')),
    beginPath: vi.fn(() => calls.push('beginPath')),
    arc: vi.fn(() => calls.push('arc')),
    fill: vi.fn(() => calls.push('fill')),
  };
  return { ctx, calls };
}

function makeOpts(overrides: Partial<Parameters<typeof drawHalftonePixels>[1]> = {}) {
  const width = 20, height = 20;
  const pixels = new Uint8ClampedArray(width * height * 4).fill(128);
  return {
    displayWidth: width,
    displayHeight: height,
    centerX: width / 2,
    centerY: height / 2,
    halftoneSize: 5,
    halftoneCMYK: false,
    halftoneMove: false,
    halftoneVariation: 0,
    halftoneTime: 0,
    pixels,
    ...overrides,
  };
}

describe('drawHalftonePixels', () => {
  it('draws a background fill and at least one dot in standard mode', () => {
    const { ctx, calls } = makeFakeCtx();
    drawHalftonePixels(ctx, makeOpts());
    expect(calls[0]).toBe('fillRect'); // background clear
    expect(calls).toContain('arc');
    expect(calls).toContain('fill');
  });

  it('draws a white background fill in CMYK mode (vs black in standard mode)', () => {
    const { ctx, calls } = makeFakeCtx();
    drawHalftonePixels(ctx, makeOpts({ halftoneCMYK: true }));
    expect(calls[0]).toBe('fillRect');
    expect(ctx.fillStyle).not.toBe('#000'); // last fillStyle set is a channel color, not the standard-mode black bg
    expect(calls).toContain('arc');
  });

  it('sets globalCompositeOperation back to source-over after CMYK mode', () => {
    const { ctx } = makeFakeCtx();
    drawHalftonePixels(ctx, makeOpts({ halftoneCMYK: true }));
    expect(ctx.globalCompositeOperation).toBe('source-over');
  });

  it('does not throw when halftoneMove is enabled', () => {
    const { ctx } = makeFakeCtx();
    expect(() => drawHalftonePixels(ctx, makeOpts({ halftoneMove: true, halftoneTime: 3.14 }))).not.toThrow();
  });

  it('is deterministic for the same inputs (no move, fixed time)', () => {
    const a = makeFakeCtx();
    const b = makeFakeCtx();
    const opts = makeOpts();
    drawHalftonePixels(a.ctx, opts);
    drawHalftonePixels(b.ctx, opts);
    expect(a.calls).toEqual(b.calls);
  });
});
