import { describe, it, expect } from 'vitest';
import { ID_MIGRATIONS, effectModeFields, migrateId, migrateIds } from './gradientEffects';
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

  it('sends removed Nebula, Strands and Sheen to their closest remaining looks', () => {
    expect(migrateId('nebula')).toBe('smoke');
    expect(migrateId('strands')).toBe('ribbon');
    expect(migrateId('sheen')).toBe('drape');
  });

  it('sends the removed Flower to Shapes and Raindrops to Caustics', () => {
    expect(migrateId('flower')).toBe('shapes');
    expect(migrateId('raindrops')).toBe('caustics');
  });

  it('sends a removed Constellation to Attractor', () => {
    expect(migrateId('constellation')).toBe('attractor');
  });

  it('sends removed Hatch and Light Beam to Angle and Rays', () => {
    expect(migrateId('hatch')).toBe('angle');
    expect(migrateId('stack')).toBe('angle');
    expect(migrateId('light-beam')).toBe('rays');
  });

  it('rewrites zoom-blur to blur', () => {
    expect(migrateIds(['zoom-blur'])).toEqual(['blur']);
  });

  it('handles null/undefined input as an empty array', () => {
    expect(migrateIds(null)).toEqual([]);
    expect(migrateIds(undefined)).toEqual([]);
  });

  it('leaves already-current effect ids unchanged', () => {
    expect(migrateIds(['liquid', 'blur'])).toEqual(['liquid', 'blur']);
    expect(migrateIds(['liquid', 'fisheye', 'brush-strokes'])).toEqual(['liquid']);
  });

  it('drops a removed Watercolor from saved looks', () => {
    expect(migrateIds(['watercolor', 'blur'])).toEqual(['blur']);
  });

  it('drops a removed Lens from saved looks', () => {
    expect(migrateIds(['lens', 'blur'])).toEqual(['blur']);
  });
});

describe('effects that became modes of another: glitch', () => {
  it('Glitch Blocks and Row Smear load as Glitch, with Row Smear in Rows mode', () => {
    expect(migrateIds(['glitch-blocks'])).toEqual(['glitch']);
    expect(migrateIds(['row-smear'])).toEqual(['glitch']);
    expect(effectModeFields(['row-smear'])).toEqual({ glitchMode: 'rows' });
    expect(effectModeFields(['glitch-blocks'])).toEqual({});
  });
});

describe('effects that became modes of another: film', () => {
  it('Film Stock and Film Burn load as Film, with Film Burn in Burn mode', () => {
    expect(migrateIds(['film-stock'])).toEqual(['film']);
    expect(migrateIds(['film-burn'])).toEqual(['film']);
    expect(effectModeFields(['film-burn'])).toEqual({ filmMode: 'burn' });
    expect(effectModeFields(['film-stock'])).toEqual({});
  });
});

describe('effects that became modes of another: posterize', () => {
  it('Hard Bands loads as Posterize in Palette mode', () => {
    expect(migrateIds(['hard-bands'])).toEqual(['posterize']);
    expect(effectModeFields(['hard-bands'])).toEqual({ posterizeMode: 'palette' });
    expect(effectModeFields(['posterize'])).toEqual({});
  });
});
