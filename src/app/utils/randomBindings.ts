import { MODULATABLE_PARAMS } from '../constants/modulatableParams';
import { EFFECT_MOD_CATEGORY } from '../constants/effectRegistry';
import { GLOBAL_CATEGORIES, modCategoriesFor } from '../constants/gradientModCategories';
import type { AudioBinding } from '../hooks/state/useAudioBindingsState';

// Settings whose audio swing is hard to see on screen (an offset, a direction, a start angle). Not excluded outright
// (they are still eligible when they are the only sliders in a sparse pool), just weighted down so a shuffle more
// often lands on one you can actually watch move.
export const LOW_VISIBILITY_MOD_KEYS = new Set([
  'angleCenterX', 'angleCenterY', 'angleStartOffset',
  'blurMotionDirection', 'fadeDirection', 'noiseDirection',
]);

const BANDS: AudioBinding['band'][] = ['sub', 'mids', 'treble', 'energy'];

// One to three random audio bindings drawn only from the settings of the gradient and effects that are on, so none of
// them points at a slider that does nothing right now. Falls back to every setting only when the current look has none.
export function randomBindings(gradientType: string | null | undefined, activeEffects: readonly string[]): AudioBinding[] {
  const active = modCategoriesFor(gradientType, activeEffects as string[], EFFECT_MOD_CATEGORY);
  const relevant = MODULATABLE_PARAMS.filter(p => active.has(p.category));
  const pool = relevant.length > 0 ? relevant : MODULATABLE_PARAMS;
  const count = Math.min(1 + Math.floor(Math.random() * 3), pool.length);
  // Weighted sampling without replacement.
  const candidates = pool.map(p => ({ p, weight: LOW_VISIBILITY_MOD_KEYS.has(p.key) || (GLOBAL_CATEGORIES as readonly string[]).includes(p.category) ? 1 : 4 }));
  const picked: typeof pool = [];
  for (let i = 0; i < count && candidates.length > 0; i++) {
    const total = candidates.reduce((sum, c) => sum + c.weight, 0);
    let roll = Math.random() * total;
    let idx = 0;
    for (; idx < candidates.length; idx++) {
      roll -= candidates[idx].weight;
      if (roll < 0) break;
    }
    picked.push(candidates[Math.min(idx, candidates.length - 1)].p);
    candidates.splice(Math.min(idx, candidates.length - 1), 1);
  }
  return picked.map((p): AudioBinding => ({
    id: `${Date.now()}-${Math.random()}`,
    param: p.key,
    band: BANDS[Math.floor(Math.random() * BANDS.length)],
    // A near-zero depth binds but never swings far enough to read as reacting to the music, so depth starts at 0.9.
    amount: Number(((Math.random() < 0.15 ? -1 : 1) * (0.9 + Math.random() * 2.3)).toFixed(1)),
  }));
}
