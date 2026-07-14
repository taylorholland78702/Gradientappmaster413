export function drawVoronoi(P: any): CanvasGradient | undefined {
  const {
    structuralSeed,
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
          // Voronoi (Cellular) gradient - creates stained glass/cell structure effect
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, displayWidth, displayHeight);

          const voronoiImageData = ctx.createImageData(displayWidth, displayHeight);
          const voronoiData = voronoiImageData.data;

          // Seeded random number generator for animated pattern — structuralSeed
          // is mixed into the hash so a reroll fully relocates every cell
          // instead of only nudging them.
          const voronoiSeed = (x: number) => {
            const s = Math.sin(x * 12.9898 + voronoiCellCount * 78.233 + structuralSeed * 37.719) * 43758.5453;
            return s - Math.floor(s);
          };

          // Generate seed points with animated positions
          const voronoiSeeds: Array<{x: number, y: number, colorIndex: number}> = [];
          const voronoiAudioActive = isAudioEnabled && isAudioReactive;
          // Bass adds extra cells, treble shifts color assignment, mids add extra movement
          const audioVoronoiCount = voronoiAudioActive ? Math.floor(audioSubBassLevel * 15) : 0;
          const totalVoronoiCells = voronoiCellCount + audioVoronoiCount;
          // Treble: integer offset into palette so each beat can assign different colors
          const voronoiColorOffset = voronoiAudioActive
            ? Math.floor(audioTrebleLevel * gradientColors.length * 3) % gradientColors.length
            : 0;

          for (let i = 0; i < totalVoronoiCells; i++) {
            const baseX = voronoiSeed(i * 2) * displayWidth;
            const baseY = voronoiSeed(i * 2 + 1) * displayHeight;

            // Bass gently accelerates morph, mids add subtle extra movement
            const audioMorphBoost = voronoiAudioActive ? 1 + audioSubBassLevel * 3 : 1;
            const audioMidShift = voronoiAudioActive ? audioMidsLevel * 0.1 : 0;
            const offsetX = Math.sin(voronoiAnimTime * audioMorphBoost + i * 0.5 + audioMidShift) * displayWidth * 0.18;
            const offsetY = Math.cos(voronoiAnimTime * audioMorphBoost + i * 0.7 + audioMidShift) * displayHeight * 0.18;

            voronoiSeeds.push({
              x: baseX + offsetX,
              y: baseY + offsetY,
              colorIndex: i % gradientColors.length
            });
          }

          const audioVoronoiDistortion = voronoiAudioActive ? audioSubBassLevel * 80 : 0;
          const totalVoronoiDistortion = (voronoiDistortion + audioVoronoiDistortion) * 0.01;
          const vMaxDist = Math.sqrt(centerX ** 2 + centerY ** 2);
          const voronoiBassPulse = voronoiAudioActive ? audioSubBassLevel : 0;

          for (let vy = 0; vy < displayHeight; vy++) {
            for (let vx = 0; vx < displayWidth; vx++) {
              let minDist = Infinity;
              let nearestSeed = voronoiSeeds[0];

              voronoiSeeds.forEach(seed => {
                const dx = vx - seed.x;
                const dy = vy - seed.y;
                const distortion = totalVoronoiDistortion * (Math.sin(dx * 0.01) * Math.cos(dy * 0.01)) * 100;
                const dist = Math.sqrt(dx * dx + dy * dy) + distortion;
                if (dist < minDist) { minDist = dist; nearestSeed = seed; }
              });

              // Use solid palette colors — shift index on treble for color cycling
              const vColorIdx = (nearestSeed.colorIndex + voronoiColorOffset) % gradientColors.length;
              const color = gradientColors[vColorIdx];
              if (!color) continue;

              const vdx = vx - centerX, vdy = vy - centerY;
              const vDist = Math.sqrt(vdx * vdx + vdy * vdy);
              // Radial pulse + uniform flash on strong bass hits
              const vBoost = 1 + voronoiBassPulse * (1 - vDist / vMaxDist) * 0.9;

              const idx = (vy * displayWidth + vx) * 4;
              voronoiData[idx]     = Math.min(255, Math.round(color.r * vBoost));
              voronoiData[idx + 1] = Math.min(255, Math.round(color.g * vBoost));
              voronoiData[idx + 2] = Math.min(255, Math.round(color.b * vBoost));
              voronoiData[idx + 3] = 255;
            }
          }
        
          putScaledImageData(voronoiImageData);
  return gradient;
}
