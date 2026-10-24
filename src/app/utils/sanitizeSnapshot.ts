import { SNAPSHOT_LIMITS } from '../constants/snapshotLimits';
import { EFFECT_IDS } from '../constants/effectRegistry';
import { costOf, MULTI_FX_COST_BUDGET } from '../constants/effectCost';
import { FULL_GRADIENT_TYPES, GRADIENT_DISPLAY_NAMES, migrateId, migrateIds } from '../constants/gradientEffects';

const MAX_STRING = 2000;
const MAX_COLORS = 24;
const KNOWN_GRADIENTS = new Set<string>([...FULL_GRADIENT_TYPES, ...Object.keys(GRADIENT_DISPLAY_NAMES)]);
const KNOWN_EFFECTS = new Set<string>(EFFECT_IDS);

const isColor = (c: unknown): boolean => {
  if (!c || typeof c !== 'object') return false;
  const o = c as Record<string, unknown>;
  return ['r', 'g', 'b'].every(k => typeof o[k] === 'number' && Number.isFinite(o[k] as number));
};

// Cleans a snapshot that came from outside the app (a ?preset= link, a stored or synced preset) before
// it reaches applySnapshot: numbers are clamped to their control's range, unknown ids are dropped, and
// effect lists are capped to the cost budget. Returns a new object; never throws.
export function sanitizeSnapshot<T extends object>(input: T): T {
  const src = (input && typeof input === 'object' && !Array.isArray(input) ? input : {}) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(src)) {
    const limit = SNAPSHOT_LIMITS[key];
    if (limit) {
      if (typeof value === 'number' && Number.isFinite(value)) out[key] = Math.min(limit[1], Math.max(limit[0], value));
      continue; // a non-number in a numeric field is dropped so the default applies
    }
    if (typeof value === 'string') out[key] = value.slice(0, MAX_STRING);
    else out[key] = value;
  }

  if ('gradientType' in out) {
    const id = typeof out.gradientType === 'string' ? migrateId(out.gradientType) : '';
    out.gradientType = KNOWN_GRADIENTS.has(id) ? id : 'angle';
  }

  if ('activeEffects' in out) {
    const raw = Array.isArray(out.activeEffects) ? out.activeEffects.filter((e: unknown) => typeof e === 'string') : [];
    const kept: string[] = [];
    let cost = 0;
    for (const id of migrateIds(raw)) {
      if (!KNOWN_EFFECTS.has(id) || kept.includes(id)) continue;
      const c = costOf(id as never);
      if (cost + c > MULTI_FX_COST_BUDGET) continue;
      cost += c;
      kept.push(id);
    }
    out.activeEffects = kept;
  }

  for (const key of ['gradientColors', 'targetColors']) {
    if (key in out) {
      const list = Array.isArray(out[key]) ? out[key].filter(isColor).slice(0, MAX_COLORS) : [];
      if (list.length >= 2) out[key] = list; else delete out[key];
    }
  }
  return out as T;
}
