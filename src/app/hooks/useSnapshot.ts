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
    asciiSize, auroraBandCount, auroraBandHeight, auroraWaveSpeed, autoGainEnabled, baseAIColors,
    bassBeatSync, bassMax, bassMin, bassMultiplier, bassSmoothing, bassThreshold,
    bloomIntensity, bloomRadius, blurGaussianAmount, blurMotionAmount, blurMotionDirection, blurRadialAmount,
    blurType, causticsBrightness, causticsScale, charcoalIntensity, chromaticAngle, chromaticOffset,
    chromaticTrailsDecay, chromaticTrailsOffset, colorPins, colorShiftHue, concentricRingCount, concentricRingWidth,
    helixTightness, helixTurns, contrastBeatEnabled, digitalNoiseIntensity, ditherLevels, ditherType,
    glitchIntensity, glitchBlockSize,
    duotoneColor1, duotoneColor2, duotoneColor3, duotoneIntensity, duotoneThreeColor, dustCrackleIntensity,
    emojiChars, emojiOffsetX, emojiRotateSpeed, emojiSize, emojiSizeVariation, fadeDirection,
    feedbackDecay, feedbackRotation, feedbackZoom, fisheyeCenterX, fisheyeCenterY, fisheyeStrength,
    flowParticleCount, flowScale, flowSpeed, flowThickness, attractorPointCount, attractorScale, attractorSpeed,
    reactionDiffusionFeed, reactionDiffusionKill, reactionDiffusionSpeed,
    topographicScale, topographicBands, topographicLineWidth, flowerCircles, flowerRotation,
    flowerScale, flowerSpread, gradientAngle, gradientColors, gradientType, grainIntensity,
    grainType, gridColumns, gridRotation, gridRows, gridShapeSize, gridSides,
    gridVariation, halftoneCMYK, halftoneMove, halftoneMoveSpeed, halftoneSize, halftoneVariation,
    hexGridSize, iridescentAngle, iridescentIntensity, iridescentScale, isAudioEnabled, isAudioReactive,
    kaleidoscopeRotateSpeed, kaleidoscopeSegments, lavaBlobCount, lavaBlobSize, lavaSpeed, lightLeakIntensity,
    linesAngle, linesCount, linesThickness, liquidScale, liquidStrength, liquifyStrength,
    marbleOctaves, marbleTurbulence, marbleVeinFreq, masterSensitivity, meshGridSize, meshJitter,
    metaballCount, metaballSize, metaballSpeed, midsBeatSync, midsMax, midsMin,
    midsMultiplier, midsSmoothing, midsThreshold, mirrorMode, mirrorTileCount, moireOffset,
    moireScale, moireSpeed, noiseDirection, noiseOctaves, noiseScale, noiseType,
    noiseWarp, paletteBeatEnabled, photoBlendMode, photoImageRef, photoOpacity, pinchStrength,
    pixelSize, plasmaComplexity, plasmaSpeed, plasmaZoomScale, polygon2Sides,
    posterizeLevels, radarBeamWidth, radarFadeLength, radarSweepAngle, radialBurstCount, radialBurstSize,
    radialBurstSpread, radialSizeScale, resolutionMultiplier, rippleAmplitude, rippleFrequency, scanLineSize,
    scanlineIntensity, scanlineSpacing, scanlineSpeed, sepiaIntensity, setActiveEffects, setAngleCenterX,
    setAngleCenterY, setAngleStartOffset, setAsciiChars, setAsciiColor, setAsciiSize, setAuroraBandCount,
    setAuroraBandHeight, setAuroraWaveSpeed, setAutoGainEnabled, setBaseAIColors, setBassBeatSync, setBassMax,
    setBassMin, setBassMultiplier, setBassSmoothing, setBassThreshold, setBloomIntensity, setBloomRadius,
    setBlurGaussianAmount, setBlurMotionAmount, setBlurMotionDirection, setBlurRadialAmount, setBlurType, setCausticsBrightness,
    setCausticsScale, setCharcoalIntensity, setChromaticAngle, setChromaticOffset, setChromaticTrailsDecay, setChromaticTrailsOffset,
    setColorPins, setColorShiftHue, setConcentricRingCount, setConcentricRingWidth, setHelixTightness, setHelixTurns,
    setContrastBeatEnabled, setDigitalNoiseIntensity, setDitherLevels, setDitherType, setGlitchIntensity, setGlitchBlockSize, setDuotoneColor1, setDuotoneColor2,
    setDuotoneColor3, setDuotoneIntensity, setDuotoneThreeColor, setDustCrackleIntensity, setEmojiChars, setEmojiOffsetX,
    setEmojiRotateSpeed, setEmojiSize, setEmojiSizeVariation, setFadeDirection, setFeedbackDecay, setFeedbackRotation,
    setFeedbackZoom, setFisheyeCenterX, setFisheyeCenterY, setFisheyeStrength, setFlowParticleCount, setFlowScale,
    setFlowSpeed, setFlowThickness, setAttractorPointCount, setAttractorScale, setAttractorSpeed,
    setReactionDiffusionFeed, setReactionDiffusionKill, setReactionDiffusionSpeed,
    setTopographicScale, setTopographicBands, setTopographicLineWidth,
    setFlowerCircles, setFlowerRotation, setFlowerScale, setFlowerSpread,
    setGradientAngle, setGradientColors, setGradientType, setGrainIntensity, setGrainType, setGridColumns,
    setGridRotation, setGridRows, setGridShapeSize, setGridSides, setGridVariation, setHalftoneCMYK,
    setHalftoneMove, setHalftoneMoveSpeed, setHalftoneSize, setHalftoneVariation, setHexGridSize, setIridescentAngle,
    setIridescentIntensity, setIridescentScale, setIsAudioEnabled, setIsAudioReactive, setKaleidoscopeRotateSpeed, setKaleidoscopeSegments,
    setLavaBlobCount, setLavaBlobSize, setLavaSpeed, setLightLeakIntensity, setLinesAngle, setLinesCount,
    setLinesThickness, setLiquidScale, setLiquidStrength, setLiquifyStrength, setMarbleOctaves, setMarbleTurbulence,
    setMarbleVeinFreq, setMasterSensitivity, setMeshGridSize, setMeshJitter, setMetaballCount, setMetaballSize,
    setMetaballSpeed, setMidsBeatSync, setMidsMax, setMidsMin, setMidsMultiplier, setMidsSmoothing,
    setMidsThreshold, setMirrorMode, setMirrorTileCount, setMoireOffset, setMoireScale, setMoireSpeed,
    setNoiseDirection, setNoiseOctaves, setNoiseScale, setNoiseType, setNoiseWarp, setPaletteBeatEnabled,
    setPhotoBlendMode, setPhotoOpacity, setPinchStrength, setPixelSize, setPlasmaComplexity, setPlasmaSpeed,
    setPlasmaZoomScale, setPolygon2Sides, setPosterizeLevels, setRadarBeamWidth, setRadarFadeLength,
    setRadarSweepAngle, setRadialBurstCount, setRadialBurstSpread, setRadialSizeScale, setResolutionMultiplier, setRippleAmplitude,
    setRippleFrequency, setScanLineSize, setScanlineIntensity, setScanlineSpacing, setScanlineSpeed, setSepiaIntensity,
    setShakeBeatEnabled, setShapesCount, setShapesSides, setSlitScanDirection, setSlitScanIntensity, setSolarizeThreshold,
    setWindmillRotations, setWindmillThickness, setWindmillTightness, setWindmillZoom, setSubBassBeatSync, setSubBassMultiplier,
    setSubmittedAIPrompt, setTargetAngle, setTargetColors, setTargetZoom, setTrebleBeatSync, setTrebleMax,
    setTrebleMin, setTrebleMultiplier, setTrebleSmoothing, setTrebleThreshold, setTriangleSize, setTruchetSize,
    setTruchetThickness, setTruchetVariation, setTwistAmount, setVhsGlitchIntensity, setVignetteSoftness, setVignetteStrength,
    setVoronoiCellCount, setVoronoiDistortion, setWaveAmplitude, setWaveDistortionRotation, setWaveDistortionStrength, setWaveFrequency,
    setWaveNumber, setWaveRotation, setWaveScale, setZoom, setZoomBeatEnabled, shakeBeatEnabled,
    shapesCount, shapesSides, slitScanDirection, slitScanIntensity, solarizeThreshold, windmillRotations,
    windmillThickness, windmillTightness, windmillZoom, subBassBeatSync, subBassMultiplier, submittedAIPrompt,
    targetAngle, targetColors, targetZoom, trebleBeatSync, trebleMax, trebleMin,
    trebleMultiplier, trebleSmoothing, trebleThreshold, triangleSize, truchetSize, truchetThickness,
    truchetVariation, twistAmount, vhsGlitchIntensity, vignetteSoftness, vignetteStrength, voronoiCellCount,
    voronoiDistortion, waveAmplitude, waveDistortionRotation, waveDistortionStrength, waveFrequency, waveNumber,
    waveRotation, waveScale, zoom, zoomBeatEnabled,
  } = params;

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
      colorPins: colorPins.map(pin => ({...pin})),
      kaleidoscopeSegments,
      twistAmount,
      pixelSize,
      triangleSize,
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
      charcoalIntensity,
      digitalNoiseIntensity,
      duotoneIntensity,
      duotoneColor1,
      duotoneColor2,
      dustCrackleIntensity,
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
      shapesSides,
      shapesCount,
      concentricRingWidth,
      concentricRingCount,
      waveAmplitude,
      waveFrequency,
      waveNumber,
      waveRotation,
      meshGridSize,
      noiseScale,
      noiseOctaves,
      noiseDirection,
      plasmaSpeed,
      plasmaComplexity,
      radialBurstCount,
      radialBurstSpread,
      radialBurstSize,
      helixTurns,
      helixTightness,
            gridRotation,
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
      glitchIntensity, glitchBlockSize,
      fadeDirection,
      feedbackDecay, feedbackRotation, feedbackZoom,
      fisheyeCenterX, fisheyeCenterY,
      flowParticleCount, flowScale, flowSpeed, flowThickness,
      attractorPointCount, attractorScale, attractorSpeed,
      reactionDiffusionFeed, reactionDiffusionKill, reactionDiffusionSpeed,
      topographicScale, topographicBands, topographicLineWidth,
      flowerCircles, flowerRotation, flowerScale, flowerSpread,
      grainType,
      gridShapeSize, gridVariation,
      halftoneCMYK,
      isAudioEnabled, isAudioReactive,
      bassMultiplier, midsMultiplier, trebleMultiplier, subBassMultiplier,
      masterSensitivity, autoGainEnabled,
      bassBeatSync, midsBeatSync, trebleBeatSync, subBassBeatSync,
      bassSmoothing, midsSmoothing, trebleSmoothing,
      bassThreshold, midsThreshold, trebleThreshold,
      bassMin, bassMax, midsMin, midsMax, trebleMin, trebleMax,
      zoomBeatEnabled, shakeBeatEnabled, contrastBeatEnabled, paletteBeatEnabled,
      kaleidoscopeRotateSpeed,
      lavaBlobCount, lavaBlobSize, lavaSpeed,
      liquidScale, liquidStrength,
      marbleOctaves, marbleTurbulence, marbleVeinFreq,
      meshJitter,
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
      activeEffects, colorPins, kaleidoscopeSegments, twistAmount, pixelSize, triangleSize,
      chromaticOffset, fisheyeStrength, grainIntensity, blurMotionAmount,
      blurMotionDirection, blurGaussianAmount, blurRadialAmount, blurType, posterizeLevels, halftoneSize, halftoneVariation, halftoneMove, halftoneMoveSpeed,
      vignetteStrength, colorShiftHue, charcoalIntensity, digitalNoiseIntensity, duotoneIntensity, duotoneColor1, duotoneColor2,
      dustCrackleIntensity, hexGridSize, lightLeakIntensity, linesCount, linesAngle,
      linesThickness, liquifyStrength, pinchStrength,
      scanLineSize, sepiaIntensity, solarizeThreshold, gridSides, gridRows, gridColumns,
      duotoneColor3, duotoneThreeColor, vhsGlitchIntensity,
      polygon2Sides, waveDistortionStrength,
      windmillTightness, windmillRotations, windmillThickness, windmillZoom, shapesSides, shapesCount, concentricRingWidth, concentricRingCount,
      waveAmplitude, waveFrequency, waveNumber, waveRotation, meshGridSize, noiseScale, noiseOctaves, noiseDirection, plasmaSpeed,
      plasmaComplexity, radialBurstCount, radialBurstSpread,
      helixTurns, helixTightness, gridRotation,
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
      glitchIntensity, glitchBlockSize,
      fadeDirection,
      feedbackDecay, feedbackRotation, feedbackZoom,
      fisheyeCenterX, fisheyeCenterY,
      flowParticleCount, flowScale, flowSpeed, flowThickness,
      attractorPointCount, attractorScale, attractorSpeed,
      reactionDiffusionFeed, reactionDiffusionKill, reactionDiffusionSpeed,
      topographicScale, topographicBands, topographicLineWidth,
      flowerCircles, flowerRotation, flowerScale, flowerSpread,
      grainType,
      gridShapeSize, gridVariation,
      halftoneCMYK,
      isAudioEnabled, isAudioReactive,
      bassMultiplier, midsMultiplier, trebleMultiplier, subBassMultiplier,
      masterSensitivity, autoGainEnabled,
      bassBeatSync, midsBeatSync, trebleBeatSync, subBassBeatSync,
      bassSmoothing, midsSmoothing, trebleSmoothing,
      bassThreshold, midsThreshold, trebleThreshold,
      bassMin, bassMax, midsMin, midsMax, trebleMin, trebleMax,
      zoomBeatEnabled, shakeBeatEnabled, contrastBeatEnabled, paletteBeatEnabled,
      kaleidoscopeRotateSpeed,
      lavaBlobCount, lavaBlobSize, lavaSpeed,
      liquidScale, liquidStrength,
      marbleOctaves, marbleTurbulence, marbleVeinFreq,
      meshJitter,
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
    setColorPins(snapshot.colorPins ?? []);
    setKaleidoscopeSegments(snapshot.kaleidoscopeSegments);
    setTwistAmount(snapshot.twistAmount);
    setPixelSize(snapshot.pixelSize);
    setTriangleSize(snapshot.triangleSize);
    setChromaticOffset(snapshot.chromaticOffset);
    setFisheyeStrength(snapshot.fisheyeStrength);
    setGrainIntensity(snapshot.grainIntensity);
    setBlurMotionAmount(snapshot.blurMotionAmount);
    setBlurMotionDirection(snapshot.blurMotionDirection);
    setBlurGaussianAmount(snapshot.blurGaussianAmount);
    setBlurRadialAmount(snapshot.blurRadialAmount);
    setBlurType(snapshot.blurType);
    setPosterizeLevels(snapshot.posterizeLevels);
    setHalftoneSize(snapshot.halftoneSize);
    setHalftoneVariation(snapshot.halftoneVariation);
    setHalftoneMove(snapshot.halftoneMove);
    setHalftoneMoveSpeed(snapshot.halftoneMoveSpeed);
    setVignetteStrength(snapshot.vignetteStrength);
    setScanlineIntensity(snapshot.scanlineIntensity ?? 0.4);
    setScanlineSpacing(snapshot.scanlineSpacing ?? 4);
    setScanlineSpeed(snapshot.scanlineSpeed ?? 1);
    setColorShiftHue(snapshot.colorShiftHue);
    setCharcoalIntensity(snapshot.charcoalIntensity);
    setDigitalNoiseIntensity(snapshot.digitalNoiseIntensity);
    setDuotoneIntensity(snapshot.duotoneIntensity);
    setDuotoneColor1(snapshot.duotoneColor1);
    setDuotoneColor2(snapshot.duotoneColor2);
    setDustCrackleIntensity(snapshot.dustCrackleIntensity);
    setHexGridSize(snapshot.hexGridSize);
    setLightLeakIntensity(snapshot.lightLeakIntensity);
    setLinesCount(snapshot.linesCount);
    setLinesAngle(snapshot.linesAngle);
    setLinesThickness(snapshot.linesThickness);
    setLiquifyStrength(snapshot.liquifyStrength);
    setPinchStrength(snapshot.pinchStrength);
    setScanLineSize(snapshot.scanLineSize);
    setSepiaIntensity(snapshot.sepiaIntensity);
    setSolarizeThreshold(snapshot.solarizeThreshold);
    setGridSides(snapshot.gridSides);
    setDuotoneColor3(snapshot.duotoneColor3 || '#F7F7FF');
    setDuotoneThreeColor(snapshot.duotoneThreeColor || false);
    setVhsGlitchIntensity(snapshot.vhsGlitchIntensity);
    setGridRows(snapshot.gridRows);
    setGridColumns(snapshot.gridColumns);
    setPolygon2Sides(snapshot.polygon2Sides);
    setWaveDistortionStrength(snapshot.waveDistortionStrength);
    setWindmillTightness(snapshot.windmillTightness);
    setWindmillRotations(snapshot.windmillRotations);
    setWindmillThickness(snapshot.windmillThickness);
    setWindmillZoom(snapshot.windmillZoom);
    setShapesSides(snapshot.shapesSides);
    setShapesCount(snapshot.shapesCount);
    setConcentricRingWidth(snapshot.concentricRingWidth);
    setConcentricRingCount(snapshot.concentricRingCount);
    setWaveAmplitude(snapshot.waveAmplitude);
    setWaveFrequency(snapshot.waveFrequency);
    setWaveNumber(snapshot.waveNumber || 3);
    setWaveRotation(snapshot.waveRotation || 0);
    setMeshGridSize(snapshot.meshGridSize);
    setNoiseScale(snapshot.noiseScale);
    setNoiseOctaves(snapshot.noiseOctaves);
    setNoiseDirection(snapshot.noiseDirection || 0);
    setPlasmaSpeed(snapshot.plasmaSpeed);
    setPlasmaComplexity(snapshot.plasmaComplexity);
    setRadialBurstCount(snapshot.radialBurstCount);
    setRadialBurstSpread(snapshot.radialBurstSpread);
    setHelixTurns(snapshot.helixTurns);
    setHelixTightness(snapshot.helixTightness);
    setGridRotation(snapshot.gridRotation);
    setAngleStartOffset(snapshot.angleStartOffset);
    setAngleCenterX(snapshot.angleCenterX);
    setAngleCenterY(snapshot.angleCenterY);
    setIridescentAngle(snapshot.iridescentAngle);
    setIridescentIntensity(snapshot.iridescentIntensity);
    setIridescentScale(snapshot.iridescentScale);
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
    setReactionDiffusionFeed(snapshot.reactionDiffusionFeed ?? 0.037);
    setReactionDiffusionKill(snapshot.reactionDiffusionKill ?? 0.06);
    setReactionDiffusionSpeed(snapshot.reactionDiffusionSpeed ?? 1);
    setTopographicScale(snapshot.topographicScale ?? 40);
    setTopographicBands(snapshot.topographicBands ?? 10);
    setTopographicLineWidth(snapshot.topographicLineWidth ?? 0.04);
    setFlowerCircles(snapshot.flowerCircles ?? 3);
    setFlowerRotation(snapshot.flowerRotation ?? 0);
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
    setMasterSensitivity(snapshot.masterSensitivity ?? 1.2);
    setAutoGainEnabled(snapshot.autoGainEnabled ?? true);
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
    setMarbleOctaves(snapshot.marbleOctaves ?? 5);
    setMarbleTurbulence(snapshot.marbleTurbulence ?? 1.5);
    setMarbleVeinFreq(snapshot.marbleVeinFreq ?? 2);
    setMeshJitter(snapshot.meshJitter ?? 0);
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
    setSlitScanDirection(snapshot.slitScanDirection ?? 'horizontal');
    setSlitScanIntensity(snapshot.slitScanIntensity ?? 0.5);
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
