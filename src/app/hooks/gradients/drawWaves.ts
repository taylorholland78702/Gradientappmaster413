// Module-level cache for the per-color-pair strip bitmaps below — was being
// rebuilt from scratch (fresh canvas per color) on every single frame,
// unconditionally, even though the colors rarely change frame-to-frame.
// Keyed by a cheap stringified snapshot of the colors so it only rebuilds
// when they actually change.
let waveStripCacheKey = '';
let waveStripCacheValue: HTMLCanvasElement[] = [];

export function drawWaves(P: any): CanvasGradient | undefined {
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
    getDisplayImageData
  } = P;
  let gradient: CanvasGradient | undefined;
          // Create horizontal wave pattern with infinite width coverage
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, displayWidth, displayHeight);

          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.rotate((waveRotationRef.current * Math.PI) / 180);
          const waveZoom = (isAudioEnabled && isAudioReactive) ? 1 / waveScale : zoom / waveScale;
          ctx.scale(waveZoom, waveZoom);
          ctx.translate(-centerX, -centerY);

          const waveScaleForWave = 1 / waveZoom;
          const waveWidth = (displayWidth / waveNumberRef.current) * waveScaleForWave;
          // Audio reactivity: bass affects wave amplitude
          const audioWaveAmplitude = (isAudioEnabled && isAudioReactive)
            ? audioSubBassLevel * 8 // Very subtle amplitude nudge on bass
            : 0;
          const amplitude = (waveAmplitude + audioWaveAmplitude) * waveScaleForWave;
          const frequency = waveFrequency * 0.0033;
        
          // Coverage must account for rotation (diagonal at 45°) and amplitude overshoot
          const waveDiagonal = Math.sqrt(displayWidth * displayWidth + displayHeight * displayHeight);
          const visibleWidth = (waveDiagonal * 2) / waveZoom;
          const numWavesForWave = Math.ceil(visibleWidth / waveWidth) + 4;
          const startOffset = Math.floor(numWavesForWave / 2);
        
          // Treble shifts which colors the waves use
          const waveColorShiftAmt = (isAudioEnabled && isAudioReactive) ? audioTrebleLevel * gradientColors.length * 0.3 : 0;

          // Cache one tiny horizontal gradient bitmap per color pair (there are only
          // gradientColors.length of them) so the per-scanline fill below can blit a
          // cheap bitmap instead of allocating a CanvasGradient on every row — that's
          // what makes riding the gradient along the wave's curve affordable per-frame.
          // The bitmaps themselves are cached at module scope (was rebuilding every
          // single frame unconditionally — several fresh canvas allocations/frame
          // that only actually needed to happen when the colors change).
          const waveStripKey = gradientColors.map((c: { r: number; g: number; b: number }) => `${c.r},${c.g},${c.b}`).join('|');
          let waveStripCache: HTMLCanvasElement[];
          if (waveStripKey === waveStripCacheKey) {
            waveStripCache = waveStripCacheValue;
          } else {
            waveStripCache = [];
            for (let c = 0; c < gradientColors.length; c++) {
              const color = gradientColors[c];
              const nextColor = gradientColors[(c + 1) % gradientColors.length];
              if (!color || !nextColor) continue;
              const strip = document.createElement('canvas');
              strip.width = 64; strip.height = 1;
              const sCtx = strip.getContext('2d')!;
              const sGrad = sCtx.createLinearGradient(0, 0, 64, 0);
              sGrad.addColorStop(0, `rgb(${color.r}, ${color.g}, ${color.b})`);
              sGrad.addColorStop(1, `rgb(${nextColor.r}, ${nextColor.g}, ${nextColor.b})`);
              sCtx.fillStyle = sGrad;
              sCtx.fillRect(0, 0, 64, 1);
              waveStripCache[c] = strip;
            }
            waveStripCacheKey = waveStripKey;
            waveStripCacheValue = waveStripCache;
          }

          const waveRowStep = 8;
          for (let i = -startOffset; i < numWavesForWave - startOffset; i++) {
            const baseX = i * waveWidth;
            const shiftedI = i + waveColorShiftAmt;
            const colorIndex = ((Math.floor(shiftedI) % gradientColors.length) + gradientColors.length) % gradientColors.length;
            const strip = waveStripCache[colorIndex];
            if (!strip) continue;

            // Fill scanline-by-scanline so the gradient's left/right edges follow the
            // same sine offset as the stripe's own wavy boundary at that row — the
            // gradient rides inside the curve instead of sitting as a straight band
            // laid over it.
            for (let y = -displayHeight * 3; y <= displayHeight * 3; y += waveRowStep) {
              const waveX = baseX + Math.sin(y * frequency) * amplitude;
              ctx.drawImage(strip, 0, 0, 64, 1, waveX, y, waveWidth, waveRowStep + 1);
            }
          }

          ctx.restore();

          // Bass radial brightness pulse — drawn on top after restoring transform
          if (isAudioEnabled && isAudioReactive && audioSubBassLevel > 0.05) {
            const waveMaxR = Math.sqrt(displayWidth ** 2 + displayHeight ** 2) / 2;
            const pulseR = waveMaxR * (1 - audioSubBassLevel * 0.3);
            const waveGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseR);
            waveGlow.addColorStop(0, `rgba(255,255,255,${audioSubBassLevel * 0.35})`);
            waveGlow.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = waveGlow;
            ctx.fillRect(0, 0, displayWidth, displayHeight);
          }
  return gradient;
}
