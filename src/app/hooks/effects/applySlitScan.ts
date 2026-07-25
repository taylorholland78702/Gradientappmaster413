import { getScratchCanvas } from '../../utils/scratchCanvas';

export function applySlitScan(P: any): void {
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
            // Temporal pixel stretching. Buffered frames are captured at half
            // linear resolution (1/4 the pixels/memory) — up to 60 full-res
            // ImageData frames retained at once was ~500MB at 1920x1080,
            // real GC pressure on every push/shift. The banding/streaking
            // this effect produces reads the same at half-res since sampling
            // already involves large position jumps between frames; nothing
            // sharp is lost that the effect itself doesn't already blur out.
            const ssDownsample = 0.5;
            const ssBufW = Math.max(1, Math.round(displayWidth * ssDownsample));
            const ssBufH = Math.max(1, Math.round(displayHeight * ssDownsample));
            const ssCapture = getScratchCanvas('slitScanCapture', ssBufW, ssBufH);
            const ssCaptureCtx = ssCapture.getContext('2d')!;
            ssCaptureCtx.drawImage(canvas, 0, 0, ssBufW, ssBufH);
            const ssImg = ssCaptureCtx.getImageData(0, 0, ssBufW, ssBufH);
            slitScanBufferRef.current.push(ssImg);
            if (slitScanBufferRef.current.length > 60) slitScanBufferRef.current.shift();

            // With only 1-2 frames buffered (e.g. right after switching
            // direction, before playback has run long enough to fill the
            // buffer -- which never happens at all if paused, since nothing
            // pushes new frames), the radial/circular modes' frame-index
            // boundary shows up as a single hard ring/arc across the canvas
            // instead of a smooth gradient of bands. Rather than wait for
            // real frames to accumulate (which may never happen while
            // paused), pad the buffer with copies of the very first frame
            // captured so it's instantly at a reasonable size on the first
            // draw call after activation -- duplicate frames are harmless
            // (sampling any of them returns identical pixels, so there's no
            // visible seam), and get replaced by real frames as playback
            // continues. Horizontal/vertical hit the same edge case but read
            // as a soft diagonal split rather than a jarring perfect circle,
            // so it's most noticeable here.
            const MIN_BUFFERED_FRAMES = 12;
            if (slitScanBufferRef.current.length === 1 && slitScanBufferRef.current.length < MIN_BUFFERED_FRAMES) {
              while (slitScanBufferRef.current.length < MIN_BUFFERED_FRAMES) {
                slitScanBufferRef.current.push(ssImg);
              }
            }

            if (slitScanBufferRef.current.length >= MIN_BUFFERED_FRAMES) {
              const out = ctx.createImageData(displayWidth, displayHeight);
              const int = slitScanIntensity;
              const buf = slitScanBufferRef.current;

              // Frame selection stays bounded to the buffer's actual range (raising
              // Intensity past 1 would otherwise make fi blow past buf.length and
              // clamp to the same last frame across the whole screen, collapsing
              // the banding). The raw (uncapped) intensity is used separately below
              // for the shift/twist magnitude, which is what "Intensity" now scales.
              const frameSel = Math.min(int, 1);
              const midBuf = (buf.length - 1) / 2;
              // Buffered frames are ssBufW x ssBufH (see the downsampled
              // capture above), so sample coordinates — computed at full
              // display resolution below, unchanged — need scaling down by
              // ssDownsample before indexing into a buffered frame.
              const sampleBuf = (sf: ImageData, sx: number, sy: number) => {
                const bx = Math.max(0, Math.min(ssBufW - 1, Math.round(sx * ssDownsample)));
                const by = Math.max(0, Math.min(ssBufH - 1, Math.round(sy * ssDownsample)));
                return (by * ssBufW + bx) * 4;
              };

              if (slitScanDirection === 'horizontal') {
                for (let y = 0; y < displayHeight; y++) {
                  const fi = Math.min(Math.floor((y / displayHeight) * (buf.length - 1) * frameSel), buf.length - 1);
                  const sf = buf[fi];
                  // Shift scales with canvas width (not a fixed px amount) and the
                  // slider's full range now maps to a much larger max displacement
                  // so Intensity actually feels intense at the high end.
                  const shift = Math.round(((fi - midBuf) / midBuf) * int * displayWidth * 0.35);
                  for (let x = 0; x < displayWidth; x++) {
                    // Wrap instead of clamp — clamping collapsed many source columns
                    // onto the same edge pixel, producing a solid stripe artifact.
                    const sx = ((x + shift) % displayWidth + displayWidth) % displayWidth;
                    const i = (y * displayWidth + x) * 4;
                    const si = sampleBuf(sf, sx, y);
                    out.data[i] = sf.data[si];
                    out.data[i+1] = sf.data[si+1];
                    out.data[i+2] = sf.data[si+2];
                    out.data[i+3] = sf.data[si+3];
                  }
                }
              } else if (slitScanDirection === 'vertical') {
                for (let x = 0; x < displayWidth; x++) {
                  const fi = Math.min(Math.floor((x / displayWidth) * (buf.length - 1) * frameSel), buf.length - 1);
                  const sf = buf[fi];
                  const shift = Math.round(((fi - midBuf) / midBuf) * int * displayHeight * 0.35);
                  for (let y = 0; y < displayHeight; y++) {
                    const sy = ((y + shift) % displayHeight + displayHeight) % displayHeight;
                    const i = (y * displayWidth + x) * 4;
                    const si = sampleBuf(sf, x, sy);
                    out.data[i] = sf.data[si];
                    out.data[i+1] = sf.data[si+1];
                    out.data[i+2] = sf.data[si+2];
                    out.data[i+3] = sf.data[si+3];
                  }
                }
              } else if (slitScanDirection === 'radial') {
                // Rings that expand/contract in radius AND twist tangentially, so
                // at higher intensity they read as spiraling/folding in on
                // themselves instead of just breathing in and out.
                const cx = displayWidth / 2, cy = displayHeight / 2;
                const md = Math.sqrt(cx*cx + cy*cy);
                for (let y = 0; y < displayHeight; y++) {
                  for (let x = 0; x < displayWidth; x++) {
                    const d = Math.sqrt((x-cx)*(x-cx) + (y-cy)*(y-cy));
                    const fi = Math.min(Math.floor((d / md) * (buf.length - 1) * frameSel), buf.length - 1);
                    const sf = buf[fi];
                    const normOffset = (fi - midBuf) / midBuf;
                    const shift = normOffset * int * md * 0.35;
                    // Reflect instead of clamping to 0 — clamping collapsed every
                    // pixel within |shift| of center onto the exact same source
                    // pixel, producing a solid-color disc in the middle of the canvas.
                    let sd = d + shift;
                    if (sd < 0) sd = -sd;
                    const angle = Math.atan2(y - cy, x - cx);
                    const twist = normOffset * int * 1.4;
                    const sAngle = angle + twist;
                    const sx = Math.max(0, Math.min(displayWidth - 1, Math.round(cx + Math.cos(sAngle) * sd)));
                    const sy = Math.max(0, Math.min(displayHeight - 1, Math.round(cy + Math.sin(sAngle) * sd)));
                    const i = (y * displayWidth + x) * 4;
                    const si = sampleBuf(sf, sx, sy);
                    out.data[i] = sf.data[si];
                    out.data[i+1] = sf.data[si+1];
                    out.data[i+2] = sf.data[si+2];
                    out.data[i+3] = sf.data[si+3];
                  }
                }
              } else {
                // circular: sample frame based on angle around center, with the
                // sample point itself rotated AND pulled toward/away from center by
                // the assigned frame's time offset — at high intensity this reads
                // as rings spinning and folding inward rather than a flat rotation.
                const cx = displayWidth / 2, cy = displayHeight / 2;
                for (let y = 0; y < displayHeight; y++) {
                  for (let x = 0; x < displayWidth; x++) {
                    const angle = Math.atan2(y - cy, x - cx); // -PI to PI
                    const norm = (angle + Math.PI) / (Math.PI * 2); // 0..1
                    const fi = Math.min(Math.floor(norm * (buf.length - 1) * frameSel), buf.length - 1);
                    const sf = buf[fi];
                    const d = Math.sqrt((x-cx)*(x-cx) + (y-cy)*(y-cy));
                    const normOffset = (fi - midBuf) / midBuf;
                    const angleShift = normOffset * int * 1.6;
                    const sAngle = angle + angleShift;
                    let sd = d * (1 - normOffset * int * 0.25);
                    if (sd < 0) sd = -sd;
                    const sx = Math.max(0, Math.min(displayWidth - 1, Math.round(cx + Math.cos(sAngle) * sd)));
                    const sy = Math.max(0, Math.min(displayHeight - 1, Math.round(cy + Math.sin(sAngle) * sd)));
                    const i = (y * displayWidth + x) * 4;
                    const si = sampleBuf(sf, sx, sy);
                    out.data[i] = sf.data[si];
                    out.data[i+1] = sf.data[si+1];
                    out.data[i+2] = sf.data[si+2];
                    out.data[i+3] = sf.data[si+3];
                  }
                }
              }
              putScaledImageData(out);
            }
}
