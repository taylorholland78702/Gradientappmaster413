interface Star {
  angle: number;
  dist: number;
  speed: number;
  colorIndex: number;
}

function spawnStar(colorCount: number): Star {
  return {
    angle: Math.random() * Math.PI * 2,
    dist: Math.random() * 10,
    speed: 0.6 + Math.random() * 0.8,
    colorIndex: Math.floor(Math.random() * Math.max(1, colorCount)),
  };
}

export function applyStarfield(P: any): void {
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
    starfieldCount,
    starfieldSpeed,
    starfieldOpacity,
    starfieldSize,
    starfieldParticlesRef,
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
    effectType,
    index,
    isFirstEffect,
    audioModulation,
  } = P;
  // Generative overlay: points spawn near the canvas center and streak
  // outward with accelerating speed, like a warp-tunnel/starfield — each
  // frame's own motion (the previous position to the new one) is stroked
  // directly, which is what makes it read as a streak without needing a
  // persistent decay buffer the way Particle Trails/Wind Streaks do.
  if (canvas.width === 0 || canvas.height === 0) return;

  const count = Math.max(1, Math.round(starfieldCount));
  const colorCount = gradientColors?.length || 1;
  if (starfieldParticlesRef.current.length !== count) {
    starfieldParticlesRef.current = Array.from({ length: count }, () => spawnStar(colorCount));
  }

  const sfAudioActive = isFirstEffect && isAudioReactive;
  const speedMul = starfieldSpeed * (sfAudioActive ? 1 + audioSubBassLevel * 0.9 : 1);
  const cx = displayWidth / 2;
  const cy = displayHeight / 2;
  // Reach the far corners so stars fully exit before respawning.
  const edgeRadius = Math.sqrt(cx * cx + cy * cy) + 20;

  const opacity = Math.max(0, Math.min(1, starfieldOpacity));
  ctx.save();
  ctx.globalCompositeOperation = 'lighten';
  ctx.globalAlpha = opacity;

  const stars = starfieldParticlesRef.current;
  for (let i = 0; i < stars.length; i++) {
    const star = stars[i];
    const prevDist = star.dist;
    // Growth term scales with current distance so stars accelerate outward
    // — the classic warp-tunnel feel — rather than moving at constant speed.
    star.dist += star.speed * speedMul * (0.4 + prevDist / edgeRadius) * 4;
    if (star.dist > edgeRadius) {
      const respawned = spawnStar(colorCount);
      star.angle = respawned.angle;
      star.dist = respawned.dist;
      star.speed = respawned.speed;
      star.colorIndex = respawned.colorIndex;
      continue;
    }

    const cosA = Math.cos(star.angle);
    const sinA = Math.sin(star.angle);
    const prevX = cx + cosA * prevDist;
    const prevY = cy + sinA * prevDist;
    const x = cx + cosA * star.dist;
    const y = cy + sinA * star.dist;

    const t = star.dist / edgeRadius;
    const color = gradientColors?.[star.colorIndex % colorCount] ?? { r: 255, g: 255, b: 255 };
    ctx.strokeStyle = `rgba(${color.r | 0}, ${color.g | 0}, ${color.b | 0}, ${0.3 + t * 0.7})`;
    ctx.lineWidth = (0.5 + t * 2.5) * Math.max(0.1, starfieldSize ?? 1);
    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  ctx.restore();
}
