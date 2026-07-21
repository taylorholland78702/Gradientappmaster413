export function drawTruchet(P: any): CanvasGradient | undefined {
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
          // Grid of tiles, each with one of two quarter-circle-arc orientations
          // chosen by a per-cell hash (stable across frames) — forms continuous
          // maze-like curves. Drawn with vector arcs, not a pixel loop, so it's
          // cheap regardless of canvas resolution.
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, displayWidth, displayHeight);
          const tSize = Math.max(10, truchetSize) / zoom;
          const cols = Math.ceil(displayWidth / tSize) + 2;
          const rows = Math.ceil(displayHeight / tSize) + 2;
          // Treble thickens strokes on hi-hat/cymbal transients; bass adds
          // extra phase advance so the tile-flip maze re-shuffles faster on
          // a kick instead of only drifting with the constant angle rate.
          const truchetAudio = isAudioEnabled && isAudioReactive;
          ctx.lineWidth = Math.max(1, truchetThickness) * (1 + (truchetAudio ? audioTrebleLevel * 0.7 : 0));
          ctx.lineCap = 'round';
          // Color drift AND the tile pattern itself both track the shared
          // playhead angle (instead of just color before) — the seed's phase
          // shifts as the playhead advances, so tiles progressively re-flip
          // and the maze visibly evolves rather than only recoloring in place.
          const trAngleOffset = gradientAngle * 0.3 + (truchetAudio ? audioSubBassLevel * 40 : 0);
          for (let row = -1; row < rows; row++) {
            for (let col = -1; col < cols; col++) {
              const seed = Math.sin(col * 127.1 + row * 311.7 + 43.7 + trAngleOffset * 0.6) * 43758.5453;
              const seedFrac = seed - Math.floor(seed);
              const flip = seedFrac < truchetVariation;
              const cx0 = col * tSize, cy0 = row * tSize;
              const colorPos = (((row + col) / 6 + trAngleOffset / 360) % 1 + 1) % 1;
              const cIdx = Math.floor(((colorPos * gradientColors.length) % gradientColors.length + gradientColors.length) % gradientColors.length);
              const color = gradientColors[cIdx] || { r: 255, g: 255, b: 255 };
              ctx.strokeStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
              if (!flip) {
                ctx.beginPath();
                ctx.arc(cx0, cy0, tSize / 2, 0, Math.PI / 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(cx0 + tSize, cy0 + tSize, tSize / 2, Math.PI, Math.PI * 1.5);
                ctx.stroke();
              } else {
                ctx.beginPath();
                ctx.arc(cx0 + tSize, cy0, tSize / 2, Math.PI / 2, Math.PI);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(cx0, cy0 + tSize, tSize / 2, Math.PI * 1.5, Math.PI * 2);
                ctx.stroke();
              }
            }
          }
  return gradient;
}
