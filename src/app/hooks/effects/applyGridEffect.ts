export function applyGridEffect(P: any): void {
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
            if (canvas.width === 0 || canvas.height === 0) return;
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = displayWidth;
            tempCanvas.height = displayHeight;
            const gCtx = tempCanvas.getContext('2d');
            if (!gCtx) return;
            gCtx.drawImage(canvas, 0, 0, displayWidth, displayHeight);
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, displayWidth, displayHeight);
            const gridRowsSafeFx = Math.max(2, gridRows);
            const gridColumnsSafeFx = Math.max(2, gridColumns);
            const cw = displayWidth / gridColumnsSafeFx, ch = displayHeight / gridRowsSafeFx;
            for (let r = 0; r < gridRowsSafeFx + 1; r++) {
              for (let c = 0; c < gridColumnsSafeFx + 1; c++) {
                const x = c * cw, y = r * ch;
                const vx = gridVariation > 0 ? (Math.random() - 0.5) * cw * gridVariation : 0;
                const vy = gridVariation > 0 ? (Math.random() - 0.5) * ch * gridVariation : 0;
                const cx = x + cw / 2 + vx, cy = y + ch / 2 + vy;
                const rad = Math.min(cw, ch) / 2 * (gridShapeSize / 25) * (gridVariation > 0 ? 1 + (Math.random() - 0.5) * gridVariation * 0.5 : 1);
                const scx = Math.min(Math.max(0, cx), displayWidth - 1);
                const scy = Math.min(Math.max(0, cy), displayHeight - 1);
                const sex = Math.min(Math.max(0, x), displayWidth - 1);
                const sey = Math.min(Math.max(0, y), displayHeight - 1);
                let cc = '#000', ec = '#000';
                try {
                  const cp = gCtx.getImageData(scx, scy, 1, 1).data;
                  cc = `rgb(${cp[0]},${cp[1]},${cp[2]})`;
                  const ep = gCtx.getImageData(sex, sey, 1, 1).data;
                  ec = `rgb(${ep[0]},${ep[1]},${ep[2]})`;
                } catch (e) { cc = '#000'; ec = '#333'; }
                const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
                g.addColorStop(0, cc);
                g.addColorStop(1, ec);
                ctx.fillStyle = g;
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate((gridRotation * Math.PI) / 180 + (gridVariation > 0 ? Math.random() * gridVariation * Math.PI : 0));
                ctx.translate(-cx, -cy);
                ctx.beginPath();
                if (gridSides === 1) {
                  // Dot (circle)
                  ctx.arc(cx, cy, rad, 0, Math.PI * 2);
                } else if (gridSides === 2) {
                  // Line (vertical line with thickness = rad)
                  ctx.rect(cx - rad, cy - displayHeight * 2, rad * 2, displayHeight * 4);
                } else if (gridSides > 2) {
                  // Polygon (3+ sides)
                  for (let i = 0; i < gridSides; i++) {
                    const a = (i * 2 * Math.PI / gridSides) - (gridSides % 2 === 1 ? Math.PI / 2 : 0);
                    const px = cx + rad * Math.cos(a), py = cy + rad * Math.sin(a);
                    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                  }
                }
                ctx.closePath();
                ctx.fill();
                ctx.restore();
              }
            }
}
