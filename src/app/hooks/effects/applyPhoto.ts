// Deterministic pseudo-random in [0,1) from two integers — used so each
// shatter tile always flies in the same direction/distance ratio every
// frame (only the overall magnitude changes with the live bass level),
// rather than jittering to a new random direction every frame.
function tileHash(a: number, b: number): number {
  let h = a * 374761393 + b * 668265263;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967295;
}

export function applyPhoto(P: any): void {
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
            // Blends the user-uploaded photo over the gradient. Cover-fit
            // (scale to fill, center-cropped) like a CSS background-size:cover,
            // rather than stretching to the canvas's aspect ratio. A no-op
            // until an image has actually been uploaded — see photoImageRef.
            if (canvas.width === 0 || canvas.height === 0) return;
            const photoImg = photoImageRef.current;
            if (!photoImg) return;
            // Audio-reactive: bass shatters the image into a grid of tiles
            // that fly apart from their home positions and reassemble as
            // the level falls; treble adds a brief opacity boost on top of
            // the base slider. Same live levels (and the same
            // isAudioEnabled && isAudioReactive gate) every other reactive
            // effect in this pipeline already reads. Sits at rest (tiles
            // flush, no boost) whenever audio isn't actively driving
            // anything, so a photo with no audio playing looks identical
            // to before this was added.
            const photoAudioActive = isAudioEnabled && isAudioReactive;
            const photoAudioOpacityBoost = photoAudioActive ? Math.min(1, audioTrebleLevel) * 0.25 : 0;
            const shatterAmount = photoAudioActive ? Math.min(1, audioSubBassLevel) : 0;
            ctx.save();
            ctx.globalAlpha = Math.max(0, Math.min(1, photoOpacity / 100 + photoAudioOpacityBoost));
            ctx.globalCompositeOperation = photoBlendMode;
            const canvasAspect = displayWidth / displayHeight;
            const imgAspect = photoImg.width / photoImg.height;
            let dw, dh, dx, dy;
            if (imgAspect > canvasAspect) {
              dh = displayHeight;
              dw = dh * imgAspect;
              dx = (displayWidth - dw) / 2;
              dy = 0;
            } else {
              dw = displayWidth;
              dh = dw / imgAspect;
              dx = 0;
              dy = (displayHeight - dh) / 2;
            }
            if (shatterAmount > 0.02) {
              // Slice the cover-fit rect into a fixed-column grid of small
              // tiles (row count follows from the image's own aspect ratio
              // so tiles stay roughly square) and draw each one offset from
              // its home position by a direction/distance hashed from its
              // own (tx,ty) — stable frame to frame, so a tile always flies
              // the same way, only how FAR scales with the live bass level.
              // Cheap even at a few hundred tiles (plain drawImage calls),
              // so this only runs once shatterAmount clears the threshold —
              // silent/no-audio playback keeps the single-draw fast path.
              const GRID_COLS = 14;
              const tileSize = dw / GRID_COLS;
              const gridRows = Math.max(1, Math.ceil(dh / tileSize));
              const maxDisplacement = Math.max(displayWidth, displayHeight) * 0.18 * shatterAmount;
              for (let ty = 0; ty < gridRows; ty++) {
                const destTileY = dy + ty * tileSize;
                const destTileH = Math.min(tileSize, dy + dh - destTileY);
                if (destTileH <= 0) continue;
                for (let tx = 0; tx < GRID_COLS; tx++) {
                  const destTileX = dx + tx * tileSize;
                  const destTileW = Math.min(tileSize, dx + dw - destTileX);
                  if (destTileW <= 0) continue;
                  const srcTileX = ((destTileX - dx) / dw) * photoImg.width;
                  const srcTileY = ((destTileY - dy) / dh) * photoImg.height;
                  const srcTileW = (destTileW / dw) * photoImg.width;
                  const srcTileH = (destTileH / dh) * photoImg.height;
                  const angle = tileHash(tx, ty) * Math.PI * 2;
                  const mag = 0.4 + tileHash(tx + 1000, ty + 1000) * 0.6;
                  const offX = Math.cos(angle) * maxDisplacement * mag;
                  const offY = Math.sin(angle) * maxDisplacement * mag;
                  ctx.drawImage(
                    photoImg, srcTileX, srcTileY, srcTileW, srcTileH,
                    destTileX + offX, destTileY + offY, destTileW, destTileH,
                  );
                }
              }
            } else {
              ctx.drawImage(photoImg, dx, dy, dw, dh);
            }
            ctx.restore();
}
