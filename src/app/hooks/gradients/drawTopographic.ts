export function drawTopographic(P: any): CanvasGradient | undefined {
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
          // Posterized noise field with a dark contour line drawn at every band
          // boundary — same idea as elevation-line maps. Deliberately a
          // simpler, self-contained noise formula (not sharing Noise's own
          // sliders) so Topographic has its own independent Scale/Bands/Line
          // controls rather than fighting over shared state.
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, displayWidth, displayHeight);
          const topoImageData = ctx.createImageData(displayWidth, displayHeight);
          const topoData = topoImageData.data;
          const topoCX = displayWidth / 2, topoCY = displayHeight / 2;
          const topoScaleFactor = topographicScale * 0.001;
          const topoBands = Math.max(2, Math.round(topographicBands));
          const topoLineWidth = topographicLineWidth;
          const topoAudioActive = isAudioEnabled && isAudioReactive;
          const topoColorShift = topoAudioActive ? audioTrebleLevel * 0.4 : 0;
          // A slow drift tied to gradientAngle so the field isn't perfectly
          // static — matches how other gradients keep moving under auto-play.
          const topoPhase = gradientAngle * 0.01;

          for (let ty = 0; ty < displayHeight; ty++) {
            for (let tx = 0; tx < displayWidth; tx++) {
              const dx = tx - topoCX, dy = ty - topoCY;
              const n1 = Math.sin(dx * topoScaleFactor + topoPhase) * Math.cos(dy * topoScaleFactor * 1.15 - topoPhase);
              const n2 = Math.sin((dx + dy) * topoScaleFactor * 0.5) * 0.5;
              const n3 = Math.cos((dx - dy) * topoScaleFactor * 0.37) * 0.35;
              const raw = (n1 + n2 + n3) / 1.85;
              const elevation = (raw + 1) / 2;

              const bandPos = elevation * topoBands;
              const bandIdx = Math.floor(bandPos);
              const bandFrac = bandPos - bandIdx;
              const distToLine = Math.min(bandFrac, 1 - bandFrac);

              const t = ((bandIdx / topoBands) + topoColorShift) % 1;
              const colorPos = t * (gradientColors.length - 1);
              const colorIdx = Math.floor(colorPos);
              const colorFrac = colorPos - colorIdx;
              const c1 = gradientColors[colorIdx] || gradientColors[0];
              const c2 = gradientColors[Math.min(colorIdx + 1, gradientColors.length - 1)] || c1;
              let r = c1.r + (c2.r - c1.r) * colorFrac;
              let g = c1.g + (c2.g - c1.g) * colorFrac;
              let b = c1.b + (c2.b - c1.b) * colorFrac;

              if (distToLine < topoLineWidth) {
                const lineMix = 1 - (distToLine / topoLineWidth);
                r *= (1 - lineMix * 0.85);
                g *= (1 - lineMix * 0.85);
                b *= (1 - lineMix * 0.85);
              }

              const idx = (ty * displayWidth + tx) * 4;
              topoData[idx] = Math.round(Math.min(255, Math.max(0, r)));
              topoData[idx + 1] = Math.round(Math.min(255, Math.max(0, g)));
              topoData[idx + 2] = Math.round(Math.min(255, Math.max(0, b)));
              topoData[idx + 3] = 255;
            }
          }
          putScaledImageData(topoImageData);
  return gradient;
}
