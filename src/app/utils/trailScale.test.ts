import { describe, it, expect } from 'vitest';
import { decayToPosition, positionToDecay } from './trailScale';

describe('trail decay slider scale', () => {
  it('spans the same decay range as before', () => {
    expect(positionToDecay(0)).toBeCloseTo(0.5, 6);
    expect(positionToDecay(1)).toBeCloseTo(0.99, 6);
  });
  it('round-trips every decay the slider can hold', () => {
    for (const d of [0.5, 0.6, 0.85, 0.9, 0.95, 0.99]) expect(positionToDecay(decayToPosition(d))).toBeCloseTo(d, 6);
  });
  it('gives each step the same change in trail length', () => {
    const frames = (p: number) => 1 / (1 - positionToDecay(p));
    expect(frames(0.6) / frames(0.5)).toBeCloseTo(frames(0.2) / frames(0.1), 6);
  });
  it('spends far more of the slider on the subtle 0.85-0.95 stretch than a linear one would', () => {
    const share = decayToPosition(0.95) - decayToPosition(0.85);
    expect(share).toBeGreaterThan(0.2); // linear: (0.95 - 0.85) / 0.49 = 0.20
  });
});
