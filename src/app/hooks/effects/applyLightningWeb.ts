interface WebNode {
  x: number;
  y: number;
}

interface WebBolt {
  fromIdx: number;
  toIdx: number;
  life: number;
  maxLife: number;
}

function spawnNodes(count: number, w: number, h: number): WebNode[] {
  return Array.from({ length: count }, () => ({
    x: w * (0.1 + Math.random() * 0.8),
    y: h * (0.1 + Math.random() * 0.8),
  }));
}

// Fractal midpoint-displacement bolt path, same recursive-subdivision idea
// real lightning-generation algorithms use: each pass halves the segment
// length and roughly halves the displacement, so early passes carve the
// bolt's overall bend and later passes add fine jitter.
function buildBoltPoints(x1: number, y1: number, x2: number, y2: number, jitter: number, iterations: number): { x: number; y: number }[] {
  let points = [{ x: x1, y: y1 }, { x: x2, y: y2 }];
  let amt = jitter;
  for (let it = 0; it < iterations; it++) {
    const next: { x: number; y: number }[] = [points[0]];
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      const mx = (a.x + b.x) / 2 + (Math.random() - 0.5) * amt;
      const my = (a.y + b.y) / 2 + (Math.random() - 0.5) * amt;
      next.push({ x: mx, y: my }, b);
    }
    points = next;
    amt *= 0.55;
  }
  return points;
}

function strokeBoltPath(ctx: CanvasRenderingContext2D, points: { x: number; y: number }[]) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke();
}

export function applyLightningWeb(P: any): void {
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
    lightningWebCount,
    lightningWebSpeed,
    lightningWebOpacity,
    lightningWebNodesRef,
    lightningWebBoltsRef,
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
  // Generative overlay: a sparse set of anchor nodes with jittery bolt
  // lines flickering between nearby pairs — each bolt is a fresh
  // midpoint-displacement path regenerated every frame it's alive (not a
  // fixed shape), which is what produces the flicker. Distinct from Glitch
  // (spatially displaces existing frame content): this paints its own
  // lightning from scratch and would read as complete over a blank canvas.
  if (canvas.width === 0 || canvas.height === 0) return;

  const count = Math.max(2, Math.round(lightningWebCount));
  if (lightningWebNodesRef.current.length !== count) {
    lightningWebNodesRef.current = spawnNodes(count, displayWidth, displayHeight);
    lightningWebBoltsRef.current = [];
  }
  const nodes = lightningWebNodesRef.current;
  let bolts = lightningWebBoltsRef.current;

  const lwAudioActive = isFirstEffect && isAudioReactive;
  // Age out existing bolts first.
  bolts = bolts.map((b) => ({ ...b, life: b.life - 1 })).filter((b) => b.life > 0);

  // Treble transients spawn extra bolts on top of the base flicker rate —
  // reads as the web reacting to hits rather than a constant hum.
  const spawnChance = 0.03 * lightningWebSpeed * (lwAudioActive ? 1 + audioTrebleLevel * 4 : 1);
  const maxConcurrent = Math.max(1, Math.ceil(count / 2));
  if (bolts.length < maxConcurrent && Math.random() < spawnChance) {
    const fromIdx = Math.floor(Math.random() * nodes.length);
    // Bias toward nearby nodes so bolts read as a "web" rather than random
    // long lines crossing the whole canvas.
    let toIdx = fromIdx;
    let bestDist = Infinity;
    for (let tries = 0; tries < 4; tries++) {
      const candidate = Math.floor(Math.random() * nodes.length);
      if (candidate === fromIdx) continue;
      const dx = nodes[candidate].x - nodes[fromIdx].x;
      const dy = nodes[candidate].y - nodes[fromIdx].y;
      const d = dx * dx + dy * dy;
      if (d < bestDist) {
        bestDist = d;
        toIdx = candidate;
      }
    }
    if (toIdx !== fromIdx) {
      const maxLife = 3 + Math.floor(Math.random() * 4);
      bolts.push({ fromIdx, toIdx, life: maxLife, maxLife });
    }
  }
  lightningWebBoltsRef.current = bolts;

  const opacity = Math.max(0, Math.min(1, lightningWebOpacity));
  const colorCount = gradientColors?.length || 1;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (let i = 0; i < bolts.length; i++) {
    const bolt = bolts[i];
    const a = nodes[bolt.fromIdx];
    const b = nodes[bolt.toIdx];
    if (!a || !b) continue;
    const lifeFrac = bolt.life / bolt.maxLife;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const points = buildBoltPoints(a.x, a.y, b.x, b.y, Math.max(6, dist * 0.15), 3);
    const color = gradientColors?.[i % colorCount] ?? { r: 200, g: 220, b: 255 };
    const alpha = opacity * lifeFrac;

    // Soft wide glow pass, then a bright thin core — same double-stroke
    // trick Aura Glow uses for "light," just along a path instead of a
    // radial fill.
    ctx.strokeStyle = `rgba(${color.r | 0}, ${color.g | 0}, ${color.b | 0}, ${alpha * 0.35})`;
    ctx.lineWidth = 6;
    strokeBoltPath(ctx, points);

    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 1.5;
    strokeBoltPath(ctx, points);
  }
  ctx.restore();
}
