export function drawFlower(P: any): CanvasGradient | undefined {
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
    flowerOpacity,
    flowerRotation,
    flowerScale,
    flowerSpread,
    flowerSymmetry,
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
    getDisplayImageData
  } = P;
  let gradient: CanvasGradient | undefined;
          // Flower of Life - sacred geometry pattern with overlapping circles
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, displayWidth, displayHeight);

          ctx.save();
          // Treble spins the flower; bass pulses the radius; mids add extra layers
          const audioFlowerRotationBoost = (isAudioEnabled && isAudioReactive) ? audioTrebleLevel * 8 : 0;
          ctx.translate(centerX, centerY);
          ctx.rotate(((flowerRotation + flowerAnimTime + audioFlowerRotationBoost) * Math.PI) / 180);
          ctx.translate(-centerX, -centerY);

          const audioFlowerScale = (isAudioEnabled && isAudioReactive) ? 1 + audioSubBassLevel * 0.12 : 1;
          const baseRadius = Math.min(displayWidth, displayHeight) / 6 * flowerScale * audioFlowerScale;
          const circles: Array<{x: number, y: number, colorIndex: number}> = [];

          // Center circle
          circles.push({x: centerX, y: centerY, colorIndex: 0});

          // Bass beats add an extra layer temporarily
          const audioLayerBoost = (isAudioEnabled && isAudioReactive) && audioSubBassLevel > 0.65 ? 1 : 0;
          // Create hexagonal pattern of overlapping circles
          const layers = flowerCircles + audioLayerBoost;
          const symmetry = flowerSymmetry ?? 6;
          for (let layer = 1; layer <= layers; layer++) {
            const circlesInLayer = layer * symmetry;
            const angleStep = (Math.PI * 2) / circlesInLayer;
            const layerRadius = baseRadius * layer * flowerSpread;

            for (let i = 0; i < circlesInLayer; i++) {
              const angle = angleStep * i;
              const x = centerX + Math.cos(angle) * layerRadius;
              const y = centerY + Math.sin(angle) * layerRadius;
              circles.push({x, y, colorIndex: (layer + i) % gradientColors.length});
            }
          }

          // Draw all circles with gradient colors
          circles.forEach((circle, idx) => {
            const color = gradientColors[circle.colorIndex % gradientColors.length];
            if (!color) return;

            // Create radial gradient for each circle
            const opacity = flowerOpacity ?? 1;
            const grad = ctx.createRadialGradient(circle.x, circle.y, 0, circle.x, circle.y, baseRadius);
            grad.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${Math.min(1, 0.8 * opacity)})`);
            grad.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, ${Math.min(1, 0.2 * opacity)})`);

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(circle.x, circle.y, baseRadius, 0, Math.PI * 2);
            ctx.fill();

            // Draw circle outline
            ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${Math.min(1, 0.5 * opacity)})`;
            ctx.lineWidth = 2;
            ctx.stroke();
          });

          ctx.restore();
  return gradient;
}
