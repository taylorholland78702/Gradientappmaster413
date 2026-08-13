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
import { applyAuraGlow } from '../hooks/effects/applyAuraGlow';
import { applyBloom } from '../hooks/effects/applyBloom';
import { applyBlur } from '../hooks/effects/applyBlur';
import { applyBlurZoomGL, applyBlurRadialGL, detectBlurGLSupport } from '../hooks/effects/applyBlurGL';
import { applyChromatic } from '../hooks/effects/applyChromatic';
import { applyChromaticTrailsWorkerAuto } from '../hooks/effects/applyChromaticTrailsWorkerAuto';
import { applyConfetti } from '../hooks/effects/applyConfetti';
import { applyCrt } from '../hooks/effects/applyCrt';
import { applyDitherWorkerAuto } from '../hooks/effects/applyDitherWorkerAuto';
import { applyDuotone } from '../hooks/effects/applyDuotone';
import { applyEmoji } from '../hooks/effects/applyEmoji';
import { applyFeedback } from '../hooks/effects/applyFeedback';
import { applyFisheye } from '../hooks/effects/applyFisheye';
import { applyFisheyeGL, detectFisheyeGLSupport } from '../hooks/effects/applyFisheyeGL';
import { applyFluidField } from '../hooks/effects/applyFluidField';
import { applyGlitch } from '../hooks/effects/applyGlitch';
import { applyGrain } from '../hooks/effects/applyGrain';
import { applyGridEffectWorkerAuto } from '../hooks/effects/applyGridEffectWorkerAuto';
import { applyHalftoneWorkerAuto } from '../hooks/effects/applyHalftoneWorkerAuto';
import { applyInvert } from '../hooks/effects/applyInvert';
import { applyKaleidoscope } from '../hooks/effects/applyKaleidoscope';
import { applyLightningWeb } from '../hooks/effects/applyLightningWeb';
import { applyLiquid } from '../hooks/effects/applyLiquid';
import { applyLiquidGL, detectLiquidGLSupport } from '../hooks/effects/applyLiquidGL';
import { applyMirror } from '../hooks/effects/applyMirror';
import { applyMirrorGL, detectMirrorGLSupport } from '../hooks/effects/applyMirrorGL';
import { applyParticleTrails } from '../hooks/effects/applyParticleTrails';
import { applyPhoto } from '../hooks/effects/applyPhoto';
import { applyPixelate } from '../hooks/effects/applyPixelate';
import { applyPosterize } from '../hooks/effects/applyPosterize';
import { applyShift } from '../hooks/effects/applyShift';
import { applySlitScan } from '../hooks/effects/applySlitScan';
import { applyStarfield } from '../hooks/effects/applyStarfield';
import { applyStaticField } from '../hooks/effects/applyStaticField';
import { applyTriangleField } from '../hooks/effects/applyTriangleField';
import { applyTriangulateWorkerAuto } from '../hooks/effects/applyTriangulateWorkerAuto';
import { applyVhs } from '../hooks/effects/applyVhs';
import { applyVignette } from '../hooks/effects/applyVignette';
import { applyVoronoiCells } from '../hooks/effects/applyVoronoiCells';
import { applyWave } from '../hooks/effects/applyWave';
import { applyWaveGL, detectWaveGLSupport } from '../hooks/effects/applyWaveGL';
import { applyWindStreaks } from '../hooks/effects/applyWindStreaks';

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

// Only Blur's Zoom/Radial modes have a genuine per-pixel bottleneck worth a
// GPU port (10-12 texture samples + trig per pixel at full resolution, no
// downsampling compromise — every other effect in this registry is a
// single sample per pixel, already cheap). Gaussian/Motion already run via
// native ctx.filter/ctx.drawImage, so this checks blurType before even
// attempting GL, same reasoning as the gradient layer's sweep/helix-only
// GL wrappers (see gradients/_registry.ts).
function applyBlurAuto(P: any): void {
  if ((P.blurType === 'zoom' || P.blurType === 'radial') && detectBlurGLSupport()) {
    try {
      if (P.blurType === 'zoom') applyBlurZoomGL(P); else applyBlurRadialGL(P);
      return;
    } catch (err) {
      console.error('WebGL Blur failed, falling back to CPU:', err);
    }
  }
  applyBlur(P);
}

// Liquid is single-sample-per-pixel (doesn't meet the multi-sample bar
// above) but its displacement math is 6 sin/cos calls per pixel — CPU
// transcendentals are notably slower than basic ALU ops, while GPUs have
// dedicated fast transcendental hardware, so the CPU/GPU gap here is larger
// than "1 sample" suggests. See applyLiquidGL.ts.
function applyLiquidAuto(P: any): void {
  if (detectLiquidGLSupport()) {
    try {
      applyLiquidGL(P);
      return;
    } catch (err) {
      console.error('WebGL Liquid failed, falling back to CPU:', err);
    }
  }
  applyLiquid(P);
}

// Same reasoning as applyLiquidAuto above — single-sample-per-pixel but
// transcendental-heavy (atan2 + pow + cos/sin). See applyFisheyeGL.ts.
function applyFisheyeAuto(P: any): void {
  if (detectFisheyeGLSupport()) {
    try {
      applyFisheyeGL(P);
      return;
    } catch (err) {
      console.error('WebGL Fisheye failed, falling back to CPU:', err);
    }
  }
  applyFisheye(P);
}

// Same reasoning as applyLiquidAuto/applyFisheyeAuto above. See
// applyWaveGL.ts.
function applyWaveAuto(P: any): void {
  if (detectWaveGLSupport()) {
    try {
      applyWaveGL(P);
      return;
    } catch (err) {
      console.error('WebGL Wave failed, falling back to CPU:', err);
    }
  }
  applyWave(P);
}

// Mirror's CPU path is already native ctx.drawImage calls (not a per-pixel
// loop), so this isn't closing a CPU bottleneck — it exists so Mirror can
// participate in a GL-pipeline chain instead of breaking one. See
// applyMirrorGL.ts.
function applyMirrorAuto(P: any): void {
  if (detectMirrorGLSupport()) {
    try {
      applyMirrorGL(P);
      return;
    } catch (err) {
      console.error('WebGL Mirror failed, falling back to CPU:', err);
    }
  }
  applyMirror(P);
}

// Alphabetical by id — this order is what both the Effects-tab button grid
// and ALL_EFFECTS iterate in, so keep new entries sorted in.
const EFFECT_REGISTRY = {
  ascii: { drawFn: applyAscii, label: 'ASCII', cost: 2, category: ['ASCII'], audio: false },
  // Generative overlay (a few drifting native-radial-gradient light
  // sources, doesn't sample the frame beneath it) — no per-pixel loop at
  // all, same technique Aurora/Fade already use, so this sits a tier below
  // the ImageData-based generative effects.
  'aura-glow': { drawFn: applyAuraGlow, label: 'Aura Glow', cost: 2, category: ['Aura Glow'], audio: true },
  bloom: { drawFn: applyBloom, label: 'Bloom', cost: 1, category: ['Bloom'], audio: true },
  blur: { drawFn: applyBlurAuto, label: 'Blur', cost: 2, category: ['Blur'], audio: true },
  chromatic: { drawFn: applyChromatic, label: 'Chromatic', cost: 2, category: ['Chromatic'], audio: true },
  'chromatic-trails': { drawFn: applyChromaticTrailsWorkerAuto, label: 'Chroma Trails', cost: 3, category: ['Chroma Trails'], audio: false },
  // Generative overlay (small rotating shapes falling under gravity with a
  // spawn/despawn lifecycle, doesn't sample the frame beneath it) — plain
  // vector fills/strokes per piece, no per-pixel loop, same cost tier as
  // Aura Glow/Starfield.
  confetti: { drawFn: applyConfetti, label: 'Confetti', cost: 2, category: ['Confetti'], audio: true },
  // Full-resolution barrel-distortion remap plus a per-pixel subpixel mask —
  // same cost tier as Blur/Chromatic.
  crt: { drawFn: applyCrt, label: 'Cathode', cost: 2, category: ['Cathode'], audio: false },
  // Organic noise-driven pixel warp, distinct from Liquid's periodic
  // sine-wave ripple — full-resolution per-pixel remap, same cost tier as
  // Liquid/Fisheye.
  dither: { drawFn: applyDitherWorkerAuto, label: 'Dither', cost: 3, category: ['Dither'], audio: false },
  duotone: { drawFn: applyDuotone, label: 'Duotone', cost: 2, category: ['Duotone'], audio: true },
  emoji: { drawFn: applyEmoji, label: 'Emoji', cost: 2, category: ['Emoji'], audio: false },
  feedback: { drawFn: applyFeedback, label: 'Feedback', cost: 2, category: ['Feedback'], audio: true },
  // Was priced as cost 1 (same tier as simple single-pass ops) despite doing
  // full-resolution getDisplayImageData + per-pixel trig/bilinear remap —
  // the same class of work as Blur/Chromatic, which cost 2. Under-pricing
  // let Multi-FX/Remix stack it alongside genuinely cheap effects thinking
  // the combined cost was low when it wasn't.
  fisheye: { drawFn: applyFisheyeAuto, label: 'Fisheye', cost: 2, category: ['Fisheye'], audio: true },
  // Generative overlay (paints its own flowing turbulence field, doesn't
  // sample the frame beneath it) — same cost tier as Feedback/Chroma
  // Trails: a full downsampled field recompute plus a composite draw
  // every frame, not a flat per-pixel pass.
  'fluid-field': { drawFn: applyFluidField, label: 'Fluid Field', cost: 3, category: ['Fluid Field'], audio: true },
  glitch: { drawFn: applyGlitch, label: 'Glitch', cost: 2, category: ['Glitch'], audio: true },
  grain: { drawFn: applyGrain, label: 'Grain', cost: 2, category: ['Grain'], audio: true },
  'grid-effect': { drawFn: applyGridEffectWorkerAuto, label: 'Grid', cost: 3, category: ['Grid', 'Grid Effect'], audio: false },
  // CMYK mode (halftoneCMYK, ~40% of shuffles) draws 4 full rotated dot
  // grids with individual ctx.arc()+fill() calls each — even capped (see
  // applyHalftone.ts) that's several times costlier than a single-pass
  // per-pixel effect, so this sits a tier above Dither/Triangulate/Grid.
  halftone: { drawFn: applyHalftoneWorkerAuto, label: 'Halftone', cost: 4, category: ['Halftone'], audio: false },
  invert: { drawFn: applyInvert, label: 'Invert', cost: 1, category: ['Invert'], audio: false },
  kaleidoscope: { drawFn: applyKaleidoscope, label: 'Kaleido', cost: 1, category: ['Kaleidoscope'], audio: true },
  // Generative overlay (a sparse node graph with jittery, flickering bolt
  // lines regenerated every frame they're alive, doesn't sample the frame
  // beneath it) — small node/bolt counts, cheap midpoint-displacement path
  // math, same cost tier as Confetti/Aura Glow.
  'lightning-web': { drawFn: applyLightningWeb, label: 'Lightning Web', cost: 2, category: ['Lightning Web'], audio: true },
  // Same under-pricing issue as fisheye above — full-res per-pixel
  // coordinate-distortion math, priced like a cheap single-pass op.
  liquid: { drawFn: applyLiquidAuto, label: 'Liquid', cost: 2, category: ['Liquid'], audio: false },
  mirror: { drawFn: applyMirrorAuto, label: 'Mirror', cost: 2, category: ['Mirror'], audio: true },
  // Generative overlay (owns and moves its own particles, doesn't sample
  // the frame beneath it) — persistent trail buffer + per-particle update
  // every frame, same cost tier as Feedback/Chroma Trails.
  'particle-trails': { drawFn: applyParticleTrails, label: 'Particle Trails', cost: 3, category: ['Particle Trails'], audio: true },
  photo: { drawFn: applyPhoto, label: 'Photo', cost: 1, category: ['Photo'], audio: false },
  pixelate: { drawFn: applyPixelate, label: 'Pixelate', cost: 1, category: ['Pixelate'], audio: false },
  posterize: { drawFn: applyPosterize, label: 'Posterize', cost: 1, category: ['Posterize'], audio: true },
  shift: { drawFn: applyShift, label: 'Shift', cost: 1, category: ['Shift'], audio: true },
  'slit-scan': { drawFn: applySlitScan, label: 'Slit-Scan', cost: 2, category: ['Slit-Scan'], audio: false },
  // Generative overlay (points streak outward from center with
  // accelerating speed, doesn't sample the frame beneath it) — each
  // frame's own line segment stroke is the "trail," no persistent decay
  // buffer needed, same cost tier as Confetti/Aura Glow.
  starfield: { drawFn: applyStarfield, label: 'Starfield', cost: 2, category: ['Starfield'], audio: true },
  // Generative overlay (grayscale noise + drifting sync bars, doesn't
  // sample the frame beneath it) — half-res-ish downsampled field
  // recompute plus a composite draw, same cost tier as Fluid Field.
  'static-field': { drawFn: applyStaticField, label: 'Static Field', cost: 3, category: ['Static Field'], audio: true },
  // Generative overlay (paints its own evolving triangle mesh from the
  // palette, doesn't sample the frame beneath it) — same reasoning and
  // cost tier as Fluid Field above.
  'triangle-field': { drawFn: applyTriangleField, label: 'Triangle Field', cost: 3, category: ['Triangle Field'], audio: true },
  triangulate: { drawFn: applyTriangulateWorkerAuto, label: 'Triangulate', cost: 3, category: ['Triangulate'], audio: false },
  vhs: { drawFn: applyVhs, label: 'VHS', cost: 2, category: ['VHS'], audio: true },
  vignette: { drawFn: applyVignette, label: 'Vignette', cost: 1, category: ['Vignette'], audio: true },
  // Generative overlay (a handful of drifting seed points; recomputes
  // which downsampled pixels sit on a cell boundary every frame and paints
  // only those, doesn't sample the frame beneath it) — same cost tier as
  // Fluid Field/Static Field's downsampled-field recompute.
  'voronoi-cells': { drawFn: applyVoronoiCells, label: 'Voronoi Cells', cost: 3, category: ['Voronoi Cells'], audio: true },
  wave: { drawFn: applyWaveAuto, label: 'Wave', cost: 2, category: ['Wave'], audio: true },
  // Generative overlay (owns and moves its own directional streaks,
  // doesn't sample the frame beneath it) — persistent trail buffer + a
  // stroke per streak every frame, same cost tier as Particle Trails.
  'wind-streaks': { drawFn: applyWindStreaks, label: 'Wind Streaks', cost: 3, category: ['Wind Streaks'], audio: true },
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
