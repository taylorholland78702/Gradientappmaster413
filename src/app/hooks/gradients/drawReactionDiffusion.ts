export function drawReactionDiffusion(P: any): CanvasGradient | undefined {
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
          // Gray-Scott reaction-diffusion simulation on a fixed coarse grid,
          // independent of canvas resolution — running the simulation at full
          // display resolution would be far too slow for 60fps. Feed/Kill are
          // the two classic Gray-Scott parameters that determine the pattern
          // family (spots vs stripes vs coral/maze), matching how Marble
          // exposes physically-meaningful sliders rather than abstract ones.
          if (canvas.width === 0 || canvas.height === 0) return gradient;
          const RD_W = 220, RD_H = 140;
          if (!reactionDiffusionGridRef.current) {
            const u = new Float32Array(RD_W * RD_H).fill(1);
            const v = new Float32Array(RD_W * RD_H).fill(0);
            for (let b = 0; b < 6; b++) {
              const bcx = Math.floor(Math.random() * RD_W);
              const bcy = Math.floor(Math.random() * RD_H);
              for (let dy = -3; dy <= 3; dy++) {
                for (let dx = -3; dx <= 3; dx++) {
                  if (dx * dx + dy * dy > 9) continue;
                  const x = (bcx + dx + RD_W) % RD_W;
                  const y = (bcy + dy + RD_H) % RD_H;
                  v[y * RD_W + x] = 1;
                }
              }
            }
            const gridCanvas = document.createElement('canvas');
            gridCanvas.width = RD_W;
            gridCanvas.height = RD_H;
            reactionDiffusionGridRef.current = { u, v, u2: new Float32Array(RD_W * RD_H), v2: new Float32Array(RD_W * RD_H), canvas: gridCanvas };
          }
          const rd = reactionDiffusionGridRef.current;
          let { u, v, u2, v2 } = rd;
          const Du = 1.0, Dv = 0.5;
          const feed = reactionDiffusionFeed, kill = reactionDiffusionKill;
          const steps = Math.max(1, Math.round(reactionDiffusionSpeed * 6));
          const idx = (x: number, y: number) => ((y + RD_H) % RD_H) * RD_W + ((x + RD_W) % RD_W);

          // Gray-Scott is a fully deterministic PDE on a wrapped (toroidal)
          // grid with no boundary noise — once it settles into a local
          // equilibrium there is nothing left to perturb it, so it goes
          // completely and permanently static within a few seconds (this is
          // correct PDE behavior, not a bug, but reads as "broken" for a
          // live visual). Periodically injecting a fresh seed blob — same
          // shape as the initial seeding — keeps the system perpetually
          // disturbed so it never fully locks up, similar to how real
          // Gray-Scott art demos stay alive via continuous small perturbations.
          if (Math.random() < 0.004 * reactionDiffusionSpeed) {
            const bcx = Math.floor(Math.random() * RD_W);
            const bcy = Math.floor(Math.random() * RD_H);
            for (let dy = -3; dy <= 3; dy++) {
              for (let dx = -3; dx <= 3; dx++) {
                if (dx * dx + dy * dy > 9) continue;
                v[idx(bcx + dx, bcy + dy)] = 1;
              }
            }
          }

          for (let s = 0; s < steps; s++) {
            for (let y = 0; y < RD_H; y++) {
              for (let x = 0; x < RD_W; x++) {
                const i = y * RD_W + x;
                const lapU = u[idx(x - 1, y)] + u[idx(x + 1, y)] + u[idx(x, y - 1)] + u[idx(x, y + 1)] - 4 * u[i];
                const lapV = v[idx(x - 1, y)] + v[idx(x + 1, y)] + v[idx(x, y - 1)] + v[idx(x, y + 1)] - 4 * v[i];
                const uu = u[i], vv = v[i];
                const reaction = uu * vv * vv;
                u2[i] = Math.min(1, Math.max(0, uu + (Du * lapU - reaction + feed * (1 - uu))));
                v2[i] = Math.min(1, Math.max(0, vv + (Dv * lapV + reaction - (kill + feed) * vv)));
              }
            }
            [u, u2] = [u2, u];
            [v, v2] = [v2, v];
          }
          rd.u = u; rd.v = v; rd.u2 = u2; rd.v2 = v2;

          const rdImageData = new ImageData(RD_W, RD_H);
          const rdData = rdImageData.data;
          for (let i = 0; i < RD_W * RD_H; i++) {
            const t = Math.min(1, Math.max(0, v[i] * 3));
            const colorPos = t * (gradientColors.length - 1);
            const colorIdx = Math.floor(colorPos);
            const colorFrac = colorPos - colorIdx;
            const c1 = gradientColors[colorIdx] || gradientColors[0];
            const c2 = gradientColors[Math.min(colorIdx + 1, gradientColors.length - 1)] || c1;
            const di = i * 4;
            rdData[di] = Math.round(c1.r + (c2.r - c1.r) * colorFrac);
            rdData[di + 1] = Math.round(c1.g + (c2.g - c1.g) * colorFrac);
            rdData[di + 2] = Math.round(c1.b + (c2.b - c1.b) * colorFrac);
            rdData[di + 3] = 255;
          }
          const rdCtx = rd.canvas.getContext('2d')!;
          rdCtx.putImageData(rdImageData, 0, 0);
          // Explicit smoothing + a light blur on the upscale draw — the sim
          // grid is coarse relative to display resolution, so bilinear
          // interpolation alone still shows a faint grid; the blur hides the
          // remainder for a soft, painterly result instead of a visible mesh.
          ctx.imageSmoothingEnabled = true;
          ctx.filter = 'blur(1.5px)';
          ctx.drawImage(rd.canvas, 0, 0, RD_W, RD_H, 0, 0, displayWidth, displayHeight);
          ctx.filter = 'none';
  return gradient;
}
