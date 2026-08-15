import { getMappedColor } from '../../utils/fieldCurve';
import { getScratchImageData } from '../../utils/scratchCanvas';

export function drawTopographic(P: any): CanvasGradient | undefined {
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
          // Posterized noise field with a dark contour line drawn at every band
          // boundary — same idea as elevation-line maps. Deliberately a
          // simpler, self-contained noise formula (not sharing Noise's own
          // sliders) so Topographic has its own independent Scale/Bands/Line
          // controls rather than fighting over shared state.
          // Rendered at half resolution and upscaled (putLowResImageData).
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, displayWidth, displayHeight);
          const tRenderW = Math.max(1, Math.round(displayWidth * 0.5));
          const tRenderH = Math.max(1, Math.round(displayHeight * 0.5));
          const tInvScale = 2; // 1 / 0.5
          const topoImageData = getScratchImageData('topographic', ctx, tRenderW, tRenderH);
          const topoData = topoImageData.data;
          const topoCX = displayWidth / 2, topoCY = displayHeight / 2;
          const topoScaleFactor = topographicScale * 0.001;
          const topoBands = Math.max(2, Math.round(topographicBands));
          const topoLineWidth = topographicLineWidth;
          const topoAudioActive = isAudioEnabled && isAudioReactive;
          const topoColorShift = topoAudioActive ? audioTrebleLevel * 0.4 : 0;
          // A slow drift tied to gradientAngle so the field isn't perfectly
          // static — matches how other gradients keep moving under auto-play.
          const topoPhase = gradientAngle * 0.01;
          const topoSeedX = structuralSeed * 130;
          const topoSeedY = structuralSeed * 90;

          for (let ty = 0; ty < tRenderH; ty++) {
            for (let tx = 0; tx < tRenderW; tx++) {
              const dx = tx * tInvScale - topoCX + topoSeedX, dy = ty * tInvScale - topoCY + topoSeedY;
              const n1 = Math.sin(dx * topoScaleFactor + topoPhase) * Math.cos(dy * topoScaleFactor * 1.15 - topoPhase);
              const n2 = Math.sin((dx + dy) * topoScaleFactor * 0.5) * 0.5;
              const n3 = Math.cos((dx - dy) * topoScaleFactor * 0.37) * 0.35;
              const raw = (n1 + n2 + n3) / 1.85;
              const elevation = (raw + 1) / 2;

              const bandPos = elevation * topoBands;
              const bandIdx = Math.floor(bandPos);
              const bandFrac = bandPos - bandIdx;
              const distToLine = Math.min(bandFrac, 1 - bandFrac);

              const t = ((bandIdx / topoBands) + topoColorShift) % 1;
              const mapped = getMappedColor(t, gradientColors, fieldContrast, paletteMode, paletteBands);
              let r = mapped.r;
              let g = mapped.g;
              let b = mapped.b;

              if (distToLine < topoLineWidth) {
                const lineMix = 1 - (distToLine / topoLineWidth);
                r *= (1 - lineMix * 0.85);
                g *= (1 - lineMix * 0.85);
                b *= (1 - lineMix * 0.85);
              }

              const idx = (ty * tRenderW + tx) * 4;
              topoData[idx] = Math.round(Math.min(255, Math.max(0, r)));
              topoData[idx + 1] = Math.round(Math.min(255, Math.max(0, g)));
              topoData[idx + 2] = Math.round(Math.min(255, Math.max(0, b)));
              topoData[idx + 3] = 255;
            }
          }
          putLowResImageData(topoImageData);
  return gradient;
}
