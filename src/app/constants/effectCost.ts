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

// Total cost budget for manually-stacked Multi-FX effects. High enough that
// stacking every single effect at once never exceeds it, so Multi-FX buttons
// never gray out on the user — manual selection is an intentional choice,
// unlike the shuffle's randomized stack, so it's not this budget's job to
// protect playback performance.
export const MULTI_FX_COST_BUDGET = 100;

export const totalCost = (effects: EffectType[]): number =>
  effects.reduce((sum, e) => sum + costOf(e), 0);

// Scales resolutionMultiplier down as the active effect stack gets heavier.
// Originally only ever called from Shuffle/feelingLucky's own paths
// (useRandomization.ts) — MULTI_FX_COST_BUDGET above is high enough that
// manually toggling effects in EffectsTab.tsx never grays out a button, but
// that also meant manually stacking several expensive effects got zero
// resolution relief, unlike an equivalent shuffle result. Moved here (out of
// useRandomization.ts) so InteractiveGradient.tsx can apply the same curve
// whenever activeEffects changes at all, regardless of how it changed.
const LIGHT_EFFECT_COST = 4;
const HEAVY_EFFECT_COST = 15;
// isMobile here is the same narrow-viewport signal InteractiveGradient.tsx's
// useIsMobile(1024) already computes for layout — not a true low-power-
// device detector (a resized narrow desktop window reads as "mobile" too,
// a wide tablet doesn't), but it's the only device signal this app already
// has, and it's a reasonable proxy: phones are overwhelmingly the case that
// actually needs the lower cap.
export const resolutionForEffectCost = (cost: number, isMobile = false): number => {
  // Capped at 2 on desktop — see useMiscState.ts's resolutionMultiplier
  // init for why full devicePixelRatio isn't used directly. Capped lower on
  // mobile (1.5): every per-pixel gradient/effect's fragment cost scales
  // quadratically with this, and phone GPUs/CPUs run the identical
  // pipeline desktop does with meaningfully less headroom — this was
  // previously the one place in the app where isMobile had zero effect on
  // actual render cost, only on layout.
  const dprCap = isMobile ? 1.5 : 2;
  const baseline = Math.min((typeof window !== 'undefined' && window.devicePixelRatio) || 1, dprCap);
  if (cost <= LIGHT_EFFECT_COST) return baseline;
  const t = Math.min(1, (cost - LIGHT_EFFECT_COST) / (HEAVY_EFFECT_COST - LIGHT_EFFECT_COST));
  return baseline * (1 - t * 0.4);
};
