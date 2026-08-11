import { getMappedColor } from '../../utils/fieldCurve';

export function drawWaveInterference(P: any): CanvasGradient | undefined {
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
    waveInterferenceAnimTime,
    waveInterferenceSourceCount,
    waveInterferenceFrequency,
    waveInterferenceSpeed,
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
    putLowResImageData,
  } = P;
  let gradient: CanvasGradient | undefined;
  // N point sources drift slowly around the canvas, each emitting a
  // circular wave; the field value at every pixel is the (normalized) sum
  // of all sources' sin(distance*freq - t*speed) contributions, producing
  // additive/destructive interference (moire-adjacent, but a continuous
  // wave-physics field rather than Moire's two sets of discrete stroked
  // rings). Rendered at half resolution and upscaled (putLowResImageData),
  // same as Topographic.
  const wiRenderW = Math.max(1, Math.round(displayWidth * 0.5));
  const wiRenderH = Math.max(1, Math.round(displayHeight * 0.5));
  const wiInvScale = 2; // 1 / 0.5
  const wiImageData = ctx.createImageData(wiRenderW, wiRenderH);
  const wiData = wiImageData.data;
  const wiCX = displayWidth / 2, wiCY = displayHeight / 2;

  const wiAudioActive = isAudioEnabled && isAudioReactive;
  const wiBassBoost = wiAudioActive ? audioSubBassLevel * 0.6 : 0;
  const wiTrebleBoost = wiAudioActive ? audioTrebleLevel * 0.5 : 0;
  const sourceCount = Math.max(1, Math.round(waveInterferenceSourceCount));
  const t = waveInterferenceAnimTime;
  const wiSeedX = structuralSeed * 130;
  const wiSeedY = structuralSeed * 90;

  const sources: { x: number; y: number; phase: number }[] = [];
  const wiRadius = Math.min(displayWidth, displayHeight) * 0.32;
  for (let i = 0; i < sourceCount; i++) {
    const angle = (i / sourceCount) * Math.PI * 2 + t * 0.1 + wiSeedX * 0.01;
    const radiusJitter = 1 + 0.15 * Math.sin(t * 0.37 + i * 2.1 + wiSeedY * 0.01);
    sources.push({
      x: wiCX + Math.cos(angle) * wiRadius * radiusJitter,
      y: wiCY + Math.sin(angle) * wiRadius * radiusJitter,
      phase: i * 1.7,
    });
  }

  const freq = (waveInterferenceFrequency * 0.01) * (1 + wiBassBoost);
  const speed = waveInterferenceSpeed * (1 + wiTrebleBoost);

  for (let wy = 0; wy < wiRenderH; wy++) {
    for (let wx = 0; wx < wiRenderW; wx++) {
      const fx = wx * wiInvScale;
      const fy = wy * wiInvScale;
      let sum = 0;
      for (let s = 0; s < sources.length; s++) {
        const dx = fx - sources[s].x;
        const dy = fy - sources[s].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        sum += Math.sin(dist * freq - t * speed * 3 + sources[s].phase);
      }
      const field = (sum / sources.length + 1) / 2;

      const mapped = getMappedColor(field, gradientColors, fieldContrast, paletteMode, paletteBands);

      const idx = (wy * wiRenderW + wx) * 4;
      wiData[idx] = Math.round(Math.min(255, Math.max(0, mapped.r)));
      wiData[idx + 1] = Math.round(Math.min(255, Math.max(0, mapped.g)));
      wiData[idx + 2] = Math.round(Math.min(255, Math.max(0, mapped.b)));
      wiData[idx + 3] = 255;
    }
  }

  putLowResImageData(wiImageData);
  return gradient;
}
