import { splitGraphemes } from '../../components/InteractiveGradient';
export function applyEmoji(P: any): void {
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
            // ASCII's sibling — brightness maps to an emoji ramp instead of a
            // character ramp, with each cell spinning about its own center.
            // Rotation only advances while Play is active (emojiAnimTime is
            // gated the same way as flowAnimTime/liquidAnimTime/etc.), so the
            // cells freeze in place when paused instead of a wall-clock spin.
            if (!imageData) return;
            const eSize = Math.max(10, emojiSize);
            const emojis = splitGraphemes(emojiChars.trim().length > 0 ? emojiChars : '😴🙂😃🤩🔥');
            // "Offset" means a brick/halftone-style stagger: every other row is
            // shifted horizontally (like the classic polka-dot pattern), not a
            // uniform pan of the whole grid. Offset sliders are bounded to
            // ±eSize, so one extra row/col of margin on each side is always
            // enough to keep the grid fully covering the canvas at any stagger
            // amount — no modulo wrapping needed.
            // Column/row range anchored so a cell boundary always sits at
            // centerX/centerY (instead of starting the grid at raw (0,0)) —
            // otherwise cells realign away from the top-left corner as
            // emojiSize changes rather than growing/shrinking from the
            // canvas's middle.
            const colStartE = Math.floor(-centerX / eSize) - 1;
            const colEndE = Math.ceil((displayWidth - centerX) / eSize) + 1;
            const rowStartE = Math.floor(-centerY / eSize) - 1;
            const rowEndE = Math.ceil((displayHeight - centerY) / eSize) + 1;
            const idatE = imageData.data;
            const baseAngle = emojiAnimTime * (Math.PI / 180);
            const rowStaggerX = emojiOffsetX;
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, displayWidth, displayHeight);
            ctx.font = `${eSize}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // Auto-level pass: with many emoji in the ramp, a straight 0-255
            // linear split meant most of them never got picked unless the
            // current gradient's brightness happened to span the full range —
            // typical smooth gradients only cover a narrow band, so entries
            // near the ramp's ends (often exactly the ones just added from the
            // picker) silently never appeared. Stretching the actual observed
            // min-max range of THIS frame to fill 0-1 guarantees every entry in
            // the ramp gets used somewhere, the same idea as the audio Auto Gain.
            const cellBrightness: number[] = [];
            let minBrightness = Infinity, maxBrightness = -Infinity;
            for (let r = rowStartE; r < rowEndE; r++) {
              for (let c = colStartE; c < colEndE; c++) {
                const cellCx = centerX + c * eSize + Math.floor(eSize / 2) + (((r % 2) + 2) % 2 === 1 ? rowStaggerX : 0);
                const cellCy = centerY + r * eSize + Math.floor(eSize / 2);
                if (cellCx < 0 || cellCx >= displayWidth || cellCy < 0 || cellCy >= displayHeight) {
                  cellBrightness.push(-1);
                  continue;
                }
                const pIdx = (Math.floor(cellCy) * displayWidth + Math.floor(cellCx)) * 4;
                const b = (idatE[pIdx] + idatE[pIdx + 1] + idatE[pIdx + 2]) / 3 / 255;
                cellBrightness.push(b);
                if (b < minBrightness) minBrightness = b;
                if (b > maxBrightness) maxBrightness = b;
              }
            }
            const brightnessRange = Math.max(0.001, maxBrightness - minBrightness);
            let cellIdx = 0;
            for (let r = rowStartE; r < rowEndE; r++) {
              for (let c = colStartE; c < colEndE; c++) {
                const brightness = cellBrightness[cellIdx++];
                if (brightness < 0) continue;
                const cellCx = centerX + c * eSize + Math.floor(eSize / 2) + (((r % 2) + 2) % 2 === 1 ? rowStaggerX : 0);
                const cellCy = centerY + r * eSize + Math.floor(eSize / 2);
                const normalizedBrightness = (brightness - minBrightness) / brightnessRange;
                const emojiIdx = Math.min(emojis.length - 1, Math.floor(normalizedBrightness * emojis.length));
                const glyph = emojis[emojiIdx];
                if (!glyph || glyph === ' ') continue;
                // Deterministic per-cell jitter (stable across frames, no time
                // dependency) so "variable size" reads as a fixed organic mosaic
                // instead of flickering — same (row,col) always gets the same size.
                const jitter = emojiSizeVariation > 0
                  ? Math.abs(Math.sin(r * 12.9898 + c * 78.233) * 43758.5453) % 1
                  : 0;
                const sizeScale = 1 + (jitter * 2 - 1) * (emojiSizeVariation / 100) * 0.8;
                ctx.save();
                ctx.translate(cellCx, cellCy);
                ctx.rotate(baseAngle);
                if (sizeScale !== 1) ctx.scale(sizeScale, sizeScale);
                ctx.fillText(glyph, 0, 0);
                ctx.restore();
              }
            }
}
