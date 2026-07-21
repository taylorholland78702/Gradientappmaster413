import { getMappedColor } from '../../utils/fieldCurve';

// Duplicated rather than imported from InteractiveGradient.tsx (same reason
// useMiscState.ts duplicates it) — Display mode must never run its own
// Gray-Scott simulation, only render whatever `v` array the controller last
// pushed over the anim-sync channel (see the receiver in
// InteractiveGradient.tsx), or the two windows show entirely different
// patterns instead of just drifting out of phase.
const IS_DISPLAY_MODE = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('display') === '1';

export function drawReactionDiffusion(P: any): CanvasGradient | undefined {
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
            reactionDiffusionGridRef.current = { u, v, u2: new Float32Array(RD_W * RD_H), v2: new Float32Array(RD_W * RD_H), canvas: gridCanvas, time: 0 };
          }
          const rd = reactionDiffusionGridRef.current;
          let { u, v, u2, v2 } = rd;
          // Du/Dv are the classic Gray-Scott ratio (2:1), but the explicit-Euler
          // step below has no time-step scaling, so applying them at full
          // strength (dt=1) blows past the ~0.25 stability limit for a 4-neighbor
          // Laplacian — the field oscillates cell-to-cell instead of diffusing
          // smoothly, which is what was rendering as speckled noise along thin
          // worms instead of solid Turing spots/coral. dt keeps each step stable;
          // steps is scaled up to compensate so the simulation still covers the
          // same amount of "diffusion time" per frame as before.
          // The whole simulation step is skipped in Display mode — that tab
          // renders whatever `v` array the controller last pushed over the
          // anim-sync channel (see InteractiveGradient.tsx) instead of
          // running its own independently-seeded Gray-Scott simulation,
          // which is what previously made the two windows show entirely
          // different patterns rather than just drifting out of phase.
          if (!IS_DISPLAY_MODE) {
            const Du = 1.0, Dv = 0.5, dt = 0.2;
            const steps = Math.max(1, Math.round(reactionDiffusionSpeed * 30));
            const idx = (x: number, y: number) => ((y + RD_H) % RD_H) * RD_W + ((x + RD_W) % RD_W);

            // Gray-Scott is a fully deterministic PDE — once it settles into a
            // local equilibrium there is nothing left to perturb it, so with
            // fixed Feed/Kill it goes completely and permanently static within
            // a few seconds (correct PDE behavior, but reads as "broken" for a
            // live visual). Two things keep it perpetually alive instead of
            // relying only on occasional reseed pokes: Feed/Kill are slowly,
            // continuously drifted around the slider values (a slow orbit, not
            // a random walk, so it keeps returning near the chosen pattern
            // family rather than wandering off it) so the system's target
            // equilibrium keeps moving out from under it, and a steady light
            // sprinkle of single-cell perturbations every frame (instead of one
            // big blob every ~4s) keeps the whole field gently simmering.
            // Bass speeds up simulation steps (the pattern churns faster on a
            // kick), treble widens the feed/kill drift so the spot/stripe
            // balance shifts more on bright content — same living-parameter
            // idea as Julia/Attractor, applied to the PDE's own knobs.
            const rdAudio = isAudioEnabled && isAudioReactive;
            const rdBassMod = rdAudio ? 1 + audioSubBassLevel * 0.8 : 1;
            const rdTrebleMod = rdAudio ? 1 + audioTrebleLevel * 1.2 : 1;
            rd.time += 0.0025 * reactionDiffusionSpeed * rdBassMod;
            const feed = reactionDiffusionFeed + Math.sin(rd.time * 0.6) * 0.006 * rdTrebleMod;
            const kill = reactionDiffusionKill + Math.cos(rd.time * 0.4) * 0.004 * rdTrebleMod;

            const sprinkleCount = Math.max(1, Math.round(reactionDiffusionSpeed * 2 * (rdAudio ? 1 + audioMidsLevel * 0.6 : 1)));
            for (let n = 0; n < sprinkleCount; n++) {
              if (Math.random() < 0.15) {
                v[idx(Math.floor(Math.random() * RD_W), Math.floor(Math.random() * RD_H))] = 1;
              }
            }
            if (Math.random() < 0.01 * reactionDiffusionSpeed) {
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
                  u2[i] = Math.min(1, Math.max(0, uu + dt * (Du * lapU - reaction + feed * (1 - uu))));
                  v2[i] = Math.min(1, Math.max(0, vv + dt * (Dv * lapV + reaction - (kill + feed) * vv)));
                }
              }
              [u, u2] = [u2, u];
              [v, v2] = [v2, v];
            }
            rd.u = u; rd.v = v; rd.u2 = u2; rd.v2 = v2;
          } else {
            v = rd.v;
          }

          const rdImageData = new ImageData(RD_W, RD_H);
          const rdData = rdImageData.data;
          for (let i = 0; i < RD_W * RD_H; i++) {
            const t = Math.min(1, Math.max(0, v[i] * 3));
            const c = getMappedColor(t, gradientColors, fieldContrast, paletteMode, paletteBands);
            const di = i * 4;
            rdData[di] = Math.round(c.r);
            rdData[di + 1] = Math.round(c.g);
            rdData[di + 2] = Math.round(c.b);
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
