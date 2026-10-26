/**
 * InteractiveGradient Component - Optimized for Performance
 * 
 * Performance Optimizations Applied:
 * - useCallback: All event handlers and frequently called functions memoized
 * - useMemo: Constant arrays (gradient types, effect types) cached
 * - Optimized RAF: Single requestAnimationFrame for interpolation
 * - Pre-calculated values: Audio frequency band indices, trig constants computed once
 * - Memoized display names: Gradient name mapping cached
 * - Batched state updates: Grouped related state changes
 * - Canvas context optimization: willReadFrequently flag for better pixel read performance
 * - Consolidated helpers: Unified audio initialization, gradient color stops
 * - Math constants: DEG_TO_RAD and TWO_PI pre-calculated
 * - Optimized loops: Pre-calculated angle increments and common values
 * 
 * - Mouse wheel scroll zoom
 */
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useAudioReactivity } from '../hooks/useAudioReactivity';
import { useVCRPlayback } from '../hooks/useVCRPlayback';
import { useDisplaySync } from '../hooks/useDisplaySync';
import { useUndoRedo } from '../hooks/useUndoRedo';
import { useAutoShuffle } from '../hooks/useAutoShuffle';
import { useExportControls } from '../hooks/useExportControls';
import { useGifExport } from '../hooks/useGifExport';
import { usePresets } from '../hooks/usePresets';
import { useAuth } from '../hooks/useAuth';
import { useRandomization } from '../hooks/useRandomization';
import type { PresetData } from '../hooks/usePresets';
import { hslToRgb } from '../utils/color';
import { useSnapshot } from '../hooks/useSnapshot';
import type { Snapshot } from '../hooks/snapshotTypes';
import { useCanvasDraw } from '../hooks/useCanvasDraw';
import {
  type ColorRGB, type GradientType, type EffectType,
  DEFAULT_COLORS,
  migrateId, migrateIds,
  GRADIENT_DISPLAY_NAMES,
  STYLE_FIELD_GRADIENT_TYPES } from '../constants/gradientEffects';
import { useAngleState } from '../hooks/state/useAngleState';
import { useAsciiState } from '../hooks/state/useAsciiState';
import { useAttractorState } from '../hooks/state/useAttractorState';
import { useParticlesState } from '../hooks/state/useParticlesState';
import { useTilingState } from '../hooks/state/useTilingState';
import { useFireworksState } from '../hooks/state/useFireworksState';
import { useLightningState } from '../hooks/state/useLightningState';
import { useAudioBindingsState } from '../hooks/state/useAudioBindingsState';
import { useAuroraState } from '../hooks/state/useAuroraState';
import { useBloomState } from '../hooks/state/useBloomState';
import { useBlurState } from '../hooks/state/useBlurState';
import { useBlurGaussianState } from '../hooks/state/useBlurGaussianState';
import { useBlurMotionState } from '../hooks/state/useBlurMotionState';
import { useBlurRadialState } from '../hooks/state/useBlurRadialState';
import { useCanvasState } from '../hooks/state/useCanvasState';
import { useCausticsState } from '../hooks/state/useCausticsState';
import { useChromaticState } from '../hooks/state/useChromaticState';
import { useChromaticTrailsState } from '../hooks/state/useChromaticTrailsState';
import { useColorState } from '../hooks/state/useColorState';
import { useDiffusionState } from '../hooks/state/useDiffusionState';
import { useDiffusionGridState } from '../hooks/state/useDiffusionGridState';
import { useDigitalNoiseState } from '../hooks/state/useDigitalNoiseState';
import { useDitherState } from '../hooks/state/useDitherState';
import { useOilPaintState } from '../hooks/state/useOilPaintState';
import { useImpastoState } from '../hooks/state/useImpastoState';
import { useWatercolorState } from '../hooks/state/useWatercolorState';
import { useDadaState } from '../hooks/state/useDadaState';
import { useDuotoneState } from '../hooks/state/useDuotoneState';
import { useDustState } from '../hooks/state/useDustState';
import { useEmojiState } from '../hooks/state/useEmojiState';
import { useFadeState } from '../hooks/state/useFadeState';
import { useFeedbackState } from '../hooks/state/useFeedbackState';
import { useFieldMappingState } from '../hooks/state/useFieldMappingState';
import { useFlowState } from '../hooks/state/useFlowState';
import { useFlowBufferState } from '../hooks/state/useFlowBufferState';
import { useFlowParticlesState } from '../hooks/state/useFlowParticlesState';
import { useAuraGlowState } from '../hooks/state/useAuraGlowState';
import { useGessoState } from '../hooks/state/useGessoState';
import { useGrainState } from '../hooks/state/useGrainState';
import { useGridState } from '../hooks/state/useGridState';
import { useGridRotationDirectionState } from '../hooks/state/useGridRotationDirectionState';
import { useHalftoneState } from '../hooks/state/useHalftoneState';
import { useHelixState } from '../hooks/state/useHelixState';
import { useHexGridState } from '../hooks/state/useHexGridState';
import { useInvertState } from '../hooks/state/useInvertState';
import { useJuliaState } from '../hooks/state/useJuliaState';
import { useKaleidoscopeState } from '../hooks/state/useKaleidoscopeState';
import { useLavaState } from '../hooks/state/useLavaState';
import { useLightLeakState } from '../hooks/state/useLightLeakState';
import { useLinesState } from '../hooks/state/useLinesState';
import { useLiquidState } from '../hooks/state/useLiquidState';
import { useCrtState } from '../hooks/state/useCrtState';
import { useLiquifyState } from '../hooks/state/useLiquifyState';
import { useMarbleState } from '../hooks/state/useMarbleState';
import { useMetaballState } from '../hooks/state/useMetaballState';
import { useMirrorState } from '../hooks/state/useMirrorState';
import { useMiscState } from '../hooks/state/useMiscState';
import { useNoiseState } from '../hooks/state/useNoiseState';
import { useIsMobile } from '../hooks/useIsMobile';
import { usePhotoState } from '../hooks/state/usePhotoState';
import { usePinchState } from '../hooks/state/usePinchState';
import { usePixelState } from '../hooks/state/usePixelState';
import { usePolygon2State } from '../hooks/state/usePolygon2State';
import { usePosterizeState } from '../hooks/state/usePosterizeState';
import { useRadialState } from '../hooks/state/useRadialState';
import { useRadialBurstState } from '../hooks/state/useRadialBurstState';
import { useReactionDiffusionState } from '../hooks/state/useReactionDiffusionState';
import { useReactionDiffusionGridState } from '../hooks/state/useReactionDiffusionGridState';
import { useRedoState } from '../hooks/state/useRedoState';
import { useSepiaState } from '../hooks/state/useSepiaState';
import { useShapesState } from '../hooks/state/useShapesState';
import { useStackState } from '../hooks/state/useStackState';
import { useHatchState } from '../hooks/state/useHatchState';
import { useEffectSpeedsState } from '../hooks/state/useEffectSpeedsState';
import { useSlitScanState } from '../hooks/state/useSlitScanState';
import { useSolarizeState } from '../hooks/state/useSolarizeState';
import { useShuffleQualityGate } from '../hooks/useShuffleQualityGate';
import { shuffleLearning } from '../utils/shuffleLearning';
import { shuffleMarks } from '../utils/shuffleMarks';
import { ShuffleMarkBar } from './ShuffleMarkBar';
import { useGlobalHotkeys } from '../hooks/useGlobalHotkeys';
import { useCanvasPointer } from '../hooks/useCanvasPointer';
import { useSliderFill } from '../hooks/useSliderFill';
import { useAnimClocks } from '../hooks/useAnimClocks';
import { useRefMirrors } from '../hooks/useRefMirrors';
import { useMobilePanelHeight } from '../hooks/useMobilePanelHeight';
import { useLooks } from '../hooks/useLooks';
import { useGestureActions } from '../hooks/useGestureActions';
import { useSharedPresetLink } from '../hooks/useSharedPresetLink';
import { useDrawerTouchScroll } from '../hooks/useDrawerTouchScroll';
import { useFullscreenSync } from '../hooks/useFullscreenSync';
import { useResolutionBudget } from '../hooks/useResolutionBudget';
import { GradientAppView } from './GradientAppView';
import { useMasterClock } from '../hooks/useMasterClock';
import { usePopoutAnchor } from '../hooks/usePopoutAnchor';
import { useAutoColor } from '../hooks/useAutoColor';
import { useBeatEffects } from '../hooks/useBeatEffects';
import { usePhotoUpload } from '../hooks/usePhotoUpload';
import { generateAIColors as generateAIColorsFor } from '../utils/aiColors';
import { addGradientStops as addGradientStopsTo } from '../utils/gradientStops';
import { adjustColorArrayLength } from '../utils/color';
import { sanitizeSnapshot } from '../utils/sanitizeSnapshot';
import { useStructuralSeedState } from '../hooks/state/useStructuralSeedState';
import { useTopographicState } from '../hooks/state/useTopographicState';
import { useWaveInterferenceState } from '../hooks/state/useWaveInterferenceState';
import { useMeshWireframeState } from '../hooks/state/useMeshWireframeState';
import { useTriangleState } from '../hooks/state/useTriangleState';
import { useTruchetState } from '../hooks/state/useTruchetState';
import { useTwistState } from '../hooks/state/useTwistState';
import { useUndoState } from '../hooks/state/useUndoState';
import { useVhsState } from '../hooks/state/useVhsState';
import { useVignetteState } from '../hooks/state/useVignetteState';
import { useVoronoiState } from '../hooks/state/useVoronoiState';
import { useWaveState } from '../hooks/state/useWaveState';
import { useWindmillState } from '../hooks/state/useWindmillState';

import { formatAutoShuffleInterval } from '../utils/autoShuffle';
import { EffectSection } from './EffectSection';
import { EMOJI_PICKER_CATEGORIES, pickRandomEmojiSet, splitGraphemes } from '../constants/emojiPicker';
import { IS_DISPLAY_MODE } from '../constants/displayMode';

// Re-exported so existing importers keep working.
export { EMOJI_PICKER_CATEGORIES, pickRandomEmojiSet, splitGraphemes, EffectSection };

// The app's root. It owns the state (one small hook per gradient/effect, below), wires it into the feature
// hooks (snapshots, presets, randomization, audio, the draw loop, gestures, popouts, looks, clocks) and hands
// the result to <GradientAppView>, which holds the markup. Logic lives in hooks/, not here.
export function InteractiveGradient() {
  const { angleStartOffset, setAngleStartOffset, angleCenterX, setAngleCenterX, angleCenterY, setAngleCenterY, angleHardEdge, setAngleHardEdge } = useAngleState();
  const { asciiSize, setAsciiSize, asciiColor, setAsciiColor, asciiChars, setAsciiChars } = useAsciiState();
  const { audioBindings, setAudioBindings } = useAudioBindingsState();
  const { attractorAnimTime, setAttractorAnimTime, attractorPointCount, setAttractorPointCount, attractorSpeed, setAttractorSpeed, attractorScale, setAttractorScale, attractorDotSize, setAttractorDotSize, attractorTrailFade, setAttractorTrailFade, attractorBufferRef, attractorPointsRef } = useAttractorState();
  const { particlesCount, setParticlesCount, particlesSpeed, setParticlesSpeed, particlesSize, setParticlesSize, particlesTrail, setParticlesTrail, particlesGravity, setParticlesGravity, particlesSides, setParticlesSides, particlesBufferRef, particlesPointsRef, particlesMode, setParticlesMode, marksCount, setMarksCount, marksSize, setMarksSize, marksDecay, setMarksDecay, marksStateRef } = useParticlesState();
  const { tilingSize, setTilingSize, tilingSymmetry, setTilingSymmetry, tilingComplexity, setTilingComplexity, tilingRotation, setTilingRotation, tilingAnimTime, setTilingAnimTime, tilingRowOffset, setTilingRowOffset } = useTilingState();
  const { fireworksCount, setFireworksCount, fireworksParticleCount, setFireworksParticleCount, fireworksTrailFade, setFireworksTrailFade, fireworksBufferRef, fireworksParticlesRef } = useFireworksState();
  const { lightningBoltCount, setLightningBoltCount, lightningJitter, setLightningJitter, lightningBranchiness, setLightningBranchiness, lightningBufferRef, lightningBoltsRef } = useLightningState();
  const { auroraAnimTime, setAuroraAnimTime, auroraBandCount, setAuroraBandCount, auroraWaveSpeed, setAuroraWaveSpeed, auroraBandHeight, setAuroraBandHeight } = useAuroraState();
  const { bloomIntensity, setBloomIntensity, bloomRadius, setBloomRadius } = useBloomState();
  const { blurType, setBlurType } = useBlurState();
  const { blurGaussianAmount, setBlurGaussianAmount } = useBlurGaussianState();
  const { blurMotionAmount, setBlurMotionAmount, blurMotionDirection, setBlurMotionDirection } = useBlurMotionState();
  const { blurRadialAmount, setBlurRadialAmount } = useBlurRadialState();
  const { canvasRef } = useCanvasState();
  const { causticsAnimTime, setCausticsAnimTime, causticsBrightness, setCausticsBrightness, causticsScale, causticsSpeed, setCausticsScale, setCausticsSpeed } = useCausticsState();
  const { chromaticOffset, setChromaticOffset, chromaticAngle, setChromaticAngle } = useChromaticState();
  const { chromaticTrailsDecay, setChromaticTrailsDecay, chromaticTrailsOffset, setChromaticTrailsOffset, chromaticTrailsBufferRef } = useChromaticTrailsState();
  const {
    colorShiftHue, setColorShiftHue,
  } = useColorState();
  useDiffusionState();
  useDiffusionGridState();
  const { digitalNoiseIntensity, setDigitalNoiseIntensity } = useDigitalNoiseState();
  const { ditherType, setDitherType, ditherLevels, setDitherLevels, ditherScale, setDitherScale } = useDitherState();
  const { oilPaintRadius, setOilPaintRadius, oilPaintLevels, setOilPaintLevels } = useOilPaintState();
  const { impastoStrength, setImpastoStrength, impastoLightAngle, setImpastoLightAngle } = useImpastoState();
  const { watercolorBleed, setWatercolorBleed, watercolorGrain, setWatercolorGrain, watercolorStyle, setWatercolorStyle } = useWatercolorState();
  const { dadaPanels, setDadaPanels, dadaChaos, setDadaChaos } = useDadaState();
  const { duotoneIntensity, setDuotoneIntensity, duotoneColor1, setDuotoneColor1, duotoneColor2, setDuotoneColor2, duotoneColor3, setDuotoneColor3, duotoneThreeColor, setDuotoneThreeColor } = useDuotoneState();
  const { dustCrackleIntensity, setDustCrackleIntensity, dustCrackleLength, setDustCrackleLength, dustCrackleColor, setDustCrackleColor } = useDustState();
  const { emojiSize, setEmojiSize, emojiChars, setEmojiChars, emojiRotateSpeed, setEmojiRotateSpeed, emojiAnimTime, setEmojiAnimTime, emojiOffsetX, setEmojiOffsetX, emojiSizeVariation, setEmojiSizeVariation, emojiPickerSearch, setEmojiPickerSearch } = useEmojiState();
  const { fadeDirection, setFadeDirection, fadeMode, setFadeMode, turrellAnimTime, setTurrellAnimTime, turrellSpeed, setTurrellSpeed, turrellGlow, setTurrellGlow, turrellSmoothRef } = useFadeState();
  const { feedbackDecay, setFeedbackDecay, feedbackZoom, setFeedbackZoom, feedbackRotation, setFeedbackRotation, feedbackBufferRef } = useFeedbackState();
  const { fieldContrast, setFieldContrast, paletteMode, setPaletteMode, paletteBands, setPaletteBands, fieldScale, fieldSpeed, fieldShapes, fieldSwirl, paletteStops, paletteBias, paletteSharp, setFieldScale, setFieldSpeed, setFieldShapes, setFieldSwirl, setPaletteStops, setPaletteBias, setPaletteSharp } = useFieldMappingState();
  const { flowerCircles, setFlowerCircles, flowerScale, setFlowerScale, flowerSpread, setFlowerSpread, flowerRotation, setFlowerRotation, flowerSymmetry, setFlowerSymmetry, flowerOpacity, flowerSpeed, setFlowerOpacity, setFlowerSpeed, flowerAnimTime, setFlowerAnimTime, flowAnimTime, setFlowAnimTime, flowParticleCount, setFlowParticleCount, flowSpeed, setFlowSpeed, flowScale, setFlowScale, flowThickness, setFlowThickness } = useFlowState();
  const { flowBufferRef } = useFlowBufferState();
  const { flowParticlesRef } = useFlowParticlesState();
  const { auraGlowCount, setAuraGlowCount, auraGlowSpeed, setAuraGlowSpeed, auraGlowOpacity, setAuraGlowOpacity } = useAuraGlowState();
  const { grainIntensity, setGrainIntensity, grainType, setGrainType, grainSize, setGrainSize } = useGrainState();
  const { gessoWhiteness, setGessoWhiteness, gessoTexture, setGessoTexture, gessoResponse, setGessoResponse } = useGessoState();
  const { gridEffectSpeed, setGridEffectSpeed, gridSides, setGridSides, gridRows, setGridRows, gridColumns, setGridColumns, gridRotation, setGridRotation, gridVariation, setGridVariation, gridShapeSize, setGridShapeSize, gridCellAngleStep, setGridCellAngleStep, gridHardEdge, setGridHardEdge } = useGridState();
  const { gridRotationDirection, setGridRotationDirection, gridRotationDirectionRef } = useGridRotationDirectionState();
  const { halftoneSize, setHalftoneSize, halftoneVariation, setHalftoneVariation, halftoneMove, setHalftoneMove, halftoneMoveSpeed, setHalftoneMoveSpeed, halftoneCMYK, setHalftoneCMYK, halftoneTimeRef, halftoneMoveRef } = useHalftoneState();
  const { helixTurns, setHelixTurns, helixTightness, setHelixTightness } = useHelixState();
  const { hexGridSize, setHexGridSize } = useHexGridState();
  const { invertAmount, setInvertAmount } = useInvertState();
  const { juliaReal, setJuliaReal, juliaImaginary, setJuliaImaginary, juliaZoom, setJuliaZoom, juliaIterations, juliaSpeed, setJuliaIterations, setJuliaSpeed, juliaCanvasRef } = useJuliaState();
  const { kaleidoscopeSegments, setKaleidoscopeSegments, kaleidoscopeRotateSpeed, setKaleidoscopeRotateSpeed } = useKaleidoscopeState();
  const { lavaAnimTime, setLavaAnimTime, lavaBlobCount, setLavaBlobCount, lavaBlobSize, setLavaBlobSize, lavaSpeed, setLavaSpeed } = useLavaState();
  const { lightLeakIntensity, setLightLeakIntensity } = useLightLeakState();
  const { linesCount, setLinesCount, linesAngle, setLinesAngle, linesThickness, setLinesThickness } = useLinesState();
  const { liquidAnimTime, setLiquidAnimTime, liquidStrength, setLiquidStrength, liquidScale, setLiquidScale, liquidSpeed, setLiquidSpeed } = useLiquidState();
  const { crtIntensity, setCrtIntensity, crtScanlineSpacing, setCrtScanlineSpacing } = useCrtState();
  const { liquifyStrength, setLiquifyStrength } = useLiquifyState();
  const { marbleAnimTime, setMarbleAnimTime, marbleVeinFreq, setMarbleVeinFreq, marbleTurbulence, setMarbleTurbulence, marbleOctaves, marbleSpeed, setMarbleOctaves, setMarbleSpeed } = useMarbleState();
  const { metaballAnimTime, setMetaballAnimTime, metaballCount, setMetaballCount, metaballSize, setMetaballSize, metaballSpeed, setMetaballSpeed } = useMetaballState();
  const { mirrorMode, setMirrorMode, mirrorTileCount, setMirrorTileCount } = useMirrorState();
  const { lastBroadcastSnapshotRef, syncChannelRef, animSyncChannelRef, animValuesRef, isDragging, setIsDragging, lastChangeTime, previousPosition, gradientType, setGradientType, resolutionMultiplier, setResolutionMultiplier, zoomBeatEnabled, setZoomBeatEnabled, shakeBeatEnabled, setShakeBeatEnabled, contrastBeatEnabled, setContrastBeatEnabled, paletteBeatEnabled, setPaletteBeatEnabled, isRecording, setIsRecording, isAutoMode, setIsAutoMode, isAutoColor, setIsAutoColor, gradientColors, setGradientColors, targetColors, setTargetColors, gradientAngle, setGradientAngle, targetAngle, setTargetAngle, zoom, setZoom, targetZoom, setTargetZoom, gradientColorsRef, gradientAngleRef, zoomRef, targetColorsRef, targetAngleRef, targetZoomRef, vcrPlaybackSpeedRef, isAutoModeRef, rotationDirectionRef, isVCRPlayingRef, isAudioActiveRef, drawParamsDirtyRef, lerpSyncFrameRef, isControlsVisible, setIsControlsVisible, isAboutOpen, setIsAboutOpen, isDisplayLinkCopied, setIsDisplayLinkCopied, rotationDirection, setRotationDirection, isMultiFxMode, setIsMultiFxMode, collapsedEffects, setCollapsedEffects, aiPrompt, setAIPrompt, submittedAIPrompt, setSubmittedAIPrompt, containerRef, activeEffects, setActiveEffects, showWavHint, setShowWavHint, activeTab, setActiveTab, setIsAIColorPickerOpen, isKeywordHelpOpen, setIsKeywordHelpOpen, concentricRingWidth, setConcentricRingWidth, concentricRingCount, setConcentricRingCount, isEmojiPickerOpen, setIsEmojiPickerOpen, baseAIColors, setBaseAIColors, showRatingUI, setShowRatingUI, ratedResults, pendingRatingState, setPendingRatingState, fileInputRef, setIsFullscreen, lastManualZoomTime, kaleidoAngleRef, isAutoColorRef, contrastPulseRef, saturationPulseRef, shakeRef, shakeWrapperRef, activeEffectsRef, gradientTypeRef } = useMiscState();
  // The current gradient's two shape sliders, read out of the per-gradient map.
  const fieldShapeA = fieldShapes[gradientType]?.[0] ?? 1;
  const fieldShapeB = fieldShapes[gradientType]?.[1] ?? 1;
  const setFieldShapeA = useCallback((v: number) => setFieldShapes(prev => {
    const id = gradientTypeRef.current;
    return { ...prev, [id]: [v, prev[id]?.[1] ?? 1] };
  }), [setFieldShapes, gradientTypeRef]);
  const setFieldShapeB = useCallback((v: number) => setFieldShapes(prev => {
    const id = gradientTypeRef.current;
    return { ...prev, [id]: [prev[id]?.[0] ?? 1, v] };
  }), [setFieldShapes, gradientTypeRef]);
  const { noiseScale, setNoiseScale, noiseOctaves, setNoiseOctaves, noiseDirection, setNoiseDirection, noiseWarp, setNoiseWarp, noiseType, setNoiseType, noiseAnimTime, setNoiseAnimTime, noiseSpeed, setNoiseSpeed } = useNoiseState();
  // 1024 rather than the hook's 768 default -- covers tablets too, not
  // just phones, per explicit request ("only on mobile/tablet"). One
  // breakpoint drives the bottom-sheet panel, the collapsed cluster, and
  // the About button's position together so none of them can disagree
  // about which layout mode is active at a given width.
  const isMobile = useIsMobile(1024);
  // panelRef now points at the rail (ControlRail's root, data-role="panel")
  // — it used to be the draggable 3-row card, but the rail replaced that
  // card and inherited the same drag mechanism, so this is the same ref
  // doing the same job against a different element.
  const panelRef = useRef<HTMLElement>(null);
  // The drawer's own scrollable root (ControlDrawer's forwarded ref) — used
  // below by the manual touch-drag-scroll workaround, now that tab content
  // scrolls inside the drawer rather than inside the old shared panel.
  const drawerRef = useRef<HTMLDivElement>(null);
  // The rail's live position/size, re-measured whenever it could have
  // moved (dragged, mobile toggle, or its own content wrapping to a
  // different number of rows) — ControlDrawer positions itself off this
  // instead of a guessed constant, and openAutoShufflePopover/the About
  // popup anchor off it too.
  const [railRect, setRailRect] = useState<{ top: number; left: number; right: number; bottom: number; width: number; height: number } | null>(null);
  useEffect(() => {
    const measure = () => {
      const rect = panelRef.current?.getBoundingClientRect();
      if (!rect) return;
      setRailRect({ top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [isMobile, isControlsVisible, activeTab]);
  // Nothing moved focus into the About panel when it opened (via the "?"
  // key or a click) — a keyboard/screen-reader user got no indication a
  // dialog had appeared, since focus just stayed wherever it was on the
  // page behind it. Escape already closed it (see the keydown handler
  // below); this only adds the open-time focus move. Focuses the dialog
  // container itself (tabIndex={-1} below) rather than a close button —
  // there isn't one anymore (closing is via Escape or clicking outside).
  const aboutDialogRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (isAboutOpen) aboutDialogRef.current?.focus();
  }, [isAboutOpen]);
  const { photoBlendMode, setPhotoBlendMode, photoOpacity, setPhotoOpacity, photoFileName, setPhotoFileName, photoVersion, setPhotoVersion, photoImageRef, photoInputRef } = usePhotoState();
  const { pinchStrength, setPinchStrength } = usePinchState();
  const { pixelSize, setPixelSize } = usePixelState();
  const { polygon2Sides, setPolygon2Sides } = usePolygon2State();
  const { posterizeLevels, setPosterizeLevels } = usePosterizeState();
  const { radialSizeScale, setRadialSizeScale, radialHardEdge, setRadialHardEdge, radialAnimTime, setRadialAnimTime, radialSpeed, setRadialSpeed } = useRadialState();
  const { radialBurstCount, setRadialBurstCount, radialBurstSpread, setRadialBurstSpread, radialBurstSize, setRadialBurstSize } = useRadialBurstState();
  const { reactionDiffusionFeed, setReactionDiffusionFeed, reactionDiffusionKill, setReactionDiffusionKill, reactionDiffusionSpeed, setReactionDiffusionSpeed } = useReactionDiffusionState();
  const { reactionDiffusionGridRef } = useReactionDiffusionGridState();
  const { redoStackRef, redoDepth, setRedoDepth } = useRedoState();
  const { sepiaIntensity, setSepiaIntensity } = useSepiaState();
  const { shapesSides, setShapesSides, shapesCount, shapesSpeed, setShapesCount, setShapesSpeed, shapesMode, setShapesMode } = useShapesState();
  const { stackCount, setStackCount, stackGap, setStackGap, stackWidth, setStackWidth, stackLength, setStackLength, stackResponse, stackSpeed, setStackResponse, setStackSpeed } = useStackState();
  const { hatchLayers, setHatchLayers, hatchSpacing, setHatchSpacing, hatchResponse, setHatchResponse, hatchAnimTime, setHatchAnimTime, hatchSpeed, setHatchSpeed } = useHatchState();
  const { effectSpeeds, setEffectSpeed, crtSpeed, setCrtSpeed, ditherSpeed, setDitherSpeed, dadaSpeed, setDadaSpeed, asciiSpeed, setAsciiSpeed, watercolorSpeed, setWatercolorSpeed, impastoSpeed, setImpastoSpeed } = useEffectSpeedsState();
  const { slitScanIntensity, setSlitScanIntensity, slitScanDirection, setSlitScanDirection, slitScanHistory, setSlitScanHistory, slitScanSpeed, setSlitScanSpeed, slitScanBufferRef } = useSlitScanState();
  const { solarizeThreshold, setSolarizeThreshold } = useSolarizeState();
  const { structuralSeed, setStructuralSeed } = useStructuralSeedState();
  const { topographicScale, setTopographicScale, topographicBands, setTopographicBands, topographicLineWidth, setTopographicLineWidth } = useTopographicState();
  const { waveInterferenceAnimTime, setWaveInterferenceAnimTime, waveInterferenceSourceCount, setWaveInterferenceSourceCount, waveInterferenceFrequency, setWaveInterferenceFrequency, waveInterferenceSpeed, setWaveInterferenceSpeed } = useWaveInterferenceState();
  const { meshWireframeAnimTime, setMeshWireframeAnimTime, meshWireframeGridSize, setMeshWireframeGridSize, meshWireframeJitter, setMeshWireframeJitter, meshWireframeLineWidth, setMeshWireframeLineWidth } = useMeshWireframeState();
  const { triangleSize, setTriangleSize, triangulateVariation, setTriangulateVariation } = useTriangleState();
  const { truchetSize, setTruchetSize, truchetVariation, setTruchetVariation, truchetThickness, truchetSpeed, setTruchetThickness, setTruchetSpeed } = useTruchetState();
  const { twistAmount, setTwistAmount } = useTwistState();
  const { undoStackRef, undoIndexRef, undoDepth, setUndoDepth } = useUndoState();
  const { vhsGlitchIntensity, setVhsGlitchIntensity, vhsJitterAmount, setVhsJitterAmount } = useVhsState();
  const { vignetteStrength, setVignetteStrength, vignetteSoftness, setVignetteSoftness } = useVignetteState();
  const { voronoiCellCount, setVoronoiCellCount, voronoiDistortion, voronoiSpeed, setVoronoiDistortion, setVoronoiSpeed, voronoiAnimTime, setVoronoiAnimTime } = useVoronoiState();
  const { waveDistortionStrength, setWaveDistortionStrength, waveDistortionRotation, setWaveDistortionRotation } = useWaveState();
  const { windmillTightness, setWindmillTightness, windmillRotations, setWindmillRotations, windmillThickness, setWindmillThickness, windmillZoom, setWindmillZoom, windmillZoomResponse, setWindmillZoomResponse, windmillMode, setWindmillMode } = useWindmillState();
  const windmillModeRef = useRef(windmillMode);
  windmillModeRef.current = windmillMode;

  // Per-effect beat toggles
  
  
  // Video recording state (shared between root and useVCRPlayback hook)
  // Play engages automatically on load/refresh at the default 1x speed.


  // Refs that shadow the animated state values — updated every RAF frame without React re-renders.
  // The master animation loop lerps these and calls drawRef imperatively.
  // State is synced back every 3 frames (~20fps) for undo/VCR continuity.
  const drawRef = useRef<() => void>(() => {});
  
  // Freeform gradient pins
  // Second hide tier for live/projector output — drops even the collapsed
  // mini icon strip, leaving pure canvas. Cycled via the same H hotkey:
  // visible -> mini strip -> fully hidden -> mini strip -> ...
  // A ?display=1 tab starts (and stays) in this tier permanently — see the
  // 'h' key handler below, which is a no-op in display mode.
  // Every active effect's section starts open (collapsedEffects starts
  // empty) and each toggles independently — now that the drawer is a full-
  // height docked sidebar rather than a floating card, there's no longer a
  // strong reason to force only one open at a time the way the old
  // single-open accordion did.
  const toggleEffectCollapsed = (id: string) => setCollapsedEffects(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  useResolutionBudget({ activeEffects, isMobile, setResolutionMultiplier });

  // First-run hint explaining the tap/hold/double-tap gesture vocabulary —
  // tooltips (title attrs) never surface on touch devices, which is this
  // app's primary target, so without this the gestures are undiscoverable.
  const dismissWavHint = () => {
    setShowWavHint(false);
    try { localStorage.setItem('wavGestureGuideSeen', '1'); } catch (err) {
      if (import.meta.env.DEV) console.warn('Failed to persist wavGestureGuideSeen:', err);
    }
  };
  
  // File input refs for uploads
  const handleAudioFileClick = useCallback(() => fileInputRef.current?.click(), []);
  const handlePhotoFileClick = useCallback(() => photoInputRef.current?.click(), []);
  const { handlePhotoFileChange } = usePhotoUpload({ photoFileName, setPhotoFileName, setPhotoVersion, photoImageRef, setActiveEffects, isMultiFxMode });

  // Memoized helper for generating random hex colors
  const randomHexColor = useCallback(() => {
    const r = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
    const g = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
    const b = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }, []);

  // ─── Custom Hooks ────────────────────────────────────────────────────────────

  // useAudioReactivity — all audio state, refs, processing loops
  const audio = useAudioReactivity({
    onBassFlash: () => { if (gradientType !== 'windmill' && gradientType !== 'angle') setTargetZoom(prev => Math.min(prev * 1.06, prev + 0.08)); },
    // Previously flipped rotationDirection on every mids flash, which made the
    // direction toggle button in the VCR controls silently fight the user's
    // manual choice once audio was engaged. Rotation direction is now only
    // ever changed by the user (or by feelingLucky's randomizer).
    onMidsFlash: () => {},
    onTrebleFlash: () => {
      if (IS_DISPLAY_MODE) return;
      if (!isAutoColorRef.current) return;
      if (gradientType === 'windmill' || gradientType === 'angle') return;
      const randomC = () => ({ r: Math.floor(Math.random() * 256), g: Math.floor(Math.random() * 256), b: Math.floor(Math.random() * 256) });
      setTargetColors(prev => prev.map(() => randomC()));
    },
    setTargetColors: (updater) => { if (!IS_DISPLAY_MODE && isAutoColorRef.current) setTargetColors(updater); },
    setGradientColors: (updater) => { if (!IS_DISPLAY_MODE && isAutoColorRef.current) setGradientColors(updater); },
    setTargetZoom: (updater) => { if (gradientType !== 'windmill' && gradientType !== 'angle') setTargetZoom(updater); },
    zoomBeatEnabled,
  });

  // Destructure audio hook values for use throughout this component
  const {
    isAudioEnabled, setIsAudioEnabled,
    audioFile,
    audioFileName,
    audioFileMetadata,
    waveformData,
    isAudioReactive, setIsAudioReactive,
    isMicActive,
    micError, setMicError,
    audioSubBassLevel,
    audioMidsLevel,
    audioTrebleLevel,
    audioEnergy,
    subBassOnsetTick,
    bassOnsetTick,
    musicIntensityRef,
    audioInputDevices,
    selectedAudioDeviceId, setSelectedAudioDeviceId,
    bassMultiplier, setBassMultiplier,
    midsMultiplier, setMidsMultiplier,
    trebleMultiplier, setTrebleMultiplier,
    bassSmoothing, setBassSmoothing,
    midsSmoothing, setMidsSmoothing,
    trebleSmoothing, setTrebleSmoothing,
    bassThreshold, setBassThreshold,
    midsThreshold, setMidsThreshold,
    trebleThreshold, setTrebleThreshold,
    bassMin, setBassMin,
    bassMax, setBassMax,
    midsMin, setMidsMin,
    midsMax, setMidsMax,
    trebleMin, setTrebleMin,
    trebleMax, setTrebleMax,
    masterSensitivity, setMasterSensitivity,
    autoGainEnabled, setAutoGainEnabled,
    depthLayerEnabled, setDepthLayerEnabled,
    depthLayerStrength, setDepthLayerStrength,
    bassBeatSync, setBassBeatSync,
    midsBeatSync, setMidsBeatSync,
    trebleBeatSync, setTrebleBeatSync,
    subBassMultiplier, setSubBassMultiplier,
    subBassBeatSync, setSubBassBeatSync,
    liveSubBassLevel,
    liveBassLevel,
    liveMidsLevel,
    liveTrebleLevel,
    isAudioControlsOpen, setIsAudioControlsOpen,
    audioRef,
    analyserRef,
    analyzeAudioRef,
    audioContextRef,
    streamRef,
    handleFileUpload,
    startMicVisualization,
    stopMicVisualization,
  } = audio;

  // AudioPanel exposes one "Reaction Smoothing" control (matching Brik's
  // single slider) rather than three separate per-band ones — the
  // underlying bass/mids/treble smoothing refs stay independent internally,
  // but in practice they're always tuned together, so this sets all three
  // at once.
  const setReactionSmoothing = useCallback((v: number) => {
    setBassSmoothing(v);
    setMidsSmoothing(v);
    setTrebleSmoothing(v);
  }, [setBassSmoothing, setMidsSmoothing, setTrebleSmoothing]);

  // useVCRPlayback — VCR recording/playback state and handlers
  const vcr = useVCRPlayback({
    isRecording,
    setIsRecording,
    isAutoMode,
    setIsAutoMode,
    setTargetColors,
    setTargetAngle: (updater) => setTargetAngle(updater),
    setTargetZoom: (updater) => setTargetZoom(updater),
    gradientColors,
    gradientAngle,
    zoom,
    canvasRef,
    setIsAudioEnabled,
    audioRef,
    audioContextRef,
    analyserRef,
    streamRef,
    audioFile,
  });

  const {
    setIsVCRRecording,
    isVCRPlaying, setIsVCRPlaying,
    vcrPlaybackSpeed, setVcrPlaybackSpeed,
    toggleVCRRecording,
    toggleVCRPlayback,
    isEncoding, encodingProgress, videoResult, clearVideoResult,
  } = vcr;

  // useAuth — owns the Firebase Auth session (anonymous by default; can be
  // upgraded to a real Google/email account without losing the uid, so
  // presets keep working across the link with no migration in the common
  // case). usePresets reads `uid` from here rather than signing in itself.
  const authState = useAuth();

  // usePresets — preset save/load/delete/rename
  const presets = usePresets({
    // Presets used to save/restore only ~20 fields — a leftover from before
    // most of the app's gradient/effect-specific sliders existed — so a
    // reloaded preset kept the right base colors/gradient type but every
    // fine-tuned slider snapped back to whatever was already live instead of
    // what was saved. buildSnapshot/applySnapshot (used by undo/redo) are
    // kept in sync with every gradient/effect parameter that exists, so
    // presets now reuse them directly instead of maintaining a second,
    // perpetually-stale field list.
    getCurrentState: () => buildSnapshot(),
    applyPresetData: (rawData: PresetData) => {
      const data = sanitizeSnapshot(rawData);
      applySnapshot({
        ...data,
        gradientType: data.gradientType ? migrateId(data.gradientType) as GradientType : 'angle',
        activeEffects: migrateIds(data.activeEffects) as EffectType[],
      });
      // Snap the refs the draw loop actually reads straight to the saved
      // values instead of letting them ease in from whatever was on screen
      // before the click (the same ~1-2s ease used for organic in-app
      // changes, e.g. picking a new palette). Without this, the same preset
      // could render differently each time depending on what was showing
      // right before it was loaded, and any screenshot/comparison taken in
      // that window would catch it mid-transition.
      const restoredColors = data.gradientColors || DEFAULT_COLORS;
      gradientColorsRef.current = restoredColors.map((c: ColorRGB) => ({ ...c }));
      gradientAngleRef.current = data.gradientAngle ?? 45;
      zoomRef.current = data.zoom ?? 1;
    },
    uid: authState.uid,
  });

  useSharedPresetLink({ getApplySnapshot: () => applySnapshot, gradientAngleRef, gradientColorsRef, setIsAutoMode, zoomRef });

  const {
    savedPresets,
    renamingPresetId, setRenamingPresetId,
    renamingPresetValue, setRenamingPresetValue,
    isPresetsDropdownOpen, setIsPresetsDropdownOpen,
    openNewPresetSignal,
    folderNames,
    savePresetWithName,
    loadPreset,
    deletePreset,
    renamePreset,
    updatePreset,
    movePresetToFolder,
    addFolder,
    renameFolder,
    deleteFolder,
  } = presets;

  // ─── End Custom Hooks ────────────────────────────────────────────────────────

  useSliderFill();

  useRefMirrors({ animValuesRef, flowerAnimTime, gradientColorsRef, gradientType, gridRotation, isAudioActiveRef, isAudioEnabled, isAudioReactive, isAutoColor, isAutoColorRef, isAutoMode, isAutoModeRef, isMicActive, isVCRPlaying, isVCRPlayingRef, rotationDirection, rotationDirectionRef, setTargetColors, targetAngle, targetAngleRef, targetColors, targetColorsRef, targetZoom, targetZoomRef, tilingAnimTime, vcrPlaybackSpeed, vcrPlaybackSpeedRef, voronoiAnimTime });

  // Master animation RAF — lerps animated refs and calls drawRef imperatively.
  // Zero React state changes per frame; state syncs at ~20fps for undo/VCR.
  // Skips the draw entirely when nothing is animating and values have converged.
  // Refs so animation loops can read latest audio values without restarting
  const audioSubBassLevelRef = useRef(audioSubBassLevel);
  audioSubBassLevelRef.current = audioSubBassLevel;
  const audioMidsLevelRef = useRef(audioMidsLevel);
  audioMidsLevelRef.current = audioMidsLevel;
  const lastReseedTimeRef = useRef(0);
  const { mobilePanelMaxHeight } = useMobilePanelHeight({ isMobile });

  // Refs so the consolidated master RAF loop can read latest gating state without restarting
  activeEffectsRef.current = activeEffects;
  halftoneMoveRef.current = halftoneMove;
  gridRotationDirectionRef.current = gridRotationDirection;
  gradientTypeRef.current = gradientType;
  const isMicActiveRef = useRef(isMicActive);
  isMicActiveRef.current = isMicActive;

  // Clear slit-scan buffer when the effect is turned off
  useEffect(() => {
    if (!activeEffects.includes('slit-scan')) {
      slitScanBufferRef.current = [];
    }
  }, [activeEffects]);

  const gradientSpeedRef = useRef(1);
  useEffect(() => {
    const speeds: Partial<Record<GradientType, number>> = { voronoi: voronoiSpeed, flower: flowerSpeed, stack: stackSpeed, truchet: truchetSpeed, shapes: shapesSpeed, julia: juliaSpeed };
    gradientSpeedRef.current = speeds[gradientType] ?? 1;
  }, [gradientType, voronoiSpeed, flowerSpeed, stackSpeed, truchetSpeed, shapesSpeed, juliaSpeed]);
  useMasterClock({ activeEffectsRef, analyzeAudioRef, animValuesRef, audioMidsLevelRef, audioSubBassLevelRef, drawParamsDirtyRef, drawRef, gradientAngleRef, gradientColorsRef, gradientTypeRef, gridRotationDirectionRef, halftoneMoveRef, halftoneTimeRef, isAudioActiveRef, isAutoModeRef, getIsAutoShuffleOn: () => isAutoShuffleOnRef.current, isMicActiveRef, isVCRPlayingRef, lerpSyncFrameRef, rotationDirectionRef, setFlowerAnimTime, setGradientAngle, setGradientColors, setGridRotation, setMeshWireframeAnimTime, setTargetAngle, setTilingAnimTime, setVoronoiAnimTime, setWaveInterferenceAnimTime, setZoom, targetAngleRef, targetColorsRef, targetZoomRef, vcrPlaybackSpeedRef, gradientSpeedRef, windmillModeRef, zoomRef });
  const randomColor = useCallback((): ColorRGB => hslToRgb(
    Math.random() * 360,
    55 + Math.random() * 45,
    38 + Math.random() * 32,
  ), []);

  // Plain setGradientColors/setTargetColors alone isn't enough for a
  // structural change (adding/removing a swatch, not just recoloring one
  // already there): the render loop lerps gradientColorsRef.current toward
  // targetColorsRef.current every frame by index, using colors.length off
  // the REF, and every 15 frames writes that ref straight back over React
  // state (see the lerp-sync effect above). Setting only the React state
  // left the ref at its old array length, so within a quarter second the
  // sync wrote the old (unchanged-length) array back over whatever the
  // Color tab's Add/Remove had just done — a delete or add would silently
  // revert almost immediately. This updates both refs and both states
  // together so there's nothing left for that sync to stomp, and — as a
  // side benefit — also makes the edit instant instead of easing in.
  const setColorsInstant = useCallback((colors: ColorRGB[]) => {
    gradientColorsRef.current = colors.map(c => ({ ...c }));
    targetColorsRef.current = colors.map(c => ({ ...c }));
    setGradientColors(colors);
    setTargetColors(colors);
  }, []);


  useAnimClocks({ causticsSpeed, marbleSpeed, activeEffects, animValuesRef, attractorAnimTime, attractorSpeed, audioEnergy, audioMidsLevel, audioSubBassLevel, audioTrebleLevel, auroraAnimTime, causticsAnimTime, emojiAnimTime, emojiRotateSpeed, flowAnimTime, flowSpeed, gradientType, gradientTypeRef, hatchAnimTime, hatchSpeed, isAutoMode, isAutoModeRef, isMicActive, isMicActiveRef, isVCRPlaying, isVCRPlayingRef, lavaAnimTime, liquidAnimTime, marbleAnimTime, metaballAnimTime, metaballSpeed, noiseAnimTime, noiseSpeed, particlesMode, radialAnimTime, radialSpeed, setAttractorAnimTime, setCausticsAnimTime, setEmojiAnimTime, setFlowAnimTime, setHatchAnimTime, setLavaAnimTime, setLiquidAnimTime, setMarbleAnimTime, setMetaballAnimTime, setNoiseAnimTime, setRadialAnimTime, turrellAnimTime, vcrPlaybackSpeed, vcrPlaybackSpeedRef });

  // buildSnapshot/applySnapshot extracted to useSnapshot.ts (splitting-plan
  // step 3). The single source of truth for undo/redo AND presets, so it
  // touches nearly every piece of state (~380 values/setters).
  const { buildSnapshot, applySnapshot } = useSnapshot({
    crtSpeed, ditherSpeed, dadaSpeed, asciiSpeed, watercolorSpeed, impastoSpeed, gridEffectSpeed, liquidSpeed, setCrtSpeed, setDitherSpeed, setDadaSpeed, setAsciiSpeed, setWatercolorSpeed, setImpastoSpeed, setGridEffectSpeed, setLiquidSpeed,
    activeEffects, angleCenterX, angleCenterY, angleStartOffset, angleHardEdge, setAngleHardEdge, asciiChars, asciiColor,
    gridHardEdge, setGridHardEdge, radialHardEdge, setRadialHardEdge,
    radialAnimTime, setRadialAnimTime, radialSpeed, setRadialSpeed,
    noiseAnimTime, setNoiseAnimTime, noiseSpeed, setNoiseSpeed,
    asciiSize, auroraBandCount, auroraBandHeight, auroraWaveSpeed, autoGainEnabled, baseAIColors,
    depthLayerEnabled, depthLayerStrength, setDepthLayerEnabled, setDepthLayerStrength,
    auraGlowCount, setAuraGlowCount, auraGlowSpeed, setAuraGlowSpeed, auraGlowOpacity, setAuraGlowOpacity,
    juliaReal, juliaImaginary, juliaZoom, juliaIterations, juliaSpeed, setJuliaReal, setJuliaImaginary, setJuliaZoom, setJuliaIterations, setJuliaSpeed,
    fieldContrast, paletteMode, fieldScale, fieldSpeed, fieldShapes, fieldSwirl, paletteStops, paletteBias, paletteSharp, paletteBands, setFieldContrast, setPaletteMode, setFieldScale, setFieldSpeed, setFieldShapes, setFieldSwirl, setPaletteStops, setPaletteBias, setPaletteSharp, setPaletteBands,
    invertAmount, setInvertAmount,
    voronoiAnimTime, setVoronoiAnimTime, flowerAnimTime, setFlowerAnimTime, auroraAnimTime, setAuroraAnimTime,
    fadeMode, setFadeMode, turrellAnimTime, setTurrellAnimTime, turrellSpeed, setTurrellSpeed, turrellGlow, setTurrellGlow,
    stackCount, setStackCount, stackGap, setStackGap, stackWidth, setStackWidth, stackLength, setStackLength, stackResponse, stackSpeed, setStackResponse, setStackSpeed,
    hatchLayers, setHatchLayers, hatchSpacing, setHatchSpacing, hatchResponse, setHatchResponse,
    hatchAnimTime, setHatchAnimTime, hatchSpeed, setHatchSpeed,
    causticsAnimTime, setCausticsAnimTime, lavaAnimTime, setLavaAnimTime, marbleAnimTime, setMarbleAnimTime,
    metaballAnimTime, setMetaballAnimTime, flowAnimTime, setFlowAnimTime,
    liquidAnimTime, setLiquidAnimTime, emojiAnimTime, setEmojiAnimTime, attractorAnimTime, setAttractorAnimTime,
    tilingAnimTime, setTilingAnimTime,
    waveInterferenceAnimTime, setWaveInterferenceAnimTime, waveInterferenceSourceCount, setWaveInterferenceSourceCount,
    waveInterferenceFrequency, setWaveInterferenceFrequency, waveInterferenceSpeed, setWaveInterferenceSpeed,
    meshWireframeAnimTime, setMeshWireframeAnimTime, meshWireframeGridSize, setMeshWireframeGridSize,
    meshWireframeJitter, setMeshWireframeJitter, meshWireframeLineWidth, setMeshWireframeLineWidth,
    fireworksCount, setFireworksCount, fireworksParticleCount, setFireworksParticleCount, fireworksTrailFade, setFireworksTrailFade,
    lightningBoltCount, setLightningBoltCount, lightningJitter, setLightningJitter, lightningBranchiness, setLightningBranchiness,
    structuralSeed, setStructuralSeed,
    audioBindings, setAudioBindings,
    bassBeatSync, bassMax, bassMin, bassMultiplier, bassSmoothing, bassThreshold,
    bloomIntensity, bloomRadius, blurGaussianAmount, blurMotionAmount, blurMotionDirection, blurRadialAmount,
    blurType, causticsBrightness, causticsScale, causticsSpeed, chromaticAngle, chromaticOffset,
    chromaticTrailsDecay, chromaticTrailsOffset, colorShiftHue, concentricRingCount, concentricRingWidth,
    helixTightness, helixTurns, contrastBeatEnabled, digitalNoiseIntensity, ditherLevels, ditherType, ditherScale,
    oilPaintRadius, setOilPaintRadius, oilPaintLevels, setOilPaintLevels,
    impastoStrength, setImpastoStrength, impastoLightAngle, setImpastoLightAngle,
    watercolorBleed, setWatercolorBleed, watercolorGrain, setWatercolorGrain, watercolorStyle, setWatercolorStyle,
    dadaPanels, setDadaPanels, dadaChaos, setDadaChaos,
    duotoneColor1, duotoneColor2, duotoneColor3, duotoneIntensity, duotoneThreeColor, dustCrackleColor, dustCrackleIntensity, dustCrackleLength,
    emojiChars, emojiOffsetX, emojiRotateSpeed, emojiSize, emojiSizeVariation, fadeDirection,
    feedbackDecay, feedbackRotation, feedbackZoom, 
    flowParticleCount, flowScale, flowSpeed, flowThickness,
    attractorPointCount, attractorScale, attractorSpeed, attractorDotSize, setAttractorPointCount, setAttractorScale, setAttractorSpeed, setAttractorDotSize,
    attractorTrailFade, setAttractorTrailFade,
    particlesCount, particlesSpeed, particlesSize, particlesTrail, particlesGravity, particlesSides, particlesMode,
    setParticlesCount, setParticlesSpeed, setParticlesSize, setParticlesTrail, setParticlesGravity, setParticlesSides, setParticlesMode,
    marksCount, setMarksCount, marksSize, setMarksSize, marksDecay, setMarksDecay,
    tilingSize, tilingSymmetry, tilingComplexity, tilingRotation, tilingRowOffset,
    setTilingSize, setTilingSymmetry, setTilingComplexity, setTilingRotation, setTilingRowOffset,
    reactionDiffusionFeed, reactionDiffusionKill, reactionDiffusionSpeed,
    setReactionDiffusionFeed, setReactionDiffusionKill, setReactionDiffusionSpeed,
    topographicScale, topographicBands, topographicLineWidth,
    setTopographicScale, setTopographicBands, setTopographicLineWidth,
    flowerCircles, flowerRotation, flowerSymmetry, flowerOpacity, flowerSpeed,
    flowerScale, flowerSpread, gradientAngle, gradientColors, gradientType, grainIntensity, grainSize,
    gessoWhiteness, gessoTexture, gessoResponse,
    grainType, gridCellAngleStep, gridColumns, gridRotation, gridRows, gridShapeSize, gridSides,
    gridVariation, halftoneCMYK, halftoneMove, halftoneMoveSpeed, halftoneSize, halftoneVariation,
    hexGridSize, isAudioEnabled, isAudioReactive,
    kaleidoscopeRotateSpeed, kaleidoscopeSegments, lavaBlobCount, lavaBlobSize, lavaSpeed, lightLeakIntensity,
    linesAngle, linesCount, linesThickness, liquidScale, liquidStrength, liquifyStrength, crtIntensity, crtScanlineSpacing,
    marbleOctaves, marbleSpeed, marbleTurbulence, marbleVeinFreq, masterSensitivity,
    metaballCount, metaballSize, metaballSpeed, midsBeatSync, midsMax, midsMin,
    midsMultiplier, midsSmoothing, midsThreshold, mirrorMode, mirrorTileCount,
    noiseDirection, noiseOctaves, noiseScale, noiseType,
    noiseWarp, paletteBeatEnabled, photoBlendMode, photoImageRef, photoOpacity, pinchStrength,
    pixelSize, polygon2Sides,
    posterizeLevels, radialBurstCount, radialBurstSize,
    radialBurstSpread, radialSizeScale, resolutionMultiplier,
    sepiaIntensity, setActiveEffects, setAngleCenterX,
    setAngleCenterY, setAngleStartOffset, setAsciiChars, setAsciiColor, setAsciiSize, setAuroraBandCount,
    setAuroraBandHeight, setAuroraWaveSpeed, setAutoGainEnabled, setBaseAIColors, setBassBeatSync, setBassMax,
    setBassMin, setBassMultiplier, setBassSmoothing, setBassThreshold, setBloomIntensity, setBloomRadius,
    setBlurGaussianAmount, setBlurMotionAmount, setBlurMotionDirection, setBlurRadialAmount, setBlurType, setCausticsBrightness,
    setCausticsScale, setCausticsSpeed, setChromaticAngle, setChromaticOffset, setChromaticTrailsDecay, setChromaticTrailsOffset,
    setColorShiftHue, setConcentricRingCount, setConcentricRingWidth, setHelixTightness, setHelixTurns,
    setContrastBeatEnabled, setDigitalNoiseIntensity, setDitherLevels, setDitherType, setDitherScale, setDuotoneColor1, setDuotoneColor2,
    setDuotoneColor3, setDuotoneIntensity, setDuotoneThreeColor, setDustCrackleColor, setDustCrackleIntensity, setDustCrackleLength, setEmojiChars, setEmojiOffsetX,
    setEmojiRotateSpeed, setEmojiSize, setEmojiSizeVariation, setFadeDirection, setFeedbackDecay, setFeedbackRotation,
    setFeedbackZoom, setFlowParticleCount, setFlowScale,
    setFlowSpeed, setFlowThickness, setFlowerCircles, setFlowerRotation, setFlowerScale, setFlowerSpread, setFlowerSymmetry, setFlowerOpacity, setFlowerSpeed,
    setGradientAngle, setGradientColors, setGradientType, setGrainIntensity, setGrainType, setGrainSize,
    setGessoWhiteness, setGessoTexture, setGessoResponse,
    setGridCellAngleStep, setGridColumns,
    setGridRotation, setGridRows, setGridShapeSize, setGridSides, setGridVariation, setHalftoneCMYK,
    setHalftoneMove, setHalftoneMoveSpeed, setHalftoneSize, setHalftoneVariation, setHexGridSize,
    setIsAudioEnabled, setIsAudioReactive, setKaleidoscopeRotateSpeed, setKaleidoscopeSegments,
    setLavaBlobCount, setLavaBlobSize, setLavaSpeed, setLightLeakIntensity, setLinesAngle, setLinesCount,
    setLinesThickness, setLiquidScale, setLiquidStrength, setLiquifyStrength, setCrtIntensity, setCrtScanlineSpacing, setMarbleOctaves, setMarbleSpeed, setMarbleTurbulence,
    setMarbleVeinFreq, setMasterSensitivity, setMetaballCount, setMetaballSize,
    setMetaballSpeed, setMidsBeatSync, setMidsMax, setMidsMin, setMidsMultiplier, setMidsSmoothing,
    setMidsThreshold, setMirrorMode, setMirrorTileCount,
    setNoiseDirection, setNoiseOctaves, setNoiseScale, setNoiseType, setNoiseWarp, setPaletteBeatEnabled,
    setPhotoBlendMode, setPhotoOpacity, setPinchStrength, setPixelSize,
    setPolygon2Sides, setPosterizeLevels, 
    setRadialBurstCount, setRadialBurstSize, setRadialBurstSpread, setRadialSizeScale, setResolutionMultiplier,
    setSepiaIntensity,
    setShakeBeatEnabled, setShapesCount, setShapesSpeed, setShapesSides, setSlitScanDirection, setSlitScanIntensity, setSlitScanHistory, setSlitScanSpeed, setSolarizeThreshold,
    setWindmillRotations, setWindmillThickness, setWindmillTightness, setWindmillZoom, setWindmillZoomResponse, setWindmillMode, setShapesMode, setSubBassBeatSync, setSubBassMultiplier,
    setSubmittedAIPrompt, setTargetAngle, setTargetColors, setTargetZoom, setTrebleBeatSync, setTrebleMax,
    setTrebleMin, setTrebleMultiplier, setTrebleSmoothing, setTrebleThreshold, setTriangleSize, setTriangulateVariation, setTruchetSize,
    setTruchetThickness, setTruchetSpeed, setTruchetVariation, setTwistAmount, setVhsGlitchIntensity, setVhsJitterAmount, setVignetteSoftness, setVignetteStrength,
    setVoronoiCellCount, setVoronoiDistortion, setVoronoiSpeed, setWaveDistortionRotation, setWaveDistortionStrength,
    setZoom, setZoomBeatEnabled, shakeBeatEnabled,
    shapesCount, shapesSpeed, shapesSides, shapesMode, slitScanDirection, slitScanIntensity, slitScanHistory, slitScanSpeed, solarizeThreshold, windmillRotations,
    windmillThickness, windmillTightness, windmillZoom, windmillZoomResponse, windmillMode, subBassBeatSync, subBassMultiplier, submittedAIPrompt,
    targetAngle, targetColors, targetZoom, trebleBeatSync, trebleMax, trebleMin,
    trebleMultiplier, trebleSmoothing, trebleThreshold, triangleSize, triangulateVariation, truchetSize, truchetThickness, truchetSpeed,
    truchetVariation, twistAmount, vhsGlitchIntensity, vhsJitterAmount, vignetteSoftness, vignetteStrength, voronoiCellCount,
    voronoiDistortion, voronoiSpeed, waveDistortionRotation, waveDistortionStrength,
    zoom, zoomBeatEnabled,
  });


  // Save current state for undo (defined early for use in other functions)
  const { saveCurrentState, undoLastChange, redoLastChange } = useUndoRedo({
    buildSnapshot, applySnapshot, undoStackRef, undoIndexRef, setUndoDepth, redoStackRef, setRedoDepth,
  });

  // Randomize all colors
  const { applyGradientLook, applyLookValues, applyPalette, colorFamilyRef, keepFamily, setKeepFamily, shuffleColors } = useLooks({ gradientColorsRef, gradientTypeRef, saveCurrentState, setAngleStartOffset, setAttractorPointCount, setAttractorScale, setAttractorSpeed, setCausticsBrightness, setCausticsScale, setCausticsSpeed, setColorsInstant, setFadeDirection, setFieldContrast, setFieldScale, setFieldShapes, setFieldSpeed, setFieldSwirl, setFlowerCircles, setFlowerScale, setFlowerSpread, setGridColumns, setGridRows, setHatchLayers, setHatchResponse, setHatchSpacing, setHatchSpeed, setHelixTightness, setHelixTurns, setJuliaImaginary, setJuliaIterations, setJuliaSpeed, setJuliaReal, setJuliaZoom, setLavaBlobCount, setLavaBlobSize, setLavaSpeed, setMarbleOctaves, setMarbleSpeed, setMarbleTurbulence, setMarbleVeinFreq, setMetaballCount, setMetaballSize, setMetaballSpeed, setNoiseOctaves, setNoiseScale, setNoiseSpeed, setNoiseType, setNoiseWarp, setPaletteBias, setPaletteSharp, setPaletteStops, setParticlesCount, setParticlesGravity, setParticlesSize, setParticlesSpeed, setParticlesTrail, setRadialBurstCount, setRadialBurstSize, setRadialBurstSpread, setRadialSizeScale, setRadialSpeed, setReactionDiffusionFeed, setReactionDiffusionKill, setReactionDiffusionSpeed, setShapesCount, setShapesSpeed, setShapesSides, setStackCount, setStackGap, setStackLength, setStackResponse, setStackSpeed, setStackWidth, setTargetColors, setTilingComplexity, setTilingRotation, setTilingSize, setTilingSymmetry, setTopographicBands, setTopographicLineWidth, setTopographicScale, setTruchetSize, setTruchetThickness, setTruchetSpeed, setTruchetVariation, setVoronoiCellCount, setVoronoiDistortion, setVoronoiSpeed, setWindmillMode });

  // Gradient display names, and the full/feeling-lucky type lists, now live
  // in constants/gradientEffects.ts (GRADIENT_DISPLAY_NAMES, FULL_GRADIENT_TYPES,
  // FEELING_LUCKY_GRADIENT_TYPES) alongside the rest of the static effect/gradient
  // data tables.
  const getGradientDisplayName = useCallback((type: GradientType): string => {
    return GRADIENT_DISPLAY_NAMES[type] ?? type;
  }, []);


  // WAV button / Shuffle randomization — extracted to useRandomization.ts
  // (splitting-plan step 2). Wires ~150 setters spanning nearly every
  // piece of gradient/effect state, since randomization touches everything
  // by design.
  const {
    shuffleGradientType, randomizeEffects,
    evolveWithFactor: evolveRaw, shuffleAudiovisuals,
  } = useRandomization({
    colorFamilyRef, activeEffects, adjustColorArrayLength, gradientAngle, gradientColors, gradientType, isAudioEnabled, isAudioReactive, isMobile,
    kaleidoscopeSegments, pixelSize, resolutionMultiplier, setResolutionMultiplier,
    randomColor, randomHexColor, ratedResults, saveCurrentState, setActiveEffects,
    setAngleCenterX, setAngleCenterY, setAngleStartOffset, setAsciiSize, setAsciiColor, setAuroraBandCount, setAuroraBandHeight,
    setAuroraWaveSpeed, setBaseAIColors, setBassBeatSync, setBassMultiplier, setBloomIntensity, setBloomRadius, setBlurGaussianAmount, setBlurMotionAmount,
    setBlurMotionDirection, setBlurRadialAmount, setBlurType, setCausticsBrightness, setCausticsScale, setCausticsSpeed, setChromaticAngle, setChromaticOffset,
    setChromaticTrailsDecay, setChromaticTrailsOffset, setColorShiftHue, setConcentricRingCount, setConcentricRingWidth,
    setHelixTightness, setHelixTurns, setContrastBeatEnabled, setDigitalNoiseIntensity, setDitherLevels, setDitherType, setDitherScale,
    setDuotoneColor1, setDuotoneColor2, setDuotoneColor3, setDuotoneIntensity, setDuotoneThreeColor, setDustCrackleColor, setDustCrackleIntensity, setDustCrackleLength, setEmojiChars,
    setEmojiRotateSpeed, setEmojiSize, setEmojiSizeVariation, setFadeDirection, setFeedbackDecay, setFeedbackRotation, setFeedbackZoom,
    setFlowParticleCount, setFlowScale, setFlowSpeed, setFlowThickness, setFlowerCircles,
    setAsciiChars, setGrainType, setGridRotationDirection, setKaleidoscopeRotateSpeed, setLiquidScale, setLiquidStrength, setCrtIntensity, setCrtScanlineSpacing,
    setNoiseType, setNoiseWarp, setNoiseSpeed, setRadialSizeScale, setRadialSpeed, setVignetteSoftness, setWaveDistortionRotation,
    setJuliaReal, setJuliaImaginary, setJuliaZoom, setJuliaIterations, setJuliaSpeed,
    setReactionDiffusionFeed, setReactionDiffusionKill, setReactionDiffusionSpeed,
    setAttractorPointCount, setAttractorScale, setAttractorSpeed, setAttractorDotSize, setAttractorTrailFade,
    setParticlesCount, setParticlesSpeed, setParticlesSize, setParticlesTrail, setParticlesGravity, setParticlesSides,
    setMarksCount, setMarksSize, setMarksDecay,
    setTilingSize, setTilingSymmetry, setTilingComplexity, setTilingRotation, setTilingRowOffset,
    setFireworksCount, setFireworksParticleCount, setFireworksTrailFade,
    setLightningBoltCount, setLightningJitter, setLightningBranchiness,
    setMeshWireframeGridSize, setMeshWireframeJitter, setMeshWireframeLineWidth,
    setWaveInterferenceSourceCount, setWaveInterferenceFrequency, setWaveInterferenceSpeed,
    setTopographicScale, setTopographicBands, setTopographicLineWidth,
    setFieldContrast, setPaletteMode, setPaletteBands, setInvertAmount, setFieldScale, setFieldSpeed, setPaletteStops, setPaletteBias, setPaletteSharp, applyLookValues, setFieldShapes, setFieldSwirl,
    setSlitScanIntensity, setSlitScanDirection, setSlitScanHistory, setSlitScanSpeed, setCrtSpeed, setDitherSpeed, setDadaSpeed, setAsciiSpeed, setWatercolorSpeed, setImpastoSpeed, setGridEffectSpeed, setLiquidSpeed,
    setOilPaintRadius, setOilPaintLevels, setImpastoStrength, setImpastoLightAngle, setWatercolorBleed, setWatercolorGrain,
    setDadaPanels, setDadaChaos,
    setFlowerScale, setFlowerSpread, setGradientColors, setGradientType, setGrainIntensity, setGrainSize,
    setGessoWhiteness, setGessoTexture, setGessoResponse,
    setGridCellAngleStep, setGridColumns,
    setGridRotation, setGridRows, setGridShapeSize, setGridSides, setGridVariation, setHalftoneMove, setHalftoneCMYK,
    setHalftoneMoveSpeed, setHalftoneSize, setHalftoneVariation, setHexGridSize,
    setIsMultiFxMode, setKaleidoscopeSegments, setLavaBlobCount, setLavaBlobSize, setLightLeakIntensity,
    setMidsBeatSync, setMidsMultiplier,
    setLinesAngle, setLinesCount, setLinesThickness, setLiquifyStrength, setMarbleOctaves, setMarbleSpeed, setMarbleTurbulence,
    setMarbleVeinFreq, setMasterSensitivity, setMetaballCount, setMetaballSize, setMetaballSpeed, setMirrorMode,
    setMirrorTileCount, setNoiseDirection, setNoiseOctaves,
    setNoiseScale, setPaletteBeatEnabled, setPinchStrength, setPixelSize,
    setPolygon2Sides, setPosterizeLevels, setRadialBurstCount,
    setRadialBurstSize, setRadialBurstSpread, setRotationDirection,
    setSepiaIntensity, setShakeBeatEnabled, setShapesCount, setShapesSpeed, setShapesMode,
    setTurrellSpeed, setTurrellGlow,
    setStackCount, setStackGap, setStackWidth, setStackLength, setStackResponse, setStackSpeed,
    setHatchLayers, setHatchSpacing, setHatchResponse, setHatchSpeed,
    setShapesSides, setShowRatingUI, setSolarizeThreshold, setWindmillRotations, setWindmillThickness, setWindmillTightness,
    setWindmillZoom, setSubBassBeatSync, setSubBassMultiplier, setSubmittedAIPrompt, setTargetAngle, setTargetColors, setTargetZoom, setTriangleSize,
    setAudioBindings,
    setTrebleBeatSync, setTrebleMultiplier,
    setTruchetSize, setTruchetThickness, setTruchetSpeed, setTruchetVariation, setTwistAmount, setVcrPlaybackSpeed, setVhsGlitchIntensity, setVhsJitterAmount, setVignetteStrength,
    setVoronoiCellCount, setVoronoiDistortion, setVoronoiSpeed, setWaveDistortionStrength,
    setZoom, setZoomBeatEnabled, windmillTightness, twistAmount, vignetteStrength,
    zoom,
    setAuraGlowCount, setAuraGlowSpeed, setAuraGlowOpacity,
    setWindmillMode, setWindmillZoomResponse, setFadeMode, setParticlesMode, 
    setAngleHardEdge, setGridHardEdge, setRadialHardEdge,
    setStructuralSeed, setLavaSpeed, setFlowerRotation, setFlowerSymmetry, setFlowerOpacity, setFlowerSpeed,
    setTriangulateVariation, setEmojiOffsetX,
  });

  // Full shuffles are checked for washed-out results and re-rolled (see useShuffleQualityGate).
  // Putting back the best look a shuffle tried: the saved values, with the refs the draw loop reads set to match so
  // nothing eases in from the look it just drew.
  const applyShuffleCandidate = (snap: Snapshot) => {
    applySnapshot(snap);
    if (snap.gradientColors) gradientColorsRef.current = snap.gradientColors.map(c => ({ ...c }));
    if (snap.gradientAngle !== undefined) gradientAngleRef.current = snap.gradientAngle;
    if (snap.zoom !== undefined) zoomRef.current = snap.zoom;
  };
  const evolveWithFactor = useShuffleQualityGate({ evolve: evolveRaw, canvasRef, gradientTypeRef, targetColorsRef, getSnapshot: () => buildSnapshot(), applyCandidate: applyShuffleCandidate, undoStackRef, undoIndexRef, setUndoDepth, getSpeed: () => vcrPlaybackSpeedRef.current });

  // Shuffle click handler — single click = full remix, shared by both the
  // collapsed-cluster button and the expanded panel's tab-row shuffle
  // button (they're mutually exclusive: only one is ever interactive at a
  // time since the other is opacity-0/pointer-events-none).
  const [isWavPressed, setIsWavPressed] = useState(false);
  const handleWavClick = () => {
    dismissWavHint();
    evolveWithFactor(1);
    setIsWavPressed(true);
    window.setTimeout(() => setIsWavPressed(false), 200);
  };

  const {
    isAutoShuffleOn, setIsAutoShuffleOn, isNewPresetPending, setIsNewPresetPending,
    autoShuffleIntervalSec, setAutoShuffleIntervalSec, autoShuffleScope, setAutoShuffleScope,
    isAutoShuffleOnRef,
  } = useAutoShuffle({
    shuffleGradientType, randomizeEffects, randomColor, saveCurrentState, setTargetColors,
    gradientColorsRef, evolveWithFactor,
  });
  // While Auto Shuffle changes the look on a timer, leaving a look alone says nothing about it.
  shuffleLearning.paused = isAutoShuffleOn;
  const {
    exportSize, setExportSize, exportAspect, setExportAspect,
    copiedKey, copyText, currentPlayerUrl,
    savePreview, setSavePreview, exportAsPNG, saveWallpaper,
    startVideoTake,
  } = useExportControls({
    canvasRef, drawParamsDirtyRef, buildSnapshot, isRecording, toggleVCRRecording,
  });
  // Clicking the Auto Shuffle button opens this popover (on/off toggle +
  // interval slider) instead of directly toggling on/off — the interval
  // control used to live only in the Info panel, which turned out to be too
  // hard to find from the button itself.
  //
  // Rendered through a portal into document.body with position:fixed,
  // anchored to the trigger button's live getBoundingClientRect() — NOT
  // positioned relative to the button in normal flow. The button lives
  // inside the panel's `overflow-y-auto` scroll container, and Chrome
  // forces overflow-x to `auto` (clipping) whenever overflow-y is
  // non-visible and overflow-x isn't set explicitly (CSS2.1 overflow
  // rules) — a relatively-positioned popover wide enough to extend past
  // that container's right edge got silently clipped there, even though it
  // still measured a correct (uncl clipped) getBoundingClientRect and had
  // fully correct computed styles. document.elementFromPoint() at the
  // popover's own reported coordinates returned the background canvas
  // instead of the popover, confirming it wasn't clipping-adjacent content
  // but a real "present in the layout, absent from the painted/hit-tested
  // page" case — a portal sidesteps the whole ancestor-clipping chain.
  const { popoverMode, autoShufflePopoverAnchor, setAutoShufflePopoverAnchor, autoShufflePopoverRef, openAutoShufflePopover, openExportPopover, openAboutPanel } = usePopoutAnchor({ panelRef, isMobile, activeTab, setActiveTab, setIsAboutOpen });
  // Undo to previous state (up to 10 levels)
  // Apply a snapshot's values to live state (shared by undo and redo)

  const { toggleDisplayWindow } = useDisplaySync({
    applySnapshot, buildSnapshot, animValuesRef, gradientColorsRef, halftoneTimeRef, reactionDiffusionGridRef,
    lastBroadcastSnapshotRef, syncChannelRef, animSyncChannelRef, setIsDisplayLinkCopied,
  });

  const { gestureActionsRef, goBack, goForward, motionDenied, resetToDefaults, shakeEnabled, tiltEnabled, toggleMotion } = useGestureActions({ applySnapshot, evolveWithFactor, isControlsVisible, redoLastChange, redoStackRef, setAIPrompt, setActiveTab, setIsAutoColor, setIsControlsVisible, setIsMultiFxMode, setTargetAngle, targetAngleRef, toggleVCRPlayback, undoIndexRef, undoLastChange });

  // Capture current state for rating. Rides on buildSnapshot (the same
  // comprehensive, actively-maintained source of truth used by undo/redo)
  // rather than a hand-picked field list, which used to drift out of sync
  // with new sliders (e.g. every effect added this session was missing here).
  const captureCurrentStateForRating = useCallback(() => {
    setPendingRatingState({
      ...buildSnapshot(),
      audioWasActive: isAudioEnabled && isAudioReactive,
    });
  }, [buildSnapshot, isAudioEnabled, isAudioReactive]);
  
  
  
  // Capture state when rating UI is shown (fallback if not already captured)
  useEffect(() => {
    if (showRatingUI && !pendingRatingState) {
      captureCurrentStateForRating();
    }
  }, [showRatingUI, pendingRatingState, captureCurrentStateForRating]);


  // Helper function to add color stops to gradient with optional hue shift
  const addGradientStops = useCallback((gradient: CanvasGradient, colors: ColorRGB[], hardEdge?: boolean) => {
    addGradientStopsTo(gradient, colors, hardEdge, isAudioEnabled && isAudioReactive ? audioTrebleLevel : 0);
  }, [isAudioEnabled, isAudioReactive, audioTrebleLevel]);

  useBeatEffects({ isAudioEnabled, isAudioReactive, contrastBeatEnabled, canvasRef, contrastPulseRef, saturationPulseRef, audioSubBassLevel, shakeBeatEnabled, subBassOnsetTick, shakeWrapperRef, shakeRef, paletteBeatEnabled, bassOnsetTick, gradientColors, setGradientColors, setTargetColors, audioEnergy, musicIntensityRef, lastReseedTimeRef, setStructuralSeed });

  // Generate colors from AI prompt
  const generateAIColors = useCallback((prompt: string) => generateAIColorsFor(prompt, gradientColors.length, adjustColorArrayLength, randomColor), [gradientColors, adjustColorArrayLength, randomColor]);

  // useCallback so ColorTab (React.memo'd) doesn't lose its memoization —
  // this was previously a plain function recreated every render, which
  // meant ColorTab re-rendered on every parent render regardless of memo.
  const handleAIPromptSubmit = useCallback(() => {
    if (!aiPrompt.trim()) return;

    const newColors = generateAIColors(aiPrompt);
    setTargetColors(newColors);
    setBaseAIColors(newColors); // Store as base colors to anchor future changes
    setSubmittedAIPrompt(aiPrompt); // Save the submitted prompt
    setIsAIColorPickerOpen(false); // Close dropdown instead of modal
    setAIPrompt('');
  }, [aiPrompt, generateAIColors, setTargetColors, setBaseAIColors, setSubmittedAIPrompt, setIsAIColorPickerOpen, setAIPrompt]);

  useAutoColor({ isAutoColor, gradientType, gradientColors, setTargetColors, baseAIColors });

  // Gradient AUTO PLAY — stop any active recording/VCR playback when Auto Play starts.
  // The actual rotation now happens every frame inside the master RAF loop (see
  // isAutoModeRef check there) instead of a chunked setInterval, for smooth motion.
  useEffect(() => {
    if (!isAutoMode) return;
    setIsVCRRecording(false);
    setIsVCRPlaying(false);
  }, [isAutoMode]);

  // Collapse all drawing-relevant state into one memoized object so the drawing
  // useEffect only does a single reference comparison per render instead of 150+.
  const drawParams = useMemo(() => ({
    resolutionMultiplier, gradientType, activeEffects,
    kaleidoscopeSegments, kaleidoscopeRotateSpeed, twistAmount, pixelSize, triangleSize, triangulateVariation, chromaticOffset, 
    grainIntensity, grainType, grainSize, gessoWhiteness, gessoTexture, gessoResponse, blurMotionAmount, blurGaussianAmount, blurRadialAmount,
    blurMotionDirection, blurType, posterizeLevels, halftoneSize, halftoneVariation, halftoneMove,
    halftoneMoveSpeed, halftoneCMYK, bloomIntensity, bloomRadius, feedbackDecay, feedbackZoom, feedbackRotation, vignetteStrength, colorShiftHue, pinchStrength, hexGridSize, linesCount, linesAngle, linesThickness,
    dustCrackleColor, dustCrackleIntensity, dustCrackleLength, vhsGlitchIntensity, vhsJitterAmount, waveDistortionStrength,
    // crtIntensity was previously passed to useCanvasDraw's call directly
    // but never included here — since useCanvasDraw's whole drawRef
    // closure only rebuilds when THIS memo's reference changes (see its
    // dependency array below), that meant the Cathode Intensity slider's
    // value was effectively frozen at whatever it was the last time some
    // OTHER param happened to trigger a rebuild, not live-updating on its
    // own drag. Fixed here alongside adding crtScanlineSpacing so the new
    // slider doesn't inherit the same bug.
    crtIntensity, crtScanlineSpacing,
    waveDistortionRotation, liquifyStrength, sepiaIntensity, solarizeThreshold,
    lightLeakIntensity, duotoneIntensity, duotoneColor1, duotoneColor2, duotoneColor3, duotoneThreeColor,
    digitalNoiseIntensity, gridRotation, gridRows, gridColumns, gridShapeSize, gridCellAngleStep,
    gridVariation, gridHardEdge, angleStartOffset, angleCenterX, angleCenterY, angleHardEdge, windmillTightness, windmillRotations,
    windmillThickness, windmillZoom, windmillZoomResponse, windmillMode, shapesSides, shapesCount, shapesSpeed, shapesMode, concentricRingWidth, concentricRingCount,
    fadeMode, turrellAnimTime, turrellSpeed, turrellGlow,
    stackCount, stackGap, stackWidth, stackLength, stackResponse, stackSpeed, hatchLayers, hatchSpacing, hatchResponse, hatchAnimTime, hatchSpeed,
    radialSizeScale, radialHardEdge, radialAnimTime, radialSpeed, noiseScale, noiseOctaves, noiseWarp, noiseType, noiseAnimTime, noiseSpeed,
    radialBurstCount, radialBurstSpread, radialBurstSize, voronoiCellCount, voronoiDistortion,
    voronoiAnimTime, helixTurns, helixTightness,
    
    flowerCircles, flowerScale, flowerSpread, flowerRotation, flowerSymmetry, flowerOpacity, flowerSpeed, flowerAnimTime,
    auroraAnimTime, auroraBandCount, auroraWaveSpeed, auroraBandHeight,
    causticsAnimTime, causticsBrightness, causticsScale, causticsSpeed,
    lavaAnimTime, lavaBlobCount, lavaBlobSize, lavaSpeed,
    marbleAnimTime, marbleVeinFreq, marbleTurbulence, marbleOctaves, marbleSpeed,
    noiseDirection,
    ditherType, ditherLevels, ditherScale, oilPaintRadius, oilPaintLevels, impastoStrength, impastoLightAngle, watercolorBleed, watercolorGrain, watercolorStyle, dadaPanels, dadaChaos, slitScanIntensity, slitScanDirection, slitScanHistory, slitScanSpeed, crtSpeed, ditherSpeed, dadaSpeed, asciiSpeed, watercolorSpeed, impastoSpeed, gridEffectSpeed, liquidSpeed,
    auraGlowCount, auraGlowSpeed, auraGlowOpacity,
    // audioSubBassLevel/audioMidsLevel/audioTrebleLevel/audioEnergy kept here
    // for shape/type completeness but deliberately dropped from this memo's
    // dependency array below (same treatment as auroraAnimTime and the other
    // anim-time clocks above) — they're driven by the audio-analysis loop at
    // ~60fps, and useCanvasDraw.ts reads the live value straight from
    // animValuesRef instead (mirrored into it a few lines below this memo),
    // overriding this stale copy. Including them in the deps used to rebuild
    // useCanvasDraw's entire ~500-line drawRef closure on every single audio
    // tick, 60x/sec, whenever audio was on — by far the largest source of
    // per-frame overhead in the app.
    addGradientStops, isAudioEnabled, isAudioReactive, audioSubBassLevel,
    audioMidsLevel, audioTrebleLevel, audioEnergy, audioBindings,
    fieldContrast, paletteMode, fieldScale, fieldSpeed, fieldShapeA, fieldShapeB, fieldSwirl, paletteStops, paletteBias, paletteSharp, paletteBands, invertAmount, attractorTrailFade, structuralSeed,
    depthLayerEnabled, depthLayerStrength,
    waveInterferenceAnimTime, waveInterferenceSourceCount, waveInterferenceFrequency, waveInterferenceSpeed,
    meshWireframeAnimTime, meshWireframeGridSize, meshWireframeJitter, meshWireframeLineWidth,
  }), [resolutionMultiplier, gradientType, activeEffects, kaleidoscopeSegments, kaleidoscopeRotateSpeed, twistAmount, pixelSize, triangleSize, triangulateVariation, chromaticOffset, grainIntensity, grainType, grainSize, gessoWhiteness, gessoTexture, gessoResponse, blurMotionAmount, blurGaussianAmount, blurRadialAmount, blurMotionDirection, blurType, posterizeLevels, halftoneSize, halftoneVariation, halftoneMove, halftoneMoveSpeed, halftoneCMYK, bloomIntensity, bloomRadius, feedbackDecay, feedbackZoom, feedbackRotation, vignetteStrength, colorShiftHue, pinchStrength, hexGridSize, linesCount, linesAngle, linesThickness, dustCrackleColor, dustCrackleIntensity, dustCrackleLength, vhsGlitchIntensity, vhsJitterAmount, crtIntensity, crtScanlineSpacing, waveDistortionStrength, waveDistortionRotation, liquifyStrength, sepiaIntensity, solarizeThreshold, lightLeakIntensity, duotoneIntensity, duotoneColor1, duotoneColor2, duotoneColor3, duotoneThreeColor, digitalNoiseIntensity, gridRotation, gridRows, gridColumns, gridShapeSize, gridCellAngleStep, gridVariation, gridHardEdge, angleStartOffset, angleCenterX, angleCenterY, angleHardEdge, windmillTightness, windmillRotations, windmillThickness, windmillZoom, windmillZoomResponse, windmillMode, shapesSides, shapesCount, shapesMode, concentricRingWidth, concentricRingCount, turrellSpeed, turrellGlow, stackCount, stackGap, stackWidth, stackLength, stackResponse, hatchLayers, hatchSpacing, hatchResponse, hatchSpeed, polygon2Sides, radialSizeScale, radialHardEdge, radialSpeed, noiseScale, noiseOctaves, noiseWarp, noiseType, noiseSpeed, radialBurstCount, radialBurstSpread, radialBurstSize, voronoiCellCount, voronoiDistortion, helixTurns, helixTightness, flowerCircles, flowerScale, flowerSpread, flowerRotation, flowerSymmetry, flowerOpacity, auroraBandCount, auroraWaveSpeed, auroraBandHeight, causticsBrightness, causticsScale, lavaBlobCount, lavaBlobSize, lavaSpeed, marbleVeinFreq, marbleTurbulence, marbleOctaves, noiseDirection, ditherType, ditherLevels, ditherScale, oilPaintRadius, oilPaintLevels, impastoStrength, impastoLightAngle, watercolorBleed, watercolorGrain, watercolorStyle, dadaPanels, dadaChaos, slitScanIntensity, slitScanDirection, slitScanHistory, slitScanSpeed, crtSpeed, ditherSpeed, dadaSpeed, asciiSpeed, watercolorSpeed, impastoSpeed, gridEffectSpeed, liquidSpeed, addGradientStops, isAudioEnabled, isAudioReactive, fadeDirection, fadeMode, chromaticAngle, vignetteSoftness, mirrorMode, mirrorTileCount, metaballCount, metaballSize, metaballSpeed, truchetSize, truchetVariation, truchetThickness, flowParticleCount, flowSpeed, flowScale, flowThickness, attractorPointCount, attractorSpeed, attractorScale, attractorDotSize, particlesCount, particlesSpeed, particlesSize, particlesTrail, particlesGravity, particlesSides, particlesMode, marksCount, marksSize, marksDecay, tilingSize, tilingSymmetry, tilingComplexity, tilingRotation, tilingAnimTime, tilingRowOffset, waveInterferenceAnimTime, waveInterferenceSourceCount, waveInterferenceFrequency, waveInterferenceSpeed, meshWireframeAnimTime, meshWireframeGridSize, meshWireframeJitter, meshWireframeLineWidth, fireworksCount, fireworksParticleCount, fireworksTrailFade, lightningBoltCount, lightningJitter, lightningBranchiness, reactionDiffusionFeed, reactionDiffusionKill, reactionDiffusionSpeed, topographicScale, topographicBands, topographicLineWidth, juliaReal, juliaImaginary, juliaZoom, juliaIterations, auraGlowCount, auraGlowSpeed, auraGlowOpacity, asciiSize, asciiColor, asciiChars, emojiSize, emojiChars, emojiRotateSpeed, liquidStrength, liquidScale, chromaticTrailsDecay, chromaticTrailsOffset, fieldContrast, paletteMode, fieldScale, fieldSpeed, fieldShapeA, fieldShapeB, fieldSwirl, paletteStops, paletteBias, paletteSharp, paletteBands, invertAmount, attractorTrailFade, structuralSeed, audioBindings, photoVersion, photoBlendMode, photoOpacity, depthLayerEnabled, depthLayerStrength]);

// Flow Field's canvas is a persistent low-alpha trail buffer, not a full
  // repaint each frame — unlike every other gradient, a single dirty frame
  // (all that fires while paused) only adds one faint short segment per
  // particle on top of everything already drawn at the OLD scale, so the
  // slider read as "doesn't work" unless you sat and watched Play run for
  // several seconds while the old trails faded out. Clearing the buffer
  // whenever Scale changes makes the new value visible immediately, even
  // from a single paused-state frame.
  useEffect(() => {
    if (!flowBufferRef.current) return;
    const fbCtx = flowBufferRef.current.getContext('2d');
    fbCtx?.clearRect(0, 0, flowBufferRef.current.width, flowBufferRef.current.height);
    drawParamsDirtyRef.current = true;
  }, [flowScale]);

  // Same "clear the trail buffer on Scale change" fix as Flow Field above —
  // otherwise a new Scale value only shows up in newly-drawn segments while
  // old, differently-scaled trails linger until they fade out on their own.
  useEffect(() => {
    if (!attractorBufferRef.current) return;
    const abCtx = attractorBufferRef.current.getContext('2d');
    abCtx?.clearRect(0, 0, attractorBufferRef.current.width, attractorBufferRef.current.height);
    drawParamsDirtyRef.current = true;
  }, [attractorScale]);

  // Canvas draw pipeline extracted to useCanvasDraw.ts (splitting-plan
  // step 4 — the final and highest-risk extraction, ~3,000 lines covering
  // every gradient type and effect's rendering code). The drawParams
  // useMemo above stays here and is passed straight through so the
  // hook's internal useEffect depends on it exactly as before extraction.
  useCanvasDraw({
    isMobile,
    activeEffects, addGradientStops, angleCenterX, angleCenterY, angleStartOffset, angleHardEdge, asciiChars,
    asciiColor, asciiSize, attractorBufferRef, attractorPointCount, attractorPointsRef,
    particlesBufferRef, particlesPointsRef, particlesCount, particlesSpeed, particlesSize, particlesTrail, particlesGravity, particlesSides, particlesMode,
    marksCount, marksSize, marksDecay, marksStateRef,
    fadeMode, turrellSpeed, turrellGlow, turrellSmoothRef,
    stackCount, stackGap, stackWidth, stackLength, stackResponse, stackSpeed, hatchLayers, hatchSpacing, hatchResponse, hatchSpeed,
    tilingSize, tilingSymmetry, tilingComplexity, tilingRotation, tilingAnimTime, tilingRowOffset,
    waveInterferenceAnimTime, waveInterferenceSourceCount, waveInterferenceFrequency, waveInterferenceSpeed,
    meshWireframeAnimTime, meshWireframeGridSize, meshWireframeJitter, meshWireframeLineWidth,
    fireworksBufferRef, fireworksParticlesRef, fireworksCount, fireworksParticleCount, fireworksTrailFade,
    lightningBufferRef, lightningBoltsRef, lightningBoltCount, lightningJitter, lightningBranchiness,
    attractorScale, attractorDotSize, audioMidsLevel, audioSubBassLevel, audioTrebleLevel, audioEnergy, audioBindings, musicIntensityRef, masterSensitivity, animValuesRef,
    auroraBandCount, auroraBandHeight, auroraWaveSpeed, bassThreshold, bloomIntensity, bloomRadius,
    blurGaussianAmount, blurMotionAmount, blurMotionDirection, blurRadialAmount, blurType, canvasRef,
    causticsBrightness, causticsScale, causticsSpeed, chromaticAngle, chromaticOffset,
    chromaticTrailsBufferRef, chromaticTrailsDecay, chromaticTrailsOffset, colorShiftHue,
    concentricRingCount,
    concentricRingWidth, helixTightness, helixTurns, ditherLevels, ditherType, ditherScale, oilPaintRadius, oilPaintLevels, impastoStrength, impastoLightAngle, watercolorBleed, watercolorGrain, watercolorStyle, dadaPanels, dadaChaos, drawParams,
    auraGlowCount, auraGlowSpeed, auraGlowOpacity,
    fieldContrast, paletteMode, fieldScale, fieldSpeed, fieldShapeA, fieldShapeB, fieldSwirl, paletteStops, paletteBias, paletteSharp, paletteBands, invertAmount, attractorTrailFade, structuralSeed,
    depthLayerEnabled, depthLayerStrength,
    drawParamsDirtyRef, drawRef, duotoneColor1, duotoneColor2, duotoneColor3, duotoneIntensity,
    duotoneThreeColor, dustCrackleColor, dustCrackleIntensity, dustCrackleLength, emojiChars, emojiOffsetX, emojiSize,
    emojiSizeVariation, fadeDirection, feedbackBufferRef, feedbackDecay, feedbackRotation, feedbackZoom,
    flowBufferRef, flowParticleCount,
    flowParticlesRef, flowScale, flowThickness, flowerCircles, flowerRotation, flowerSymmetry, flowerOpacity, flowerSpeed,
    flowerScale, flowerSpread,
    gradientAngle, gradientAngleRef, gradientColors, gradientColorsRef,
    gradientType, grainIntensity, grainType, grainSize, gessoWhiteness, gessoTexture, gessoResponse, gridCellAngleStep, gridColumns, gridRotation, gridRows, gridHardEdge,
    gridShapeSize, gridSides, gridVariation, halftoneCMYK, halftoneMove, halftoneSize,
    halftoneTimeRef, halftoneVariation, isAudioEnabled,
    isAudioReactive, isAutoModeRef, isVCRPlayingRef, kaleidoAngleRef, kaleidoscopeRotateSpeed, kaleidoscopeSegments,
    lavaBlobCount, lavaBlobSize, lavaSpeed,
    liquidScale,
    liquidStrength, crtIntensity, crtScanlineSpacing, marbleOctaves, marbleSpeed, marbleTurbulence, marbleVeinFreq,
    metaballCount, metaballSize, mirrorMode, mirrorTileCount,
    noiseDirection, noiseOctaves, noiseScale, noiseSpeed, attractorSpeed, emojiRotateSpeed, flowSpeed, metaballSpeed,
    noiseType, noiseWarp, photoBlendMode, photoImageRef, photoOpacity, pixelSize,
    polygon2Sides, posterizeLevels,
    radialBurstCount, radialBurstSize, radialBurstSpread,
    radialSizeScale, radialHardEdge, radialSpeed, reactionDiffusionFeed, reactionDiffusionGridRef, reactionDiffusionKill, reactionDiffusionSpeed,
    resolutionMultiplier,
    shapesCount, shapesSpeed, shapesSides, shapesMode, slitScanBufferRef, slitScanDirection,
    slitScanIntensity, slitScanHistory, slitScanSpeed, crtSpeed, ditherSpeed, dadaSpeed, asciiSpeed, watercolorSpeed, impastoSpeed, gridEffectSpeed, liquidSpeed, halftoneMoveSpeed,
    windmillRotations, windmillThickness, windmillTightness, windmillZoom, windmillZoomResponse, windmillMode, triangleSize, triangulateVariation,
    topographicBands, topographicLineWidth, topographicScale,
    juliaReal, juliaImaginary, juliaZoom, juliaIterations, juliaSpeed, juliaCanvasRef,
    truchetSize, truchetThickness, truchetSpeed, truchetVariation, vhsGlitchIntensity, vhsJitterAmount, vignetteSoftness, vignetteStrength,
    voronoiCellCount, voronoiDistortion, voronoiSpeed, waveDistortionRotation, waveDistortionStrength,
    zoom, zoomRef,
  });



  const { handleMouseDown, handleMouseMove, handleMouseUp, handleTouchCancel, handleTouchEnd, handleTouchMove, handleTouchStart, handleWheel } = useCanvasPointer({ activeTab, baseAIColors, canvasRef, exportAsPNG, gestureActionsRef, gradientColors, gradientType, isAutoMode, isDragging, lastChangeTime, lastManualZoomTime, particlesMode, previousPosition, randomColor, setActiveTab, setIsDragging, setTargetAngle, setTargetColors, setTargetZoom, targetAngleRef, targetColorsRef, targetZoomRef });

  // Export animated GIF
  const { isRecordingGif, isFinalizingGif, toggleGifRecording, gifResult, clearGifResult } = useGifExport({ canvasRef });

  // startRecording/stopRecording/toggleVCRRecording/toggleVCRPlayback/handleStop are now in useVCRPlayback hook

  useFullscreenSync({ containerRef, setIsFullscreen });

  useGlobalHotkeys({ shuffleAudiovisuals, gradientTypeRef, undoLastChange, redoLastChange, shuffleGradientType, randomizeEffects, setActiveTab, setIsControlsVisible, exportAsPNG: saveWallpaper, resetToDefaults, toggleVCRRecording: startVideoTake, toggleVCRPlayback, setVcrPlaybackSpeed, setRotationDirection, evolveWithFactor, setIsMultiFxMode, isAboutOpen, setIsAboutOpen, activeTab, isControlsVisible, toggleDisplayWindow, setIsAutoShuffleOn, toggleGifRecording, autoShufflePopoverAnchor, setAutoShufflePopoverAnchor, applyGradientLook, goBack, goForward });

  useDrawerTouchScroll({ activeTab, drawerRef, isMobile });

  // Load-in reveal — canvas starts invisible and fades in shortly after
  // mount instead of popping in fully-formed the instant the first frame is
  // ready. The double-rAF defers flipping to true until after the initial
  // opacity:0 state has actually painted, so the browser doesn't collapse
  // the 0→1 change into the very first paint (which would make the CSS
  // transition invisible — a well-known gotcha with transition-on-mount).
  const [hasRevealed, setHasRevealed] = useState(false);
  const revealFrameRef = useRef<number>(0);
  useEffect(() => {
    const id1 = requestAnimationFrame(() => {
      const id2 = requestAnimationFrame(() => setHasRevealed(true));
      revealFrameRef.current = id2;
    });
    revealFrameRef.current = id1;
    return () => cancelAnimationFrame(revealFrameRef.current);
  }, []);

  // touchAction intentionally NOT set on the root container below (was
  // 'none') — per the CSS touch-action spec, the effective touch-action for
  // a touch gesture is the INTERSECTION of the hit element's value and every
  // ancestor's, not a simple override. With 'none' on this root, no
  // descendant — no matter what touch-action it declared — could ever get
  // real touch gestures, which is why the control panel's own pan-y override
  // never actually restored scrolling. The canvas below already sets its own
  // touchAction:'none' independently, which is the one that actually needs
  // to block gestures for drag-to-rotate, so removing it here loses nothing.

  // The union of every prop ColorTab/GradientsTab/EffectsTab/PresetsPanel
  // need, merged into one object and handed to ControlDrawer, which passes
  // it through to whichever tab is actually open. Safe to merge flat like
  // this — every key here is a local variable/function from this
  // component's own scope, so two tabs referencing the same name (e.g.
  // gridRows, used by both Gradients and Effects) are always the same
  // value, never a collision.
  const controlDrawerTabProps = {
    effectSpeeds, setEffectSpeed,
    gridEffectSpeed, setGridEffectSpeed, liquidSpeed, setLiquidSpeed, halftoneMoveSpeed, setHalftoneMoveSpeed,
    // Color
    isAutoColor, setIsAutoColor, saveCurrentState, setTargetColors, gradientColors, randomColor, applyGradientLook, applyPalette, shuffleColors, keepFamily, setKeepFamily, structuralSeed, setStructuralSeed,
    submittedAIPrompt, setSubmittedAIPrompt, setBaseAIColors, setGradientColors, setColorsInstant, aiPrompt, setAIPrompt,
    isKeywordHelpOpen, setIsKeywordHelpOpen, handleAIPromptSubmit, setIsAIColorPickerOpen,
    // Gradients
    gradientType, setGradientType, getGradientDisplayName, shuffleGradientType, gridRows, setGridRows, gridColumns, setGridColumns,
    gridCellAngleStep, setGridCellAngleStep, gridHardEdge, setGridHardEdge, polygon2Sides, setPolygon2Sides, concentricRingCount, setConcentricRingCount,
    auroraBandCount, setAuroraBandCount, auroraBandHeight, setAuroraBandHeight, auroraWaveSpeed, setAuroraWaveSpeed,
    causticsBrightness, setCausticsBrightness, causticsScale, causticsSpeed, setCausticsScale, setCausticsSpeed, lavaBlobCount, setLavaBlobCount,
    lavaBlobSize, setLavaBlobSize, lavaSpeed, setLavaSpeed, rotationDirection, setRotationDirection, marbleVeinFreq, setMarbleVeinFreq, marbleTurbulence, setMarbleTurbulence,
    marbleOctaves, marbleSpeed, setMarbleOctaves, setMarbleSpeed, metaballCount, setMetaballCount, metaballSize, setMetaballSize,
    metaballSpeed, setMetaballSpeed, truchetSize, setTruchetSize, truchetVariation, setTruchetVariation,
    truchetThickness, truchetSpeed, setTruchetThickness, setTruchetSpeed,
    flowParticleCount, setFlowParticleCount, flowSpeed, setFlowSpeed,
    flowScale, setFlowScale, flowThickness, setFlowThickness, attractorPointCount, setAttractorPointCount,
    attractorSpeed, setAttractorSpeed, attractorScale, setAttractorScale, attractorDotSize, setAttractorDotSize,
    attractorTrailFade, setAttractorTrailFade, particlesCount, setParticlesCount, particlesSpeed, setParticlesSpeed,
    particlesSize, setParticlesSize, particlesTrail, setParticlesTrail, particlesGravity, setParticlesGravity,
    particlesSides, setParticlesSides, particlesMode, setParticlesMode,
    marksCount, setMarksCount, marksSize, setMarksSize, marksDecay, setMarksDecay,
    tilingSize, setTilingSize, tilingSymmetry, setTilingSymmetry,
    tilingComplexity, setTilingComplexity, tilingRotation, setTilingRotation, tilingRowOffset, setTilingRowOffset,
    fireworksCount, setFireworksCount, fireworksParticleCount, setFireworksParticleCount, fireworksTrailFade, setFireworksTrailFade,
    lightningBoltCount, setLightningBoltCount, lightningJitter, setLightningJitter, lightningBranchiness, setLightningBranchiness,
    reactionDiffusionFeed, setReactionDiffusionFeed, reactionDiffusionKill, setReactionDiffusionKill, reactionDiffusionSpeed, setReactionDiffusionSpeed,
    fieldContrast, setFieldContrast, paletteMode, setPaletteMode, fieldScale, fieldSpeed, vcrPlaybackSpeed, setVcrPlaybackSpeed, fieldShapeA, fieldShapeB, fieldSwirl, paletteStops, paletteBias, paletteSharp, setFieldScale, setFieldSpeed, setFieldShapeA, setFieldShapeB, setFieldSwirl, setPaletteStops, setPaletteBias, setPaletteSharp, paletteBands, setPaletteBands,
    topographicScale, setTopographicScale, topographicBands, setTopographicBands, topographicLineWidth, setTopographicLineWidth,
    waveInterferenceSourceCount, setWaveInterferenceSourceCount, waveInterferenceFrequency, setWaveInterferenceFrequency, waveInterferenceSpeed, setWaveInterferenceSpeed,
    meshWireframeGridSize, setMeshWireframeGridSize, meshWireframeJitter, setMeshWireframeJitter, meshWireframeLineWidth, setMeshWireframeLineWidth,
    juliaReal, setJuliaReal, juliaImaginary, setJuliaImaginary, juliaZoom, setJuliaZoom, juliaIterations, juliaSpeed, setJuliaIterations, setJuliaSpeed,
    angleStartOffset, setAngleStartOffset, angleCenterX, setAngleCenterX, angleCenterY, setAngleCenterY, angleHardEdge, setAngleHardEdge,
    radialSizeScale, setRadialSizeScale, radialHardEdge, setRadialHardEdge, radialSpeed, setRadialSpeed, concentricRingWidth, setConcentricRingWidth, shapesSides, setShapesSides,
    shapesCount, shapesSpeed, setShapesCount, setShapesSpeed, shapesMode, setShapesMode, windmillTightness, setWindmillTightness, windmillRotations, setWindmillRotations,
    fadeMode, setFadeMode, turrellSpeed, setTurrellSpeed, turrellGlow, setTurrellGlow,
    stackCount, setStackCount, stackGap, setStackGap, stackWidth, setStackWidth, stackLength, setStackLength, stackResponse, stackSpeed, setStackResponse, setStackSpeed,
    hatchLayers, setHatchLayers, hatchSpacing, setHatchSpacing, hatchResponse, setHatchResponse, hatchSpeed, setHatchSpeed,
    windmillThickness, setWindmillThickness, windmillZoomResponse, windmillMode, setWindmillMode, setWindmillZoomResponse,
    drawParamsDirtyRef, noiseScale, setNoiseScale, noiseOctaves, setNoiseOctaves, noiseDirection, setNoiseDirection,
    noiseWarp, setNoiseWarp, noiseType, setNoiseType, noiseSpeed, setNoiseSpeed,
    radialBurstCount, setRadialBurstCount, radialBurstSpread, setRadialBurstSpread, radialBurstSize, setRadialBurstSize,
    voronoiCellCount, setVoronoiCellCount, voronoiDistortion, voronoiSpeed, setVoronoiDistortion, setVoronoiSpeed,
    fadeDirection, setFadeDirection, 
    flowerCircles, setFlowerCircles, flowerScale, setFlowerScale, flowerSpread, setFlowerSpread,
    flowerSymmetry, setFlowerSymmetry, flowerOpacity, flowerSpeed, setFlowerOpacity, setFlowerSpeed, helixTurns, setHelixTurns, helixTightness, setHelixTightness,
    // Effects (isMobile, gridRows/gridColumns, crtIntensity/crtScanlineSpacing
    // etc. overlap with names above — same variables, harmless to repeat)
    activeEffects, setActiveEffects, isMultiFxMode, setIsMultiFxMode, collapsedEffects, toggleEffectCollapsed, randomizeEffects,
    kaleidoscopeSegments, setKaleidoscopeSegments, kaleidoscopeRotateSpeed, setKaleidoscopeRotateSpeed,
    asciiSize, setAsciiSize, asciiChars, setAsciiChars, asciiColor, setAsciiColor,
    emojiChars, setEmojiChars, emojiSize, setEmojiSize, emojiRotateSpeed, setEmojiRotateSpeed,
    emojiSizeVariation, setEmojiSizeVariation, emojiOffsetX, setEmojiOffsetX,
    isEmojiPickerOpen, setIsEmojiPickerOpen, emojiPickerSearch, setEmojiPickerSearch,
    liquidStrength, crtIntensity, setCrtIntensity, crtScanlineSpacing, setCrtScanlineSpacing,
    setLiquidStrength, liquidScale, setLiquidScale, handlePhotoFileClick, photoFileName,
    photoBlendMode, setPhotoBlendMode, photoOpacity, setPhotoOpacity,
    chromaticTrailsDecay, setChromaticTrailsDecay, chromaticTrailsOffset, setChromaticTrailsOffset,
    pixelSize, setPixelSize, triangleSize, triangulateVariation, setTriangulateVariation, setTriangleSize,
    chromaticOffset, setChromaticOffset, chromaticAngle, setChromaticAngle,
    bloomIntensity, setBloomIntensity, bloomRadius, setBloomRadius,
    feedbackDecay, setFeedbackDecay, feedbackZoom, setFeedbackZoom, feedbackRotation, setFeedbackRotation,
    mirrorMode, setMirrorMode, mirrorTileCount, setMirrorTileCount,
    vignetteStrength, setVignetteStrength, vignetteSoftness, setVignetteSoftness,
    colorShiftHue, setColorShiftHue, grainIntensity, setGrainIntensity, grainSize, setGrainSize, grainType, setGrainType,
    gessoWhiteness, setGessoWhiteness, gessoTexture, setGessoTexture, gessoResponse, setGessoResponse,
    blurType, setBlurType, blurGaussianAmount, setBlurGaussianAmount, blurMotionAmount, setBlurMotionAmount,
    blurMotionDirection, setBlurMotionDirection, blurRadialAmount, setBlurRadialAmount,
    posterizeLevels, setPosterizeLevels, halftoneSize, setHalftoneSize, halftoneCMYK, setHalftoneCMYK,
    halftoneMove, setHalftoneMove, halftoneVariation, setHalftoneVariation,
    duotoneColor1, setDuotoneColor1, duotoneColor2, setDuotoneColor2,
    duotoneColor3, setDuotoneColor3, duotoneThreeColor, setDuotoneThreeColor, duotoneIntensity, setDuotoneIntensity,
    gridSides, setGridSides, gridShapeSize, setGridShapeSize, gridVariation, setGridVariation,
    gridRotationDirection, setGridRotationDirection, vhsGlitchIntensity, setVhsGlitchIntensity, vhsJitterAmount, setVhsJitterAmount,
    dustCrackleIntensity, setDustCrackleIntensity, dustCrackleLength, setDustCrackleLength, dustCrackleColor, setDustCrackleColor,
    waveDistortionStrength, setWaveDistortionStrength, waveDistortionRotation, setWaveDistortionRotation,
    slitScanIntensity, setSlitScanIntensity, slitScanHistory, setSlitScanHistory, slitScanSpeed, setSlitScanSpeed, slitScanDirection, setSlitScanDirection,
    ditherLevels, setDitherLevels, ditherScale, setDitherScale, ditherType, setDitherType,
    oilPaintRadius, setOilPaintRadius, oilPaintLevels, setOilPaintLevels,
    impastoStrength, setImpastoStrength, impastoLightAngle, setImpastoLightAngle,
    watercolorBleed, setWatercolorBleed, watercolorGrain, setWatercolorGrain, watercolorStyle, setWatercolorStyle,
    dadaPanels, setDadaPanels, dadaChaos, setDadaChaos,
    auraGlowCount, setAuraGlowCount, auraGlowSpeed, setAuraGlowSpeed, auraGlowOpacity, setAuraGlowOpacity,
    isMobile,
    // Presets
    isPresetsDropdownOpen, openNewPresetSignal, savedPresets, renamingPresetId, renamingPresetValue, folderNames,
    setIsPresetsDropdownOpen, setRenamingPresetId, setRenamingPresetValue, loadPreset, deletePreset, renamePreset,
    updatePreset, savePresetWithName, onAddingPresetChange: setIsNewPresetPending, movePresetToFolder, addFolder,
    renameFolder, deleteFolder,
    authUser: authState.user, isAnonymous: authState.isAnonymous, authBusy: authState.authBusy, authError: authState.authError,
    clearAuthError: authState.clearAuthError, signInWithEmail: authState.signInWithEmail, signUpWithEmail: authState.signUpWithEmail,
    signOutUser: authState.signOutUser,
  };

  const audioPanelState = {
    isMicActive, micError, audioInputDevices, selectedAudioDeviceId, isAudioControlsOpen,
    masterSensitivity, autoGainEnabled, depthLayerEnabled, depthLayerStrength, bassMultiplier, midsMultiplier, trebleMultiplier,
    reactionSmoothing: bassSmoothing,
    bassBeatSync, midsBeatSync, trebleBeatSync,
    liveBassLevel, liveMidsLevel, liveTrebleLevel,
    audioFileName, waveformData, audioFileMetadata,
    subBassMultiplier, subBassBeatSync, liveSubBassLevel,
    zoomBeatEnabled, shakeBeatEnabled, contrastBeatEnabled, paletteBeatEnabled,
    audioBindings, gradientType, activeEffects,
    quickBindKeys: (() => {
      // Styled gradients register '<camelId>Scale' / '<camelId>Speed' in MODULATABLE_PARAMS.
      const id = gradientType.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());
      return STYLE_FIELD_GRADIENT_TYPES.includes(gradientType) ? { scale: `${id}Scale`, speed: `${id}Speed` } : null;
    })(),
  };
  const audioPanelActions = {
    setSelectedAudioDeviceId, setIsAudioControlsOpen, setMicError,
    setMasterSensitivity, setAutoGainEnabled, setDepthLayerEnabled, setDepthLayerStrength, setBassMultiplier, setMidsMultiplier, setTrebleMultiplier,
    setReactionSmoothing,
    setAudioBindings,
    setSubBassMultiplier, setSubBassBeatSync,
    setBassBeatSync, setMidsBeatSync, setTrebleBeatSync,
    startMicVisualization, stopMicVisualization,
    onAudioFileClick: handleAudioFileClick,
    setZoomBeatEnabled, setShakeBeatEnabled, setContrastBeatEnabled, setPaletteBeatEnabled,
  };

  // The rail (+ its drawer, when a tab is open) is a real docked sidebar
  // now, not a floating overlay — it's a flex sibling of the canvas area
  // below, so the canvas area actually shrinks to share the frame with it
  // instead of being covered. Built once here and placed on whichever side
  // matches the layout (left of canvas on desktop, below it on mobile).
  const controlRailProps = {
    isMobile,
    onWordmarkClick: openAboutPanel,
    handleWavClick,
    isWavPressed,
    isAutoShuffleOn,
    isNewPresetPending,
    autoShuffleIntervalSec,
    formatAutoShuffleInterval,
    autoShufflePopoverAnchor,
    setAutoShufflePopoverAnchor,
    openAutoShufflePopover,
    openExportPopover,
    exportAsPNG,
    toggleGifRecording,
    isFinalizingGif,
    isRecordingGif,
    undoLastChange,
    redoLastChange,
    undoDepth,
    redoDepth,
    activeTab,
    setActiveTab,
    isMicActive,
    liveSubBassLevel,
    liveBassLevel,
    liveMidsLevel,
    liveTrebleLevel,
    audioEnergy,
    isRecording,
    isEncoding,
    encodingProgress,
    recordVideo: startVideoTake,
  };

  return (
    <>
    <ShuffleMarkBar onShuffle={() => evolveWithFactor(1)} />
    <GradientAppView
    aboutDialogRef={aboutDialogRef} activeTab={activeTab} audioFile={audioFile} audioPanelActions={audioPanelActions}
    audioPanelState={audioPanelState} audioRef={audioRef} autoShuffleIntervalSec={autoShuffleIntervalSec} autoShufflePopoverAnchor={autoShufflePopoverAnchor}
    autoShufflePopoverRef={autoShufflePopoverRef} autoShuffleScope={autoShuffleScope} canvasRef={canvasRef} containerRef={containerRef}
    controlDrawerTabProps={controlDrawerTabProps} controlRailProps={controlRailProps} copiedKey={copiedKey} copyText={copyText}
    currentPlayerUrl={currentPlayerUrl} dismissWavHint={dismissWavHint} drawerRef={drawerRef} exportAsPNG={exportAsPNG} saveWallpaper={saveWallpaper}
    exportAspect={exportAspect} exportSize={exportSize} fileInputRef={fileInputRef} handleFileUpload={handleFileUpload}
    handleMouseDown={handleMouseDown} handleMouseMove={handleMouseMove} handleMouseUp={handleMouseUp} handlePhotoFileChange={handlePhotoFileChange}
    handleTouchCancel={handleTouchCancel} handleTouchEnd={handleTouchEnd} handleTouchMove={handleTouchMove} handleTouchStart={handleTouchStart}
    handleWheel={handleWheel} hasRevealed={hasRevealed} isAboutOpen={isAboutOpen} isAutoShuffleOn={isAutoShuffleOn}
    isControlsVisible={isControlsVisible} isDisplayLinkCopied={isDisplayLinkCopied} isMobile={isMobile} isRecording={isRecording}
    mobilePanelMaxHeight={mobilePanelMaxHeight} motionDenied={motionDenied} panelRef={panelRef} photoInputRef={photoInputRef}
    popoverMode={popoverMode} railRect={railRect} savePreview={savePreview} videoResult={videoResult ?? gifResult} clearVideoResult={() => { clearVideoResult(); clearGifResult(); }} setAutoShuffleIntervalSec={setAutoShuffleIntervalSec}
    setAutoShufflePopoverAnchor={setAutoShufflePopoverAnchor} setAutoShuffleScope={setAutoShuffleScope} setExportAspect={setExportAspect} setExportSize={setExportSize}
    setIsAboutOpen={setIsAboutOpen} setIsAutoShuffleOn={setIsAutoShuffleOn} setSavePreview={setSavePreview}
    shakeEnabled={shakeEnabled} shakeWrapperRef={shakeWrapperRef} showWavHint={showWavHint}
    startVideoTake={startVideoTake} tiltEnabled={tiltEnabled} toggleMotion={toggleMotion}
    />
    </>
  );
}
