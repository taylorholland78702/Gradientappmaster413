import { DEG_TO_RAD, TWO_PI } from '../../constants/gradientEffects';
import { getScratchImageData } from '../../utils/scratchCanvas';
import { blendRgb, paletteSegment } from '../../utils/color';
import type { DrawCtx } from '../canvasDrawTypes';
export function drawRadialBurst(P: DrawCtx): CanvasGradient | undefined {
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
          // Multiple radial gradients - centered and sized to fit window on load
          ctx.fillStyle = 'rgb(0, 0, 0)';
          ctx.fillRect(0, 0, displayWidth, displayHeight);
          const burstCount = radialBurstCount;
          // When audio active, skip 1/zoom so sub-bass pulse doesn't shrink bursts
          const burstScale = (isAudioEnabled && isAudioReactive) ? 1 : 1 / zoom;
          const sizeScale = radialBurstSize / 100;
          const burstRadius = fitRadius * 0.7;
          const isAudioActive = isAudioEnabled && isAudioReactive;
          const audioBass = isAudioActive ? audioSubBassLevel : 0;
          const audioMids = isAudioActive ? audioMidsLevel : 0;
          // Bass expands spread, mids boost brightness, both scale burst size
          const audioBurstSpread = audioBass * 120;
          const spreadFactor = (radialBurstSpread + audioBurstSpread) * 0.01;
          const audioSizeBoost = 1 + audioBass * 1.2 + audioMids * 0.4;
          const audioBrightness = 1 + audioBass * 1.5 + audioMids * 0.8;
          for (let i = 0; i < burstCount; i++) {
            const burstAngle = (i * 360 / burstCount + gradientAngle) * DEG_TO_RAD;
            const offsetDist = fitRadius * spreadFactor * burstScale * sizeScale;
            const burstX = centerX + Math.cos(burstAngle) * offsetDist;
            const burstY = centerY + Math.sin(burstAngle) * offsetDist;
            const burstRadiusValue = Math.max(0, burstRadius * burstScale * sizeScale * audioSizeBoost);
            const burstGrad = ctx.createRadialGradient(burstX, burstY, 0, burstX, burstY, burstRadiusValue);
            const burstColor = gradientColors[i % gradientColors.length];
            if (!burstColor) continue;
            const br = Math.min(255, Math.round(burstColor.r * audioBrightness));
            const bg = Math.min(255, Math.round(burstColor.g * audioBrightness));
            const bb = Math.min(255, Math.round(burstColor.b * audioBrightness));
            burstGrad.addColorStop(0, `rgb(${br}, ${bg}, ${bb})`);
            burstGrad.addColorStop(0.5, `rgba(${br}, ${bg}, ${bb}, 0.6)`);
            burstGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = burstGrad;
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillRect(0, 0, displayWidth, displayHeight);
          }
          ctx.globalCompositeOperation = 'source-over';

          // 'lighter' is a true per-channel sum, not regular alpha-over
          // blending — with enough bursts overlapping (shuffle can land on
          // up to ~17), or a couple of bursts sized large enough to blanket
          // most of the canvas (max Size + min Spread makes every burst
          // individually cover the whole canvas), the additive sum
          // saturates every channel to 255 across a wide area, reading as a
          // solid white screen instead of a burst pattern. Soft-clipping
          // only pixels that actually blew out (rather than scaling every
          // burst's alpha down up front) leaves well-separated/typical burst
          // combos — which never approach saturation — completely
          // untouched, instead of dimming them to guard against a worst
          // case they were never going to hit.
          const burstImg = getDisplayImageData();
          const bd = burstImg.data;
          const SOFT_CEIL = 235; // headroom below pure white so it still reads as a bright highlight, not a flat wall
          for (let p = 0; p < bd.length; p += 4) {
            const peak = Math.max(bd[p], bd[p + 1], bd[p + 2]);
            if (peak > SOFT_CEIL) {
              const scale = SOFT_CEIL / peak;
              bd[p] *= scale;
              bd[p + 1] *= scale;
              bd[p + 2] *= scale;
            }
          }
          putScaledImageData(burstImg);
  return gradient;
}
