// Single source of truth for every effect: its draw function, display label,
// relative compute cost, modulation category (for audio-binding pools), and
// whether it visibly reacts to audio. Previously this same information was
// hand-maintained across SIX independent places (EFFECT_DRAW_FNS registry,
// the EffectType union + ALL_EFFECTS/AUDIO_EFFECTS arrays, EFFECT_COST,
// EFFECT_MOD_CATEGORY, and EffectsTab.tsx's effectsList) that all had to be
// edited together by hand every time an effect was added, removed, or
// renamed — exactly the kind of drift that made merging Zoom Blur into Blur
// fiddly. EffectType, ALL_EFFECTS, AUDIO_EFFECTS, EFFECT_DRAW_FNS,
// EFFECT_COST, and EFFECT_MOD_CATEGORY are now all *derived* from this one
// object; only the EffectSection UI block in EffectsTab.tsx (genuinely
// bespoke JSX per effect, not metadata) still needs a manual touch.
import { applyAscii } from '../hooks/effects/applyAscii';
import { applyBloom } from '../hooks/effects/applyBloom';
import { applyBlur } from '../hooks/effects/applyBlur';
import { applyChromatic } from '../hooks/effects/applyChromatic';
import { applyChromaticTrails } from '../hooks/effects/applyChromaticTrails';
import { applyCrt } from '../hooks/effects/applyCrt';
import { applyDisplace } from '../hooks/effects/applyDisplace';
import { applyDither } from '../hooks/effects/applyDither';
import { applyDuotone } from '../hooks/effects/applyDuotone';
import { applyEmoji } from '../hooks/effects/applyEmoji';
import { applyFeedback } from '../hooks/effects/applyFeedback';
import { applyFisheye } from '../hooks/effects/applyFisheye';
import { applyGlitch } from '../hooks/effects/applyGlitch';
import { applyGrain } from '../hooks/effects/applyGrain';
import { applyGridEffect } from '../hooks/effects/applyGridEffect';
import { applyHalftone } from '../hooks/effects/applyHalftone';
import { applyInvert } from '../hooks/effects/applyInvert';
import { applyKaleidoscope } from '../hooks/effects/applyKaleidoscope';
import { applyLiquid } from '../hooks/effects/applyLiquid';
import { applyMirror } from '../hooks/effects/applyMirror';
import { applyPhoto } from '../hooks/effects/applyPhoto';
import { applyPixelate } from '../hooks/effects/applyPixelate';
import { applyPosterize } from '../hooks/effects/applyPosterize';
import { applyScanlines } from '../hooks/effects/applyScanlines';
import { applyShift } from '../hooks/effects/applyShift';
import { applySlitScan } from '../hooks/effects/applySlitScan';
import { applyTriangulate } from '../hooks/effects/applyTriangulate';
import { applyVhs } from '../hooks/effects/applyVhs';
import { applyVignette } from '../hooks/effects/applyVignette';
import { applyWave } from '../hooks/effects/applyWave';

interface EffectRegistryEntry {
  drawFn: (P: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  label: string;
  // Relative per-frame compute cost (1 = simple single-pass canvas op).
  // Used by feelingLucky's remix budget and the manual Multi-FX toggle to
  // cap how much gets stacked at once — see MULTI_FX_COST_BUDGET below.
  cost: number;
  // MODULATABLE_PARAMS `category` string(s) this effect's sliders live
  // under, so shuffleAudiovisuals can scope random Modulation bindings to
  // whatever's actually on screen.
  category: string[];
  // Whether this effect visibly pulses/reacts to audio on its own (drives
  // AUDIO_EFFECTS, which biases which effects get picked when audio is
  // active).
  audio: boolean;
}

// Alphabetical by id — this order is what both the Effects-tab button grid
// and ALL_EFFECTS iterate in, so keep new entries sorted in.
const EFFECT_REGISTRY = {
  ascii: { drawFn: applyAscii, label: 'ASCII', cost: 2, category: ['ASCII'], audio: false },
  bloom: { drawFn: applyBloom, label: 'Bloom', cost: 1, category: ['Bloom'], audio: true },
  blur: { drawFn: applyBlur, label: 'Blur', cost: 2, category: ['Blur'], audio: true },
  chromatic: { drawFn: applyChromatic, label: 'Chromatic', cost: 2, category: ['Chromatic'], audio: true },
  'chromatic-trails': { drawFn: applyChromaticTrails, label: 'Chroma Trails', cost: 3, category: ['Chroma Trails'], audio: false },
  // Full-resolution barrel-distortion remap plus a per-pixel subpixel mask —
  // same cost tier as Blur/Chromatic.
  crt: { drawFn: applyCrt, label: 'CRT', cost: 2, category: ['CRT'], audio: false },
  // Organic noise-driven pixel warp, distinct from Liquid's periodic
  // sine-wave ripple — full-resolution per-pixel remap, same cost tier as
  // Liquid/Fisheye.
  displace: { drawFn: applyDisplace, label: 'Displace', cost: 2, category: ['Displace'], audio: false },
  dither: { drawFn: applyDither, label: 'Dither', cost: 3, category: ['Dither'], audio: false },
  duotone: { drawFn: applyDuotone, label: 'Duotone', cost: 2, category: ['Duotone'], audio: true },
  emoji: { drawFn: applyEmoji, label: 'Emoji', cost: 2, category: ['Emoji'], audio: false },
  feedback: { drawFn: applyFeedback, label: 'Feedback', cost: 2, category: ['Feedback'], audio: true },
  // Was priced as cost 1 (same tier as simple single-pass ops) despite doing
  // full-resolution getDisplayImageData + per-pixel trig/bilinear remap —
  // the same class of work as Blur/Chromatic, which cost 2. Under-pricing
  // let Multi-FX/Remix stack it alongside genuinely cheap effects thinking
  // the combined cost was low when it wasn't.
  fisheye: { drawFn: applyFisheye, label: 'Fisheye', cost: 2, category: ['Fisheye'], audio: true },
  glitch: { drawFn: applyGlitch, label: 'Glitch', cost: 2, category: ['Glitch'], audio: true },
  grain: { drawFn: applyGrain, label: 'Grain', cost: 2, category: ['Grain'], audio: true },
  'grid-effect': { drawFn: applyGridEffect, label: 'Grid', cost: 3, category: ['Grid', 'Grid Effect'], audio: false },
  halftone: { drawFn: applyHalftone, label: 'Halftone', cost: 3, category: ['Halftone'], audio: false },
  invert: { drawFn: applyInvert, label: 'Invert', cost: 1, category: ['Invert'], audio: false },
  kaleidoscope: { drawFn: applyKaleidoscope, label: 'Kaleido', cost: 1, category: ['Kaleidoscope'], audio: true },
  // Same under-pricing issue as fisheye above — full-res per-pixel
  // coordinate-distortion math, priced like a cheap single-pass op.
  liquid: { drawFn: applyLiquid, label: 'Liquid', cost: 2, category: ['Liquid'], audio: false },
  mirror: { drawFn: applyMirror, label: 'Mirror', cost: 2, category: ['Mirror'], audio: true },
  photo: { drawFn: applyPhoto, label: 'Photo', cost: 1, category: ['Photo'], audio: false },
  pixelate: { drawFn: applyPixelate, label: 'Pixelate', cost: 1, category: ['Pixelate'], audio: false },
  posterize: { drawFn: applyPosterize, label: 'Posterize', cost: 1, category: ['Posterize'], audio: true },
  scanlines: { drawFn: applyScanlines, label: 'Scanlines', cost: 1, category: ['Scanlines'], audio: true },
  shift: { drawFn: applyShift, label: 'Shift', cost: 1, category: ['Shift'], audio: true },
  'slit-scan': { drawFn: applySlitScan, label: 'Slit-Scan', cost: 2, category: ['Slit-Scan'], audio: false },
  triangulate: { drawFn: applyTriangulate, label: 'Triangulate', cost: 3, category: ['Triangulate'], audio: false },
  vhs: { drawFn: applyVhs, label: 'VHS', cost: 2, category: ['VHS'], audio: true },
  vignette: { drawFn: applyVignette, label: 'Vignette', cost: 1, category: ['Vignette'], audio: true },
  wave: { drawFn: applyWave, label: 'Wave', cost: 2, category: ['Wave'], audio: true },
} satisfies Record<string, EffectRegistryEntry>;

// 'none' is a legacy sentinel value (never a real registered effect — no
// drawFn, never appears in EFFECT_DRAW_FNS/ALL_EFFECTS) that a few unrelated
// enum-like props (e.g. gridRotationDirection) happen to reuse the string
// 'none' for; kept in the type union for callers that still compare against
// it defensively.
export type EffectType = keyof typeof EFFECT_REGISTRY | 'none';

const EFFECT_IDS = Object.keys(EFFECT_REGISTRY) as EffectType[];

// Every effect that has a button in the Effects tab, in the order the grid
// renders them.
export const EFFECTS_UI_LIST: EffectType[] = EFFECT_IDS;

// Kept in sync automatically now (derived from EFFECT_IDS) — every effect
// that has a button belongs here so Shuffle can pick it, and nothing
// without a button is listed. Exception: 'photo' has a button but is
// deliberately excluded from this pool — it's a no-op until the user
// uploads an image, so a random shuffle landing on it would just look
// broken.
export const ALL_EFFECTS: EffectType[] = EFFECT_IDS.filter((id) => id !== 'photo');

export const AUDIO_EFFECTS: EffectType[] = EFFECT_IDS.filter(
  (id) => EFFECT_REGISTRY[id as keyof typeof EFFECT_REGISTRY].audio,
);

export const EFFECT_LABELS: Record<string, string> = Object.fromEntries(
  EFFECT_IDS.map((id) => [id, EFFECT_REGISTRY[id as keyof typeof EFFECT_REGISTRY].label]),
);

export const EFFECT_DRAW_FNS: Record<string, (P: any) => void> = Object.fromEntries( // eslint-disable-line @typescript-eslint/no-explicit-any
  EFFECT_IDS.map((id) => [id, EFFECT_REGISTRY[id as keyof typeof EFFECT_REGISTRY].drawFn]),
);

export const EFFECT_COST: Partial<Record<EffectType, number>> = Object.fromEntries(
  EFFECT_IDS.map((id) => [id, EFFECT_REGISTRY[id as keyof typeof EFFECT_REGISTRY].cost]),
);

export const EFFECT_MOD_CATEGORY: Record<string, string[]> = Object.fromEntries(
  EFFECT_IDS.map((id) => [id, EFFECT_REGISTRY[id as keyof typeof EFFECT_REGISTRY].category]),
);
