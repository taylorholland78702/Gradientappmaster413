import { describe, it, expect } from 'vitest';
import effectsTabSource from '../components/EffectsTab.tsx?raw';
import { resolveParam } from './modResolve';
import { EFFECT_MOD_CATEGORY } from '../constants/effectRegistry';

// Learn binding turns a touched slider into its audio setting by the slider's label (resolveParam). A slider whose
// label does not match its setting's name could never be bound that way, so every slider in an effect's panel must resolve.
describe('effect sliders and learn binding', () => {
  it('every slider in an effect panel resolves to an audio setting', () => {
    const src: string = effectsTabSource;
    const unresolved: string[] = [];
    for (const part of src.split('<EffectSection id="').slice(1)) {
      const id = part.slice(0, part.indexOf('"'));
      const body = part.slice(0, part.indexOf('</EffectSection>'));
      for (const m of body.matchAll(/(?:SliderRow|StepperRow) label="([^"]+)"/g)) {
        if (!resolveParam(m[1], EFFECT_MOD_CATEGORY[id] ?? [])) unresolved.push(`${id}: ${m[1]}`);
      }
    }
    expect(unresolved).toEqual([]);
  });
});
