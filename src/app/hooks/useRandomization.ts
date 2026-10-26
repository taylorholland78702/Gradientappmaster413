import type { RandomizationParams } from './randomizationTypes';
import { useCallback } from 'react';
import {
  type ColorRGB, type GradientType, type EffectType,
  ALL_EFFECTS, AUDIO_GRADIENTS, AUDIO_EFFECTS, FEELING_LUCKY_GRADIENT_TYPES, FULL_GRADIENT_TYPES,
} from '../constants/gradientEffects';
import { pickRandomEmojiSet } from '../constants/emojiPicker';
import { hslToRgb, rgbToHsl, hexToRgb } from '../utils/color';
import { RANGES, randInRange, randIntInRange } from '../constants/randomizationRanges';
import { GRADIENT_LOOKS } from '../constants/gradientLooks';
import { PALETTE_PRESETS, DARK_GROUND_GRADIENTS, startsDark } from '../constants/palettePresets';
import { paletteFamily, inFamily, generateFamilyPalette } from '../utils/colorFamily';
import { STYLE_SHAPE_CONTROLS } from '../constants/styleShapeControls';
import { MODULATABLE_PARAMS } from '../constants/modulatableParams';
import { costOf, resolutionForEffectCost } from '../constants/effectCost';
import { shuffleHistory, pickWeighted } from '../utils/shuffleHistory';
import { chooseLook, chooseMood, scaleRange } from '../utils/shuffleScore';
import { generatePalette, pickPalette } from '../utils/shufflePalette';
import { shuffleLearning, type LearnedKind } from '../utils/shuffleLearning';
import { USE_LEARNED_TASTE } from '../constants/shuffleTaste';

// What you have kept steers Shuffle only while USE_LEARNED_TASTE is on; otherwise every learned multiplier is 1.
const learnedWeight = (kind: LearnedKind, id: string) => (USE_LEARNED_TASTE ? shuffleLearning.weight(kind, id) : 1);
import { varyLook, nudgeHue, lookVariation } from '../utils/shuffleLook';
import { EFFECT_MOD_CATEGORY } from '../constants/effectRegistry';
import type { AudioBinding } from './state/useAudioBindingsState';

import { GRADIENT_MOD_CATEGORY, GLOBAL_CATEGORIES, modCategoriesFor } from '../constants/gradientModCategories';
export { GRADIENT_MOD_CATEGORY };
const ASCII_CHARSET_POOL = [' .:-=+*x#%@', ' .oO0@', ' ░▒▓█', ' -~=+^*#&', ' .,;!vlLFE$', ' 01', ' .·•●'];

// These gradient types draw a handful of small bright elements on an
// otherwise black-filled canvas (points/trails, particles, bolts, bursts)
// rather than a continuous full-frame field. Stacking multiple
// "neighborhood average" or brightness-threshold effects on top of content
// that sparse compounds — each one dilutes the already-mostly-black frame
// a bit further — and a shuffle can land on a combination that washes the
// whole thing down to a single flat color (verified: zero pixel variance
// across the entire canvas from Pixelate+Duotone stacked on Particles via
// the unprotected "Shuffle Effects" path below). Single effects (even
// heavy ones) left it dim-but-visible in testing; it was stacks of 3+ that
// tipped it over. Shared by feelingLucky (the main Shuffle/Auto Shuffle/
// Feeling Lucky path) and randomizeEffects (the standalone "Shuffle
// Effects" button) — the latter used to have none of this protection at
// all, which is what actually reproduced the flat-color result.
// The dark-ground styled gradients (a thin ring / beam / bokeh discs on near-black)
// are sparse in the same way: posterising or smearing them leaves a flat field.
const SPARSE_CONTENT_GRADIENTS: GradientType[] = ['particles', 'attractor', 'fireworks', 'lightning', 'eclipse', 'light-beam', 'edge-glow', 'bokeh', 'embers'];
const isSparseContentGradient = (t: GradientType | null) => !!t && SPARSE_CONTENT_GRADIENTS.includes(t);
// Oil Paint/Brush Strokes/Impasto average a neighborhood of pixels — on a
// frame that's 95%+ black to start with, that average is just black,
// regardless of how the strength/size sliders land. Duotone and Pixelate
// aren't neighborhood-averaging, but collapse just as badly for a
// different reason: Duotone recolors by a single luminance threshold, and
// Pixelate coarsens into large blocks — on sparse content, nearly every
// sample (or every block) lands on the same "mostly black" side, so
// either one alone can turn the whole canvas into one flat color instead
// of the intended two-tone or blocky look. Slit-Scan fails by smearing: it
// streaks each column/row through a history of frames, and with only a
// handful of small bright elements to smear (plus a second effect like Wave
// stacked on top) a shuffle landed on Particles + Slit-Scan + Wave and came
// out as one flat color. Unlike the distortion effects (chromatic/
// vhs), no slider value makes any of these six behave reasonably on sparse
// content, so they're excluded outright rather than just count-limited.
const CONTENT_ERASERS: EffectType[] = ['oil-paint', 'impasto', 'duotone', 'pixelate', 'slit-scan'];
// costOf/resolutionForEffectCost (effect compute-cost weighting and the
// resolution-scaling curve derived from it) now live in
// constants/effectCost.ts, shared with EffectsTab.tsx's manual Multi-FX
// toggle path, which applies the same curve directly now instead of only
// ever getting resolution relief via a Shuffle.
// Params whose visual effect is subtle-to-invisible when driven by a fast,
// noisy audio signal — repositioning a center point or rotating a fade axis
// a few degrees per beat doesn't read as "reacting to the music" the way a
// size/intensity/count swing does. Not excluded outright (still eligible if
// they're the only sliders in a sparse pool), just weighted down so
// shuffleAudiovisuals's picks are more likely to be ones you can actually
// see moving.
const LOW_VISIBILITY_MOD_KEYS = new Set([
  'angleCenterX', 'angleCenterY', 'angleStartOffset',
  'blurMotionDirection', 'fadeDirection', 'noiseDirection',
]);
export type { RandomizationParams };

export function useRandomization(params: RandomizationParams) {
  const {
    colorFamilyRef, activeEffects, adjustColorArrayLength, gradientAngle, gradientColors, gradientType, isAudioEnabled, isAudioReactive, isMobile,
    kaleidoscopeSegments, pixelSize, resolutionMultiplier, setResolutionMultiplier,
    setFireworksCount, setFireworksParticleCount, setFireworksTrailFade,
    setLightningBoltCount, setLightningJitter, setLightningBranchiness,
    setMeshWireframeGridSize, setMeshWireframeJitter, setMeshWireframeLineWidth,
    setWaveInterferenceSourceCount, setWaveInterferenceFrequency, setWaveInterferenceSpeed,
    setParticlesCount, setParticlesSpeed, setParticlesSize, setParticlesTrail, setParticlesGravity, setParticlesSides,
    setMarksCount, setMarksSize, setMarksDecay,
    setTilingSize, setTilingSymmetry, setTilingComplexity, setTilingRotation, setTilingRowOffset,
    randomColor, randomHexColor, ratedResults, saveCurrentState, setActiveEffects,
    setAngleCenterX, setAngleCenterY, setAngleStartOffset, setAsciiSize, setAsciiColor, setAuroraBandCount, setAuroraBandHeight,
    setAuroraWaveSpeed, setBaseAIColors, setBassBeatSync, setBassMultiplier, setBloomIntensity, setBloomRadius, setBlurGaussianAmount, setBlurMotionAmount,
    setBlurMotionDirection, setBlurRadialAmount, setBlurType, setCausticsBrightness, setCausticsScale, setCausticsSpeed, setChromaticAngle, setChromaticOffset,
    setChromaticTrailsDecay, setChromaticTrailsOffset, setColorShiftHue, setConcentricRingCount, setConcentricRingWidth,
    setHelixTightness, setHelixTurns, setContrastBeatEnabled, setDigitalNoiseIntensity, setDitherLevels, setDitherType, setDitherScale,
    setDuotoneColor1, setDuotoneColor2, setDuotoneColor3, setDuotoneIntensity, setDuotoneThreeColor, setDustCrackleIntensity, setEmojiChars,
    setEmojiRotateSpeed, setEmojiSize, setEmojiSizeVariation, setFadeDirection, setFeedbackDecay, setFeedbackRotation, setFeedbackZoom,
    setFlowParticleCount, setFlowScale, setFlowSpeed, setFlowThickness, setFlowerCircles,
    setAsciiChars, setGrainType, setGridRotationDirection, setKaleidoscopeRotateSpeed, setLiquidScale, setLiquidStrength,
    setNoiseType, setNoiseWarp, setNoiseSpeed, setRadialSizeScale, setRadialSpeed, setVignetteSoftness, setWaveDistortionRotation,
    setJuliaReal, setJuliaImaginary, setJuliaZoom, setJuliaIterations, setJuliaSpeed,
    setReactionDiffusionFeed, setReactionDiffusionKill, setReactionDiffusionSpeed,
    setAttractorPointCount, setAttractorScale, setAttractorSpeed, setAttractorDotSize, setAttractorTrailFade,
    setTopographicScale, setTopographicBands, setTopographicLineWidth,
    setFieldContrast, setPaletteMode, setPaletteBands, setInvertAmount, setFieldScale, setFieldSpeed,
    setPaletteStops, setPaletteBias, setPaletteSharp, applyLookValues, setFieldShapes, setFieldSwirl,
    setSlitScanIntensity, setSlitScanDirection, setSlitScanHistory, setSlitScanSpeed,
    setCrtSpeed, setDitherSpeed, setDadaSpeed, setAsciiSpeed, setWatercolorSpeed, setImpastoSpeed, setGridEffectSpeed, setLiquidSpeed,
    setOilPaintRadius, setOilPaintLevels, setImpastoStrength, setImpastoLightAngle, setWatercolorBleed, setWatercolorGrain,
    setDadaPanels, setDadaChaos,
    setFlowerScale, setFlowerSpread, setGradientColors, setGradientType, setGrainIntensity, setGrainSize,
    setGessoWhiteness, setGessoTexture, setGessoResponse,
    setGridColumns,
    setGridRotation, setGridRows, setGridShapeSize, setGridSides, setGridVariation, setHalftoneMove, setHalftoneCMYK,
    setHalftoneMoveSpeed, setHalftoneSize, setHalftoneVariation, setHexGridSize,
    setIsMultiFxMode, setKaleidoscopeSegments, setLavaBlobCount, setLavaBlobSize, setLightLeakIntensity,
    setMidsBeatSync, setMidsMultiplier,
    setLinesAngle, setLinesCount, setLinesThickness, setLiquifyStrength, setMarbleOctaves, setMarbleSpeed, setMarbleTurbulence,
    setMarbleVeinFreq, setMasterSensitivity, setMetaballCount, setMetaballSize, setMetaballSpeed, setMirrorMode,
    setMirrorTileCount, setNoiseDirection, setNoiseOctaves,
    setNoiseScale, setPaletteBeatEnabled, setPinchStrength, setPixelSize,
    setPolygon2Sides, setPosterizeLevels, setRadialBurstCount,
    setRadialBurstSize, setRadialBurstSpread, setRotationDirection,
    setSepiaIntensity, setShakeBeatEnabled, setShapesCount, setShapesSpeed, setShapesMode,
    setTurrellSpeed, setTurrellGlow,
    setStackCount, setStackGap, setStackWidth, setStackLength, setStackResponse, setStackSpeed,
    setHatchLayers, setHatchSpacing, setHatchResponse, setHatchSpeed,
    setShapesSides, setShowRatingUI, setSolarizeThreshold, setWindmillRotations, setWindmillThickness, setWindmillTightness,
    setWindmillZoom, setSubBassBeatSync, setSubBassMultiplier, setSubmittedAIPrompt, setTargetAngle, setTargetColors, setTargetZoom, setTriangleSize,
    setAudioBindings,
    setTrebleBeatSync, setTrebleMultiplier,
    setTruchetSize, setTruchetThickness, setTruchetSpeed, setTruchetVariation, setTwistAmount, setVcrPlaybackSpeed, setVhsGlitchIntensity, setVhsJitterAmount, setVignetteStrength,
    setVoronoiCellCount, setVoronoiDistortion, setVoronoiSpeed, setWaveDistortionStrength,
    setZoom, setZoomBeatEnabled, windmillTightness, twistAmount, vignetteStrength,
    zoom,
    // Passed in from InteractiveGradient.tsx's useRandomization() call but
    // previously never destructured here — same silent-gap bug as the
    // Modulation one: sliders exist in the UI and are wired into
    // save/restore, but no shuffle path ever touched them.
    setCrtIntensity, setCrtScanlineSpacing, setDustCrackleColor, setDustCrackleLength, setGridCellAngleStep,
    setAuraGlowCount, setAuraGlowSpeed, setAuraGlowOpacity,
    // Same gap, found in a follow-up audit: mode/enum toggles and a few
    // stray sliders that had real UI controls but no shuffle path ever
    // touched them, either because they were never destructured here at
    // all or (structuralSeed) only ever got rerolled by a big audio hit.
    setWindmillMode, setWindmillZoomResponse, setFadeMode, setParticlesMode, 
    setAngleHardEdge, setGridHardEdge, setRadialHardEdge,
    setStructuralSeed, setLavaSpeed, setFlowerRotation, setFlowerSymmetry, setFlowerOpacity, setFlowerSpeed,
    setTriangulateVariation, setEmojiOffsetX,
  } = params;

  const randomizeUncoveredParams = useCallback(() => {
    // Previously-partial gradient types
    setRadialBurstSize(Math.floor(Math.random() * 190) + 10);          // 10–199
    setGridShapeSize(Math.floor(Math.random() * 99) + 1);              // 1–99
    setGridVariation(Math.random());                                    // 0–1
    setFadeMode(Math.random() < 0.5 ? 'angle' : 'light');
    setAngleHardEdge(Math.random() < 0.5);
    setGridHardEdge(Math.random() < 0.5);
    setRadialHardEdge(Math.random() < 0.5);
    // Caustics/Voronoi/Marble/Metaballs/Topographic's underlying pattern
    // structure (see the comment on structuralSeed's own reseed effect in
    // InteractiveGradient.tsx) — previously only ever rerolled by a big
    // audio hit, so those 5 types always rendered the same structure
    // across every shuffle, just with different colors/scale.
    setStructuralSeed(Math.floor(Math.random() * 1000000));
    setTriangulateVariation(Math.random());                             // 0–1

    // Fireworks
    setFireworksCount(Math.floor(Math.random() * 10) + 5);             // 5–14
    setFireworksParticleCount(Math.floor(Math.random() * 90) + 30);    // 30–119
    setFireworksTrailFade(Math.random() * 0.2 + 0.05);                 // 0.05–0.25

    // Lightning
    setLightningBoltCount(Math.floor(Math.random() * 6) + 2);          // 2–7
    setLightningJitter(Math.random() * 0.7 + 0.25);                    // 0.25–0.95
    setLightningBranchiness(Math.random() * 0.6 + 0.15);               // 0.15–0.75

    // Particles
    setParticlesMode((['drift', 'flow-field', 'marks'] as const)[Math.floor(Math.random() * 3)]);
    setParticlesCount(Math.floor(Math.random() * 490) + 10);           // 10–499
    setParticlesSize(Math.random() * 9.5 + 0.5);                       // 0.5–10
    setParticlesSides(Math.floor(Math.random() * 8) + 1);              // 1–8
    setParticlesSpeed(Math.random() * 4.9 + 0.1);                      // 0.1–5
    setParticlesTrail(Math.random() * 0.48 + 0.02);                    // 0.02–0.5
    setParticlesGravity(Math.random() * 3);                            // 0–3

    // Marks
    setMarksCount(Math.floor(Math.random() * 12) + 4);                  // 4–15
    setMarksSize(Math.random() * 40 + 20);                              // 20–60
    setMarksDecay(Math.random() * 0.1 + 0.88);                          // 0.88–0.98

    // Tiling
    setTilingSize(Math.floor(Math.random() * 27) * 10 + 30);           // 30–300
    setTilingSymmetry(Math.floor(Math.random() * 11) + 2);             // 2–12
    setTilingComplexity(Math.floor(Math.random() * 20) * 0.5 + 0.5);   // 0.5–10
    setTilingRotation(Math.floor(Math.random() * 360));                // 0–359
    setTilingRowOffset(Math.floor(Math.random() * 301) - 150);         // -150–150

    // Caustics
    setCausticsBrightness(Math.random() * 4.5 + 0.5);                  // 0.5–5
    setCausticsScale(Math.random() * 11 + 1);                          // 1–12
    setCausticsSpeed(Math.random() * 1.4 + 0.4);                       // 0.4–1.8

    // Lava Lamp
    setLavaBlobCount(Math.floor(Math.random() * 10) + 2);              // 2–11
    setLavaBlobSize(Math.random() * 0.35 + 0.05);                      // 0.05–0.4
    setLavaSpeed(Math.random() * 4.9 + 0.1);                           // 0.1–5

    // Marble
    setMarbleVeinFreq(Math.random() * 9.5 + 0.5);                      // 0.5–10
    setMarbleTurbulence(Math.random() * 5);                            // 0–5
    setMarbleOctaves(Math.floor(Math.random() * 8) + 1);               // 1–8
    setMarbleSpeed(Math.random() * 1.4 + 0.4);                       // 0.4–1.8

    // Metaballs
    setMetaballCount(Math.floor(Math.random() * 12) + 2);              // 2–13
    setMetaballSize(Math.random() * 0.35 + 0.05);                      // 0.05–0.4
    setMetaballSpeed(Math.random() * 4.9 + 0.1);                       // 0.1–5

    // Truchet
    setTruchetSize(Math.floor(Math.random() * 85) + 15);               // 15–99
    setTruchetVariation(Math.random());                                 // 0–1
    setTruchetThickness(Math.floor(Math.random() * 14) + 1);           // 1–14
    setTruchetSpeed(Math.random() * 1.4 + 0.4);                       // 0.4–1.8

    // Flow Field
    setFlowParticleCount(Math.floor(Math.random() * 780) + 20);        // 20–799
    setFlowSpeed(Math.random() * 4.9 + 0.1);                           // 0.1–5
    setFlowScale(Math.random() * 9.5 + 0.5);                           // 0.5–10
    setFlowThickness(Math.random() * 5.5 + 0.5);                       // 0.5–6

    // Flower
    setFlowerCircles(Math.floor(Math.random() * 11) + 1);              // 1–11
    setFlowerScale(Math.random() * 2.9 + 0.1);                         // 0.1–3
    setFlowerSpread(Math.random() * 2.2 + 0.3);                        // 0.3–2.5
    setFlowerRotation(Math.floor(Math.random() * 360));                // 0–359
    setFlowerSymmetry(Math.floor(Math.random() * 10) + 3);             // 3–12
    setFlowerOpacity(Math.random() * 1.3 + 0.2);                       // 0.2–1.5
    setFlowerSpeed(Math.random() * 1.4 + 0.4);                       // 0.4–1.8


    // Light (Fade's slow-crossfade mode) — kept in its own slow, calm
    // range even on Shuffle.
    setTurrellSpeed(Math.random() * 1.4 + 0.4);                        // 0.4–1.8
    setTurrellGlow(Math.random() * 0.5 + 0.2);                         // 0.2–0.7

    // Stack
    setStackCount(Math.floor(Math.random() * 24) + 8);                 // 8–31
    setStackGap(Math.random() * 0.5 + 0.15);                           // 0.15–0.65
    setStackWidth(Math.random() * 1.3 + 0.4);                          // 0.4–1.7
    setStackLength(Math.random() * 1.3 + 0.4);                         // 0.4–1.7
    setStackResponse(Math.random() * 0.8 + 0.2);                       // 0.2–1.0
    setStackSpeed(Math.random() * 1.4 + 0.4);                       // 0.4–1.8

    // Hatch
    setHatchLayers(Math.floor(Math.random() * 4) + 1);                  // 1–4
    setHatchSpacing(Math.random() * 25 + 6);                            // 6–31
    setHatchResponse(Math.random() * 0.8 + 0.2);                        // 0.2–1.0
    setHatchSpeed(Math.random() * 1.4 + 0.4);                           // 0.4–1.8

    // Bloom
    setBloomIntensity(Math.random() * 2);                              // 0–2
    setBloomRadius(Math.floor(Math.random() * 38) + 2);                // 2–39

    // Chromatic Trails
    setChromaticTrailsDecay(Math.random() * 0.49 + 0.5);               // 0.5–0.99
    setChromaticTrailsOffset(Math.floor(Math.random() * 29) + 1);      // 1–29

    // Dither
    setDitherLevels(Math.floor(Math.random() * 14) + 2);               // 2–15
    setDitherType(Math.random() < 0.5 ? 'bayer' : 'floyd-steinberg');
    setDitherScale(Math.floor(Math.random() * 8) + 1);                 // 1–8
    setDitherSpeed(0.5 + Math.random() * 1.5);                                  // 0.5–2

    // Feedback
    setFeedbackDecay(Math.random() * 0.47 + 0.5);                      // 0.5–0.97
    setFeedbackZoom(Math.random() * 5);                                // 0–5
    setFeedbackRotation(Math.random() * 20 - 10);                      // -10–10

    // Mirror
    setMirrorTileCount(Math.floor(Math.random() * 14) + 2);            // 2–15
    setMirrorMode((['horizontal', 'vertical', 'grid'] as const)[Math.floor(Math.random() * 3)]);

    // ASCII
    setAsciiSize(Math.floor(Math.random() * 34) + 6);                  // 6–39
    setAsciiSpeed(0.5 + Math.random() * 1.5);                                   // 0.5–2
    setAsciiColor(Math.random() < 0.5);

    // Duotone
    setDuotoneThreeColor(Math.random() < 0.5);

    // Halftone
    setHalftoneMove(Math.random() < 0.4);
    setHalftoneCMYK(Math.random() < 0.4);

    // Emoji — was only ever randomizing which characters, never size/
    // rotation/variation, so every emoji-effect shuffle looked identical
    // apart from which glyphs were picked.
    setEmojiSize(Math.floor(Math.random() * 50) + 10);                 // 10–59
    setEmojiRotateSpeed(Math.floor(Math.random() * 180));              // 0–179
    setEmojiSizeVariation(Math.floor(Math.random() * 100));            // 0–99
    setEmojiOffsetX(Math.floor(Math.random() * 41) - 20);               // -20–20

    // Julia Set — never touched by any randomize/shuffle/nudge path before.
    setJuliaReal(Math.random() * 2 - 1);                                // -1–1
    setJuliaImaginary(Math.random() * 2 - 1);                           // -1–1
    setJuliaZoom(Math.random() * 2.7 + 0.3);                            // 0.3–3
    setJuliaIterations(Math.floor(Math.random() * 100) + 20);          // 20–119
    setJuliaSpeed(Math.random() * 1.4 + 0.4);                       // 0.4–1.8

    // Reaction-Diffusion
    setReactionDiffusionFeed(Math.random() * 0.06 + 0.02);              // 0.02–0.08
    setReactionDiffusionKill(Math.random() * 0.03 + 0.04);              // 0.04–0.07
    setReactionDiffusionSpeed(Math.random() * 2.8 + 0.2);               // 0.2–3

    // Attractor
    setAttractorPointCount(Math.floor(Math.random() * 19) + 1);         // 1–19
    setAttractorSpeed(Math.random() * 4.9 + 0.1);                       // 0.1–5
    setAttractorScale(Math.random() * 2.7 + 0.3);                       // 0.3–3
    setAttractorDotSize(Math.random() * 5.5 + 0.5);                     // 0.5–6
    setAttractorTrailFade(Math.random() * 0.29 + 0.01);                 // 0.01–0.3

    // Topographic
    setTopographicScale(Math.floor(Math.random() * 90) + 10);           // 10–99
    setTopographicBands(Math.floor(Math.random() * 27) + 3);            // 3–29
    setTopographicLineWidth(Math.random() * 0.14 + 0.01);               // 0.01–0.15

    // Shared field-mapping controls (Reaction-Diffusion/Marble/Caustics/
    // Topographic/Julia/Fade's Contrast/Palette Mode/Bands).
    setFieldContrast(Math.random() * 2.7 + 0.3);                        // 0.3–3
    setPaletteMode((['linear', 'banded', 'cyclic'] as const)[Math.floor(Math.random() * 3)]);
    setPaletteBands(Math.floor(Math.random() * 15) + 2);                // 2–16
    // Shared Scale/Speed for the styled-field gradients (Smoke, Glass, ...).
    setFieldScale(Math.random() * 1.2 + 0.6);                           // 0.6–1.8
    setFieldSpeed(Math.random() * 1.1 + 0.5);                           // 0.5–1.6

    // Invert effect
    setInvertAmount(Math.random());                                     // 0–1

    // Slit-Scan effect
    setSlitScanIntensity(Math.random());                                 // 0–1
    setSlitScanDirection((['horizontal', 'vertical', 'radial', 'circular'] as const)[Math.floor(Math.random() * 4)]);
    setSlitScanHistory(Math.floor(Math.random() * 109) + 12);            // 12–120
    setSlitScanSpeed(0.5 + Math.random() * 1.5);                                  // 0.5–2

    // Oil Paint
    setOilPaintRadius(Math.floor(Math.random() * 6) + 1);                // 1–6
    setOilPaintLevels(Math.floor(Math.random() * 33) + 8);               // 8–40

    // Impasto
    setImpastoStrength(Math.random() * 6 + 1);                           // 1–7
    setImpastoLightAngle(Math.floor(Math.random() * 360));               // 0–359
    setImpastoSpeed(0.5 + Math.random() * 1.5);                                   // 0.5–2

    // Brush Strokes

    // Watercolor — style itself is left alone here (it's a curated preset,
    // not a continuous slider), just Bleed/Grain.
    setWatercolorBleed(Math.random() * 10);                              // 0–10
    setWatercolorGrain(Math.random());                                   // 0–1
    setWatercolorSpeed(0.5 + Math.random() * 1.5);                                // 0.5–2

    // Dada
    setDadaPanels(Math.floor(Math.random() * 7) + 2);                    // 2–8
    setDadaChaos(Math.random());                                         // 0–1
    setDadaSpeed(0.5 + Math.random() * 1.5);                                      // 0.5–2

    // Previously-uncovered secondary sub-controls (each sits alongside a
    // primary slider that was already randomized above/elsewhere).
    setChromaticAngle(Math.floor(Math.random() * 360));
    setKaleidoscopeRotateSpeed(Math.random() * 5);                       // 0–5
    setLiquidScale(Math.random() * 9.5 + 0.5);                           // 0.5–10
    setLiquidStrength(Math.floor(Math.random() * 101));                  // 0–100
    setLiquidSpeed(0.5 + Math.random() * 1.5);                                    // 0.5–2
    setBlurType((['gaussian', 'motion', 'radial'] as const)[Math.floor(Math.random() * 3)]);
    setGrainType((['fine', 'medium', 'coarse', 'film'] as const)[Math.floor(Math.random() * 4)]);
    setNoiseType((['smooth', 'ridged'] as const)[Math.floor(Math.random() * 2)]);
    setNoiseWarp(Math.random());                                          // 0–1
    setNoiseSpeed(Math.random() * 1.4 + 0.4);                            // 0.4–1.8
    setFadeDirection(Math.floor(Math.random() * 361));                   // 0–360
    setGridRotationDirection((['none', 'clockwise', 'counterclockwise'] as const)[Math.floor(Math.random() * 3)]);
    setRadialSizeScale(Math.random() * 3.75 + 0.25);                     // 0.25–4
    setRadialSpeed(Math.random() * 1.4 + 0.4);                           // 0.4–1.8
    setVignetteSoftness(Math.floor(Math.random() * 101));                // 0–100
    setWaveDistortionRotation(Math.floor(Math.random() * 361));          // 0–360
    setAsciiChars(ASCII_CHARSET_POOL[Math.floor(Math.random() * ASCII_CHARSET_POOL.length)]);

    // Formerly lived only inline in feelingLucky, so the two subordinate
    // shuffle buttons (Shuffle Gradient / Shift+G, Shuffle Effects /
    // Shift+F) — which both call only randomizeUncoveredParams() — never
    // touched any of this despite their own comments claiming they
    // randomize "the new type's/effect's own sliders". Moved here so all
    // three shuffle entry points share one source of truth.
    setBlurMotionAmount(Math.floor(Math.random() * 50) + 10);        // 10–59
    setBlurMotionDirection(Math.floor(Math.random() * 360));           // 0–360
    setBlurGaussianAmount(randIntInRange(RANGES.blurGaussianAmount));
    setBlurRadialAmount(Math.floor(Math.random() * 15) + 3);          // 3–17
    setPosterizeLevels(Math.floor(Math.random() * 10) + 4);           // 4–13
    setHalftoneSize(Math.floor(Math.random() * 25) + 5);              // 5–29
    setHalftoneVariation(Math.random() * 0.5);                        // 0–0.5
    setHalftoneMoveSpeed(0.5 + Math.random() * 1.5);                  // 0.5–2 (it drives the clock now, so 1–6 was far too fast)
    setVignetteStrength(randInRange(RANGES.vignetteStrength));
    setColorShiftHue(randIntInRange(RANGES.colorShiftHue));
    setDigitalNoiseIntensity(Math.random() * 0.4);                    // 0–0.4
    setDuotoneIntensity(Math.random() * 0.5 + 0.3);                   // 0.3–0.8
    setDustCrackleIntensity(Math.random() * 0.3);                     // 0–0.3
    setHexGridSize(Math.floor(Math.random() * 80) + 15);              // 15–94
    setLightLeakIntensity(Math.random() * 0.5 + 0.1);                 // 0.1–0.6
    setLinesCount(Math.floor(Math.random() * 80) + 10);               // 10–89
    setLinesAngle(Math.floor(Math.random() * 360));
    setLinesThickness(Math.floor(Math.random() * 20) + 1);            // 1–20
    setLiquifyStrength(Math.floor(Math.random() * 60) + 10);          // 10–69
    setPinchStrength(Math.random() * 0.6 + 0.1);                      // 0.1–0.7
    setSepiaIntensity(Math.random() * 0.6 + 0.2);                     // 0.2–0.8
    setSolarizeThreshold(Math.floor(Math.random() * 180) + 50);       // 50–229
    setGridSides(Math.floor(Math.random() * 6) + 3);                  // 3–8
    setVhsGlitchIntensity(Math.random() * 0.35 + 0.05);              // 0.05–0.4
    setVhsJitterAmount(Math.floor(Math.random() * 351) + 50);        // 50–400
    setGridRows(Math.floor(Math.random() * 12) + 4);                  // 4–15
    setGridEffectSpeed(0.5 + Math.random() * 1.5);                             // 0.5–2
    setGridColumns(Math.floor(Math.random() * 12) + 4);               // 4–15
    setPolygon2Sides(Math.floor(Math.random() * 14) + 3);             // 3–16
    setWaveDistortionStrength(randIntInRange(RANGES.waveDistortionStrength));

    // Gradient-shape sliders
    setWindmillTightness(Math.floor(Math.random() * 19) + 1); // 1-20
    setWindmillRotations(Math.floor(Math.random() * 9) + 1); // 1-10
    setWindmillThickness(Math.floor(Math.random() * 95) + 5); // 5-100
    setWindmillZoom(Math.random() * 3 + 0.5);                           // 0.5–3.5
    setWindmillZoomResponse(Math.random());                             // 0–1
    setWindmillMode(Math.random() < 0.5 ? 'blades' : 'helix');
    // Was never touched here, so Shuffle/Auto Shuffle could only ever land
    // on whatever mode was already selected (in practice always 'polygon',
    // its default) — Polar Grid was unreachable except by a manual visit to
    // the Gradients tab.
    setShapesMode(Math.random() < 0.5 ? 'polygon' : 'polar-grid');
    setShapesSides(Math.floor(Math.random() * 10) + 3);               // 3–12
    setShapesCount(Math.floor(Math.random() * 30) + 3);               // 3–32
    setShapesSpeed(Math.random() * 1.4 + 0.4);                       // 0.4–1.8
    setConcentricRingWidth(Math.floor(Math.random() * 150) + 30);     // 30–179
    setConcentricRingCount(Math.floor(Math.random() * 18) + 3);       // 3–20
    setNoiseScale(Math.floor(Math.random() * 60) + 10);               // 10–69
    setNoiseOctaves(Math.floor(Math.random() * 5) + 2);               // 2–6
    setNoiseDirection(Math.floor(Math.random() * 360));
    setRadialBurstCount(Math.floor(Math.random() * 14) + 4);          // 4–17
    setRadialBurstSpread(Math.floor(Math.random() * 70) + 20);        // 20–89
    setVoronoiCellCount(Math.floor(Math.random() * 30) + 8);          // 8–37
    setVoronoiDistortion(Math.floor(Math.random() * 35) + 5);         // 5–39
    setVoronoiSpeed(Math.random() * 1.4 + 0.4);                       // 0.4–1.8
    setHelixTurns(Math.floor(Math.random() * 10) + 2);        // 2–11
    setHelixTightness(Math.random() * 1.2 + 0.2);             // 0.2–1.4
    setGridRotation(Math.floor(Math.random() * 360));
    setGridCellAngleStep(Math.floor(Math.random() * 91));             // 0–90
    setAngleStartOffset(Math.floor(Math.random() * 360));
    setAngleCenterX(50);
    setAngleCenterY(50);

    // Duotone colors
    setDuotoneColor1(randomHexColor());
    setDuotoneColor2(randomHexColor());
    setDuotoneColor3(randomHexColor());

    // CRT / Dust Crackle color+length — added after this shuffle pool was
    // last synced, so they sat frozen at their defaults through every
    // shuffle path exactly like the Modulation gap.
    setCrtIntensity(Math.random() * 0.6 + 0.1);                        // 0.1–0.7
    setCrtSpeed(0.5 + Math.random() * 1.5);                                     // 0.5–2
    setCrtScanlineSpacing(Math.floor(Math.random() * 6) + 1);          // 1–6
    setDustCrackleLength(Math.random() * 2.7 + 0.3);                   // 0.3–3
    setDustCrackleColor(randomHexColor());

    // Aura Glow — same gap Mesh Wireframe/Wave Interference above used to
    // have: fully wired everywhere else (sliders, modulation, snapshot) but
    // never touched by any shuffle/remix path, so activating it via Shuffle
    // always showed the same look every time.
    setAuraGlowCount(Math.floor(Math.random() * 6) + 1);                // 1–6
    setAuraGlowSpeed(Math.random() * 2.9 + 0.1);                        // 0.1–3
    setAuraGlowOpacity(Math.random() * 0.9 + 0.1);                      // 0.1–1

  }, []);
  const shuffleGradientType = useCallback(() => {
    saveCurrentState();
    const currentIndex = gradientType ? FULL_GRADIENT_TYPES.indexOf(gradientType) : -1;
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * FULL_GRADIENT_TYPES.length);
    } while (newIndex === currentIndex && FULL_GRADIENT_TYPES.length > 1);
    setGradientType(FULL_GRADIENT_TYPES[newIndex]);
    // Also randomize the new type's own shape params — previously this
    // button only ever changed WHICH type was selected, leaving every
    // type's own sliders exactly where they were (often just defaults),
    // so e.g. shuffling onto Radial Burst always showed the same size.
    randomizeUncoveredParams();
  }, [gradientType, FULL_GRADIENT_TYPES, saveCurrentState, randomizeUncoveredParams]);
  const randomizeEffects = useCallback(() => {
    saveCurrentState();
    // Randomly select 1-8 effects from the full effect list (previously a
    // stale hardcoded subset that excluded every effect added after it was
    // written — ALL_EFFECTS is the single source of truth for what exists).
    // Same sparse-content-gradient protection as feelingLucky below — this
    // button used to have none at all, which is what actually reproduced
    // the flat-single-color result (Pixelate+Duotone stacked on Particles,
    // verified via pixel sampling to have zero variance across the whole
    // canvas).
    const sparseGradient = isSparseContentGradient(gradientType);
    const pool = sparseGradient ? ALL_EFFECTS.filter(e => !CONTENT_ERASERS.includes(e)) : ALL_EFFECTS;
    const maxEffects = sparseGradient ? 2 : 8;
    const numEffects = Math.floor(Math.random() * maxEffects) + 1;
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const selectedEffects = shuffled.slice(0, numEffects);

    setActiveEffects(selectedEffects);
    if (selectedEffects.includes('emoji')) setEmojiChars(pickRandomEmojiSet(5));
    if (selectedEffects.length > 1) {
      setIsMultiFxMode(true);
    }
    setResolutionMultiplier(resolutionForEffectCost(selectedEffects.reduce((sum, e) => sum + costOf(e), 0), isMobile));
    // Previously this button only ever picked WHICH effects were active —
    // every effect's own sliders (bloom radius, mirror tiles, emoji size,
    // etc.) stayed wherever they last were, so repeated shuffles looked
    // identical apart from which effects were on.
    randomizeUncoveredParams();
  }, [gradientType, saveCurrentState, randomizeUncoveredParams, setResolutionMultiplier]);
  // Optional overrides let feelingLucky pass the gradient/effects it JUST
  // picked in this same call — without them, this closes over gradientType/
  // activeEffects from the render that triggered it, which is the state
  // from BEFORE feelingLucky's setGradientType/setActiveEffects calls (those
  // are async, so the new look isn't in props/state yet). Standalone callers
  // (Shift+A, the Audio tab's own shuffle button) omit the overrides and
  // correctly scope to whatever look is already on screen.
  const shuffleAudiovisuals = useCallback((overrideGradientType?: GradientType, overrideEffects?: EffectType[]) => {
    const effectiveGradientType = overrideGradientType ?? gradientType;
    const effectiveActiveEffects = overrideEffects ?? activeEffects;
    setMasterSensitivity(0.1 + Math.random() * 2.9); // 0.1-3
    setSubBassMultiplier(Math.random() * 5);
    setBassMultiplier(Math.random() * 5);
    setMidsMultiplier(Math.random() * 5);
    setTrebleMultiplier(Math.random() * 5);
    setSubBassBeatSync(Math.random() < 0.5);
    setBassBeatSync(Math.random() < 0.5);
    setMidsBeatSync(Math.random() < 0.5);
    setTrebleBeatSync(Math.random() < 0.5);
    setZoomBeatEnabled(Math.random() < 0.5);
    setShakeBeatEnabled(Math.random() < 0.5);
    setContrastBeatEnabled(Math.random() < 0.5);
    setPaletteBeatEnabled(Math.random() < 0.5);

    const activeModCategories = modCategoriesFor(effectiveGradientType, effectiveActiveEffects as string[], EFFECT_MOD_CATEGORY);
    const relevantParams = MODULATABLE_PARAMS.filter((p) => activeModCategories.has(p.category));
    // Fall back to the full pool only if the current gradient/effects have no
    // modulatable sliders at all, so Shuffle still does something useful.
    const paramPool = relevantParams.length > 0 ? relevantParams : MODULATABLE_PARAMS;

    const bandOptions: AudioBinding['band'][] = ['sub', 'mids', 'treble', 'energy'];
    const bindingCount = Math.min(1 + Math.floor(Math.random() * 3), paramPool.length); // 1-3
    // Weighted sampling without replacement — low-visibility params (see
    // LOW_VISIBILITY_MOD_KEYS) are 4x less likely to be picked than a normal
    // size/intensity/count slider, so a shuffle more reliably lands on
    // bindings whose audio-reactivity is actually visible on screen, while
    // still leaving them selectable when they're the only options in a
    // sparse pool.
    const candidates = paramPool.map((p) => ({ p, weight: LOW_VISIBILITY_MOD_KEYS.has(p.key) || (GLOBAL_CATEGORIES as readonly string[]).includes(p.category) ? 1 : 4 }));
    const shuffledParams: typeof paramPool = [];
    for (let i = 0; i < bindingCount && candidates.length > 0; i++) {
      const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
      let roll = Math.random() * totalWeight;
      let pickIndex = 0;
      for (; pickIndex < candidates.length; pickIndex++) {
        roll -= candidates[pickIndex].weight;
        if (roll < 0) break;
      }
      shuffledParams.push(candidates[pickIndex].p);
      candidates.splice(pickIndex, 1);
    }
    setAudioBindings(shuffledParams.map((p): AudioBinding => ({
      id: `${Date.now()}-${Math.random()}`,
      param: p.key,
      band: bandOptions[Math.floor(Math.random() * bandOptions.length)],
      // Floor raised from 0.2 to 0.9 — a near-zero modulation depth binds
      // technically but never swings far enough to visibly read as
      // "reacting to the music".
      amount: Number(((Math.random() < 0.15 ? -1 : 1) * (0.9 + Math.random() * 2.3)).toFixed(1)),
    })));
  }, [gradientType, activeEffects]);
  const feelingLucky = useCallback(() => {
    setShowRatingUI(false);
    setTimeout(() => {
      setShowRatingUI(true);
    }, 800);
    saveCurrentState();

    const audioActive = isAudioEnabled && isAudioReactive;

    // If no gradient type is selected, select a random one
    let currentGradientType = gradientType;
    if (currentGradientType === null) {
      const pool = audioActive ? AUDIO_GRADIENTS : FEELING_LUCKY_GRADIENT_TYPES;
      const randomGradient = pool[Math.floor(Math.random() * pool.length)];
      setGradientType(randomGradient);
      currentGradientType = randomGradient;
    }

    // Tracks whatever gradient/effects this call actually ends up choosing
    // (either branch below) so shuffleAudiovisuals — called at the very end
    // of this same function — can scope its random Modulation bindings to
    // the NEW look instead of the stale one still sitting in gradientType/
    // activeEffects state (those setters are async and haven't landed yet).
    let finalGradientType: GradientType | null = currentGradientType;
    let finalEffects: EffectType[] = activeEffects;
    // The mood of this shuffle: it steers speed, how hard effects hit, how big the shape sliders run and which
    // effects are favoured (constants/shuffleTaste.ts), and it avoids the mood just used.
    const mood = chooseMood(shuffleHistory, Math.random, id => learnedWeight('mood', id));
    shuffleHistory.record('mood', mood.id);
    let chosenPalette: string | undefined;

    // Get high-rated results (7+) to use as preference guidance
    // When audio is active, prefer results that were also rated with audio on
    const allHighRated = ratedResults.filter(r => r.rating >= 7);
    const audioHighRated = allHighRated.filter(r => r.data.audioWasActive);
    const highRatedResults = audioActive && audioHighRated.length >= 2 ? audioHighRated : allHighRated;
    // Scale blend probability with pool size so early favorites don't dominate
    const blendProbability = Math.min(0.6, highRatedResults.length * 0.08);
    // The old 1-10 rating feature is gone but its saved ratings stay in this browser, and they were steering up to 60% of
    // shuffles toward the same few gradients and effects (and into stacks with no effects, and fast speeds). Marks and
    // the learner replaced them, so the saved ratings are no longer used.
    const usePreferences = false && highRatedResults.length >= 3 && Math.random() < blendProbability;
    
    if (usePreferences && highRatedResults.length > 0) {
      // Weight by rating: higher-rated results are more likely to be picked
      const totalWeight = highRatedResults.reduce((sum, r) => sum + r.rating, 0);
      let pick = Math.random() * totalWeight;
      let baseResult = highRatedResults[highRatedResults.length - 1];
      for (const r of highRatedResults) {
        pick -= r.rating;
        if (pick <= 0) { baseResult = r; break; }
      }
      const blendFactor = 0.3 + Math.random() * 0.4; // 30-70% blend

      // Use base result's gradient type and effects with some variation
      // Ensure we always have a valid gradient type (fallback to current or random if base is null).
      // baseResult can be a rated result saved before a gradient/effect type
      // was removed from the app (e.g. Waves/Iridescent) — validate against
      // the current type list rather than trusting the stored string, or a
      // stale type silently renders nothing.
      const baseGradientType: GradientType | undefined = baseResult.data.gradientType;
      const targetGradientType = (baseGradientType && FEELING_LUCKY_GRADIENT_TYPES.includes(baseGradientType))
        ? baseGradientType
        : currentGradientType || FEELING_LUCKY_GRADIENT_TYPES[Math.floor(Math.random() * FEELING_LUCKY_GRADIENT_TYPES.length)];
      setGradientType(targetGradientType);
      finalGradientType = targetGradientType;
      shuffleHistory.record('gradient', targetGradientType);

      // Blend colors from base with some random variation
      const blendedColors = baseResult.data.gradientColors.map((baseColor: ColorRGB) => {
        if (Math.random() < blendFactor) {
          return baseColor; // Keep base color
        } else {
          // Mix base color with random color
          const randColor = randomColor();
          return {
            r: Math.round(baseColor.r * 0.7 + randColor.r * 0.3),
            g: Math.round(baseColor.g * 0.7 + randColor.g * 0.3),
            b: Math.round(baseColor.b * 0.7 + randColor.b * 0.3),
          };
        }
      });
      
      // Ensure blendedColors matches the current gradientColors length
      const adjustedColors = adjustColorArrayLength(blendedColors, gradientColors.length);
      setTargetColors(adjustedColors);
      setGradientColors(adjustedColors); // Also update current colors immediately
      
      // Use similar effects from base result — same staleness risk as the
      // gradient type above, so drop any effect id no longer in ALL_EFFECTS.
      const baseEffects: EffectType[] = (baseResult.data.activeEffects || []).filter((e: EffectType) => ALL_EFFECTS.includes(e));
      const keepEffectsCount = Math.floor(baseEffects.length * blendFactor);
      const keptEffects = baseEffects.slice(0, keepEffectsCount);
      
      // Add some random effects — capped to at most 1 (instead of up to 3)
      // and excluding the content-erasers when the base result's gradient
      // is sparse-content, same reasoning as the full-random branch below.
      const sparseBlend = isSparseContentGradient(targetGradientType);
      const additionalEffectsPool = sparseBlend ? ALL_EFFECTS.filter(e => !CONTENT_ERASERS.includes(e)) : ALL_EFFECTS;
      const additionalEffects = Math.floor(Math.random() * (sparseBlend ? 2 : 3));
      for (let i = 0; i < additionalEffects; i++) {
        const randomEffect = additionalEffectsPool[Math.floor(Math.random() * additionalEffectsPool.length)];
        if (!keptEffects.includes(randomEffect)) {
          keptEffects.push(randomEffect);
        }
      }
      // Looks with no effects were kept 2 of 21 times when marked, and with one effect 4 of 15, so top the stack up.
      const minBlendEffects = sparseBlend ? 2 : 3;
      while (keptEffects.length < minBlendEffects) {
        const e = additionalEffectsPool[Math.floor(Math.random() * additionalEffectsPool.length)];
        if (!keptEffects.includes(e)) keptEffects.push(e);
      }
      setActiveEffects(keptEffects);
      finalEffects = keptEffects;
      shuffleHistory.record('effect', keptEffects);
      if (keptEffects.includes('emoji')) setEmojiChars(pickRandomEmojiSet(5));
      setIsMultiFxMode(true);
      
      // Blend numerical parameters with base result
      const blendValue = (baseVal: number, min: number, max: number) => {
        const randomVal = min + Math.random() * (max - min);
        return baseVal * blendFactor + randomVal * (1 - blendFactor);
      };
      
      setTargetAngle(blendValue(baseResult.data.gradientAngle || 0, 0, 360));
      setTargetZoom(1);
      setZoom(1);
      setAngleCenterX(50);
      setAngleCenterY(50);
      
      const speedOptions = [0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const randomSpeed = speedOptions[Math.floor(Math.random() * speedOptions.length)];
      setVcrPlaybackSpeed(randomSpeed);
      
      setRotationDirection(Math.random() < 0.5 ? 'clockwise' : 'counter');
      
      // Set FX parameters with blending
      if (baseResult.data.kaleidoscopeSegments) setKaleidoscopeSegments(Math.round(blendValue(baseResult.data.kaleidoscopeSegments, 3, 22)));
      if (baseResult.data.pixelSize) setPixelSize(Math.round(blendValue(baseResult.data.pixelSize, 5, 54)));
      if (baseResult.data.vignetteStrength) setVignetteStrength(blendValue(baseResult.data.vignetteStrength, 0, 1));
      if (baseResult.data.windmillTightness) setWindmillTightness(Math.round(blendValue(baseResult.data.windmillTightness, 1, 20)));
      // Randomize remaining parameters normally
      setTriangleSize(Math.floor(Math.random() * 80) + 20);
      setChromaticOffset(Math.floor(Math.random() * 20) + 1);

      setGrainIntensity(Math.random() * 0.5);
      setGrainSize(Math.floor(Math.random() * 6) + 1);
      setGessoWhiteness(Math.random() * 0.3 + 0.55);                   // 0.55–0.85
      setGessoTexture(Math.random() * 0.6);                            // 0–0.6
      setGessoResponse(Math.random());                                 // 0–1
    } else {
      // Full random generation — curated ranges for better results

      // When audio is active, bias toward audio-reactive gradients (70% chance)
      const gradientPool = (audioActive && Math.random() < 0.7)
        ? AUDIO_GRADIENTS
        : FEELING_LUCKY_GRADIENT_TYPES;
      // Effects during ratings phase: keep gradients legible so ratings are meaningful.
      // Heavy shape-changers mask the gradient entirely; only allow them stacked with a light effect.
      const SHAPE_CHANGERS: EffectType[] = ['kaleidoscope', 'pixelate', 'triangulate', 'slit-scan', 'halftone', 'posterize', 'dither'];
      // When audio is active, prefer effects that visibly react to audio
      const LIGHT_FX: EffectType[] = (audioActive ? AUDIO_EFFECTS : ALL_EFFECTS)
        .filter(e => !SHAPE_CHANGERS.includes(e as EffectType)) as EffectType[];
      // The cost budget (see EFFECT_COST): a couple of heavy effects stop a stack early, light ones fill it out,
      // which bounds per-frame compute instead of just effect count. Average EFFECT_COST is about 2, so reaching
      // 5 effects needs a budget around 9-10; a floor of 9 plus a 0-10 triangular spread keeps cost from being
      // what usually stops a stack short of the cap.
      const costBudget = 9 + Math.floor(((Math.random() + Math.random()) / 2) * 10);
      // Roll several candidate looks (a gradient and an effect stack), score them against the taste table, the
      // mood and what was shown lately, and take one of the better ones. Sparse-content gradients (points on
      // black) take at most 2 effects and none that erase content.
      const picked = chooseLook({
        gradientPool,
        lightEffects: LIGHT_FX,
        shapeChangers: SHAPE_CHANGERS.filter(e => (ALL_EFFECTS as EffectType[]).includes(e)),
        costOf,
        costBudget,
        // Marked looks: 0-1 effects were kept about a third of the time, 2 effects two thirds, 3 or more 90%.
        minEffects: 3,
        maxEffects: g => (isSparseContentGradient(g) ? 2 : 5),
        excluded: g => (isSparseContentGradient(g) ? CONTENT_ERASERS : []),
        learned: (kind, id) => learnedWeight(kind, id),
      }, mood, shuffleHistory);
      const randomGradient: GradientType = picked.gradient;
      setGradientType(randomGradient);
      finalGradientType = randomGradient;
      // A palette built by rule for this kind of gradient (a hue harmony, a dark-to-bright ramp, fewer distinct colours
      // for patterns). Most shuffles replace it further down with a curated Look or a library palette.
      setTargetColors(generatePalette({ gradient: randomGradient, count: gradientColors.length }));
      const selectedEffects: EffectType[] = picked.effects;
      const spentCost = picked.spentCost;
      shuffleHistory.record('gradient', randomGradient);
      shuffleHistory.record('effect', selectedEffects);

      setActiveEffects(selectedEffects);
      finalEffects = selectedEffects;
      if (selectedEffects.includes('emoji')) setEmojiChars(pickRandomEmojiSet(5));
      setIsMultiFxMode(true);
      setResolutionMultiplier(resolutionForEffectCost(spentCost, isMobile));

      setTargetAngle(Math.random() * 360);
      setTargetZoom(1);
      setZoom(1);

      // Speed comes from the mood: calm and soft stay slow, bold and glitchy run fast.
      setVcrPlaybackSpeed(mood.speeds[Math.floor(Math.random() * mood.speeds.length)]);

      setRotationDirection(Math.random() < 0.5 ? 'clockwise' : 'counter');

      setKaleidoscopeSegments(randIntInRange(RANGES.kaleidoscopeSegments));
      // How hard effects hit follows the mood's strength (a gentle mood keeps the low end of each range).
      setPixelSize(randIntInRange(scaleRange(RANGES.pixelSize, mood.strength)));
      setTriangleSize(randIntInRange(RANGES.triangleSize));
      setChromaticOffset(randIntInRange(scaleRange(RANGES.chromaticOffset, mood.strength)));
      setGrainIntensity(Math.random() * (0.06 + 0.14 * mood.strength));   // 0.06–0.2 at most
      setGrainSize(Math.floor(Math.random() * 6) + 1);                // 1–6
      setGessoWhiteness(Math.random() * 0.3 + 0.55);                  // 0.55–0.85
      setGessoTexture(Math.random() * 0.6);                           // 0–0.6
      setGessoResponse(Math.random());                                // 0–1
    }
    
    setBaseAIColors(null);
    setSubmittedAIPrompt('');
    // The blur/posterize/halftone/.../duotone-color/palette-adjust block that
    // used to live here inline now lives in randomizeUncoveredParams (see
    // that function) so Shuffle Gradient and Shuffle Effects share it too,
    // instead of only the main Remix button.
    randomizeUncoveredParams();
    // Palette shaping (stop positions / Bias / Sharpness) isn't randomized, so
    // clear whatever the last shuffle or Look left behind. Then, most of the
    // time, land on one of the gradient's curated Looks — they're the combos
    // known to read well, and the resampled palette keeps Auto Shuffle easing
    // instead of snapping when the Look has a different colour count.
    if (!usePreferences) {
      // New pattern layout too — Seed now has a visible control, and a shuffle
      // that kept the old one would hand back the same cells/veins every time.
      setStructuralSeed(Math.floor(Math.random() * 1000000));
      // Fresh shape sliders for the gradient it landed on (they're kept per gradient).
      const shape = () => Math.round((mood.shape[0] + Math.random() * (mood.shape[1] - mood.shape[0])) * 20) / 20;
      setFieldShapes(finalGradientType && STYLE_SHAPE_CONTROLS[finalGradientType]
        ? { [finalGradientType]: [shape(), shape()] } : {});
      // Now and then a styled gradient gets a little twist; most shuffles stay straight.
      setFieldSwirl(finalGradientType && STYLE_SHAPE_CONTROLS[finalGradientType] && Math.random() < mood.swirlChance ? Math.round(Math.random() * 60) / 100 : 0);
      setPaletteStops(null);
      setPaletteBias(0.5);
      setPaletteSharp(0);
      // Colors: a curated Look for this gradient (palette plus its settings), or a palette
      // from the shared library (colors only), or else the random palette picked above.
      // With "Same family" on, every one of those is held to the family the palette is in, and
      // a fresh palette is generated when nothing curated fits.
      const looks = finalGradientType ? GRADIENT_LOOKS[finalGradientType] : undefined;
      const dark = !!finalGradientType && DARK_GROUND_GRADIENTS.includes(finalGradientType);
      const fam = colorFamilyRef?.current;
      const anchor = fam?.enabled ? (fam.anchor ?? (fam.anchor = paletteFamily(gradientColors))) : null;
      const roll = Math.random();
      let lookSeeded = false;
      if (anchor) {
        const okLooks = (looks ?? []).filter(l => inFamily(l.colors.map(hexToRgb), anchor));
        const okPalettes = (dark ? PALETTE_PRESETS.filter(startsDark) : PALETTE_PRESETS).filter(p => inFamily(p.colors.map(hexToRgb), anchor));
        if (okLooks.length && roll < 0.6) {
          const look = pickWeighted(okLooks, l => shuffleHistory.weight('palette', `${finalGradientType}:${l.name}`) * learnedWeight('palette', `${finalGradientType}:${l.name}`));
          shuffleHistory.record('palette', `${finalGradientType}:${look.name}`);
          chosenPalette = `${finalGradientType}:${look.name}`;
          // The family is fixed, so the Look's colours are kept as they are; its numbers still vary a little.
          applyLookValues(varyLook(look, lookVariation(mood.strength)), adjustColorArrayLength(look.colors.map(hexToRgb), gradientColors.length));
          lookSeeded = true;
        } else if (okPalettes.length && roll < 0.7) {
          const palette = pickPalette(okPalettes, p => p.colors.map(hexToRgb), finalGradientType, shuffleHistory, Math.random, 2, n => learnedWeight('palette', n));
          shuffleHistory.record('palette', palette.name);
          chosenPalette = palette.name;
          setTargetColors(adjustColorArrayLength(palette.colors.map(hexToRgb), gradientColors.length));
        } else {
          setTargetColors(generateFamilyPalette(anchor, gradientColors.length, dark));
        }
      } else if (looks?.length && roll < 0.65) {
        // A curated Look is the starting point: its numbers move a little, and its palette turns a few degrees about
        // half the time, so no two shuffles from the same Look are alike but it stays recognisably what was tuned.
        const look = pickWeighted(looks, l => shuffleHistory.weight('palette', `${finalGradientType}:${l.name}`) * learnedWeight('palette', `${finalGradientType}:${l.name}`));
        shuffleHistory.record('palette', `${finalGradientType}:${look.name}`);
        chosenPalette = `${finalGradientType}:${look.name}`;
        const turn = Math.random() < 0.5 ? (Math.random() * 2 - 1) * (10 + 20 * mood.strength) : 0;
        const lookColors = nudgeHue(look.colors.map(hexToRgb), turn);
        applyLookValues(varyLook(look, lookVariation(mood.strength)), adjustColorArrayLength(lookColors, gradientColors.length));
        lookSeeded = true;
      } else if (roll < (looks?.length ? 0.85 : 0.5)) {
        const pool = dark ? PALETTE_PRESETS.filter(startsDark) : PALETTE_PRESETS;
        const palette = pickPalette(pool, p => p.colors.map(hexToRgb), finalGradientType, shuffleHistory, Math.random, 2, n => learnedWeight('palette', n));
        if (palette) { shuffleHistory.record('palette', palette.name); chosenPalette = palette.name; }
        if (palette) setTargetColors(adjustColorArrayLength(palette.colors.map(hexToRgb), gradientColors.length));
      }
      // Starting from a Look, the styled gradients' shape sliders stay near their tuned position instead of wandering.
      if (lookSeeded && finalGradientType && STYLE_SHAPE_CONTROLS[finalGradientType]) {
        const near = () => Math.round((1 + (Math.random() - 0.5) * 0.2) * 20) / 20;
        setFieldShapes({ [finalGradientType]: [near(), near()] });
        setFieldSwirl(0);
      }
    }
    // Remix randomizes every gradient/effect slider already — extend that to
    // the Audio panel too, but only when audio is actually engaged, so a
    // Remix on a silent canvas doesn't reshuffle sensitivity/beat-sync
    // settings that have no visible effect yet.
    // What this shuffle was made of, so a later undo (or leaving it alone, saving it, exporting it) can teach Shuffle.
    if (finalGradientType) shuffleLearning.begin({ gradient: finalGradientType, effects: finalEffects, mood: mood.id, palette: chosenPalette });
    if (audioActive && finalGradientType) shuffleAudiovisuals(finalGradientType, finalEffects);

    // (rating UI shown at top of feelingLucky)
  }, [gradientType, gradientColors, randomColor, FEELING_LUCKY_GRADIENT_TYPES, ALL_EFFECTS, saveCurrentState, ratedResults, isAudioEnabled, isAudioReactive, AUDIO_GRADIENTS, AUDIO_EFFECTS, randomizeUncoveredParams, shuffleAudiovisuals, setResolutionMultiplier, applyLookValues, adjustColorArrayLength, gradientColors, setPaletteStops, setPaletteBias, setPaletteSharp, setStructuralSeed, setFieldShapes, setFieldSwirl]);
  const evolveWithFactor = useCallback((factor: number) => {
    // At full factor, hand off to feelingLucky for true randomness
    if (factor >= 1) { feelingLucky(); return; }

    saveCurrentState();

    // Scale color drift: ±15° at factor=0, ±160° at factor=1
    const hueDrift = 15 + factor * 145;
    const satDrift = 8 + factor * 30;
    const litDrift = 6 + factor * 22;
    const evolvedColors = gradientColors.map(c => {
      const [h, s, l] = rgbToHsl(c.r, c.g, c.b);
      const nh = (h + (Math.random() * hueDrift * 2 - hueDrift) + 360) % 360;
      const ns = Math.max(35, Math.min(95, s + (Math.random() * satDrift * 2 - satDrift)));
      const nl = Math.max(28, Math.min(80, l + (Math.random() * litDrift * 2 - litDrift)));
      return hslToRgb(nh, ns, nl);
    });
    setTargetColors(evolvedColors);
    setGradientColors(evolvedColors);

    // Scale angle drift: ±10° → ±175°
    const angleDrift = 10 + factor * 165;
    setTargetAngle((gradientAngle + (Math.random() * angleDrift * 2 - angleDrift) + 360) % 360);

    // Speed: starts changing at factor > 0.1
    if (factor > 0.1) {
      const speedOptions = [0.5, 1, 1, 2, 2, 3, 3, 4, 5, 6];
      setVcrPlaybackSpeed(speedOptions[Math.floor(Math.random() * speedOptions.length)]);
    }

    // Zoom: nudges in at factor > 0.4
    if (factor > 0.4) {
      const zoomDrift = factor * 0.4;
      setZoom(Math.max(0.7, Math.min(2.0, zoom + (Math.random() * zoomDrift * 2 - zoomDrift))));
    }

    // Rotation direction: 50% chance at full factor
    if (Math.random() < factor * 0.5) {
      setRotationDirection(Math.random() < 0.5 ? 'clockwise' : 'counter');
    }

    // Effect params — nudged on each tap, range scales with factor. Was a
    // fixed 9-effect list (kaleidoscope/chromatic/vignette/blur/grain/wave/
    // pixelate/shift/twist) — any other active effect sat frozen through
    // every hold/evolve. Extended to match the same coverage
    // randomizeUncoveredParams brings to the Shuffle/WAV-click paths
    // (vhs/crt/slit-scan added, grain/dither/mirror filled out).
    // A single tap only nudges <2 (i.e. at most one) active effect at a
    // time, picked at random, rather than every active effect at once.
    const rng = (min: number, max: number) => min + Math.random() * (max - min) * (0.3 + factor * 0.7);
    const effectsToNudge = activeEffects.length > 0
      ? [activeEffects[Math.floor(Math.random() * activeEffects.length)]]
      : [];
    for (const eff of effectsToNudge) {
      if (eff === 'kaleidoscope') setKaleidoscopeSegments(Math.round(rng(...RANGES.kaleidoscopeSegments)));
      else if (eff === 'chromatic') setChromaticOffset(Math.round(rng(...RANGES.chromaticOffset)));
      else if (eff === 'vignette') setVignetteStrength(rng(...RANGES.vignetteStrength));
      else if (eff === 'blur') setBlurGaussianAmount(Math.round(rng(...RANGES.blurGaussianAmount)));
      else if (eff === 'grain') { setGrainIntensity(rng(0, 0.5)); setGrainSize(Math.round(rng(1, 6))); }
      else if (eff === 'gesso') setGessoTexture(rng(0, 0.6));
      else if (eff === 'wave') setWaveDistortionStrength(Math.round(rng(...RANGES.waveDistortionStrength)));
      else if (eff === 'pixelate') setPixelSize(Math.round(rng(...RANGES.pixelSize)));
      else if (eff === 'shift') setColorShiftHue(Math.round(rng(...RANGES.colorShiftHue)));
      else if (eff === 'triangulate') setTriangleSize(Math.round(rng(...RANGES.triangleSize)));
      else if (eff === 'bloom') { setBloomIntensity(rng(0, 2)); setBloomRadius(Math.round(rng(2, 40))); }
      else if (eff === 'chromatic-trails') { setChromaticTrailsDecay(rng(0.5, 0.99)); setChromaticTrailsOffset(Math.round(rng(1, 30))); }
      else if (eff === 'dither') { setDitherLevels(Math.round(rng(2, 16))); setDitherScale(Math.round(rng(1, 8))); setDitherSpeed(rng(0.5, 2)); }
      else if (eff === 'feedback') { setFeedbackDecay(rng(0.5, 0.97)); setFeedbackZoom(rng(0, 5)); }
      else if (eff === 'mirror') setMirrorTileCount(Math.round(rng(2, 16)));
      else if (eff === 'ascii') { setAsciiSize(Math.round(rng(6, 40))); setAsciiSpeed(rng(0.5, 2)); }
      else if (eff === 'emoji') { setEmojiSize(Math.round(rng(10, 60))); setEmojiRotateSpeed(Math.round(rng(0, 180))); }
      else if (eff === 'vhs') { setVhsGlitchIntensity(rng(0.05, 0.4)); setVhsJitterAmount(Math.round(rng(50, 400))); }
      else if (eff === 'crt') { setCrtIntensity(rng(0.1, 0.7)); setCrtScanlineSpacing(Math.round(rng(1, 6))); setCrtSpeed(rng(0.5, 2)); }
      else if (eff === 'liquid') setLiquidSpeed(rng(0.5, 2));
      else if (eff === 'grid-effect') setGridEffectSpeed(rng(0.5, 2));
      else if (eff === 'dada') setDadaSpeed(rng(0.5, 2));
      else if (eff === 'watercolor') setWatercolorSpeed(rng(0.5, 2));
      else if (eff === 'impasto') setImpastoSpeed(rng(0.5, 2));
      else if (eff === 'slit-scan') { setSlitScanIntensity(rng(0, 1)); setSlitScanHistory(Math.round(rng(12, 120))); setSlitScanSpeed(rng(0.5, 2)); }
    }

    // Gradient-specific params — scale range with factor. Was always the
    // same 7 params regardless of the current gradient type; now gated to
    // only nudge the params the active type actually uses, and extended to
    // cover the 14 types that previously had none here at all (angle, fade,
    // radial, julia, attractor, reaction-diffusion, topographic,
    // particles, tiling, wave-interference, mesh-wireframe, fireworks,
    // lightning).
    if (gradientType === 'windmill') setWindmillTightness(Math.round(rng(1, 20)));
    else if (gradientType === 'noise') setNoiseScale(Math.round(rng(10, 70)));
    else if (gradientType === 'shapes') { setConcentricRingWidth(Math.round(rng(20, 180))); setPolygon2Sides(Math.round(rng(1, 24))); }
    else if (gradientType === 'radial-burst') { setRadialBurstCount(Math.round(rng(4, 18))); setRadialBurstSize(Math.round(rng(10, 200))); }
    else if (gradientType === 'grid') { setGridShapeSize(Math.round(rng(1, 100))); setGridVariation(rng(0, 1)); }
    else if (gradientType === 'voronoi') setVoronoiCellCount(Math.round(rng(8, 38)));
    else if (gradientType === 'caustics') setCausticsScale(rng(1, 12));
    else if (gradientType === 'lava-lamp') { setLavaBlobCount(Math.round(rng(2, 12))); setLavaBlobSize(rng(0.05, 0.4)); }
    else if (gradientType === 'marble') setMarbleTurbulence(rng(0, 5));
    else if (gradientType === 'metaballs') { setMetaballCount(Math.round(rng(2, 14))); setMetaballSpeed(rng(0.1, 5)); }
    else if (gradientType === 'truchet') { setTruchetSize(Math.round(rng(15, 100))); setTruchetVariation(rng(0, 1)); }
    else if (gradientType === 'flower') { setFlowerCircles(Math.round(rng(1, 12))); setFlowerScale(rng(0.1, 3)); }
    else if (gradientType === 'angle') setAngleStartOffset(Math.round(rng(0, 360)));
    else if (gradientType === 'radial') setRadialSizeScale(rng(0.25, 4));
    else if (gradientType === 'julia') setJuliaZoom(rng(0.3, 3));
    else if (gradientType === 'attractor') setAttractorSpeed(rng(0.1, 5));
    else if (gradientType === 'reaction-diffusion') setReactionDiffusionSpeed(rng(0.2, 3));
    else if (gradientType === 'topographic') setTopographicScale(Math.round(rng(10, 99)));
    else if (gradientType === 'particles') { setParticlesSpeed(rng(0.1, 5)); setFlowParticleCount(Math.round(rng(20, 800))); setFlowSpeed(rng(0.1, 5)); }
    else if (gradientType === 'tiling') setTilingComplexity(rng(0.5, 10));
    else if (gradientType === 'fireworks') setFireworksTrailFade(rng(0.05, 0.25));
    else if (gradientType === 'lightning') setLightningJitter(rng(0.25, 0.95));
    else if (gradientType === 'stack') setStackResponse(rng(0.2, 1.0));
    else if (gradientType === 'hatch') setHatchResponse(rng(0.2, 1.0));
    // kaleidoscope's own segment count isn't tied to a gradient type — it's
    // effect-driven above — but was always nudged here too regardless of
    // whether the effect is active; kept as-is (harmless) for continuity.
    setKaleidoscopeSegments(Math.round(rng(...RANGES.kaleidoscopeSegments)));

    setBaseAIColors(null);
    setSubmittedAIPrompt('');
  }, [gradientColors, gradientAngle, zoom, activeEffects, saveCurrentState, feelingLucky, FEELING_LUCKY_GRADIENT_TYPES]);

  return {
    randomizeUncoveredParams,
    shuffleGradientType,
    randomizeEffects,
    feelingLucky,
    evolveWithFactor,
    shuffleAudiovisuals,
  };
}
