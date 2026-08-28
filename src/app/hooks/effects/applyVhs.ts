import { getScratchPixelBuffer } from '../../utils/scratchCanvas';

export function applyVhs(P: any): void {
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
    vhsJitterAmount,
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
            // VHS effect with horizontal disruption — spikes on bass beats
            if (canvas.width === 0 || canvas.height === 0) return;
            const bassBoost = isAudioReactive ? (audioSubBassLevel / 5) * 0.9 : 0;
            const effectiveVhsIntensity = Math.min(1, vhsGlitchIntensity + bassBoost);

            // Apply horizontal blur first for VHS tape tracking blur
            const blurStrength = Math.floor(2 + effectiveVhsIntensity * 3);
            ctx.filter = `blur(${blurStrength}px)`;
            // Explicit CSS destination size avoids the physical-pixel intrinsic size
            // being scaled up 4× by ctx.scale on Retina displays
            ctx.drawImage(canvas, 0, 0, displayWidth, displayHeight);
            ctx.filter = 'none';

            // More horizontal glitches with varying sizes
            // Capture one CSS-pixel snapshot so slice extraction works at CSS coords
            const vhsFullImg = getDisplayImageData();
            const numGlitches = Math.floor(15 + effectiveVhsIntensity * 50);
            // One reused backing buffer sized to the largest possible slice
            // (h maxes out at 60px tall) instead of a fresh
            // ctx.createImageData(displayWidth, hInt) allocation per glitch —
            // up to ~65 full typed-array allocations/frame at high intensity
            // otherwise. Each iteration just takes a differently-sized view
            // over the same backing array via subarray().
            const sliceBuf = getScratchPixelBuffer('vhs-slice', displayWidth * 60 * 4);
            for (let i = 0; i < numGlitches; i++) {
              const y = Math.random() * displayHeight;
              const h = Math.max(2, Math.min(60, Math.random() * 60 * effectiveVhsIntensity));
              const offset = (Math.random() - 0.5) * (vhsJitterAmount ?? 300) * effectiveVhsIntensity;
              const yInt = Math.floor(y);
              const hInt = Math.max(2, Math.ceil(h));
              if (yInt >= 0 && yInt + hInt <= displayHeight && displayWidth > 0) {
                try {
                  const sliceView = sliceBuf.subarray(0, displayWidth * hInt * 4);
                  for (let row = 0; row < hInt; row++) {
                    const srcRow = Math.min(yInt + row, displayHeight - 1);
                    const srcOff = srcRow * displayWidth * 4;
                    sliceView.set(vhsFullImg.data.subarray(srcOff, srcOff + displayWidth * 4), row * displayWidth * 4);
                  }
                  // Cast: TS's ImageData constructor overload wants
                  // Uint8ClampedArray<ArrayBuffer> specifically, but a plain
                  // `new Uint8ClampedArray(n)` (and any subarray view of it)
                  // is typed as the wider ArrayBufferLike-backed variant —
                  // functionally identical at runtime, same non-issue as the
                  // pre-existing SharedArrayBuffer variance warnings
                  // elsewhere in this codebase (useVCRPlayback.ts).
                  const slice = new ImageData(sliceView as unknown as Uint8ClampedArray<ArrayBuffer>, displayWidth, hInt);
                  ctx.filter = `blur(${blurStrength * 1.5}px)`;
                  putScaledImageData(slice, offset, yInt);
                  ctx.filter = 'none';
                } catch (e) {
                  // Skip if slice extraction fails
                }
              }
            }

            // Add strong RGB channel shift for VHS chromatic aberration.
            // Deliberately NOT using P.imageData (the ctx-level snapshot
            // buildEffectCtx takes before this effect runs) — this block
            // runs after the blur + glitch-slice drawing above has already
            // mutated the live canvas, so that snapshot is stale by this
            // point; writing it back via putScaledImageData would silently
            // erase everything just drawn (this effect wasn't in
            // useCanvasDraw's needsImageData list historically, and adding
            // it there to get P.imageData populated reproduced exactly that
            // — a blanked-black canvas). Fetching fresh here reads the
            // canvas as it actually looks right now.
            const vhsShiftImg = getDisplayImageData();
            if (vhsShiftImg) {
              const shiftAmount = Math.floor(effectiveVhsIntensity * 8);
              const data = vhsShiftImg.data;
              // Reused backing buffer instead of a fresh full-canvas
              // Uint8ClampedArray copy every frame (~8MB at 1080p) — same
              // pattern as the vhs-slice buffer above.
              const tempData = getScratchPixelBuffer('vhs-shift', data.length);
              tempData.set(data);
            
              // Shift red and blue channels
              for (let y = 0; y < displayHeight; y++) {
                for (let x = 0; x < displayWidth; x++) {
                  const i = (y * displayWidth + x) * 4;
                
                  // Red channel shift right
                  const redSourceX = Math.max(0, x - shiftAmount);
                  const redSourceI = (y * displayWidth + redSourceX) * 4;
                  data[i] = tempData[redSourceI];
                
                  // Blue channel shift left
                  const blueSourceX = Math.min(displayWidth - 1, x + shiftAmount);
                  const blueSourceI = (y * displayWidth + blueSourceX) * 4;
                  data[i + 2] = tempData[blueSourceI + 2];
                }
              }
              putScaledImageData(vhsShiftImg);
            }
}
