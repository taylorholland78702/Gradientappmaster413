export function drawMetaballs(P: any): CanvasGradient | undefined {
  const {
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
          // Like Lava Lamp's field-function blobs, but colored continuously
          // across the whole field (no on/off brightness threshold) so
          // overlapping blobs actually blend into each other rather than
          // reading as separate glowing shapes on a black background.
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, displayWidth, displayHeight);
          const metaAudio = isAudioEnabled && isAudioReactive;
          const audioBassMb = metaAudio ? audioSubBassLevel / 5 : 0;
          const audioMidsMb = metaAudio ? audioMidsLevel / 5 : 0;
          const mbTime = (metaballAnimTime + gradientAngle * 0.02) * (1 + audioMidsMb * 2);
          const mbScaleBoost = 1 + audioBassMb * 2.0;
          const mbColorShift = metaAudio ? audioTrebleLevel * 0.8 : 0;
          const imageDataMb = ctx.createImageData(displayWidth, displayHeight);
          const dMb = imageDataMb.data;
          const numBalls = Math.max(2, Math.min(metaballCount, 14));
          const balls: Array<{x: number, y: number, r: number}> = [];
          for (let i = 0; i < numBalls; i++) {
            const seedPhase = structuralSeed * (i + 1) * 0.9;
            const angle = (i / numBalls) * Math.PI * 2 + mbTime * (0.25 + i * 0.05) + seedPhase;
            const orbitR = 0.2 + 0.18 * Math.sin(mbTime * 0.3 + i * 1.3 + seedPhase);
            balls.push({
              x: centerX + displayWidth * orbitR * Math.cos(angle),
              y: centerY + displayHeight * orbitR * Math.sin(angle * 0.8 + mbTime * 0.15),
              r: Math.min(displayWidth, displayHeight) * metaballSize * mbScaleBoost,
            });
          }
          const mbZoomScale = 1 / zoom;
          for (let y = 0; y < displayHeight; y++) {
            for (let x = 0; x < displayWidth; x++) {
              const px = centerX + (x - centerX) * mbZoomScale;
              const py = centerY + (y - centerY) * mbZoomScale;
              let field = 0;
              for (let b = 0; b < balls.length; b++) {
                const dx = px - balls[b].x, dy = py - balls[b].y;
                const dist2 = dx * dx + dy * dy;
                field += (balls[b].r * balls[b].r) / (dist2 + 1);
              }
              const tValMb = (1 - 1 / (1 + field * 0.6)) * (1 - mbColorShift) + mbColorShift;
              const colorPosMb = tValMb * (gradientColors.length - 1);
              const ciMb = Math.floor(colorPosMb);
              const cfMb = colorPosMb - ciMb;
              const c1Mb = gradientColors[ciMb] || { r: 0, g: 0, b: 0 };
              const c2Mb = gradientColors[(ciMb + 1) % gradientColors.length] || c1Mb;
              const brightnessMb = Math.min(1, field * 0.9);
              const idxMb = (y * displayWidth + x) * 4;
              dMb[idxMb]     = Math.round((c1Mb.r + (c2Mb.r - c1Mb.r) * cfMb) * brightnessMb);
              dMb[idxMb + 1] = Math.round((c1Mb.g + (c2Mb.g - c1Mb.g) * cfMb) * brightnessMb);
              dMb[idxMb + 2] = Math.round((c1Mb.b + (c2Mb.b - c1Mb.b) * cfMb) * brightnessMb);
              dMb[idxMb + 3] = 255;
            }
          }
          putScaledImageData(imageDataMb);
  return gradient;
}
