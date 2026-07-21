export function drawFlowField(P: any): CanvasGradient | undefined {
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
    getDisplayImageData
  } = P;
  let gradient: CanvasGradient | undefined;
          // Particles drift along a smoothly-varying pseudo-noise direction
          // field, leaving fading trails in a persistent buffer — the only
          // gradient in the app whose motion drifts rather than rotates/pulses.
          if (canvas.width === 0 || canvas.height === 0) return gradient;
          if (!flowBufferRef.current || flowBufferRef.current.width !== displayWidth || flowBufferRef.current.height !== displayHeight) {
            flowBufferRef.current = document.createElement('canvas');
            flowBufferRef.current.width = displayWidth;
            flowBufferRef.current.height = displayHeight;
            flowParticlesRef.current = [];
          }
          const fbCtx = flowBufferRef.current.getContext('2d')!;
          const targetCount = Math.max(10, Math.min(1000, flowParticleCount));
          const particles = flowParticlesRef.current;
          while (particles.length < targetCount) {
            particles.push({ x: Math.random() * displayWidth, y: Math.random() * displayHeight });
          }
          if (particles.length > targetCount) particles.length = targetCount;

          // Bass speeds up particle drift (longer step per frame), treble
          // thickens the trail stroke — energy would work too but bass reads
          // as more physical for "the flow surges."
          const flowAudio = isAudioEnabled && isAudioReactive;
          const flowSpeedMod = flowAudio ? 1 + audioSubBassLevel * 1.2 : 1;
          const flowThicknessMod = flowAudio ? 1 + audioTrebleLevel * 0.8 : 1;
          fbCtx.fillStyle = 'rgba(0,0,0,0.06)';
          fbCtx.fillRect(0, 0, displayWidth, displayHeight);
          const fScale = flowScale * 0.004;
          const fTime = flowAnimTime;
          for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            const angle = (Math.sin(p.x * fScale + fTime) * Math.cos(p.y * fScale - fTime * 0.8)
              + Math.sin((p.x + p.y) * fScale * 0.5 + fTime * 0.5)) * Math.PI;
            const nx = p.x + Math.cos(angle) * 1.5 * flowSpeedMod;
            const ny = p.y + Math.sin(angle) * 1.5 * flowSpeedMod;
            const color = gradientColors[i % gradientColors.length] || { r: 255, g: 255, b: 255 };
            fbCtx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`;
            fbCtx.lineWidth = flowThickness * flowThicknessMod;
            fbCtx.beginPath();
            fbCtx.moveTo(p.x, p.y);
            fbCtx.lineTo(nx, ny);
            fbCtx.stroke();
            p.x = nx < 0 ? displayWidth : nx > displayWidth ? 0 : nx;
            p.y = ny < 0 ? displayHeight : ny > displayHeight ? 0 : ny;
          }
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, displayWidth, displayHeight);
          ctx.drawImage(flowBufferRef.current, 0, 0);
  return gradient;
}
