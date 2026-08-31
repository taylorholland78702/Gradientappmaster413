// Static data tables for gradient types and effects: what exists, what it's
// called, and which lists group them for randomization/audio-reactivity.
// Pulled out of InteractiveGradient.tsx so "what effects/gradients exist and
// what's their display name" can be found and edited in one place instead of
// scattered across a single 8000+ line component.

export interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

export type GradientType = 'radial' | 'angle' | 'windmill' | 'fade' | 'fireworks' | 'radial-burst' | 'noise' | 'plasma' | 'grid' | 'shapes' | 'voronoi' | 'flower' | 'aurora' | 'caustics' | 'lava-lamp' | 'lightning' | 'marble' | 'metaballs' | 'truchet' | 'moire' | 'attractor' | 'reaction-diffusion' | 'topographic' | 'julia' | 'particles' | 'tiling' | 'wave-interference' | 'mesh-wireframe' | 'stack';

// 'grid-effect' (not 'grid') deliberately — GradientType already uses 'grid'
// for an unrelated gradient pattern, and sharing the same id string between
// the two was a real footgun for any `=== 'grid'` check plus ambiguous in
// preset/export data. See EFFECT_ONLY_MIGRATIONS below for old presets.
//
// EffectType, ALL_EFFECTS, and AUDIO_EFFECTS now live in effectRegistry.ts,
// derived from the single per-effect registry object there instead of being
// hand-authored here — re-exported below so existing imports of this module
// keep working.
export type { EffectType } from './effectRegistry';
export { ALL_EFFECTS, AUDIO_EFFECTS } from './effectRegistry';
import type { EffectType } from './effectRegistry';

export const DEFAULT_COLORS: ColorRGB[] = [
  { r: 255, g: 100, b: 200 }, // Pink
  { r: 180, g: 100, b: 255 }, // Purple
  { r: 100, g: 150, b: 255 }, // Blue
  { r: 100, g: 255, b: 200 }, // Cyan
  { r: 150, g: 255, b: 150 }, // Green
  { r: 255, g: 200, b: 100 }, // Orange
];

// Math constants - pre-calculated for performance
export const DEG_TO_RAD = Math.PI / 180;
export const TWO_PI = Math.PI * 2;

// Effect/gradient internal ids were renamed to match their UI labels
// (film-grain -> grain, color-shift -> shift, vhs-glitch -> vhs,
// wave-distortion -> wave, conical-spiral -> helix, polygon-solid ->
// polar-grid, spiral -> windmill). Presets saved before this rename — in
// Firestore or the local rated-results cache — still contain the old ids,
// so any external data must be run through this map before use.
export const ID_MIGRATIONS: Record<string, string> = {
  // Radar was folded into Radial Burst as a 'sweep' mode (radialBurstMode)
  // rather than staying a separate gradient type — old presets/results that
  // reference it by the old id still land on the (now-merged) Radial Burst
  // gradient instead of silently falling back to a default. The mode itself
  // isn't migrated here (this only remaps the id string), so an old radar
  // preset loads as Radial Burst in whatever mode was last selected rather
  // than specifically 'sweep' — same accepted tradeoff as zoom-blur's
  // migration into Blur below.
  'radar': 'radial-burst',
  // Helix was folded into Windmill as a 'helix' mode (windmillMode) rather
  // than staying a separate gradient type — same reasoning as Radar above.
  'helix': 'windmill',
  // Polar Grid was folded into Shapes as a 'polar-grid' mode (shapesMode) —
  // same reasoning as Radar/Helix above.
  'polar-grid': 'shapes',
  // Flow Field was folded into Particles as a 'flow-field' mode
  // (particlesMode) — same reasoning as Radar/Helix above.
  'flow-field': 'particles',
  // Turrell was folded into Fade as a 'light' mode (fadeMode) — same
  // reasoning as Radar/Helix above.
  'turrell': 'fade',
  'film-grain': 'grain',
  'color-shift': 'shift',
  'vhs-glitch': 'vhs',
  'wave-distortion': 'wave',
  'conical-spiral': 'windmill',
  // Direct to 'shapes' (not 'polar-grid') — migrateId is a single lookup,
  // not chained, and 'polar-grid' is itself now migrated away above.
  'polygon-solid': 'shapes',
  'spiral': 'windmill',
};
export const migrateId = (id: string): string => ID_MIGRATIONS[id] || id;

// Effect-only renames — kept separate from ID_MIGRATIONS because that map
// is also applied to gradientType via migrateId, and 'grid' is a
// legitimate, unrelated GradientType id that must NOT be rewritten. This
// only ever runs on activeEffects arrays (via migrateIds below).
const EFFECT_ONLY_MIGRATIONS: Record<string, string> = {
  'grid': 'grid-effect',
  // Zoom Blur was folded into Blur as a 4th mode (blurType: 'zoom') rather
  // than staying a separate effect — old presets/snapshots that reference
  // it by its old id still activate the (now-merged) Blur effect instead of
  // silently dropping it. blurType itself isn't migrated here (this only
  // touches activeEffects id strings), so an old zoom-blur preset loads as
  // Blur in whatever mode was last selected rather than specifically Zoom.
  'zoom-blur': 'blur',
};
export const migrateIds = (ids: string[] | undefined | null): string[] =>
  (ids || []).map(id => EFFECT_ONLY_MIGRATIONS[id] || migrateId(id));

// speed/sensitivity added for Mood Presets (Presets tab "Moods" strip) —
// vcrPlaybackSpeed and masterSensitivity multipliers tuned to each mood's
// character. 'concentric' was never a valid GradientType (esbuild doesn't
// type-check so this went unnoticed) and has been swapped for 'mesh'.
export const WAV_MOODS = [
  { name: 'dark',       hues: [260, 280, 220],  sat: [40, 65]  as [number,number],  lit: [20, 38]  as [number,number],  effects: ['vignette', 'grain'] as EffectType[],  gradients: ['radial', 'noise', 'aurora'] as GradientType[], speed: 0.6, sensitivity: 1.2 },
  { name: 'pastel',     hues: [300, 180, 60],   sat: [35, 60]  as [number,number],  lit: [72, 88]  as [number,number],  effects: ['blur', 'chromatic'] as EffectType[],       gradients: ['radial', 'shapes', 'fade', 'plasma'] as GradientType[], speed: 0.8, sensitivity: 0.8 },
  { name: 'neon',       hues: [300, 180, 60],   sat: [90, 100] as [number,number],  lit: [45, 58]  as [number,number],  effects: ['chromatic', 'bloom'] as EffectType[],      gradients: ['radial', 'plasma', 'grid', 'radial-burst'] as GradientType[], speed: 2.0, sensitivity: 1.8 },
  { name: 'warm',       hues: [10, 30, 50],     sat: [70, 95]  as [number,number],  lit: [45, 65]  as [number,number],  effects: ['vignette', 'grain'] as EffectType[],  gradients: ['radial', 'fade', 'windmill'] as GradientType[], speed: 1.0, sensitivity: 1.0 },
  { name: 'cool',       hues: [200, 220, 240],  sat: [55, 85]  as [number,number],  lit: [40, 62]  as [number,number],  effects: ['blur'] as EffectType[],                     gradients: ['radial', 'noise', 'grid', 'voronoi'] as GradientType[], speed: 0.7, sensitivity: 0.9 },
  { name: 'monochrome', hues: [220, 220, 220],  sat: [5,  20]  as [number,number],  lit: [20, 80]  as [number,number],  effects: ['grain', 'vignette'] as EffectType[],  gradients: ['radial', 'noise', 'shapes'] as GradientType[], speed: 0.5, sensitivity: 1.0 },
  { name: 'sunset',     hues: [0,   20,  40],   sat: [80, 100] as [number,number],  lit: [50, 68]  as [number,number],  effects: ['chromatic', 'vignette'] as EffectType[],   gradients: ['radial', 'fade', 'plasma', 'angle'] as GradientType[], speed: 0.8, sensitivity: 1.1 },
  { name: 'forest',     hues: [100, 140, 160],  sat: [45, 75]  as [number,number],  lit: [30, 52]  as [number,number],  effects: ['grain', 'blur'] as EffectType[],       gradients: ['radial', 'noise', 'voronoi'] as GradientType[], speed: 0.6, sensitivity: 0.9 },
];

// Display name shown in the Gradient tab for each internal GradientType id.
export const GRADIENT_DISPLAY_NAMES: Record<string, string> = {
  angle: 'Angle', aurora: 'Aurora', caustics: 'Caustics',
  fade: 'Fade', fireworks: 'Fireworks', flower: 'Flower',
  grid: 'Grid',
  'lava-lamp': 'Lava Lamp', lightning: 'Lightning', marble: 'Marble',
  noise: 'Noise', plasma: 'Plasma',
  radial: 'Radial', 'radial-burst': 'Radial Burst',
  shapes: 'Shapes', windmill: 'Windmill',
  voronoi: 'Voronoi',
  metaballs: 'Metaballs', truchet: 'Truchet', moire: 'Moire',
  attractor: 'Attractor', 'reaction-diffusion': 'Reaction-Diffusion',
  topographic: 'Topographic', julia: 'Julia Set',
  particles: 'Particles',
  tiling: 'Tiling',
  'wave-interference': 'Wave Interference',
  'mesh-wireframe': 'Mesh Wireframe',
  'stack': 'Stack',
};

// Full gradient type list for UI
export const FULL_GRADIENT_TYPES: GradientType[] = ['angle', 'attractor', 'aurora', 'caustics', 'fade', 'flower', 'grid', 'julia', 'lava-lamp', 'marble', 'mesh-wireframe', 'metaballs', 'moire', 'noise', 'plasma', 'radial', 'radial-burst', 'particles', 'reaction-diffusion', 'shapes', 'tiling', 'topographic', 'truchet', 'voronoi', 'wave-interference', 'windmill', 'stack'];

// Gradient types for Randomize (excludes freeform and mesh)
export const FEELING_LUCKY_GRADIENT_TYPES: GradientType[] = ['angle', 'attractor', 'aurora', 'caustics', 'fade', 'flower', 'grid', 'julia', 'lava-lamp', 'marble', 'mesh-wireframe', 'noise', 'plasma', 'radial', 'radial-burst', 'particles', 'reaction-diffusion', 'shapes', 'tiling', 'topographic', 'voronoi', 'wave-interference', 'windmill', 'metaballs', 'truchet', 'moire', 'stack'];

// Gradients that pulse/react visibly with audio
export const AUDIO_GRADIENTS: GradientType[] = ['radial', 'radial-burst', 'shapes', 'plasma', 'noise', 'windmill', 'grid', 'angle', 'fade', 'flower', 'voronoi', 'aurora', 'caustics', 'lava-lamp', 'marble', 'attractor', 'julia', 'metaballs', 'moire', 'reaction-diffusion', 'topographic', 'truchet', 'particles', 'wave-interference', 'mesh-wireframe', 'stack'];

// Gradient types where click-drag should not move the gradient's center.
// Doesn't cover Particles' 'flow-field' mode (formerly the standalone Flow
// Field gradient, which was in this list) since that's now mode-dependent
// rather than type-dependent — see the NO_DRAG_TYPES.includes(...) call
// site, which adds that check inline.
export const NO_DRAG_TYPES = ['windmill', 'flower', 'tiling'];
