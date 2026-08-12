import { getScratchCanvas } from '../../utils/scratchCanvas';

// Same module-level clock tradeoff as applyTriangleField.ts/applyFluidField.ts.
let sfTime = 0;

export function applyStaticField(P: any): void {
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
    staticFieldIntensity,
    staticFieldBarSpeed,
    staticFieldOpacity,
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
  // Generative overlay: classic CRT static/interference — grayscale noise
  // plus drifting horizontal sync bars, generated from scratch every frame
  // rather than read from the canvas. Distinct from Glitch (spatially
  // displaces existing blocks of the frame) and VHS (wobbles existing
  // scanlines): this doesn't touch the frame's own pixels at all, it just
  // paints interference on top, same as a real TV losing signal over
  // whatever's already playing.
  if (canvas.width === 0 || canvas.height === 0) return;

  const sfAudioActive = isFirstEffect && isAudioReactive;
  // Bass hits burst the static harder and speed the bars up momentarily —
  // reads as a signal-drop hit on the beat rather than a constant hiss.
  const burst = sfAudioActive ? audioSubBassLevel : 0;
  sfTime += 0.008 * staticFieldBarSpeed * (1 + burst * 0.8);

  const sfW = Math.max(1, Math.round(displayWidth * 0.35));
  const sfH = Math.max(1, Math.round(displayHeight * 0.35));
  const scratch = getScratchCanvas('staticField', sfW, sfH);
  const scratchCtx = scratch.getContext('2d');
  if (!scratchCtx) return;
  const imgData = scratchCtx.createImageData(sfW, sfH);
  const data = imgData.data;

  const intensity = Math.min(1, staticFieldIntensity + burst * 0.5);
  // Two sync bars drifting at different speeds so they drift in and out of
  // phase rather than moving in lockstep.
  const bar1Y = ((sfTime * 0.6) % 1.4 - 0.2) * sfH;
  const bar2Y = ((sfTime * 0.37 + 0.6) % 1.4 - 0.2) * sfH;
  const barWidth = sfH * 0.04;

  for (let y = 0; y < sfH; y++) {
    const dist1 = Math.abs(y - bar1Y);
    const dist2 = Math.abs(y - bar2Y);
    const barBoost = Math.max(
      0,
      1 - dist1 / barWidth,
      0,
    ) * 200 + Math.max(0, 1 - dist2 / barWidth) * 140;
    for (let x = 0; x < sfW; x++) {
      const noise = Math.random() * 255 * intensity;
      const v = Math.min(255, noise + barBoost);
      const i = (y * sfW + x) * 4;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }
  }

  scratchCtx.putImageData(imgData, 0, 0);
  const opacity = Math.max(0, Math.min(1, staticFieldOpacity + burst * 0.15));
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.drawImage(scratch, 0, 0, sfW, sfH, 0, 0, displayWidth, displayHeight);
  ctx.restore();
}
