import { describe, it, expect } from 'vitest';
import { FULL_GRADIENT_TYPES } from './gradientEffects';
import { ALL_EFFECTS, EFFECT_LABELS } from './effectRegistry';
import { GRADIENT_DRAW_FNS } from '../hooks/gradients/_registry';
import { EFFECT_DRAW_FNS } from './effectRegistry';
import { EFFECT_COST, costOf } from './effectCost';

// Guards against the exact class of bug a registry-driven app like this is
// prone to: a new gradient/effect gets added to the type union or the UI
// list, but wiring it into the actual draw-fn map is a separate manual
// step (see GRADIENT_DRAW_FNS/_registry.ts) that's easy to forget — which
// silently renders nothing for that type instead of erroring.
describe('gradient registry completeness', () => {
  it('every FULL_GRADIENT_TYPES entry has a GRADIENT_DRAW_FNS implementation', () => {
    for (const type of FULL_GRADIENT_TYPES) {
      expect(GRADIENT_DRAW_FNS, `gradient type '${type}'`).toHaveProperty(type);
      expect(typeof GRADIENT_DRAW_FNS[type]).toBe('function');
    }
  });
});

describe('effect registry completeness', () => {
  it('every ALL_EFFECTS entry has an EFFECT_DRAW_FNS implementation', () => {
    for (const effect of ALL_EFFECTS) {
      expect(EFFECT_DRAW_FNS, `effect '${effect}'`).toHaveProperty(effect);
      expect(typeof EFFECT_DRAW_FNS[effect]).toBe('function');
    }
  });

  it('every ALL_EFFECTS entry has a display label', () => {
    for (const effect of ALL_EFFECTS) {
      expect(EFFECT_LABELS[effect], `effect '${effect}'`).toBeTruthy();
    }
  });

  it('every effect with an explicit EFFECT_COST entry costs at least 1', () => {
    for (const [effect, cost] of Object.entries(EFFECT_COST)) {
      expect(cost, `effect '${effect}'`).toBeGreaterThanOrEqual(1);
    }
  });

  it('costOf falls back to 1 for an effect with no explicit cost entry', () => {
    // @ts-expect-error deliberately probing an id outside the EffectType union
    expect(costOf('not-a-real-effect')).toBe(1);
  });
});
