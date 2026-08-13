import { getScratchCanvas } from '../../utils/scratchCanvas';

interface CellSeed {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

function spawnSeed(w: number, h: number): CellSeed {
  const angle = Math.random() * Math.PI * 2;
  const speed = 0.3 + Math.random() * 0.5;
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
  };
}

export function applyVoronoiCells(P: any): void {
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
    voronoiCellsCount,
    voronoiCellsSpeed,
    voronoiCellsOpacity,
    voronoiCellsSeedsRef,
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
  // Generative overlay: a handful of seed points drift and bounce around
  // the canvas; every frame this recomputes, at a downsampled resolution,
  // which pixels sit near the boundary between two seeds' regions (nearest
  // vs second-nearest distance) and paints only those boundary pixels —
  // i.e. stroked cell edges, not filled cells. Distinct from the Voronoi
  // *gradient* background (fills each cell solid): this only ever draws
  // thin moving lines on top of whatever's already there.
  if (canvas.width === 0 || canvas.height === 0) return;

  const count = Math.max(2, Math.round(voronoiCellsCount));
  if (voronoiCellsSeedsRef.current.length !== count) {
    voronoiCellsSeedsRef.current = Array.from({ length: count }, () => spawnSeed(displayWidth, displayHeight));
  }
  const seeds = voronoiCellsSeedsRef.current;

  const vcAudioActive = isFirstEffect && isAudioReactive;
  const speedMul = voronoiCellsSpeed * (vcAudioActive ? 1 + audioSubBassLevel * 0.6 : 1);
  for (let i = 0; i < seeds.length; i++) {
    const s = seeds[i];
    s.x += s.vx * speedMul;
    s.y += s.vy * speedMul;
    if (s.x < 0 || s.x > displayWidth) { s.vx *= -1; s.x = Math.max(0, Math.min(displayWidth, s.x)); }
    if (s.y < 0 || s.y > displayHeight) { s.vy *= -1; s.y = Math.max(0, Math.min(displayHeight, s.y)); }
  }

  const scale = 0.4;
  const vcW = Math.max(1, Math.round(displayWidth * scale));
  const vcH = Math.max(1, Math.round(displayHeight * scale));
  const scratch = getScratchCanvas('voronoiCells', vcW, vcH);
  const scratchCtx = scratch.getContext('2d');
  if (!scratchCtx) return;
  const imgData = scratchCtx.createImageData(vcW, vcH);
  const data = imgData.data;

  // Edge band width in full-resolution pixels, scaled to how densely
  // packed the seeds are so lines stay proportionally thin whether there
  // are 3 seeds or 14.
  const typicalSpacing = Math.sqrt((displayWidth * displayHeight) / count);
  const edgeWidth = Math.max(3, typicalSpacing * 0.05);
  const colorCount = gradientColors?.length || 1;

  for (let by = 0; by < vcH; by++) {
    const y = by / scale;
    for (let bx = 0; bx < vcW; bx++) {
      const x = bx / scale;
      let d1 = Infinity;
      let d2 = Infinity;
      let idx1 = 0;
      let idx2 = 0;
      for (let s = 0; s < seeds.length; s++) {
        const dx = seeds[s].x - x;
        const dy = seeds[s].y - y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < d1) {
          d2 = d1; idx2 = idx1;
          d1 = d; idx1 = s;
        } else if (d < d2) {
          d2 = d; idx2 = s;
        }
      }
      const diff = d2 - d1;
      const i = (by * vcW + bx) * 4;
      if (diff < edgeWidth) {
        const alpha = 1 - diff / edgeWidth;
        const c1 = gradientColors?.[idx1 % colorCount] ?? { r: 255, g: 255, b: 255 };
        const c2 = gradientColors?.[idx2 % colorCount] ?? { r: 255, g: 255, b: 255 };
        data[i] = (c1.r + c2.r) / 2;
        data[i + 1] = (c1.g + c2.g) / 2;
        data[i + 2] = (c1.b + c2.b) / 2;
        data[i + 3] = alpha * 255;
      }
    }
  }

  scratchCtx.putImageData(imgData, 0, 0);
  const opacity = Math.max(0, Math.min(1, voronoiCellsOpacity));
  ctx.save();
  ctx.globalCompositeOperation = 'lighten';
  ctx.globalAlpha = opacity;
  ctx.drawImage(scratch, 0, 0, vcW, vcH, 0, 0, displayWidth, displayHeight);
  ctx.restore();
}
