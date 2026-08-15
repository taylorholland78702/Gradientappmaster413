import { getMappedColor } from '../../utils/fieldCurve';
import { getScratchImageData } from '../../utils/scratchCanvas';

export function drawCaustics(P: any): CanvasGradient | undefined {
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
    putLowResImageData
  } = P;
  let gradient: CanvasGradient | undefined;
          ctx.fillStyle = '#000814';
          ctx.fillRect(0, 0, displayWidth, displayHeight);
          const causticsAudio = isAudioEnabled && isAudioReactive;
          const audioBassC = causticsAudio ? audioSubBassLevel / 5 : 0;   // 0-1
          const audioMidsC = causticsAudio ? audioMidsLevel / 5 : 0;
          const ct = causticsAnimTime + gradientAngle * 0.02;
          // Bass drives brightness + freq distortion; mids warps phase
          const causticsFreqBoost = 1 + audioBassC * 1.8;
          const causticsBrightnessExp = Math.max(0.3, causticsBrightness - audioBassC * 1.2);
          const causticsPhaseWarp = audioMidsC * 2.5;
          const causticsColorShift = causticsAudio ? audioTrebleLevel * 0.7 : 0;
          const causticsLightFloor = 0.1 + audioBassC * 0.4;  // black areas light up on bass
          // Rendered at half resolution and upscaled (putLowResImageData) — the
          // stacked sin() waves below are too expensive per-pixel to run at
          // full display resolution every frame without visibly tanking FPS.
          const cRenderW = Math.max(1, Math.round(displayWidth * 0.5));
          const cRenderH = Math.max(1, Math.round(displayHeight * 0.5));
          const cCenterX = centerX * 0.5;
          const cCenterY = centerY * 0.5;
          const imageData = getScratchImageData('caustics', ctx, cRenderW, cRenderH);
          const d = imageData.data;
          const cScaleXY = causticsScale / displayWidth;
          const scaleX = (cScaleXY * 4 / zoom) / 0.5;
          const scaleY = ((causticsScale / displayHeight) * 4 / zoom) / 0.5;
          const cFreq = causticsFreqBoost;
          const cSeedX = structuralSeed * 2.1;
          const cSeedY = structuralSeed * 1.4;
          for (let y = 0; y < cRenderH; y++) {
            for (let x = 0; x < cRenderW; x++) {
              const nx = (x - cCenterX) * scaleX + cSeedX;
              const ny = (y - cCenterY) * scaleY + cSeedY;
              const w1 = Math.sin(nx * 2.1 * cFreq + Math.sin(ny * 1.3 * cFreq + ct + causticsPhaseWarp) + ct * 0.7);
              const w2 = Math.sin(ny * 2.3 * cFreq + Math.sin(nx * 1.7 * cFreq - ct * 0.8 + causticsPhaseWarp) - ct * 0.5);
              const w3 = Math.sin((nx + ny) * 1.5 * cFreq + ct * 1.1);
              const v = Math.min(1, Math.pow(Math.abs(w1 + w2 + w3) / 3, causticsBrightnessExp) + causticsLightFloor);
              const tVal = (Math.sin(v * Math.PI) * 0.5 + 0.5 + causticsColorShift) % 1;
              const c1 = getMappedColor(tVal, gradientColors, fieldContrast, paletteMode, paletteBands);
              const idx = (y * cRenderW + x) * 4;
              d[idx]     = Math.min(255, Math.round(c1.r * (0.3 + v * 0.7)));
              d[idx + 1] = Math.min(255, Math.round(c1.g * (0.3 + v * 0.7)));
              d[idx + 2] = Math.min(255, Math.round(c1.b * (0.3 + v * 0.7)));
              d[idx + 3] = 255;
            }
          }
          putLowResImageData(imageData);
  return gradient;
}
