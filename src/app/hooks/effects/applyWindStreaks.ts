interface Streak {
  x: number;
  y: number;
  vx: number;
  vy: number;
  colorIndex: number;
}

// A single slowly-drifting wind direction (radians) shared by every streak,
// rather than a per-streak random heading — this is what makes it read as
// "wind" instead of "particles". Module-level like the other generative
// effects' clocks, for the same reason (cosmetic phase only).
let windAngle = 0.4;

function spawnStreak(w: number, h: number, colorCount: number): Streak {
  const spread = 0.5;
  const heading = windAngle + (Math.random() - 0.5) * spread;
  const speed = 1.5 + Math.random() * 2;
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: Math.cos(heading) * speed,
    vy: Math.sin(heading) * speed,
    colorIndex: Math.floor(Math.random() * Math.max(1, colorCount)),
  };
}

export function applyWindStreaks(P: any): void {
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
    windStreaksBufferRef,
    windStreaksParticlesRef,
    windStreaksCount,
    windStreaksSpeed,
    windStreaksOpacity,
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
  // Generative overlay: owns and moves its own directional streaks, drawn
  // from scratch every frame into a persistent decay buffer, same family as
  // Particle Trails but biased to a single shared drift direction instead
  // of random headings, and stroked as short lines instead of dots — reads
  // as wind-blown speed lines. Distinct from Blur (softens the existing
  // frame's own pixels): this doesn't sample the frame at all.
  if (canvas.width === 0 || canvas.height === 0) return;

  if (!windStreaksBufferRef.current || windStreaksBufferRef.current.width !== displayWidth || windStreaksBufferRef.current.height !== displayHeight) {
    windStreaksBufferRef.current = document.createElement('canvas');
    windStreaksBufferRef.current.width = displayWidth;
    windStreaksBufferRef.current.height = displayHeight;
    windStreaksParticlesRef.current = [];
  }
  const buf = windStreaksBufferRef.current;
  const bufCtx = buf.getContext('2d');
  if (!bufCtx) return;

  const count = Math.max(1, Math.round(windStreaksCount));
  const colorCount = gradientColors?.length || 1;
  if (windStreaksParticlesRef.current.length !== count) {
    windStreaksParticlesRef.current = Array.from({ length: count }, () => spawnStreak(displayWidth, displayHeight, colorCount));
  }

  const wsAudioActive = isFirstEffect && isAudioReactive;
  // Wind direction drifts on its own, sped up a little by treble.
  windAngle += 0.002 * (wsAudioActive ? 1 + audioTrebleLevel * 0.5 : 1);
  const speedMul = windStreaksSpeed * (wsAudioActive ? 1 + audioSubBassLevel * 0.5 : 1);
  // Same fix as Particle Trails: the previous 0.78 baseline gave a
  // half-life of under 3 frames — the streak was gone before it read as
  // more than a flicker. 0.9 keeps it clearly shorter/snappier than
  // Particle Trails' own 0.97 (these are meant to read as speed lines, not
  // lingering trails) while still being visible for more than a couple
  // frames.
  const decay = wsAudioActive ? Math.min(0.96, 0.9 + audioSubBassLevel * 0.04) : 0.9;

  bufCtx.globalCompositeOperation = 'destination-in';
  bufCtx.fillStyle = `rgba(0,0,0,${decay})`;
  bufCtx.fillRect(0, 0, displayWidth, displayHeight);
  bufCtx.globalCompositeOperation = 'source-over';

  const streaks = windStreaksParticlesRef.current;
  bufCtx.lineWidth = 2.5;
  for (let s = 0; s < streaks.length; s++) {
    const streak = streaks[s];
    const prevX = streak.x;
    const prevY = streak.y;
    streak.x += streak.vx * speedMul;
    streak.y += streak.vy * speedMul;
    if (streak.x < -20 || streak.x > displayWidth + 20 || streak.y < -20 || streak.y > displayHeight + 20) {
      const respawned = spawnStreak(displayWidth, displayHeight, colorCount);
      streak.x = respawned.x;
      streak.y = respawned.y;
      streak.vx = respawned.vx;
      streak.vy = respawned.vy;
      streak.colorIndex = respawned.colorIndex;
      continue;
    }

    const color = gradientColors?.[streak.colorIndex % colorCount] ?? { r: 255, g: 255, b: 255 };
    bufCtx.strokeStyle = `rgb(${color.r | 0}, ${color.g | 0}, ${color.b | 0})`;
    bufCtx.beginPath();
    bufCtx.moveTo(prevX, prevY);
    bufCtx.lineTo(streak.x, streak.y);
    bufCtx.stroke();
  }

  const opacity = Math.max(0, Math.min(1, windStreaksOpacity));
  ctx.globalCompositeOperation = 'lighten';
  ctx.globalAlpha = opacity;
  ctx.drawImage(buf, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}
