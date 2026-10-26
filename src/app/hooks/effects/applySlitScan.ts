import { getScratchCanvas, getScratchImageData } from '../../utils/scratchCanvas';
import type { EffectCtx } from '../canvasDrawTypes';
import { buildSlitScanMap, gatherSlitScan, slitScanMapKey, type SlitScanMap } from './slitScanSampling';

// ImageData viewed as 32-bit pixels, so a pixel copies in one read and write.
const views = new WeakMap<ImageData, Uint32Array>();
const pixels32 = (img: ImageData): Uint32Array => {
  let v = views.get(img);
  if (!v || v.buffer !== img.data.buffer) { v = new Uint32Array(img.data.buffer); views.set(img, v); }
  return v;
};
let slitScanMap: SlitScanMap | null = null;
let slitScanAccum = 0;

export function applySlitScan(P: EffectCtx): void {
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
    chromaticAngle,
    chromaticOffset,
    chromaticTrailsBufferRef,
    chromaticTrailsDecay,
    chromaticTrailsOffset,
    colorShiftHue,
    concentricRingCount,
    concentricRingWidth,
    helixTightness,
    helixTurns,
    ditherLevels,
    ditherType,
    drawParams,
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
    metaballAnimTime,
    metaballCount,
    metaballSize,
    mirrorMode,
    mirrorTileCount,
    noiseDirection,
    noiseOctaves,
    noiseScale,
    noiseType,
    noiseWarp,
    photoBlendMode,
    photoImageRef,
    photoOpacity,
    pixelSize,
    polygon2Sides,
    posterizeLevels,
    radialBurstCount,
    radialBurstSize,
    radialBurstSpread,
    radialSizeScale,
    reactionDiffusionFeed,
    reactionDiffusionGridRef,
    reactionDiffusionKill,
    reactionDiffusionSpeed,
    resolutionMultiplier,
    shapesCount,
    shapesSides,
    slitScanBufferRef,
    slitScanDirection,
    slitScanIntensity,
    slitScanHistory, slitScanSpeed,
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
    waveDistortionRotation,
    waveDistortionStrength,
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
            const maxHistory = Math.max(12, Math.round(slitScanHistory ?? 60));
            // Speed is how many frames enter the buffer per draw: 1 is one each time, 0.5 one every other draw, 2 two
            // at once (the second a repeat of the first, which moves the pattern along twice as fast). The first
            // frame is always taken so the buffer is never empty.
            slitScanAccum += Math.max(0, slitScanSpeed ?? 1);
            let ssPush = Math.min(8, Math.floor(slitScanAccum));
            slitScanAccum -= Math.floor(slitScanAccum);
            if (slitScanBufferRef.current.length === 0 && ssPush === 0) ssPush = 1;
            let ssImg: ImageData | null = null;
            if (ssPush > 0) {
              const ssCapture = getScratchCanvas('slitScanCapture', ssBufW, ssBufH);
              const ssCaptureCtx = ssCapture.getContext('2d')!;
              ssCaptureCtx.drawImage(canvas, 0, 0, ssBufW, ssBufH);
              ssImg = ssCaptureCtx.getImageData(0, 0, ssBufW, ssBufH);
              for (let k = 0; k < ssPush; k++) slitScanBufferRef.current.push(ssImg);
              while (slitScanBufferRef.current.length > maxHistory) slitScanBufferRef.current.shift();
            }

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
                slitScanBufferRef.current.push(slitScanBufferRef.current[0]);
              }
            }

            if (slitScanBufferRef.current.length >= MIN_BUFFERED_FRAMES) {
              const out = getScratchImageData('slit-scan', ctx, displayWidth, displayHeight);
              const buf = slitScanBufferRef.current;

              // Which buffered frame, and which pixel of it, each output pixel reads depends only on the
              // settings and canvas size, so it is built once (slitScanSampling.ts) and every frame is a gather.
              const settings = {
                direction: slitScanDirection, width: displayWidth, height: displayHeight, bufLen: buf.length,
                intensity: slitScanIntensity, bufW: ssBufW, bufH: ssBufH, downsample: ssDownsample,
              };
              if (!slitScanMap || slitScanMap.key !== slitScanMapKey(settings)) slitScanMap = buildSlitScanMap(settings);
              gatherSlitScan(pixels32(out), buf.map(pixels32), slitScanMap, slitScanIntensity);
              putScaledImageData(out);
            }
}
