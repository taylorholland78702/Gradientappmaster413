import { getScratchImageData } from '../../utils/scratchCanvas';
import { blendRgb, paletteSegment } from '../../utils/color';
import type { DrawCtx } from '../canvasDrawTypes';

export function drawAngle(P: DrawCtx): CanvasGradient | undefined {
  const {
    activeEffects,
    addGradientStops,
    angleCenterX,
    angleCenterY,
    angleStartOffset,
    angleHardEdge,
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
    chromaticAngle,
    chromaticOffset,
    chromaticTrailsBufferRef,
    chromaticTrailsDecay,
    chromaticTrailsOffset,
    colorShiftHue,
    concentricRingCount,
    concentricRingWidth,
    helixTightness,
    helixTurns,
    ditherLevels,
    ditherType,
    drawParams,
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
    noiseDirection,
    noiseOctaves,
    noiseScale,
    noiseType,
    noiseWarp,
    photoBlendMode,
    photoImageRef,
    photoOpacity,
    pixelSize,
    polygon2Sides,
    posterizeLevels,
    radialBurstCount,
    radialBurstSize,
    radialBurstSpread,
    radialSizeScale,
    reactionDiffusionFeed,
    reactionDiffusionGridRef,
    reactionDiffusionKill,
    reactionDiffusionSpeed,
    resolutionMultiplier,
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
    waveDistortionRotation,
    waveDistortionStrength,
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
          // Very subtle audio: slight angle shimmer, no center drift
          const audioConicAngleOffset = (isAudioEnabled && isAudioReactive) ? audioTrebleLevel * Math.PI * 0.004 : 0;
          const conicCenterX = (displayWidth * angleCenterX) / 100;
          const conicCenterY = (displayHeight * angleCenterY) / 100;
          const conicZoom = (isAudioEnabled && isAudioReactive) ? 1 : Math.max(1, zoom);
          const conicStartAngle = angleRad + (angleStartOffset * Math.PI) / 180 + audioConicAngleOffset;

          // createConicGradient (and even a cached-bitmap + rotated drawImage blit) both
          // route through the canvas compositing pipeline, which is the slow path on this
          // GPU. Radar proves the fix: skip the pipeline entirely and write pixels directly
          // via putImageData, exactly like the radar sweep already does successfully.
          // Rendered at half resolution and upscaled (putLowResImageData).
          const aRenderW = Math.max(1, Math.round(displayWidth * 0.5));
          const aRenderH = Math.max(1, Math.round(displayHeight * 0.5));
          const aInvScale = 2; // 1 / 0.5
          const angleImageData = getScratchImageData('angle', ctx, aRenderW, aRenderH);
          const angleData = angleImageData.data;
          const angleNumColors = gradientColors.length;

          for (let ry = 0; ry < aRenderH; ry++) {
            for (let rx = 0; rx < aRenderW; rx++) {
              const dx = (rx * aInvScale - conicCenterX) / conicZoom;
              const dy = (ry * aInvScale - conicCenterY) / conicZoom;
              let pixelAngle = Math.atan2(dy, dx) - conicStartAngle;
              pixelAngle = ((pixelAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
              const t = pixelAngle / (2 * Math.PI);

              const palSeg = paletteSegment(t, angleNumColors);
              const colorIdx = palSeg.i0;
              const colorFrac = palSeg.f;
              const color1 = gradientColors[colorIdx % angleNumColors];
              const color2 = gradientColors[(colorIdx + 1) % angleNumColors];
              const idx = (ry * aRenderW + rx) * 4;
              if (!color1 || !color2) {
                // Explicitly zeroed (not just skipped) since angleData now
                // comes from a reused scratch buffer, not a fresh
                // zero-initialized ImageData — a bare `continue` here would
                // leave a stale pixel from a previous frame behind.
                angleData[idx] = 0; angleData[idx + 1] = 0; angleData[idx + 2] = 0; angleData[idx + 3] = 0;
                continue;
              }

              // Hard Edge: snap to color1 outright (frac forced to 0)
              // instead of blending toward color2, so each wedge is a flat
              // solid color with a hard cut at the boundary — a pinwheel
              // instead of a smooth conic sweep.
              const frac = angleHardEdge ? 0 : colorFrac;
              const mixed = blendRgb(color1, color2, frac);
              angleData[idx] = mixed.r;
              angleData[idx + 1] = mixed.g;
              angleData[idx + 2] = mixed.b;
              angleData[idx + 3] = 255;
            }
          }

          putLowResImageData(angleImageData);
          gradient = undefined;
  return gradient;
}
