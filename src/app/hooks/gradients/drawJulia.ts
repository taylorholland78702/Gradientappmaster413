import { DEG_TO_RAD, TWO_PI } from '../../constants/gradientEffects';
import { getMappedColor } from '../../utils/fieldCurve';
import { getScratchImageData } from '../../utils/scratchCanvas';
export function drawJulia(P: any): CanvasGradient | undefined {
  const {
    fieldContrast,
    paletteMode,
    paletteBands,
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
    getDisplayImageData
  } = P;
  let gradient: CanvasGradient | undefined;
          // Escape-time fractal on the complex plane (z = z² + c). Rendered
          // at a small fixed internal resolution and upscaled — per-pixel
          // iteration (up to ~120 steps/pixel) at full canvas resolution
          // every frame would be far too slow for 60fps, same reasoning as
          // Reaction-Diffusion's fixed coarse grid.
          if (canvas.width === 0 || canvas.height === 0) return gradient;
          const JULIA_W = 240, JULIA_H = 135;
          if (!juliaCanvasRef.current) {
            const jc = document.createElement('canvas');
            jc.width = JULIA_W;
            jc.height = JULIA_H;
            juliaCanvasRef.current = jc;
          }
          const juliaCanvas = juliaCanvasRef.current;
          const jctx = juliaCanvas.getContext('2d')!;
          const jImageData = getScratchImageData('julia', jctx, JULIA_W, JULIA_H);
          const jData = jImageData.data;

          const jCX = JULIA_W / 2, jCY = JULIA_H / 2;
          const jZoomFactor = (Math.min(JULIA_W, JULIA_H) / 2.2) * juliaZoom;
          const jMaxIter = Math.max(10, Math.round(juliaIterations));
          const jAudioActive = isAudioEnabled && isAudioReactive;
          // Bass nudges zoom, mids/treble drift c — keeps the fractal
          // continuously morphing rather than a static frozen shape, same
          // idea as Attractor's living parameter drift.
          const jZoomAudio = jAudioActive ? 1 + audioSubBassLevel * 0.25 : 1;
          const jCReal = juliaReal + (jAudioActive ? audioMidsLevel * 0.08 : 0);
          const jCImag = juliaImaginary + (jAudioActive ? audioTrebleLevel * 0.08 : 0);
          const jRotRad = gradientAngle * DEG_TO_RAD;
          const jCosR = Math.cos(jRotRad), jSinR = Math.sin(jRotRad);

          for (let jy = 0; jy < JULIA_H; jy++) {
            for (let jx = 0; jx < JULIA_W; jx++) {
              const dx0 = (jx - jCX) / (jZoomFactor * jZoomAudio);
              const dy0 = (jy - jCY) / (jZoomFactor * jZoomAudio);
              let zr = dx0 * jCosR - dy0 * jSinR;
              let zi = dx0 * jSinR + dy0 * jCosR;
              let iter = 0;
              while (zr * zr + zi * zi < 4 && iter < jMaxIter) {
                const zr2 = zr * zr - zi * zi + jCReal;
                const zi2 = 2 * zr * zi + jCImag;
                zr = zr2; zi = zi2;
                iter++;
              }
              let t: number;
              if (iter >= jMaxIter) {
                t = 0;
              } else {
                // Smooth (continuous) escape coloring instead of banding by
                // raw integer iteration count.
                const mag2 = Math.max(zr * zr + zi * zi, 1e-6);
                const logZn = Math.log(mag2) / 2;
                const nu = Math.log(Math.max(logZn / Math.LN2, 1e-6)) / Math.LN2;
                const smoothIter = iter + 1 - nu;
                t = Math.abs((smoothIter / jMaxIter) % 1);
              }
              const c1 = getMappedColor(t, gradientColors, fieldContrast, paletteMode, paletteBands);
              const idx = (jy * JULIA_W + jx) * 4;
              jData[idx] = Math.round(c1.r);
              jData[idx + 1] = Math.round(c1.g);
              jData[idx + 2] = Math.round(c1.b);
              jData[idx + 3] = 255;
            }
          }
          jctx.putImageData(jImageData, 0, 0);
          ctx.imageSmoothingEnabled = true;
          ctx.drawImage(juliaCanvas, 0, 0, JULIA_W, JULIA_H, 0, 0, displayWidth, displayHeight);
  return gradient;
}
