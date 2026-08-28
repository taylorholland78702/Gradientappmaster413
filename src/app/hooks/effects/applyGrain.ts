export function applyGrain(P: any): void {
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
    dustCrackleColor,
    dustCrackleIntensity,
    dustCrackleLength,
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
    grainSize,
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
    imageData
  } = P;
            // Dust-scratches was merged in here as an optional Crackle layer —
            // its noise component was the identical additive-noise loop as grain
            // itself, just with different constants, so the only distinct piece
            // worth keeping was the crackle lines, which can now be dialed in
            // alongside grain instead of needing a separate effect.
            if (!imageData) return;
            const d = imageData.data;
            const int = grainIntensity + (isFirstEffect ? audioModulation * 0.3 : 0);
            const sz = { 'fine': 0.5, 'medium': 1, 'coarse': 2, 'film': 1.5 }[grainType];
            // Block size in screen pixels each noise sample covers — was
            // always exactly 1 (a fresh Math.random() per pixel, every
            // frame). blockSize<=1 keeps that identical original loop
            // untouched rather than routing the common/default case through
            // the block-lookup path below for no reason.
            const blockSize = Math.max(1, Math.round(grainSize ?? 1));
            if (blockSize <= 1) {
              for (let i = 0; i < d.length; i += 4) {
                const n = (Math.random() - 0.5) * int * 255 * sz;
                d[i] += n; d[i + 1] += n; d[i + 2] += n;
              }
            } else {
              const blocksX = Math.ceil(displayWidth / blockSize);
              const blocksY = Math.ceil(displayHeight / blockSize);
              const blockNoise = new Float32Array(blocksX * blocksY);
              for (let b = 0; b < blockNoise.length; b++) blockNoise[b] = (Math.random() - 0.5) * int * 255 * sz;
              for (let i = 0; i < d.length; i += 4) {
                const p = i / 4;
                const x = p % displayWidth;
                const y = (p - x) / displayWidth;
                const bx = (x / blockSize) | 0;
                const by = (y / blockSize) | 0;
                const n = blockNoise[by * blocksX + bx];
                d[i] += n; d[i + 1] += n; d[i + 2] += n;
              }
            }
            putScaledImageData(imageData);

            if (dustCrackleIntensity > 0) {
              const crackleLen = dustCrackleLength ?? 1;
              const crackleColor = dustCrackleColor || '#000000';
              ctx.strokeStyle = crackleColor + Math.round(dustCrackleIntensity * 0.3 * 255).toString(16).padStart(2, '0');
              ctx.lineWidth = 1;
              const numCracks = Math.floor(20 * dustCrackleIntensity);
              for (let i = 0; i < numCracks; i++) {
                ctx.beginPath();
                let x = Math.random() * displayWidth;
                let y = Math.random() * displayHeight;
                ctx.moveTo(x, y);
                const steps = Math.floor((10 + Math.random() * 30) * crackleLen);
                for (let j = 0; j < steps; j++) {
                  x += (Math.random() - 0.5) * 20;
                  y += (Math.random() - 0.5) * 20;
                  ctx.lineTo(x, y);
                }
                ctx.stroke();
              }
            }
}
