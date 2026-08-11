import { getMappedColor } from '../../utils/fieldCurve';

// Deterministic pseudo-random hash for a grid coordinate, used instead of
// Math.random() so the mesh's point layout is stable frame-to-frame (no
// re-seeding jitter every draw) while still varying per-point and per-seed.
function hash2(ix: number, iy: number, seed: number): number {
  const s = Math.sin(ix * 12.9898 + iy * 78.233 + seed * 37.719) * 43758.5453;
  return s - Math.floor(s);
}

export function drawMeshWireframe(P: any): CanvasGradient | undefined {
  const {
    fieldContrast,
    paletteMode,
    paletteBands,
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
    meshWireframeAnimTime,
    meshWireframeGridSize,
    meshWireframeJitter,
    meshWireframeLineWidth,
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
  } = P;
  let gradient: CanvasGradient | undefined;
  // Low-poly triangulated mesh: a grid of points, each jittered by a
  // deterministic per-point drift, split into two triangles per cell and
  // filled with a palette color sampled by position — the generative
  // counterpart to the Triangulate post-effect, which instead re-triangulates
  // an already-rendered frame.
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, displayWidth, displayHeight);

  const cols = Math.max(2, Math.round(meshWireframeGridSize));
  const rows = Math.max(2, Math.round(meshWireframeGridSize * (displayHeight / displayWidth)));
  const cellW = displayWidth / cols;
  const cellH = displayHeight / rows;

  const mwAudioActive = isAudioEnabled && isAudioReactive;
  const bassBoost = mwAudioActive ? audioSubBassLevel : 0;
  const trebleBoost = mwAudioActive ? audioTrebleLevel : 0;
  const jitterAmt = meshWireframeJitter * (0.4 + bassBoost * 0.8) * Math.min(cellW, cellH) * 0.5;
  const t = meshWireframeAnimTime;

  const points: { x: number; y: number }[][] = [];
  for (let iy = 0; iy <= rows; iy++) {
    const row: { x: number; y: number }[] = [];
    for (let ix = 0; ix <= cols; ix++) {
      const n1 = hash2(ix, iy, structuralSeed) * Math.PI * 2;
      const n2 = hash2(ix + 71, iy + 19, structuralSeed) * Math.PI * 2;
      const dx = Math.sin(t + n1) * jitterAmt;
      const dy = Math.cos(t * 1.13 + n2) * jitterAmt;
      row.push({ x: ix * cellW + dx, y: iy * cellH + dy });
    }
    points.push(row);
  }

  const fillTriangle = (
    p0: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    fieldT: number,
  ) => {
    const mapped = getMappedColor(fieldT, gradientColors, fieldContrast, paletteMode, paletteBands);
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.closePath();
    ctx.fillStyle = `rgb(${mapped.r | 0}, ${mapped.g | 0}, ${mapped.b | 0})`;
    ctx.fill();
    if (meshWireframeLineWidth > 0) {
      const lineBrightness = 0.35 + trebleBoost * 0.5;
      ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(1, lineBrightness)})`;
      ctx.lineWidth = meshWireframeLineWidth;
      ctx.stroke();
    }
  };

  for (let iy = 0; iy < rows; iy++) {
    for (let ix = 0; ix < cols; ix++) {
      const p00 = points[iy][ix];
      const p10 = points[iy][ix + 1];
      const p01 = points[iy + 1][ix];
      const p11 = points[iy + 1][ix + 1];

      const fieldA = ((ix + 0.33) / cols + (iy + 0.33) / rows) / 2;
      const fieldB = ((ix + 0.67) / cols + (iy + 0.67) / rows) / 2;

      fillTriangle(p00, p10, p01, fieldA);
      fillTriangle(p10, p11, p01, fieldB);
    }
  }

  return gradient;
}
