import { DEG_TO_RAD, TWO_PI } from '../../constants/gradientEffects';
export function drawHelix(P: any): CanvasGradient | undefined {
  const {
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
    prevBassForRippleRef,
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
    rippleAmplitude,
    rippleAutoFrameRef,
    rippleRingsRef,
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
          // Conical gradient with spiral, rendered at half resolution and
          // upscaled (putLowResImageData).
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, displayWidth, displayHeight);
          const hRenderW = Math.max(1, Math.round(displayWidth * 0.5));
          const hRenderH = Math.max(1, Math.round(displayHeight * 0.5));
          const hInvScale = 2; // 1 / 0.5
          const spiralImageData = ctx.createImageData(hRenderW, hRenderH);
          const spiralData = spiralImageData.data;
        
          const conicalAudioActive = isAudioEnabled && isAudioReactive;
          // Bass pulses tightness (spiral density)
          const audioConicalTightness = conicalAudioActive ? audioSubBassLevel * 4 : 0;
          // Mids change turn count
          const audioConicalTurns = conicalAudioActive ? audioMidsLevel * 3 : 0;
          const conicalZoom = conicalAudioActive ? 1 : zoom;
          // Treble shifts color palette; bass radial pulse
          const conicalColorShift = conicalAudioActive ? audioTrebleLevel * 0.6 : 0;
          const conicalBassPulse = conicalAudioActive ? audioSubBassLevel : 0;
          const conicalMaxDist = Math.sqrt(centerX ** 2 + centerY ** 2);

          for (let sy = 0; sy < hRenderH; sy++) {
            for (let sx = 0; sx < hRenderW; sx++) {
              const dx = sx * hInvScale - centerX;
              const dy = sy * hInvScale - centerY;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const spiralAngle = Math.atan2(dy, dx);
              const rawAngle = spiralAngle + (dist * (helixTightness + audioConicalTightness) * 0.01) * (helixTurns + audioConicalTurns) / conicalZoom + gradientAngle * DEG_TO_RAD;
              const finalAngle = ((rawAngle % TWO_PI) + TWO_PI) % TWO_PI;
              const normalizedAngle = finalAngle / TWO_PI;

              const shiftedAngle = (normalizedAngle + conicalColorShift) % 1;
              const colorPos = shiftedAngle * (gradientColors.length - 1);
              const colorIdx = Math.floor(colorPos);
              const colorFrac = colorPos - colorIdx;
              const color1 = gradientColors[colorIdx % gradientColors.length];
              const color2 = gradientColors[(colorIdx + 1) % gradientColors.length];
              if (!color1 || !color2) continue;

              const radialBoost = 1 + conicalBassPulse * (1 - dist / conicalMaxDist) * 0.8;
              const pixelIndex = (sy * hRenderW + sx) * 4;
              spiralData[pixelIndex]     = Math.min(255, Math.round((color1.r + (color2.r - color1.r) * colorFrac) * radialBoost));
              spiralData[pixelIndex + 1] = Math.min(255, Math.round((color1.g + (color2.g - color1.g) * colorFrac) * radialBoost));
              spiralData[pixelIndex + 2] = Math.min(255, Math.round((color1.b + (color2.b - color1.b) * colorFrac) * radialBoost));
              spiralData[pixelIndex + 3] = 255;
            }
          }
          putLowResImageData(spiralImageData);
  return gradient;
}
