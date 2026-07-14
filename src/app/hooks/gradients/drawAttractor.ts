export function drawAttractor(P: any): CanvasGradient | undefined {
  const {
    attractorTrailFade,
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
    attractorDotSize,
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
          // De Jong strange attractor: a handful of independent walkers each
          // iterate the same 2D map many times per frame, scattering points
          // into a persistent fading-trail buffer (same buffer/fade mechanic
          // as Flow Field above). The map's a/b/c/d parameters drift slowly
          // via attractorAnimTime so the lace pattern keeps morphing rather
          // than settling into one static shape.
          if (canvas.width === 0 || canvas.height === 0) return gradient;
          if (!attractorBufferRef.current || attractorBufferRef.current.width !== displayWidth || attractorBufferRef.current.height !== displayHeight) {
            attractorBufferRef.current = document.createElement('canvas');
            attractorBufferRef.current.width = displayWidth;
            attractorBufferRef.current.height = displayHeight;
            attractorPointsRef.current = [];
          }
          const abCtx = attractorBufferRef.current.getContext('2d')!;
          const targetPoints = Math.max(1, Math.min(20, Math.round(attractorPointCount)));
          const points = attractorPointsRef.current;
          while (points.length < targetPoints) {
            points.push({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1 });
          }
          if (points.length > targetPoints) points.length = targetPoints;

          const at = attractorAnimTime;
          const pa = 1.4 + Math.sin(at * 0.13) * 0.9;
          const pb = -2.3 + Math.cos(at * 0.09) * 0.9;
          const pc = 2.4 + Math.sin(at * 0.07) * 0.9;
          const pd = -2.1 + Math.cos(at * 0.11) * 0.9;

          abCtx.fillStyle = `rgba(0,0,0,${attractorTrailFade})`;
          abCtx.fillRect(0, 0, displayWidth, displayHeight);

          const attractorCenterX = displayWidth / 2;
          const attractorCenterY = displayHeight / 2;
          const scaleFactor = (Math.min(displayWidth, displayHeight) / 4.2) * attractorScale;
          const stepsPerFrame = 150;
          const dotSize = Math.max(0.5, attractorDotSize);
          const dotOffset = dotSize / 2;
          for (let i = 0; i < points.length; i++) {
            const p = points[i];
            const color = gradientColors[i % gradientColors.length] || { r: 255, g: 255, b: 255 };
            abCtx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`;
            let px = p.x, py = p.y;
            for (let s = 0; s < stepsPerFrame; s++) {
              const nx = Math.sin(pa * py) - Math.cos(pb * px);
              const ny = Math.sin(pc * px) - Math.cos(pd * py);
              px = nx; py = ny;
              abCtx.fillRect(attractorCenterX + px * scaleFactor - dotOffset, attractorCenterY + py * scaleFactor - dotOffset, dotSize, dotSize);
            }
            p.x = px; p.y = py;
          }

          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, displayWidth, displayHeight);
          ctx.drawImage(attractorBufferRef.current, 0, 0);
  return gradient;
}
