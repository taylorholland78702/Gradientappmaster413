import { getScratchImageData } from '../../utils/scratchCanvas';

export function applyBlur(P: any): void {
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
            if (blurType === 'gaussian') {
              // Canvas filter-blur samples transparency beyond the source's
              // edges, so drawing the source at its native size leaves a thin
              // unblurred/faded seam right at the border. Overdrawing slightly
              // past the edges (a tiny zoom of the same source) gives the blur
              // kernel real pixel data out there instead, so the visible frame
              // is blurred edge-to-edge with no seam.
              const gaussAmt = blurGaussianAmount + (isFirstEffect ? audioModulation * 10 : 0);
              const gaussPad = gaussAmt * 2;
              ctx.filter = `blur(${gaussAmt}px)`;
              ctx.drawImage(canvas, -gaussPad, -gaussPad, displayWidth + gaussPad * 2, displayHeight + gaussPad * 2);
              ctx.filter = 'none';
            } else if (blurType === 'motion') {
              const amt = blurMotionAmount + (isFirstEffect ? audioModulation * 10 : 0);
              const rad = (blurMotionDirection * Math.PI) / 180;
              const iterations = Math.max(10, Math.floor(10 + amt / 2));
              const ox = Math.cos(rad) * amt, oy = Math.sin(rad) * amt;
              ctx.filter = `blur(${amt * 0.2}px)`;
              ctx.globalAlpha = 0.8 / iterations;
              for (let i = 1; i <= iterations; i++) {
                ctx.drawImage(canvas, ox * (i / iterations), oy * (i / iterations), displayWidth, displayHeight);
              }
              ctx.globalAlpha = 1.0;
              ctx.filter = 'none';
            } else if (blurType === 'zoom') {
              // True zoom blur: per-pixel multi-sample toward center
              // (flying-toward-camera look) — merged in from the former
              // standalone Zoom Blur effect, now a 4th Blur mode alongside
              // Gaussian/Motion/Radial (spin). Shares blurRadialAmount with
              // the Radial mode rather than getting its own slider.
              if (canvas.width > 0 && canvas.height > 0) {
                try {
                  const zbSrc = getDisplayImageData();
                  const zbDst = getScratchImageData('blur-zoom', ctx, displayWidth, displayHeight);
                  const zbCx = displayWidth / 2, zbCy = displayHeight / 2;
                  const zbAmt = Math.min(0.5, (blurRadialAmount / 100) * (isAudioReactive ? 1 + audioMidsLevel * 2 : 1));
                  const zbSteps = 10;
                  for (let y = 0; y < displayHeight; y++) {
                    for (let x = 0; x < displayWidth; x++) {
                      let r = 0, g = 0, b = 0;
                      for (let s = 0; s < zbSteps; s++) {
                        const t = 1 - zbAmt * (s / zbSteps);
                        const sx = Math.max(0, Math.min(displayWidth - 1, Math.round(zbCx + (x - zbCx) * t)));
                        const sy = Math.max(0, Math.min(displayHeight - 1, Math.round(zbCy + (y - zbCy) * t)));
                        const si = (sy * displayWidth + sx) * 4;
                        r += zbSrc.data[si]; g += zbSrc.data[si+1]; b += zbSrc.data[si+2];
                      }
                      const di = (y * displayWidth + x) * 4;
                      zbDst.data[di] = r / zbSteps; zbDst.data[di+1] = g / zbSteps;
                      zbDst.data[di+2] = b / zbSteps; zbDst.data[di+3] = 255;
                    }
                  }
                  putScaledImageData(zbDst);
                } catch(e) { /* skip */ }
              }
            } else if (blurType === 'radial') {
              // True rotational ("spin") blur: samples an arc around the
              // center at a fixed radius, sweeping angle each step, instead of
              // sampling along the radius toward center (that's a zoom blur —
              // covered by Bloom/Zoom Blur elsewhere and wasn't distinct here,
              // plus its effect was capped tiny enough at typical slider
              // values to look like it barely did anything).
              if (canvas.width > 0 && canvas.height > 0) {
                try {
                  const zbSrc = getDisplayImageData();
                  const zbDst = getScratchImageData('blur-radial', ctx, displayWidth, displayHeight);
                  const zbCx = displayWidth / 2, zbCy = displayHeight / 2;
                  // Up to ~45 degrees of total sweep at max slider value.
                  const spinSweep = (blurRadialAmount / 50) * (Math.PI / 4) * (isFirstEffect && isAudioReactive ? 1 + audioMidsLevel * 2 : 1);
                  const zbSteps = 12;
                  for (let y = 0; y < displayHeight; y++) {
                    for (let x = 0; x < displayWidth; x++) {
                      const dx = x - zbCx, dy = y - zbCy;
                      const r = Math.sqrt(dx * dx + dy * dy);
                      const baseAngle = Math.atan2(dy, dx);
                      let rr = 0, gg = 0, bb = 0;
                      for (let s = 0; s < zbSteps; s++) {
                        const t = (s / (zbSteps - 1)) - 0.5;
                        const a = baseAngle + t * spinSweep;
                        const sx = Math.max(0, Math.min(displayWidth - 1, Math.round(zbCx + Math.cos(a) * r)));
                        const sy = Math.max(0, Math.min(displayHeight - 1, Math.round(zbCy + Math.sin(a) * r)));
                        const si = (sy * displayWidth + sx) * 4;
                        rr += zbSrc.data[si]; gg += zbSrc.data[si+1]; bb += zbSrc.data[si+2];
                      }
                      const di = (y * displayWidth + x) * 4;
                      zbDst.data[di] = rr / zbSteps; zbDst.data[di+1] = gg / zbSteps;
                      zbDst.data[di+2] = bb / zbSteps; zbDst.data[di+3] = 255;
                    }
                  }
                  putScaledImageData(zbDst);
                } catch(e) { /* skip */ }
              }
            }
}
