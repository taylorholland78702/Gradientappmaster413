export function drawNoise(P: any): CanvasGradient | undefined {
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
    getDisplayImageData
  } = P;
  let gradient: CanvasGradient | undefined;
          // Perlin-style noise gradient
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, displayWidth, displayHeight);
          const noiseImageData = ctx.createImageData(displayWidth, displayHeight);
          const noiseData = noiseImageData.data;

          const audioActive = isAudioEnabled && isAudioReactive;
          const noiseZoom = audioActive ? 1 : zoom;
          // Static spatial pattern — no positional changes on audio
          const baseNoiseScale = (noiseScale * 0.001) / noiseZoom;
          const noiseRotCos = Math.cos(noiseDirection * 0.01);
          const noiseRotSin = Math.sin(noiseDirection * 0.01);
          // Audio: color shift cycles through palette, bass pulse brightens from center
          const noiseColorShift = audioActive ? audioTrebleLevel * 0.6 : 0;
          const noiseBassBoost = audioActive ? audioSubBassLevel : 0;
          const maxNoiseDist = Math.sqrt(displayWidth ** 2 + displayHeight ** 2) / 2;

          const noiseCX = displayWidth / 2;
          const noiseCY = displayHeight / 2;
          const warpStrength = noiseWarp * baseNoiseScale * 300;

          for (let ny = 0; ny < displayHeight; ny++) {
            for (let nx = 0; nx < displayWidth; nx++) {
              const ndx = nx - noiseCX;
              const ndy = ny - noiseCY;
              let rx = ndx * noiseRotCos - ndy * noiseRotSin;
              let ry = ndx * noiseRotSin + ndy * noiseRotCos;

              // Domain warp: displace coordinates by a low-frequency noise layer
              if (noiseWarp > 0) {
                const ws = baseNoiseScale * 0.7;
                rx += warpStrength * Math.sin(rx * ws + ry * ws * 0.3);
                ry += warpStrength * Math.cos(rx * ws * 0.3 + ry * ws);
              }

              let combinedNoise = 0;
              let amplitude = 1;
              let totalAmplitude = 0;

              for (let octave = 0; octave < noiseOctaves; octave++) {
                const frequency = Math.pow(2, octave);
                const scale = baseNoiseScale * frequency;
                // Rotate each octave's basis by a fixed offset (~137.5°, the golden
                // angle) so added octaves reshape the pattern instead of just
                // layering finer detail onto the same axis-aligned grid — this is
                // what makes each Detail value look like a genuinely different
                // shape rather than a sharper version of Detail=1.
                const octAngle = octave * 2.4;
                const oCos = Math.cos(octAngle);
                const oSin = Math.sin(octAngle);
                const orx = rx * oCos - ry * oSin;
                const ory = rx * oSin + ry * oCos;
                const raw = Math.sin(orx * scale + noiseDirection * 0.1 * frequency) *
                            Math.cos(ory * scale + noiseDirection * 0.1 * frequency);
                const n = noiseType === 'ridged'      ? 1 - Math.abs(raw)
                        : noiseType === 'turbulence'  ? Math.abs(raw)
                        : raw;
                combinedNoise += n * amplitude;
                totalAmplitude += amplitude;
                amplitude *= 0.5;
              }

              // Normalize to 0-1 (ridged/turbulence already 0-1 range, smooth is -1 to 1)
              combinedNoise = noiseType === 'smooth'
                ? (combinedNoise / totalAmplitude + 1) / 2
                : combinedNoise / totalAmplitude;

              // Shift color position with treble so palette rotates on audio
              const shiftedPos = (combinedNoise + noiseColorShift) % 1;
              const colorPos = shiftedPos * (gradientColors.length - 1);
              const colorIdx = Math.floor(colorPos);
              const colorFrac = colorPos - colorIdx;
              const color1 = gradientColors[colorIdx % gradientColors.length];
              const color2 = gradientColors[(colorIdx + 1) % gradientColors.length];

              if (!color1 || !color2) continue;

              // Radial brightness pulse from center on bass
              const dist = Math.sqrt(ndx * ndx + ndy * ndy);
              const radialPulse = noiseBassBoost * (1 - dist / maxNoiseDist) * 0.8;
              const boost = 1 + radialPulse;

              const idx = (ny * displayWidth + nx) * 4;
              noiseData[idx]     = Math.min(255, Math.round((color1.r + (color2.r - color1.r) * colorFrac) * boost));
              noiseData[idx + 1] = Math.min(255, Math.round((color1.g + (color2.g - color1.g) * colorFrac) * boost));
              noiseData[idx + 2] = Math.min(255, Math.round((color1.b + (color2.b - color1.b) * colorFrac) * boost));
              noiseData[idx + 3] = 255;
            }
          }
          putScaledImageData(noiseImageData);
  return gradient;
}
