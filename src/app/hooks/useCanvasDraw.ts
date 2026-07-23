import { useEffect, useRef } from 'react';
import {
  ALL_EFFECTS, AUDIO_GRADIENTS, AUDIO_EFFECTS, FULL_GRADIENT_TYPES,
  DEG_TO_RAD, TWO_PI, NO_DRAG_TYPES,
} from '../constants/gradientEffects';
import { pickRandomEmojiSet, splitGraphemes, EMOJI_PICKER_CATEGORIES } from '../components/InteractiveGradient';
import { GRADIENT_DRAW_FNS } from './gradients/_registry';
import { EFFECT_DRAW_FNS } from './effects/_registry';

// Cached OffscreenCanvas scratch buffers for the DPR-scaling helpers below —
// these run on every putScaledImageData/getDisplayImageData call, which
// happens multiple times per frame across several gradient/effect draw
// functions on a Retina display. Allocating a fresh OffscreenCanvas on every
// single call (previous behavior) compounds fast in Multi-FX mode with
// several image-data-consuming effects stacked; reuse two scratch buffers
// instead, resized in place only when dimensions actually change.
const scratchOffscreen: Record<string, OffscreenCanvas | undefined> = {};
function getScratchOffscreen(key: string, width: number, height: number): OffscreenCanvas {
  let c = scratchOffscreen[key];
  if (!c) {
    c = new OffscreenCanvas(width, height);
    scratchOffscreen[key] = c;
  } else if (c.width !== width || c.height !== height) {
    c.width = width;
    c.height = height;
  }
  return c;
}

// Applies every {param, band, amount} audio binding directly onto a draw
// context object by key name, so any entry in MODULATABLE_PARAMS works
// without wiring a bind-icon onto each individual slider row — the context
// already holds every slider value under that same key via the `...params`
// spread the caller built it with.
function applyAudioBindings(target: Record<string, any>, bindings: { param: string; band: string; amount: number }[], levels: { sub: number; mids: number; treble: number; energy: number }) {
  for (const binding of bindings) {
    const base = target[binding.param];
    if (typeof base !== 'number') continue;
    const level = levels[binding.band as keyof typeof levels] ?? 0;
    target[binding.param] = base + level * binding.amount;
  }
}

// Rotates every color's hue by `degrees` (RGB -> HSL -> rotate -> RGB).
// Used by the global chromatic-drift effect below — a single insertion
// point that shifts hue for every gradient/effect at once instead of
// touching all 28 draw functions individually.
function rotateHue(colors: { r: number; g: number; b: number }[], degrees: number) {
  const deg = ((degrees % 360) + 360) % 360;
  if (deg < 0.05) return colors;
  return colors.map(({ r, g, b }) => {
    const rn = r / 255, gn = g / 255, bn = b / 255;
    const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
    const l = (max + min) / 2;
    const d = max - min;
    if (d === 0) return { r, g, b }; // grayscale — no hue to rotate
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h: number;
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0));
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h = (h * 60 + deg) % 360;
    if (h < 0) h += 360;
    h /= 360;
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hue2rgb = (t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    return {
      r: Math.round(hue2rgb(h + 1 / 3) * 255),
      g: Math.round(hue2rgb(h) * 255),
      b: Math.round(hue2rgb(h - 1 / 3) * 255),
    };
  });
}

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
    attractorScale, audioMidsLevel, audioSubBassLevel, audioTrebleLevel, audioEnergy, audioBindings, musicIntensityRef, depthLayerEnabled, depthLayerStrength, auroraAnimTime,
    auroraBandCount, auroraBandHeight, auroraWaveSpeed, bassThreshold, bloomIntensity, bloomRadius,
    blurGaussianAmount, blurMotionAmount, blurMotionDirection, blurRadialAmount, blurType, canvasRef,
    causticsAnimTime, causticsBrightness, causticsScale, chromaticAngle, chromaticOffset,
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

  // Global chromatic drift: continuous hue rotation driven by mids, applied
  // once here rather than per-gradient. Only accumulates while audio is
  // active/reactive, so idle/no-audio sessions render the user's exact
  // chosen palette with zero drift, unchanged from before this existed.
  const hueDriftRef = useRef(0);
  // Crossfade on gradient-type switch: snapshot the last fully-rendered
  // frame right before the type changes, then fade it out over the new
  // frames so switching types (Auto Mode cycling, Shuffle, manual pick)
  // doesn't read as an instant hard cut.
  const prevGradientTypeRef = useRef<string | null>(null);
  const switchSnapshotRef = useRef<HTMLCanvasElement | null>(null);
  const switchStartRef = useRef(0);
  const SWITCH_FADE_MS = 320;

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
        const tmp = getScratchOffscreen('put', imgData.width, imgData.height);
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
      const tmp = getScratchOffscreen('display', displayWidth, displayHeight);
      (tmp.getContext('2d') as OffscreenCanvasRenderingContext2D).drawImage(canvas, 0, 0, displayWidth, displayHeight);
      return (tmp.getContext('2d') as OffscreenCanvasRenderingContext2D).getImageData(0, 0, displayWidth, displayHeight);
    };

    // Crossfade snapshot: on the first frame after gradientType changes,
    // grab whatever's still on the canvas from the last frame (before
    // anything below clears/overwrites it) so it can be faded out on top
    // of the new type below.
    if (prevGradientTypeRef.current === null) {
      prevGradientTypeRef.current = gradientType;
    } else if (gradientType !== prevGradientTypeRef.current && canvas.width > 0 && canvas.height > 0) {
      try {
        const snap = document.createElement('canvas');
        snap.width = displayWidth;
        snap.height = displayHeight;
        snap.getContext('2d')!.drawImage(canvas, 0, 0, displayWidth, displayHeight);
        switchSnapshotRef.current = snap;
        switchStartRef.current = performance.now();
      } catch (err) {
        switchSnapshotRef.current = null;
      }
      prevGradientTypeRef.current = gradientType;
    }

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

    // Global chromatic drift — continuous hue rotation, mids-weighted, only
    // while audio is active (see hueDriftRef declaration above for why).
    const audioActiveForDrift = isAudioEnabled && isAudioReactive;
    // musicIntensity: an automatic macro from musicIntensityRef (see
    // useAudioReactivity.ts) reflecting the track's current dynamics
    // relative to its own recent history — above 1 during a real "drop",
    // below 1 during a quiet stretch. Scales drift and the depth layer
    // below so both settle down in sparse sections instead of running at
    // a constant rate regardless of what's actually happening musically.
    const musicIntensity = musicIntensityRef?.current ?? 1;
    if (audioActiveForDrift) {
      hueDriftRef.current += (0.08 + audioMidsLevel * 0.5) * musicIntensity;
    }
    const renderColors = audioActiveForDrift ? rotateHue(gradientColors, hueDriftRef.current) : gradientColors;

    const drawCtx: Record<string, any> = {
      ...params, ctx, canvas, gradientColors: renderColors, gradientAngle, zoom,
      centerX, centerY, maxRadius, fitRadius, angleRad, cosAngle, sinAngle,
      displayWidth, displayHeight, putScaledImageData, getDisplayImageData,
    };

    if (isAudioEnabled && isAudioReactive && audioBindings && audioBindings.length > 0) {
      applyAudioBindings(drawCtx, audioBindings, { sub: audioSubBassLevel || 0, mids: audioMidsLevel || 0, treble: audioTrebleLevel || 0, energy: audioEnergy || 0 });
    }

    const gradientDrawFn = gradientType ? GRADIENT_DRAW_FNS[gradientType] : undefined;
    if (gradientDrawFn) {
      gradient = gradientDrawFn(drawCtx);
    }

    // For gradients that use the gradient variable (not direct pixel manipulation)
    const directRenderTypes = ['mesh', 'voronoi', 'iridescent', 'noise', 'plasma', 'waves', 'zigzag', 'tunnel', 'helix', 'radial-burst', 'freeform', 'flower', 'radar'];
    if (!directRenderTypes.includes(gradientType)) {
      if (gradient) {
        addGradientStops(gradient, renderColors);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, displayWidth, displayHeight);
      }
    }

    // Vocal shimmer — treble energy scatters bright sparkle pixels. Toned
    // down from the original (threshold 4->12, max count 400->160, alpha
    // scaled down ~40%) — it was firing on almost any treble content and
    // covering large areas of the canvas in dots.
    if (isAudioEnabled && isAudioReactive && audioTrebleLevel > 12) {
      const shimmer = Math.min(1, audioTrebleLevel / 90);
      const count = Math.floor(shimmer * shimmer * 160);
      ctx.save();
      for (let i = 0; i < count; i++) {
        const sx = Math.random() * displayWidth;
        const sy = Math.random() * displayHeight;
        const alpha = (0.25 + Math.random() * 0.35) * shimmer;
        const size = Math.random() < 0.75 ? 1 : 2;
        const hue = (Math.random() * 60 + audioTrebleLevel * 3) % 360;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = `hsl(${hue}, 100%, 88%)`;
        ctx.fillRect(sx, sy, size, size);
      }
      ctx.restore();
    }

    // Depth layer — a second, softer light source offset from center,
    // screen-blended for an atmosphere/parallax feel. Cheap (one radial
    // gradient fill, no second draw-function pass, so no risk of colliding
    // with gradients that keep persistent state in their own buffers, e.g.
    // Attractor/Flow Field/Reaction-Diffusion). Gated behind audio-active
    // so the default no-audio look is completely unchanged.
    if (audioActiveForDrift && depthLayerEnabled !== false && renderColors.length > 0) {
      const strength = depthLayerStrength ?? 1;
      const depthOffsetX = Math.sin(hueDriftRef.current * 0.03) * displayWidth * 0.22;
      const depthOffsetY = Math.cos(hueDriftRef.current * 0.021) * displayHeight * 0.18;
      const dx = centerX + depthOffsetX;
      const dy = centerY + depthOffsetY;
      const depthColor = renderColors[renderColors.length - 1] || renderColors[0];
      const depthRadius = Math.max(displayWidth, displayHeight) * 0.55;
      const depthAlpha = Math.min(0.6, 0.2 * musicIntensity * strength);
      const depthGrad = ctx.createRadialGradient(dx, dy, 0, dx, dy, depthRadius);
      depthGrad.addColorStop(0, `rgba(${depthColor.r},${depthColor.g},${depthColor.b},${depthAlpha})`);
      depthGrad.addColorStop(1, `rgba(${depthColor.r},${depthColor.g},${depthColor.b},0)`);
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = depthGrad;
      ctx.fillRect(0, 0, displayWidth, displayHeight);
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
      const needsImageData = ['invert', 'grain', 'posterize', 'halftone', 'shift', 'duotone', 'ascii', 'emoji'].includes(effectType);
      let imageData: ImageData | null = null;
      
      if (needsImageData) {
        try {
          imageData = getDisplayImageData();
        } catch (e) {
          console.error('Failed to get image data:', e);
          return;
        }
      }
      
      const effectCtx: Record<string, any> = {
        ...params, ctx, canvas, gradientColors: renderColors, gradientAngle, zoom,
        centerX, centerY, maxRadius, fitRadius, angleRad, cosAngle, sinAngle,
        displayWidth, displayHeight, putScaledImageData, getDisplayImageData,
        effectType, index, isFirstEffect, audioModulation, imageData,
      };
      if (isAudioEnabled && isAudioReactive && audioBindings && audioBindings.length > 0) {
        applyAudioBindings(effectCtx, audioBindings, { sub: audioSubBassLevel || 0, mids: audioMidsLevel || 0, treble: audioTrebleLevel || 0, energy: audioEnergy || 0 });
      }
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

    // Crossfade: composite the pre-switch snapshot on top with decaying
    // alpha. The new frame above is already fully opaque, so this alone
    // produces a fade from old -> new without needing to touch the new
    // frame's own alpha.
    if (switchSnapshotRef.current) {
      const elapsed = performance.now() - switchStartRef.current;
      if (elapsed < SWITCH_FADE_MS) {
        ctx.save();
        ctx.globalAlpha = 1 - elapsed / SWITCH_FADE_MS;
        ctx.drawImage(switchSnapshotRef.current, 0, 0, displayWidth, displayHeight);
        ctx.restore();
      } else {
        switchSnapshotRef.current = null;
      }
    }

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
