import { useCallback } from 'react';
import {
  type ColorRGB, type GradientType, type EffectType,
  ALL_EFFECTS, AUDIO_GRADIENTS, AUDIO_EFFECTS, FEELING_LUCKY_GRADIENT_TYPES, FULL_GRADIENT_TYPES,
} from '../constants/gradientEffects';
import { pickRandomEmojiSet, type ColorPin } from '../components/InteractiveGradient';
import { hslToRgb, rgbToHsl } from '../utils/color';
import { RANGES, randInRange, randIntInRange } from '../constants/randomizationRanges';

// Loosely typed on purpose: this hook wires together ~150 setters spanning
// nearly every piece of app state (randomization touches everything by
// design). The build doesn't type-check (esbuild transpile only), and
// precise per-field typing here would be hundreds of lines for zero actual
// safety benefit — matches the existing PresetData = Record<string, any>
// convention used for the same reason in usePresets.ts.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RandomizationParams = Record<string, any>;

export function useRandomization(params: RandomizationParams) {
  const {
    activeEffects, adjustColorArrayLength, gradientAngle, gradientColors, gradientType, isAudioEnabled, isAudioReactive,
    kaleidoscopeSegments, pixelSize,
    plasmaSpeed, randomColor, randomHexColor, ratedResults, saveCurrentState, setActiveEffects,
    setAngleCenterX, setAngleCenterY, setAngleStartOffset, setAsciiSize, setAsciiColor, setAuroraBandCount, setAuroraBandHeight,
    setAuroraWaveSpeed, setBaseAIColors, setBassBeatSync, setBassMultiplier, setBloomIntensity, setBloomRadius, setBlurGaussianAmount, setBlurMotionAmount,
    setBlurMotionDirection, setBlurRadialAmount, setCausticsBrightness, setCausticsScale, setCharcoalIntensity, setChromaticOffset,
    setChromaticTrailsDecay, setChromaticTrailsOffset, setColorPins, setColorShiftHue, setConcentricRingCount, setConcentricRingWidth,
    setHelixTightness, setHelixTurns, setContrastBeatEnabled, setDigitalNoiseIntensity, setDitherLevels, setDitherType,
    setDuotoneColor1, setDuotoneColor2, setDuotoneColor3, setDuotoneIntensity, setDuotoneThreeColor, setDustCrackleIntensity, setEmojiChars,
    setEmojiRotateSpeed, setEmojiSize, setEmojiSizeVariation, setFeedbackDecay, setFeedbackRotation, setFeedbackZoom,
    setFisheyeStrength, setFlowParticleCount, setFlowScale, setFlowSpeed, setFlowThickness, setFlowerCircles,
    setFlowerScale, setFlowerSpread, setGradientColors, setGradientType, setGrainIntensity, setGridColumns,
    setGridRotation, setGridRows, setGridShapeSize, setGridSides, setGridVariation, setHalftoneMove, setHalftoneCMYK,
    setHalftoneMoveSpeed, setHalftoneSize, setHalftoneVariation, setHexGridSize, setIridescentAngle, setIridescentIntensity,
    setIridescentScale, setIsMultiFxMode, setKaleidoscopeSegments, setLavaBlobCount, setLavaBlobSize, setLightLeakIntensity,
    setMidsBeatSync, setMidsMultiplier,
    setLinesAngle, setLinesCount, setLinesThickness, setLiquifyStrength, setMarbleOctaves, setMarbleTurbulence,
    setMarbleVeinFreq, setMasterSensitivity, setMeshGridSize, setMetaballCount, setMetaballSize, setMetaballSpeed, setMirrorMode,
    setMirrorTileCount, setMoireOffset, setMoireScale, setMoireSpeed, setNoiseDirection, setNoiseOctaves,
    setNoiseScale, setPaletteBeatEnabled, setPinchStrength, setPixelSize, setPlasmaComplexity, setPlasmaSpeed,
    setPolygon2Sides, setPosterizeLevels, setRadarBeamWidth, setRadarFadeLength, setRadialBurstCount,
    setRadialBurstSize, setRadialBurstSpread, setRippleAmplitude, setRotationDirection, setScanLineSize, setScanlineIntensity,
    setScanlineSpacing, setScanlineSpeed, setSelectedPinId, setSepiaIntensity, setShakeBeatEnabled, setShapesCount,
    setShapesSides, setShowRatingUI, setSolarizeThreshold, setWindmillRotations, setWindmillThickness, setWindmillTightness,
    setWindmillZoom, setSubBassBeatSync, setSubBassMultiplier, setSubmittedAIPrompt, setTargetAngle, setTargetColors, setTargetZoom, setTriangleSize,
    setTrebleBeatSync, setTrebleMultiplier,
    setTruchetSize, setTruchetThickness, setTruchetVariation, setTwistAmount, setVcrPlaybackSpeed, setVhsGlitchIntensity, setVignetteStrength,
    setVoronoiCellCount, setVoronoiDistortion, setWaveAmplitude, setWaveDistortionStrength, setWaveFrequency, setWaveNumber,
    setWaveRotation, setZoom, setZoomBeatEnabled, windmillTightness, twistAmount, vignetteStrength,
    zoom,
  } = params;

  const randomizeUncoveredParams = useCallback(() => {
    // Previously-partial gradient types
    setRadialBurstSize(Math.floor(Math.random() * 190) + 10);          // 10–199
    setGridShapeSize(Math.floor(Math.random() * 99) + 1);              // 1–99
    setGridVariation(Math.random());                                    // 0–1

    // Aurora
    setAuroraBandCount(Math.floor(Math.random() * 10) + 2);            // 2–11
    setAuroraBandHeight(Math.random() * 3.5 + 0.5);                    // 0.5–4
    setAuroraWaveSpeed(Math.random() * 2.9 + 0.1);                     // 0.1–3

    // Caustics
    setCausticsBrightness(Math.random() * 4.5 + 0.5);                  // 0.5–5
    setCausticsScale(Math.random() * 11 + 1);                          // 1–12

    // Lava Lamp
    setLavaBlobCount(Math.floor(Math.random() * 10) + 2);              // 2–11
    setLavaBlobSize(Math.random() * 0.35 + 0.05);                      // 0.05–0.4

    // Marble
    setMarbleVeinFreq(Math.random() * 9.5 + 0.5);                      // 0.5–10
    setMarbleTurbulence(Math.random() * 5);                            // 0–5
    setMarbleOctaves(Math.floor(Math.random() * 8) + 1);               // 1–8

    // Metaballs
    setMetaballCount(Math.floor(Math.random() * 12) + 2);              // 2–13
    setMetaballSize(Math.random() * 0.35 + 0.05);                      // 0.05–0.4
    setMetaballSpeed(Math.random() * 4.9 + 0.1);                       // 0.1–5

    // Truchet
    setTruchetSize(Math.floor(Math.random() * 85) + 15);               // 15–99
    setTruchetVariation(Math.random());                                 // 0–1
    setTruchetThickness(Math.floor(Math.random() * 14) + 1);           // 1–14

    // Moire
    setMoireScale(Math.floor(Math.random() * 37) + 3);                 // 3–39
    setMoireOffset(Math.floor(Math.random() * 100));                   // 0–99
    setMoireSpeed(Math.random() * 4.9 + 0.1);                          // 0.1–5

    // Flow Field
    setFlowParticleCount(Math.floor(Math.random() * 780) + 20);        // 20–799
    setFlowSpeed(Math.random() * 4.9 + 0.1);                           // 0.1–5
    setFlowScale(Math.random() * 9.5 + 0.5);                           // 0.5–10
    setFlowThickness(Math.random() * 5.5 + 0.5);                       // 0.5–6

    // Flower
    setFlowerCircles(Math.floor(Math.random() * 11) + 1);              // 1–11
    setFlowerScale(Math.random() * 2.9 + 0.1);                         // 0.1–3
    setFlowerSpread(Math.random() * 2.2 + 0.3);                        // 0.3–2.5

    // Radar
    setRadarFadeLength(Math.floor(Math.random() * 170) + 10);          // 10–179
    setRadarBeamWidth(Math.floor(Math.random() * 89) + 1);             // 1–89

    // Bloom
    setBloomIntensity(Math.random() * 2);                              // 0–2
    setBloomRadius(Math.floor(Math.random() * 38) + 2);                // 2–39

    // Chromatic Trails
    setChromaticTrailsDecay(Math.random() * 0.49 + 0.5);               // 0.5–0.99
    setChromaticTrailsOffset(Math.floor(Math.random() * 29) + 1);      // 1–29

    // Dither
    setDitherLevels(Math.floor(Math.random() * 14) + 2);               // 2–15
    setDitherType(Math.random() < 0.5 ? 'bayer' : 'floyd-steinberg');

    // Feedback
    setFeedbackDecay(Math.random() * 0.47 + 0.5);                      // 0.5–0.97
    setFeedbackZoom(Math.random() * 5);                                // 0–5
    setFeedbackRotation(Math.random() * 20 - 10);                      // -10–10

    // Mirror
    setMirrorTileCount(Math.floor(Math.random() * 14) + 2);            // 2–15
    setMirrorMode((['horizontal', 'vertical', 'grid'] as const)[Math.floor(Math.random() * 3)]);

    // Ripple
    setRippleAmplitude(Math.floor(Math.random() * 45) + 5);            // 5–49

    // Scanlines
    setScanlineIntensity(Math.random());                                // 0–1
    setScanlineSpacing(Math.floor(Math.random() * 18) + 2);            // 2–19
    setScanlineSpeed(Math.random() * 5);                                // 0–5

    // ASCII
    setAsciiSize(Math.floor(Math.random() * 34) + 6);                  // 6–39
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
    const numEffects = Math.floor(Math.random() * 8) + 1;
    const shuffled = [...ALL_EFFECTS].sort(() => Math.random() - 0.5);
    const selectedEffects = shuffled.slice(0, numEffects);

    setActiveEffects(selectedEffects);
    if (selectedEffects.includes('emoji')) setEmojiChars(pickRandomEmojiSet(5));
    if (selectedEffects.length > 1) {
      setIsMultiFxMode(true);
    }
    // Previously this button only ever picked WHICH effects were active —
    // every effect's own sliders (bloom radius, mirror tiles, emoji size,
    // etc.) stayed wherever they last were, so repeated shuffles looked
    // identical apart from which effects were on.
    randomizeUncoveredParams();
  }, [saveCurrentState, randomizeUncoveredParams]);
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

    // Get high-rated results (7+) to use as preference guidance
    // When audio is active, prefer results that were also rated with audio on
    const allHighRated = ratedResults.filter(r => r.rating >= 7);
    const audioHighRated = allHighRated.filter(r => r.data.audioWasActive);
    const highRatedResults = audioActive && audioHighRated.length >= 2 ? audioHighRated : allHighRated;
    // Scale blend probability with pool size so early favorites don't dominate
    const blendProbability = Math.min(0.6, highRatedResults.length * 0.08);
    const usePreferences = highRatedResults.length >= 3 && Math.random() < blendProbability;
    
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
      // Ensure we always have a valid gradient type (fallback to current or random if base is null)
      const targetGradientType = baseResult.data.gradientType || currentGradientType || FEELING_LUCKY_GRADIENT_TYPES[Math.floor(Math.random() * FEELING_LUCKY_GRADIENT_TYPES.length)];
      setGradientType(targetGradientType);
      
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
      
      // Use similar effects from base result
      const baseEffects = baseResult.data.activeEffects || [];
      const keepEffectsCount = Math.floor(baseEffects.length * blendFactor);
      const keptEffects = baseEffects.slice(0, keepEffectsCount);
      
      // Add some random effects
      const additionalEffects = Math.floor(Math.random() * 3);
      for (let i = 0; i < additionalEffects; i++) {
        const randomEffect = ALL_EFFECTS[Math.floor(Math.random() * ALL_EFFECTS.length)];
        if (!keptEffects.includes(randomEffect)) {
          keptEffects.push(randomEffect);
        }
      }
      setActiveEffects(keptEffects);
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
      if (baseResult.data.twistAmount) setTwistAmount(blendValue(baseResult.data.twistAmount, 0, 5));
      if (baseResult.data.pixelSize) setPixelSize(Math.round(blendValue(baseResult.data.pixelSize, 5, 54)));
      if (baseResult.data.vignetteStrength) setVignetteStrength(blendValue(baseResult.data.vignetteStrength, 0, 1));
      if (baseResult.data.windmillTightness) setWindmillTightness(Math.round(blendValue(baseResult.data.windmillTightness, 1, 20)));
      if (baseResult.data.plasmaSpeed) setPlasmaSpeed(blendValue(baseResult.data.plasmaSpeed, 0.25, 5));
      
      // Randomize remaining parameters normally
      setTriangleSize(Math.floor(Math.random() * 80) + 20);
      setChromaticOffset(Math.floor(Math.random() * 20) + 1);
      setFisheyeStrength(Math.random());

      setGrainIntensity(Math.random() * 0.5);
    } else {
      // Full random generation — curated ranges for better results

      // Harmonious color generation: pick a base hue, generate analogous/complementary palette
      const baseHue = Math.random() * 360;
      const colorScheme = Math.random();
      const harmonyColors = gradientColors.map((_, i) => {
        let hue: number;
        if (colorScheme < 0.4) {
          hue = (baseHue + (i - 1) * 30 + (Math.random() * 20 - 10) + 360) % 360;
        } else if (colorScheme < 0.7) {
          hue = (baseHue + (i % 2 === 0 ? 0 : 150 + Math.random() * 60) + (Math.random() * 20 - 10) + 360) % 360;
        } else {
          hue = (baseHue + i * 120 + (Math.random() * 30 - 15) + 360) % 360;
        }
        const sat = 60 + Math.random() * 35;  // 60–95%
        const lit = 42 + Math.random() * 28;  // 42–70% — prevents near-black or near-white
        const c = hslToRgb(hue, sat, lit);
        // Hard clamp: ensure perceived brightness is never too dark or too washed out
        const brightness = (c.r * 299 + c.g * 587 + c.b * 114) / 1000;
        if (brightness < 40) {
          const boost = 40 / Math.max(1, brightness);
          return { r: Math.min(255, Math.round(c.r * boost)), g: Math.min(255, Math.round(c.g * boost)), b: Math.min(255, Math.round(c.b * boost)) };
        }
        if (brightness > 220) {
          const scale = 220 / brightness;
          return { r: Math.round(c.r * scale), g: Math.round(c.g * scale), b: Math.round(c.b * scale) };
        }
        return c;
      });
      setTargetColors(harmonyColors);

      // When audio is active, bias toward audio-reactive gradients (70% chance)
      const gradientPool = (audioActive && Math.random() < 0.7)
        ? AUDIO_GRADIENTS
        : FEELING_LUCKY_GRADIENT_TYPES;
      const randomGradient = gradientPool[Math.floor(Math.random() * gradientPool.length)];
      setGradientType(randomGradient);

      // Effects during ratings phase: keep gradients legible so ratings are meaningful.
      // Heavy shape-changers mask the gradient entirely; only allow them stacked with a light effect.
      const SHAPE_CHANGERS: EffectType[] = ['kaleidoscope', 'fisheye', 'pixelate', 'triangulate', 'slit-scan', 'halftone', 'posterize', 'dither'];
      // When audio is active, prefer effects that visibly react to audio
      const LIGHT_FX: EffectType[] = audioActive
        ? AUDIO_EFFECTS.filter(e => !SHAPE_CHANGERS.includes(e as EffectType))
        : ALL_EFFECTS.filter(e => !SHAPE_CHANGERS.includes(e as EffectType));
      // Pick 0-8 effects. At most one shape-changer is included (they mask the
      // gradient entirely when stacked), the rest are light/audio effects.
      const numEffects = Math.floor(Math.random() * 9);
      const selectedEffects: EffectType[] = [];
      if (numEffects > 0) {
        const shuffledLight = [...LIGHT_FX].sort(() => Math.random() - 0.5);
        if (Math.random() < 0.5) {
          selectedEffects.push(SHAPE_CHANGERS[Math.floor(Math.random() * SHAPE_CHANGERS.length)]);
        }
        for (const fx of shuffledLight) {
          if (selectedEffects.length >= numEffects) break;
          selectedEffects.push(fx);
        }
      }

      setActiveEffects(selectedEffects);
      if (selectedEffects.includes('emoji')) setEmojiChars(pickRandomEmojiSet(5));
      setIsMultiFxMode(true);

      setTargetAngle(Math.random() * 360);
      setTargetZoom(1);
      setZoom(1);

      // Speed: bias toward 1–4 range
      const speedOptions = [0.5, 1, 1, 2, 2, 3, 3, 4, 5, 6, 8, 10];
      setVcrPlaybackSpeed(speedOptions[Math.floor(Math.random() * speedOptions.length)]);

      setRotationDirection(Math.random() < 0.5 ? 'clockwise' : 'counter');

      setKaleidoscopeSegments(randIntInRange(RANGES.kaleidoscopeSegments));
      setTwistAmount(randInRange(RANGES.twistAmount));
      setPixelSize(randIntInRange(RANGES.pixelSize));
      setTriangleSize(randIntInRange(RANGES.triangleSize));
      setChromaticOffset(randIntInRange(RANGES.chromaticOffset));
      setFisheyeStrength(Math.random() * 0.7 + 0.1);                 // 0.1–0.8
      setGrainIntensity(Math.random() * 0.2);                        // 0–0.2
    }
    
    setBaseAIColors(null);
    setSubmittedAIPrompt('');
    setBlurMotionAmount(Math.floor(Math.random() * 50) + 10);        // 10–59
    setBlurMotionDirection(Math.floor(Math.random() * 360));           // 0–360
    setBlurGaussianAmount(randIntInRange(RANGES.blurGaussianAmount));
    setBlurRadialAmount(Math.floor(Math.random() * 15) + 3);          // 3–17
    setPosterizeLevels(Math.floor(Math.random() * 10) + 4);           // 4–13
    setHalftoneSize(Math.floor(Math.random() * 25) + 5);              // 5–29
    setHalftoneVariation(Math.random() * 0.5);                        // 0–0.5
    setHalftoneMove(Math.random() > 0.6);
    setHalftoneMoveSpeed(Math.random() * 5 + 1);                      // 1–6
    setVignetteStrength(randInRange(RANGES.vignetteStrength));
    setColorShiftHue(randIntInRange(RANGES.colorShiftHue));
    setCharcoalIntensity(Math.random() * 0.6 + 0.2);                  // 0.2–0.8
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
    setScanLineSize(Math.floor(Math.random() * 10) + 2);              // 2–11
    setSepiaIntensity(Math.random() * 0.6 + 0.2);                     // 0.2–0.8
    setSolarizeThreshold(Math.floor(Math.random() * 180) + 50);       // 50–229
    setGridSides(Math.floor(Math.random() * 6) + 3);                  // 3–8
    setVhsGlitchIntensity(Math.random() * 0.35 + 0.05);              // 0.05–0.4
    setGridRows(Math.floor(Math.random() * 12) + 4);                  // 4–15
    setGridColumns(Math.floor(Math.random() * 12) + 4);               // 4–15
    setPolygon2Sides(Math.floor(Math.random() * 8) + 3);              // 3–10
    setWaveDistortionStrength(randIntInRange(RANGES.waveDistortionStrength));

    // Randomize gradient-specific controls
    setWindmillTightness(Math.floor(Math.random() * 19) + 1); // 1-20
    setWindmillRotations(Math.floor(Math.random() * 9) + 1); // 1-10
    setWindmillThickness(Math.floor(Math.random() * 95) + 5); // 5-100
    setWindmillZoom(Math.random() * 3 + 0.5);                           // 0.5–3.5
    setShapesSides(Math.floor(Math.random() * 8) + 3);                // 3–10
    setShapesCount(Math.floor(Math.random() * 30) + 3);               // 3–32
    setConcentricRingWidth(Math.floor(Math.random() * 150) + 30);     // 30–179
    setConcentricRingCount(Math.floor(Math.random() * 18) + 3);       // 3–20
    setWaveAmplitude(Math.floor(Math.random() * 60) + 15);            // 15–74
    setWaveFrequency(Math.floor(Math.random() * 8) + 1);              // 1–8
    setWaveNumber(Math.floor(Math.random() * 18) + 5);                // 5–22
    setWaveRotation(Math.floor(Math.random() * 360));
    setMeshGridSize(Math.floor(Math.random() * 7) + 2);               // 2–8
    setNoiseScale(Math.floor(Math.random() * 60) + 10);               // 10–69
    setNoiseOctaves(Math.floor(Math.random() * 5) + 2);               // 2–6
    setNoiseDirection(Math.floor(Math.random() * 360));
    setPlasmaSpeed(Math.random() * 3 + 0.5);                          // 0.5–3.5
    setPlasmaComplexity(Math.floor(Math.random() * 7) + 2);           // 2–8
    setRadialBurstCount(Math.floor(Math.random() * 14) + 4);          // 4–17
    setRadialBurstSpread(Math.floor(Math.random() * 70) + 20);        // 20–89
    setVoronoiCellCount(Math.floor(Math.random() * 30) + 8);          // 8–37
    setVoronoiDistortion(Math.floor(Math.random() * 35) + 5);         // 5–39
    setHelixTurns(Math.floor(Math.random() * 10) + 2);        // 2–11
    setHelixTightness(Math.random() * 1.2 + 0.2);             // 0.2–1.4
    setGridRotation(Math.floor(Math.random() * 360));
    setAngleStartOffset(Math.floor(Math.random() * 360));
    setAngleCenterX(50);
    setAngleCenterY(50);
    setIridescentAngle(Math.floor(Math.random() * 360));
    setIridescentIntensity(Math.random() * 1.2 + 0.5);                // 0.5–1.7
    setIridescentScale(Math.random() * 1.5 + 0.5);                    // 0.5–2.0
    
    // Randomize duotone colors
    const randomHexColor = () => {
      const r = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
      const g = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
      const b = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    };
    setDuotoneColor1(randomHexColor());
    setDuotoneColor2(randomHexColor());
    setDuotoneColor3(randomHexColor());

    // Randomize freeform gradient pins (3-8 random pins)
    const numPins = Math.floor(Math.random() * 6) + 3; // 3-8 pins
    const newPins: ColorPin[] = [];
    for (let i = 0; i < numPins; i++) {
      newPins.push({
        id: `${Date.now()}-${i}`,
        x: 0.2 + Math.random() * 0.6, // Keep pins within 0.2-0.8 range
        y: 0.2 + Math.random() * 0.6,
        color: {
          r: Math.floor(Math.random() * 255),
          g: Math.floor(Math.random() * 255),
          b: Math.floor(Math.random() * 255),
        },
        radius: 150 + Math.floor(Math.random() * 350), // 150-500
      });
    }
    setColorPins(newPins);
    setSelectedPinId(null);

    randomizeUncoveredParams();

    // (rating UI shown at top of feelingLucky)
  }, [gradientType, gradientColors, randomColor, FEELING_LUCKY_GRADIENT_TYPES, ALL_EFFECTS, saveCurrentState, ratedResults, isAudioEnabled, isAudioReactive, AUDIO_GRADIENTS, AUDIO_EFFECTS, randomizeUncoveredParams]);
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
    // randomizeUncoveredParams brings to the Shuffle/WAV-click paths.
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
      else if (eff === 'grain') setGrainIntensity(rng(0, 0.5));
      else if (eff === 'wave') setWaveDistortionStrength(Math.round(rng(...RANGES.waveDistortionStrength)));
      else if (eff === 'pixelate') setPixelSize(Math.round(rng(...RANGES.pixelSize)));
      else if (eff === 'shift') setColorShiftHue(Math.round(rng(...RANGES.colorShiftHue)));
      else if (eff === 'twist') setTwistAmount(rng(...RANGES.twistAmount));
      else if (eff === 'triangulate') setTriangleSize(Math.round(rng(...RANGES.triangleSize)));
      else if (eff === 'bloom') { setBloomIntensity(rng(0, 2)); setBloomRadius(Math.round(rng(2, 40))); }
      else if (eff === 'chromatic-trails') { setChromaticTrailsDecay(rng(0.5, 0.99)); setChromaticTrailsOffset(Math.round(rng(1, 30))); }
      else if (eff === 'dither') setDitherLevels(Math.round(rng(2, 16)));
      else if (eff === 'feedback') { setFeedbackDecay(rng(0.5, 0.97)); setFeedbackZoom(rng(0, 5)); }
      else if (eff === 'mirror') setMirrorTileCount(Math.round(rng(2, 16)));
      else if (eff === 'ripple') setRippleAmplitude(Math.round(rng(5, 50)));
      else if (eff === 'scanlines') { setScanlineIntensity(rng(0, 1)); setScanlineSpacing(Math.round(rng(2, 20))); }
      else if (eff === 'ascii') setAsciiSize(Math.round(rng(6, 40)));
      else if (eff === 'emoji') { setEmojiSize(Math.round(rng(10, 60))); setEmojiRotateSpeed(Math.round(rng(0, 180))); }
    }

    // Gradient-specific params — scale range with factor. Was always the
    // same 7 params regardless of the current gradient type; now gated to
    // only nudge the params the active type actually uses, and extended to
    // cover the 10 types that previously had none here at all.
    if (gradientType === 'windmill') setWindmillTightness(Math.round(rng(1, 20)));
    else if (gradientType === 'waves') { setWaveAmplitude(Math.round(rng(10, 80))); setWaveFrequency(Math.round(rng(1, 8))); }
    else if (gradientType === 'noise') setNoiseScale(Math.round(rng(10, 70)));
    else if (gradientType === 'plasma') setPlasmaSpeed(rng(0.5, 3.5));
    else if (gradientType === 'shapes') setConcentricRingWidth(Math.round(rng(20, 180)));
    else if (gradientType === 'radial-burst') { setRadialBurstCount(Math.round(rng(4, 18))); setRadialBurstSize(Math.round(rng(10, 200))); }
    else if (gradientType === 'grid') { setGridShapeSize(Math.round(rng(1, 100))); setGridVariation(rng(0, 1)); }
    else if (gradientType === 'voronoi') setVoronoiCellCount(Math.round(rng(8, 38)));
    else if (gradientType === 'aurora') { setAuroraBandCount(Math.round(rng(2, 12))); setAuroraWaveSpeed(rng(0.1, 3)); }
    else if (gradientType === 'caustics') setCausticsScale(rng(1, 12));
    else if (gradientType === 'lava-lamp') { setLavaBlobCount(Math.round(rng(2, 12))); setLavaBlobSize(rng(0.05, 0.4)); }
    else if (gradientType === 'marble') setMarbleTurbulence(rng(0, 5));
    else if (gradientType === 'metaballs') { setMetaballCount(Math.round(rng(2, 14))); setMetaballSpeed(rng(0.1, 5)); }
    else if (gradientType === 'truchet') { setTruchetSize(Math.round(rng(15, 100))); setTruchetVariation(rng(0, 1)); }
    else if (gradientType === 'moire') { setMoireScale(Math.round(rng(3, 40))); setMoireSpeed(rng(0.1, 5)); }
    else if (gradientType === 'flow-field') { setFlowParticleCount(Math.round(rng(20, 800))); setFlowSpeed(rng(0.1, 5)); }
    else if (gradientType === 'flower') { setFlowerCircles(Math.round(rng(1, 12))); setFlowerScale(rng(0.1, 3)); }
    else if (gradientType === 'radar') setRadarBeamWidth(Math.round(rng(1, 90)));
    // kaleidoscope's own segment count isn't tied to a gradient type — it's
    // effect-driven above — but was always nudged here too regardless of
    // whether the effect is active; kept as-is (harmless) for continuity.
    setKaleidoscopeSegments(Math.round(rng(...RANGES.kaleidoscopeSegments)));

    setBaseAIColors(null);
    setSubmittedAIPrompt('');
  }, [gradientColors, gradientAngle, zoom, activeEffects, saveCurrentState, feelingLucky, FEELING_LUCKY_GRADIENT_TYPES]);
  const shuffleAudiovisuals = useCallback(() => {
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
  }, []);

  return {
    randomizeUncoveredParams,
    shuffleGradientType,
    randomizeEffects,
    feelingLucky,
    evolveWithFactor,
    shuffleAudiovisuals,
  };
}
