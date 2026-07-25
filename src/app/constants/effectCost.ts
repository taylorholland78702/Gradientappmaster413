import type { EffectType } from './gradientEffects';

// Relative per-frame compute cost, used both by feelingLucky's remix budget
// (useRandomization.ts) and by the manual Multi-FX toggle (EffectsTab.tsx)
// to cap how much gets stacked at once. Not every effect costs the same —
// several do full-canvas getImageData/pixel-loop work every frame
// (chromatic-trails, grid-effect, triangulate, halftone, dither), several
// more do multi-pass or per-cell work (ascii, feedback, glitch, etc.), and
// the rest are simple single-pass canvas ops. Default 1 for anything not
// listed here.
export const EFFECT_COST: Partial<Record<EffectType, number>> = {
  'chromatic-trails': 3, 'grid-effect': 3, triangulate: 3, halftone: 3, dither: 3,
  ascii: 2, feedback: 2, glitch: 2, vhs: 2, emoji: 2, grain: 2, mirror: 2,
  blur: 2, 'zoom-blur': 2, ripple: 2, wave: 2, duotone: 2, chromatic: 2, 'slit-scan': 2,
};

export const costOf = (effect: EffectType): number => EFFECT_COST[effect] ?? 1;

// Total cost budget for manually-stacked Multi-FX effects — generous enough
// for a real, varied stack (e.g. 10 light effects, or 3-4 heavy ones) while
// still preventing the worst case (every heavy effect stacked at once) from
// tanking playback, especially on a large/high-DPR external display.
export const MULTI_FX_COST_BUDGET = 10;

export const totalCost = (effects: EffectType[]): number =>
  effects.reduce((sum, e) => sum + costOf(e), 0);
