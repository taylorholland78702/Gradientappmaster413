import { getMappedColor } from '../../utils/fieldCurve';
import { getScratchCanvas } from '../../utils/scratchCanvas';

// Same module-level clock tradeoff as applyTriangleField.ts — a plain
// accumulator, not a dedicated ref, since this is a cosmetic phase only.
let ffTime = 0;

export function applyFluidField(P: any): void {
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
    fieldContrast,
    paletteMode,
    paletteBands,
    fisheyeCenterX,
    fisheyeCenterY,
    fisheyeStrength,
    fluidFieldScale,
    fluidFieldSpeed,
    fluidFieldOpacity,
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
  } = P;
  // Generative overlay, not a transform: unlike Liquid (which warps the
  // pixels already on the canvas via coordinate displacement), this paints
  // its own flowing turbulence field from scratch — mapped through the
  // palette, not sampled from the frame beneath it — and blends over
  // whatever's already drawn via a dedicated Opacity slider. Deliberately
  // NOT routed through putScaledImageData/ctx.putImageData for the
  // composite step: raw putImageData ignores globalAlpha entirely and
  // would replace pixels outright instead of blending, so the field is
  // rendered into its own scratch canvas first and drawn onto ctx with
  // ctx.drawImage, which does respect globalAlpha.
  if (canvas.width === 0 || canvas.height === 0) return;

  const ffAudioActive = isFirstEffect && isAudioReactive;
  const speedBoost = ffAudioActive ? 1 + audioTrebleLevel * 0.6 : 1;
  ffTime += 0.012 * fluidFieldSpeed * speedBoost;

  const ffW = Math.max(1, Math.round(displayWidth * 0.5));
  const ffH = Math.max(1, Math.round(displayHeight * 0.5));
  const scratch = getScratchCanvas('fluidField', ffW, ffH);
  const scratchCtx = scratch.getContext('2d');
  if (!scratchCtx) return;
  const imgData = scratchCtx.createImageData(ffW, ffH);
  const data = imgData.data;

  const scaleFactor = fluidFieldScale * 0.01;
  const t = ffTime;
  const bassWarp = ffAudioActive ? audioSubBassLevel * 1.5 : 0;

  for (let y = 0; y < ffH; y++) {
    for (let x = 0; x < ffW; x++) {
      const n1 = Math.sin(x * scaleFactor + t) * Math.cos(y * scaleFactor * 1.3 - t * 0.7);
      const n2 = Math.sin((x + y) * scaleFactor * 0.6 + t * 1.4) * 0.5;
      const n3 = Math.cos((x - y) * scaleFactor * 0.45 - t * 0.9) * 0.35;
      const raw = (n1 + n2 + n3 + bassWarp) / (1.85 + bassWarp);
      const field = (raw + 1) / 2;

      const mapped = getMappedColor(field, gradientColors, fieldContrast, paletteMode, paletteBands);
      const i = (y * ffW + x) * 4;
      data[i] = mapped.r;
      data[i + 1] = mapped.g;
      data[i + 2] = mapped.b;
      data[i + 3] = 255;
    }
  }

  scratchCtx.putImageData(imgData, 0, 0);
  const opacity = Math.max(0, Math.min(1, fluidFieldOpacity));
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.drawImage(scratch, 0, 0, ffW, ffH, 0, 0, displayWidth, displayHeight);
  ctx.restore();
}
