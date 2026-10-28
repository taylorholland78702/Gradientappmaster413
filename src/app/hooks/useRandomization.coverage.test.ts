import { describe, it, expect } from 'vitest';
import source from './useRandomization.ts?raw';
import { FULL_GRADIENT_TYPES, STYLE_FIELD_GRADIENT_TYPES } from '../constants/gradientEffects';
import { EFFECT_IDS } from '../constants/effectRegistry';

// The small random change Shuffle makes on a tap or hold (the "nudge") has to know every gradient and effect, or
// the ones it skips sit frozen while everything else moves. New ones must be added there, or listed here with a reason.
const NO_EFFECT_NUDGE: Record<string, string> = {
  none: 'not an effect',
  invert: 'has no controls',
  photo: 'needs an uploaded picture; shuffling it does nothing',
};

// Gradients with nothing of their own to nudge.
const NO_GRADIENT_NUDGE: Record<string, string> = { constellation: 'no settings: it is built from the palette and the beat' };

describe('Shuffle nudge covers every gradient and effect', () => {
  it('has a branch for each effect that has controls', () => {
    const branches = new Set([...source.matchAll(/eff === '([a-z-]+)'/g)].map(m => m[1]));
    const missing = EFFECT_IDS.filter(id => !(id in NO_EFFECT_NUDGE) && !branches.has(id));
    expect(missing).toEqual([]);
  });

  it('has a branch for each gradient, or handles it as a styled gradient', () => {
    const branches = new Set([...source.matchAll(/gradientType === '([a-z-]+)'/g)].map(m => m[1]));
    const styled = new Set<string>(STYLE_FIELD_GRADIENT_TYPES);
    const missing = FULL_GRADIENT_TYPES.filter(g => !branches.has(g) && !styled.has(g) && !(g in NO_GRADIENT_NUDGE));
    expect(missing).toEqual([]);
    expect(source).toContain('STYLE_FIELD_GRADIENT_TYPES.includes(gradientType)');
  });
});
