import type { EffectType } from './gradientEffects';
// Relative per-frame compute cost, used both by feelingLucky's remix budget
// (useRandomization.ts) and by the manual Multi-FX toggle (EffectsTab.tsx)
// to cap how much gets stacked at once. Now defined per-effect alongside
// its drawFn/label/category in constants/effectRegistry.ts — re-exported
// here since costOf/totalCost/MULTI_FX_COST_BUDGET are logic that belongs
// in this file, not registry data.
import { EFFECT_COST } from './effectRegistry';
export { EFFECT_COST } from './effectRegistry';

export const costOf = (effect: EffectType): number => EFFECT_COST[effect] ?? 1;

// Total cost budget for manually-stacked Multi-FX effects — generous enough
// for a real, varied stack (e.g. 10 light effects, or 3-4 heavy ones) while
// still preventing the worst case (every heavy effect stacked at once) from
// tanking playback, especially on a large/high-DPR external display.
export const MULTI_FX_COST_BUDGET = 10;

export const totalCost = (effects: EffectType[]): number =>
  effects.reduce((sum, e) => sum + costOf(e), 0);
