import { getScratchCanvas } from '../../utils/scratchCanvas';

export function applyGlitch(P: any): void {
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
            // Block-shuffle/datamosh: occasional full-row tears (classic
            // datamoshing look) plus individually displaced blocks. Distinct
            // from VHS (continuous scanline wobble) and Slit-Scan (temporal
            // buffer scan) — this is spatial displacement, not a wobble or
            // time-based effect.
            if (canvas.width === 0 || canvas.height === 0) return;
            const glitchTmp = getScratchCanvas('glitch', displayWidth, displayHeight);
            const gtc = glitchTmp.getContext('2d');
            if (gtc) {
              gtc.drawImage(canvas, 0, 0, displayWidth, displayHeight);
              const gBlock = Math.max(4, Math.round(glitchBlockSize));
              // Bass hits spike the glitch amount so the frame visibly tears
              // apart on a kick/drop and calms down between beats, instead of
              // glitching at a flat rate regardless of the music.
              const gBassSpike = (isFirstEffect && isAudioReactive) ? audioSubBassLevel * 0.6 : 0;
              const gAmt = Math.max(0, Math.min(1, glitchIntensity + gBassSpike));
              const gRows = Math.ceil(displayHeight / gBlock);
              const gCols = Math.ceil(displayWidth / gBlock);

              for (let r = 0; r < gRows; r++) {
                if (Math.random() < gAmt * 0.15) {
                  const rowShift = (Math.random() - 0.5) * displayWidth * 0.15;
                  const sy = r * gBlock;
                  const sh = Math.min(gBlock, displayHeight - sy);
                  ctx.drawImage(glitchTmp, 0, sy, displayWidth, sh, rowShift, sy, displayWidth, sh);
                }
              }
              for (let r = 0; r < gRows; r++) {
                for (let c = 0; c < gCols; c++) {
                  if (Math.random() < gAmt * 0.06) {
                    const sx = c * gBlock, sy = r * gBlock;
                    const sw = Math.min(gBlock, displayWidth - sx);
                    const sh = Math.min(gBlock, displayHeight - sy);
                    const dx = Math.max(0, Math.min(displayWidth - sw, sx + (Math.random() - 0.5) * gBlock * 4));
                    ctx.drawImage(glitchTmp, sx, sy, sw, sh, dx, sy, sw, sh);
                  }
                }
              }
            }

            // Chroma Split — a dedicated, user-controllable RGB channel
            // separation pass over the whole (already block-shuffled) frame,
            // same true per-pixel split technique as the Chromatic effect
            // (R sampled from one offset, B from the opposite, G untouched).
            // Previously this was an implicit, fixed-offset ghost copy on
            // ~30% of displaced blocks — pulling it into its own slider makes
            // one of glitch art's most recognizable signatures actually
            // controllable instead of a barely-visible side effect.
            if (glitchChromaSplit > 0.5 && displayWidth > 1 && displayHeight > 1) {
              // Same downsample-then-upscale approach as Chromatic Trails —
              // a channel-split fringe reads the same at half resolution,
              // and the loop's cost scales directly with pixel count.
              const gcsDownsample = 0.5;
              const gcsW = Math.max(1, Math.round(displayWidth * gcsDownsample));
              const gcsH = Math.max(1, Math.round(displayHeight * gcsDownsample));
              const gcsSmallSrc = getScratchCanvas('glitchChromaSplitSrc', gcsW, gcsH);
              gcsSmallSrc.getContext('2d')!.drawImage(canvas, 0, 0, gcsW, gcsH);
              const gcsSrc = gcsSmallSrc.getContext('2d')!.getImageData(0, 0, gcsW, gcsH);
              const gcsDst = ctx.createImageData(gcsW, gcsH);
              const gcsOff = Math.max(1, Math.round(glitchChromaSplit * gcsDownsample));
              for (let y = 0; y < gcsH; y++) {
                for (let x = 0; x < gcsW; x++) {
                  const i = (y * gcsW + x) * 4;
                  const rx = Math.max(0, Math.min(gcsW - 1, x - gcsOff));
                  const bx = Math.max(0, Math.min(gcsW - 1, x + gcsOff));
                  gcsDst.data[i] = gcsSrc.data[(y * gcsW + rx) * 4];
                  gcsDst.data[i + 1] = gcsSrc.data[i + 1];
                  gcsDst.data[i + 2] = gcsSrc.data[(y * gcsW + bx) * 4 + 2];
                  gcsDst.data[i + 3] = 255;
                }
              }
              const gcsUpscaled = getScratchCanvas('glitchChromaSplitDst', gcsW, gcsH);
              gcsUpscaled.getContext('2d')!.putImageData(gcsDst, 0, 0);
              ctx.clearRect(0, 0, displayWidth, displayHeight);
              ctx.drawImage(gcsUpscaled, 0, 0, gcsW, gcsH, 0, 0, displayWidth, displayHeight);
            }
}
