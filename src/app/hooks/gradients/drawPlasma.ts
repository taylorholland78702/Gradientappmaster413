import { getMappedColor } from '../../utils/fieldCurve';
import { getScratchImageData } from '../../utils/scratchCanvas';

export function drawPlasma(P: any): CanvasGradient | undefined {
  const {
    fieldContrast,
    paletteMode,
    paletteBands,
    structuralSeed,
    activeEffects,
    addGradientStops,
    angleCenterX,
    angleCenterY,
    angleStartOffset,
    asciiChars,
    asciiColor,
    asciiSize,
    attractorAnimTime,
    attractorBufferRef,
    attractorPointCount,
    attractorPointsRef,
    attractorScale,
    audioMidsLevel,
    audioSubBassLevel,
    audioTrebleLevel,
    auroraAnimTime,
    auroraBandCount,
    auroraBandHeight,
    auroraWaveSpeed,
    bassThreshold,
    bloomIntensity,
    bloomRadius,
    blurGaussianAmount,
    blurMotionAmount,
    blurMotionDirection,
    blurRadialAmount,
    blurType,
    canvasRef,
    causticsAnimTime,
    causticsBrightness,
    causticsScale,
    charcoalIntensity,
    chromaticAngle,
    chromaticOffset,
    chromaticTrailsBufferRef,
    chromaticTrailsDecay,
    chromaticTrailsOffset,
    colorPins,
    colorShiftHue,
    concentricRingCount,
    concentricRingWidth,
    helixTightness,
    helixTurns,
    ditherLevels,
    ditherType,
    drawParams,
    glitchIntensity,
    glitchBlockSize,
    glitchChromaSplit,
    drawParamsDirtyRef,
    drawRef,
    duotoneColor1,
    duotoneColor2,
    duotoneColor3,
    duotoneIntensity,
    duotoneThreeColor,
    dustCrackleIntensity,
    emojiAnimTime,
    emojiChars,
    emojiOffsetX,
    emojiSize,
    emojiSizeVariation,
    fadeDirection,
    feedbackBufferRef,
    feedbackDecay,
    feedbackRotation,
    feedbackZoom,
    fisheyeCenterX,
    fisheyeCenterY,
    fisheyeStrength,
    flowAnimTime,
    flowBufferRef,
    flowParticleCount,
    flowParticlesRef,
    flowScale,
    flowThickness,
    flowerAnimTime,
    flowerCircles,
    flowerRotation,
    flowerScale,
    flowerSpread,
    gradientAngle,
    gradientAngleRef,
    gradientColors,
    gradientColorsRef,
    gradientType,
    grainIntensity,
    grainType,
    gridColumns,
    gridRotation,
    gridRows,
    gridShapeSize,
    gridSides,
    gridVariation,
    halftoneCMYK,
    halftoneMove,
    halftoneSize,
    halftoneTimeRef,
    halftoneVariation,
    iridescentAngle,
    iridescentIntensity,
    iridescentScale,
    isAudioEnabled,
    isAudioReactive,
    isAutoModeRef,
    isVCRPlayingRef,
    kaleidoAngleRef,
    kaleidoscopeRotateSpeed,
    kaleidoscopeSegments,
    lavaAnimTime,
    lavaBlobCount,
    lavaBlobSize,
    lavaSpeed,
    liquidAnimTime,
    liquidScale,
    liquidStrength,
    marbleAnimTime,
    marbleOctaves,
    marbleTurbulence,
    marbleVeinFreq,
    meshGridSize,
    meshJitter,
    metaballAnimTime,
    metaballCount,
    metaballSize,
    mirrorMode,
    mirrorTileCount,
    moireAnimTime,
    moireOffset,
    moireScale,
    noiseDirection,
    noiseOctaves,
    noiseScale,
    noiseType,
    noiseWarp,
    photoBlendMode,
    photoImageRef,
    photoOpacity,
    pixelSize,
    plasmaComplexity,
    plasmaZoomScale,
    polygon2Sides,
    posterizeLevels,
    radarBeamWidth,
    radarFadeLength,
    radarSweepAngle,
    radialBurstCount,
    radialBurstSize,
    radialBurstSpread,
    radialSizeScale,
    reactionDiffusionFeed,
    reactionDiffusionGridRef,
    reactionDiffusionKill,
    reactionDiffusionSpeed,
    resolutionMultiplier,
    scanlineIntensity,
    scanlineSpacing,
    scanlineSpeed,
    shapesCount,
    shapesSides,
    slitScanBufferRef,
    slitScanDirection,
    slitScanIntensity,
    windmillRotations,
    windmillThickness,
    windmillTightness,
    windmillZoom,
    triangleSize,
    topographicBands,
    topographicLineWidth,
    topographicScale,
    juliaReal,
    juliaImaginary,
    juliaZoom,
    juliaIterations,
    juliaCanvasRef,
    truchetSize,
    truchetThickness,
    truchetVariation,
    vhsGlitchIntensity,
    vignetteSoftness,
    vignetteStrength,
    voronoiAnimTime,
    voronoiCellCount,
    voronoiDistortion,
    waveAmplitude,
    waveDistortionRotation,
    waveDistortionStrength,
    waveFrequency,
    waveNumberRef,
    waveRotationRef,
    waveScale,
    zoom,
    zoomRef,
    ctx,
    canvas,
    centerX,
    centerY,
    maxRadius,
    fitRadius,
    angleRad,
    cosAngle,
    sinAngle,
    displayWidth,
    displayHeight,
    putScaledImageData,
    getDisplayImageData,
    putLowResImageData
  } = P;
  let gradient: CanvasGradient | undefined;
          // Animated plasma effect - smooth rendering, at half resolution and
          // upscaled (putLowResImageData) — the stacked sin()/sqrt() math below
          // is too expensive per-pixel to run at full display resolution every
          // frame without visibly tanking FPS.
          const pRenderW = Math.max(1, Math.round(displayWidth * 0.5));
          const pRenderH = Math.max(1, Math.round(displayHeight * 0.5));
          const pInvScale = 2; // 1 / 0.5
          const plasmaImageData = getScratchImageData('plasma', ctx, pRenderW, pRenderH);
          const plasmaData = plasmaImageData.data;

          const plasmaAudioActive = isAudioEnabled && isAudioReactive;
          const audioPlasmaComplexity = plasmaAudioActive ? audioSubBassLevel * 50 : 0;
          const plasmaZoom = plasmaAudioActive ? 1 : zoom;
          const plasmaScale = ((plasmaComplexity + audioPlasmaComplexity) * 0.004) / (plasmaZoom * plasmaZoomScale);
          // Treble shifts color palette; bass radial pulse from center
          const plasmaColorShift = plasmaAudioActive ? audioTrebleLevel * 0.6 : 0;
          const plasmaBassPulse = plasmaAudioActive ? audioSubBassLevel : 0;
          const plasmaMaxDist = Math.sqrt(centerX ** 2 + centerY ** 2);

          const plasmaCX = displayWidth / 2;
          const plasmaCY = displayHeight / 2;
          const plasmaSeedX = structuralSeed * 210;
          const plasmaSeedY = structuralSeed * 140;
          for (let py = 0; py < pRenderH; py++) {
            for (let px = 0; px < pRenderW; px++) {
              const fx = px * pInvScale;
              const fy = py * pInvScale;
              const dx = fx - plasmaCX;
              const dy = fy - plasmaCY;
              const spx = fx + plasmaSeedX, spy = fy + plasmaSeedY;
              const value = (
                Math.sin(spx * plasmaScale + gradientAngle * 0.05) +
                Math.sin(spy * plasmaScale + gradientAngle * 0.05) +
                Math.sin((spx + spy) * plasmaScale * 0.75) +
                Math.sin(Math.sqrt(dx * dx + dy * dy) * plasmaScale + gradientAngle * 0.05)
              ) / 4 + 0.5;

              const shiftedValue = (value + plasmaColorShift) % 1;
              const color1 = getMappedColor(shiftedValue, gradientColors, fieldContrast, paletteMode, paletteBands);

              const dist = Math.sqrt(dx * dx + dy * dy);
              const radialBoost = 1 + plasmaBassPulse * (1 - dist / plasmaMaxDist) * 0.8;
              const idx = (py * pRenderW + px) * 4;
              plasmaData[idx]     = Math.min(255, Math.round(color1.r * radialBoost));
              plasmaData[idx + 1] = Math.min(255, Math.round(color1.g * radialBoost));
              plasmaData[idx + 2] = Math.min(255, Math.round(color1.b * radialBoost));
              plasmaData[idx + 3] = 255;
            }
          }
          putLowResImageData(plasmaImageData);
  return gradient;
}
