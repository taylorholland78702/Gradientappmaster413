import type { ColorRGB, GradientType } from './gradientEffects';
import type { EffectType } from './effectRegistry';

export interface QuickStartPreset {
  id: string;
  label: string;
  gradientType: GradientType;
  gradientColors: ColorRGB[];
  activeEffects: EffectType[];
}

// A handful of curated, one-click starting points for first-time visitors —
// each picks one gradient type + a couple of effects that read well
// together, so "I don't know where to start" isn't the first thing a new
// user hits before ever finding the full control panel. Deliberately kept
// to 5: enough to show range across gradient families (procedural noise,
// particle-based, radial, geometric, native-canvas-gradient) and effect
// families (bloom/chromatic, blur, grain, glitch/vhs, vignette) without
// turning into a second preset browser.
export const QUICK_START_PRESETS: QuickStartPreset[] = [
  {
    id: 'neon-pulse',
    label: 'Neon Pulse',
    gradientType: 'plasma',
    gradientColors: [
      { r: 255, g: 0, b: 170 },
      { r: 140, g: 0, b: 255 },
      { r: 0, g: 220, b: 255 },
    ],
    activeEffects: ['bloom', 'chromatic'],
  },
  {
    id: 'ocean-drift',
    label: 'Ocean Drift',
    gradientType: 'flow-field',
    gradientColors: [
      { r: 20, g: 80, b: 160 },
      { r: 40, g: 160, b: 200 },
      { r: 120, g: 230, b: 220 },
    ],
    activeEffects: ['blur'],
  },
  {
    id: 'sunset-glow',
    label: 'Sunset Glow',
    gradientType: 'radial-burst',
    gradientColors: [
      { r: 255, g: 120, b: 40 },
      { r: 255, g: 60, b: 120 },
      { r: 255, g: 210, b: 90 },
    ],
    activeEffects: ['grain'],
  },
  {
    id: 'glitch-grid',
    label: 'Glitch Grid',
    gradientType: 'grid',
    gradientColors: [
      { r: 10, g: 10, b: 10 },
      { r: 255, g: 255, b: 255 },
      { r: 255, g: 30, b: 30 },
    ],
    activeEffects: ['glitch', 'vhs'],
  },
  {
    id: 'aurora-dream',
    label: 'Aurora Dream',
    gradientType: 'aurora',
    gradientColors: [
      { r: 40, g: 220, b: 150 },
      { r: 90, g: 60, b: 220 },
      { r: 40, g: 120, b: 220 },
    ],
    activeEffects: ['vignette'],
  },
];
