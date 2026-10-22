import { describe, it, expect } from 'vitest';
import { PALETTE_GROUPS, PALETTE_PRESETS } from './palettePresets';

describe('palette library', () => {
  it('has well-formed, uniquely named palettes of 2-6 hex colors', () => {
    const names = new Set<string>();
    for (const p of PALETTE_PRESETS) {
      expect(names.has(p.name), `duplicate ${p.name}`).toBe(false);
      names.add(p.name);
      expect(p.colors.length, p.name).toBeGreaterThanOrEqual(2);
      expect(p.colors.length, p.name).toBeLessThanOrEqual(6);
      for (const c of p.colors) expect(c, p.name).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('offers a large choice across several groups', () => {
    expect(PALETTE_GROUPS.length).toBeGreaterThanOrEqual(6);
    expect(PALETTE_PRESETS.length).toBeGreaterThanOrEqual(60);
  });
});
