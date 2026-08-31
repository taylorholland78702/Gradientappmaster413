export function drawShapes(P: any): CanvasGradient | undefined {
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
    shapesMode,
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
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, displayWidth, displayHeight);

          if (shapesMode === 'polar-grid') {
            // Former standalone Polar Grid gradient, folded in as a Shapes
            // mode: circular concentric rings, each subdivided into
            // polygon2Sides angular sectors, colored by (sector+ring) so
            // adjacent cells never repeat the same color. Ring radius is
            // proportional to maxRadius (always reaches it at the outer
            // ring) rather than Shapes' own absolute-pixel ring width, which
            // is what let this mode's rings always fill the canvas
            // regardless of ring count — kept exactly as-is rather than
            // reusing Shapes' own radius system.
            const audioRotation = (isAudioEnabled && isAudioReactive)
              ? audioTrebleLevel * 5 // Treble barely rotates (±5°)
              : 0;
            const solidSides = Math.max(1, polygon2Sides);
            const solidAnglePerSide = 360 / solidSides;
            const solidSectorHalf = Math.PI / solidSides;
            const polygonRingCount = concentricRingCount;

            for (let ring = polygonRingCount; ring >= 0; ring--) {
              const ringRadius = maxRadius * (ring / polygonRingCount);

              for (let i = 0; i < solidSides; i++) {
                const angle = (i * solidAnglePerSide + gradientAngle + audioRotation) * (Math.PI / 180);
                const colorIndex = (i + ring) % gradientColors.length;
                const color = gradientColors[colorIndex];
                if (!color) continue;

                ctx.save();
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                // Extend the arc to overlap slightly and prevent gaps
                const angleStart = angle - solidSectorHalf - 0.01;
                const angleEnd = angle + solidSectorHalf + 0.01;
                ctx.arc(centerX, centerY, ringRadius, angleStart, angleEnd);
                ctx.closePath();
                ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
                ctx.fill();
                ctx.restore();
              }
            }
            return gradient;
          }

          // Create concentric polygons with variable sides
          const shapesScale = (isAudioEnabled && isAudioReactive) ? 1 : 1 / zoom;
          // Bass pulses ring width slightly; cap so count and rotate sliders stay effective
          const audioShapeRingWidth = (isAudioEnabled && isAudioReactive)
            ? audioSubBassLevel * 20
            : 0;
          const shapeRingWidth = (concentricRingWidth + audioShapeRingWidth) * shapesScale;
          // Always respect shapesCount slider regardless of audio
          const numShapeRings = shapesCount;
          // concentricRingWidth/shapesCount are independent px-based sliders
          // (30-179px, 3-32 rings) with no relation to the actual canvas
          // size — a low width with few rings can leave the outermost ring
          // just a tiny circle in the center, with the rest of the canvas
          // showing nothing but the black fill below. Only ever scales UP
          // (never down), so combinations that already fill the canvas
          // reasonably are untouched.
          const uncappedOuterRadius = (numShapeRings - 1) * shapeRingWidth;
          const fillScale = uncappedOuterRadius > 0 ? Math.max(1, (fitRadius * shapesScale) / uncappedOuterRadius) : 1;
          const effectiveRingWidth = shapeRingWidth * fillScale;

          for (let i = numShapeRings - 1; i >= 0; i--) {
            const radius = i * effectiveRingWidth;
            if (radius <= 0) continue;
          
            // Static color assignment based on ring index
            const colorIndex = i % gradientColors.length;
            const color = gradientColors[colorIndex];
          
            // Safety check
            if (!color) continue;
          
            // Draw solid color polygon
            ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
            ctx.beginPath();
          
            if (shapesSides === 1) {
              // Dot (circle)
              ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            } else if (shapesSides === 2) {
              // Line (vertical line with thickness = radius)
              ctx.rect(centerX - radius, centerY - displayHeight * 2, radius * 2, displayHeight * 4);
            } else {
              // Polygon (3+ sides) — rotation follows the same playhead-driven
              // angle every other gradient type uses, instead of its own
              // redundant rotation state/direction controls.
              const angleStep = (Math.PI * 2) / shapesSides;
              const rotationRadians = (gradientAngle * Math.PI) / 180;
              const startAngle = -Math.PI / 2 + rotationRadians; // Start from top + rotation

              for (let j = 0; j <= shapesSides; j++) {
                const angle = startAngle + angleStep * j;
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;
              
                if (j === 0) {
                  ctx.moveTo(x, y);
                } else {
                  ctx.lineTo(x, y);
                }
              }
              ctx.closePath();
            }
          
            ctx.fill();
          }
  return gradient;
}
