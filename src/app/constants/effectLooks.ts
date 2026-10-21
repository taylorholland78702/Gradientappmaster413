import type { EffectType } from './effectRegistry';

// One-tap effect stacks for the Effects tab. Each turns Multi-FX on with a few
// effects that work well together, at their own current settings.
export interface EffectLook {
  name: string;
  hint: string;
  effects: EffectType[];
}

export const EFFECT_LOOKS: EffectLook[] = [
  { name: 'VHS Tape', hint: 'Tracking noise, color fringing and grain', effects: ['vhs', 'chromatic', 'grain'] },
  { name: 'Film', hint: 'Grain, a soft vignette and a little bloom', effects: ['grain', 'vignette', 'bloom'] },
  { name: 'Dream', hint: 'Bloom and blur with a soft glow', effects: ['bloom', 'blur', 'aura-glow'] },
  { name: 'Old Screen', hint: 'CRT scanlines, fringing and a darkened edge', effects: ['crt', 'chromatic', 'vignette'] },
  { name: 'Print', hint: 'Halftone dots on paper-like grain', effects: ['halftone', 'grain'] },
  { name: 'Painted', hint: 'Oil paint over a gesso ground', effects: ['oil-paint', 'gesso'] },
];
