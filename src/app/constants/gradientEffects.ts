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

export type GradientType = 'radial' | 'angle' | 'windmill' | 'polar-grid' | 'waves' | 'fade' | 'helix' | 'radial-burst' | 'noise' | 'plasma' | 'grid' | 'freeform' | 'shapes' | 'voronoi' | 'mesh' | 'iridescent' | 'radar' | 'flower' | 'linear' | 'polygon' | 'star' | 'starburst' | 'checkerboard' | 'aurora' | 'caustics' | 'lava-lamp' | 'marble' | 'metaballs' | 'truchet' | 'moire' | 'flow-field';

export type EffectType = 'none' | 'kaleidoscope' | 'invert' | 'pixelate' | 'triangulate' | 'chromatic' | 'fisheye' | 'grain' | 'charcoal' | 'posterize' | 'halftone' | 'vhs' | 'blur' | 'wave' | 'shift' | 'duotone' | 'vignette' | 'grid' | 'dither' | 'slit-scan' | 'oil-paint' | 'motion-blur' | 'zoom-blur' | 'bloom' | 'feedback' | 'ripple' | 'mirror' | 'ascii' | 'liquid' | 'chromatic-trails' | 'pulse' | 'scanlines';

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
  'film-grain': 'grain',
  'color-shift': 'shift',
  'vhs-glitch': 'vhs',
  'wave-distortion': 'wave',
  'conical-spiral': 'helix',
  'polygon-solid': 'polar-grid',
  'spiral': 'windmill',
};
export const migrateId = (id: string): string => ID_MIGRATIONS[id] || id;
export const migrateIds = (ids: string[] | undefined | null): string[] =>
  (ids || []).map(migrateId);

// speed/sensitivity added for Mood Presets (Presets tab "Moods" strip) —
// vcrPlaybackSpeed and masterSensitivity multipliers tuned to each mood's
// character. 'concentric' was never a valid GradientType (esbuild doesn't
// type-check so this went unnoticed) and has been swapped for 'mesh'.
export const WAV_MOODS = [
  { name: 'dark',       hues: [260, 280, 220],  sat: [40, 65]  as [number,number],  lit: [20, 38]  as [number,number],  effects: ['vignette', 'grain'] as EffectType[],  gradients: ['radial', 'noise', 'mesh', 'aurora'] as GradientType[], speed: 0.6, sensitivity: 1.2 },
  { name: 'pastel',     hues: [300, 180, 60],   sat: [35, 60]  as [number,number],  lit: [72, 88]  as [number,number],  effects: ['blur', 'chromatic'] as EffectType[],       gradients: ['radial', 'shapes', 'fade', 'iridescent'] as GradientType[], speed: 0.8, sensitivity: 0.8 },
  { name: 'neon',       hues: [300, 180, 60],   sat: [90, 100] as [number,number],  lit: [45, 58]  as [number,number],  effects: ['chromatic', 'bloom'] as EffectType[],      gradients: ['radial', 'plasma', 'waves', 'radial-burst'] as GradientType[], speed: 2.0, sensitivity: 1.8 },
  { name: 'warm',       hues: [10, 30, 50],     sat: [70, 95]  as [number,number],  lit: [45, 65]  as [number,number],  effects: ['vignette', 'grain'] as EffectType[],  gradients: ['radial', 'fade', 'windmill', 'helix'] as GradientType[], speed: 1.0, sensitivity: 1.0 },
  { name: 'cool',       hues: [200, 220, 240],  sat: [55, 85]  as [number,number],  lit: [40, 62]  as [number,number],  effects: ['blur'] as EffectType[],                     gradients: ['radial', 'noise', 'waves', 'voronoi'] as GradientType[], speed: 0.7, sensitivity: 0.9 },
  { name: 'monochrome', hues: [220, 220, 220],  sat: [5,  20]  as [number,number],  lit: [20, 80]  as [number,number],  effects: ['grain', 'vignette'] as EffectType[],  gradients: ['radial', 'mesh', 'noise', 'shapes'] as GradientType[], speed: 0.5, sensitivity: 1.0 },
  { name: 'sunset',     hues: [0,   20,  40],   sat: [80, 100] as [number,number],  lit: [50, 68]  as [number,number],  effects: ['chromatic', 'vignette'] as EffectType[],   gradients: ['radial', 'fade', 'iridescent', 'angle'] as GradientType[], speed: 0.8, sensitivity: 1.1 },
  { name: 'forest',     hues: [100, 140, 160],  sat: [45, 75]  as [number,number],  lit: [30, 52]  as [number,number],  effects: ['grain', 'blur'] as EffectType[],       gradients: ['radial', 'noise', 'mesh', 'voronoi'] as GradientType[], speed: 0.6, sensitivity: 0.9 },
];

// Display name shown in the Gradient tab for each internal GradientType id.
export const GRADIENT_DISPLAY_NAMES: Record<string, string> = {
  angle: 'Angle', aurora: 'Aurora', caustics: 'Caustics',
  helix: 'Helix', fade: 'Fade', flower: 'Flower',
  freeform: 'Freeform', grid: 'Grid', iridescent: 'Iridescent',
  'lava-lamp': 'Lava Lamp', linear: 'Linear', marble: 'Marble',
  mesh: 'Mesh', noise: 'Noise', plasma: 'Plasma',
  polygon: 'Polygon', 'polar-grid': 'Polar Grid',
  radar: 'Radar', radial: 'Radial', 'radial-burst': 'Radial Burst',
  shapes: 'Shapes', windmill: 'Windmill', star: 'Star',
  starburst: 'Starburst', checkerboard: 'Checkerboard',
  voronoi: 'Voronoi', waves: 'Waves',
  metaballs: 'Metaballs', truchet: 'Truchet', moire: 'Moire', 'flow-field': 'Flow Field',
};

// Full gradient type list for UI
export const FULL_GRADIENT_TYPES: GradientType[] = ['angle', 'aurora', 'caustics', 'fade', 'flow-field', 'flower', 'grid', 'helix', 'iridescent', 'lava-lamp', 'marble', 'metaballs', 'moire', 'noise', 'plasma', 'polar-grid', 'radar', 'radial', 'radial-burst', 'shapes', 'truchet', 'voronoi', 'waves', 'windmill'];

// Gradient types for Randomize (excludes freeform and mesh)
export const FEELING_LUCKY_GRADIENT_TYPES: GradientType[] = ['angle', 'aurora', 'caustics', 'fade', 'flower', 'grid', 'helix', 'iridescent', 'lava-lamp', 'marble', 'noise', 'plasma', 'polar-grid', 'radar', 'radial', 'radial-burst', 'shapes', 'voronoi', 'waves', 'windmill', 'metaballs', 'truchet', 'moire', 'flow-field'];

// Kept in sync with the actual button list in the Effects tab (InteractiveGradient.tsx) —
// every effect that has a button belongs here so Shuffle (both the Effects-tab button and
// the WAV button) can pick it, and nothing without a button should be listed.
export const ALL_EFFECTS: EffectType[] = ['ascii', 'bloom', 'blur', 'chromatic', 'chromatic-trails', 'dither', 'duotone', 'feedback', 'fisheye', 'grain', 'grid', 'halftone', 'invert', 'kaleidoscope', 'liquid', 'mirror', 'pixelate', 'posterize', 'pulse', 'ripple', 'scanlines', 'shift', 'slit-scan', 'triangulate', 'vhs', 'vignette', 'wave'];

// Gradients that pulse/react visibly with audio
export const AUDIO_GRADIENTS: GradientType[] = ['radial', 'radial-burst', 'shapes', 'waves', 'plasma', 'noise', 'windmill', 'helix', 'grid', 'angle', 'fade', 'flower', 'radar', 'voronoi', 'iridescent', 'polar-grid', 'aurora', 'caustics', 'lava-lamp', 'marble'];

// Effects that pulse/react visibly with audio
export const AUDIO_EFFECTS: EffectType[] = ['blur', 'vignette', 'chromatic', 'wave', 'shift', 'grain', 'fisheye'];

// Gradient types where click-drag should not move the gradient's center
export const NO_DRAG_TYPES = ['windmill', 'radar', 'flower', 'helix', 'flow-field'];
