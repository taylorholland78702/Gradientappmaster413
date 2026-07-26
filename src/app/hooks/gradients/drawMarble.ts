import { getMappedColor } from '../../utils/fieldCurve';

export function drawMarble(P: any): CanvasGradient | undefined {
  const {
    fieldContrast,
    paletteMode,
    paletteBands,
    structuralSeed,
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
          const marbleAudio = isAudioEnabled && isAudioReactive;
          const mt = marbleAnimTime + gradientAngle * 0.015;
          const audioBassM = marbleAudio ? audioSubBassLevel / 5 : 0;   // 0-1
          const audioMidsM = marbleAudio ? audioMidsLevel / 5 : 0;
          // Bass cranks turbulence + vein frequency; mids boosts octave richness
          const marbleAudioFreq = 1 + audioBassM * 2.5;
          const marbleTurbBoost = 1 + audioBassM * 4.0;      // veins writhe on bass
          const marbleVeinBoost = 1 + audioBassM * 3.0;      // vein spacing tightens
          const marbleOctAmpBoost = 1 + audioMidsM * 2.0;    // richer texture on mids
          const marbleColorShift = marbleAudio ? audioTrebleLevel * 0.8 : 0;
          // Rendered at half resolution and upscaled (putLowResImageData) — the
          // octave-loop trig math below is too expensive per-pixel to run at
          // full display resolution every frame without visibly tanking FPS.
          const mRenderW = Math.max(1, Math.round(displayWidth * 0.5));
          const mRenderH = Math.max(1, Math.round(displayHeight * 0.5));
          const mCenterX = centerX * 0.5;
          const mCenterY = centerY * 0.5;
          const imageData3 = ctx.createImageData(mRenderW, mRenderH);
          const d3 = imageData3.data;
          const mScale = (1 / zoom) * 3;
          const mOctaves = Math.round(marbleOctaves);
          const mSeedX = structuralSeed * 1.7;
          const mSeedY = structuralSeed * 2.3;
          for (let y = 0; y < mRenderH; y++) {
            for (let x = 0; x < mRenderW; x++) {
              const nx2 = (x - mCenterX) / mRenderW * mScale + mSeedX;
              const ny2 = (y - mCenterY) / mRenderH * mScale + mSeedY;
              let turb = 0;
              let freq = 1 * marbleAudioFreq;
              let amp = 1;
              for (let oct = 0; oct < mOctaves; oct++) {
                turb += Math.sin(nx2 * freq + mt * 0.3) * Math.cos(ny2 * freq * 0.8 - mt * 0.2) * amp * marbleOctAmpBoost;
                turb += Math.sin((nx2 + ny2) * freq * 0.7 + mt * 0.5) * amp * 0.5;
                freq *= 2.1;
                amp *= 0.5;
              }
              const vein = Math.sin(nx2 * marbleVeinFreq * marbleVeinBoost + turb * marbleTurbulence * marbleTurbBoost + mt * 0.1) * 0.5 + 0.5;
              const tVal2 = (vein + marbleColorShift) % 1;
              const c4 = getMappedColor(tVal2, gradientColors, fieldContrast, paletteMode, paletteBands);
              const idx3 = (y * mRenderW + x) * 4;
              d3[idx3]     = Math.round(c4.r);
              d3[idx3 + 1] = Math.round(c4.g);
              d3[idx3 + 2] = Math.round(c4.b);
              d3[idx3 + 3] = 255;
            }
          }
          putLowResImageData(imageData3);
  return gradient;
}
