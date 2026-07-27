import { useCallback } from 'react';
import { type GradientType, DEFAULT_COLORS } from '../constants/gradientEffects';

// Loosely typed for the same reason as useRandomization.ts's params: this
// hook wires together ~380 values/setters covering every persistable piece
// of app state (buildSnapshot/applySnapshot are the single source of truth
// for undo/redo AND presets, so they touch nearly everything by design).
// The build doesn't type-check (esbuild transpile only) — matches the
// existing PresetData = Record<string, any> convention in usePresets.ts.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SnapshotParams = Record<string, any>;

export function useSnapshot(params: SnapshotParams) {
  const {
    activeEffects, angleCenterX, angleCenterY, angleStartOffset, asciiChars, asciiColor,
    asciiSize, auroraBandCount, auroraBandHeight, auroraWaveSpeed, autoGainEnabled, depthLayerEnabled, depthLayerStrength, baseAIColors,
    bassBeatSync, bassMax, bassMin, bassMultiplier, bassSmoothing, bassThreshold,
    bloomIntensity, bloomRadius, blurGaussianAmount, blurMotionAmount, blurMotionDirection, blurRadialAmount,
    blurType, causticsBrightness, causticsScale, chromaticAngle, chromaticOffset,
    chromaticTrailsDecay, chromaticTrailsOffset, colorShiftHue, concentricRingCount, concentricRingWidth,
    helixTightness, helixTurns, contrastBeatEnabled, digitalNoiseIntensity, ditherLevels, ditherType,
    glitchIntensity, glitchBlockSize, glitchChromaSplit,
    fieldContrast, paletteMode, paletteBands, invertAmount, structuralSeed, audioBindings,
    voronoiAnimTime, flowerAnimTime, auroraAnimTime, causticsAnimTime, lavaAnimTime, marbleAnimTime,
    metaballAnimTime, moireAnimTime, flowAnimTime, liquidAnimTime, emojiAnimTime, attractorAnimTime, tilingAnimTime,
    duotoneColor1, duotoneColor2, duotoneColor3, duotoneIntensity, duotoneThreeColor, dustCrackleColor, dustCrackleIntensity, dustCrackleLength,
    emojiChars, emojiOffsetX, emojiRotateSpeed, emojiSize, emojiSizeVariation, fadeDirection,
    feedbackDecay, feedbackRotation, feedbackZoom, fisheyeCenterX, fisheyeCenterY, fisheyeStrength,
    flowParticleCount, flowScale, flowSpeed, flowThickness, attractorPointCount, attractorScale, attractorSpeed, attractorDotSize, attractorTrailFade,
    particlesCount, particlesSpeed, particlesSize, particlesTrail, particlesGravity,
    tilingSize, tilingSymmetry, tilingComplexity, tilingRotation,
    reactionDiffusionFeed, reactionDiffusionKill, reactionDiffusionSpeed,
    topographicScale, topographicBands, topographicLineWidth,
    juliaReal, juliaImaginary, juliaZoom, juliaIterations, flowerCircles, flowerRotation, flowerSymmetry, flowerOpacity,
    flowerScale, flowerSpread, gradientAngle, gradientColors, gradientType, grainIntensity,
    grainType, gridCellAngleStep, gridColumns, gridRotation, gridRows, gridShapeSize, gridSides,
    gridVariation, halftoneCMYK, halftoneMove, halftoneMoveSpeed, halftoneSize, halftoneVariation,
    hexGridSize, iridescentAngle, iridescentIntensity, iridescentScale, isAudioEnabled, isAudioReactive,
    kaleidoscopeRotateSpeed, kaleidoscopeSegments, lavaBlobCount, lavaBlobSize, lavaSpeed, lightLeakIntensity,
    linesAngle, linesCount, linesThickness, liquidScale, liquidStrength, liquifyStrength, displaceStrength, displaceScale, crtIntensity,
    marbleOctaves, marbleTurbulence, marbleVeinFreq, masterSensitivity,
    metaballCount, metaballSize, metaballSpeed, midsBeatSync, midsMax, midsMin,
    midsMultiplier, midsSmoothing, midsThreshold, mirrorMode, mirrorTileCount, moireOffset,
    moireScale, moireSpeed, noiseDirection, noiseOctaves, noiseScale, noiseType,
    noiseWarp, paletteBeatEnabled, photoBlendMode, photoImageRef, photoOpacity, pinchStrength,
    pixelSize, plasmaComplexity, plasmaSpeed, plasmaZoomScale, polygon2Sides,
    posterizeLevels, radarBeamWidth, radarFadeLength, radarSweepAngle, radialBurstCount, radialBurstMode, radialBurstSize,
    radialBurstSpread, radialSizeScale, resolutionMultiplier, rippleAmplitude, rippleFrequency, scanLineSize,
    scanlineIntensity, scanlineSpacing, scanlineSpeed, sepiaIntensity, setActiveEffects, setAngleCenterX,
    setAngleCenterY, setAngleStartOffset, setAsciiChars, setAsciiColor, setAsciiSize, setAuroraBandCount,
    setAuroraBandHeight, setAuroraWaveSpeed, setAutoGainEnabled, setDepthLayerEnabled, setDepthLayerStrength, setBaseAIColors, setBassBeatSync, setBassMax,
    setBassMin, setBassMultiplier, setBassSmoothing, setBassThreshold, setBloomIntensity, setBloomRadius,
    setBlurGaussianAmount, setBlurMotionAmount, setBlurMotionDirection, setBlurRadialAmount, setBlurType, setCausticsBrightness,
    setCausticsScale, setChromaticAngle, setChromaticOffset, setChromaticTrailsDecay, setChromaticTrailsOffset,
    setColorShiftHue, setConcentricRingCount, setConcentricRingWidth, setHelixTightness, setHelixTurns,
    setContrastBeatEnabled, setDigitalNoiseIntensity, setDitherLevels, setDitherType, setGlitchIntensity, setGlitchBlockSize, setGlitchChromaSplit,
    setFieldContrast, setPaletteMode, setPaletteBands, setInvertAmount, setStructuralSeed, setAudioBindings,
    setVoronoiAnimTime, setFlowerAnimTime, setAuroraAnimTime, setCausticsAnimTime, setLavaAnimTime, setMarbleAnimTime,
    setMetaballAnimTime, setMoireAnimTime, setFlowAnimTime, setLiquidAnimTime, setEmojiAnimTime, setAttractorAnimTime, setTilingAnimTime,
    setDuotoneColor1, setDuotoneColor2,
    setDuotoneColor3, setDuotoneIntensity, setDuotoneThreeColor, setDustCrackleColor, setDustCrackleIntensity, setDustCrackleLength, setEmojiChars, setEmojiOffsetX,
    setEmojiRotateSpeed, setEmojiSize, setEmojiSizeVariation, setFadeDirection, setFeedbackDecay, setFeedbackRotation,
    setFeedbackZoom, setFisheyeCenterX, setFisheyeCenterY, setFisheyeStrength, setFlowParticleCount, setFlowScale,
    setFlowSpeed, setFlowThickness, setAttractorPointCount, setAttractorScale, setAttractorSpeed, setAttractorDotSize, setAttractorTrailFade,
    setParticlesCount, setParticlesSpeed, setParticlesSize, setParticlesTrail, setParticlesGravity,
    setTilingSize, setTilingSymmetry, setTilingComplexity, setTilingRotation,
    setReactionDiffusionFeed, setReactionDiffusionKill, setReactionDiffusionSpeed,
    setTopographicScale, setTopographicBands, setTopographicLineWidth,
    setJuliaReal, setJuliaImaginary, setJuliaZoom, setJuliaIterations,
    setFlowerCircles, setFlowerRotation, setFlowerScale, setFlowerSpread, setFlowerSymmetry, setFlowerOpacity,
    setGradientAngle, setGradientColors, setGradientType, setGrainIntensity, setGrainType, setGridCellAngleStep, setGridColumns,
    setGridRotation, setGridRows, setGridShapeSize, setGridSides, setGridVariation, setHalftoneCMYK,
    setHalftoneMove, setHalftoneMoveSpeed, setHalftoneSize, setHalftoneVariation, setHexGridSize, setIridescentAngle,
    setIridescentIntensity, setIridescentScale, setIsAudioEnabled, setIsAudioReactive, setKaleidoscopeRotateSpeed, setKaleidoscopeSegments,
    setLavaBlobCount, setLavaBlobSize, setLavaSpeed, setLightLeakIntensity, setLinesAngle, setLinesCount,
    setLinesThickness, setLiquidScale, setLiquidStrength, setLiquifyStrength, setDisplaceStrength, setDisplaceScale, setCrtIntensity, setMarbleOctaves, setMarbleTurbulence,
    setMarbleVeinFreq, setMasterSensitivity, setMeshGridSize, setMeshJitter, setMetaballCount, setMetaballSize,
    setMetaballSpeed, setMidsBeatSync, setMidsMax, setMidsMin, setMidsMultiplier, setMidsSmoothing,
    setMidsThreshold, setMirrorMode, setMirrorTileCount, setMoireOffset, setMoireScale, setMoireSpeed,
    setNoiseDirection, setNoiseOctaves, setNoiseScale, setNoiseType, setNoiseWarp, setPaletteBeatEnabled,
    setPhotoBlendMode, setPhotoOpacity, setPinchStrength, setPixelSize, setPlasmaComplexity, setPlasmaSpeed,
    setPlasmaZoomScale, setPolygon2Sides, setPosterizeLevels, setRadarBeamWidth, setRadarFadeLength,
    setRadarSweepAngle, setRadialBurstCount, setRadialBurstMode, setRadialBurstSize, setRadialBurstSpread, setRadialSizeScale, setResolutionMultiplier, setRippleAmplitude,
    setRippleFrequency, setScanLineSize, setScanlineIntensity, setScanlineSpacing, setScanlineSpeed, setSepiaIntensity,
    setShakeBeatEnabled, setShapesCount, setShapesSides, setSlitScanDirection, setSlitScanIntensity, setSolarizeThreshold,
    setWindmillRotations, setWindmillThickness, setWindmillTightness, setWindmillZoom, setWindmillZoomResponse, setWindmillMode, setSubBassBeatSync, setSubBassMultiplier,
    setSubmittedAIPrompt, setTargetAngle, setTargetColors, setTargetZoom, setTrebleBeatSync, setTrebleMax,
    setTrebleMin, setTrebleMultiplier, setTrebleSmoothing, setTrebleThreshold, setTriangleSize, setTriangulateVariation, setTruchetSize,
    setTruchetThickness, setTruchetVariation, setTwistAmount, setVhsGlitchIntensity, setVignetteSoftness, setVignetteStrength,
    setVoronoiCellCount, setVoronoiDistortion, setWaveAmplitude, setWaveDistortionRotation, setWaveDistortionStrength, setWaveFrequency,
    setWaveNumber, setWaveRotation, setWaveScale, setZoom, setZoomBeatEnabled, shakeBeatEnabled,
    shapesCount, shapesSides, slitScanDirection, slitScanIntensity, solarizeThreshold, windmillRotations,
    windmillThickness, windmillTightness, windmillZoom, windmillZoomResponse, windmillMode, subBassBeatSync, subBassMultiplier, submittedAIPrompt,
    targetAngle, targetColors, targetZoom, trebleBeatSync, trebleMax, trebleMin,
    trebleMultiplier, trebleSmoothing, trebleThreshold, triangleSize, triangulateVariation, truchetSize, truchetThickness,
    truchetVariation, twistAmount, vhsGlitchIntensity, vignetteSoftness, vignetteStrength, voronoiCellCount,
    voronoiDistortion, waveAmplitude, waveDistortionRotation, waveDistortionStrength, waveFrequency, waveNumber,
    waveRotation, waveScale, zoom, zoomBeatEnabled,
  } = params;

  // Dev-only: every setXxx destructured above must be a real function. A
  // setter missing from the caller-side useSnapshot({...}) call destructures
  // to undefined here and fails silently mid-applySnapshot (this is exactly
  // how the Glitch/Julia/Stir wiring-omission bugs slipped through). Checking
  // the actual local bindings (not params) is what catches an omitted key,
  // since a missing key never lands in `params` at all.
  if (import.meta.env.DEV) {
    const setters: Record<string, unknown> = {
      setActiveEffects, setAngleCenterX, setAngleCenterY, setAngleStartOffset, setAsciiChars, setAsciiColor, setAsciiSize, setAttractorDotSize, setAttractorPointCount, setAttractorScale, setAttractorSpeed, setAttractorTrailFade, setParticlesCount, setParticlesSpeed, setParticlesSize, setParticlesTrail, setParticlesGravity, setTilingSize, setTilingSymmetry, setTilingComplexity, setTilingRotation, setAudioBindings, setAuroraBandCount, setAuroraBandHeight, setAuroraWaveSpeed, setAutoGainEnabled, setDepthLayerEnabled, setDepthLayerStrength, setBaseAIColors, setBassBeatSync, setBassMax, setBassMin, setBassMultiplier, setBassSmoothing, setBassThreshold, setBloomIntensity, setBloomRadius, setBlurGaussianAmount, setBlurMotionAmount, setBlurMotionDirection, setBlurRadialAmount, setBlurType, setCausticsBrightness, setCausticsScale, setChromaticAngle, setChromaticOffset, setChromaticTrailsDecay, setChromaticTrailsOffset, setColorShiftHue, setConcentricRingCount, setConcentricRingWidth, setContrastBeatEnabled, setDigitalNoiseIntensity, setDitherLevels, setDitherType, setDuotoneColor1, setDuotoneColor2, setDuotoneColor3, setDuotoneIntensity, setDuotoneThreeColor, setDustCrackleColor, setDustCrackleIntensity, setDustCrackleLength, setEmojiChars, setEmojiOffsetX, setEmojiRotateSpeed, setEmojiSize, setEmojiSizeVariation, setFadeDirection, setFeedbackDecay, setFeedbackRotation, setFeedbackZoom, setFieldContrast, setFisheyeCenterX, setFisheyeCenterY, setFisheyeStrength, setFlowParticleCount, setFlowScale, setFlowSpeed, setFlowThickness, setFlowerCircles, setFlowerRotation, setFlowerScale, setFlowerSpread, setFlowerSymmetry, setFlowerOpacity, setGlitchBlockSize, setGlitchChromaSplit, setGlitchIntensity, setGradientAngle, setGradientColors, setGradientType, setGrainIntensity, setGrainType, setGridCellAngleStep, setGridColumns, setGridRotation, setGridRows, setGridShapeSize, setGridSides, setGridVariation, setHalftoneCMYK, setHalftoneMove, setHalftoneMoveSpeed, setHalftoneSize, setHalftoneVariation, setHelixTightness, setHelixTurns, setHexGridSize, setInvertAmount, setIridescentAngle, setIridescentIntensity, setIridescentScale, setIsAudioEnabled, setIsAudioReactive, setJuliaImaginary, setJuliaIterations, setJuliaReal, setJuliaZoom, setKaleidoscopeRotateSpeed, setKaleidoscopeSegments, setLavaBlobCount, setLavaBlobSize, setLavaSpeed, setLightLeakIntensity, setLinesAngle, setLinesCount, setLinesThickness, setLiquidScale, setLiquidStrength, setLiquifyStrength, setDisplaceStrength, setDisplaceScale, setCrtIntensity, setMarbleOctaves, setMarbleTurbulence, setMarbleVeinFreq, setMasterSensitivity, setMetaballCount, setMetaballSize, setMetaballSpeed, setMidsBeatSync, setMidsMax, setMidsMin, setMidsMultiplier, setMidsSmoothing, setMidsThreshold, setMirrorMode, setMirrorTileCount, setMoireOffset, setMoireScale, setMoireSpeed, setNoiseDirection, setNoiseOctaves, setNoiseScale, setNoiseType, setNoiseWarp, setPaletteBands, setPaletteBeatEnabled, setPaletteMode, setPhotoBlendMode, setPhotoOpacity, setPinchStrength, setPixelSize, setPlasmaComplexity, setPlasmaSpeed, setPlasmaZoomScale, setPolygon2Sides, setPosterizeLevels, setRadarBeamWidth, setRadarFadeLength, setRadarSweepAngle, setRadialBurstCount, setRadialBurstMode, setRadialBurstSize, setRadialBurstSpread, setRadialSizeScale, setReactionDiffusionFeed, setReactionDiffusionKill, setReactionDiffusionSpeed, setResolutionMultiplier, setRippleAmplitude, setRippleFrequency, setScanLineSize, setScanlineIntensity, setScanlineSpacing, setScanlineSpeed, setSepiaIntensity, setShakeBeatEnabled, setShapesCount, setShapesSides, setSlitScanDirection, setSlitScanIntensity, setSolarizeThreshold, setStructuralSeed, setSubBassBeatSync, setSubBassMultiplier, setSubmittedAIPrompt, setTargetAngle, setTargetColors, setTargetZoom, setTopographicBands, setTopographicLineWidth, setTopographicScale, setTrebleBeatSync, setTrebleMax, setTrebleMin, setTrebleMultiplier, setTrebleSmoothing, setTrebleThreshold, setTriangleSize, setTriangulateVariation, setTruchetSize, setTruchetThickness, setTruchetVariation, setTwistAmount, setVhsGlitchIntensity, setVignetteSoftness, setVignetteStrength, setVoronoiCellCount, setVoronoiDistortion, setWaveAmplitude, setWaveDistortionRotation, setWaveDistortionStrength, setWaveFrequency, setWaveNumber, setWaveRotation, setWaveScale, setWindmillRotations, setWindmillThickness, setWindmillTightness, setWindmillZoom, setWindmillZoomResponse, setWindmillMode, setZoom, setZoomBeatEnabled,
    };
    for (const name in setters) {
      if (typeof setters[name] !== 'function') {
        console.error(`useSnapshot: "${name}" is not a function (got ${typeof setters[name]}) — it's likely missing from the useSnapshot({...}) call in InteractiveGradient.tsx.`);
      }
    }
  }

  const buildSnapshot = useCallback(() => {
    return {
      gradientColors: [...gradientColors],
      targetColors: [...targetColors],
      gradientType,
      gradientAngle,
      targetAngle,
      zoom,
      targetZoom,
      activeEffects: [...activeEffects],
      kaleidoscopeSegments,
      twistAmount,
      pixelSize,
      triangleSize,
      triangulateVariation,
      chromaticOffset,
      fisheyeStrength,
      grainIntensity,
      blurMotionAmount,
      blurMotionDirection,
      blurGaussianAmount,
      blurRadialAmount,
      blurType,
      posterizeLevels,
      halftoneSize,
      halftoneVariation,
      halftoneMove,
      halftoneMoveSpeed,
      vignetteStrength,
      scanlineIntensity,
      scanlineSpacing,
      scanlineSpeed,
      colorShiftHue,
      digitalNoiseIntensity,
      duotoneIntensity,
      duotoneColor1,
      duotoneColor2,
      dustCrackleColor,
      dustCrackleIntensity,
      dustCrackleLength,
      hexGridSize,
      lightLeakIntensity,
      linesCount,
      linesAngle,
      linesThickness,
      liquifyStrength,
      pinchStrength,
      scanLineSize,
      sepiaIntensity,
      solarizeThreshold,
      gridSides,
      gridRows,
      gridColumns,
      duotoneColor3,
      duotoneThreeColor,
      vhsGlitchIntensity,
      polygon2Sides,
      waveDistortionStrength,
      windmillTightness,
      windmillRotations,
      windmillThickness,
      windmillZoom,
      windmillZoomResponse,
      windmillMode,
      shapesSides,
      shapesCount,
      concentricRingWidth,
      concentricRingCount,
      waveAmplitude,
      waveFrequency,
      waveNumber,
      waveRotation,
      noiseScale,
      noiseOctaves,
      noiseDirection,
      plasmaSpeed,
      plasmaComplexity,
      radialBurstCount,
      radialBurstMode,
      radialBurstSpread,
      radialBurstSize,
      helixTurns,
      helixTightness,
            gridRotation,
      gridCellAngleStep,
      angleStartOffset,
      angleCenterX,
      angleCenterY,
      iridescentAngle,
      iridescentIntensity,
      iridescentScale,
      resolutionMultiplier,
      baseAIColors: baseAIColors ? [...baseAIColors] : null,
      submittedAIPrompt,
      // Fields below were added after this snapshot was first written and
      // had never been folded in — undo/redo and presets silently dropped
      // every gradient/effect added since, snapping back to defaults on
      // restore instead of the values that were actually live when saved.
      asciiChars, asciiColor, asciiSize,
      emojiChars, emojiSize, emojiRotateSpeed, emojiOffsetX, emojiSizeVariation,
      photoBlendMode, photoOpacity,
      auroraBandCount, auroraBandHeight, auroraWaveSpeed,
      bloomIntensity, bloomRadius,
      causticsBrightness, causticsScale,
      chromaticAngle, chromaticTrailsDecay, chromaticTrailsOffset,
      ditherLevels, ditherType,
      glitchIntensity, glitchBlockSize, glitchChromaSplit,
      fieldContrast, paletteMode, paletteBands, invertAmount, structuralSeed, audioBindings,
      voronoiAnimTime, flowerAnimTime, auroraAnimTime, causticsAnimTime, lavaAnimTime, marbleAnimTime,
      metaballAnimTime, moireAnimTime, flowAnimTime, liquidAnimTime, emojiAnimTime, attractorAnimTime, tilingAnimTime,
      fadeDirection,
      feedbackDecay, feedbackRotation, feedbackZoom,
      fisheyeCenterX, fisheyeCenterY,
      flowParticleCount, flowScale, flowSpeed, flowThickness,
      attractorPointCount, attractorScale, attractorSpeed, attractorDotSize, attractorTrailFade,
      particlesCount, particlesSpeed, particlesSize, particlesTrail, particlesGravity,
      tilingSize, tilingSymmetry, tilingComplexity, tilingRotation,
      reactionDiffusionFeed, reactionDiffusionKill, reactionDiffusionSpeed,
      topographicScale, topographicBands, topographicLineWidth,
      juliaReal, juliaImaginary, juliaZoom, juliaIterations,
      flowerCircles, flowerRotation, flowerScale, flowerSpread, flowerSymmetry, flowerOpacity,
      grainType,
      gridShapeSize, gridVariation,
      halftoneCMYK,
      isAudioEnabled, isAudioReactive,
      bassMultiplier, midsMultiplier, trebleMultiplier, subBassMultiplier,
      masterSensitivity, autoGainEnabled, depthLayerEnabled, depthLayerStrength,
      bassBeatSync, midsBeatSync, trebleBeatSync, subBassBeatSync,
      bassSmoothing, midsSmoothing, trebleSmoothing,
      bassThreshold, midsThreshold, trebleThreshold,
      bassMin, bassMax, midsMin, midsMax, trebleMin, trebleMax,
      zoomBeatEnabled, shakeBeatEnabled, contrastBeatEnabled, paletteBeatEnabled,
      kaleidoscopeRotateSpeed,
      lavaBlobCount, lavaBlobSize, lavaSpeed,
      liquidScale, liquidStrength, displaceStrength, displaceScale, crtIntensity,
      marbleOctaves, marbleTurbulence, marbleVeinFreq,
      metaballCount, metaballSize, metaballSpeed,
      mirrorMode, mirrorTileCount,
      moireOffset, moireScale, moireSpeed,
      noiseType, noiseWarp,
      plasmaZoomScale,
      radarBeamWidth, radarFadeLength, radarSweepAngle,
      radialSizeScale,
      rippleAmplitude, rippleFrequency,
      slitScanDirection, slitScanIntensity,
      truchetSize, truchetThickness, truchetVariation,
      vignetteSoftness,
      voronoiCellCount, voronoiDistortion,
      waveDistortionRotation, waveScale,
    };
  }, [resolutionMultiplier, gradientColors, targetColors, gradientType, gradientAngle, targetAngle, zoom, targetZoom,
      activeEffects, kaleidoscopeSegments, twistAmount, pixelSize, triangleSize, triangulateVariation,
      chromaticOffset, fisheyeStrength, grainIntensity, blurMotionAmount,
      blurMotionDirection, blurGaussianAmount, blurRadialAmount, blurType, posterizeLevels, halftoneSize, halftoneVariation, halftoneMove, halftoneMoveSpeed,
      vignetteStrength, colorShiftHue, digitalNoiseIntensity, duotoneIntensity, duotoneColor1, duotoneColor2,
      dustCrackleColor, dustCrackleIntensity, dustCrackleLength, hexGridSize, lightLeakIntensity, linesCount, linesAngle,
      linesThickness, liquifyStrength, pinchStrength,
      scanLineSize, sepiaIntensity, solarizeThreshold, gridSides, gridRows, gridColumns,
      duotoneColor3, duotoneThreeColor, vhsGlitchIntensity,
      polygon2Sides, waveDistortionStrength,
      windmillTightness, windmillRotations, windmillThickness, windmillZoom, windmillZoomResponse, windmillMode, shapesSides, shapesCount, concentricRingWidth, concentricRingCount,
      waveAmplitude, waveFrequency, waveNumber, waveRotation, noiseScale, noiseOctaves, noiseDirection, plasmaSpeed,
      plasmaComplexity, radialBurstCount, radialBurstMode, radialBurstSpread, radialBurstSize,
      helixTurns, helixTightness, gridRotation, gridCellAngleStep,
      angleStartOffset, angleCenterX, angleCenterY,
      iridescentAngle, iridescentIntensity, iridescentScale,
      baseAIColors, submittedAIPrompt,
      asciiChars, asciiColor, asciiSize,
      emojiChars, emojiSize, emojiRotateSpeed, emojiOffsetX, emojiSizeVariation,
      photoBlendMode, photoOpacity,
      auroraBandCount, auroraBandHeight, auroraWaveSpeed,
      bloomIntensity, bloomRadius,
      causticsBrightness, causticsScale,
      chromaticAngle, chromaticTrailsDecay, chromaticTrailsOffset,
      ditherLevels, ditherType,
      glitchIntensity, glitchBlockSize, glitchChromaSplit,
      fieldContrast, paletteMode, paletteBands, invertAmount, structuralSeed, audioBindings,
      voronoiAnimTime, flowerAnimTime, auroraAnimTime, causticsAnimTime, lavaAnimTime, marbleAnimTime,
      metaballAnimTime, moireAnimTime, flowAnimTime, liquidAnimTime, emojiAnimTime, attractorAnimTime, tilingAnimTime,
      fadeDirection,
      feedbackDecay, feedbackRotation, feedbackZoom,
      fisheyeCenterX, fisheyeCenterY,
      flowParticleCount, flowScale, flowSpeed, flowThickness,
      attractorPointCount, attractorScale, attractorSpeed, attractorDotSize, attractorTrailFade,
      particlesCount, particlesSpeed, particlesSize, particlesTrail, particlesGravity,
      tilingSize, tilingSymmetry, tilingComplexity, tilingRotation,
      reactionDiffusionFeed, reactionDiffusionKill, reactionDiffusionSpeed,
      topographicScale, topographicBands, topographicLineWidth,
      juliaReal, juliaImaginary, juliaZoom, juliaIterations,
      flowerCircles, flowerRotation, flowerScale, flowerSpread, flowerSymmetry, flowerOpacity,
      grainType,
      gridShapeSize, gridVariation,
      halftoneCMYK,
      isAudioEnabled, isAudioReactive,
      bassMultiplier, midsMultiplier, trebleMultiplier, subBassMultiplier,
      masterSensitivity, autoGainEnabled, depthLayerEnabled, depthLayerStrength,
      bassBeatSync, midsBeatSync, trebleBeatSync, subBassBeatSync,
      bassSmoothing, midsSmoothing, trebleSmoothing,
      bassThreshold, midsThreshold, trebleThreshold,
      bassMin, bassMax, midsMin, midsMax, trebleMin, trebleMax,
      zoomBeatEnabled, shakeBeatEnabled, contrastBeatEnabled, paletteBeatEnabled,
      kaleidoscopeRotateSpeed,
      lavaBlobCount, lavaBlobSize, lavaSpeed,
      liquidScale, liquidStrength, displaceStrength, displaceScale, crtIntensity,
      marbleOctaves, marbleTurbulence, marbleVeinFreq,
      metaballCount, metaballSize, metaballSpeed,
      mirrorMode, mirrorTileCount,
      moireOffset, moireScale, moireSpeed,
      noiseType, noiseWarp,
      plasmaZoomScale,
      radarBeamWidth, radarFadeLength, radarSweepAngle,
      radialSizeScale,
      rippleAmplitude, rippleFrequency,
      slitScanDirection, slitScanIntensity,
      truchetSize, truchetThickness, truchetVariation,
      vignetteSoftness,
      voronoiCellCount, voronoiDistortion,
      waveDistortionRotation, waveScale]);

  const applySnapshot = useCallback((snapshot: any) => {
    const colors = snapshot.gradientColors || DEFAULT_COLORS;
    const targets = snapshot.targetColors || colors;
    setGradientColors(colors);
    setTargetColors(targets);
    // gradientType and activeEffects gate whether the draw loop renders
    // anything at all — a preset saved by older code (missing a field that
    // didn't exist yet) or a partially-written one (e.g. a localStorage
    // quota failure mid-save) would otherwise set these to undefined,
    // which the huge switch-case draw logic has no guard for: the canvas
    // goes solid black, and since the bad state is already applied by the
    // time anything throws, the ErrorBoundary's remount just reapplies the
    // same broken preset and crash-loops instead of recovering.
    setGradientType(snapshot.gradientType ?? 'angle');
    setGradientAngle(snapshot.gradientAngle ?? 45);
    setTargetAngle(snapshot.targetAngle ?? snapshot.gradientAngle ?? 45);
    setZoom(snapshot.zoom ?? 1);
    setTargetZoom(snapshot.targetZoom ?? snapshot.zoom ?? 1);
    setActiveEffects(snapshot.activeEffects ?? []);
    setKaleidoscopeSegments(snapshot.kaleidoscopeSegments ?? 10);
    setTwistAmount(snapshot.twistAmount ?? 2);
    setPixelSize(snapshot.pixelSize ?? 20);
    setTriangleSize(snapshot.triangleSize ?? 40);
    setTriangulateVariation(snapshot.triangulateVariation ?? 0);
    setChromaticOffset(snapshot.chromaticOffset ?? 100);
    setFisheyeStrength(snapshot.fisheyeStrength ?? 0.5);
    setGrainIntensity(snapshot.grainIntensity ?? 0.1);
    setBlurMotionAmount(snapshot.blurMotionAmount ?? 40);
    setBlurMotionDirection(snapshot.blurMotionDirection ?? 250);
    setBlurGaussianAmount(snapshot.blurGaussianAmount ?? 7);
    setBlurRadialAmount(snapshot.blurRadialAmount ?? 5);
    setBlurType(snapshot.blurType ?? 'gaussian');
    setPosterizeLevels(snapshot.posterizeLevels ?? 10);
    setHalftoneSize(snapshot.halftoneSize ?? 10);
    setHalftoneVariation(snapshot.halftoneVariation ?? 0);
    setHalftoneMove(snapshot.halftoneMove ?? false);
    setHalftoneMoveSpeed(snapshot.halftoneMoveSpeed ?? 1);
    setVignetteStrength(snapshot.vignetteStrength ?? 0.5);
    setScanlineIntensity(snapshot.scanlineIntensity ?? 0.4);
    setScanlineSpacing(snapshot.scanlineSpacing ?? 4);
    setScanlineSpeed(snapshot.scanlineSpeed ?? 1);
    setColorShiftHue(snapshot.colorShiftHue ?? 5);
    setDigitalNoiseIntensity(snapshot.digitalNoiseIntensity ?? 0.3);
    setDuotoneIntensity(snapshot.duotoneIntensity ?? 1);
    setDuotoneColor1(snapshot.duotoneColor1 ?? '#000033');
    setDuotoneColor2(snapshot.duotoneColor2 ?? '#FF6B35');
    setDustCrackleIntensity(snapshot.dustCrackleIntensity ?? 0.3);
    setDustCrackleLength(snapshot.dustCrackleLength ?? 1);
    setDustCrackleColor(snapshot.dustCrackleColor ?? '#000000');
    setHexGridSize(snapshot.hexGridSize ?? 20);
    setLightLeakIntensity(snapshot.lightLeakIntensity ?? 0.5);
    setLinesCount(snapshot.linesCount ?? 50);
    setLinesAngle(snapshot.linesAngle ?? 0);
    setLinesThickness(snapshot.linesThickness ?? 1);
    setLiquifyStrength(snapshot.liquifyStrength ?? 30);
    setPinchStrength(snapshot.pinchStrength ?? 0.5);
    setScanLineSize(snapshot.scanLineSize ?? 4);
    setSepiaIntensity(snapshot.sepiaIntensity ?? 1);
    setSolarizeThreshold(snapshot.solarizeThreshold ?? 128);
    setGridSides(snapshot.gridSides ?? 4);
    setDuotoneColor3(snapshot.duotoneColor3 || '#F7F7FF');
    setDuotoneThreeColor(snapshot.duotoneThreeColor || false);
    setVhsGlitchIntensity(snapshot.vhsGlitchIntensity ?? 0.2);
    setGridRows(snapshot.gridRows ?? 6);
    setGridColumns(snapshot.gridColumns ?? 3);
    setPolygon2Sides(snapshot.polygon2Sides ?? 5);
    setWaveDistortionStrength(snapshot.waveDistortionStrength ?? 100);
    setWindmillTightness(snapshot.windmillTightness ?? 11);
    setWindmillRotations(snapshot.windmillRotations ?? 3);
    setWindmillThickness(snapshot.windmillThickness ?? 49);
    setWindmillZoom(snapshot.windmillZoom ?? 3.5);
    setWindmillZoomResponse(snapshot.windmillZoomResponse ?? 0.3);
    setWindmillMode(snapshot.windmillMode ?? 'blades');
    setShapesSides(snapshot.shapesSides ?? 4);
    setShapesCount(snapshot.shapesCount ?? 8);
    setConcentricRingWidth(snapshot.concentricRingWidth ?? 100);
    setConcentricRingCount(snapshot.concentricRingCount ?? 10);
    setWaveAmplitude(snapshot.waveAmplitude ?? 44);
    setWaveFrequency(snapshot.waveFrequency ?? 5);
    setWaveNumber(snapshot.waveNumber || 3);
    setWaveRotation(snapshot.waveRotation || 0);
    setNoiseScale(snapshot.noiseScale ?? 25);
    setNoiseOctaves(snapshot.noiseOctaves ?? 2);
    setNoiseDirection(snapshot.noiseDirection || 0);
    setPlasmaSpeed(snapshot.plasmaSpeed ?? 1);
    setPlasmaComplexity(snapshot.plasmaComplexity ?? 5);
    setRadialBurstCount(snapshot.radialBurstCount ?? 12);
    setRadialBurstSpread(snapshot.radialBurstSpread ?? 70);
    setRadialBurstSize(snapshot.radialBurstSize ?? 70);
    setRadialBurstMode(snapshot.radialBurstMode ?? 'burst');
    setHelixTurns(snapshot.helixTurns ?? 3);
    setHelixTightness(snapshot.helixTightness ?? 2);
    setGridRotation(snapshot.gridRotation ?? 0);
    setGridCellAngleStep(snapshot.gridCellAngleStep ?? 30);
    setAngleStartOffset(snapshot.angleStartOffset ?? 0);
    setAngleCenterX(snapshot.angleCenterX ?? 50);
    setAngleCenterY(snapshot.angleCenterY ?? 50);
    setIridescentAngle(snapshot.iridescentAngle ?? 45);
    setIridescentIntensity(snapshot.iridescentIntensity ?? 0.8);
    setIridescentScale(snapshot.iridescentScale ?? 2);
    setResolutionMultiplier(snapshot.resolutionMultiplier || 1);
    setBaseAIColors(snapshot.baseAIColors);
    setSubmittedAIPrompt(snapshot.submittedAIPrompt);
    // Fields below were added after this function was first written (see
    // matching note in buildSnapshot) — restored with the same defaults
    // their own useState declarations use, for snapshots saved before they existed.
    setAsciiChars(snapshot.asciiChars ?? ' .:-=+*x#%@');
    setAsciiColor(snapshot.asciiColor ?? false);
    setAsciiSize(snapshot.asciiSize ?? 14);
    setEmojiChars(snapshot.emojiChars ?? '😴🙂😃🤩🔥');
    setEmojiSize(snapshot.emojiSize ?? 28);
    setEmojiRotateSpeed(snapshot.emojiRotateSpeed ?? 41);
    setEmojiOffsetX(snapshot.emojiOffsetX ?? 0);
    setEmojiSizeVariation(snapshot.emojiSizeVariation ?? 0);
    // The uploaded image itself is session-only (not persisted — see the
    // photoImageRef declaration for why), so a reloaded preset restores the
    // blend mode/opacity but the user needs to re-upload the actual photo.
    setPhotoBlendMode(snapshot.photoBlendMode ?? 'overlay');
    setPhotoOpacity(snapshot.photoOpacity ?? 80);
    setAuroraBandCount(snapshot.auroraBandCount ?? 6);
    setAuroraBandHeight(snapshot.auroraBandHeight ?? 1);
    setAuroraWaveSpeed(snapshot.auroraWaveSpeed ?? 0.2);
    setBloomIntensity(snapshot.bloomIntensity ?? 0.7);
    setBloomRadius(snapshot.bloomRadius ?? 12);
    setCausticsBrightness(snapshot.causticsBrightness ?? 1.5);
    setCausticsScale(snapshot.causticsScale ?? 5);
    setChromaticAngle(snapshot.chromaticAngle ?? 0);
    setChromaticTrailsDecay(snapshot.chromaticTrailsDecay ?? 0.85);
    setChromaticTrailsOffset(snapshot.chromaticTrailsOffset ?? 8);
    setDitherLevels(snapshot.ditherLevels ?? 2);
    setDitherType(snapshot.ditherType ?? 'bayer');
    setGlitchIntensity(snapshot.glitchIntensity ?? 0.4);
    setGlitchBlockSize(snapshot.glitchBlockSize ?? 24);
    setGlitchChromaSplit(snapshot.glitchChromaSplit ?? 4);
    setFieldContrast(snapshot.fieldContrast ?? 1);
    setPaletteMode(snapshot.paletteMode ?? 'linear');
    setPaletteBands(snapshot.paletteBands ?? 5);
    setInvertAmount(snapshot.invertAmount ?? 1);
    setStructuralSeed(snapshot.structuralSeed ?? 0);
    setAudioBindings(snapshot.audioBindings ?? []);
    // Per-gradient animation clocks — previously not part of the snapshot at
    // all, so reloading a preset for any of these types rendered whatever
    // phase that clock's already-running counter happened to be at (it never
    // stops advancing while Auto Mode/VCR/mic is on) instead of the phase
    // that was actually on screen when the preset was saved. That's the
    // "doesn't look the same every time" bug for these gradient types.
    setVoronoiAnimTime(snapshot.voronoiAnimTime ?? 0);
    setFlowerAnimTime(snapshot.flowerAnimTime ?? 0);
    setAuroraAnimTime(snapshot.auroraAnimTime ?? 0);
    setCausticsAnimTime(snapshot.causticsAnimTime ?? 0);
    setLavaAnimTime(snapshot.lavaAnimTime ?? 0);
    setMarbleAnimTime(snapshot.marbleAnimTime ?? 0);
    setMetaballAnimTime(snapshot.metaballAnimTime ?? 0);
    setMoireAnimTime(snapshot.moireAnimTime ?? 0);
    setFlowAnimTime(snapshot.flowAnimTime ?? 0);
    setLiquidAnimTime(snapshot.liquidAnimTime ?? 0);
    setEmojiAnimTime(snapshot.emojiAnimTime ?? 0);
    setAttractorAnimTime(snapshot.attractorAnimTime ?? 0);
    setTilingAnimTime(snapshot.tilingAnimTime ?? 0);
    setFadeDirection(snapshot.fadeDirection ?? 0);
    setFeedbackDecay(snapshot.feedbackDecay ?? 0.85);
    setFeedbackRotation(snapshot.feedbackRotation ?? 0);
    setFeedbackZoom(snapshot.feedbackZoom ?? 1.0);
    setFisheyeCenterX(snapshot.fisheyeCenterX ?? 50);
    setFisheyeCenterY(snapshot.fisheyeCenterY ?? 50);
    setFlowParticleCount(snapshot.flowParticleCount ?? 250);
    setFlowScale(snapshot.flowScale ?? 3);
    setFlowSpeed(snapshot.flowSpeed ?? 1);
    setFlowThickness(snapshot.flowThickness ?? 1.5);
    setAttractorPointCount(snapshot.attractorPointCount ?? 6);
    setAttractorScale(snapshot.attractorScale ?? 1);
    setAttractorSpeed(snapshot.attractorSpeed ?? 1);
    setAttractorDotSize(snapshot.attractorDotSize ?? 1);
    setAttractorTrailFade(snapshot.attractorTrailFade ?? 0.04);
    setParticlesCount(snapshot.particlesCount ?? 120);
    setParticlesSpeed(snapshot.particlesSpeed ?? 1);
    setParticlesSize(snapshot.particlesSize ?? 3);
    setParticlesTrail(snapshot.particlesTrail ?? 0.08);
    setParticlesGravity(snapshot.particlesGravity ?? 0);
    setTilingSize(snapshot.tilingSize ?? 120);
    setTilingSymmetry(snapshot.tilingSymmetry ?? 6);
    setTilingComplexity(snapshot.tilingComplexity ?? 3);
    setTilingRotation(snapshot.tilingRotation ?? 0);
    setReactionDiffusionFeed(snapshot.reactionDiffusionFeed ?? 0.037);
    setReactionDiffusionKill(snapshot.reactionDiffusionKill ?? 0.06);
    setReactionDiffusionSpeed(snapshot.reactionDiffusionSpeed ?? 1);
    setTopographicScale(snapshot.topographicScale ?? 40);
    setTopographicBands(snapshot.topographicBands ?? 10);
    setTopographicLineWidth(snapshot.topographicLineWidth ?? 0.04);
    setJuliaReal(snapshot.juliaReal ?? -0.7);
    setJuliaImaginary(snapshot.juliaImaginary ?? 0.27);
    setJuliaZoom(snapshot.juliaZoom ?? 1);
    setJuliaIterations(snapshot.juliaIterations ?? 60);
    setFlowerCircles(snapshot.flowerCircles ?? 3);
    setFlowerRotation(snapshot.flowerRotation ?? 0);
    setFlowerSymmetry(snapshot.flowerSymmetry ?? 6);
    setFlowerOpacity(snapshot.flowerOpacity ?? 1);
    setFlowerScale(snapshot.flowerScale ?? 0.8);
    setFlowerSpread(snapshot.flowerSpread ?? 0.6);
    setGrainType(snapshot.grainType ?? 'medium');
    setGridShapeSize(snapshot.gridShapeSize ?? 25);
    setGridVariation(snapshot.gridVariation ?? 0);
    setHalftoneCMYK(snapshot.halftoneCMYK ?? false);
    setIsAudioEnabled(snapshot.isAudioEnabled ?? false);
    setIsAudioReactive(snapshot.isAudioReactive ?? false);
    // Audio reactivity tuning — previously only isAudioEnabled/isAudioReactive
    // were saved, so presets silently forgot every band multiplier, beat-sync
    // toggle, and FX-on-beat setting and reset them to defaults on load.
    setBassMultiplier(snapshot.bassMultiplier ?? 3.5);
    setMidsMultiplier(snapshot.midsMultiplier ?? 2.5);
    setTrebleMultiplier(snapshot.trebleMultiplier ?? 2);
    setSubBassMultiplier(snapshot.subBassMultiplier ?? 3.0);
    setMasterSensitivity(snapshot.masterSensitivity ?? 0.4);
    // Always on — no UI toggle for either anymore (AudioPanel.tsx), so a
    // saved snapshot/preset from before that removal can't silently turn
    // them back off.
    setAutoGainEnabled(true);
    setDepthLayerEnabled(true);
    setDepthLayerStrength(snapshot.depthLayerStrength ?? 2);
    setBassBeatSync(snapshot.bassBeatSync ?? true);
    setMidsBeatSync(snapshot.midsBeatSync ?? false);
    setTrebleBeatSync(snapshot.trebleBeatSync ?? false);
    setSubBassBeatSync(snapshot.subBassBeatSync ?? true);
    setBassSmoothing(snapshot.bassSmoothing ?? 0.2);
    setMidsSmoothing(snapshot.midsSmoothing ?? 0.2);
    setTrebleSmoothing(snapshot.trebleSmoothing ?? 0.2);
    setBassThreshold(snapshot.bassThreshold ?? 0);
    setMidsThreshold(snapshot.midsThreshold ?? 0);
    setTrebleThreshold(snapshot.trebleThreshold ?? 0);
    setBassMin(snapshot.bassMin ?? 0);
    setBassMax(snapshot.bassMax ?? 5);
    setMidsMin(snapshot.midsMin ?? 0);
    setMidsMax(snapshot.midsMax ?? 2);
    setTrebleMin(snapshot.trebleMin ?? 0);
    setTrebleMax(snapshot.trebleMax ?? 2);
    setZoomBeatEnabled(snapshot.zoomBeatEnabled ?? true);
    setShakeBeatEnabled(snapshot.shakeBeatEnabled ?? false);
    setContrastBeatEnabled(snapshot.contrastBeatEnabled ?? true);
    setPaletteBeatEnabled(snapshot.paletteBeatEnabled ?? false);
    setKaleidoscopeRotateSpeed(snapshot.kaleidoscopeRotateSpeed ?? 0.5);
    setLavaBlobCount(snapshot.lavaBlobCount ?? 10);
    setLavaBlobSize(snapshot.lavaBlobSize ?? 0.08);
    setLavaSpeed(snapshot.lavaSpeed ?? 1);
    setLiquidScale(snapshot.liquidScale ?? 3);
    setLiquidStrength(snapshot.liquidStrength ?? 30);
    setDisplaceStrength(snapshot.displaceStrength ?? 30);
    setDisplaceScale(snapshot.displaceScale ?? 3);
    setCrtIntensity(snapshot.crtIntensity ?? 0.6);
    setMarbleOctaves(snapshot.marbleOctaves ?? 5);
    setMarbleTurbulence(snapshot.marbleTurbulence ?? 1.5);
    setMarbleVeinFreq(snapshot.marbleVeinFreq ?? 2);
    setMetaballCount(snapshot.metaballCount ?? 6);
    setMetaballSize(snapshot.metaballSize ?? 0.16);
    setMetaballSpeed(snapshot.metaballSpeed ?? 1);
    setMirrorMode(snapshot.mirrorMode ?? 'horizontal');
    setMirrorTileCount(snapshot.mirrorTileCount ?? 2);
    setMoireOffset(snapshot.moireOffset ?? 30);
    setMoireScale(snapshot.moireScale ?? 10);
    setMoireSpeed(snapshot.moireSpeed ?? 1);
    setNoiseType(snapshot.noiseType ?? 'smooth');
    setNoiseWarp(snapshot.noiseWarp ?? 0);
    setPlasmaZoomScale(snapshot.plasmaZoomScale ?? 1);
    setRadarBeamWidth(snapshot.radarBeamWidth ?? 30);
    setRadarFadeLength(snapshot.radarFadeLength ?? 90);
    setRadarSweepAngle(snapshot.radarSweepAngle ?? 0);
    setRadialSizeScale(snapshot.radialSizeScale ?? 1.0);
    setRippleAmplitude(snapshot.rippleAmplitude ?? 20);
    setRippleFrequency(snapshot.rippleFrequency ?? 0.015);
    setSlitScanDirection(snapshot.slitScanDirection ?? 'radial');
    setSlitScanIntensity(snapshot.slitScanIntensity ?? 7);
    setTruchetSize(snapshot.truchetSize ?? 40);
    setTruchetThickness(snapshot.truchetThickness ?? 4);
    setTruchetVariation(snapshot.truchetVariation ?? 0.5);
    setVignetteSoftness(snapshot.vignetteSoftness ?? 50);
    setVoronoiCellCount(snapshot.voronoiCellCount ?? 19);
    setVoronoiDistortion(snapshot.voronoiDistortion ?? 100);
    setWaveDistortionRotation(snapshot.waveDistortionRotation ?? 200);
    setWaveScale(snapshot.waveScale ?? 1.0);
    // Live audio-reactivity levels (audioSubBassLevel etc.) are NOT part of
    // buildSnapshot's output — they're continuously-changing values synced
    // separately over the per-frame anim channel (see below), same as
    // gradientColors, rather than through this discrete-change snapshot.
  }, []);

  return { buildSnapshot, applySnapshot };
}
