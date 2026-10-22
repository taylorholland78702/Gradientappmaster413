import { describe, it, expect } from 'vitest';
import {
  FULL_GRADIENT_TYPES, FEELING_LUCKY_GRADIENT_TYPES, AUDIO_GRADIENTS,
  GRADIENT_DISPLAY_NAMES, STYLE_FIELD_GRADIENT_TYPES, GRADIENT_FAMILIES, migrateId,
} from './gradientEffects';
import { STYLE_FIELD_IDS } from '../hooks/gradients/drawStyleFieldGL';
import { MODULATABLE_PARAMS, resolveModulationKey } from './modulatableParams';
import { GRADIENT_LOOKS, LOOK_PARAM_KEYS } from './gradientLooks';
import { GRADIENT_MOD_CATEGORY } from '../hooks/useRandomization';
import { STYLE_SHAPE_CONTROLS } from './styleShapeControls';

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

describe('per-gradient looks', () => {
  it('every gradient has at least three looks', () => {
    for (const id of FULL_GRADIENT_TYPES) {
      expect(GRADIENT_LOOKS[id]?.length ?? 0, id).toBeGreaterThanOrEqual(3);
    }
  });

  it('only real gradients have looks, with unique names per gradient', () => {
    for (const [id, looks] of Object.entries(GRADIENT_LOOKS)) {
      expect(FULL_GRADIENT_TYPES as string[], id).toContain(id);
      const names = (looks ?? []).map((l) => l.name);
      expect(new Set(names).size, id).toBe(names.length);
    }
  });

  it('palettes are valid hex colors within the app palette limits, and shared values stay in slider range', () => {
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

  it("a look's own settings are supported keys and stay inside that slider's range", () => {
    const range = new Map(MODULATABLE_PARAMS.filter((p) => !p.target).map((p) => [p.key, p]));
    const supported = new Set<string>(LOOK_PARAM_KEYS);
    let checked = 0;
    for (const [id, looks] of Object.entries(GRADIENT_LOOKS)) {
      for (const l of looks ?? []) {
        for (const [key, value] of Object.entries(l.params ?? {})) {
          const where = `${id}/${l.name}/${key}`;
          expect(supported.has(key), where).toBe(true);
          const meta = range.get(key);
          if (typeof value === 'number' && meta) {
            checked++;
            expect(value, where).toBeGreaterThanOrEqual(meta.min);
            expect(value, where).toBeLessThanOrEqual(meta.max);
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(40);
  });

  it('mode switches only use values the mode accepts', () => {
    const allowed: Record<string, string[]> = { noiseType: ['smooth', 'ridged'], windmillMode: ['blades', 'helix'], radialBurstMode: ['burst', 'sweep'] };
    for (const [id, looks] of Object.entries(GRADIENT_LOOKS)) {
      for (const l of looks ?? []) {
        for (const [key, value] of Object.entries(l.params ?? {})) {
          if (allowed[key]) expect(allowed[key], `${id}/${l.name}/${key}`).toContain(value);
        }
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

describe('quick-bind keys', () => {
  it('every styled gradient has Scale and Speed modulation entries under its camelCase id', () => {
    const keys = new Set(MODULATABLE_PARAMS.map(p => p.key));
    for (const t of STYLE_FIELD_GRADIENT_TYPES) {
      const id = t.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());
      expect(keys.has(`${id}Scale`), t).toBe(true);
      expect(keys.has(`${id}Speed`), t).toBe(true);
    }
  });
});

describe('shape controls', () => {
  it('every styled gradient labels both of its shape sliders', () => {
    for (const t of STYLE_FIELD_GRADIENT_TYPES) {
      const c = STYLE_SHAPE_CONTROLS[t];
      expect(c, t).toBeDefined();
      expect(c![0].label && c![1].label, t).toBeTruthy();
    }
  });
});

describe('merged gradient families', () => {
  it('only group real, selectable gradients, each in at most one family', () => {
    const seen = new Set<string>();
    for (const f of GRADIENT_FAMILIES) {
      expect(f.members.length, f.id).toBeGreaterThanOrEqual(2);
      for (const m of f.members) {
        expect(FULL_GRADIENT_TYPES, `${f.id}/${m.type}`).toContain(m.type);
        expect(seen.has(m.type), `${m.type} in two families`).toBe(false);
        seen.add(m.type);
      }
    }
  });

  it('sends the removed gradients to a close surviving one', () => {
    expect(migrateId('aurora')).toBe('curtains');
    expect(migrateId('mesh-wireframe')).toBe('voronoi');
    expect(FULL_GRADIENT_TYPES).not.toContain('aurora' as never);
    expect(FULL_GRADIENT_TYPES).not.toContain('mesh-wireframe' as never);
  });
});
