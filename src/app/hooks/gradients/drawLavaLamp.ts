export function drawLavaLamp(P: any): CanvasGradient | undefined {
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
    putLowResImageData
  } = P;
  let gradient: CanvasGradient | undefined;
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, displayWidth, displayHeight);
          const lavaAudio = isAudioEnabled && isAudioReactive;
          const audioBassL = lavaAudio ? audioSubBassLevel / 5 : 0;   // 0-1
          const audioMidsL = lavaAudio ? audioMidsLevel / 5 : 0;
          const lt = lavaAnimTime + gradientAngle * 0.02;
          // Bass pulses blob size hard; mids speeds orbit; both boost brightness
          const lavaAudioScale = 1 + audioBassL * 3.0;         // blobs expand on bass
          const lavaOrbitBoost = 1 + audioMidsL * 3.0;         // orbit speed up on mids
          const lavaBrightBoost = 1 + audioBassL * 2.0;        // brightness flares
          const lavaColorShift = lavaAudio ? audioTrebleLevel * 0.8 : 0;
          // Rendered at half resolution and upscaled (putLowResImageData) — a
          // per-pixel metaball field sum over every blob is too expensive at
          // full display resolution.
          const lRenderW = Math.max(1, Math.round(displayWidth * 0.5));
          const lRenderH = Math.max(1, Math.round(displayHeight * 0.5));
          const lInvScale = 2; // 1 / 0.5
          const imageData2 = ctx.createImageData(lRenderW, lRenderH);
          const d2 = imageData2.data;
          const lavaTime = lt * lavaSpeed * lavaOrbitBoost;
          const numBlobs = Math.max(2, Math.min(lavaBlobCount, 12));
          const blobs: Array<{x: number, y: number, r: number}> = [];
          for (let i = 0; i < numBlobs; i++) {
            const angle = (i / numBlobs) * Math.PI * 2 + lavaTime * (0.3 + i * 0.07);
            const orbitR = 0.25 + 0.15 * Math.sin(lavaTime * 0.4 + i * 1.1);
            blobs.push({
              x: centerX + displayWidth * orbitR * Math.cos(angle),
              y: centerY + displayHeight * orbitR * Math.sin(angle * 0.7 + lavaTime * 0.2),
              r: (Math.min(displayWidth, displayHeight) * lavaBlobSize + Math.sin(lavaTime + i) * 0.04 * displayWidth) * lavaAudioScale,
            });
          }
          const scaleF = 1 / zoom;
          for (let y = 0; y < lRenderH; y++) {
            for (let x = 0; x < lRenderW; x++) {
              const px2 = centerX + (x * lInvScale - centerX) * scaleF;
              const py2 = centerY + (y * lInvScale - centerY) * scaleF;
              let field = 0;
              let colorR = 0, colorG = 0, colorB = 0, colorW = 0;
              for (let b = 0; b < blobs.length; b++) {
                const dx2 = px2 - blobs[b].x;
                const dy2 = py2 - blobs[b].y;
                const dist2 = dx2 * dx2 + dy2 * dy2;
                const influence = (blobs[b].r * blobs[b].r) / (dist2 + 1);
                field += influence;
                const ci3 = ((b + Math.floor(lavaColorShift * gradientColors.length)) % gradientColors.length + gradientColors.length) % gradientColors.length;
                const c = gradientColors[ci3] || { r: 255, g: 80, b: 20 };
                colorR += c.r * influence;
                colorG += c.g * influence;
                colorB += c.b * influence;
                colorW += influence;
              }
              const t3 = Math.min(1, Math.max(0, (field - 0.7) * 3));
              const brightness = (t3 > 0 ? 1 : Math.min(1, field * 0.3)) * lavaBrightBoost;
              const idx2 = (y * lRenderW + x) * 4;
              const fr = colorW > 0 ? colorR / colorW : 0;
              const fg = colorW > 0 ? colorG / colorW : 0;
              const fb = colorW > 0 ? colorB / colorW : 0;
              d2[idx2]     = Math.round(fr * brightness);
              d2[idx2 + 1] = Math.round(fg * brightness);
              d2[idx2 + 2] = Math.round(fb * brightness);
              d2[idx2 + 3] = 255;
            }
          }
          putLowResImageData(imageData2);
  return gradient;
}
