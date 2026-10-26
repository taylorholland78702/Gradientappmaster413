import { MODULATABLE_PARAMS } from './modulatableParams';
import { EFFECT_MOD_CATEGORY } from './effectRegistry';
import { modCategoriesFor } from './gradientModCategories';

// Which saved settings matter to a given look. A share link carries only the settings that can change what the
// look shows, so it stays short: a Rays gradient with Grain does not need Julia's Real/Imaginary values or the
// Halftone speed, even though the snapshot holds them.
//
//  - sliders in MODULATABLE_PARAMS belong to the gradient or effect named by their category (the same relevance the
//    audio panel already uses);
//  - the rest are listed below by owner, or marked as never needed.
// (A test fails if a saved setting is in none of these places, so a new one has to be classified.)

// Settings no gradient or effect reads any more (left over from removed ones), and clocks that simply restart.
export const SHARE_NEVER: ReadonlySet<string> = new Set([
  'digitalNoiseIntensity', 'hexGridSize', 'lightLeakIntensity', 'linesAngle', 'linesCount', 'linesThickness',
  'liquifyStrength', 'pinchStrength', 'sepiaIntensity', 'solarizeThreshold',
  'meshWireframeGridSize', 'meshWireframeJitter', 'meshWireframeLineWidth',
  'waveInterferenceSourceCount', 'waveInterferenceFrequency', 'waveInterferenceSpeed',
  'turrellSpeed', 'turrellGlow', 'twistAmount', 'fadeMode', 'fadeDirection',
  'auroraBandCount', 'auroraBandHeight', 'auroraWaveSpeed',
]);
export const isClock = (key: string) => key.endsWith('AnimTime');

// Settings every look needs (they have no default worth leaving out).
export const SHARE_ALWAYS: ReadonlySet<string> = new Set([
  'activeEffects', 'baseAIColors', 'depthLayerEnabled', 'fieldShapes', 'paletteStops', 'gradientAngle',
  'gradientColors', 'gradientType', 'resolutionMultiplier', 'submittedAIPrompt', 'targetAngle', 'targetColors', 'targetZoom', 'zoom',
]);

// Audio tuning only matters when audio is on.
export const SHARE_AUDIO_ONLY: ReadonlySet<string> = new Set([
  ...['bass', 'mids', 'treble', 'subBass'].flatMap(b => ['Multiplier', 'Smoothing', 'Threshold', 'Min', 'Max', 'BeatSync'].map(s => b + s)),
  'masterSensitivity', 'autoGainEnabled', 'zoomBeatEnabled', 'shakeBeatEnabled', 'contrastBeatEnabled', 'paletteBeatEnabled',
  'isAudioReactive',
]);

// Settings that belong to one gradient or effect (not in MODULATABLE_PARAMS).
export const SHARE_OWNED_BY: Readonly<Record<string, { gradients?: string[]; effects?: string[] }>> = {
  angleHardEdge: { gradients: ['angle'] },
  asciiChars: { effects: ['ascii'] }, asciiColor: { effects: ['ascii'] },
  blurType: { effects: ['blur'] },
  ditherType: { effects: ['dither'] },
  duotoneColor1: { effects: ['duotone'] }, duotoneColor2: { effects: ['duotone'] }, duotoneColor3: { effects: ['duotone'] }, duotoneThreeColor: { effects: ['duotone'] },
  dustCrackleColor: { effects: ['grain'] }, dustCrackleLength: { effects: ['grain'] }, grainType: { effects: ['grain'] },
  emojiChars: { effects: ['emoji'] }, emojiOffsetX: { effects: ['emoji'] },
  feedbackRotation: { effects: ['feedback'] },
  flowerOpacity: { gradients: ['flower'] }, flowerRotation: { gradients: ['flower'] }, flowerSymmetry: { gradients: ['flower'] },
  gridCellAngleStep: { gradients: ['grid'] }, gridHardEdge: { gradients: ['grid'] },
  gridRotation: { gradients: ['grid'], effects: ['grid-effect'] },
  crtSpeed: { effects: ['crt'] }, ditherSpeed: { effects: ['dither'] }, dadaSpeed: { effects: ['dada'] }, asciiSpeed: { effects: ['ascii'] },
  watercolorSpeed: { effects: ['watercolor'] }, impastoSpeed: { effects: ['impasto'] },
  gridEffectSpeed: { effects: ['grid-effect'] }, liquidSpeed: { effects: ['liquid'] },
  halftoneCMYK: { effects: ['halftone'] }, halftoneMove: { effects: ['halftone'] }, halftoneMoveSpeed: { effects: ['halftone'] },
  hatchResponse: { gradients: ['hatch'] },
  juliaReal: { gradients: ['julia'] }, juliaImaginary: { gradients: ['julia'] },
  lavaSpeed: { gradients: ['lava-lamp'] },
  mirrorMode: { effects: ['mirror'] },
  noiseType: { gradients: ['noise'] },
  particlesMode: { gradients: ['particles'] },
  photoBlendMode: { effects: ['photo'] },
  radialHardEdge: { gradients: ['radial'] },
  shapesMode: { gradients: ['shapes'] },
  slitScanDirection: { effects: ['slit-scan'] },
  triangulateVariation: { effects: ['triangulate'] },
  watercolorStyle: { effects: ['watercolor'] },
  // Per-gradient Speed sliders that are not audio-modulatable.
  flowerSpeed: { gradients: ['flower'] }, stackSpeed: { gradients: ['stack'] }, marbleSpeed: { gradients: ['marble'] },
  truchetSpeed: { gradients: ['truchet'] }, causticsSpeed: { gradients: ['caustics'] }, shapesSpeed: { gradients: ['shapes'] },
  juliaSpeed: { gradients: ['julia'] },
  windmillMode: { gradients: ['windmill'] }, windmillZoom: { gradients: ['windmill'] }, windmillZoomResponse: { gradients: ['windmill'] },
};

const MODULATABLE_CATEGORY: ReadonlyMap<string, string> = new Map(MODULATABLE_PARAMS.map(p => [p.key, p.category]));

// The modulation categories a look uses: its gradient's and its effects'.
export function activeCategories(gradientType: string, effects: readonly string[]): Set<string> {
  return modCategoriesFor(gradientType, effects, EFFECT_MOD_CATEGORY);
}

export function isRelevant(key: string, look: { gradientType: string; effects: readonly string[]; audioOn: boolean; bound: ReadonlySet<string> }, categories: Set<string>): boolean {
  if (SHARE_NEVER.has(key) || isClock(key)) return false;
  if (SHARE_AUDIO_ONLY.has(key)) return look.audioOn;
  const category = MODULATABLE_CATEGORY.get(key);
  if (category) return categories.has(category) || look.bound.has(key);
  const owner = SHARE_OWNED_BY[key];
  if (owner) return !!owner.gradients?.includes(look.gradientType) || !!owner.effects?.some(e => look.effects.includes(e));
  return true;
}

export const isClassified = (key: string) =>
  SHARE_ALWAYS.has(key) || SHARE_NEVER.has(key) || isClock(key) || SHARE_AUDIO_ONLY.has(key) || MODULATABLE_CATEGORY.has(key) || key in SHARE_OWNED_BY;
