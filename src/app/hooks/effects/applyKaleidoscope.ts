import { getScratchCanvas } from '../../utils/scratchCanvas';

export function applyKaleidoscope(P: any): void {
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
            const tmp = getScratchCanvas('kaleidoscope', displayWidth, displayHeight);
            const tc = tmp.getContext('2d');
            if (tc) {
              tc.drawImage(canvas, 0, 0, displayWidth, displayHeight);
              ctx.fillStyle = '#000';
              ctx.fillRect(0, 0, displayWidth, displayHeight);
              ctx.imageSmoothingEnabled = true;
              const cx = displayWidth / 2, cy = displayHeight / 2;
              const seg = Math.max(1, kaleidoscopeSegments + (isFirstEffect ? Math.floor(audioModulation * 8) : 0));
              const aps = (Math.PI * 2) / seg;
              const half = aps / 2;
              // Use diagonal so segments always reach every corner
              const r = Math.sqrt(cx * cx + cy * cy) * 1.5;
              const scale = r / Math.max(cx, cy);
              // Accumulate rotation each frame
              kaleidoAngleRef.current += (kaleidoscopeRotateSpeed / 200) * (1 + (isAudioReactive ? audioMidsLevel * 3 : 0));
              ctx.save();
              ctx.translate(cx, cy);
              ctx.rotate(kaleidoAngleRef.current);
              ctx.translate(-cx, -cy);
              // True kaleidoscope: each "petal" is a single wedge of the source
              // mirrored onto itself (a right half drawn normally, a left half
              // that's the same content flipped across the petal's centerline),
              // then that self-symmetric petal is rotate-copied around the
              // circle every `aps` so petals tile edge-to-edge with no overlap
              // or gaps — unlike the old version, which clipped the whole image
              // into fixed 90°-wide wedges regardless of segment count, so
              // wedges overlapped/gapped instead of meeting seamlessly.
              for (let i = 0; i < seg; i++) {
                const baseAngle = i * aps;

                // Right half of the petal: [baseAngle, baseAngle + half]
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(baseAngle);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(r, 0);
                ctx.lineTo(r * Math.cos(half), r * Math.sin(half));
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(tmp, -cx * scale, -cy * scale, displayWidth * scale, displayHeight * scale);
                ctx.restore();

                // Left half: [baseAngle - half, baseAngle], the right half's
                // content mirrored across the petal's centerline (baseAngle).
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(baseAngle);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(r, 0);
                ctx.lineTo(r * Math.cos(half), -r * Math.sin(half));
                ctx.closePath();
                ctx.clip();
                ctx.scale(1, -1);
                ctx.drawImage(tmp, -cx * scale, -cy * scale, displayWidth * scale, displayHeight * scale);
                ctx.restore();
              }
              ctx.restore(); // undo kaleidoscope rotation
              ctx.imageSmoothingEnabled = true;
            }
}
