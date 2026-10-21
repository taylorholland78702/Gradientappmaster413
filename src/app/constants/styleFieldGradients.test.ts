import { describe, it, expect } from 'vitest';
import {
  FULL_GRADIENT_TYPES, FEELING_LUCKY_GRADIENT_TYPES, AUDIO_GRADIENTS,
  GRADIENT_DISPLAY_NAMES, STYLE_FIELD_GRADIENT_TYPES,
} from './gradientEffects';
import { STYLE_FIELD_IDS } from '../hooks/gradients/drawStyleFieldGL';

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
});
