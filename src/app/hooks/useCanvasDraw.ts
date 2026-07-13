import { useEffect } from 'react';
import {
  ALL_EFFECTS, AUDIO_GRADIENTS, AUDIO_EFFECTS, FULL_GRADIENT_TYPES,
  DEG_TO_RAD, TWO_PI, NO_DRAG_TYPES,
} from '../constants/gradientEffects';
import { pickRandomEmojiSet, splitGraphemes, EMOJI_PICKER_CATEGORIES } from '../components/InteractiveGradient';
import { GRADIENT_DRAW_FNS } from './gradients/_registry';
import { EFFECT_DRAW_FNS } from './effects/_registry';

// Loosely typed for the same reason as useRandomization.ts/useSnapshot.ts's
// params: this hook wires together ~180 values/refs/setters spanning
// nearly every piece of gradient/effect state plus live audio levels and
// animation refs, since the draw function reads all of it. The build
// doesn't type-check (esbuild transpile only) — matches the existing
// PresetData = Record<string, any> convention in usePresets.ts.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CanvasDrawParams = Record<string, any>;

// Draw gradient on canvas — stored imperatively in drawRef so the master RAF
// can call it without triggering React reconciliation. Only re-assigned
// when non-animated params change (see the drawParams useMemo in
// InteractiveGradient.tsx, passed through here as a single param so this
// hook's useEffect depends on it exactly as it did before extraction —
// preserves the original memoization/redraw-trigger timing exactly rather
// than reconstructing a ~150-item dependency array by hand).
export function useCanvasDraw(params: CanvasDrawParams) {
  const {
    activeEffects, addGradientStops, angleCenterX, angleCenterY, angleStartOffset, asciiChars,
    asciiColor, asciiSize, attractorAnimTime, attractorBufferRef, attractorPointCount, attractorPointsRef,
    attractorScale, audioMidsLevel, audioSubBassLevel, audioTrebleLevel, auroraAnimTime,
    auroraBandCount, auroraBandHeight, auroraWaveSpeed, bassThreshold, bloomIntensity, bloomRadius,
    blurGaussianAmount, blurMotionAmount, blurMotionDirection, blurRadialAmount, blurType, canvasRef,
    causticsAnimTime, causticsBrightness, causticsScale, charcoalIntensity, chromaticAngle, chromaticOffset,
    chromaticTrailsBufferRef, chromaticTrailsDecay, chromaticTrailsOffset, colorPins, colorShiftHue, concentricRingCount,
    concentricRingWidth, helixTightness, helixTurns, ditherLevels, ditherType, drawParams,
    glitchIntensity, glitchBlockSize, glitchChromaSplit,
    drawParamsDirtyRef, drawRef, duotoneColor1, duotoneColor2, duotoneColor3, duotoneIntensity,
    duotoneThreeColor, dustCrackleIntensity, emojiAnimTime, emojiChars, emojiOffsetX, emojiSize,
    emojiSizeVariation, fadeDirection, feedbackBufferRef, feedbackDecay, feedbackRotation, feedbackZoom,
    fisheyeCenterX, fisheyeCenterY, fisheyeStrength, flowAnimTime, flowBufferRef, flowParticleCount,
    flowParticlesRef, flowScale, flowThickness, flowerAnimTime, flowerCircles, flowerRotation,
    flowerScale, flowerSpread,
    gradientAngle, gradientAngleRef, gradientColors, gradientColorsRef,
    gradientType, grainIntensity, grainType, gridColumns, gridRotation, gridRows,
    gridShapeSize, gridSides, gridVariation, halftoneCMYK, halftoneMove, halftoneSize,
    halftoneTimeRef, halftoneVariation, iridescentAngle, iridescentIntensity, iridescentScale, isAudioEnabled,
    isAudioReactive, isAutoModeRef, isVCRPlayingRef, kaleidoAngleRef, kaleidoscopeRotateSpeed, kaleidoscopeSegments,
    lavaAnimTime, lavaBlobCount, lavaBlobSize, lavaSpeed, liquidAnimTime, liquidScale,
    liquidStrength, marbleAnimTime, marbleOctaves, marbleTurbulence, marbleVeinFreq, meshGridSize,
    meshJitter, metaballAnimTime, metaballCount, metaballSize, mirrorMode, mirrorTileCount,
    moireAnimTime, moireOffset, moireScale, noiseDirection, noiseOctaves, noiseScale,
    noiseType, noiseWarp, photoBlendMode, photoImageRef, photoOpacity, pixelSize,
    plasmaComplexity, plasmaZoomScale, polygon2Sides, posterizeLevels, prevBassForRippleRef,
    radarBeamWidth, radarFadeLength, radarSweepAngle, radialBurstCount, radialBurstSize, radialBurstSpread,
    radialSizeScale, reactionDiffusionFeed, reactionDiffusionGridRef, reactionDiffusionKill, reactionDiffusionSpeed,
    resolutionMultiplier, rippleAmplitude, rippleAutoFrameRef, rippleRingsRef, scanlineIntensity,
    scanlineSpacing, scanlineSpeed, shapesCount, shapesSides, slitScanBufferRef, slitScanDirection,
    slitScanIntensity, windmillRotations, windmillThickness, windmillTightness, windmillZoom, triangleSize,
    topographicBands, topographicLineWidth, topographicScale,
    juliaReal, juliaImaginary, juliaZoom, juliaIterations, juliaCanvasRef,
    truchetSize, truchetThickness, truchetVariation, vhsGlitchIntensity, vignetteSoftness, vignetteStrength,
    voronoiAnimTime, voronoiCellCount, voronoiDistortion, waveAmplitude, waveDistortionRotation, waveDistortionStrength,
    waveFrequency, waveNumberRef, waveRotationRef, waveScale, zoom, zoomRef,
  } = params;

  useEffect(() => {
    drawParamsDirtyRef.current = true; // signal RAF to redraw with new params
    drawRef.current = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // willReadFrequently forces the whole context onto a software (non-GPU) rendering
    // path — getImageData is only used by specific effects (VHS, dither, slit-scan,
    // ripple, etc.), not the base gradient draw, so leave GPU acceleration on by default.
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Read animated values from refs (updated every frame without React state changes)
    const gradientColors = gradientColorsRef.current;
    const gradientAngle = gradientAngleRef.current;
    const zoom = zoomRef.current;

    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;
    const targetWidth = displayWidth * resolutionMultiplier;
    const targetHeight = displayHeight * resolutionMultiplier;
    // Assigning canvas.width/height forces a full reallocation + clear of the backing
    // store, even when the value is unchanged. Only touch it when the size actually
    // changed (window resize, DPR change) — doing this unconditionally every frame was
    // reallocating the entire canvas 60x/sec and was the dominant cause of jank.
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;
    }

    // Scale context for high-resolution rendering
    // resetTransform first — some browsers skip the state reset when canvas.width
    // hasn't changed, causing ctx.scale to compound across frames (2→4→8→…)
    // which shrinks the CSS coordinate space and moves everything toward (0,0).
    ctx.resetTransform();
    ctx.scale(resolutionMultiplier, resolutionMultiplier);

    // putImageData ignores ctx transforms, so route through drawImage to respect DPR scale
    const putScaledImageData = (imgData: ImageData, dx = 0, dy = 0) => {
      if (resolutionMultiplier === 1) {
        ctx.putImageData(imgData, dx, dy);
      } else {
        const tmp = new OffscreenCanvas(imgData.width, imgData.height);
        (tmp.getContext('2d') as OffscreenCanvasRenderingContext2D).putImageData(imgData, 0, 0);
        ctx.save();
        ctx.resetTransform();
        ctx.drawImage(tmp, dx * resolutionMultiplier, dy * resolutionMultiplier,
          imgData.width * resolutionMultiplier, imgData.height * resolutionMultiplier);
        ctx.restore();
      }
    };

    // ctx.getImageData ignores transforms and reads physical pixels.
    // On Retina (2× DPI), getImageData(0,0,displayWidth,displayHeight) captures only
    // the top-left quarter of the physical canvas — centering the gradient at the
    // captured region's bottom-right edge, which maps to the canvas bottom-right corner
    // after putScaledImageData upscales it. This helper downsamples the full physical
    // canvas to CSS-pixel resolution so effects always capture the complete image.
    const getDisplayImageData = (): ImageData => {
      if (resolutionMultiplier === 1) {
        return ctx.getImageData(0, 0, displayWidth, displayHeight);
      }
      const tmp = new OffscreenCanvas(displayWidth, displayHeight);
      (tmp.getContext('2d') as OffscreenCanvasRenderingContext2D).drawImage(canvas, 0, 0, displayWidth, displayHeight);
      return (tmp.getContext('2d') as OffscreenCanvasRenderingContext2D).getImageData(0, 0, displayWidth, displayHeight);
    };

    // Safety check: require a gradient type to be selected
    if (!gradientType) {
      // Clear canvas and show nothing until Randomize is clicked
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, displayWidth, displayHeight);
      return;
    }

    // Safety check: ensure we have valid colors
    if (!gradientColors || gradientColors.length === 0) {
      return;
    }

    // Pre-calculate common values using display dimensions
    const centerX = displayWidth / 2;
    const centerY = displayHeight / 2;
    const maxRadius = Math.max(displayWidth, displayHeight);
    const fitRadius = Math.min(displayWidth, displayHeight) / 2;
    
    // Apply audio reactivity to gradient angle if enabled. audioSubBassLevel
    // isn't naturally 0-1 — its range depends on the Sub multiplier slider
    // (0-5) and master sensitivity — so without the clamp this could add
    // several multiples of 360° in a single frame on loud sub-bass, an
    // unbounded snap that fights the smooth autonomous rotation happening
    // in the same frame rather than the intended "up to one full turn"
    // wobble on top of it.
    const audioAdjustedAngle = (isAudioEnabled && isAudioReactive)
      ? gradientAngle + (Math.min(1, audioSubBassLevel) * 360)
      : gradientAngle;
    
    const angleRad = audioAdjustedAngle * DEG_TO_RAD;
    const cosAngle = Math.cos(angleRad);
    const sinAngle = Math.sin(angleRad);

    // Fill canvas with black background before drawing
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    // Audio transformations are applied to specific gradient/effect parameters
    // rather than global canvas transformations

    let gradient: CanvasGradient | undefined;

    const drawCtx = {
      ...params, ctx, canvas, gradientColors, gradientAngle, zoom,
      centerX, centerY, maxRadius, fitRadius, angleRad, cosAngle, sinAngle,
      displayWidth, displayHeight, putScaledImageData, getDisplayImageData,
    };
    const gradientDrawFn = gradientType ? GRADIENT_DRAW_FNS[gradientType] : undefined;
    if (gradientDrawFn) {
      gradient = gradientDrawFn(drawCtx);
    }

    // For gradients that use the gradient variable (not direct pixel manipulation)
    const directRenderTypes = ['mesh', 'voronoi', 'iridescent', 'noise', 'plasma', 'waves', 'zigzag', 'tunnel', 'helix', 'radial-burst', 'freeform', 'flower', 'radar'];
    if (!directRenderTypes.includes(gradientType)) {
      if (gradient) {
        addGradientStops(gradient, gradientColors);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, displayWidth, displayHeight);
      }
    }

    // Vocal shimmer — treble energy scatters bright sparkle pixels
    if (isAudioEnabled && isAudioReactive && audioTrebleLevel > 4) {
      const shimmer = Math.min(1, audioTrebleLevel / 90);
      const count = Math.floor(shimmer * shimmer * 400);
      ctx.save();
      for (let i = 0; i < count; i++) {
        const sx = Math.random() * displayWidth;
        const sy = Math.random() * displayHeight;
        const alpha = (0.4 + Math.random() * 0.6) * shimmer;
        const size = Math.random() < 0.75 ? 1 : 2;
        const hue = (Math.random() * 60 + audioTrebleLevel * 3) % 360;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = `hsl(${hue}, 100%, 88%)`;
        ctx.fillRect(sx, sy, size, size);
      }
      ctx.restore();
    }

    // Apply visual effects after gradient is rendered
    // Apply each active effect in sequence
    // Guard against invalid canvas dimensions
    if (canvas.width === 0 || canvas.height === 0) {
      return;
    }
    
    activeEffects.forEach((effectType, index) => {
      // Additional safety check before each effect
      if (canvas.width === 0 || canvas.height === 0) {
        return;
      }
      ctx.save();
      
      // Check if this is the first effect and audio reactivity is enabled
      const isFirstEffect = index === 0;
      const audioModulation = (isAudioEnabled && isAudioReactive && isFirstEffect) 
        ? audioMidsLevel 
        : 0;
      
      // Get imageData only for effects that need it
      const needsImageData = ['invert', 'grain', 'charcoal', 'posterize', 'halftone', 'shift', 'duotone', 'ascii', 'emoji'].includes(effectType);
      let imageData: ImageData | null = null;
      
      if (needsImageData) {
        try {
          imageData = getDisplayImageData();
        } catch (e) {
          console.error('Failed to get image data:', e);
          return;
        }
      }
      
      const effectCtx = {
        ...params, ctx, canvas, gradientColors, gradientAngle, zoom,
        centerX, centerY, maxRadius, fitRadius, angleRad, cosAngle, sinAngle,
        displayWidth, displayHeight, putScaledImageData, getDisplayImageData,
        effectType, index, isFirstEffect, audioModulation, imageData,
      };
      try {
        const effectDrawFn = EFFECT_DRAW_FNS[effectType];
        if (effectDrawFn) {
          effectDrawFn(effectCtx);
        }
      } catch (err) {
        console.error(`Effect "${effectType}" failed:`, err);
        ctx.restore();
      }
      ctx.restore();
    });

    }; // end drawRef.current assignment

    const handleResize = () => {
      // Force re-assignment of drawRef on resize so new dimensions are captured
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawParams]);
}
