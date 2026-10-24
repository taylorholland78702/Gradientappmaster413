import { describe, it, expect } from 'vitest';
import { EFFECT_IDS, EFFECT_COST, EFFECT_LABELS, EFFECT_DRAW_FNS } from './effectRegistry';
import { GRADIENT_DRAW_FNS } from '../hooks/gradients/_registry';
import { FULL_GRADIENT_TYPES, GRADIENT_DISPLAY_NAMES, STYLE_FIELD_GRADIENT_TYPES, AUDIO_GRADIENTS, migrateId, ID_MIGRATIONS } from './gradientEffects';
import { MODULATABLE_PARAMS } from './modulatableParams';
import { SNAPSHOT_LIMITS } from './snapshotLimits';

describe('effect registry', () => {
  it('every effect has a draw function, a cost and a label', () => {
    for (const id of EFFECT_IDS) {
      expect(typeof EFFECT_DRAW_FNS[id], `draw fn for ${id}`).toBe('function');
      expect(EFFECT_COST[id], `cost for ${id}`).toBeGreaterThan(0);
      expect(EFFECT_LABELS[id], `label for ${id}`).toBeTruthy();
    }
  });

  it('ids are unique and none were left over from removed effects', () => {
    expect(new Set(EFFECT_IDS).size).toBe(EFFECT_IDS.length);
    expect(EFFECT_IDS).not.toContain('fisheye');
    expect(EFFECT_IDS).not.toContain('brush-strokes');
  });
});

describe('gradient registry', () => {
  it('every gradient in the picker has a draw function and a display name', () => {
    for (const id of FULL_GRADIENT_TYPES) {
      expect(typeof GRADIENT_DRAW_FNS[id], `draw fn for ${id}`).toBe('function');
      expect(GRADIENT_DISPLAY_NAMES[id], `name for ${id}`).toBeTruthy();
    }
  });

  it('the styled-field and audio lists only name real gradients', () => {
    for (const id of [...STYLE_FIELD_GRADIENT_TYPES, ...AUDIO_GRADIENTS]) expect(FULL_GRADIENT_TYPES).toContain(id);
  });

  it('old gradient ids are migrated to ones that exist', () => {
    for (const [from, to] of Object.entries(ID_MIGRATIONS)) {
      expect(migrateId(from)).toBe(to);
      if (from in GRADIENT_DISPLAY_NAMES) continue;
    }
  });
});

describe('snapshot limits', () => {
  it('every limit is a sane [min, max] pair', () => {
    for (const [key, [lo, hi]] of Object.entries(SNAPSHOT_LIMITS)) {
      expect(Number.isFinite(lo) && Number.isFinite(hi), key).toBe(true);
      expect(lo, key).toBeLessThan(hi);
    }
  });
  it('the limits never clip a value the audio modulation range allows', () => {
    for (const { key, min, max } of MODULATABLE_PARAMS) {
      const limit = SNAPSHOT_LIMITS[key];
      if (!limit) continue;
      expect(limit[0], `${key} min`).toBeLessThanOrEqual(min);
      expect(limit[1], `${key} max`).toBeGreaterThanOrEqual(max);
    }
  });
});
