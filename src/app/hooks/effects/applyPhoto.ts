export function applyPhoto(P: any): void {
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
            // Blends the user-uploaded photo over the gradient. Cover-fit
            // (scale to fill, center-cropped) like a CSS background-size:cover,
            // rather than stretching to the canvas's aspect ratio. A no-op
            // until an image has actually been uploaded — see photoImageRef.
            if (canvas.width === 0 || canvas.height === 0) return;
            const photoImg = photoImageRef.current;
            if (!photoImg) return;
            // Audio-reactive: bass pulses the image's scale, treble adds a
            // brief opacity boost on top of the base slider, mids drive a
            // rotation wobble AND a pan — same live levels (and the same
            // isAudioEnabled && isAudioReactive gate) every other reactive
            // effect in this pipeline already reads. Sits at rest (scale 1,
            // no rotation, no pan, no boost) whenever audio isn't actively
            // driving anything, so a photo with no audio playing looks
            // identical to before this was added.
            //
            // The image is always drawn cover-fit (overflowing the canvas
            // in one dimension — see below), so scale alone was nearly
            // invisible: growing an already-overflowing image just pushes
            // more of it further outside the visible frame without
            // changing what's on screen. The pan (audioPanX/Y) is what
            // actually reads as motion, since shifting a cover-fit image
            // changes which part of it is currently in frame; scale and
            // rotation are kept too, but boosted, for corner/edge motion.
            const photoAudioActive = isAudioEnabled && isAudioReactive;
            const photoAudioScale = photoAudioActive ? 1 + Math.min(1, audioSubBassLevel) * 0.4 : 1;
            const photoAudioOpacityBoost = photoAudioActive ? Math.min(1, audioTrebleLevel) * 0.25 : 0;
            const photoAudioRotateDeg = photoAudioActive ? Math.min(1, audioMidsLevel) * 6 : 0;
            const photoAudioPanX = photoAudioActive ? Math.min(1, audioMidsLevel) * displayWidth * 0.06 : 0;
            const photoAudioPanY = photoAudioActive ? Math.min(1, audioTrebleLevel) * displayHeight * 0.06 : 0;
            ctx.save();
            ctx.globalAlpha = Math.max(0, Math.min(1, photoOpacity / 100 + photoAudioOpacityBoost));
            ctx.globalCompositeOperation = photoBlendMode;
            const canvasAspect = displayWidth / displayHeight;
            const imgAspect = photoImg.width / photoImg.height;
            let dw, dh, dx, dy;
            if (imgAspect > canvasAspect) {
              dh = displayHeight;
              dw = dh * imgAspect;
              dx = (displayWidth - dw) / 2;
              dy = 0;
            } else {
              dw = displayWidth;
              dh = dw / imgAspect;
              dx = 0;
              dy = (displayHeight - dh) / 2;
            }
            if (photoAudioActive) {
              // Plain cover-fit only overflows the canvas along ONE axis
              // (whichever one isn't the aspect-ratio-limiting dimension —
              // dh===displayHeight exactly in one branch above, dw===
              // displayWidth exactly in the other), so panning along the
              // other axis would immediately expose a gap at that edge.
              // A flat 25% overscan on both dimensions here (audio-active
              // only, so a photo with no audio playing keeps the original
              // precise cover-fit) guarantees margin on both axes for the
              // pan/rotate/scale below to move within.
              const overscan = 1.25;
              dw *= overscan;
              dh *= overscan;
              dx = (displayWidth - dw) / 2;
              dy = (displayHeight - dh) / 2;
              ctx.translate(displayWidth / 2 + photoAudioPanX, displayHeight / 2 + photoAudioPanY);
              ctx.rotate(photoAudioRotateDeg * (Math.PI / 180));
              ctx.scale(photoAudioScale, photoAudioScale);
              ctx.translate(-displayWidth / 2, -displayHeight / 2);
            }
            ctx.drawImage(photoImg, dx, dy, dw, dh);
            ctx.restore();
}
