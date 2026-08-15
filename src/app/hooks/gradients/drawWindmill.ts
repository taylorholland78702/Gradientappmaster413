import { DEG_TO_RAD, TWO_PI } from '../../constants/gradientEffects';
export function drawWindmill(P: any): CanvasGradient | undefined {
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
    windmillZoomResponse,
    windmillMode,
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
          if (windmillMode === 'helix') {
            // Continuous conical-spiral color field — folded in from the
            // former standalone Helix gradient, rendered at half resolution
            // and upscaled (putLowResImageData). Shares this gradient's
            // Turns/Tightness sliders (helixTurns/helixTightness) rather
            // than duplicating them as windmill-specific params.
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, displayWidth, displayHeight);
            const hRenderW = Math.max(1, Math.round(displayWidth * 0.5));
            const hRenderH = Math.max(1, Math.round(displayHeight * 0.5));
            const hInvScale = 2; // 1 / 0.5
            const spiralImageData = ctx.createImageData(hRenderW, hRenderH);
            const spiralData = spiralImageData.data;

            const conicalAudioActive = isAudioEnabled && isAudioReactive;
            const audioConicalTightness = conicalAudioActive ? audioSubBassLevel * 4 : 0;
            const audioConicalTurns = conicalAudioActive ? audioMidsLevel * 3 : 0;
            const conicalZoom = conicalAudioActive ? 1 : zoom;
            const conicalColorShift = conicalAudioActive ? audioTrebleLevel * 0.6 : 0;
            const conicalBassPulse = conicalAudioActive ? audioSubBassLevel : 0;
            const conicalMaxDist = Math.sqrt(centerX ** 2 + centerY ** 2);

            for (let sy = 0; sy < hRenderH; sy++) {
              for (let sx = 0; sx < hRenderW; sx++) {
                const dx = sx * hInvScale - centerX;
                const dy = sy * hInvScale - centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const spiralAngle = Math.atan2(dy, dx);
                const rawAngle = spiralAngle + (dist * (helixTightness + audioConicalTightness) * 0.01) * (helixTurns + audioConicalTurns) / conicalZoom + gradientAngle * DEG_TO_RAD;
                const finalAngle = ((rawAngle % TWO_PI) + TWO_PI) % TWO_PI;
                const normalizedAngle = finalAngle / TWO_PI;

                const shiftedAngle = (normalizedAngle + conicalColorShift) % 1;
                const colorPos = shiftedAngle * (gradientColors.length - 1);
                const colorIdx = Math.floor(colorPos);
                const colorFrac = colorPos - colorIdx;
                const color1 = gradientColors[colorIdx % gradientColors.length];
                const color2 = gradientColors[(colorIdx + 1) % gradientColors.length];
                if (!color1 || !color2) continue;

                const radialBoost = 1 + conicalBassPulse * (1 - dist / conicalMaxDist) * 0.8;
                const pixelIndex = (sy * hRenderW + sx) * 4;
                spiralData[pixelIndex]     = Math.min(255, Math.round((color1.r + (color2.r - color1.r) * colorFrac) * radialBoost));
                spiralData[pixelIndex + 1] = Math.min(255, Math.round((color1.g + (color2.g - color1.g) * colorFrac) * radialBoost));
                spiralData[pixelIndex + 2] = Math.min(255, Math.round((color1.b + (color2.b - color1.b) * colorFrac) * radialBoost));
                spiralData[pixelIndex + 3] = 255;
              }
            }
            putLowResImageData(spiralImageData);
            return gradient;
          }
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, displayWidth, displayHeight);

          const spiralAudioActive = isAudioEnabled && isAudioReactive;

          // 1. Bass pulses blade thickness
          const audioThickness = spiralAudioActive ? windmillThickness + audioSubBassLevel * windmillThickness * 1.2 : windmillThickness;
          // 2. Mids boost rotation speed (angle offset accumulates via gradientAngle state externally; here we add a per-frame visual offset)
          const audioAngleOffset = spiralAudioActive ? audioMidsLevel * 120 : 0;
          // 4. Treble cycles color palette position
          const audioColorCycle = spiralAudioActive ? audioTrebleLevel * gradientColors.length : 0;

          const zoomDampening = windmillZoomResponse ?? 0.3;
          const dampenedZoom = 1 + (zoom - 1) * zoomDampening;
          const spiralScale = 1 / dampenedZoom;
          const spiralSegments = 60 * windmillTightness / 5;
          const effectiveSpiralRotations = windmillRotations * spiralScale;

          // windmillZoom scales the whole pattern — higher = zoomed in (fewer bands visible)
          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.scale(windmillZoom, windmillZoom);
          ctx.translate(-centerX, -centerY);

          for (let i = 0; i < spiralSegments; i++) {
            const t = i / spiralSegments;
            const angle = (t * 360 * effectiveSpiralRotations + gradientAngle + audioAngleOffset) * DEG_TO_RAD;

            // 4. Shift color index by treble amount
            const shiftedT = ((t * (gradientColors.length - 1) + audioColorCycle) % (gradientColors.length - 1 || 1));
            const colorIndex = Math.floor(shiftedT) % gradientColors.length;
            const nextColorIndex = (colorIndex + 1) % gradientColors.length;
            const localT = shiftedT - Math.floor(shiftedT);

            const color = gradientColors[colorIndex];
            const nextColor = gradientColors[nextColorIndex];
            if (!color || !nextColor) continue;

            const r = color.r + (nextColor.r - color.r) * localT;
            const g = color.g + (nextColor.g - color.g) * localT;
            const b = color.b + (nextColor.b - color.b) * localT;

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(angle);
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(-maxRadius, -audioThickness / 2, maxRadius * 2, audioThickness);
            ctx.restore();
          }
          ctx.restore(); // undo windmillZoom scale
  return gradient;
}
