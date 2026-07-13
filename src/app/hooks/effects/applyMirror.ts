export function applyMirror(P: any): void {
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
    meshGridSize,
    meshJitter,
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
    imageData
  } = P;
            if (canvas.width === 0 || canvas.height === 0) return;
            const mw = displayWidth, mh = displayHeight;
            // canvas.width/height are physical pixels (CSS size × resolutionMultiplier
            // on Retina). drawImage's source rect is always in the source's native
            // pixel space, so passing CSS-pixel-sized rects (mw, mh, tileW, tileH…)
            // straight against `canvas` only sampled a top-left fraction of the real
            // image — the smaller the requested region, the smaller a corner it grabbed
            // (visibly "coming from the corner", and at high grid tile counts, too tiny
            // a sliver to read as anything). Downsample to display resolution once and
            // mirror from that instead, matching getDisplayImageData's approach.
            const mirrorSrc = document.createElement('canvas');
            mirrorSrc.width = mw; mirrorSrc.height = mh;
            mirrorSrc.getContext('2d')!.drawImage(canvas, 0, 0, mw, mh);
            const mirrorTemp = document.createElement('canvas');
            mirrorTemp.width = mw; mirrorTemp.height = mh;
            const mCtx = mirrorTemp.getContext('2d')!;
            if (mirrorMode === 'horizontal') {
              mCtx.drawImage(mirrorSrc, 0, 0, mw/2, mh, 0, 0, mw/2, mh);
              mCtx.save(); mCtx.scale(-1, 1); mCtx.drawImage(mirrorSrc, 0, 0, mw/2, mh, -mw, 0, mw/2, mh); mCtx.restore();
            } else if (mirrorMode === 'vertical') {
              mCtx.drawImage(mirrorSrc, 0, 0, mw, mh/2, 0, 0, mw, mh/2);
              mCtx.save(); mCtx.scale(1, -1); mCtx.drawImage(mirrorSrc, 0, 0, mw, mh/2, 0, -mh, mw, mh/2); mCtx.restore();
            } else {
              // Generalized N×N mirrored tiling (quad was the fixed N=2 case) — samples
              // the top-left corner of the source and tiles it across an N×N grid,
              // flipping alternate rows/columns so every seam lines up seamlessly.
              const n = Math.max(2, Math.min(16, Math.round(mirrorTileCount)));
              const tileW = mw / n, tileH = mh / n;
              // Round tile boundaries to whole pixels and overdraw by 1px so
              // adjacent tiles overlap slightly instead of leaving hairline gaps
              // from sub-pixel rounding in drawImage.
              for (let row = 0; row < n; row++) {
                for (let col = 0; col < n; col++) {
                  const flipX = col % 2 === 1;
                  const flipY = row % 2 === 1;
                  const x0 = Math.round(col * tileW);
                  const x1 = Math.round((col + 1) * tileW);
                  const y0 = Math.round(row * tileH);
                  const y1 = Math.round((row + 1) * tileH);
                  const w = x1 - x0 + 1;
                  const h = y1 - y0 + 1;
                  mCtx.save();
                  mCtx.translate(x0 + (flipX ? w - 1 : 0), y0 + (flipY ? h - 1 : 0));
                  mCtx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
                  mCtx.drawImage(mirrorSrc, 0, 0, tileW, tileH, 0, 0, w, h);
                  mCtx.restore();
                }
              }
            }
            ctx.clearRect(0, 0, mw, mh);
            ctx.drawImage(mirrorTemp, 0, 0);
}
