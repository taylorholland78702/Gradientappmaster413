import { useEffect, type SetStateAction } from 'react';
import { IS_DISPLAY_MODE } from '../constants/displayMode';
import { resolutionForEffectCost } from '../constants/effectCost';
import { totalCost } from '../constants/effectCost';
import type { EffectType } from '../constants/gradientEffects';

// Lowers the render resolution as the active effect stack gets more expensive. Moved out of InteractiveGradient unchanged.
export interface UseResolutionBudgetParams {
  activeEffects: EffectType[];
  isMobile: boolean;
  setResolutionMultiplier: (value: SetStateAction<number>) => void;
}

export function useResolutionBudget(p: UseResolutionBudgetParams) {
  const { activeEffects, isMobile, setResolutionMultiplier } = p;
  // MULTI_FX_COST_BUDGET (effectCost.ts) is set high enough that manually
  // toggling effects in EffectsTab.tsx never grays a button out — stacking
  // is an intentional choice there, unlike a random shuffle result, so it's
  // not that budget's job to protect playback performance. But that also
  // meant manually stacking several expensive effects got zero resolution
  // relief: feelingLucky/randomizeEffects (useRandomization.ts) already
  // call resolutionForEffectCost after picking a shuffled stack, but a
  // manual EffectsTab toggle never did. Applying the same curve here,
  // keyed only on activeEffects, covers both paths uniformly — redundant
  // with (but harmless alongside) the explicit shuffle-path calls, since
  // it converges on the identical value from the same inputs.
  // Skipped in Display mode: resolutionMultiplier arrives there via the
  // synced snapshot (useSnapshot.ts's applySnapshot) so it matches
  // whatever the controller computed from ITS OWN devicePixelRatio —
  // recomputing locally here would instead use the display window's own
  // devicePixelRatio, which can genuinely differ (e.g. mirroring to an
  // external projector) and silently diverge from the controller's choice.
  useEffect(() => {
    if (IS_DISPLAY_MODE) return;
    setResolutionMultiplier(resolutionForEffectCost(totalCost(activeEffects), isMobile));
  }, [activeEffects, isMobile]);
}
