import { describe, it, expect } from 'vitest';
import {
  FULL_GRADIENT_TYPES, FEELING_LUCKY_GRADIENT_TYPES, AUDIO_GRADIENTS,
  GRADIENT_DISPLAY_NAMES, STYLE_FIELD_GRADIENT_TYPES,
} from './gradientEffects';
import { STYLE_FIELD_IDS } from '../hooks/gradients/drawStyleFieldGL';
import { MODULATABLE_PARAMS, resolveModulationKey } from './modulatableParams';
import { GRADIENT_MOD_CATEGORY } from '../hooks/useRandomization';

// The styled-field gradients are declared in two places that must agree: the
// shader bodies in drawStyleFieldGL.ts and the UI/randomization lists in
// gradientEffects.ts. A style present in one but not the other would either
// never be selectable or render nothing.
describe('styled-field gradients', () => {
  it('shader ids and the UI list are the same set', () => {
    expect([...STYLE_FIELD_IDS].sort()).toEqual([...STYLE_FIELD_GRADIENT_TYPES].sort());
  });

  it('every style is selectable, named, and in the shuffle pools', () => {
    for (const id of STYLE_FIELD_GRADIENT_TYPES) {
      expect(FULL_GRADIENT_TYPES).toContain(id);
      expect(FEELING_LUCKY_GRADIENT_TYPES).toContain(id);
      expect(AUDIO_GRADIENTS).toContain(id);
      expect(GRADIENT_DISPLAY_NAMES[id]).toBeTruthy();
    }
  });

  it('keeps the gradient list alphabetical by id', () => {
    expect([...FULL_GRADIENT_TYPES]).toEqual([...FULL_GRADIENT_TYPES].sort());
  });

  // The advanced audio settings (Modulation) list every styled gradient under
  // its own name, each with a Scale and a Speed that drive the shared
  // fieldScale/fieldSpeed.
  it('every style has Scale and Speed modulation entries and a shuffle category', () => {
    for (const id of STYLE_FIELD_GRADIENT_TYPES) {
      const cats = GRADIENT_MOD_CATEGORY[id];
      expect(cats, `${id} missing from GRADIENT_MOD_CATEGORY`).toBeTruthy();
      const params = MODULATABLE_PARAMS.filter((p) => cats.includes(p.category));
      expect(params.map((p) => p.target).sort(), id).toEqual(['fieldScale', 'fieldSpeed']);
      for (const p of params) expect(resolveModulationKey(p.key)).toBe(p.target);
    }
  });

  it('modulation keys are unique, and non-aliased keys resolve to themselves', () => {
    const keys = MODULATABLE_PARAMS.map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(resolveModulationKey('marbleVeinFreq')).toBe('marbleVeinFreq');
  });

  it("keeps the Halftone gradient's category apart from the Halftone effect's", () => {
    const effectCats = new Set(MODULATABLE_PARAMS.filter((p) => !p.target).map((p) => p.category));
    expect(effectCats.has('Halftone')).toBe(true);
    expect(GRADIENT_MOD_CATEGORY['halftone-screen']).toEqual(['Halftone (Gradient)']);
  });
});

import { GRADIENT_LOOKS } from './gradientLooks';

describe('per-gradient looks', () => {
  it('every styled gradient has at least three looks', () => {
    for (const id of STYLE_FIELD_GRADIENT_TYPES) {
      expect(GRADIENT_LOOKS[id]?.length ?? 0, id).toBeGreaterThanOrEqual(3);
    }
  });

  it('only styled gradients have looks, with unique names per gradient', () => {
    for (const [id, looks] of Object.entries(GRADIENT_LOOKS)) {
      expect(STYLE_FIELD_GRADIENT_TYPES as string[], id).toContain(id);
      const names = (looks ?? []).map((l) => l.name);
      expect(new Set(names).size, id).toBe(names.length);
    }
  });

  it('palettes are valid hex colors within the app palette limits, and values stay in slider range', () => {
    for (const [id, looks] of Object.entries(GRADIENT_LOOKS)) {
      for (const l of looks ?? []) {
        const where = `${id}/${l.name}`;
        expect(l.colors.length, where).toBeGreaterThanOrEqual(2);
        expect(l.colors.length, where).toBeLessThanOrEqual(10);
        for (const c of l.colors) expect(c, where).toMatch(/^#[0-9a-fA-F]{6}$/);
        if (l.scale !== undefined) { expect(l.scale, where).toBeGreaterThanOrEqual(0.3); expect(l.scale, where).toBeLessThanOrEqual(3); }
        if (l.speed !== undefined) { expect(l.speed, where).toBeGreaterThanOrEqual(0); expect(l.speed, where).toBeLessThanOrEqual(3); }
        if (l.bias !== undefined) { expect(l.bias, where).toBeGreaterThanOrEqual(0); expect(l.bias, where).toBeLessThanOrEqual(1); }
        if (l.sharp !== undefined) { expect(l.sharp, where).toBeGreaterThanOrEqual(0); expect(l.sharp, where).toBeLessThanOrEqual(1); }
      }
    }
  });

  it('the dark single-light gradients all start from a dark ground', () => {
    const lum = (hex: string) => {
      const n = parseInt(hex.slice(1), 16);
      return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
    };
    for (const id of ['light-beam', 'edge-glow', 'curtains', 'eclipse', 'rays', 'vortex'] as const) {
      for (const l of GRADIENT_LOOKS[id] ?? []) expect(lum(l.colors[0]), `${id}/${l.name}`).toBeLessThan(0.1);
    }
  });
});
