export function applyHalftone(P: any): void {
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
    getDisplayImageData,
    effectType,
    index,
    isFirstEffect,
    audioModulation,
    imageData
  } = P;
            if (!imageData) return;
            const sz = halftoneSize;
            const idat = imageData.data;
            const getHTPixel = (px: number, py: number) => {
              const ix = Math.max(0, Math.min(displayWidth - 1, Math.round(px)));
              const iy = Math.max(0, Math.min(displayHeight - 1, Math.round(py)));
              const idx = (iy * displayWidth + ix) * 4;
              return [idat[idx], idat[idx+1], idat[idx+2]] as [number, number, number];
            };

            if (halftoneCMYK) {
              // CMYK halftone: 4 rotated dot grids, multiply blend
              ctx.fillStyle = '#fff';
              ctx.fillRect(0, 0, displayWidth, displayHeight);
              ctx.globalCompositeOperation = 'multiply';
              const diag = Math.sqrt(displayWidth * displayWidth + displayHeight * displayHeight) / 2 + sz * 2;
              const steps = Math.ceil(diag * 2 / sz);
              const cmykChannels = [
                { angle: 15,  color: 'rgba(0,255,255,1)'   }, // Cyan
                { angle: 75,  color: 'rgba(255,0,255,1)'   }, // Magenta
                { angle: 0,   color: 'rgba(255,255,0,1)'   }, // Yellow
                { angle: 45,  color: 'rgba(0,0,0,1)'       }, // Key (black)
              ];
              for (let ci = 0; ci < cmykChannels.length; ci++) {
                const ch = cmykChannels[ci];
                // Move drives per-dot variation over time (below), not the grid's
                // orientation — spinning the whole lattice read as the entire
                // canvas rotating rather than the dots themselves moving.
                const angleRad = ch.angle * Math.PI / 180;
                const cosA = Math.cos(angleRad), sinA = Math.sin(angleRad);
                ctx.fillStyle = ch.color;
                for (let gi = -steps; gi <= steps; gi++) {
                  for (let gj = -steps; gj <= steps; gj++) {
                    const rx = gi * sz, ry = gj * sz;
                    let px = centerX + rx * cosA - ry * sinA;
                    let py = centerY + rx * sinA + ry * cosA;
                    if (halftoneMove) {
                      // Each dot wobbles around its own lattice position instead of
                      // the whole grid spinning — the motion reads as belonging to
                      // the dots themselves, not the canvas.
                      const seed = Math.sin(gi * 127.1 + gj * 311.7 + ci * 7.31) * 43758.5453;
                      const seedFrac = seed - Math.floor(seed);
                      const jAngle = seedFrac * Math.PI * 2;
                      const jAmt = Math.sin(halftoneTimeRef.current * 2 + seedFrac * 20) * sz * 0.18;
                      px += Math.cos(jAngle) * jAmt;
                      py += Math.sin(jAngle) * jAmt;
                    }
                    if (px < -sz || px > displayWidth + sz || py < -sz || py > displayHeight + sz) continue;
                    const [r, g, b] = getHTPixel(px, py);
                    const rn = r/255, gn = g/255, bn = b/255;
                    const k = 1 - Math.max(rn, gn, bn);
                    const denom = k === 1 ? 1 : (1 - k);
                    const c = k === 1 ? 0 : (1 - rn - k) / denom;
                    const m = k === 1 ? 0 : (1 - gn - k) / denom;
                    const y = k === 1 ? 0 : (1 - bn - k) / denom;
                    const channelVal = ci === 0 ? c : ci === 1 ? m : ci === 2 ? y : k;
                    const s2 = Math.sin(px * 12.9898 + py * 78.233 + (halftoneMove ? halftoneTimeRef.current * 1000 : 0)) * 43758.5453;
                    const vf = 1 + ((s2 - Math.floor(s2)) - 0.5) * halftoneVariation;
                    const dotR = channelVal * (sz / 2) * 0.95 * vf;
                    if (dotR < 0.3) continue;
                    ctx.beginPath();
                    ctx.arc(px, py, dotR, 0, Math.PI * 2);
                    ctx.fill();
                  }
                }
              }
              ctx.globalCompositeOperation = 'source-over';
            } else {
              // Standard halftone
              ctx.fillStyle = '#000';
              ctx.fillRect(0, 0, displayWidth, displayHeight);
              const htHalfCols = Math.ceil(displayWidth / sz / 2) + 1;
              const htHalfRows = Math.ceil(displayHeight / sz / 2) + 1;
              for (let hr = -htHalfRows; hr <= htHalfRows; hr++) {
                for (let hc = -htHalfCols; hc <= htHalfCols; hc++) {
                  let x = centerX + hc * sz;
                  let y = centerY + hr * sz;
                  if (halftoneMove) {
                    // Per-dot wobble around its own lattice position — see CMYK
                    // branch above for why this replaces whole-grid rotation.
                    const seed = Math.sin(hc * 127.1 + hr * 311.7) * 43758.5453;
                    const seedFrac = seed - Math.floor(seed);
                    const jAngle = seedFrac * Math.PI * 2;
                    const jAmt = Math.sin(halftoneTimeRef.current * 2 + seedFrac * 20) * sz * 0.18;
                    x += Math.cos(jAngle) * jAmt;
                    y += Math.sin(jAngle) * jAmt;
                  }
                  const [pr, pg, pb] = getHTPixel(x, y);
                  const br = (pr + pg + pb) / 3;
                  const s = Math.sin(x * 12.9898 + y * 78.233 + (halftoneMove ? halftoneTimeRef.current * 1000 : 0)) * 43758.5453;
                  const vf = 1 + ((s - Math.floor(s)) - 0.5) * halftoneVariation;
                  const dotR = (br / 255) * (sz / 2) * vf;
                  ctx.fillStyle = `rgb(${pr},${pg},${pb})`;
                  ctx.beginPath();
                  ctx.arc(x, y, dotR, 0, Math.PI * 2);
                  ctx.fill();
                }
              }
            }
}
