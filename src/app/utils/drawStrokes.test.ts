import { describe, it, expect, beforeEach } from 'vitest';
import { addStrokePoint, clearDabs, hasLiveDabs, endStroke } from './drawStrokes';

const opts = (now: number) => ({ canvasW: 1000, canvasH: 500, sizePx: 40, now, colorAt: () => ({ r: 255, g: 0, b: 0 }) });

describe('draw strokes', () => {
  beforeEach(() => clearDabs());

  it('starts empty and holds dabs after a stroke', () => {
    expect(hasLiveDabs()).toBe(false);
    addStrokePoint(0.1, 0.1, 1, opts(0));
    addStrokePoint(0.5, 0.1, 1, opts(10));
    expect(hasLiveDabs()).toBe(true);
  });

  it('clear empties it, and a new stroke after endStroke does not connect to the old one', () => {
    addStrokePoint(0.1, 0.1, 1, opts(0));
    endStroke();
    clearDabs();
    expect(hasLiveDabs()).toBe(false);
  });
});
