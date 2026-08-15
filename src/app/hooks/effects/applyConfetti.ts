interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotSpeed: number;
  size: number;
  shape: 0 | 1;
  colorIndex: number;
  wobblePhase: number;
  life: number;
  maxLife: number;
}

function spawnPiece(w: number, h: number, colorCount: number): ConfettiPiece {
  const maxLife = 90 + Math.random() * 90;
  return {
    x: Math.random() * w,
    y: -20 - Math.random() * h * 0.5,
    vx: (Math.random() - 0.5) * 0.6,
    vy: 0.8 + Math.random() * 1.2,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.15,
    size: 4 + Math.random() * 5,
    shape: Math.random() < 0.5 ? 0 : 1,
    colorIndex: Math.floor(Math.random() * Math.max(1, colorCount)),
    wobblePhase: Math.random() * Math.PI * 2,
    life: maxLife,
    maxLife,
  };
}

export function applyConfetti(P: any): void {
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
    confettiCount,
    confettiSpeed,
    confettiOpacity,
    confettiParticlesRef,
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
  // Generative overlay: small rotating shapes fall under gravity with a
  // sideways wobble, each with its own finite lifespan (fades out near the
  // end) rather than teleport-wrapping back to the top — a genuine
  // spawn/despawn cycle instead of the wrap-on-exit lifecycle Particle
  // Trails/Wind Streaks use, matching a real confetti fall.
  if (canvas.width === 0 || canvas.height === 0) return;

  const count = Math.max(1, Math.round(confettiCount));
  const colorCount = gradientColors?.length || 1;
  if (confettiParticlesRef.current.length !== count) {
    confettiParticlesRef.current = Array.from({ length: count }, () => {
      const piece = spawnPiece(displayWidth, displayHeight, colorCount);
      // Stagger initial spawn so pieces don't all fall in unison the first
      // time the effect turns on.
      piece.y = Math.random() * displayHeight;
      piece.life = Math.random() * piece.maxLife;
      return piece;
    });
  }

  const cAudioActive = isFirstEffect && isAudioReactive;
  const speedMul = confettiSpeed * (cAudioActive ? 1 + audioSubBassLevel * 0.4 : 1);
  const opacity = Math.max(0, Math.min(1, confettiOpacity));

  const pieces = confettiParticlesRef.current;
  ctx.save();
  for (let i = 0; i < pieces.length; i++) {
    const p = pieces[i];
    p.wobblePhase += 0.05;
    p.x += (p.vx + Math.sin(p.wobblePhase) * 0.5) * speedMul;
    p.y += p.vy * speedMul;
    p.rotation += p.rotSpeed * speedMul;
    p.life -= 1;

    if (p.life <= 0 || p.y > displayHeight + 20) {
      const respawned = spawnPiece(displayWidth, displayHeight, colorCount);
      Object.assign(p, respawned);
      continue;
    }

    // Fade in over the first tenth of life and out over the last tenth,
    // instead of popping in/out abruptly.
    const fadeIn = Math.min(1, (p.maxLife - p.life) / (p.maxLife * 0.1));
    const fadeOut = Math.min(1, p.life / (p.maxLife * 0.1));
    const alpha = opacity * Math.min(fadeIn, fadeOut);
    if (alpha <= 0) continue;

    const color = gradientColors?.[p.colorIndex % colorCount] ?? { r: 255, g: 255, b: 255 };
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.fillStyle = `rgba(${color.r | 0}, ${color.g | 0}, ${color.b | 0}, ${alpha})`;
    if (p.shape === 0) {
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -p.size / 2);
      ctx.lineTo(p.size / 2, p.size / 2);
      ctx.lineTo(-p.size / 2, p.size / 2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
}
