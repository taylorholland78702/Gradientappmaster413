import { getScratchCanvas } from '../../utils/scratchCanvas';

export function applyLightTrails(P: any): void {
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
    lightTrailsBufferRef,
    lightTrailsDecay,
    lightTrailsThreshold,
    lightTrailsIntensity,
    liquidAnimTime,
    liquidScale,
    liquidStrength,
    marbleAnimTime,
    marbleOctaves,
    marbleTurbulence,
    marbleVeinFreq,
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
    effectType,
    index,
    isFirstEffect,
    audioModulation,
  } = P;
  // Long-exposure light trails: a persistent buffer that only accumulates
  // the BRIGHTEST pixels seen at each location over time (via 'lighten'
  // compositing, which always keeps the brighter of old/new per channel)
  // and slowly fades, then gets blended back over the live frame. Distinct
  // from Chroma Trails (per-channel spatial fringe + uniform decay of
  // everything, not brightness-selective) and from Feedback (a geometric
  // zoom/rotate echo of the whole frame) — this reads as real long-exposure
  // photography, where only moving highlights leave streaks and dim/static
  // areas barely register.
  if (canvas.width === 0 || canvas.height === 0) return;

  const ltTmp = getScratchCanvas('lightTrailsTmp', displayWidth, displayHeight);
  const ltTmpCtx = ltTmp.getContext('2d');
  if (ltTmpCtx) ltTmpCtx.drawImage(canvas, 0, 0, displayWidth, displayHeight);

  if (!lightTrailsBufferRef.current || lightTrailsBufferRef.current.width !== displayWidth || lightTrailsBufferRef.current.height !== displayHeight) {
    lightTrailsBufferRef.current = document.createElement('canvas');
    lightTrailsBufferRef.current.width = displayWidth;
    lightTrailsBufferRef.current.height = displayHeight;
  }
  const buf = lightTrailsBufferRef.current;
  const bufCtx = buf.getContext('2d');
  if (!bufCtx || !ltTmpCtx) return;

  const ltAudioActive = isFirstEffect && isAudioReactive;
  const decay = ltAudioActive
    ? Math.min(0.995, lightTrailsDecay + audioSubBassLevel * 0.03)
    : lightTrailsDecay;
  const intensity = ltAudioActive
    ? Math.min(1, lightTrailsIntensity + audioSubBassLevel * 0.2)
    : lightTrailsIntensity;

  // Fade the existing trail buffer in place — destination-in with a
  // uniform alpha fill multiplies every existing pixel's alpha by `decay`
  // without a per-pixel JS loop (same idiom used to age a persistent
  // canvas cheaply elsewhere in this codebase).
  bufCtx.globalCompositeOperation = 'destination-in';
  bufCtx.fillStyle = `rgba(0,0,0,${decay})`;
  bufCtx.fillRect(0, 0, displayWidth, displayHeight);
  bufCtx.globalCompositeOperation = 'source-over';

  // Darken the incoming frame before compositing, then sharpen the result
  // with a fixed high contrast — together this crunches anything but
  // genuine highlights toward black before it gets a chance to win the
  // 'lighten' comparison below. Threshold controls how much pre-darkening
  // happens: near 0, almost nothing is suppressed (the whole frame washes
  // into the trail); near 1, only the brightest highlights survive to
  // leave a streak, closer to real long-exposure photography.
  const darken = Math.max(0.05, 1 - lightTrailsThreshold * 0.75);
  bufCtx.filter = `brightness(${darken}) contrast(2.2)`;
  bufCtx.globalCompositeOperation = 'lighten';
  bufCtx.drawImage(ltTmp, 0, 0);
  bufCtx.filter = 'none';
  bufCtx.globalCompositeOperation = 'source-over';

  // Composite the accumulated trail back over the live frame.
  ctx.globalCompositeOperation = 'lighten';
  ctx.globalAlpha = intensity;
  ctx.drawImage(buf, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}
