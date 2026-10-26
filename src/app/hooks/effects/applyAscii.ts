import { effectSpeedsLive } from '../../constants/effectSpeeds';
import { TWO_PI } from '../../constants/gradientEffects';
import type { EffectCtx } from '../canvasDrawTypes';

// Module-level clock — see applyAuraGlow.ts's agTime: purely cosmetic,
// no undo/redo or Display-mode value depends on it.
let asciiTime = 0;

export function applyAscii(P: EffectCtx): void {
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
            // Halftone's sibling — brightness maps to a character ramp instead
            // of dot size.
            if (!imageData) return;
            const aSize = Math.max(6, asciiSize);
            // Split by character (not UTF-16 unit) so emoji and accented letters count as one each.
            const chars = Array.from(asciiChars.length > 0 ? asciiChars : ' .:-=+*x#%@');
            // Grid anchored so a cell boundary always sits at centerX/centerY
            // (instead of starting at raw (0,0)) — otherwise cells realign
            // away from the top-left corner as asciiSize changes rather than
            // growing/shrinking from the canvas's middle.
            const colStartA = Math.floor(-centerX / aSize) - 1;
            const colEndA = Math.ceil((displayWidth - centerX) / aSize) + 1;
            const rowStartA = Math.floor(-centerY / aSize) - 1;
            const rowEndA = Math.ceil((displayHeight - centerY) / aSize) + 1;
            const idatA = imageData.data;
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, displayWidth, displayHeight);
            ctx.font = `${aSize}px monospace`;
            ctx.textBaseline = 'top';
            // Each cell flickers at its own slow, asynchronous rate between
            // adjacent ramp characters — like an unstable terminal readout —
            // rather than every cell sitting on a fixed character forever.
            asciiTime += 0.03 * effectSpeedsLive.ascii;

            // Pass 1: each cell's brightness. A gradient rarely spans black to white, so mapping brightness straight
            // onto the character list left the first and last characters unused and the middle ones doing all the
            // work. Instead each cell is ranked against the others (a histogram of this frame), so the characters
            // are used evenly, first to last, whatever the picture's brightness.
            const rowsA = rowEndA - rowStartA, colsA = colEndA - colStartA;
            const cellBright = new Float32Array(rowsA * colsA);
            const hist = new Uint32Array(256);
            let lo = 1, hi = 0;
            for (let r = rowStartA; r < rowEndA; r++) {
              for (let c = colStartA; c < colEndA; c++) {
                const px = Math.min(displayWidth - 1, Math.max(0, centerX + c * aSize + Math.floor(aSize / 2)));
                const py = Math.min(displayHeight - 1, Math.max(0, centerY + r * aSize + Math.floor(aSize / 2)));
                const pIdx = (py * displayWidth + px) * 4;
                const v = (idatA[pIdx] + idatA[pIdx + 1] + idatA[pIdx + 2]) / 3 / 255;
                cellBright[(r - rowStartA) * colsA + (c - colStartA)] = v;
                hist[Math.min(255, Math.floor(v * 256))]++;
                if (v < lo) lo = v;
                if (v > hi) hi = v;
              }
            }
            const total = cellBright.length;
            // Fraction of cells strictly darker than each bucket, plus half of the bucket itself.
            const rank = new Float32Array(256);
            let below = 0;
            for (let i = 0; i < 256; i++) { rank[i] = (below + hist[i] / 2) / total; below += hist[i]; }
            // A nearly flat picture has no ranking worth spreading; keep its real brightness.
            const flat = hi - lo < 0.02;

            for (let r = rowStartA; r < rowEndA; r++) {
              for (let c = colStartA; c < colEndA; c++) {
                const cellX = centerX + c * aSize;
                const cellY = centerY + r * aSize;
                const px = Math.min(displayWidth - 1, Math.max(0, cellX + Math.floor(aSize / 2)));
                const py = Math.min(displayHeight - 1, Math.max(0, cellY + Math.floor(aSize / 2)));
                const pIdx = (py * displayWidth + px) * 4;
                const pr = idatA[pIdx], pg = idatA[pIdx + 1], pb = idatA[pIdx + 2];
                const cellPhase = (r * 12.9898 + c * 78.233) % TWO_PI;
                const flicker = Math.sin(asciiTime + cellPhase) * 0.06;
                const v = cellBright[(r - rowStartA) * colsA + (c - colStartA)];
                const level = flat ? v : rank[Math.min(255, Math.floor(v * 256))];
                const brightness = Math.max(0, Math.min(1, level + flicker));
                const charIdx = Math.min(chars.length - 1, Math.floor(brightness * chars.length));
                const ch = chars[charIdx];
                if (ch === ' ') continue;
                ctx.fillStyle = asciiColor ? `rgb(${pr},${pg},${pb})` : '#ffffff';
                ctx.fillText(ch, cellX, cellY);
              }
            }
}
