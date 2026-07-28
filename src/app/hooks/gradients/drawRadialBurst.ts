import { DEG_TO_RAD, TWO_PI } from '../../constants/gradientEffects';
export function drawRadialBurst(P: any): CanvasGradient | undefined {
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
    radialBurstMode,
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
          if (radialBurstMode === 'sweep') {
            // Rotating radar-style sweep — folded in from the former
            // standalone Radar gradient, rendered at half resolution and
            // upscaled (putLowResImageData). See InteractiveGradient.tsx's
            // RAF loop for radarSweepAngle's per-frame animation, gated on
            // radialBurstModeRef instead of a 'radar' gradientType now.
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, displayWidth, displayHeight);

            const audioRadarTrail = (isAudioEnabled && isAudioReactive) ? audioSubBassLevel * 120 : 0;
            const audioRadarFlash = (isAudioEnabled && isAudioReactive) ? audioMidsLevel : 0;
            const effectiveRadarFadeLength = Math.min(360, radarFadeLength + audioRadarTrail);

            const rRenderW = Math.max(1, Math.round(displayWidth * 0.5));
            const rRenderH = Math.max(1, Math.round(displayHeight * 0.5));
            const rInvScale = 2; // 1 / 0.5
            const radarImageData = ctx.createImageData(rRenderW, rRenderH);
            const radarData = radarImageData.data;

            for (let ry = 0; ry < rRenderH; ry++) {
              for (let rx = 0; rx < rRenderW; rx++) {
                const dx = rx * rInvScale - centerX;
                const dy = ry * rInvScale - centerY;
                const pixelAngle = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;

                let angleDiff = (radarSweepAngle - pixelAngle + 360) % 360;

                let brightness = 0;
                const beamHalf = radarBeamWidth / 2;
                if (angleDiff <= beamHalf) {
                  brightness = 1;
                } else if (angleDiff <= beamHalf + effectiveRadarFadeLength) {
                  brightness = 1 - ((angleDiff - beamHalf) / effectiveRadarFadeLength);
                }
                if (angleDiff <= beamHalf + 3) brightness = Math.max(brightness, audioRadarFlash);

                const colorPos = (pixelAngle / 360) * (gradientColors.length - 1);
                const colorIdx = Math.floor(colorPos);
                const colorFrac = colorPos - colorIdx;
                const color1 = gradientColors[colorIdx % gradientColors.length];
                const color2 = gradientColors[(colorIdx + 1) % gradientColors.length];

                if (!color1 || !color2) continue;

                const r = color1.r + (color2.r - color1.r) * colorFrac;
                const g = color1.g + (color2.g - color1.g) * colorFrac;
                const b = color1.b + (color2.b - color1.b) * colorFrac;

                const idx = (ry * rRenderW + rx) * 4;
                radarData[idx] = r * brightness;
                radarData[idx + 1] = g * brightness;
                radarData[idx + 2] = b * brightness;
                radarData[idx + 3] = 255;
              }
            }

            putLowResImageData(radarImageData);
            return gradient;
          }
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
