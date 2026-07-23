import { getScratchCanvas } from '../../utils/scratchCanvas';

export function applyChromaticTrails(P: any): void {
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
            // Feedback's echo-trail mechanic, plus a per-channel spatial offset
            // on the decaying trail so echoes separate into RGB fringes as they
            // fade — distinct from Feedback (no fringing) and from Chromatic
            // (no trail/decay).
            if (canvas.width === 0 || canvas.height === 0) return;
            if (!chromaticTrailsBufferRef.current || chromaticTrailsBufferRef.current.width !== displayWidth || chromaticTrailsBufferRef.current.height !== displayHeight) {
              chromaticTrailsBufferRef.current = document.createElement('canvas');
              chromaticTrailsBufferRef.current.width = displayWidth;
              chromaticTrailsBufferRef.current.height = displayHeight;
            }
            const ctBuf = chromaticTrailsBufferRef.current;
            const ctBufCtx = ctBuf.getContext('2d', { willReadFrequently: true })!;
            const ctBufData = ctBufCtx.getImageData(0, 0, displayWidth, displayHeight);
            const ctBd = ctBufData.data;
            const ctOff = Math.round(chromaticTrailsOffset);

            // Fringe + decay the trail: R sampled from the left, B from the
            // right, G stays put, alpha scaled down by the decay factor.
            const ctFringed = ctx.createImageData(displayWidth, displayHeight);
            const ctFd = ctFringed.data;
            for (let y = 0; y < displayHeight; y++) {
              for (let x = 0; x < displayWidth; x++) {
                const i = (y * displayWidth + x) * 4;
                const rx = Math.max(0, Math.min(displayWidth - 1, x - ctOff));
                const bx = Math.max(0, Math.min(displayWidth - 1, x + ctOff));
                const ri = (y * displayWidth + rx) * 4;
                const bi = (y * displayWidth + bx) * 4;
                ctFd[i] = ctBd[ri];
                ctFd[i + 1] = ctBd[i + 1];
                ctFd[i + 2] = ctBd[bi + 2];
                ctFd[i + 3] = Math.round(ctBd[i + 3] * chromaticTrailsDecay);
              }
            }
            ctBufCtx.putImageData(ctFringed, 0, 0);

            const ctTmp = getScratchCanvas('chromaticTrailsTmp', displayWidth, displayHeight);
            ctTmp.getContext('2d')!.drawImage(canvas, 0, 0, displayWidth, displayHeight);

            ctx.clearRect(0, 0, displayWidth, displayHeight);
            ctx.drawImage(ctBuf, 0, 0);
            ctx.globalCompositeOperation = 'lighten';
            ctx.drawImage(ctTmp, 0, 0);
            ctx.globalCompositeOperation = 'source-over';

            // Feed the fresh (undecayed) frame back into the trail buffer.
            ctBufCtx.globalCompositeOperation = 'lighten';
            ctBufCtx.drawImage(ctTmp, 0, 0);
            ctBufCtx.globalCompositeOperation = 'source-over';
}
