import { describe, it, expect } from 'vitest';
import { ID_MIGRATIONS, migrateId, migrateIds } from './gradientEffects';
import { GRADIENT_DRAW_FNS } from '../hooks/gradients/_registry';
import { EFFECT_DRAW_FNS } from './effectRegistry';

// Regression guard for the exact class of bug this map exists to prevent:
// a gradient/effect gets renamed or merged into another one, the migration
// entry is added, but its target typos or drifts out of date as the app
// evolves further — silently breaking every old preset/snapshot that used
// the retired id instead of landing them on the intended replacement.
describe('ID_MIGRATIONS', () => {
  it('every migration target is a currently-registered gradient OR effect type', () => {
    // ID_MIGRATIONS is a single mixed map — migrateId is applied generically
    // to both gradientType (a single value) and each entry of activeEffects
    // (an array, via migrateIds' fallback below), so a target here is valid
    // as long as it lands in either registry, not necessarily both.
    for (const [oldId, newId] of Object.entries(ID_MIGRATIONS)) {
      const validGradient = newId in GRADIENT_DRAW_FNS;
      const validEffect = newId in EFFECT_DRAW_FNS;
      expect(validGradient || validEffect, `migration '${oldId}' -> '${newId}' matches neither registry`).toBe(true);
    }
  });

  it('migrateId passes through unknown ids unchanged', () => {
    expect(migrateId('noise')).toBe('noise');
    expect(migrateId('totally-unknown-id')).toBe('totally-unknown-id');
  });

  it('migrateId rewrites every known legacy id', () => {
    expect(migrateId('radar')).toBe('radial-burst');
    expect(migrateId('helix')).toBe('windmill');
  });
});

describe('migrateIds (effect-only migrations)', () => {
  it('rewrites the grid gradient/effect id collision correctly', () => {
    // 'grid' is a legitimate GradientType id on its own — migrateIds must
    // only ever be applied to activeEffects arrays, where 'grid' actually
    // means the retired effect id, now 'grid-effect'.
    expect(migrateIds(['grid'])).toEqual(['grid-effect']);
    expect(EFFECT_DRAW_FNS).toHaveProperty('grid-effect');
  });

  it('rewrites zoom-blur to blur', () => {
    expect(migrateIds(['zoom-blur'])).toEqual(['blur']);
  });

  it('handles null/undefined input as an empty array', () => {
    expect(migrateIds(null)).toEqual([]);
    expect(migrateIds(undefined)).toEqual([]);
  });

  it('leaves already-current effect ids unchanged', () => {
    expect(migrateIds(['liquid', 'fisheye'])).toEqual(['liquid', 'fisheye']);
  });
});
