import type { EffectType, GradientType } from './gradientEffects';

// Hand-made taste for Shuffle. Random effects on random gradients land on a good look only part of the time; this
// records which effects flatter which kinds of gradient, which pairs fight each other, and the moods a shuffle can
// take. It is data, so changing what Shuffle likes means editing this file and nothing else.

export type GradientKind = 'dark-ground' | 'smooth' | 'pattern' | 'particles';

// How a gradient looks, for choosing effects: a few bright shapes on black, a soft full-frame field, a repeating
// pattern or geometry, or scattered points. Anything not listed is a smooth field.
const KIND_MEMBERS: Record<Exclude<GradientKind, 'smooth'>, GradientType[]> = {
  'dark-ground': ['bokeh', 'eclipse', 'edge-glow', 'embers', 'light-beam', 'rays', 'vortex', 'curtains', 'lava-lamp', 'metaballs', 'flower', 'tunnel', 'spectral'],
  pattern: ['grid', 'hatch', 'shapes', 'tiling', 'truchet', 'voronoi', 'topographic', 'windmill', 'julia', 'reaction-diffusion', 'stack', 'radial-burst'],
  particles: ['particles', 'attractor', 'fireworks', 'lightning'],
};

export const gradientKind = (gradient: string | null | undefined): GradientKind => {
  for (const [kind, members] of Object.entries(KIND_MEMBERS) as [GradientKind, GradientType[]][]) {
    if (members.includes(gradient as GradientType)) return kind;
  }
  return 'smooth';
};

// How well an effect suits each kind of gradient: +2 flatters it, 0 is neutral, -2 usually hurts it (hides the
// gradient, clutters it, or fights what it already does). Effects not listed are neutral.
export const EFFECT_AFFINITY: Record<GradientKind, Partial<Record<EffectType, number>>> = {
  'dark-ground': {
    bloom: 2, 'aura-glow': 2, halftone: 2, ascii: 2, vignette: 1, grain: 1, chromatic: 1, shift: 1, crt: 1, wave: 1, kaleidoscope: 1,
    posterize: -1, dither: -1, invert: -1, watercolor: -1, 'grid-effect': -1,
    duotone: -2, 'oil-paint': -2, impasto: -2, gesso: -2,
  },
  smooth: {
    grain: 2, bloom: 1, vignette: 1, chromatic: 1, wave: 1, liquid: 1, shift: 1, mirror: 1, kaleidoscope: 1, watercolor: 1,
    'oil-paint': 1, blur: -1, feedback: -1,
  },
  pattern: {
    halftone: 2, ascii: 2, grain: 1, vignette: 1, chromatic: 1, bloom: 1, shift: 1, crt: 1, liquid: 1,
    mirror: -1, pixelate: -1, triangulate: -1, blur: -1, 'slit-scan': -1,
    'grid-effect': -2,
  },
  particles: {
    bloom: 2, 'aura-glow': 2, chromatic: 1, grain: 1, vignette: 1, feedback: 1, mirror: 1,
    blur: -1, posterize: -2, dither: -2, halftone: -2, 'oil-paint': -2, impasto: -2, duotone: -2, pixelate: -2,
  },
};

// Pairs that work against each other (negative) or work well together (positive), added to a look's score once
// when both are in the stack.
export const EFFECT_PAIRS: readonly [EffectType, EffectType, number][] = [
  ['kaleidoscope', 'mirror', -3], ['kaleidoscope', 'triangulate', -2],
  ['pixelate', 'halftone', -3], ['halftone', 'dither', -3], ['posterize', 'dither', -2], ['posterize', 'halftone', -2],
  ['blur', 'pixelate', -2], ['ascii', 'emoji', -3], ['ascii', 'pixelate', -2],
  ['feedback', 'chromatic-trails', -2], ['feedback', 'slit-scan', -2], ['chromatic-trails', 'slit-scan', -2],
  ['oil-paint', 'impasto', -3], ['oil-paint', 'watercolor', -2], ['impasto', 'gesso', -2], ['duotone', 'posterize', -1],
  ['bloom', 'aura-glow', -1], ['wave', 'liquid', -1], ['chromatic', 'shift', -1],
  ['bloom', 'chromatic', 1], ['grain', 'vignette', 1], ['vhs', 'crt', 1],
];

export type MoodId = 'calm' | 'soft' | 'cinematic' | 'bold' | 'dense' | 'glitchy';

export interface Mood {
  id: MoodId;
  // Playback speeds this mood picks from (repeats make a speed likelier).
  speeds: readonly number[];
  // 0-1: how hard effects hit (chromatic offset, pixel size, grain), scaling their usual ranges.
  strength: number;
  // Range for a styled gradient's two shape sliders.
  shape: readonly [number, number];
  // Chance a styled gradient gets a twist.
  swirlChance: number;
  maxEffects: number;
  // Chance the stack includes one heavy shape-changing effect (kaleidoscope, pixelate, ...).
  shapeChangerChance: number;
  // Added to an effect's score (and weight) under this mood.
  effectBias: Partial<Record<EffectType, number>>;
}

export const MOODS: readonly Mood[] = [
  { id: 'calm', speeds: [0.5, 1, 1, 2], strength: 0.3, shape: [0.8, 1.2], swirlChance: 0.15, maxEffects: 3, shapeChangerChance: 0.2,
    effectBias: { bloom: 1, grain: 1, vignette: 1, wave: 1, chromatic: -1, vhs: -1 } },
  { id: 'soft', speeds: [0.5, 1, 1, 2], strength: 0.25, shape: [0.8, 1.1], swirlChance: 0.2, maxEffects: 3, shapeChangerChance: 0.1,
    effectBias: { bloom: 1, 'aura-glow': 1, blur: 1, watercolor: 1, posterize: -1, dither: -1, pixelate: -1 } },
  { id: 'cinematic', speeds: [1, 1, 2], strength: 0.5, shape: [0.8, 1.3], swirlChance: 0.2, maxEffects: 4, shapeChangerChance: 0.15,
    effectBias: { vignette: 1, grain: 1, bloom: 1, chromatic: 1, crt: -1 } },
  { id: 'bold', speeds: [2, 3, 3, 4, 5], strength: 0.8, shape: [0.7, 1.6], swirlChance: 0.45, maxEffects: 5, shapeChangerChance: 0.5,
    effectBias: { kaleidoscope: 1, mirror: 1, chromatic: 1, shift: 1, liquid: 1, wave: 1 } },
  { id: 'dense', speeds: [1, 2, 3], strength: 0.6, shape: [1.2, 1.9], swirlChance: 0.3, maxEffects: 4, shapeChangerChance: 0.45,
    effectBias: { grain: 1, halftone: 1, dither: 1, kaleidoscope: 1, mirror: 1, blur: -1 } },
  { id: 'glitchy', speeds: [3, 4, 5, 6, 8, 10], strength: 1, shape: [0.7, 1.7], swirlChance: 0.5, maxEffects: 5, shapeChangerChance: 0.7,
    effectBias: { chromatic: 1, crt: 1, shift: 1, pixelate: 1, 'slit-scan': 1, 'chromatic-trails': 1, bloom: -1, watercolor: -1 } },
];

export const moodById = (id: MoodId): Mood => MOODS.find(m => m.id === id) ?? MOODS[0];
