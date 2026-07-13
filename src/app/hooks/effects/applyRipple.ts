export function applyRipple(P: any): void {
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
            // Beat-triggered expanding circular wave distortion
            if (canvas.width === 0 || canvas.height === 0) return;
            try {
              const bassSig = isAudioReactive ? audioSubBassLevel / 5 : 0;
              const bassThreshold = 0.35;
              if (isAudioReactive) {
                if (bassSig > bassThreshold && prevBassForRippleRef.current <= bassThreshold) {
                  rippleRingsRef.current.push({ phase: 0, strength: bassSig });
                  if (rippleRingsRef.current.length > 6) rippleRingsRef.current.shift();
                }
                prevBassForRippleRef.current = bassSig;
              } else if (isAutoModeRef.current || isVCRPlayingRef.current) {
                // No audio to drive this off of — pulse rings on a fixed interval
                // instead, so the effect isn't completely inert without audio input.
                rippleAutoFrameRef.current += 1;
                if (rippleAutoFrameRef.current > 90) {
                  rippleAutoFrameRef.current = 0;
                  rippleRingsRef.current.push({ phase: 0, strength: 0.6 });
                  if (rippleRingsRef.current.length > 6) rippleRingsRef.current.shift();
                }
              }
              rippleRingsRef.current.forEach(r => { r.phase += 0.018; });
              rippleRingsRef.current = rippleRingsRef.current.filter(r => r.phase < 1.0);

              if (rippleRingsRef.current.length === 0) return;
              const ripSrc = getDisplayImageData();
              const ripOut = ctx.createImageData(displayWidth, displayHeight);
              const ripCx = displayWidth / 2, ripCy = displayHeight / 2;
              const ripMaxR = Math.sqrt(ripCx * ripCx + ripCy * ripCy);
              for (let y = 0; y < displayHeight; y++) {
                for (let x = 0; x < displayWidth; x++) {
                  const dx = x - ripCx, dy = y - ripCy;
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  const norm = dist / ripMaxR;
                  let totalOffset = 0;
                  for (const ring of rippleRingsRef.current) {
                    const ringDist = norm - ring.phase;
                    const ringWidth = 0.1;
                    if (Math.abs(ringDist) < ringWidth) {
                      const profile = Math.cos((ringDist / ringWidth) * Math.PI * 0.5);
                      totalOffset += profile * ring.strength * rippleAmplitude * (1 - ring.phase * 0.9);
                    }
                  }
                  let srcX = x, srcY = y;
                  if (totalOffset !== 0 && dist > 1) {
                    // Radial displacement alone is invisible on gradients whose color
                    // only varies with angle (e.g. Angle/Fade) since moving a pixel
                    // along its own radius doesn't change its color at all. Adding a
                    // tangential (perpendicular) component makes the ripple visible
                    // on angle-based gradients too, not just radially-varying ones.
                    const tx = -dy / dist, ty = dx / dist;
                    srcX = x + (dx / dist) * totalOffset + tx * totalOffset * 0.6;
                    srcY = y + (dy / dist) * totalOffset + ty * totalOffset * 0.6;
                  }
                  const clampedX = Math.max(0, Math.min(displayWidth - 1, Math.round(srcX)));
                  const clampedY = Math.max(0, Math.min(displayHeight - 1, Math.round(srcY)));
                  const di = (y * displayWidth + x) * 4;
                  const si = (clampedY * displayWidth + clampedX) * 4;
                  ripOut.data[di] = ripSrc.data[si]; ripOut.data[di+1] = ripSrc.data[si+1];
                  ripOut.data[di+2] = ripSrc.data[si+2]; ripOut.data[di+3] = 255;
                }
              }
              putScaledImageData(ripOut);
            } catch(e) { /* skip */ }
}
