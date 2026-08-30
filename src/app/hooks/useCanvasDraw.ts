import { useEffect, useRef } from 'react';
import { adjustPalette } from '../utils/color';
import {
  ALL_EFFECTS, AUDIO_GRADIENTS, AUDIO_EFFECTS, FULL_GRADIENT_TYPES,
  DEG_TO_RAD, TWO_PI, NO_DRAG_TYPES,
} from '../constants/gradientEffects';
import { pickRandomEmojiSet, splitGraphemes, EMOJI_PICKER_CATEGORIES } from '../components/InteractiveGradient';
import { GRADIENT_DRAW_FNS } from './gradients/_registry';
import { EFFECT_DRAW_FNS } from './effects/_registry';
import { runGLEffectChain, type GLEffectStage } from './effects/glEffectPipeline';
import { detectLiquidGLSupport, getLiquidGLStage } from './effects/applyLiquidGL';
import { detectBlurGLSupport, getBlurZoomGLStage, getBlurRadialGLStage } from './effects/applyBlurGL';
import { detectPlasmaGLSupport, getPlasmaGLStage } from './gradients/drawPlasmaGL';
import { detectNoiseGLSupport, getNoiseGLStage } from './gradients/drawNoiseGL';
import { detectAngleGLSupport, getAngleGLStage } from './gradients/drawAngleGL';
import { detectCausticsGLSupport, getCausticsGLStage } from './gradients/drawCausticsGL';
import { detectMarbleGLSupport, getMarbleGLStage } from './gradients/drawMarbleGL';
import { detectLavaLampGLSupport, getLavaLampGLStage } from './gradients/drawLavaLampGL';
import { detectJuliaGLSupport, getJuliaGLStage } from './gradients/drawJuliaGL';
import { detectMetaballsGLSupport, getMetaballsGLStage } from './gradients/drawMetaballsGL';
import { detectRadialBurstGLSupport, getRadialBurstSweepGLStage } from './gradients/drawRadialBurstGL';
import { detectTilingGLSupport, getTilingGLStage } from './gradients/drawTilingGL';
import { detectTopographicGLSupport, getTopographicGLStage } from './gradients/drawTopographicGL';
import { detectVoronoiGLSupport, getVoronoiGLStage } from './gradients/drawVoronoiGL';
import { detectWindmillGLSupport, getWindmillHelixGLStage } from './gradients/drawWindmillGL';
import { getPostGradientOverlayStage } from './gradients/glPostGradientOverlay';
import { detectFisheyeGLSupport, getFisheyeGLStage } from './effects/applyFisheyeGL';
import { detectWaveGLSupport, getWaveGLStage } from './effects/applyWaveGL';
import { detectMirrorGLSupport, getMirrorGLStage } from './effects/applyMirrorGL';

// Phase-3 pilot: which gradients (given their live params) can lead a
// GL-pipeline run. Plasma plus the 12 other field-shader gradients that
// share glShared.ts's infra — Radial Burst and Windmill are mode-gated
// (only their 'sweep'/'helix' submodes have a GL renderer at all; their
// default modes already draw via native canvas ops and aren't part of
// this). Mirrors each gradient's own Auto-wrapper eligibility check in
// gradients/_registry.ts.
function getGradientGLStage(gradientType: string, drawCtx: Record<string, any>): GLEffectStage | null { // eslint-disable-line @typescript-eslint/no-explicit-any
  switch (gradientType) {
    case 'plasma': return detectPlasmaGLSupport() ? getPlasmaGLStage(drawCtx) : null;
    case 'noise': return detectNoiseGLSupport() ? getNoiseGLStage(drawCtx) : null;
    // angleHardEdge forces the CPU path below (drawAngle.ts) since the GL
    // shader doesn't implement the hard-edge nearest-stop lookup — the GL
    // stage is skipped whenever it's on rather than rendering the smooth
    // GL version and silently ignoring the toggle.
    case 'angle': return (!drawCtx.angleHardEdge && detectAngleGLSupport()) ? getAngleGLStage(drawCtx) : null;
    case 'caustics': return detectCausticsGLSupport() ? getCausticsGLStage(drawCtx) : null;
    case 'marble': return detectMarbleGLSupport() ? getMarbleGLStage(drawCtx) : null;
    case 'lava-lamp': return detectLavaLampGLSupport() ? getLavaLampGLStage(drawCtx) : null;
    case 'julia': return detectJuliaGLSupport() ? getJuliaGLStage(drawCtx) : null;
    case 'metaballs': return detectMetaballsGLSupport() ? getMetaballsGLStage(drawCtx) : null;
    case 'radial-burst': return drawCtx.radialBurstMode === 'sweep' && detectRadialBurstGLSupport() ? getRadialBurstSweepGLStage(drawCtx) : null;
    case 'tiling': return detectTilingGLSupport() ? getTilingGLStage(drawCtx) : null;
    case 'topographic': return detectTopographicGLSupport() ? getTopographicGLStage(drawCtx) : null;
    case 'voronoi': return detectVoronoiGLSupport() ? getVoronoiGLStage(drawCtx) : null;
    case 'windmill': return drawCtx.windmillMode === 'helix' && detectWindmillGLSupport() ? getWindmillHelixGLStage(drawCtx) : null;
    default: return null;
  }
}

// Phase-3 pilot: which effects (given their live params) can be pipelined
// through glEffectPipeline.ts instead of each independently round-tripping
// the main 2D canvas. Liquid, Fisheye, Wave, Mirror, and Blur's Zoom/Radial
// modes have a GL implementation today — same eligibility check each of
// their standalone Auto wrappers (effectRegistry.ts) already uses, just
// surfaced here so a *run* of them can be detected before any of them
// actually draws.
function getGLStageForEffect(effectType: string, effectCtx: Record<string, any>): GLEffectStage | null { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (effectType === 'liquid' && detectLiquidGLSupport()) {
    return getLiquidGLStage(effectCtx);
  }
  if (effectType === 'fisheye' && detectFisheyeGLSupport()) {
    return getFisheyeGLStage(effectCtx);
  }
  if (effectType === 'wave' && detectWaveGLSupport()) {
    return getWaveGLStage(effectCtx);
  }
  if (effectType === 'mirror' && detectMirrorGLSupport()) {
    return getMirrorGLStage(effectCtx);
  }
  if (effectType === 'blur' && (effectCtx.blurType === 'zoom' || effectCtx.blurType === 'radial') && detectBlurGLSupport()) {
    return effectCtx.blurType === 'zoom' ? getBlurZoomGLStage(effectCtx) : getBlurRadialGLStage(effectCtx);
  }
  return null;
}

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

// Same math as applyAudioBindings, but returns a small {param: value} object
// instead of mutating a target in place — every binding always reads off the
// same unmodified `params` base regardless of which effect is currently
// drawing, so the result is identical for every effect in the active stack.
// Computing it once per frame and spreading the (small, bindings-length)
// result into each effect's context avoids re-running the same bindings
// lookup+math once per active effect for a result that never changes within
// the frame.
function computeAudioBoundOverrides(base: Record<string, any>, bindings: { param: string; band: string; amount: number }[], levels: { sub: number; mids: number; treble: number; energy: number }): Record<string, number> {
  const overrides: Record<string, number> = {};
  for (const binding of bindings) {
    const value = base[binding.param];
    if (typeof value !== 'number') continue;
    const level = levels[binding.band as keyof typeof levels] ?? 0;
    overrides[binding.param] = value + level * binding.amount;
  }
  return overrides;
}

// Rotates every color's hue by `degrees` (RGB -> HSL -> rotate -> RGB).
// Used by the global chromatic-drift effect below — a single insertion
// point that shifts hue for every gradient/effect at once instead of
// touching all 28 draw functions individually.
export function rotateHue(colors: { r: number; g: number; b: number }[], degrees: number) {
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
    isMobile,
    activeEffects, addGradientStops, angleCenterX, angleCenterY, angleStartOffset, asciiChars,
    asciiColor, asciiSize, attractorBufferRef, attractorPointCount, attractorPointsRef,
    attractorScale, audioBindings, musicIntensityRef, depthLayerEnabled, depthLayerStrength, masterSensitivity, animValuesRef,
    auroraBandCount, auroraBandHeight, auroraWaveSpeed, bassThreshold, bloomIntensity, bloomRadius,
    blurGaussianAmount, blurMotionAmount, blurMotionDirection, blurRadialAmount, blurType, canvasRef,
    causticsBrightness, causticsScale, chromaticAngle, chromaticOffset,
    chromaticTrailsBufferRef, chromaticTrailsDecay, chromaticTrailsOffset, colorPins, colorShiftHue,
    paletteHue = 0, paletteSaturation = 100, paletteBrightness = 0, paletteContrast = 0, concentricRingCount,
    concentricRingWidth, helixTightness, helixTurns, ditherLevels, ditherType, drawParams,
    glitchIntensity, glitchBlockSize, glitchChromaSplit,
    drawParamsDirtyRef, drawRef, duotoneColor1, duotoneColor2, duotoneColor3, duotoneIntensity,
    duotoneThreeColor, dustCrackleIntensity, emojiChars, emojiOffsetX, emojiSize,
    emojiSizeVariation, fadeDirection, feedbackBufferRef, feedbackDecay, feedbackRotation, feedbackZoom,
    fisheyeCenterX, fisheyeCenterY, fisheyeStrength, flowBufferRef, flowParticleCount,
    flowParticlesRef, flowScale, flowThickness, flowerCircles, flowerRotation,
    flowerScale, flowerSpread,
    gradientAngle, gradientAngleRef, gradientColors, gradientColorsRef,
    gradientType, grainIntensity, grainType, gridColumns, gridRotation, gridRows,
    gridShapeSize, gridSides, gridVariation, halftoneCMYK, halftoneMove, halftoneSize,
    halftoneTimeRef, halftoneVariation, isAudioEnabled,
    isAudioReactive, isAutoModeRef, isVCRPlayingRef, kaleidoAngleRef, kaleidoscopeRotateSpeed, kaleidoscopeSegments,
    lavaBlobCount, lavaBlobSize, lavaSpeed, liquidScale,
    liquidStrength, marbleOctaves, marbleTurbulence, marbleVeinFreq, meshGridSize,
    meshJitter, metaballCount, metaballSize, mirrorMode, mirrorTileCount,
    moireOffset, moireScale, noiseDirection, noiseOctaves, noiseScale,
    noiseType, noiseWarp, photoBlendMode, photoImageRef, photoOpacity, pixelSize,
    plasmaComplexity, plasmaZoomScale, polygon2Sides, posterizeLevels,
    radarBeamWidth, radarFadeLength, radarSweepAngle, radialBurstCount, radialBurstSize, radialBurstSpread,
    radialSizeScale, reactionDiffusionFeed, reactionDiffusionGridRef, reactionDiffusionKill, reactionDiffusionSpeed,
    resolutionMultiplier,
    shapesCount, shapesSides, slitScanBufferRef, slitScanDirection,
    slitScanIntensity, windmillRotations, windmillThickness, windmillTightness, windmillZoom, triangleSize,
    topographicBands, topographicLineWidth, topographicScale,
    juliaReal, juliaImaginary, juliaZoom, juliaIterations, juliaCanvasRef,
    truchetSize, truchetThickness, truchetVariation, vhsGlitchIntensity, vignetteSoftness, vignetteStrength,
    voronoiCellCount, voronoiDistortion, waveDistortionRotation, waveDistortionStrength,
    zoom, zoomRef,
  } = params;

  // Global chromatic drift: continuous hue rotation driven by mids, applied
  // once here rather than per-gradient. Only accumulates while audio is
  // active/reactive, so idle/no-audio sessions render the user's exact
  // chosen palette with zero drift, unchanged from before this existed.
  const hueDriftRef = useRef(0);
  // Tracks wall-clock time between successive draw() calls so hue drift's
  // rate is delta-time-correct instead of frame-count-based — draw() isn't
  // guaranteed to run every rAF tick (skipped when idle/converged, see
  // InteractiveGradient.tsx's loop), so counting frames instead of real
  // elapsed time would make drift speed depend on how often draw()
  // happened to fire rather than actual time passed.
  const lastDrawTimeRef = useRef<number | null>(null);
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
    // These 12 anim-time clocks used to be read directly from React state
    // (via `params`, destructured from the props this hook was called
    // with). Each ticks via its own ~60fps setInterval/RAF-loop setState in
    // InteractiveGradient.tsx, and each was also listed in the huge
    // `drawParams` useMemo's dependency array that gates this whole
    // effect's re-run — meaning every single tick of any one of these
    // (while its gradient/effect was active) tore down and rebuilt this
    // entire ~350-line closure and reassigned drawRef.current, 60x/sec.
    // animValuesRef mirrors all of them (see InteractiveGradient.tsx) and
    // is updated in the same places; reading through the ref here instead
    // lets `drawParams` drop these from its dependency list entirely
    // (still bumps drawParamsDirtyRef so the RAF loop knows to redraw —
    // it just no longer needs to reconstruct this closure to do it).
    const av = animValuesRef.current;
    const auroraAnimTime = av.auroraAnimTime;
    const causticsAnimTime = av.causticsAnimTime;
    const lavaAnimTime = av.lavaAnimTime;
    const marbleAnimTime = av.marbleAnimTime;
    const metaballAnimTime = av.metaballAnimTime;
    const moireAnimTime = av.moireAnimTime;
    const flowAnimTime = av.flowAnimTime;
    const attractorAnimTime = av.attractorAnimTime;
    const liquidAnimTime = av.liquidAnimTime;
    const emojiAnimTime = av.emojiAnimTime;
    const voronoiAnimTime = av.voronoiAnimTime;
    const flowerAnimTime = av.flowerAnimTime;
    // tilingAnimTime was already in animValuesRef's shape but never actually
    // read through it here — still fell back to the params-destructured
    // (state-derived) value above, i.e. never got the redraw/re-render win
    // the other 12 anim-time clocks did. gridRotation/radarSweepAngle are
    // the same class of value (a live per-frame accumulator, not a static
    // slider) but previously had no ref path at all.
    const tilingAnimTime = av.tilingAnimTime;
    const gridRotation = av.gridRotation;
    const radarSweepAngle = av.radarSweepAngle;
    // Same ref-read treatment as the anim-time clocks above — these come
    // from the audio-analysis loop at ~60fps and used to be destructured
    // straight from `params`, which forced this whole closure to be torn
    // down and rebuilt on every single tick while audio was on (see the
    // comment on drawParams's dependency array in InteractiveGradient.tsx).
    const audioSubBassLevel = av.audioSubBassLevel;
    const audioMidsLevel = av.audioMidsLevel;
    const audioTrebleLevel = av.audioTrebleLevel;
    const audioEnergy = av.audioEnergy;

    // The canvas's own display box, not the window — the rail/drawer are
    // now a real docked sidebar (flex layout) that the canvas area reflows
    // around, rather than a floating overlay on top of a full-window
    // canvas, so its visible size is whatever's left after that layout.
    const displayWidth = canvas.parentElement?.clientWidth || window.innerWidth;
    const displayHeight = canvas.parentElement?.clientHeight || window.innerHeight;
    // Cap total canvas pixel count regardless of window size/DPR — a large
    // external display (esp. a 5K/6K monitor run at DPR 2, maximized) can
    // put the canvas at 3-4x the pixel count of a laptop's own screen, and
    // every per-pixel effect (chromatic-trails, feedback, triangulate, grid,
    // etc.) scales directly with that area. Scaling resolutionMultiplier
    // down once here — rather than only ever scaling it up to match DPR —
    // keeps per-frame cost roughly constant across monitor setups instead
    // of silently ballooning on a bigger/higher-DPR external display. Floor
    // of 0.75 keeps it from going soft on an unreasonably tiny viewport.
    // Lower budget on mobile (same isMobile signal as everywhere else in
    // the app, see resolutionForEffectCost's comment in effectCost.ts) —
    // this budget previously only ever protected against an oversized
    // external-display canvas, never a phone, even though phone hardware
    // has meaningfully less headroom for the same per-pixel effect cost.
    const MAX_CANVAS_PIXELS = isMobile ? 1_500_000 : 2_500_000;
    const rawPixels = displayWidth * displayHeight * resolutionMultiplier * resolutionMultiplier;
    const effectiveResolutionMultiplier = rawPixels > MAX_CANVAS_PIXELS
      ? Math.max(0.75, resolutionMultiplier * Math.sqrt(MAX_CANVAS_PIXELS / rawPixels))
      : resolutionMultiplier;
    const targetWidth = displayWidth * effectiveResolutionMultiplier;
    const targetHeight = displayHeight * effectiveResolutionMultiplier;
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
    ctx.scale(effectiveResolutionMultiplier, effectiveResolutionMultiplier);

    // putImageData ignores ctx transforms, so route through drawImage to respect DPR scale
    const putScaledImageData = (imgData: ImageData, dx = 0, dy = 0) => {
      if (effectiveResolutionMultiplier === 1) {
        ctx.putImageData(imgData, dx, dy);
      } else {
        const tmp = getScratchOffscreen('put', imgData.width, imgData.height);
        (tmp.getContext('2d') as OffscreenCanvasRenderingContext2D).putImageData(imgData, 0, 0);
        ctx.save();
        ctx.resetTransform();
        ctx.drawImage(tmp, dx * effectiveResolutionMultiplier, dy * effectiveResolutionMultiplier,
          imgData.width * effectiveResolutionMultiplier, imgData.height * effectiveResolutionMultiplier);
        ctx.restore();
      }
    };

    // For per-pixel gradients too expensive to compute at full display
    // resolution (marble/caustics/plasma/iridescent — nested trig/noise math
    // per pixel), this renders a smaller ImageData buffer and stretches it up
    // to fill the display area via drawImage, which respects the ctx transform
    // (unlike putImageData) so it composes correctly with the DPR scaling above.
    const putLowResImageData = (imgData: ImageData) => {
      const tmp = getScratchOffscreen('lowres', imgData.width, imgData.height);
      (tmp.getContext('2d') as OffscreenCanvasRenderingContext2D).putImageData(imgData, 0, 0);
      ctx.drawImage(tmp, 0, 0, imgData.width, imgData.height, 0, 0, displayWidth, displayHeight);
    };

    // ctx.getImageData ignores transforms and reads physical pixels.
    // On Retina (2× DPI), getImageData(0,0,displayWidth,displayHeight) captures only
    // the top-left quarter of the physical canvas — centering the gradient at the
    // captured region's bottom-right edge, which maps to the canvas bottom-right corner
    // after putScaledImageData upscales it. This helper downsamples the full physical
    // canvas to CSS-pixel resolution so effects always capture the complete image.
    const getDisplayImageData = (): ImageData => {
      // Always routes through the willReadFrequently-flagged scratch canvas
      // now, even at 1x — previously effectiveResolutionMultiplier===1 read
      // straight off the main `ctx` (deliberately left GPU-accelerated,
      // since most gradients never read it back), but every needsImageData
      // effect (invert/grain/posterize/halftone/shift/duotone/ascii/emoji —
      // see buildEffectCtx below) calls this once each, every frame, when
      // active. A Multi-FX stack combining a few of those meant several
      // full-canvas getImageData reads a frame straight off the
      // GPU-accelerated context — exactly the "Canvas2D: Multiple readback
      // operations..." pattern Chrome's own DevTools warns is faster with
      // willReadFrequently. Routing every read through the same
      // software-backed scratch context this file already uses for the
      // downsampled case makes each of those reads cheaper, regardless of
      // how many needsImageData effects are stacked.
      const tmp = getScratchOffscreen('display', displayWidth, displayHeight);
      const tmpCtx = tmp.getContext('2d', { willReadFrequently: true }) as OffscreenCanvasRenderingContext2D;
      tmpCtx.drawImage(canvas, 0, 0, displayWidth, displayHeight);
      return tmpCtx.getImageData(0, 0, displayWidth, displayHeight);
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
    // (0-5) and master sensitivity — so it's clamped to 0-1 before use.
    // This used to swing up to a full 360° on a single loud kick — since
    // audioSubBassLevel isn't eased frame-to-frame beyond the light smoothing
    // already applied in useAudioReactivity, that read as the whole pattern
    // snapping to a near-random new orientation on every hit. Capped to a
    // much smaller wobble (±20°) so bass still visibly nudges the angle
    // without the pattern appearing to spin wildly.
    const audioAdjustedAngle = (isAudioEnabled && isAudioReactive)
      ? gradientAngle + (Math.min(1, audioSubBassLevel) * 20)
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
    // Both hue drift and the depth layer below used to run at this rate
    // (including drift's 0.08 baseline) regardless of the Intensity slider —
    // turning Intensity all the way down still left the palette rotating and
    // the depth layer pulsing at full strength, which read as "still way too
    // reactive" even with the per-band audio gain silenced. Same 0.4-now-
    // needs-5 squeeze as effMasterSensitivity in useAudioReactivity.ts, so
    // both collapse toward motionless as Intensity approaches 0.
    const audioIntensityFraction = Math.min(1, (masterSensitivity ?? 0) / 5);
    // Delta-time-correct instead of frame-count-based — see lastDrawTimeRef's
    // declaration above for why draw()'s own call cadence (not rAF ticks)
    // is what matters here. First call has no prior timestamp to diff
    // against, so it contributes zero drift rather than a bogus huge jump.
    const nowForDrift = performance.now();
    const driftDtScale = lastDrawTimeRef.current !== null
      ? Math.min(3, Math.max(0, (nowForDrift - lastDrawTimeRef.current) / (1000 / 60)))
      : 0;
    lastDrawTimeRef.current = nowForDrift;
    if (audioActiveForDrift) {
      // audioMidsLevel isn't naturally 0-1 — its ceiling depends on the Mids
      // multiplier slider (0-5) and master sensitivity — so it's clamped to
      // 1 here before scaling. Unclamped, loud mids could add up to 2.5°/frame
      // (150°/sec, 2.5 full hue cycles a second), which read as the whole
      // palette spinning rather than drifting.
      hueDriftRef.current += (0.08 + Math.min(1, audioMidsLevel) * 0.15) * musicIntensity * audioIntensityFraction * driftDtScale;
    }
    const driftedColors = audioActiveForDrift ? rotateHue(gradientColors, hueDriftRef.current) : gradientColors;
    const renderColors = adjustPalette(driftedColors, {
      hue: paletteHue, saturation: paletteSaturation, brightness: paletteBrightness, contrast: paletteContrast,
    });

    const drawCtx: Record<string, any> = {
      ...params, ctx, canvas, gradientColors: renderColors, gradientAngle, zoom,
      auroraAnimTime, causticsAnimTime, lavaAnimTime, marbleAnimTime, metaballAnimTime,
      moireAnimTime, flowAnimTime, attractorAnimTime, liquidAnimTime, emojiAnimTime,
      voronoiAnimTime, flowerAnimTime,
      audioSubBassLevel, audioMidsLevel, audioTrebleLevel, audioEnergy,
      centerX, centerY, maxRadius, fitRadius, angleRad, cosAngle, sinAngle,
      displayWidth, displayHeight, putScaledImageData, getDisplayImageData, putLowResImageData,
      // Overrides params' raw resolutionMultiplier with the pixel-budget-capped
      // value computed above, so effects that sample at resolutionMultiplier
      // (e.g. applyTriangulate) stay consistent with what the canvas is
      // actually sized to.
      resolutionMultiplier: effectiveResolutionMultiplier,
    };

    if (isAudioEnabled && isAudioReactive && audioBindings && audioBindings.length > 0) {
      applyAudioBindings(drawCtx, audioBindings, { sub: audioSubBassLevel || 0, mids: audioMidsLevel || 0, treble: audioTrebleLevel || 0, energy: audioEnergy || 0 });
    }

    // Computed once per frame, not once per active effect — every binding
    // always reads off the same unmodified `params`, so re-deriving this
    // per effect in a dense Multi-FX stack repeated identical work for no
    // reason (see computeAudioBoundOverrides above). Also needed earlier
    // than before (moved up from just before the effects loop) so the
    // gradient-pipeline eligibility check below can peek at upcoming
    // effects' contexts before any of them, or the gradient, actually draws.
    const audioBoundOverrides = (isAudioEnabled && isAudioReactive && audioBindings && audioBindings.length > 0)
      ? computeAudioBoundOverrides(params, audioBindings, { sub: audioSubBassLevel || 0, mids: audioMidsLevel || 0, treble: audioTrebleLevel || 0, energy: audioEnergy || 0 })
      : null;

    // Builds the same per-effect context the old forEach built inline —
    // pulled into a helper so both the gradient-pipeline check below and
    // the effects loop further down can peek at an effect's context (to
    // check GL-pipeline eligibility) without executing it yet.
    // GL-eligibility lookahead peeks at an index's context before the main
    // loop reaches it, then the main loop builds the same index again — this
    // cache makes the second call a lookup instead of a second full ~180-key
    // spread + (for imageData-needing effects) a second getImageData() call.
    // Safe because every effect draws synchronously within this same frame
    // before the cache is discarded, and everything the context is built
    // from (params, renderColors, audioBoundOverrides) is frame-constant.
    const effectCtxCache = new Map<number, Record<string, any> | null>();
    const buildEffectCtx = (effectType: string, index: number): Record<string, any> | null => { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (effectCtxCache.has(index)) return effectCtxCache.get(index)!;
      const isFirstEffect = index === 0;
      const audioModulation = (isAudioEnabled && isAudioReactive && isFirstEffect)
        ? audioMidsLevel
        : 0;
      const needsImageData = ['invert', 'grain', 'posterize', 'halftone', 'shift', 'duotone', 'ascii', 'emoji'].includes(effectType);
      let imageData: ImageData | null = null;
      if (needsImageData) {
        try {
          imageData = getDisplayImageData();
        } catch (e) {
          console.error('Failed to get image data:', e);
          effectCtxCache.set(index, null);
          return null;
        }
      }
      const built = {
        ...params, ctx, canvas, gradientColors: renderColors, gradientAngle, zoom,
        // Same ref-sourced overrides as drawCtx above — effects that read an
        // anim-time value (applyLiquid, applyEmoji) need the live value too,
        // not the stale one baked into `params` from whenever this closure
        // was last rebuilt. Missing this made liquidAnimTime read as
        // `undefined` here, and Math.sin(undefined) => NaN propagated through
        // applyLiquid's coordinate math into a fully-black frame (NaN written
        // into a Uint8ClampedArray clamps to 0).
        auroraAnimTime, causticsAnimTime, lavaAnimTime, marbleAnimTime, metaballAnimTime,
        moireAnimTime, flowAnimTime, attractorAnimTime, liquidAnimTime, emojiAnimTime,
        voronoiAnimTime, flowerAnimTime,
        centerX, centerY, maxRadius, fitRadius, angleRad, cosAngle, sinAngle,
        displayWidth, displayHeight, putScaledImageData, getDisplayImageData,
        effectType, index, isFirstEffect, audioModulation, imageData,
        ...audioBoundOverrides,
      };
      effectCtxCache.set(index, built);
      return built;
    };

    const runSingleEffect = (effectType: string, effectCtx: Record<string, any>) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      ctx.save();
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
    };

    // Gradient-pipeline pilot: if the active gradient has a GL renderer that
    // can target a framebuffer (Plasma plus the 12 other field-shader
    // gradients in getGradientGLStage above), chain it as the first stage
    // of a GL run, with shimmer + depth-layer folded into a single GPU
    // overlay stage (glPostGradientOverlay.ts) right after it — that
    // overlay used to be the reason this pipeline required audio-reactive
    // mode to be off entirely (shimmer/depth-layer were native 2D canvas
    // ops that would have forced a round-trip mid-chain); it's a no-op
    // passthrough when audio isn't driving either, so it's always safe to
    // include. Then peek ahead at the leading effects for a GL-eligible run
    // and append those too. Same glEffectPipeline.ts used below for
    // effect-only runs — a gradient stage just happens to ignore the
    // `inputTexture` parameter every stage receives, since field gradients
    // generate their own content rather than sampling anything. Falls
    // through to the normal gradient draw + shimmer + depth-layer +
    // per-effect path unchanged if ineligible or if the pipeline throws.
    let effectStartIndex = 0;
    let gradientHandledByPipeline = false;
    const gradientStage = gradientType ? getGradientGLStage(gradientType, drawCtx) : null;
    if (gradientStage) {
      const shimmerActive = isAudioEnabled && isAudioReactive && audioTrebleLevel > 12;
      const shimmerLevel = shimmerActive ? Math.min(1, audioTrebleLevel / 90) : 0;
      const shimmerCount = shimmerActive ? Math.floor(shimmerLevel * shimmerLevel * 160) : 0;
      const depthActive = audioActiveForDrift && depthLayerEnabled !== false && renderColors.length > 0;
      let depthCenterX = centerX, depthCenterY = centerY, depthRadius = 1, depthAlpha = 0;
      let depthColor = { r: 0, g: 0, b: 0 };
      if (depthActive) {
        const strength = depthLayerStrength ?? 2;
        depthCenterX = centerX + Math.sin(hueDriftRef.current * 0.03) * displayWidth * 0.22;
        depthCenterY = centerY + Math.cos(hueDriftRef.current * 0.021) * displayHeight * 0.18;
        depthColor = renderColors[renderColors.length - 1] || renderColors[0];
        depthRadius = Math.max(displayWidth, displayHeight) * 0.55;
        depthAlpha = Math.min(0.6, 0.2 * musicIntensity * strength * audioIntensityFraction);
      }
      const overlayStage = getPostGradientOverlayStage({
        shimmerFraction: shimmerCount / Math.max(1, displayWidth * displayHeight),
        shimmerLevel,
        trebleLevel: audioTrebleLevel || 0,
        seed: Math.random() * 1000,
        depthEnabled: depthActive,
        depthCenterX, depthCenterY, depthRadius, depthAlpha, depthColor,
      });

      const runStages: GLEffectStage[] = [gradientStage, overlayStage];
      let lookahead = 0;
      while (lookahead < activeEffects.length) {
        const nextType = activeEffects[lookahead];
        const nextCtx = buildEffectCtx(nextType, lookahead);
        if (!nextCtx) break;
        const nextStage = getGLStageForEffect(nextType, nextCtx);
        if (!nextStage) break;
        runStages.push(nextStage);
        lookahead++;
      }
      gradientHandledByPipeline = runGLEffectChain(runStages, canvas, ctx, displayWidth, displayHeight);
      if (gradientHandledByPipeline) effectStartIndex = lookahead;
    }

    if (!gradientHandledByPipeline) {
      const gradientDrawFn = gradientType ? GRADIENT_DRAW_FNS[gradientType] : undefined;
      if (gradientDrawFn) {
        gradient = gradientDrawFn(drawCtx);
      }

      // For gradients that use the gradient variable (not direct pixel manipulation)
      const directRenderTypes = ['mesh', 'voronoi', 'iridescent', 'noise', 'plasma', 'waves', 'zigzag', 'tunnel', 'radial-burst', 'freeform', 'flower'];
      if (!directRenderTypes.includes(gradientType)) {
        if (gradient) {
          // Only Radial ever returns a real (unstopped) CanvasGradient
          // through this shared path today — every other indirect type
          // either self-draws its own stops or returns undefined above —
          // so radialHardEdge is the only per-type flag that needs reading
          // here.
          addGradientStops(gradient, renderColors, drawCtx.radialHardEdge);

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
        const strength = depthLayerStrength ?? 2;
        const depthOffsetX = Math.sin(hueDriftRef.current * 0.03) * displayWidth * 0.22;
        const depthOffsetY = Math.cos(hueDriftRef.current * 0.021) * displayHeight * 0.18;
        const dx = centerX + depthOffsetX;
        const dy = centerY + depthOffsetY;
        const depthColor = renderColors[renderColors.length - 1] || renderColors[0];
        const depthRadius = Math.max(displayWidth, displayHeight) * 0.55;
        const depthAlpha = Math.min(0.6, 0.2 * musicIntensity * strength * audioIntensityFraction);
        const depthGrad = ctx.createRadialGradient(dx, dy, 0, dx, dy, depthRadius);
        depthGrad.addColorStop(0, `rgba(${depthColor.r},${depthColor.g},${depthColor.b},${depthAlpha})`);
        depthGrad.addColorStop(1, `rgba(${depthColor.r},${depthColor.g},${depthColor.b},0)`);
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = depthGrad;
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        ctx.restore();
      }
    }

    // Apply visual effects after gradient is rendered
    // Apply each active effect in sequence
    // Guard against invalid canvas dimensions
    if (canvas.width === 0 || canvas.height === 0) {
      return;
    }

    // Sequential walk (not a plain forEach) so that at each index the main
    // canvas already reflects every prior effect having run — required for
    // correctness, since a GL-pipeline run's first stage reads the live
    // canvas exactly once as its input. At each index, peek ahead for a
    // *contiguous run* of GL-eligible effects (today: Liquid, Blur zoom/
    // radial) and hand runs of 2+ to glEffectPipeline.ts, which chains them
    // through ping-ponged framebuffers with a single upload + single blit
    // instead of one upload/blit per effect. A run of exactly 1 GL-eligible
    // effect, or a pipeline failure, falls through to the normal per-effect
    // path unchanged.
    let effectIndex = effectStartIndex;
    while (effectIndex < activeEffects.length) {
      if (canvas.width === 0 || canvas.height === 0) break;

      const effectType = activeEffects[effectIndex];
      const effectCtx = buildEffectCtx(effectType, effectIndex);
      if (!effectCtx) { effectIndex++; continue; } // imageData fetch failed — skip, same as the old early-return

      const firstStage = getGLStageForEffect(effectType, effectCtx);
      if (firstStage) {
        const runStages: GLEffectStage[] = [firstStage];
        let lookahead = effectIndex + 1;
        while (lookahead < activeEffects.length) {
          const nextType = activeEffects[lookahead];
          const nextCtx = buildEffectCtx(nextType, lookahead);
          if (!nextCtx) break;
          const nextStage = getGLStageForEffect(nextType, nextCtx);
          if (!nextStage) break;
          runStages.push(nextStage);
          lookahead++;
        }
        if (runStages.length >= 2) {
          const pipelined = runGLEffectChain(runStages, canvas, ctx, displayWidth, displayHeight);
          if (pipelined) {
            effectIndex = lookahead;
            continue;
          }
          // Pipeline threw — fall through and run this run's effects
          // individually below, same as if no GL eligibility existed.
        }
      }

      runSingleEffect(effectType, effectCtx);
      effectIndex++;
    }

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
  // isMobile isn't part of drawParams (InteractiveGradient.tsx's big memo) —
  // it's passed as a separate field on this hook's own params object, which
  // is a fresh object every render, so it can't itself be a meaningful dep.
  // Listed explicitly here instead: it rarely changes (only across the
  // layout breakpoint), but MAX_CANVAS_PIXELS below reads it directly from
  // this closure, so a real value change still needs to force a rebuild —
  // same reasoning as any other non-drawParams closure input.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawParams, isMobile]);
}
