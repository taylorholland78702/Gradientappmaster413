interface TrailParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  colorIndex: number;
  size: number;
}

function spawnParticle(w: number, h: number, colorCount: number): TrailParticle {
  const angle = Math.random() * Math.PI * 2;
  const speed = 0.3 + Math.random() * 0.7;
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    colorIndex: Math.floor(Math.random() * Math.max(1, colorCount)),
    size: 1.5 + Math.random() * 2,
  };
}

export function applyParticleTrails(P: any): void {
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
    particleTrailsBufferRef,
    particleTrailsParticlesRef,
    particleTrailsCount,
    particleTrailsSpeed,
    particleTrailsOpacity,
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
  // Generative overlay: this effect owns and moves its own particles —
  // spawned, simulated, and drawn from scratch every frame, not derived
  // from the canvas at all — leaving glowing trails in a persistent decay
  // buffer. Distinct from Feedback (a geometric zoom/rotate echo of the
  // whole existing frame) and Chroma Trails (a per-channel spatial fringe
  // + uniform decay of the whole existing frame): those two are named
  // "trails" but are transform effects: they need something already on
  // screen to echo. This one draws its own moving lights and would still
  // read as a complete effect over a blank canvas.
  if (canvas.width === 0 || canvas.height === 0) return;

  if (!particleTrailsBufferRef.current || particleTrailsBufferRef.current.width !== displayWidth || particleTrailsBufferRef.current.height !== displayHeight) {
    particleTrailsBufferRef.current = document.createElement('canvas');
    particleTrailsBufferRef.current.width = displayWidth;
    particleTrailsBufferRef.current.height = displayHeight;
    // Buffer was just (re)created at a new size — any particles positioned
    // for the old canvas size would read as clustered in one corner, so
    // reseed instead of letting the count-mismatch check below do it.
    particleTrailsParticlesRef.current = [];
  }
  const buf = particleTrailsBufferRef.current;
  const bufCtx = buf.getContext('2d');
  if (!bufCtx) return;

  const count = Math.max(1, Math.round(particleTrailsCount));
  const colorCount = gradientColors?.length || 1;
  if (particleTrailsParticlesRef.current.length !== count) {
    particleTrailsParticlesRef.current = Array.from({ length: count }, () => spawnParticle(displayWidth, displayHeight, colorCount));
  }

  const ptAudioActive = isFirstEffect && isAudioReactive;
  const speedMul = particleTrailsSpeed * (ptAudioActive ? 1 + audioTrebleLevel * 0.6 : 1);
  // The destination-in fade below multiplies the trail buffer's alpha by
  // `decay` every single frame, so the half-life in frames is
  // ln(0.5)/ln(decay) — at 0.9 that's under 7 frames (~0.1s at 60fps), far
  // too short to read as a trail at all before it's forgotten (same class
  // of bug the Light Trails effect shipped with initially). 0.97 gives a
  // ~0.4s half-life; bass hits push it further out so trails visibly
  // bloom longer on a kick instead of decaying at a flat rate.
  const decay = ptAudioActive ? Math.min(0.995, 0.97 + audioSubBassLevel * 0.02) : 0.97;

  bufCtx.globalCompositeOperation = 'destination-in';
  bufCtx.fillStyle = `rgba(0,0,0,${decay})`;
  bufCtx.fillRect(0, 0, displayWidth, displayHeight);
  bufCtx.globalCompositeOperation = 'source-over';

  const particles = particleTrailsParticlesRef.current;
  for (let p = 0; p < particles.length; p++) {
    const particle = particles[p];
    particle.x += particle.vx * speedMul;
    particle.y += particle.vy * speedMul;
    // Wrap rather than respawn on exit — keeps the total particle count
    // (and therefore per-frame cost) exactly stable instead of a bursty
    // respawn cadence.
    if (particle.x < -10) particle.x = displayWidth + 10;
    if (particle.x > displayWidth + 10) particle.x = -10;
    if (particle.y < -10) particle.y = displayHeight + 10;
    if (particle.y > displayHeight + 10) particle.y = -10;

    const color = gradientColors?.[particle.colorIndex % colorCount] ?? { r: 255, g: 255, b: 255 };
    bufCtx.beginPath();
    bufCtx.fillStyle = `rgb(${color.r | 0}, ${color.g | 0}, ${color.b | 0})`;
    bufCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    bufCtx.fill();
  }

  const opacity = Math.max(0, Math.min(1, particleTrailsOpacity));
  ctx.globalCompositeOperation = 'lighten';
  ctx.globalAlpha = opacity;
  ctx.drawImage(buf, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}
