export function drawGrid(P: any): CanvasGradient | undefined {
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
    gridCellAngleStep,
    gridColumns,
    gridHardEdge,
    gridMode,
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

          if (gridMode === 'martin') {
            // Agnes Martin: a pale wash (each palette color blended
            // heavily toward white in horizontal bands) with a fine
            // hairline grid laid over it — restrained, near-monochrome,
            // meditative repetition instead of Classic mode's saturated
            // per-cell gradient mosaic. Reuses gridRows/gridColumns for
            // hairline density; mids nudge line opacity gently rather
            // than driving any motion.
            if (!gradientColors || gradientColors.length === 0) return gradient;
            const martinRows = Math.max(2, gridRows);
            const martinCols = Math.max(2, gridColumns);
            const bandHeight = displayHeight / martinRows;
            const wash = 0.85;
            for (let row = 0; row < martinRows; row++) {
              const color = gradientColors[row % gradientColors.length];
              if (!color) continue;
              const r = Math.round(color.r + (255 - color.r) * wash);
              const g = Math.round(color.g + (255 - color.g) * wash);
              const b = Math.round(color.b + (255 - color.b) * wash);
              ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
              ctx.fillRect(0, row * bandHeight, displayWidth, bandHeight + 1);
            }

            const martinAudioActive = isAudioEnabled && isAudioReactive;
            const martinPulse = martinAudioActive ? audioMidsLevel * 0.15 : 0;
            ctx.strokeStyle = `rgba(40, 40, 40, ${0.18 + martinPulse})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let row = 0; row <= martinRows; row++) {
              const y = Math.round(row * bandHeight) + 0.5;
              ctx.moveTo(0, y);
              ctx.lineTo(displayWidth, y);
            }
            const colWidth = displayWidth / martinCols;
            for (let col = 0; col <= martinCols; col++) {
              const x = Math.round(col * colWidth) + 0.5;
              ctx.moveTo(x, 0);
              ctx.lineTo(x, displayHeight);
            }
            ctx.stroke();
            return gradient;
          }

          // Grid pattern with customizable rows and columns
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, displayWidth, displayHeight);

          ctx.save();
          ctx.translate(centerX, centerY);
          const gridZoom = (isAudioEnabled && isAudioReactive) ? 1 : zoom;
          ctx.scale(gridZoom, gridZoom);
          ctx.translate(-centerX, -centerY);

          // Audio reactivity: bass affects gradient animation in cells.
          // Clamped for the same reason as audioAdjustedAngle above —
          // audioSubBassLevel isn't naturally 0-1.
          const audioGridOffset = (isAudioEnabled && isAudioReactive)
            ? Math.min(1, audioSubBassLevel) * 360 : 0;

          // Expand draw area to cover canvas when zoomed out
          const gridOverdraw = Math.max(1, 1 / gridZoom);
          const gridDrawW = displayWidth * gridOverdraw;
          const gridDrawH = displayHeight * gridOverdraw;
          const gridOffX = (displayWidth - gridDrawW) / 2;
          const gridOffY = (displayHeight - gridDrawH) / 2;
          // Clamp to 2+ — 1x1 degenerates into a single full-canvas cell
          // that's visually indistinguishable from the Linear gradient type,
          // wasting the slider on a redundant look. Guards old saved
          // presets/localStorage from before this floor existed too.
          const gridRowsSafe = Math.max(2, gridRows);
          const gridColumnsSafe = Math.max(2, gridColumns);
          const cellWidth = gridDrawW / gridColumnsSafe;
          const cellHeight = gridDrawH / gridRowsSafe;

          for (let row = 0; row < gridRowsSafe; row++) {
            for (let col = 0; col < gridColumnsSafe; col++) {
              const cellAngleStep = gridCellAngleStep ?? 30;
              const cellAngle = (gradientAngle + row * cellAngleStep + col * cellAngleStep + audioGridOffset) % 360;
              const angleRad = (cellAngle * Math.PI) / 180;
              const cellCenterX = gridOffX + col * cellWidth + cellWidth / 2;
              const cellCenterY = gridOffY + row * cellHeight + cellHeight / 2;
              const gradLength = Math.max(cellWidth, cellHeight);
              const x1 = cellCenterX - Math.cos(angleRad) * gradLength / 2;
              const y1 = cellCenterY - Math.sin(angleRad) * gradLength / 2;
              const x2 = cellCenterX + Math.cos(angleRad) * gradLength / 2;
              const y2 = cellCenterY + Math.sin(angleRad) * gradLength / 2;
              if (gridHardEdge) {
                // Fills the whole cell with one flat color (the same color
                // that would have led its blend) instead of a per-cell
                // gradient — turns the field of tiny gradients into a
                // solid-color mosaic, each cell a hard-edged tile.
                const flatColor = gradientColors[(row + col) % gradientColors.length];
                if (flatColor) {
                  ctx.fillStyle = `rgb(${flatColor.r}, ${flatColor.g}, ${flatColor.b})`;
                  ctx.fillRect(gridOffX + col * cellWidth, gridOffY + row * cellHeight, Math.ceil(cellWidth) + 1, Math.ceil(cellHeight) + 1);
                }
              } else {
                const cellGrad = ctx.createLinearGradient(x1, y1, x2, y2);
                for (let j = 0; j < gradientColors.length; j++) {
                  const cellColor = gradientColors[(j + row + col) % gradientColors.length];
                  if (!cellColor) continue;
                  cellGrad.addColorStop(j / (gradientColors.length - 1),
                    `rgb(${cellColor.r}, ${cellColor.g}, ${cellColor.b})`);
                }
                ctx.fillStyle = cellGrad;
                ctx.fillRect(gridOffX + col * cellWidth, gridOffY + row * cellHeight, Math.ceil(cellWidth) + 1, Math.ceil(cellHeight) + 1);
              }
            }
          }
          ctx.restore();
  return gradient;
}
