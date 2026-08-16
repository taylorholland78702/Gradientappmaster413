import { getMappedColor } from '../../utils/fieldCurve';

// Deterministic pseudo-random hash for a grid coordinate — same idiom as
// drawMeshWireframe.ts's hash2, kept local since this is a different
// (generative-effect, not generative-gradient) call site.
function hash2(ix: number, iy: number, seed: number): number {
  const s = Math.sin(ix * 12.9898 + iy * 78.233 + seed * 37.719) * 43758.5453;
  return s - Math.floor(s);
}

// Module-level animation clock — a plain time accumulator rather than a
// dedicated ref threaded through useMiscState/animValuesRef/useSnapshot,
// since this is purely a cosmetic phase (no undo/redo or Display-mode
// sync value depends on it), same tradeoff already accepted for e.g.
// halftoneTimeRef's simpler cousins.
let tfTime = 0;
let tfRotation = 0;

export function applyTriangleField(P: any): void {
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
    fieldContrast,
    paletteMode,
    paletteBands,
    structuralSeed,
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
    triangleFieldGridSize,
    triangleFieldSpeed,
    triangleFieldOpacity,
    triangleFieldRotation,
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
  // Generative overlay, not a transform: unlike Triangulate (which
  // re-triangulates the pixels already on the canvas), this draws its own
  // evolving triangle mesh from scratch — filled from the palette, not
  // sampled from the frame beneath it — and blends over whatever's already
  // drawn via a dedicated Opacity slider (same "generative effect" family
  // as the other persistent/overlay effects: Feedback, Chroma Trails).
  if (canvas.width === 0 || canvas.height === 0) return;

  const tfAudioActive = isFirstEffect && isAudioReactive;
  const speedBoost = tfAudioActive ? 1 + audioTrebleLevel * 0.6 : 1;
  tfTime += 0.006 * triangleFieldSpeed * speedBoost;
  // Whole-mesh spin, independent of Speed (which only drives per-vertex
  // jitter phase above) — degrees/frame straight from the slider, 0 by
  // default so existing looks don't change unless it's turned on.
  tfRotation = (tfRotation + (triangleFieldRotation ?? 0)) % 360;

  const cols = Math.max(3, Math.round(triangleFieldGridSize));
  const rows = Math.max(3, Math.round(triangleFieldGridSize * (displayHeight / displayWidth)));
  const cellW = displayWidth / cols;
  const cellH = displayHeight / rows;
  const jitterAmt = Math.min(cellW, cellH) * 0.4 * (tfAudioActive ? 1 + audioSubBassLevel * 0.4 : 1);
  const seed = structuralSeed ?? 0;

  const points: { x: number; y: number }[][] = [];
  for (let iy = 0; iy <= rows; iy++) {
    const row: { x: number; y: number }[] = [];
    for (let ix = 0; ix <= cols; ix++) {
      const n1 = hash2(ix, iy, seed) * Math.PI * 2;
      const n2 = hash2(ix + 71, iy + 19, seed) * Math.PI * 2;
      const dx = Math.sin(tfTime + n1) * jitterAmt;
      const dy = Math.cos(tfTime * 1.13 + n2) * jitterAmt;
      row.push({ x: ix * cellW + dx, y: iy * cellH + dy });
    }
    points.push(row);
  }

  const opacity = Math.max(0, Math.min(1, triangleFieldOpacity));
  ctx.globalAlpha = opacity;
  ctx.save();
  ctx.translate(displayWidth / 2, displayHeight / 2);
  ctx.rotate((tfRotation * Math.PI) / 180);
  ctx.translate(-displayWidth / 2, -displayHeight / 2);
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
  };

  for (let iy = 0; iy < rows; iy++) {
    for (let ix = 0; ix < cols; ix++) {
      const p00 = points[iy][ix];
      const p10 = points[iy][ix + 1];
      const p01 = points[iy + 1][ix];
      const p11 = points[iy + 1][ix + 1];

      const fieldA = (((ix + 0.33) / cols) + ((iy + 0.33) / rows) + tfTime * 0.05) / 2;
      const fieldB = (((ix + 0.67) / cols) + ((iy + 0.67) / rows) + tfTime * 0.05) / 2;

      fillTriangle(p00, p10, p01, fieldA);
      fillTriangle(p10, p11, p01, fieldB);
    }
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}
