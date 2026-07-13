export function drawFade(P: any): CanvasGradient | undefined {
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
    getDisplayImageData
  } = P;
  let gradient: CanvasGradient | undefined;
          const fadeAudioActive = isAudioEnabled && isAudioReactive;
          const totalColors = gradientColors.length;
          const normalizedAngle = gradientAngle / 360;
          // Treble shifts the blend midpoint between colors
          const audioMidpointShift = fadeAudioActive ? audioTrebleLevel * 0.6 : 0;
          const exactPosition = (normalizedAngle * totalColors + audioMidpointShift) % totalColors;
          const currentColorIndex = Math.floor(exactPosition) % totalColors;
          const nextColorIndex = (currentColorIndex + 1) % totalColors;
          // Bass pulses the blend amount toward the next color
          const baseBlend = exactPosition - Math.floor(exactPosition);
          const blendAmount = fadeAudioActive ? Math.min(1, baseBlend + audioSubBassLevel * 0.4) : baseBlend;

          const currentColor = gradientColors[currentColorIndex];
          const nextColor = gradientColors[nextColorIndex];
          if (!currentColor || !nextColor) return gradient;

          const r = Math.round(currentColor.r + (nextColor.r - currentColor.r) * blendAmount);
          const g = Math.round(currentColor.g + (nextColor.g - currentColor.g) * blendAmount);
          const b = Math.round(currentColor.b + (nextColor.b - currentColor.b) * blendAmount);

          if (gradientColors.length >= 2 && fadeDirection !== 0) {
            const fadeRad = fadeDirection * Math.PI / 180;
            const fadeCx = displayWidth / 2, fadeCy = displayHeight / 2;
            const fadeHalfDiag = Math.sqrt(fadeCx * fadeCx + fadeCy * fadeCy);
            const fx0 = fadeCx - Math.cos(fadeRad) * fadeHalfDiag;
            const fy0 = fadeCy - Math.sin(fadeRad) * fadeHalfDiag;
            const fx1 = fadeCx + Math.cos(fadeRad) * fadeHalfDiag;
            const fy1 = fadeCy + Math.sin(fadeRad) * fadeHalfDiag;
            const fadeLinGrad = ctx.createLinearGradient(fx0, fy0, fx1, fy1);
            fadeLinGrad.addColorStop(0, `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})`);
            fadeLinGrad.addColorStop(1, `rgb(${nextColor.r}, ${nextColor.g}, ${nextColor.b})`);
            ctx.fillStyle = fadeLinGrad;
          } else {
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          }
          ctx.fillRect(0, 0, displayWidth, displayHeight);

          // Mids: radial pulse from center
          if (fadeAudioActive && audioMidsLevel > 0.05) {
            const pulseRadius = Math.min(displayWidth, displayHeight) * audioMidsLevel * 0.7;
            const pulseGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseRadius);
            pulseGrad.addColorStop(0, `rgba(255,255,255,${audioMidsLevel * 0.4})`);
            pulseGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = pulseGrad;
            ctx.fillRect(0, 0, displayWidth, displayHeight);
          }
  return gradient;
}
