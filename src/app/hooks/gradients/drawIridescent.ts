import { DEG_TO_RAD, TWO_PI } from '../../constants/gradientEffects';
import { getMappedColor } from '../../utils/fieldCurve';
export function drawIridescent(P: any): CanvasGradient | undefined {
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
    paletteBands,
    paletteMode,
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
          // Iridescent (Spectral) gradient - thin-film interference effect,
          // rendered at half resolution and upscaled (putLowResImageData) —
          // the per-pixel atan2/sqrt/sin/cos + HSV->RGB branching below is too
          // expensive to run at full display resolution every frame without
          // visibly tanking FPS.
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, displayWidth, displayHeight);

          const iRenderW = Math.max(1, Math.round(displayWidth * 0.5));
          const iRenderH = Math.max(1, Math.round(displayHeight * 0.5));
          const iInvScale = 2; // 1 / 0.5
          const iridescentImageData = ctx.createImageData(iRenderW, iRenderH);
          const iridescentData = iridescentImageData.data;
        
          // Audio reactivity: bass affects interference angle
          const audioIridescentAngle = (isAudioEnabled && isAudioReactive) 
            ? audioSubBassLevel * 180 // Up to 180 degree shift
            : 0;
          const totalIridescentAngle = (iridescentAngle + gradientAngle + audioIridescentAngle) * DEG_TO_RAD;
        
          // Audio reactivity: mids affect intensity
          const audioIridescentIntensity = (isAudioEnabled && isAudioReactive) 
            ? audioSubBassLevel * 0.5 // Up to 0.5 extra intensity
            : 0;
          const totalIridescentIntensity = iridescentIntensity + audioIridescentIntensity;
        
          for (let iy = 0; iy < iRenderH; iy++) {
            for (let ix = 0; ix < iRenderW; ix++) {
              const fx = ix * iInvScale;
              const fy = iy * iInvScale;
              const dx = fx - centerX;
              const dy = fy - centerY;
            
              // Calculate viewing angle (simulates looking at surface from different angles)
              const angle = Math.atan2(dy, dx);
              const iridescentZoom = (isAudioEnabled && isAudioReactive) ? 1 : zoom;
              const dist = Math.sqrt(dx * dx + dy * dy) / iridescentZoom;
            
              // Thin-film interference calculation
              // Creates rainbow-like color shifts based on angle and distance
              const interference = Math.sin(angle * 3 + totalIridescentAngle) * 
                                 Math.cos(dist * 0.01 * iridescentScale) * 
                                 totalIridescentIntensity;
            
              // Map interference to color spectrum
              const hue = ((interference + 1) * 0.5 * 360) % 360;
            
              // Convert HSV to RGB for spectral effect
              const h = hue / 60;
              const c = totalIridescentIntensity;
              const x = c * (1 - Math.abs((h % 2) - 1));
            
              let r = 0, g = 0, b = 0;
              if (h >= 0 && h < 1) { r = c; g = x; b = 0; }
              else if (h >= 1 && h < 2) { r = x; g = c; b = 0; }
              else if (h >= 2 && h < 3) { r = 0; g = c; b = x; }
              else if (h >= 3 && h < 4) { r = 0; g = x; b = c; }
              else if (h >= 4 && h < 5) { r = x; g = 0; b = c; }
              else if (h >= 5 && h < 6) { r = c; g = 0; b = x; }
            
              // Treble shifts color palette; bass radial pulse from center
              const iriColorShift = (isAudioEnabled && isAudioReactive) ? audioTrebleLevel * 0.6 : 0;
              const iriBassPulse = (isAudioEnabled && isAudioReactive) ? audioSubBassLevel : 0;
              const iriMaxDist = Math.sqrt(centerX ** 2 + centerY ** 2);
              const iriDist2 = Math.sqrt(dx * dx + dy * dy);
              const iriRadialBoost = 1 + iriBassPulse * (1 - iriDist2 / iriMaxDist) * 0.8;

              const rawColorPos = ((interference + 1) * 0.5 + iriColorShift) % 1;
              const mapped = getMappedColor(rawColorPos, gradientColors, fieldContrast ?? 1, paletteMode ?? 'linear', paletteBands ?? 4);

              const baseR = mapped.r * iriRadialBoost;
              const baseG = mapped.g * iriRadialBoost;
              const baseB = mapped.b * iriRadialBoost;

              const idx = (iy * iRenderW + ix) * 4;
              iridescentData[idx]     = Math.min(255, baseR * (1 - totalIridescentIntensity * 0.5) + r * 255 * totalIridescentIntensity);
              iridescentData[idx + 1] = Math.min(255, baseG * (1 - totalIridescentIntensity * 0.5) + g * 255 * totalIridescentIntensity);
              iridescentData[idx + 2] = Math.min(255, baseB * (1 - totalIridescentIntensity * 0.5) + b * 255 * totalIridescentIntensity);
              iridescentData[idx + 3] = 255;
            }
          }

          putLowResImageData(iridescentImageData);
  return gradient;
}
