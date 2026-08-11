export function applyPixelSort(P: any): void {
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
    pixelSortThreshold,
    pixelSortIntensity,
    pixelSortDirection,
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
  // Pixel-sort / datamosh: within each row (or column), pixels above a
  // brightness threshold form a contiguous "run" that gets sorted by
  // luminance — the classic pixel-sort look. Distinct from Glitch (spatial
  // block displacement) and VHS (analog signal wobble): this is a per-pixel
  // reordering driven by the image's own brightness, not a spatial or
  // temporal distortion.
  if (canvas.width === 0 || canvas.height === 0) return;
  const imgData = getDisplayImageData();
  const data = imgData.data;
  const w = imgData.width;
  const h = imgData.height;

  // Bass hits briefly lower the threshold so more of the frame gets swept
  // into sorted runs on a kick/drop, same "spike on the beat" pattern as
  // Glitch's bass-driven intensity.
  const psAudioActive = isFirstEffect && isAudioReactive;
  const threshold = psAudioActive
    ? Math.max(0, pixelSortThreshold - audioSubBassLevel * 0.3)
    : pixelSortThreshold;
  const thresholdVal = threshold * 255;

  const luminance = (i: number) => 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

  const sortRun = (getIdx: (pos: number) => number, length: number) => {
    let runStart = -1;
    for (let pos = 0; pos <= length; pos++) {
      const above = pos < length && luminance(getIdx(pos)) >= thresholdVal;
      if (above && runStart === -1) {
        runStart = pos;
      } else if (!above && runStart !== -1) {
        const runLen = pos - runStart;
        if (runLen > 1) {
          const pixels: [number, number, number, number][] = [];
          for (let p = runStart; p < pos; p++) {
            const i = getIdx(p);
            pixels.push([data[i], data[i + 1], data[i + 2], data[i + 3]]);
          }
          pixels.sort((a, b) => (0.299 * a[0] + 0.587 * a[1] + 0.114 * a[2]) - (0.299 * b[0] + 0.587 * b[1] + 0.114 * b[2]));
          for (let p = 0; p < pixels.length; p++) {
            const i = getIdx(runStart + p);
            data[i] = pixels[p][0];
            data[i + 1] = pixels[p][1];
            data[i + 2] = pixels[p][2];
            data[i + 3] = pixels[p][3];
          }
        }
        runStart = -1;
      }
    }
  };

  // pixelSortIntensity gates what fraction of lines get swept each frame —
  // both a perf knob (sorting every row/column of a full-res frame every
  // frame is the priciest part of this effect) and an artistic one (fewer
  // lines reads as a sparser, more intermittent glitch).
  if (pixelSortDirection === 'horizontal') {
    for (let y = 0; y < h; y++) {
      if (Math.random() > pixelSortIntensity) continue;
      sortRun((x) => (y * w + x) * 4, w);
    }
  } else {
    for (let x = 0; x < w; x++) {
      if (Math.random() > pixelSortIntensity) continue;
      sortRun((y) => (y * w + x) * 4, h);
    }
  }

  putScaledImageData(imgData);
}
