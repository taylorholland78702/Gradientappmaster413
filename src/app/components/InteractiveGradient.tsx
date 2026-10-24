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
import { ControlRail } from './ControlRail';
import { ControlDrawer } from './ControlDrawer';
import { useRandomization } from '../hooks/useRandomization';
import type { PresetData } from '../hooks/usePresets';
import { hslToRgb } from '../utils/color';
import { useSnapshot } from '../hooks/useSnapshot';
import { useCanvasDraw } from '../hooks/useCanvasDraw';
import {
  type ColorRGB, type GradientType, type EffectType,
  DEFAULT_COLORS,
  migrateId, migrateIds,
  GRADIENT_DISPLAY_NAMES,
  STYLE_FIELD_GRADIENT_TYPES } from '../constants/gradientEffects';
import { totalCost, resolutionForEffectCost } from '../constants/effectCost';
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
import { useRadarState } from '../hooks/state/useRadarState';
import { useRadialState } from '../hooks/state/useRadialState';
import { useRadialBurstState } from '../hooks/state/useRadialBurstState';
import { useReactionDiffusionState } from '../hooks/state/useReactionDiffusionState';
import { useReactionDiffusionGridState } from '../hooks/state/useReactionDiffusionGridState';
import { useRedoState } from '../hooks/state/useRedoState';
import { useSepiaState } from '../hooks/state/useSepiaState';
import { useShapesState } from '../hooks/state/useShapesState';
import { useStackState } from '../hooks/state/useStackState';
import { useHatchState } from '../hooks/state/useHatchState';
import { useSlitScanState } from '../hooks/state/useSlitScanState';
import { useSolarizeState } from '../hooks/state/useSolarizeState';
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
import { useMasterClock } from '../hooks/useMasterClock';
import { usePopoutAnchor } from '../hooks/usePopoutAnchor';
import { useAutoColor } from '../hooks/useAutoColor';
import { useBeatEffects } from '../hooks/useBeatEffects';
import { usePhotoUpload } from '../hooks/usePhotoUpload';
import { generateAIColors as generateAIColorsFor } from '../utils/aiColors';
import { addGradientStops as addGradientStopsTo } from '../utils/gradientStops';
import { adjustColorArrayLength } from '../utils/color';
import { NoticeToast } from './NoticeToast';
import { WavHint } from './WavHint';
import { RailPopouts } from './RailPopouts';
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

import { AboutPanel } from './AboutPanel';
import { formatAutoShuffleInterval } from '../utils/autoShuffle';
import { EffectSection } from './EffectSection';
import { EMOJI_PICKER_CATEGORIES, pickRandomEmojiSet, splitGraphemes } from '../constants/emojiPicker';
import { IS_DISPLAY_MODE } from '../constants/displayMode';

// Re-exported so existing importers keep working.
export { EMOJI_PICKER_CATEGORIES, pickRandomEmojiSet, splitGraphemes, EffectSection };

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
  const { causticsAnimTime, setCausticsAnimTime, causticsBrightness, setCausticsBrightness, causticsScale, setCausticsScale } = useCausticsState();
  const { chromaticOffset, setChromaticOffset, chromaticAngle, setChromaticAngle } = useChromaticState();
  const { chromaticTrailsDecay, setChromaticTrailsDecay, chromaticTrailsOffset, setChromaticTrailsOffset, chromaticTrailsBufferRef } = useChromaticTrailsState();
  const {
    colorShiftHue, setColorShiftHue,
    paletteHue, setPaletteHue, paletteSaturation, setPaletteSaturation,
    paletteBrightness, setPaletteBrightness, paletteContrast, setPaletteContrast,
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
  const { fieldContrast, setFieldContrast, paletteMode, setPaletteMode, paletteBands, setPaletteBands, colorBlend, fieldScale, fieldSpeed, fieldShapes, fieldExposure, fieldTone, fieldGrade, fieldSwirl, paletteStops, paletteBias, paletteSharp, setColorBlend, setFieldScale, setFieldSpeed, setFieldShapes, setFieldExposure, setFieldTone, setFieldGrade, setFieldSwirl, setPaletteStops, setPaletteBias, setPaletteSharp } = useFieldMappingState();
  const { flowerCircles, setFlowerCircles, flowerScale, setFlowerScale, flowerSpread, setFlowerSpread, flowerRotation, setFlowerRotation, flowerSymmetry, setFlowerSymmetry, flowerOpacity, setFlowerOpacity, flowerAnimTime, setFlowerAnimTime, flowAnimTime, setFlowAnimTime, flowParticleCount, setFlowParticleCount, flowSpeed, setFlowSpeed, flowScale, setFlowScale, flowThickness, setFlowThickness } = useFlowState();
  const { flowBufferRef } = useFlowBufferState();
  const { flowParticlesRef } = useFlowParticlesState();
  const { auraGlowCount, setAuraGlowCount, auraGlowSpeed, setAuraGlowSpeed, auraGlowOpacity, setAuraGlowOpacity } = useAuraGlowState();
  const { grainIntensity, setGrainIntensity, grainType, setGrainType, grainSize, setGrainSize } = useGrainState();
  const { gessoWhiteness, setGessoWhiteness, gessoTexture, setGessoTexture, gessoResponse, setGessoResponse } = useGessoState();
  const { gridSides, setGridSides, gridRows, setGridRows, gridColumns, setGridColumns, gridRotation, setGridRotation, gridVariation, setGridVariation, gridShapeSize, setGridShapeSize, gridCellAngleStep, setGridCellAngleStep, gridHardEdge, setGridHardEdge, gridMode, setGridMode } = useGridState();
  const { gridRotationDirection, setGridRotationDirection, gridRotationDirectionRef } = useGridRotationDirectionState();
  const { halftoneSize, setHalftoneSize, halftoneVariation, setHalftoneVariation, halftoneMove, setHalftoneMove, halftoneMoveSpeed, setHalftoneMoveSpeed, halftoneCMYK, setHalftoneCMYK, halftoneTimeRef, halftoneMoveRef } = useHalftoneState();
  const { helixTurns, setHelixTurns, helixTightness, setHelixTightness } = useHelixState();
  const { hexGridSize, setHexGridSize } = useHexGridState();
  const { invertAmount, setInvertAmount } = useInvertState();
  const { juliaReal, setJuliaReal, juliaImaginary, setJuliaImaginary, juliaZoom, setJuliaZoom, juliaIterations, setJuliaIterations, juliaCanvasRef } = useJuliaState();
  const { kaleidoscopeSegments, setKaleidoscopeSegments, kaleidoscopeRotateSpeed, setKaleidoscopeRotateSpeed } = useKaleidoscopeState();
  const { lavaAnimTime, setLavaAnimTime, lavaBlobCount, setLavaBlobCount, lavaBlobSize, setLavaBlobSize, lavaSpeed, setLavaSpeed } = useLavaState();
  const { lightLeakIntensity, setLightLeakIntensity } = useLightLeakState();
  const { linesCount, setLinesCount, linesAngle, setLinesAngle, linesThickness, setLinesThickness } = useLinesState();
  const { liquidAnimTime, setLiquidAnimTime, liquidStrength, setLiquidStrength, liquidScale, setLiquidScale } = useLiquidState();
  const { crtIntensity, setCrtIntensity, crtScanlineSpacing, setCrtScanlineSpacing } = useCrtState();
  const { liquifyStrength, setLiquifyStrength } = useLiquifyState();
  const { marbleAnimTime, setMarbleAnimTime, marbleVeinFreq, setMarbleVeinFreq, marbleTurbulence, setMarbleTurbulence, marbleOctaves, setMarbleOctaves } = useMarbleState();
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
  const { radarSweepAngle, setRadarSweepAngle, radarFadeLength, setRadarFadeLength, radarBeamWidth, setRadarBeamWidth } = useRadarState();
  const { radialSizeScale, setRadialSizeScale, radialHardEdge, setRadialHardEdge, radialAnimTime, setRadialAnimTime, radialSpeed, setRadialSpeed } = useRadialState();
  const { radialBurstCount, setRadialBurstCount, radialBurstSpread, setRadialBurstSpread, radialBurstSize, setRadialBurstSize, radialBurstMode, setRadialBurstMode } = useRadialBurstState();
  const radialBurstModeRef = useRef(radialBurstMode);
  radialBurstModeRef.current = radialBurstMode;
  const { reactionDiffusionFeed, setReactionDiffusionFeed, reactionDiffusionKill, setReactionDiffusionKill, reactionDiffusionSpeed, setReactionDiffusionSpeed } = useReactionDiffusionState();
  const { reactionDiffusionGridRef } = useReactionDiffusionGridState();
  const { redoStackRef, redoDepth, setRedoDepth } = useRedoState();
  const { sepiaIntensity, setSepiaIntensity } = useSepiaState();
  const { shapesSides, setShapesSides, shapesCount, setShapesCount, shapesMode, setShapesMode } = useShapesState();
  const { stackCount, setStackCount, stackGap, setStackGap, stackWidth, setStackWidth, stackLength, setStackLength, stackResponse, setStackResponse } = useStackState();
  const { hatchLayers, setHatchLayers, hatchSpacing, setHatchSpacing, hatchResponse, setHatchResponse, hatchAnimTime, setHatchAnimTime, hatchSpeed, setHatchSpeed } = useHatchState();
  const { slitScanIntensity, setSlitScanIntensity, slitScanDirection, setSlitScanDirection, slitScanHistory, setSlitScanHistory, slitScanBufferRef } = useSlitScanState();
  const { solarizeThreshold, setSolarizeThreshold } = useSolarizeState();
  const { structuralSeed, setStructuralSeed } = useStructuralSeedState();
  const { topographicScale, setTopographicScale, topographicBands, setTopographicBands, topographicLineWidth, setTopographicLineWidth } = useTopographicState();
  const { waveInterferenceAnimTime, setWaveInterferenceAnimTime, waveInterferenceSourceCount, setWaveInterferenceSourceCount, waveInterferenceFrequency, setWaveInterferenceFrequency, waveInterferenceSpeed, setWaveInterferenceSpeed } = useWaveInterferenceState();
  const { meshWireframeAnimTime, setMeshWireframeAnimTime, meshWireframeGridSize, setMeshWireframeGridSize, meshWireframeJitter, setMeshWireframeJitter, meshWireframeLineWidth, setMeshWireframeLineWidth } = useMeshWireframeState();
  const { triangleSize, setTriangleSize, triangulateVariation, setTriangulateVariation } = useTriangleState();
  const { truchetSize, setTruchetSize, truchetVariation, setTruchetVariation, truchetThickness, setTruchetThickness } = useTruchetState();
  const { twistAmount, setTwistAmount } = useTwistState();
  const { undoStackRef, undoIndexRef, undoDepth, setUndoDepth } = useUndoState();
  const { vhsGlitchIntensity, setVhsGlitchIntensity, vhsJitterAmount, setVhsJitterAmount } = useVhsState();
  const { vignetteStrength, setVignetteStrength, vignetteSoftness, setVignetteSoftness } = useVignetteState();
  const { voronoiCellCount, setVoronoiCellCount, voronoiDistortion, setVoronoiDistortion, voronoiAnimTime, setVoronoiAnimTime } = useVoronoiState();
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

  // MULTI_FX_COST_BUDGET (effectCost.ts) is set high enough that manually
  // toggling effects in EffectsTab.tsx never grays a button out — stacking
  // is an intentional choice there, unlike a random shuffle result, so it's
  // not that budget's job to protect playback performance. But that also
  // meant manually stacking several expensive effects got zero resolution
  // relief: feelingLucky/randomizeEffects (useRandomization.ts) already
  // call resolutionForEffectCost after picking a shuffled stack, but a
  // manual EffectsTab toggle never did. Applying the same curve here,
  // keyed only on activeEffects, covers both paths uniformly — redundant
  // with (but harmless alongside) the explicit shuffle-path calls, since
  // it converges on the identical value from the same inputs.
  // Skipped in Display mode: resolutionMultiplier arrives there via the
  // synced snapshot (useSnapshot.ts's applySnapshot) so it matches
  // whatever the controller computed from ITS OWN devicePixelRatio —
  // recomputing locally here would instead use the display window's own
  // devicePixelRatio, which can genuinely differ (e.g. mirroring to an
  // external projector) and silently diverge from the controller's choice.
  useEffect(() => {
    if (IS_DISPLAY_MODE) return;
    setResolutionMultiplier(resolutionForEffectCost(totalCost(activeEffects), isMobile));
  }, [activeEffects, isMobile]);

  // First-run hint explaining the tap/hold/double-tap gesture vocabulary —
  // tooltips (title attrs) never surface on touch devices, which is this
  // app's primary target, so without this the gestures are undiscoverable.
  const dismissWavHint = () => {
    setShowWavHint(false);
    try { localStorage.setItem('wavGestureGuideSeen', '1'); } catch (err) {
      if (import.meta.env.DEV) console.warn('Failed to persist wavGestureGuideSeen:', err);
    }
  };
  
  // Effect parameters
  // Dust-scratches was merged into film-grain — only its crackle-lines slider
  // survives as an add-on (the noise portion was identical to grain's own).
  // Tritone was merged into Duotone — this just adds a 3rd color stop.
  
  // New effect parameters
  // Bloom
  // Feedback / Trails
  // audioReactiveColors is now in useAudioReactivity hook
  
  // New dither, slit-scan, and diffusion effect parameters
  // Complexity and Scale were redundant — both just scale the same sine-wave
  // frequency terms, so Complexity was removed and its value folded into Scale.
  // Metaballs
  // Truchet tiles
  // Flow field
  // Attractor — de Jong strange attractor, parameters slowly drift over
  // time via attractorAnimTime for a living, evolving lace pattern.
  // Reaction-Diffusion — Gray-Scott simulation on a fixed coarse grid
  // (see reactionDiffusionGridRef), Feed/Kill control the pattern family
  // (spots vs stripes vs coral), Speed controls sim steps per frame.
  // Topographic — posterized noise field with dark contour lines at each band edge
  // Julia Set — escape-time fractal on the complex plane, rendered at a
  // fixed small internal resolution (see juliaCanvasRef) and upscaled, since
  // per-pixel iteration at full canvas resolution would be far too slow.
  // ASCII mosaic
  // Emoji mosaic — ASCII's sibling, brightness maps to an emoji ramp instead of a character ramp
  // Photo overlay — user-uploaded image blended over the gradient. The image
  // itself lives in a ref (not React state, not saved in presets — a data
  // URL big enough to be worth uploading would bloat every preset save), only
  // blend mode + opacity are persisted so a reloaded preset at least restores
  // the *look*, prompting the user to re-upload rather than silently losing it.
  // Liquid displacement
  // Chromatic trails

  // Store base AI colors to keep them anchored
  
  // Preset management state is in usePresets hook (initialized below)
  
  // Rating system for Randomize
  
  // File input refs for uploads
  const handleAudioFileClick = useCallback(() => fileInputRef.current?.click(), []);
  const handlePhotoFileClick = useCallback(() => photoInputRef.current?.click(), []);
  const { handlePhotoFileChange } = usePhotoUpload({ photoFileName, setPhotoFileName, setPhotoVersion, photoImageRef, setActiveEffects, isMultiFxMode });

  // Fullscreen state

  // Undo state - store previous settings for one-level undo
  // Redo state - captures the state undo/redo moves away from, so it can be restored

  // Track manual zoom interaction
  
  // Halftone animation time tracker

  // Diffusion simulation buffers (for reaction-diffusion)
  
  // Slit-scan temporal buffer
  // Flow field's persistent trail canvas + particle positions
  // Attractor's persistent trail canvas + walker positions (same pattern as flow field)
  // Reaction-Diffusion's persistent simulation grid (fixed coarse resolution,
  // independent of canvas size — see RD_W/RD_H in useCanvasDraw). Double-buffered
  // (u/v + u2/v2) to avoid allocating new Float32Arrays every simulation step.
  // Julia Set's small fixed-resolution offscreen canvas (see comment above the state)
  // Chromatic Trails' own trail buffer (separate from Feedback's)

  // Audio reactivity state is in useAudioReactivity hook (initialized below)


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
    isEncoding, encodingProgress,
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

  // Beat sync effects are now in useAudioReactivity hook via callbacks

  // Audio reactivity and mic functions are now in useAudioReactivity hook

  useRefMirrors({ animValuesRef, flowerAnimTime, gradientColorsRef, gradientType, gridRotation, isAudioActiveRef, isAudioEnabled, isAudioReactive, isAutoColor, isAutoColorRef, isAutoMode, isAutoModeRef, isMicActive, isVCRPlaying, isVCRPlayingRef, radarSweepAngle, rotationDirection, rotationDirectionRef, setTargetColors, targetAngle, targetAngleRef, targetColors, targetColorsRef, targetZoom, targetZoomRef, tilingAnimTime, vcrPlaybackSpeed, vcrPlaybackSpeedRef, voronoiAnimTime });

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

  // Refs for contrast/saturation pulse and canvas shake

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

  useMasterClock({ activeEffectsRef, analyzeAudioRef, animValuesRef, audioMidsLevelRef, audioSubBassLevelRef, drawParamsDirtyRef, drawRef, gradientAngleRef, gradientColorsRef, gradientTypeRef, gridRotationDirectionRef, halftoneMoveRef, halftoneTimeRef, isAudioActiveRef, isAutoModeRef, getIsAutoShuffleOn: () => isAutoShuffleOnRef.current, isMicActiveRef, isVCRPlayingRef, lerpSyncFrameRef, radialBurstModeRef, rotationDirectionRef, setFlowerAnimTime, setGradientAngle, setGradientColors, setGridRotation, setMeshWireframeAnimTime, setRadarSweepAngle, setTargetAngle, setTilingAnimTime, setVoronoiAnimTime, setWaveInterferenceAnimTime, setZoom, targetAngleRef, targetColorsRef, targetZoomRef, vcrPlaybackSpeedRef, windmillModeRef, zoomRef });
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


  useAnimClocks({ activeEffects, animValuesRef, attractorAnimTime, attractorSpeed, audioEnergy, audioMidsLevel, audioSubBassLevel, audioTrebleLevel, auroraAnimTime, causticsAnimTime, emojiAnimTime, emojiRotateSpeed, flowAnimTime, flowSpeed, gradientType, gradientTypeRef, hatchAnimTime, hatchSpeed, isAutoMode, isAutoModeRef, isMicActive, isMicActiveRef, isVCRPlaying, isVCRPlayingRef, lavaAnimTime, liquidAnimTime, marbleAnimTime, metaballAnimTime, metaballSpeed, noiseAnimTime, noiseSpeed, particlesMode, radialAnimTime, radialSpeed, setAttractorAnimTime, setCausticsAnimTime, setEmojiAnimTime, setFlowAnimTime, setHatchAnimTime, setLavaAnimTime, setLiquidAnimTime, setMarbleAnimTime, setMetaballAnimTime, setNoiseAnimTime, setRadialAnimTime, turrellAnimTime, vcrPlaybackSpeed, vcrPlaybackSpeedRef });

  // buildSnapshot/applySnapshot extracted to useSnapshot.ts (splitting-plan
  // step 3). The single source of truth for undo/redo AND presets, so it
  // touches nearly every piece of state (~380 values/setters).
  const { buildSnapshot, applySnapshot } = useSnapshot({
    activeEffects, angleCenterX, angleCenterY, angleStartOffset, angleHardEdge, setAngleHardEdge, asciiChars, asciiColor,
    gridHardEdge, setGridHardEdge, gridMode, setGridMode, radialHardEdge, setRadialHardEdge,
    radialAnimTime, setRadialAnimTime, radialSpeed, setRadialSpeed,
    noiseAnimTime, setNoiseAnimTime, noiseSpeed, setNoiseSpeed,
    asciiSize, auroraBandCount, auroraBandHeight, auroraWaveSpeed, autoGainEnabled, baseAIColors,
    depthLayerEnabled, depthLayerStrength, setDepthLayerEnabled, setDepthLayerStrength,
    auraGlowCount, setAuraGlowCount, auraGlowSpeed, setAuraGlowSpeed, auraGlowOpacity, setAuraGlowOpacity,
    juliaReal, juliaImaginary, juliaZoom, juliaIterations, setJuliaReal, setJuliaImaginary, setJuliaZoom, setJuliaIterations,
    fieldContrast, paletteMode, colorBlend, fieldScale, fieldSpeed, fieldShapes, fieldExposure, fieldTone, fieldGrade, fieldSwirl, paletteStops, paletteBias, paletteSharp, paletteBands, setFieldContrast, setPaletteMode, setColorBlend, setFieldScale, setFieldSpeed, setFieldShapes, setFieldExposure, setFieldTone, setFieldGrade, setFieldSwirl, setPaletteStops, setPaletteBias, setPaletteSharp, setPaletteBands,
    invertAmount, setInvertAmount,
    voronoiAnimTime, setVoronoiAnimTime, flowerAnimTime, setFlowerAnimTime, auroraAnimTime, setAuroraAnimTime,
    fadeMode, setFadeMode, turrellAnimTime, setTurrellAnimTime, turrellSpeed, setTurrellSpeed, turrellGlow, setTurrellGlow,
    stackCount, setStackCount, stackGap, setStackGap, stackWidth, setStackWidth, stackLength, setStackLength, stackResponse, setStackResponse,
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
    blurType, causticsBrightness, causticsScale, chromaticAngle, chromaticOffset,
    chromaticTrailsDecay, chromaticTrailsOffset, colorShiftHue, concentricRingCount, concentricRingWidth,
    paletteHue, setPaletteHue, paletteSaturation, setPaletteSaturation, paletteBrightness, setPaletteBrightness, paletteContrast, setPaletteContrast,
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
    flowerCircles, flowerRotation, flowerSymmetry, flowerOpacity,
    flowerScale, flowerSpread, gradientAngle, gradientColors, gradientType, grainIntensity, grainSize,
    gessoWhiteness, gessoTexture, gessoResponse,
    grainType, gridCellAngleStep, gridColumns, gridRotation, gridRows, gridShapeSize, gridSides,
    gridVariation, halftoneCMYK, halftoneMove, halftoneMoveSpeed, halftoneSize, halftoneVariation,
    hexGridSize, isAudioEnabled, isAudioReactive,
    kaleidoscopeRotateSpeed, kaleidoscopeSegments, lavaBlobCount, lavaBlobSize, lavaSpeed, lightLeakIntensity,
    linesAngle, linesCount, linesThickness, liquidScale, liquidStrength, liquifyStrength, crtIntensity, crtScanlineSpacing,
    marbleOctaves, marbleTurbulence, marbleVeinFreq, masterSensitivity,
    metaballCount, metaballSize, metaballSpeed, midsBeatSync, midsMax, midsMin,
    midsMultiplier, midsSmoothing, midsThreshold, mirrorMode, mirrorTileCount,
    noiseDirection, noiseOctaves, noiseScale, noiseType,
    noiseWarp, paletteBeatEnabled, photoBlendMode, photoImageRef, photoOpacity, pinchStrength,
    pixelSize, polygon2Sides,
    posterizeLevels, radarBeamWidth, radarFadeLength, radarSweepAngle, radialBurstCount, radialBurstMode, radialBurstSize,
    radialBurstSpread, radialSizeScale, resolutionMultiplier,
    sepiaIntensity, setActiveEffects, setAngleCenterX,
    setAngleCenterY, setAngleStartOffset, setAsciiChars, setAsciiColor, setAsciiSize, setAuroraBandCount,
    setAuroraBandHeight, setAuroraWaveSpeed, setAutoGainEnabled, setBaseAIColors, setBassBeatSync, setBassMax,
    setBassMin, setBassMultiplier, setBassSmoothing, setBassThreshold, setBloomIntensity, setBloomRadius,
    setBlurGaussianAmount, setBlurMotionAmount, setBlurMotionDirection, setBlurRadialAmount, setBlurType, setCausticsBrightness,
    setCausticsScale, setChromaticAngle, setChromaticOffset, setChromaticTrailsDecay, setChromaticTrailsOffset,
    setColorShiftHue, setConcentricRingCount, setConcentricRingWidth, setHelixTightness, setHelixTurns,
    setContrastBeatEnabled, setDigitalNoiseIntensity, setDitherLevels, setDitherType, setDitherScale, setDuotoneColor1, setDuotoneColor2,
    setDuotoneColor3, setDuotoneIntensity, setDuotoneThreeColor, setDustCrackleColor, setDustCrackleIntensity, setDustCrackleLength, setEmojiChars, setEmojiOffsetX,
    setEmojiRotateSpeed, setEmojiSize, setEmojiSizeVariation, setFadeDirection, setFeedbackDecay, setFeedbackRotation,
    setFeedbackZoom, setFlowParticleCount, setFlowScale,
    setFlowSpeed, setFlowThickness, setFlowerCircles, setFlowerRotation, setFlowerScale, setFlowerSpread, setFlowerSymmetry, setFlowerOpacity,
    setGradientAngle, setGradientColors, setGradientType, setGrainIntensity, setGrainType, setGrainSize,
    setGessoWhiteness, setGessoTexture, setGessoResponse,
    setGridCellAngleStep, setGridColumns,
    setGridRotation, setGridRows, setGridShapeSize, setGridSides, setGridVariation, setHalftoneCMYK,
    setHalftoneMove, setHalftoneMoveSpeed, setHalftoneSize, setHalftoneVariation, setHexGridSize,
    setIsAudioEnabled, setIsAudioReactive, setKaleidoscopeRotateSpeed, setKaleidoscopeSegments,
    setLavaBlobCount, setLavaBlobSize, setLavaSpeed, setLightLeakIntensity, setLinesAngle, setLinesCount,
    setLinesThickness, setLiquidScale, setLiquidStrength, setLiquifyStrength, setCrtIntensity, setCrtScanlineSpacing, setMarbleOctaves, setMarbleTurbulence,
    setMarbleVeinFreq, setMasterSensitivity, setMetaballCount, setMetaballSize,
    setMetaballSpeed, setMidsBeatSync, setMidsMax, setMidsMin, setMidsMultiplier, setMidsSmoothing,
    setMidsThreshold, setMirrorMode, setMirrorTileCount,
    setNoiseDirection, setNoiseOctaves, setNoiseScale, setNoiseType, setNoiseWarp, setPaletteBeatEnabled,
    setPhotoBlendMode, setPhotoOpacity, setPinchStrength, setPixelSize,
    setPolygon2Sides, setPosterizeLevels, setRadarBeamWidth, setRadarFadeLength,
    setRadarSweepAngle, setRadialBurstCount, setRadialBurstMode, setRadialBurstSize, setRadialBurstSpread, setRadialSizeScale, setResolutionMultiplier,
    setSepiaIntensity,
    setShakeBeatEnabled, setShapesCount, setShapesSides, setSlitScanDirection, setSlitScanIntensity, setSlitScanHistory, setSolarizeThreshold,
    setWindmillRotations, setWindmillThickness, setWindmillTightness, setWindmillZoom, setWindmillZoomResponse, setWindmillMode, setShapesMode, setSubBassBeatSync, setSubBassMultiplier,
    setSubmittedAIPrompt, setTargetAngle, setTargetColors, setTargetZoom, setTrebleBeatSync, setTrebleMax,
    setTrebleMin, setTrebleMultiplier, setTrebleSmoothing, setTrebleThreshold, setTriangleSize, setTriangulateVariation, setTruchetSize,
    setTruchetThickness, setTruchetVariation, setTwistAmount, setVhsGlitchIntensity, setVhsJitterAmount, setVignetteSoftness, setVignetteStrength,
    setVoronoiCellCount, setVoronoiDistortion, setWaveDistortionRotation, setWaveDistortionStrength,
    setZoom, setZoomBeatEnabled, shakeBeatEnabled,
    shapesCount, shapesSides, shapesMode, slitScanDirection, slitScanIntensity, slitScanHistory, solarizeThreshold, windmillRotations,
    windmillThickness, windmillTightness, windmillZoom, windmillZoomResponse, windmillMode, subBassBeatSync, subBassMultiplier, submittedAIPrompt,
    targetAngle, targetColors, targetZoom, trebleBeatSync, trebleMax, trebleMin,
    trebleMultiplier, trebleSmoothing, trebleThreshold, triangleSize, triangulateVariation, truchetSize, truchetThickness,
    truchetVariation, twistAmount, vhsGlitchIntensity, vhsJitterAmount, vignetteSoftness, vignetteStrength, voronoiCellCount,
    voronoiDistortion, waveDistortionRotation, waveDistortionStrength,
    zoom, zoomBeatEnabled,
  });


  // Save current state for undo (defined early for use in other functions)
  const { saveCurrentState, undoLastChange, redoLastChange } = useUndoRedo({
    buildSnapshot, applySnapshot, undoStackRef, undoIndexRef, setUndoDepth, redoStackRef, setRedoDepth,
  });

  // Randomize all colors
  const { applyGradientLook, applyLookValues, applyPalette, colorFamilyRef, keepFamily, setKeepFamily, shuffleColors } = useLooks({ colorBlend, gradientColorsRef, gradientTypeRef, saveCurrentState, setAngleStartOffset, setAttractorPointCount, setAttractorScale, setAttractorSpeed, setCausticsBrightness, setCausticsScale, setColorBlend, setColorsInstant, setFadeDirection, setFieldContrast, setFieldExposure, setFieldGrade, setFieldScale, setFieldShapes, setFieldSpeed, setFieldSwirl, setFieldTone, setFlowerCircles, setFlowerScale, setFlowerSpread, setGridColumns, setGridRows, setHatchLayers, setHatchResponse, setHatchSpacing, setHatchSpeed, setHelixTightness, setHelixTurns, setJuliaImaginary, setJuliaIterations, setJuliaReal, setJuliaZoom, setLavaBlobCount, setLavaBlobSize, setLavaSpeed, setMarbleOctaves, setMarbleTurbulence, setMarbleVeinFreq, setMetaballCount, setMetaballSize, setMetaballSpeed, setNoiseOctaves, setNoiseScale, setNoiseSpeed, setNoiseType, setNoiseWarp, setPaletteBias, setPaletteSharp, setPaletteStops, setParticlesCount, setParticlesGravity, setParticlesSize, setParticlesSpeed, setParticlesTrail, setRadialBurstCount, setRadialBurstMode, setRadialBurstSize, setRadialBurstSpread, setRadialSizeScale, setRadialSpeed, setReactionDiffusionFeed, setReactionDiffusionKill, setReactionDiffusionSpeed, setShapesCount, setShapesSides, setStackCount, setStackGap, setStackLength, setStackResponse, setStackWidth, setTargetColors, setTilingComplexity, setTilingRotation, setTilingSize, setTilingSymmetry, setTopographicBands, setTopographicLineWidth, setTopographicScale, setTruchetSize, setTruchetThickness, setTruchetVariation, setVoronoiCellCount, setVoronoiDistortion, setWindmillMode });

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
    evolveWithFactor, shuffleAudiovisuals,
  } = useRandomization({
    colorFamilyRef, activeEffects, adjustColorArrayLength, gradientAngle, gradientColors, gradientType, isAudioEnabled, isAudioReactive, isMobile,
    kaleidoscopeSegments, pixelSize, resolutionMultiplier, setResolutionMultiplier,
    randomColor, randomHexColor, ratedResults, saveCurrentState, setActiveEffects,
    setAngleCenterX, setAngleCenterY, setAngleStartOffset, setAsciiSize, setAsciiColor, setAuroraBandCount, setAuroraBandHeight,
    setAuroraWaveSpeed, setBaseAIColors, setBassBeatSync, setBassMultiplier, setBloomIntensity, setBloomRadius, setBlurGaussianAmount, setBlurMotionAmount,
    setBlurMotionDirection, setBlurRadialAmount, setBlurType, setCausticsBrightness, setCausticsScale, setChromaticAngle, setChromaticOffset,
    setChromaticTrailsDecay, setChromaticTrailsOffset, setColorShiftHue, setConcentricRingCount, setConcentricRingWidth,
    setHelixTightness, setHelixTurns, setContrastBeatEnabled, setDigitalNoiseIntensity, setDitherLevels, setDitherType, setDitherScale,
    setDuotoneColor1, setDuotoneColor2, setDuotoneColor3, setDuotoneIntensity, setDuotoneThreeColor, setDustCrackleColor, setDustCrackleIntensity, setDustCrackleLength, setEmojiChars,
    setEmojiRotateSpeed, setEmojiSize, setEmojiSizeVariation, setFadeDirection, setFeedbackDecay, setFeedbackRotation, setFeedbackZoom,
    setFlowParticleCount, setFlowScale, setFlowSpeed, setFlowThickness, setFlowerCircles,
    setAsciiChars, setGrainType, setGridRotationDirection, setKaleidoscopeRotateSpeed, setLiquidScale, setLiquidStrength, setCrtIntensity, setCrtScanlineSpacing,
    setNoiseType, setNoiseWarp, setNoiseSpeed, setRadialSizeScale, setRadialSpeed, setVignetteSoftness, setWaveDistortionRotation,
    setJuliaReal, setJuliaImaginary, setJuliaZoom, setJuliaIterations,
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
    setFieldContrast, setPaletteMode, setPaletteBands, setInvertAmount, setFieldScale, setFieldSpeed, setPaletteStops, setPaletteBias, setPaletteSharp, applyLookValues, setFieldShapes, setFieldExposure, setFieldTone, setFieldGrade, setFieldSwirl,
    setSlitScanIntensity, setSlitScanDirection, setSlitScanHistory,
    setOilPaintRadius, setOilPaintLevels, setImpastoStrength, setImpastoLightAngle, setWatercolorBleed, setWatercolorGrain,
    setDadaPanels, setDadaChaos,
    setFlowerScale, setFlowerSpread, setGradientColors, setGradientType, setGrainIntensity, setGrainSize,
    setGessoWhiteness, setGessoTexture, setGessoResponse,
    setGridCellAngleStep, setGridColumns,
    setGridRotation, setGridRows, setGridShapeSize, setGridSides, setGridVariation, setHalftoneMove, setHalftoneCMYK,
    setHalftoneMoveSpeed, setHalftoneSize, setHalftoneVariation, setHexGridSize,
    setIsMultiFxMode, setKaleidoscopeSegments, setLavaBlobCount, setLavaBlobSize, setLightLeakIntensity,
    setMidsBeatSync, setMidsMultiplier,
    setLinesAngle, setLinesCount, setLinesThickness, setLiquifyStrength, setMarbleOctaves, setMarbleTurbulence,
    setMarbleVeinFreq, setMasterSensitivity, setMetaballCount, setMetaballSize, setMetaballSpeed, setMirrorMode,
    setMirrorTileCount, setNoiseDirection, setNoiseOctaves,
    setNoiseScale, setPaletteBeatEnabled, setPinchStrength, setPixelSize,
    setPolygon2Sides, setPosterizeLevels, setRadarBeamWidth, setRadarFadeLength, setRadialBurstCount,
    setRadialBurstSize, setRadialBurstSpread, setRotationDirection,
    setSepiaIntensity, setShakeBeatEnabled, setShapesCount, setShapesMode,
    setTurrellSpeed, setTurrellGlow,
    setStackCount, setStackGap, setStackWidth, setStackLength, setStackResponse,
    setHatchLayers, setHatchSpacing, setHatchResponse, setHatchSpeed,
    setShapesSides, setShowRatingUI, setSolarizeThreshold, setWindmillRotations, setWindmillThickness, setWindmillTightness,
    setWindmillZoom, setSubBassBeatSync, setSubBassMultiplier, setSubmittedAIPrompt, setTargetAngle, setTargetColors, setTargetZoom, setTriangleSize,
    setAudioBindings,
    setTrebleBeatSync, setTrebleMultiplier,
    setTruchetSize, setTruchetThickness, setTruchetVariation, setTwistAmount, setVcrPlaybackSpeed, setVhsGlitchIntensity, setVhsJitterAmount, setVignetteStrength,
    setVoronoiCellCount, setVoronoiDistortion, setWaveDistortionStrength,
    setZoom, setZoomBeatEnabled, windmillTightness, twistAmount, vignetteStrength,
    zoom,
    setPaletteHue, setPaletteSaturation, setPaletteBrightness, setPaletteContrast,
    setAuraGlowCount, setAuraGlowSpeed, setAuraGlowOpacity,
    setWindmillMode, setWindmillZoomResponse, setFadeMode, setGridMode, setParticlesMode, setRadialBurstMode,
    setAngleHardEdge, setGridHardEdge, setRadialHardEdge,
    setStructuralSeed, setLavaSpeed, setFlowerRotation, setFlowerSymmetry, setFlowerOpacity,
    setTriangulateVariation, setEmojiOffsetX,
  });

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
  const {
    exportSize, setExportSize, exportAspect, setExportAspect,
    videoSize, setVideoSize, videoLength, setVideoLength,
    copiedKey, copyText, currentPlayerUrl,
    savePreview, setSavePreview, exportAsPNG,
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
  const { popoverMode, autoShufflePopoverAnchor, setAutoShufflePopoverAnchor, autoShufflePopoverRef, openAutoShufflePopover, openExportPopover, openRecordPopover, openAboutPanel } = usePopoutAnchor({ panelRef, isMobile, activeTab, setActiveTab, setIsAboutOpen });
  // Undo to previous state (up to 10 levels)
  // Apply a snapshot's values to live state (shared by undo and redo)

  const { toggleDisplayWindow } = useDisplaySync({
    applySnapshot, buildSnapshot, animValuesRef, gradientColorsRef, halftoneTimeRef, reactionDiffusionGridRef,
    lastBroadcastSnapshotRef, syncChannelRef, animSyncChannelRef, setIsDisplayLinkCopied,
  });

  const { gestureActionsRef, goBack, goForward, motionDenied, resetToDefaults, shakeEnabled, tiltEnabled, toggleMotion } = useGestureActions({ applySnapshot, evolveWithFactor, isControlsVisible, redoLastChange, redoStackRef, setAIPrompt, setActiveTab, setIsAutoColor, setIsControlsVisible, setIsMultiFxMode, setTargetAngle, targetAngleRef, toggleVCRPlayback, undoIndexRef, undoLastChange });

  // ALL_EFFECTS, AUDIO_GRADIENTS, AUDIO_EFFECTS now live in
  // constants/gradientEffects.ts.


  // ─── Unified evolve: factor 0 = subtle nudge, 1 = full random ───────────────

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


  // Shuffle Audiovisuals - randomize the Audio Controls panel (sliders +
  // BEAT/FX-on-Beat toggles), matching each control's actual slider range.
  // Leaves Auto Gain untouched — it's a mode switch, not a randomizable range.

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

  // VCR recording/playback effects are now in useVCRPlayback hook

  // Collapse all drawing-relevant state into one memoized object so the drawing
  // useEffect only does a single reference comparison per render instead of 150+.
  const drawParams = useMemo(() => ({
    resolutionMultiplier, gradientType, activeEffects,
    kaleidoscopeSegments, kaleidoscopeRotateSpeed, twistAmount, pixelSize, triangleSize, triangulateVariation, chromaticOffset, 
    grainIntensity, grainType, grainSize, gessoWhiteness, gessoTexture, gessoResponse, blurMotionAmount, blurGaussianAmount, blurRadialAmount,
    blurMotionDirection, blurType, posterizeLevels, halftoneSize, halftoneVariation, halftoneMove,
    halftoneMoveSpeed, halftoneCMYK, bloomIntensity, bloomRadius, feedbackDecay, feedbackZoom, feedbackRotation, vignetteStrength, colorShiftHue, pinchStrength, hexGridSize, linesCount, linesAngle, linesThickness,
    paletteHue, paletteSaturation, paletteBrightness, paletteContrast,
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
    gridVariation, gridHardEdge, gridMode, angleStartOffset, angleCenterX, angleCenterY, angleHardEdge, windmillTightness, windmillRotations,
    windmillThickness, windmillZoom, windmillZoomResponse, windmillMode, shapesSides, shapesCount, shapesMode, concentricRingWidth, concentricRingCount,
    fadeMode, turrellAnimTime, turrellSpeed, turrellGlow,
    stackCount, stackGap, stackWidth, stackLength, stackResponse, hatchLayers, hatchSpacing, hatchResponse, hatchAnimTime, hatchSpeed,
    radialSizeScale, radialHardEdge, radialAnimTime, radialSpeed, noiseScale, noiseOctaves, noiseWarp, noiseType, noiseAnimTime, noiseSpeed,
    radialBurstCount, radialBurstMode, radialBurstSpread, radialBurstSize, voronoiCellCount, voronoiDistortion,
    voronoiAnimTime, helixTurns, helixTightness,
    radarSweepAngle, radarFadeLength,
    flowerCircles, flowerScale, flowerSpread, flowerRotation, flowerSymmetry, flowerOpacity, flowerAnimTime,
    auroraAnimTime, auroraBandCount, auroraWaveSpeed, auroraBandHeight,
    causticsAnimTime, causticsBrightness, causticsScale,
    lavaAnimTime, lavaBlobCount, lavaBlobSize, lavaSpeed,
    marbleAnimTime, marbleVeinFreq, marbleTurbulence, marbleOctaves,
    noiseDirection,
    ditherType, ditherLevels, ditherScale, oilPaintRadius, oilPaintLevels, impastoStrength, impastoLightAngle, watercolorBleed, watercolorGrain, watercolorStyle, dadaPanels, dadaChaos, slitScanIntensity, slitScanDirection, slitScanHistory,
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
    fieldContrast, paletteMode, colorBlend, fieldScale, fieldSpeed, fieldShapeA, fieldShapeB, fieldExposure, fieldTone, fieldGrade, fieldSwirl, paletteStops, paletteBias, paletteSharp, paletteBands, invertAmount, attractorTrailFade, structuralSeed,
    depthLayerEnabled, depthLayerStrength,
    waveInterferenceAnimTime, waveInterferenceSourceCount, waveInterferenceFrequency, waveInterferenceSpeed,
    meshWireframeAnimTime, meshWireframeGridSize, meshWireframeJitter, meshWireframeLineWidth,
  }), [resolutionMultiplier, gradientType, activeEffects, kaleidoscopeSegments, kaleidoscopeRotateSpeed, twistAmount, pixelSize, triangleSize, triangulateVariation, chromaticOffset, grainIntensity, grainType, grainSize, gessoWhiteness, gessoTexture, gessoResponse, blurMotionAmount, blurGaussianAmount, blurRadialAmount, blurMotionDirection, blurType, posterizeLevels, halftoneSize, halftoneVariation, halftoneMove, halftoneMoveSpeed, halftoneCMYK, bloomIntensity, bloomRadius, feedbackDecay, feedbackZoom, feedbackRotation, vignetteStrength, colorShiftHue, paletteHue, paletteSaturation, paletteBrightness, paletteContrast, pinchStrength, hexGridSize, linesCount, linesAngle, linesThickness, dustCrackleColor, dustCrackleIntensity, dustCrackleLength, vhsGlitchIntensity, vhsJitterAmount, crtIntensity, crtScanlineSpacing, waveDistortionStrength, waveDistortionRotation, liquifyStrength, sepiaIntensity, solarizeThreshold, lightLeakIntensity, duotoneIntensity, duotoneColor1, duotoneColor2, duotoneColor3, duotoneThreeColor, digitalNoiseIntensity, gridRotation, gridRows, gridColumns, gridShapeSize, gridCellAngleStep, gridVariation, gridHardEdge, gridMode, angleStartOffset, angleCenterX, angleCenterY, angleHardEdge, windmillTightness, windmillRotations, windmillThickness, windmillZoom, windmillZoomResponse, windmillMode, shapesSides, shapesCount, shapesMode, concentricRingWidth, concentricRingCount, turrellSpeed, turrellGlow, stackCount, stackGap, stackWidth, stackLength, stackResponse, hatchLayers, hatchSpacing, hatchResponse, hatchSpeed, polygon2Sides, radialSizeScale, radialHardEdge, radialSpeed, noiseScale, noiseOctaves, noiseWarp, noiseType, noiseSpeed, radialBurstCount, radialBurstMode, radialBurstSpread, radialBurstSize, voronoiCellCount, voronoiDistortion, helixTurns, helixTightness, radarSweepAngle, radarFadeLength, flowerCircles, flowerScale, flowerSpread, flowerRotation, flowerSymmetry, flowerOpacity, auroraBandCount, auroraWaveSpeed, auroraBandHeight, causticsBrightness, causticsScale, lavaBlobCount, lavaBlobSize, lavaSpeed, marbleVeinFreq, marbleTurbulence, marbleOctaves, noiseDirection, ditherType, ditherLevels, ditherScale, oilPaintRadius, oilPaintLevels, impastoStrength, impastoLightAngle, watercolorBleed, watercolorGrain, watercolorStyle, dadaPanels, dadaChaos, slitScanIntensity, slitScanDirection, slitScanHistory, addGradientStops, isAudioEnabled, isAudioReactive, fadeDirection, fadeMode, radarBeamWidth, chromaticAngle, vignetteSoftness, mirrorMode, mirrorTileCount, metaballCount, metaballSize, metaballSpeed, truchetSize, truchetVariation, truchetThickness, flowParticleCount, flowSpeed, flowScale, flowThickness, attractorPointCount, attractorSpeed, attractorScale, attractorDotSize, particlesCount, particlesSpeed, particlesSize, particlesTrail, particlesGravity, particlesSides, particlesMode, marksCount, marksSize, marksDecay, tilingSize, tilingSymmetry, tilingComplexity, tilingRotation, tilingAnimTime, tilingRowOffset, waveInterferenceAnimTime, waveInterferenceSourceCount, waveInterferenceFrequency, waveInterferenceSpeed, meshWireframeAnimTime, meshWireframeGridSize, meshWireframeJitter, meshWireframeLineWidth, fireworksCount, fireworksParticleCount, fireworksTrailFade, lightningBoltCount, lightningJitter, lightningBranchiness, reactionDiffusionFeed, reactionDiffusionKill, reactionDiffusionSpeed, topographicScale, topographicBands, topographicLineWidth, juliaReal, juliaImaginary, juliaZoom, juliaIterations, auraGlowCount, auraGlowSpeed, auraGlowOpacity, asciiSize, asciiColor, asciiChars, emojiSize, emojiChars, emojiRotateSpeed, liquidStrength, liquidScale, chromaticTrailsDecay, chromaticTrailsOffset, fieldContrast, paletteMode, colorBlend, fieldScale, fieldSpeed, fieldShapeA, fieldShapeB, fieldExposure, fieldTone, fieldGrade, fieldSwirl, paletteStops, paletteBias, paletteSharp, paletteBands, invertAmount, attractorTrailFade, structuralSeed, audioBindings, photoVersion, photoBlendMode, photoOpacity, depthLayerEnabled, depthLayerStrength]);

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
    stackCount, stackGap, stackWidth, stackLength, stackResponse, hatchLayers, hatchSpacing, hatchResponse, hatchSpeed,
    tilingSize, tilingSymmetry, tilingComplexity, tilingRotation, tilingAnimTime, tilingRowOffset,
    waveInterferenceAnimTime, waveInterferenceSourceCount, waveInterferenceFrequency, waveInterferenceSpeed,
    meshWireframeAnimTime, meshWireframeGridSize, meshWireframeJitter, meshWireframeLineWidth,
    fireworksBufferRef, fireworksParticlesRef, fireworksCount, fireworksParticleCount, fireworksTrailFade,
    lightningBufferRef, lightningBoltsRef, lightningBoltCount, lightningJitter, lightningBranchiness,
    attractorScale, attractorDotSize, audioMidsLevel, audioSubBassLevel, audioTrebleLevel, audioEnergy, audioBindings, musicIntensityRef, masterSensitivity, animValuesRef,
    auroraBandCount, auroraBandHeight, auroraWaveSpeed, bassThreshold, bloomIntensity, bloomRadius,
    blurGaussianAmount, blurMotionAmount, blurMotionDirection, blurRadialAmount, blurType, canvasRef,
    causticsBrightness, causticsScale, chromaticAngle, chromaticOffset,
    chromaticTrailsBufferRef, chromaticTrailsDecay, chromaticTrailsOffset, colorShiftHue,
    paletteHue, paletteSaturation, paletteBrightness, paletteContrast, concentricRingCount,
    concentricRingWidth, helixTightness, helixTurns, ditherLevels, ditherType, ditherScale, oilPaintRadius, oilPaintLevels, impastoStrength, impastoLightAngle, watercolorBleed, watercolorGrain, watercolorStyle, dadaPanels, dadaChaos, drawParams,
    auraGlowCount, auraGlowSpeed, auraGlowOpacity,
    fieldContrast, paletteMode, colorBlend, fieldScale, fieldSpeed, fieldShapeA, fieldShapeB, fieldExposure, fieldTone, fieldGrade, fieldSwirl, paletteStops, paletteBias, paletteSharp, paletteBands, invertAmount, attractorTrailFade, structuralSeed,
    depthLayerEnabled, depthLayerStrength,
    drawParamsDirtyRef, drawRef, duotoneColor1, duotoneColor2, duotoneColor3, duotoneIntensity,
    duotoneThreeColor, dustCrackleColor, dustCrackleIntensity, dustCrackleLength, emojiChars, emojiOffsetX, emojiSize,
    emojiSizeVariation, fadeDirection, feedbackBufferRef, feedbackDecay, feedbackRotation, feedbackZoom,
    flowBufferRef, flowParticleCount,
    flowParticlesRef, flowScale, flowThickness, flowerCircles, flowerRotation, flowerSymmetry, flowerOpacity,
    flowerScale, flowerSpread,
    gradientAngle, gradientAngleRef, gradientColors, gradientColorsRef,
    gradientType, grainIntensity, grainType, grainSize, gessoWhiteness, gessoTexture, gessoResponse, gridCellAngleStep, gridColumns, gridRotation, gridRows, gridHardEdge, gridMode,
    gridShapeSize, gridSides, gridVariation, halftoneCMYK, halftoneMove, halftoneSize,
    halftoneTimeRef, halftoneVariation, isAudioEnabled,
    isAudioReactive, isAutoModeRef, isVCRPlayingRef, kaleidoAngleRef, kaleidoscopeRotateSpeed, kaleidoscopeSegments,
    lavaBlobCount, lavaBlobSize, lavaSpeed,
    liquidScale,
    liquidStrength, crtIntensity, crtScanlineSpacing, marbleOctaves, marbleTurbulence, marbleVeinFreq,
    metaballCount, metaballSize, mirrorMode, mirrorTileCount,
    noiseDirection, noiseOctaves, noiseScale, noiseSpeed,
    noiseType, noiseWarp, photoBlendMode, photoImageRef, photoOpacity, pixelSize,
    polygon2Sides, posterizeLevels,
    radarBeamWidth, radarFadeLength, radarSweepAngle, radialBurstCount, radialBurstMode, radialBurstSize, radialBurstSpread,
    radialSizeScale, radialHardEdge, radialSpeed, reactionDiffusionFeed, reactionDiffusionGridRef, reactionDiffusionKill, reactionDiffusionSpeed,
    resolutionMultiplier,
    shapesCount, shapesSides, shapesMode, slitScanBufferRef, slitScanDirection,
    slitScanIntensity, slitScanHistory,
    windmillRotations, windmillThickness, windmillTightness, windmillZoom, windmillZoomResponse, windmillMode, triangleSize, triangulateVariation,
    topographicBands, topographicLineWidth, topographicScale,
    juliaReal, juliaImaginary, juliaZoom, juliaIterations, juliaCanvasRef,
    truchetSize, truchetThickness, truchetVariation, vhsGlitchIntensity, vhsJitterAmount, vignetteSoftness, vignetteStrength,
    voronoiCellCount, voronoiDistortion, waveDistortionRotation, waveDistortionStrength,
    zoom, zoomRef,
  });



  const { handleMouseDown, handleMouseMove, handleMouseUp, handleTouchCancel, handleTouchEnd, handleTouchMove, handleTouchStart, handleWheel } = useCanvasPointer({ activeTab, baseAIColors, canvasRef, exportAsPNG, gestureActionsRef, gradientColors, gradientType, isAutoMode, isDragging, lastChangeTime, lastManualZoomTime, particlesMode, previousPosition, randomColor, setActiveTab, setIsDragging, setTargetAngle, setTargetColors, setTargetZoom, targetAngleRef, targetColorsRef, targetZoomRef });

  // Export animated GIF
  const { isRecordingGif, isFinalizingGif, toggleGifRecording } = useGifExport({ canvasRef });

  // startRecording/stopRecording/toggleVCRRecording/toggleVCRPlayback/handleStop are now in useVCRPlayback hook

  useEffect(() => {
    const currentRef = containerRef.current;
    if (currentRef) {
      const handleFullScreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
          };

      currentRef.addEventListener('fullscreenchange', handleFullScreenChange);
      currentRef.addEventListener('mozfullscreenchange', handleFullScreenChange);
      currentRef.addEventListener('webkitfullscreenchange', handleFullScreenChange);
      currentRef.addEventListener('msfullscreenchange', handleFullScreenChange);

      return () => {
        currentRef.removeEventListener('fullscreenchange', handleFullScreenChange);
        currentRef.removeEventListener('mozfullscreenchange', handleFullScreenChange);
        currentRef.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
        currentRef.removeEventListener('msfullscreenchange', handleFullScreenChange);
      };
    }
  }, []);

  // Preset load effect, savePreset, loadPreset, deletePreset, renamePreset, updatePreset are now in usePresets hook

  // Listen for fullscreen changes (e.g., user pressing ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useGlobalHotkeys({ shuffleAudiovisuals, gradientTypeRef, undoLastChange, redoLastChange, shuffleGradientType, randomizeEffects, setActiveTab, setIsControlsVisible, exportAsPNG, resetToDefaults, toggleVCRRecording, toggleVCRPlayback, setVcrPlaybackSpeed, setRotationDirection, evolveWithFactor, setIsMultiFxMode, isAboutOpen, setIsAboutOpen, activeTab, isControlsVisible, toggleDisplayWindow, setIsAutoShuffleOn, toggleGifRecording, autoShufflePopoverAnchor, setAutoShufflePopoverAnchor, applyGradientLook, goBack, goForward });

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
  // value, never a collision. Same loosely-typed blob convention
  // useSnapshot.ts/useRandomization.ts already use for this exact problem.
  const controlDrawerTabProps = {
    // Color
    isAutoColor, setIsAutoColor, saveCurrentState, setTargetColors, gradientColors, randomColor, applyGradientLook, applyPalette, shuffleColors, keepFamily, setKeepFamily, structuralSeed, setStructuralSeed,
    submittedAIPrompt, setSubmittedAIPrompt, setBaseAIColors, setGradientColors, setColorsInstant, aiPrompt, setAIPrompt,
    isKeywordHelpOpen, setIsKeywordHelpOpen, handleAIPromptSubmit, setIsAIColorPickerOpen,
    paletteHue, setPaletteHue, paletteSaturation, setPaletteSaturation, paletteBrightness, setPaletteBrightness,
    paletteContrast, setPaletteContrast,
    // Gradients
    gradientType, setGradientType, getGradientDisplayName, shuffleGradientType, gridRows, setGridRows, gridColumns, setGridColumns,
    gridCellAngleStep, setGridCellAngleStep, gridHardEdge, setGridHardEdge, gridMode, setGridMode, polygon2Sides, setPolygon2Sides, concentricRingCount, setConcentricRingCount,
    auroraBandCount, setAuroraBandCount, auroraBandHeight, setAuroraBandHeight, auroraWaveSpeed, setAuroraWaveSpeed,
    causticsBrightness, setCausticsBrightness, causticsScale, setCausticsScale, lavaBlobCount, setLavaBlobCount,
    lavaBlobSize, setLavaBlobSize, lavaSpeed, setLavaSpeed, rotationDirection, setRotationDirection, marbleVeinFreq, setMarbleVeinFreq, marbleTurbulence, setMarbleTurbulence,
    marbleOctaves, setMarbleOctaves, metaballCount, setMetaballCount, metaballSize, setMetaballSize,
    metaballSpeed, setMetaballSpeed, truchetSize, setTruchetSize, truchetVariation, setTruchetVariation,
    truchetThickness, setTruchetThickness,
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
    fieldContrast, setFieldContrast, paletteMode, setPaletteMode, colorBlend, fieldScale, fieldSpeed, fieldShapeA, fieldShapeB, fieldExposure, fieldTone, fieldGrade, fieldSwirl, paletteStops, paletteBias, paletteSharp, setColorBlend, setFieldScale, setFieldSpeed, setFieldShapeA, setFieldShapeB, setFieldExposure, setFieldTone, setFieldGrade, setFieldSwirl, setPaletteStops, setPaletteBias, setPaletteSharp, paletteBands, setPaletteBands,
    topographicScale, setTopographicScale, topographicBands, setTopographicBands, topographicLineWidth, setTopographicLineWidth,
    waveInterferenceSourceCount, setWaveInterferenceSourceCount, waveInterferenceFrequency, setWaveInterferenceFrequency, waveInterferenceSpeed, setWaveInterferenceSpeed,
    meshWireframeGridSize, setMeshWireframeGridSize, meshWireframeJitter, setMeshWireframeJitter, meshWireframeLineWidth, setMeshWireframeLineWidth,
    juliaReal, setJuliaReal, juliaImaginary, setJuliaImaginary, juliaZoom, setJuliaZoom, juliaIterations, setJuliaIterations,
    angleStartOffset, setAngleStartOffset, angleCenterX, setAngleCenterX, angleCenterY, setAngleCenterY, angleHardEdge, setAngleHardEdge,
    radialSizeScale, setRadialSizeScale, radialHardEdge, setRadialHardEdge, radialSpeed, setRadialSpeed, concentricRingWidth, setConcentricRingWidth, shapesSides, setShapesSides,
    shapesCount, setShapesCount, shapesMode, setShapesMode, windmillTightness, setWindmillTightness, windmillRotations, setWindmillRotations,
    fadeMode, setFadeMode, turrellSpeed, setTurrellSpeed, turrellGlow, setTurrellGlow,
    stackCount, setStackCount, stackGap, setStackGap, stackWidth, setStackWidth, stackLength, setStackLength, stackResponse, setStackResponse,
    hatchLayers, setHatchLayers, hatchSpacing, setHatchSpacing, hatchResponse, setHatchResponse, hatchSpeed, setHatchSpeed,
    windmillThickness, setWindmillThickness, windmillZoomResponse, windmillMode, setWindmillMode, setWindmillZoomResponse,
    drawParamsDirtyRef, noiseScale, setNoiseScale, noiseOctaves, setNoiseOctaves, noiseDirection, setNoiseDirection,
    noiseWarp, setNoiseWarp, noiseType, setNoiseType, noiseSpeed, setNoiseSpeed,
    radialBurstCount, setRadialBurstCount, radialBurstSpread, setRadialBurstSpread, radialBurstSize, setRadialBurstSize,
    radialBurstMode, setRadialBurstMode, voronoiCellCount, setVoronoiCellCount, voronoiDistortion, setVoronoiDistortion,
    fadeDirection, setFadeDirection, radarFadeLength, setRadarFadeLength, radarBeamWidth, setRadarBeamWidth,
    flowerCircles, setFlowerCircles, flowerScale, setFlowerScale, flowerSpread, setFlowerSpread,
    flowerSymmetry, setFlowerSymmetry, flowerOpacity, setFlowerOpacity, helixTurns, setHelixTurns, helixTightness, setHelixTightness,
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
    invertAmount, setInvertAmount, duotoneColor1, setDuotoneColor1, duotoneColor2, setDuotoneColor2,
    duotoneColor3, setDuotoneColor3, duotoneThreeColor, setDuotoneThreeColor, duotoneIntensity, setDuotoneIntensity,
    gridSides, setGridSides, gridShapeSize, setGridShapeSize, gridVariation, setGridVariation,
    gridRotationDirection, setGridRotationDirection, vhsGlitchIntensity, setVhsGlitchIntensity, vhsJitterAmount, setVhsJitterAmount,
    dustCrackleIntensity, setDustCrackleIntensity, dustCrackleLength, setDustCrackleLength, dustCrackleColor, setDustCrackleColor,
    waveDistortionStrength, setWaveDistortionStrength, waveDistortionRotation, setWaveDistortionRotation,
    slitScanIntensity, setSlitScanIntensity, slitScanHistory, setSlitScanHistory, slitScanDirection, setSlitScanDirection,
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
    audioBindings,
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
    openRecordPopover,
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
    toggleVCRRecording,
  };

  const dock = (
    <div
      data-role="dock"
      className={isMobile ? 'flex-shrink-0 w-full flex flex-col' : 'flex-shrink-0 h-full flex flex-row'}
    >
      {!isMobile && (
        <ControlRail ref={panelRef} {...controlRailProps} />
      )}

      <ControlDrawer
        ref={drawerRef}
        activeTab={activeTab}
        isMobile={isMobile}
        mobileMaxHeight={mobilePanelMaxHeight}
        tabProps={controlDrawerTabProps}
        audioState={audioPanelState}
        audioActions={audioPanelActions}
      />

      {isMobile && (
        <ControlRail ref={panelRef} {...controlRailProps} />
      )}
    </div>
  );

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-black flex"
      style={{ flexDirection: isMobile ? 'column' : 'row' }}
      ref={containerRef}
    >
      {/* Canvas renders full-bleed behind the dock (fixed, out of flex flow)
          so the dock's translucent background genuinely shows the gradient
          through it, instead of just the root's opaque black. */}
      <main ref={shakeWrapperRef} className="fixed inset-0 z-0" aria-label="Gradient canvas">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Animated gradient artwork"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
          onTouchMove={handleTouchMove}
          onWheel={handleWheel}
          className="w-full h-full"
          style={{ touchAction: 'none', opacity: hasRevealed ? 1 : 0, transition: 'opacity 900ms ease-out' }}
        />
      </main>
      {!isMobile && isControlsVisible && <div className="relative z-10 flex-shrink-0">{dock}</div>}
      {/* Pure flex spacer — no content, so it must not intercept pointer
          events. Without pointer-events-none, this (relative, DOM-order
          after the canvas's fixed z-0 wrapper) painted above the canvas
          across the entire non-dock area and silently swallowed every
          click/drag meant for it in desktop layout. */}
      <div className="relative flex-1 min-w-0 min-h-0 pointer-events-none" />
      {isMobile && isControlsVisible && <div className="relative z-10 flex-shrink-0">{dock}</div>}

      {/* Upper Right Controls */}
      <div className={`absolute top-4 right-4 flex flex-col gap-2 pointer-events-auto transition-opacity duration-300 ${isControlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoFileChange}
          className="hidden"
        />
      </div>

      
      {/* First-run hint — floats near wherever the rail currently is
          (railRect), same content/dismiss logic as before, just
          repositioned now that it can't sit inline under the wordmark
          inside a card anymore (the rail is a slim strip with no room for
          it). Hidden while a drawer is open so it can't overlap one. */}
      {savePreview && (
        <div
          role="dialog"
          aria-label="Save image"
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-3 p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.86)' }}
          onClick={() => { URL.revokeObjectURL(savePreview.url); setSavePreview(null); }}
        >
          <img
            src={savePreview.url}
            alt="Your artwork. Press and hold to save it to Photos."
            className="max-w-full object-contain shadow-2xl"
            style={{ maxHeight: 'calc(100% - 120px)' }}
            onClick={(e) => e.stopPropagation()}
          />
          <p className="text-[13px] text-white text-center">Press and hold the image, then tap <span className="font-semibold">Add to Photos</span></p>
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
              <button
                className="px-4 py-2 text-[13px] font-semibold bg-wav-hover text-white"
                onClick={async () => {
                  const file = new File([savePreview.blob], savePreview.name, { type: 'image/png' });
                  try { if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file] }); } catch { /* closed or unsupported */ }
                }}
              >Share…</button>
            )}
            <button
              className="px-4 py-2 text-[13px] font-semibold bg-wav-hover text-white"
              onClick={() => {
                const link = document.createElement('a');
                link.href = savePreview.url;
                link.download = savePreview.name;
                link.click();
              }}
            >Download</button>
            <button
              className="px-4 py-2 text-[13px] font-semibold bg-white text-black"
              onClick={() => { URL.revokeObjectURL(savePreview.url); setSavePreview(null); }}
            >Done</button>
          </div>
        </div>
      )}

      {/* First-run pointer to the wāv button, where the full gesture guide lives. */}
      {showWavHint && !activeTab && !autoShufflePopoverAnchor && !isAboutOpen && railRect && (
        <WavHint isMobile={isMobile} railRect={railRect} onDismiss={dismissWavHint} />
      )}


      {audioFile && (
        <audio
          ref={audioRef}
          src={audioFile}
          loop
        />
      )}

      {/* Auto Shuffle interval popover — single render call site so opening
          it from either trigger (collapsed cluster or expanded top row,
          only one of which is ever mounted+clickable at a time) never
          produces two portaled copies. */}
      <RailPopouts
        mode={popoverMode} anchor={autoShufflePopoverAnchor} popoverRef={autoShufflePopoverRef} isMobile={isMobile}
        setAnchor={setAutoShufflePopoverAnchor}
        exportProps={{ exportSize, setExportSize, exportAspect, setExportAspect, exportAsPNG, copiedKey, copyText, currentPlayerUrl }}
        recordProps={{ videoSize, setVideoSize, videoLength, setVideoLength, isRecording, startVideoTake }}
        autoShuffleProps={{ isAutoShuffleOn, setIsAutoShuffleOn, autoShuffleIntervalSec, setAutoShuffleIntervalSec, autoShuffleScope, setAutoShuffleScope }}
      />

      <NoticeToast />

      {/* Display-link-copied toast — brief confirmation for Shift+P */}
      {isDisplayLinkCopied && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none bg-wav-surface backdrop-blur-sm text-white text-xs px-4 py-2 rounded-full shadow-lg z-50">
          Display link copied — open it in a new tab/window for live output
        </div>
      )}

      {/* About panel. Mobile: a centered floating card, same as any other
          modal — the rail there is a bottom bar, not a side column, so
          there's no "attached to the panel" edge to dock against. Desktop:
          fastened flush against the rail's right edge (no gap), square
          corners (a docked extension of the rail rather than a floating
          card), and stretches from the rail's own top down to the bottom
          of the viewport — same footprint the canvas itself has. The
          click-catcher behind it stays unblurred so the gradient result
          underneath isn't blurred out; only the card itself keeps its own
          surface. */}
      {isAboutOpen && (
        <AboutPanel
          isMobile={isMobile} railRect={railRect} dialogRef={aboutDialogRef} onClose={() => setIsAboutOpen(false)}
          isAutoShuffleOn={isAutoShuffleOn} setIsAutoShuffleOn={setIsAutoShuffleOn}
          autoShuffleIntervalSec={autoShuffleIntervalSec} setAutoShuffleIntervalSec={setAutoShuffleIntervalSec}
          shakeEnabled={shakeEnabled} tiltEnabled={tiltEnabled} toggleMotion={toggleMotion} motionDenied={motionDenied}
        />
      )}

    </div>
  );
}
