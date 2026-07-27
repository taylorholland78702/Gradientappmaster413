// EFFECT_DRAW_FNS now lives in constants/effectRegistry.ts as part of the
// unified per-effect registry (drawFn + label + cost + category + audio in
// one place) — re-exported here so existing imports of this module path
// keep working.
export { EFFECT_DRAW_FNS } from '../../constants/effectRegistry';
