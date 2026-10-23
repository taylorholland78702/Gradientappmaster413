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
import { Fragment, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { CaretDown, Eye, EyeSlash, ArrowUUpLeft, ArrowUUpRight, ArrowsClockwise, Shuffle, Gradient, MagicWand, SpeakerHigh, Palette, Camera, Gif, FloppyDisk, Circle, Play, Stop, Rewind, FastForward, ArrowClockwise, Infinity as InfinityIcon, X } from '@phosphor-icons/react';
import { useAudioReactivity } from '../hooks/useAudioReactivity';
import { useVCRPlayback } from '../hooks/useVCRPlayback';
import { useGifExport } from '../hooks/useGifExport';
import { usePresets } from '../hooks/usePresets';
import { useAuth } from '../hooks/useAuth';
import { ControlRail } from './ControlRail';
import { ControlDrawer } from './ControlDrawer';
import { useRandomization } from '../hooks/useRandomization';
import { decodePresetData } from '../utils/presetShare';
import { hslToRgb, hexToRgb, shiftHueByTreble, getActivePaletteMap, samplePalette } from '../utils/color';
import { haptic } from '../utils/haptics';
import { renderLoopToMp4, evenMultiplier, webCodecsAvailable } from '../utils/loopExport';
import { loopRender } from '../hooks/gradients/drawStyleFieldGL';
import { paletteFamily, inFamily, generateFamilyPalette, type Family } from '../utils/colorFamily';
import { encodePresetData } from '../utils/presetShare';
import { formatPalette, embedSnippet, type PaletteFormat, type EmbedKind } from '../utils/shareExport';
import { PALETTE_PRESETS, DARK_GROUND_GRADIENTS, startsDark } from '../constants/palettePresets';
import { useMotionGestures } from '../hooks/useMotionGestures';
import { motionSensorsSupported, requestMotionPermission } from '../utils/motionPermission';
import { GRADIENT_LOOKS, LOOK_DEFAULTS, type GradientLook, type LookParamKey } from '../constants/gradientLooks';
import { useSnapshot } from '../hooks/useSnapshot';
import { useCanvasDraw, exportRender } from '../hooks/useCanvasDraw';
import {
  type ColorRGB, type GradientType, type EffectType,
  DEFAULT_COLORS, DEG_TO_RAD, TWO_PI,
  ID_MIGRATIONS, migrateId, migrateIds,
  WAV_MOODS, GRADIENT_DISPLAY_NAMES, FULL_GRADIENT_TYPES, FEELING_LUCKY_GRADIENT_TYPES,
  ALL_EFFECTS, AUDIO_GRADIENTS, AUDIO_EFFECTS, NO_DRAG_TYPES, STYLE_FIELD_GRADIENT_TYPES,
} from '../constants/gradientEffects';
import { totalCost, resolutionForEffectCost, costOf, MULTI_FX_COST_BUDGET } from '../constants/effectCost';
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
import { useBrushStrokesState } from '../hooks/state/useBrushStrokesState';
import { useWatercolorState } from '../hooks/state/useWatercolorState';
import { useDadaState } from '../hooks/state/useDadaState';
import { useDuotoneState } from '../hooks/state/useDuotoneState';
import { useDustState } from '../hooks/state/useDustState';
import { useEmojiState } from '../hooks/state/useEmojiState';
import { useFadeState } from '../hooks/state/useFadeState';
import { useFeedbackState } from '../hooks/state/useFeedbackState';
import { useFieldMappingState } from '../hooks/state/useFieldMappingState';
import { useFisheyeState } from '../hooks/state/useFisheyeState';
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

import { Kbd } from './Kbd';
import { EffectSection } from './EffectSection';
import { EMOJI_PICKER_CATEGORIES, pickRandomEmojiSet, splitGraphemes } from '../constants/emojiPicker';
import {
  type ExportSize, type ExportAspect, EXPORT_SIZES, EXPORT_ASPECTS,
  type VideoSize, type VideoLength, VIDEO_SIZES, VIDEO_LENGTHS,
  type LoopSeconds, LOOP_LENGTHS, HISTORY_EFFECTS, EXPORT_MAX_EDGE, EXPORT_MAX_PIXELS,
} from '../constants/exportOptions';
import { TOUCH_GESTURES, KEY_GESTURES } from '../constants/gestureGuide';
import { POPOVER_SCALE, type AutoShuffleScope, AUTO_SHUFFLE_SCOPES } from '../constants/autoShuffle';
import { IS_DISPLAY_MODE, IS_STANDALONE_DISPLAY, DISPLAY_SYNC_KEY, DISPLAY_ANIM_SYNC_KEY } from '../constants/displayMode';

// Re-exported so existing importers keep working.
export { EMOJI_PICKER_CATEGORIES, pickRandomEmojiSet, splitGraphemes, EffectSection };

type BlendMode = 'none' | 'double-exposure' | 'screen' | 'multiply' | 'overlay' | 'soft-light' | 'hard-light' | 'difference' | 'exclusion';

// Recording frame interface
interface RecordingFrame {
  colors: ColorRGB[];
  angle: number;
  zoom: number;
  timestamp: number;
}


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
  const { diffusionSpeed, setDiffusionSpeed, diffusionFeed, setDiffusionFeed, diffusionKill, setDiffusionKill, diffusionAnimTrigger, setDiffusionAnimTrigger } = useDiffusionState();
  const { diffusionGridRef } = useDiffusionGridState();
  const { digitalNoiseIntensity, setDigitalNoiseIntensity } = useDigitalNoiseState();
  const { ditherType, setDitherType, ditherLevels, setDitherLevels, ditherScale, setDitherScale } = useDitherState();
  const { oilPaintRadius, setOilPaintRadius, oilPaintLevels, setOilPaintLevels } = useOilPaintState();
  const { impastoStrength, setImpastoStrength, impastoLightAngle, setImpastoLightAngle } = useImpastoState();
  const { brushStrokesSize, setBrushStrokesSize, brushStrokesLength, setBrushStrokesLength } = useBrushStrokesState();
  const { watercolorBleed, setWatercolorBleed, watercolorGrain, setWatercolorGrain, watercolorStyle, setWatercolorStyle } = useWatercolorState();
  const { dadaPanels, setDadaPanels, dadaChaos, setDadaChaos } = useDadaState();
  const { duotoneIntensity, setDuotoneIntensity, duotoneColor1, setDuotoneColor1, duotoneColor2, setDuotoneColor2, duotoneColor3, setDuotoneColor3, duotoneThreeColor, setDuotoneThreeColor } = useDuotoneState();
  const { dustCrackleIntensity, setDustCrackleIntensity, dustSize, setDustSize, dustCrackleLength, setDustCrackleLength, dustCrackleColor, setDustCrackleColor } = useDustState();
  const { emojiSize, setEmojiSize, emojiChars, setEmojiChars, emojiRotateSpeed, setEmojiRotateSpeed, emojiAnimTime, setEmojiAnimTime, emojiOffsetX, setEmojiOffsetX, emojiSizeVariation, setEmojiSizeVariation, emojiPickerSearch, setEmojiPickerSearch } = useEmojiState();
  const { fadeDirection, setFadeDirection, fadeMode, setFadeMode, turrellAnimTime, setTurrellAnimTime, turrellSpeed, setTurrellSpeed, turrellGlow, setTurrellGlow, turrellSmoothRef } = useFadeState();
  const { feedbackDecay, setFeedbackDecay, feedbackZoom, setFeedbackZoom, feedbackRotation, setFeedbackRotation, feedbackBufferRef } = useFeedbackState();
  const { fieldContrast, setFieldContrast, paletteMode, setPaletteMode, paletteBands, setPaletteBands, colorBlend, fieldScale, fieldSpeed, fieldShapes, fieldExposure, fieldTone, fieldGrade, fieldSwirl, paletteStops, paletteBias, paletteSharp, setColorBlend, setFieldScale, setFieldSpeed, setFieldShapes, setFieldExposure, setFieldTone, setFieldGrade, setFieldSwirl, setPaletteStops, setPaletteBias, setPaletteSharp } = useFieldMappingState();
  const { fisheyeStrength, setFisheyeStrength, fisheyeCenterX, setFisheyeCenterX, fisheyeCenterY, setFisheyeCenterY } = useFisheyeState();
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
  const { kaleidoscopeSegments, setKaleidoscopeSegments, kaleidoscopeReflections, setKaleidoscopeReflections, kaleidoscopeRotateSpeed, setKaleidoscopeRotateSpeed } = useKaleidoscopeState();
  const { lavaAnimTime, setLavaAnimTime, lavaBlobCount, setLavaBlobCount, lavaBlobSize, setLavaBlobSize, lavaSpeed, setLavaSpeed } = useLavaState();
  const { lightLeakIntensity, setLightLeakIntensity } = useLightLeakState();
  const { linesCount, setLinesCount, linesAngle, setLinesAngle, linesThickness, setLinesThickness } = useLinesState();
  const { liquidAnimTime, setLiquidAnimTime, liquidStrength, setLiquidStrength, liquidScale, setLiquidScale } = useLiquidState();
  const { crtIntensity, setCrtIntensity, crtScanlineSpacing, setCrtScanlineSpacing } = useCrtState();
  const { liquifyStrength, setLiquifyStrength } = useLiquifyState();
  const { marbleAnimTime, setMarbleAnimTime, marbleVeinFreq, setMarbleVeinFreq, marbleTurbulence, setMarbleTurbulence, marbleOctaves, setMarbleOctaves } = useMarbleState();
  const { metaballAnimTime, setMetaballAnimTime, metaballCount, setMetaballCount, metaballSize, setMetaballSize, metaballSpeed, setMetaballSpeed } = useMetaballState();
  const { mirrorMode, setMirrorMode, mirrorTileCount, setMirrorTileCount } = useMirrorState();
  const { lastBroadcastSnapshotRef, syncChannelRef, animSyncChannelRef, animValuesRef, isDragging, setIsDragging, lastChangeTime, previousPosition, gradientType, setGradientType, resolutionMultiplier, setResolutionMultiplier, zoomBeatEnabled, setZoomBeatEnabled, shakeBeatEnabled, setShakeBeatEnabled, contrastBeatEnabled, setContrastBeatEnabled, paletteBeatEnabled, setPaletteBeatEnabled, isRecording, setIsRecording, isAutoMode, setIsAutoMode, isAutoColor, setIsAutoColor, gradientColors, setGradientColors, targetColors, setTargetColors, gradientAngle, setGradientAngle, targetAngle, setTargetAngle, zoom, setZoom, targetZoom, setTargetZoom, gradientColorsRef, gradientAngleRef, zoomRef, targetColorsRef, targetAngleRef, targetZoomRef, vcrPlaybackSpeedRef, isAutoModeRef, rotationDirectionRef, isVCRPlayingRef, isAudioActiveRef, drawParamsDirtyRef, lerpSyncFrameRef, isControlsVisible, setIsControlsVisible, isAboutOpen, setIsAboutOpen, isDisplayLinkCopied, setIsDisplayLinkCopied, rotationDirection, setRotationDirection, isDropdownOpen, setIsDropdownOpen, isMultiFxMode, setIsMultiFxMode, collapsedEffects, setCollapsedEffects, wavRandomGradient, setWavRandomGradient, isAIPromptOpen, setIsAIPromptOpen, isUploadDropdownOpen, setIsUploadDropdownOpen, aiPrompt, setAIPrompt, submittedAIPrompt, setSubmittedAIPrompt, containerRef, activeEffects, setActiveEffects, isExportDropdownOpen, setIsExportDropdownOpen, showWavHint, setShowWavHint, isGradientsOpen, setIsGradientsOpen, isEffectsOpen, setIsEffectsOpen, activeTab, setActiveTab, isAIColorPickerOpen, setIsAIColorPickerOpen, isKeywordHelpOpen, setIsKeywordHelpOpen, concentricRingWidth, setConcentricRingWidth, concentricRingCount, setConcentricRingCount, scanType, setScanType, isEmojiPickerOpen, setIsEmojiPickerOpen, baseAIColors, setBaseAIColors, showRatingUI, setShowRatingUI, ratedResults, setRatedResults, pendingRatingState, setPendingRatingState, fileInputRef, isFullscreen, setIsFullscreen, lastManualZoomTime, kaleidoAngleRef, isAutoColorRef, contrastPulseRef, saturationPulseRef, shakeRef, shakeWrapperRef, activeEffectsRef, gradientTypeRef } = useMiscState();
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
  const { pixelSize, setPixelSize, pixelateScaleDirection, setPixelateScaleDirection } = usePixelState();
  const { polygon2Sides, setPolygon2Sides } = usePolygon2State();
  const { posterizeLevels, setPosterizeLevels, posterizeSolarize, setPosterizeSolarize } = usePosterizeState();
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
  const { voronoiCellCount, setVoronoiCellCount, voronoiDistortion, setVoronoiDistortion, voronoiMorphSpeed, setVoronoiMorphSpeed, voronoiAnimTime, setVoronoiAnimTime } = useVoronoiState();
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
  // A phone photo commonly runs 4000-8000px on the long edge — used at
  // native resolution, applyPhoto.ts's ctx.drawImage() call would composite
  // that many source pixels into the effect stack every single frame
  // regardless of what's actually visible on screen. Downscaling once here
  // (rather than leaving it to whatever the browser's drawImage
  // downsampling does per-frame) caps that cost permanently at upload time.
  // MAX_DIMENSION is comfortably above typical display resolution (most
  // screens/canvases stay under ~2560px on their long edge even at 2x DPR)
  // while still a small fraction of what a modern camera produces.
  const MAX_PHOTO_DIMENSION = 2048;
  // Shared by both entry points — the hidden file-input's onChange and the
  // canvas's onDrop — so drag-and-drop isn't a second, divergent upload
  // path with its own bugs.
  const loadPhotoFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.width <= MAX_PHOTO_DIMENSION && img.height <= MAX_PHOTO_DIMENSION) {
        photoImageRef.current = img;
        setPhotoVersion(v => v + 1);
        return;
      }
      const scale = MAX_PHOTO_DIMENSION / Math.max(img.width, img.height);
      const scaledCanvas = document.createElement('canvas');
      scaledCanvas.width = Math.max(1, Math.round(img.width * scale));
      scaledCanvas.height = Math.max(1, Math.round(img.height * scale));
      const scaledCtx = scaledCanvas.getContext('2d');
      if (!scaledCtx) {
        // Fall back to the native-resolution image rather than dropping
        // the upload entirely — this path should be unreachable in any
        // real browser, but a slow frame beats a silently-ignored upload.
        photoImageRef.current = img;
        setPhotoVersion(v => v + 1);
        return;
      }
      scaledCtx.drawImage(img, 0, 0, scaledCanvas.width, scaledCanvas.height);
      photoImageRef.current = scaledCanvas;
      setPhotoVersion(v => v + 1);
    };
    img.src = url;
    setPhotoFileName(file.name);
    // Auto-activate the Photo effect so a drop (or a picker upload) shows
    // up immediately instead of needing a separate trip to the Effects tab
    // to turn it on — in Multi-FX mode it's added alongside whatever's
    // already active (if the cost budget allows), otherwise it becomes the
    // sole active effect like any other single-FX selection.
    setActiveEffects(prev => {
      if (prev.includes('photo')) return prev;
      if (isMultiFxMode) {
        return totalCost(prev) + costOf('photo') > MULTI_FX_COST_BUDGET ? prev : [...prev, 'photo'];
      }
      return ['photo'];
    });
  }, [isMultiFxMode]);
  const handlePhotoFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadPhotoFile(file);
  }, [loadPhotoFile]);
  // Window-level drag-and-drop rather than a handler on one specific
  // element — a React onDrop/onDragOver pair scoped to the canvas wrapper
  // div wasn't reliably catching the browser's default action (dropping a
  // file anywhere the listener wasn't attached, or during the split second
  // before an event finished bubbling, fell through to the browser's own
  // "navigate to this file" behavior instead of being caught). Listening
  // on window and preventing default on EVERY dragover unconditionally
  // (not just when a file is present) is what actually suppresses that
  // reliably — matches the standard pattern for whole-page drop zones.
  useEffect(() => {
    const onDragOver = (e: DragEvent) => e.preventDefault();
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer?.files?.[0];
      if (file) loadPhotoFile(file);
    };
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', onDrop);
    };
  }, [loadPhotoFile]);

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

  // Minimum time between color changes (in milliseconds)
  const CHANGE_INTERVAL = 300;

  // Helper function to calculate slider progress percentage
  const getSliderStyle = (value: number, min: number, max: number) => {
    const percentage = ((value - min) / (max - min)) * 100;
    return { '--slider-progress': `${percentage}%` } as React.CSSProperties;
  };

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
    audioFile, setAudioFile,
    audioFileName, setAudioFileName,
    audioFileMetadata, setAudioFileMetadata,
    waveformData, setWaveformData,
    isAudioReactive, setIsAudioReactive,
    isMicActive, setIsMicActive,
    micError, setMicError,
    audioSubBassLevel, setAudioSubBassLevel,
    audioMidsLevel, setAudioMidsLevel,
    audioTrebleLevel, setAudioTrebleLevel,
    audioEnergy, setAudioEnergy,
    subBassOnsetTick,
    bassOnsetTick,
    musicIntensityRef,
    audioInputDevices, setAudioInputDevices,
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
    bpm, setBpm,
    bassOpen, setBassOpen,
    midsOpen, setMidsOpen,
    trebleOpen, setTrebleOpen,
    bassFlash, setBassFlash,
    midsFlash, setMidsFlash,
    trebleFlash, setTrebleFlash,
    bpmFlash, setBpmFlash,
    liveBassLevel, setLiveBassLevel,
    liveMidsLevel, setLiveMidsLevel,
    liveTrebleLevel, setLiveTrebleLevel,
    isAudiovisualsOpen, setIsAudiovisualsOpen,
    isAudioControlsOpen, setIsAudioControlsOpen,
    audioReactiveColors, setAudioReactiveColors,
    audioRef,
    analyserRef,
    analyzeAudioRef,
    audioContextRef,
    streamRef,
    handleFileUpload,
    startMicVisualization,
    stopMicVisualization,
    toggleAudio,
    initAudioContext,
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
    isVCRRecording, setIsVCRRecording,
    isVCRPlaying, setIsVCRPlaying,
    vcrRecordedFrames, setVcrRecordedFrames,
    vcrPlaybackSpeed, setVcrPlaybackSpeed,
    vcrPlaybackIndex, setVcrPlaybackIndex,
    vcrRecordingStartTime,
    vcrPlaybackStartTime,
    mediaRecorderRef,
    recordedChunksRef,
    recordingAnimationRef,
    recordCanvasRef,
    startRecording,
    stopRecording,
    toggleVCRRecording,
    toggleVCRPlayback,
    handleStop,
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
    applyPresetData: (data: any) => {
      applySnapshot({
        ...data,
        gradientType: data.gradientType ? migrateId(data.gradientType) : 'angle',
        activeEffects: migrateIds(data.activeEffects),
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

  // Load a shared preset from ?preset=<encoded> if present (see
  // PresetsPanel's "Copy shareable link" button, and its "Open Standalone
  // Player" button which adds &display=1 to the same link). The full
  // snapshot is embedded directly in the URL rather than looked up from
  // Firestore — this app doesn't control its own Firestore security rules
  // from the client, so a new public collection can't be assumed readable
  // by other users. Runs once on mount; strips the param afterward so a
  // reload doesn't keep re-applying it (and so undo/redo/edits aren't
  // fighting a giant URL sitting in the address bar). Used to bail out
  // entirely in Display mode — now it's exactly how standalone playback
  // gets its frozen state, so it only skips when there's no preset to load.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('preset');
    if (!encoded) return;
    try {
      const data = decodePresetData(encoded) as Record<string, any>;
      applySnapshot({
        ...data,
        gradientType: data.gradientType ? migrateId(data.gradientType) : 'angle',
        activeEffects: migrateIds(data.activeEffects),
      });
      // Same instant-snap as applyPresetData above — see that comment.
      const restoredColors = data.gradientColors || DEFAULT_COLORS;
      gradientColorsRef.current = restoredColors.map((c: ColorRGB) => ({ ...c }));
      gradientAngleRef.current = data.gradientAngle ?? 45;
      zoomRef.current = data.zoom ?? 1;
      // Standalone playback has no controller to press Play — Auto Mode
      // is what drives every self-animating gradient's clock (see the
      // IS_STANDALONE_DISPLAY checks throughout the draw loop and the
      // per-gradient anim-time effects below), so turn it on here instead.
      if (IS_DISPLAY_MODE) setIsAutoMode(true);
    } catch (err) {
      if (import.meta.env.DEV) console.warn('Failed to load shared preset from URL:', err);
    }
    params.delete('preset');
    const newSearch = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    isPresetModalOpen, setIsPresetModalOpen,
    presetName, setPresetName,
    savedPresets, setSavedPresets,
    renamingPresetId, setRenamingPresetId,
    renamingPresetValue, setRenamingPresetValue,
    isPresetsDropdownOpen, setIsPresetsDropdownOpen,
    openNewPresetSignal, setOpenNewPresetSignal,
    folderNames,
    savePreset,
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

  // Sync --slider-pct CSS var so the purple-pink fill tracks the thumb position
  useEffect(() => {
    const update = (el: HTMLInputElement) => {
      const min = Number(el.min) || 0;
      const max = Number(el.max) || 100;
      const pct = ((Number(el.value) - min) / (max - min)) * 100;
      el.style.setProperty('--slider-pct', `${Math.max(0, Math.min(100, pct))}%`);
    };
    const initAll = () =>
      document.querySelectorAll<HTMLInputElement>('input[type="range"]').forEach(update);

    // Update on every input event (range drag or keyboard on range)
    const onInput = (e: Event) => { if ((e.target as HTMLElement).matches('input[type="range"]')) update(e.target as HTMLInputElement); };
    document.addEventListener('input', onInput);

    // New sliders appearing (conditional renders / dropdowns opening) are
    // already covered by the deps-less effect below, which re-syncs every
    // range input after every render — no need for a separate
    // document-wide MutationObserver duplicating that on top of it (that
    // used to fire a full-document querySelectorAll on any DOM mutation
    // anywhere in the app, not just slider-related ones).
    initAll();
    return () => {
      document.removeEventListener('input', onInput);
    };
  }, []);

  // Re-sync all range fills after every render (catches number-input keyboard changes
  // that update React state → re-render the range value but fire no DOM input event)
  useEffect(() => {
    document.querySelectorAll<HTMLInputElement>('input[type="range"]').forEach(el => {
      const min = Number(el.min) || 0;
      const max = Number(el.max) || 100;
      const pct = ((Number(el.value) - min) / (max - min)) * 100;
      el.style.setProperty('--slider-pct', `${Math.max(0, Math.min(100, pct))}%`);
    });
  });

  // Beat sync effects are now in useAudioReactivity hook via callbacks

  // Audio reactivity and mic functions are now in useAudioReactivity hook

  // Keep target/mode refs in sync with state so the master RAF loop can read them without restarts.
  useEffect(() => { targetColorsRef.current = targetColors; }, [targetColors]);
  useEffect(() => { targetAngleRef.current = targetAngle; }, [targetAngle]);
  useEffect(() => { targetZoomRef.current = targetZoom; }, [targetZoom]);
  // gridRotation/radarSweepAngle/voronoiAnimTime/flowerAnimTime/tilingAnimTime:
  // same pattern as targetAngleRef above — the main loop now writes these
  // directly into animValuesRef every frame instead of calling setState (see
  // the loop below), so state only changes from EXTERNAL setters (shuffle
  // randomization, snapshot/undo restore) or the loop's own periodic
  // ref→state sync (every 15 frames, for UI/snapshot freshness). Either way
  // this effect only fires a few times a second, not 60x/sec, and syncing
  // the ref back to a value it may already hold (when triggered by the
  // loop's own periodic sync) is a harmless no-op, not a feedback loop.
  useEffect(() => { animValuesRef.current.gridRotation = gridRotation; }, [gridRotation]);
  useEffect(() => { animValuesRef.current.radarSweepAngle = radarSweepAngle; }, [radarSweepAngle]);
  useEffect(() => { animValuesRef.current.voronoiAnimTime = voronoiAnimTime; }, [voronoiAnimTime]);
  useEffect(() => { animValuesRef.current.flowerAnimTime = flowerAnimTime; }, [flowerAnimTime]);
  useEffect(() => { animValuesRef.current.tilingAnimTime = tilingAnimTime; }, [tilingAnimTime]);
  useEffect(() => { vcrPlaybackSpeedRef.current = vcrPlaybackSpeed; }, [vcrPlaybackSpeed]);
  useEffect(() => { isAutoModeRef.current = isAutoMode; }, [isAutoMode]);
  useEffect(() => { rotationDirectionRef.current = rotationDirection; }, [rotationDirection]);
  useEffect(() => { isAutoColorRef.current = isAutoColor; }, [isAutoColor]);
  useEffect(() => { isVCRPlayingRef.current = isVCRPlaying; }, [isVCRPlaying]);

  useEffect(() => { isAudioActiveRef.current = isAudioEnabled && isAudioReactive; }, [isAudioEnabled, isAudioReactive]);


  // When mic activates on spiral (Windmill), freeze target colors so the lerp loop doesn't drift colors
  useEffect(() => {
    if (isMicActive && gradientType === 'windmill') {
      setTargetColors([...gradientColorsRef.current]);
    }
  }, [isMicActive, gradientType]);

  // Master animation RAF — lerps animated refs and calls drawRef imperatively.
  // Zero React state changes per frame; state syncs at ~20fps for undo/VCR.
  // Skips the draw entirely when nothing is animating and values have converged.
  // Refs so animation loops can read latest audio values without restarting
  const audioSubBassLevelRef = useRef(audioSubBassLevel);
  audioSubBassLevelRef.current = audioSubBassLevel;
  const audioMidsLevelRef = useRef(audioMidsLevel);
  audioMidsLevelRef.current = audioMidsLevel;
  const lastReseedTimeRef = useRef(0);
  // Real bug found via the (now-removed) debug overlay: the mobile panel's height
  // cap used CSS `70dvh`, but this app never triggers a native document
  // scroll (everything scrolls inside this one fixed internal panel), which
  // is normally what prompts Safari to recalculate dvh as its toolbar
  // shows/hides. With no such scroll ever happening, the toolbar can stay
  // expanded while dvh remains sized for the toolbar-collapsed state — so
  // the panel's own content genuinely fit within its own (too-generous)
  // height cap (scrollHeight === clientHeight, confirmed via the debug
  // overlay), while visually extending past the actually-visible screen.
  // There was nothing to scroll; the cap itself was just wrong.
  // window.visualViewport.height doesn't have this staleness problem — it
  // updates live as the toolbar shows/hides regardless of page scrolling —
  // so it drives the cap instead of the dvh unit.
  const [visualViewportHeight, setVisualViewportHeight] = useState(() =>
    typeof window !== 'undefined' ? (window.visualViewport?.height ?? window.innerHeight) : 800
  );
  useEffect(() => {
    if (!isMobile || typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;
    const onResize = () => {
      setVisualViewportHeight(vv.height);
    };
    vv.addEventListener('resize', onResize);
    vv.addEventListener('scroll', onResize);
    onResize();
    return () => {
      vv.removeEventListener('resize', onResize);
      vv.removeEventListener('scroll', onResize);
    };
  }, [isMobile]);
  // The mobile drawer isn't scaled (unlike its desktop counterpart's
  // scale-[1.15]), so this targets the visible height directly with no
  // divisor. Dropped from 0.7 to 0.55 of visible height for a much bigger
  // safety margin — on-device testing kept showing content visually
  // crowding the bottom edge even when scrollHeight didn't (yet) exceed
  // clientHeight, so this trades some drawer size for headroom rather than
  // continuing to chase the exact pixel-perfect budget on a device this
  // can't directly inspect.
  const mobilePanelMaxHeight = Math.floor(visualViewportHeight * 0.55);

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

  useEffect(() => {
    let rafId: number;
    let lastFrameTime = performance.now();
    const loop = () => {
      const now = performance.now();
      // Every per-frame constant below (0.025, 0.1, 0.5, 2, 0.03125, etc.)
      // was originally tuned assuming a steady 60fps tick, so motion speed
      // silently varied with actual frame rate — faster on a 120Hz display,
      // slower under load. dtScale converts real elapsed time into "how
      // many 60fps-frame-equivalents this tick represents" so multiplying
      // any of those constants by it keeps speed constant regardless of
      // frame rate, while leaving every tuned value unchanged at a steady
      // 60fps (dtScale ≈ 1 there). Clamped to 3 so a long stall — tab
      // backgrounded, GC pause — doesn't cause a single catastrophic jump
      // when the loop resumes; it just catches up over a few frames instead.
      const dtScale = Math.min(3, Math.max(0, (now - lastFrameTime) / (1000 / 60)));
      lastFrameTime = now;

      // Drive the audio-analysis tick from this same loop instead of it
      // self-scheduling its own requestAnimationFrame (see analyzeAudioRef's
      // declaration in useAudioReactivity.ts) — one rAF registration and one
      // clock for both draw and analysis instead of two independently-timed
      // ones. Called first so any freshly-analyzed levels this tick (bass,
      // mids, treble, zoom pulses, etc.) are available to the draw-related
      // logic below in the same frame rather than lagging by one.
      analyzeAudioRef.current?.();

      const spd = vcrPlaybackSpeedRef.current;

      // Lerp colors directly in ref, track max channel diff for convergence check.
      // Skipped in Display mode — that ref is instead written directly from the
      // controller's live value every frame (see the anim-sync receiver below),
      // since this ~2-second ease was previously always restarting from the
      // Display tab's own stale ref position instead of tracking the
      // controller's actual current color.
      const colors = gradientColorsRef.current;
      const targets = targetColorsRef.current;
      let maxColorDiff = 0;
      // Longer, more overlapping cross-fade while auto-shuffle is running —
      // see isAutoShuffleOnRef above.
      const fadeMultiplier = isAutoShuffleOnRef.current ? 0.25 : 1;
      if (!IS_DISPLAY_MODE) {
        // Clamped to 1 — a lerp rate above 1 overshoots past the target
        // instead of easing toward it, which dtScale could otherwise
        // produce during a low-frame-rate stretch (dtScale > 1).
        const colorSpd = Math.min(1, 0.025 * spd * fadeMultiplier * dtScale);
        for (let i = 0; i < colors.length; i++) {
          const c = colors[i];
          const t = targets[i];
          if (!c || !t) continue;
          const nr = c.r + (t.r - c.r) * colorSpd;
          const ng = c.g + (t.g - c.g) * colorSpd;
          const nb = c.b + (t.b - c.b) * colorSpd;
          colors[i] = (isNaN(nr) || isNaN(ng) || isNaN(nb)) ? t : { r: nr, g: ng, b: nb };
          maxColorDiff = Math.max(maxColorDiff, Math.abs(t.r - nr), Math.abs(t.g - ng), Math.abs(t.b - nb));
        }
      }

      const angleDiff = Math.abs(targetAngleRef.current - gradientAngleRef.current);
      const angleSpd = Math.min(1, 0.1 * spd * fadeMultiplier * dtScale);
      gradientAngleRef.current += (targetAngleRef.current - gradientAngleRef.current) * angleSpd;

      const zoomSpd = Math.min(1, (isAutoModeRef.current ? 0.1 : 0.3) * spd * fadeMultiplier * dtScale);
      const zoomDiff = Math.abs(targetZoomRef.current - zoomRef.current);
      zoomRef.current += (targetZoomRef.current - zoomRef.current) * zoomSpd;

      // Skip draw when idle: nothing is actively animating and all values have settled.
      // Reaction-Diffusion/Fireworks/Lightning are standing exceptions — each is a live
      // simulation that keeps evolving on its own (feed/kill drift and perpetual
      // sprinkling for Reaction-Diffusion; spawning/aging particles or bolts into a
      // persistent fading buffer for the other two) rather than easing toward a fixed
      // target, so without this they'd only ever get the handful of draw calls needed
      // for colors/angle/zoom to converge and then freeze solid — the sim being alive
      // under the hood is meaningless if this loop stops calling draw() at all.
      const isAnimating = isAutoModeRef.current || isVCRPlayingRef.current || isAudioActiveRef.current
        || gradientTypeRef.current === 'reaction-diffusion' || gradientTypeRef.current === 'fireworks' || gradientTypeRef.current === 'lightning';
      const hasConverged = maxColorDiff < 0.5 && angleDiff < 0.05 && zoomDiff < 0.001;

      if (isAnimating || !hasConverged || drawParamsDirtyRef.current) {
        // A throw here (e.g. from a malformed preset value) must not kill the
        // rest of this function — requestAnimationFrame(loop) below is what
        // keeps the animation alive, and an uncaught exception would skip it,
        // permanently freezing the canvas until a full page reload.
        try {
          drawRef.current();
        } catch (err) {
          console.error('Draw failed, will retry next frame:', err);
        }
        if (hasConverged && !isAnimating) drawParamsDirtyRef.current = false;
      }

      // Sync back to state every 15 frames (~4fps) for undo snapshots.
      // The canvas itself reads live values straight from refs (see drawRef), so this
      // sync is only for keeping React state fresh for buildSnapshot/undo — it does not
      // need to run at animation framerate, and doing so was forcing a full re-render of
      // the entire panel tree ~20x/sec during any animation, causing jank on lower-end GPUs.
      lerpSyncFrameRef.current++;
      if (lerpSyncFrameRef.current % 15 === 0) {
        setGradientColors([...gradientColorsRef.current]);
        setGradientAngle(gradientAngleRef.current);
        setZoom(zoomRef.current);
        // targetAngle/gridRotation/radarSweepAngle/voronoiAnimTime/
        // flowerAnimTime/tilingAnimTime: same batched sync, now that the
        // blocks below write these into their refs directly every frame
        // instead of calling setState. One frame of staleness here (these
        // refs update later in this same loop iteration) is negligible at
        // 15-frame granularity.
        setTargetAngle(targetAngleRef.current);
        setGridRotation(animValuesRef.current.gridRotation);
        setRadarSweepAngle(animValuesRef.current.radarSweepAngle);
        setVoronoiAnimTime(animValuesRef.current.voronoiAnimTime);
        setFlowerAnimTime(animValuesRef.current.flowerAnimTime);
        setTilingAnimTime(animValuesRef.current.tilingAnimTime);
        setWaveInterferenceAnimTime(animValuesRef.current.waveInterferenceAnimTime);
        setMeshWireframeAnimTime(animValuesRef.current.meshWireframeAnimTime);
      }

      // Halftone Move animation. The trigger still fires on both windows (it's
      // just a redraw nudge), but the actual halftoneTimeRef VALUE is only
      // ever advanced on the controller — Display's copy is overwritten by
      // the anim-sync receiver below instead, so both windows show the same
      // dot phase instead of two independently-advancing clocks.
      if (activeEffectsRef.current.includes('halftone') && halftoneMoveRef.current) {
        if (!IS_DISPLAY_MODE || IS_STANDALONE_DISPLAY) halftoneTimeRef.current += 0.5 * spd * dtScale;
        // Was setHalftoneAnimTrigger(prev => prev + 1) — a setState-every-
        // frame redraw nudge. drawParamsDirtyRef is the same nudge without
        // the re-render cost; the main loop already checks it below.
        drawParamsDirtyRef.current = true;
      }

      // Grid rotation animation. Skipped in Display mode; see the Voronoi
      // comment above — that value is pushed from the controller instead.
      if ((!IS_DISPLAY_MODE || IS_STANDALONE_DISPLAY) && activeEffectsRef.current.includes('grid-effect') && gridRotationDirectionRef.current !== 'none') {
        const increment = (gridRotationDirectionRef.current === 'clockwise' ? 2 : -2) * dtScale;
        animValuesRef.current.gridRotation = (animValuesRef.current.gridRotation + increment) % 360;
      }

      // Slit-scan animation — no real per-frame value to advance (the
      // actual frame buffer lives in slitScanBufferRef), this was purely a
      // redraw nudge. drawParamsDirtyRef is the same nudge without the
      // setState-every-frame cost — the main loop already checks it below.
      if (activeEffectsRef.current.includes('slit-scan')) {
        drawParamsDirtyRef.current = true;
      }

      const isPlayActive = isAutoModeRef.current || isVCRPlayingRef.current || isMicActiveRef.current;

      // Voronoi morphing — PLAY or mic active. Skipped in Display mode:
      // that clock is pushed from the controller instead, so both windows
      // stay frame-locked rather than drifting apart over time.
      if ((!IS_DISPLAY_MODE || IS_STANDALONE_DISPLAY) && gradientTypeRef.current === 'voronoi' && isPlayActive) {
        animValuesRef.current.voronoiAnimTime += 0.01 * (isAutoModeRef.current || isVCRPlayingRef.current ? spd : 1) * dtScale;
      }

      // Auto-rotate the gradient angle — PLAY active. Ticks every frame (like the radar
      // sweep below) instead of jumping once per 800ms: a big jump followed by the lerp
      // catching up in ~100ms meant the gradient sat still for most of every 800ms window,
      // which reads as stepped/incremental motion no matter how fast the draw call is.
      // Skipped in Display mode; see the Voronoi comment above — targetAngle is pushed
      // from the controller instead, so both windows converge on the same rotation
      // instead of each advancing their own independently and drifting apart (this was
      // the actual cause of the Display tab's angle/pattern slowly falling out of sync).
      if ((!IS_DISPLAY_MODE || IS_STANDALONE_DISPLAY) && isAutoModeRef.current) {
        let rotationAmountPerFrame;
        rotationAmountPerFrame = rotationDirectionRef.current === 'clockwise' ? 0.03125 : -0.03125;
        // audioMidsLevel's natural range depends on the Mids multiplier
        // slider (0-5) and master sensitivity, not a fixed 0-1 — clamping
        // to 1 here keeps the speed boost within its documented "up to 3x"
        // intent regardless of how those are set, instead of autonomous
        // rotation occasionally spinning up to 20x+ on loud mids content.
        // Was up to 5x — loud mids-heavy passages spun the gradient hard
        // enough to feel out of control rather than reactive, so this is
        // capped lower.
        const midsBoost = isAudioActiveRef.current ? 1 + Math.min(1, audioMidsLevelRef.current) * 2 : 1;
        // These types rotate at 2x across every speed step. (Noise and Radial are
        // intentionally excluded — neither uses the rotation angle at all, so there's
        // no existing motion for them to speed up; see conversation for details.)
        const doubleSpeedTypes = ['angle', 'fade', 'radial-burst'];
        const isWindmillHelixMode = gradientTypeRef.current === 'windmill' && windmillModeRef.current === 'helix';
        const angleSpeedBoost = (doubleSpeedTypes.includes(gradientTypeRef.current) || isWindmillHelixMode) ? 2 : 1;
        targetAngleRef.current += rotationAmountPerFrame * spd * angleSpeedBoost * midsBoost * dtScale;
      }

      // Radar sweep — PLAY or mic active. Skipped in Display mode; see the
      // Voronoi comment above — that value is pushed from the controller instead.
      // Folded into Radial Burst as radialBurstMode === 'sweep'.
      if ((!IS_DISPLAY_MODE || IS_STANDALONE_DISPLAY) && gradientTypeRef.current === 'radial-burst' && radialBurstModeRef.current === 'sweep' && isPlayActive) {
        const baseSpeed = isAutoModeRef.current || isVCRPlayingRef.current ? 2 * spd : 1.2;
        const audioBoost = isAudioActiveRef.current ? audioSubBassLevelRef.current * 6 : 0;
        animValuesRef.current.radarSweepAngle = (animValuesRef.current.radarSweepAngle + (baseSpeed + audioBoost) * dtScale) % 360;
      }

      // Flower rotation — only when PLAY is active. Skipped in Display
      // mode; see the Voronoi comment above.
      if ((!IS_DISPLAY_MODE || IS_STANDALONE_DISPLAY) && gradientTypeRef.current === 'flower' && (isAutoModeRef.current || isVCRPlayingRef.current)) {
        animValuesRef.current.flowerAnimTime += 0.5 * spd * dtScale;
      }

      // Tiling rotation — only while the playhead is engaged (PLAY or
      // Auto mode), same gating as Flower above. Adds on top of the
      // static tilingRotation slider rather than replacing it.
      if ((!IS_DISPLAY_MODE || IS_STANDALONE_DISPLAY) && gradientTypeRef.current === 'tiling' && (isAutoModeRef.current || isVCRPlayingRef.current)) {
        animValuesRef.current.tilingAnimTime += 0.3 * spd * dtScale;
      }

      rafId = requestAnimationFrame(loop);
    };
    // Explicitly stop scheduling new frames while the tab is backgrounded
    // instead of just leaving it to the browser's own rAF throttling —
    // that throttling still burns some CPU/battery on a hidden tab (and
    // varies by browser), whereas cancelling here stops it completely.
    // lastFrameTime is reset on resume so dtScale doesn't have to eat a
    // multi-second gap on the very next frame — it's already clamped to 3
    // so this isn't required for correctness, just avoids the pointless
    // computation.
    let isPaused = false;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isPaused = true;
        cancelAnimationFrame(rafId);
      } else if (isPaused) {
        isPaused = false;
        lastFrameTime = performance.now();
        rafId = requestAnimationFrame(loop);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    rafId = requestAnimationFrame(loop);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Generate random color (memoized as it doesn't depend on state). Uses
  // HSL with a floor on saturation/lightness rather than uniform RGB —
  // uniform RGB has a real chance of landing near-black (or near-white/
  // muddy-gray), which is invisible for solid-fill types like Shapes and
  // Polar Grid (flat rgb() fills straight onto a #000 background, no
  // gradient blending to soften a dark hit) and reads as a near-black
  // shuffle result.
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


  // Each of these local clocks is skipped entirely in Display mode — that
  // tab's copies are pushed from the controller instead (see the animation
  // sync effect below), so the two windows stay frame-locked instead of
  // drifting apart.


  useEffect(() => {
    if (IS_DISPLAY_MODE && !IS_STANDALONE_DISPLAY) return;
    if (gradientType !== 'hatch' || (!isAutoMode && !isVCRPlaying && !isMicActive)) return;
    const id = setInterval(() => setHatchAnimTime(t => t + 0.05 * vcrPlaybackSpeed * hatchSpeed), 16);
    return () => clearInterval(id);
  }, [gradientType, vcrPlaybackSpeed, isAutoMode, isVCRPlaying, isMicActive, hatchSpeed]);

  useEffect(() => {
    if (IS_DISPLAY_MODE && !IS_STANDALONE_DISPLAY) return;
    if (gradientType !== 'noise' || (!isAutoMode && !isVCRPlaying && !isMicActive)) return;
    const id = setInterval(() => setNoiseAnimTime(t => t + 0.01 * vcrPlaybackSpeed * noiseSpeed), 16);
    return () => clearInterval(id);
  }, [gradientType, vcrPlaybackSpeed, isAutoMode, isVCRPlaying, isMicActive, noiseSpeed]);

  useEffect(() => {
    if (IS_DISPLAY_MODE && !IS_STANDALONE_DISPLAY) return;
    if (gradientType !== 'radial' || (!isAutoMode && !isVCRPlaying && !isMicActive)) return;
    const id = setInterval(() => setRadialAnimTime(t => t + 0.006 * vcrPlaybackSpeed * radialSpeed), 16);
    return () => clearInterval(id);
  }, [gradientType, vcrPlaybackSpeed, isAutoMode, isVCRPlaying, isMicActive, radialSpeed]);

  useEffect(() => {
    if (IS_DISPLAY_MODE && !IS_STANDALONE_DISPLAY) return;
    if (gradientType !== 'caustics' || (!isAutoMode && !isVCRPlaying && !isMicActive)) return;
    const id = setInterval(() => setCausticsAnimTime(t => t + 0.02 * vcrPlaybackSpeed), 16);
    return () => clearInterval(id);
  }, [gradientType, vcrPlaybackSpeed, isAutoMode, isVCRPlaying, isMicActive]);

  useEffect(() => {
    if (IS_DISPLAY_MODE && !IS_STANDALONE_DISPLAY) return;
    if (gradientType !== 'lava-lamp' || (!isAutoMode && !isVCRPlaying && !isMicActive)) return;
    const id = setInterval(() => setLavaAnimTime(t => t + 0.008 * vcrPlaybackSpeed), 16);
    return () => clearInterval(id);
  }, [gradientType, vcrPlaybackSpeed, isAutoMode, isVCRPlaying, isMicActive]);

  // Shared clock for the styled-field gradients (drawStyleFieldGL.ts). Gated exactly
  // like the older gradients' clocks above — it only advances while auto mode, VCR
  // playback or the mic is on, so pausing freezes these too (and editing a slider
  // while paused no longer makes the pattern jump) — and scaled by the playback speed
  // and the Speed the last frame drew with. Lives in the anim-values ref rather than
  // state, like gridRotation: advancing it must not re-render the panel tree 60x/sec.
  // Real elapsed time (not a fixed per-tick step) so a throttled timer can't slow it.
  useEffect(() => {
    if (IS_DISPLAY_MODE && !IS_STANDALONE_DISPLAY) return;
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!STYLE_FIELD_GRADIENT_TYPES.includes(gradientTypeRef.current as GradientType)) return;
      if (!isAutoModeRef.current && !isVCRPlayingRef.current && !isMicActiveRef.current) return;
      const av = animValuesRef.current;
      av.fieldAnimTime += dt * vcrPlaybackSpeedRef.current * av.fieldSpeedLive;
    }, 16);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (IS_DISPLAY_MODE && !IS_STANDALONE_DISPLAY) return;
    if (gradientType !== 'marble' || (!isAutoMode && !isVCRPlaying && !isMicActive)) return;
    const id = setInterval(() => setMarbleAnimTime(t => t + 0.02 * vcrPlaybackSpeed), 16);
    return () => clearInterval(id);
  }, [gradientType, vcrPlaybackSpeed, isAutoMode, isVCRPlaying, isMicActive]);

  useEffect(() => {
    if (IS_DISPLAY_MODE && !IS_STANDALONE_DISPLAY) return;
    if (gradientType !== 'metaballs' || (!isAutoMode && !isVCRPlaying && !isMicActive)) return;
    const id = setInterval(() => setMetaballAnimTime(t => t + 0.02 * vcrPlaybackSpeed * metaballSpeed), 16);
    return () => clearInterval(id);
  }, [gradientType, vcrPlaybackSpeed, isAutoMode, isVCRPlaying, isMicActive, metaballSpeed]);

  useEffect(() => {
    if (IS_DISPLAY_MODE && !IS_STANDALONE_DISPLAY) return;
    if (gradientType !== 'particles' || particlesMode !== 'flow-field' || (!isAutoMode && !isVCRPlaying && !isMicActive)) return;
    const id = setInterval(() => setFlowAnimTime(t => t + 0.02 * vcrPlaybackSpeed * flowSpeed), 16);
    return () => clearInterval(id);
  }, [gradientType, particlesMode, vcrPlaybackSpeed, isAutoMode, isVCRPlaying, isMicActive, flowSpeed]);

  useEffect(() => {
    if (IS_DISPLAY_MODE && !IS_STANDALONE_DISPLAY) return;
    if (gradientType !== 'attractor' || (!isAutoMode && !isVCRPlaying && !isMicActive)) return;
    const id = setInterval(() => setAttractorAnimTime(t => t + 0.01 * vcrPlaybackSpeed * attractorSpeed), 16);
    return () => clearInterval(id);
  }, [gradientType, vcrPlaybackSpeed, isAutoMode, isVCRPlaying, isMicActive, attractorSpeed]);

  useEffect(() => {
    if (IS_DISPLAY_MODE && !IS_STANDALONE_DISPLAY) return;
    if (!activeEffects.includes('liquid') || (!isAutoMode && !isVCRPlaying && !isMicActive)) return;
    const id = setInterval(() => setLiquidAnimTime(t => t + 0.02 * vcrPlaybackSpeed), 16);
    return () => clearInterval(id);
  }, [activeEffects, vcrPlaybackSpeed, isAutoMode, isVCRPlaying, isMicActive]);

  // Emoji cells only spin while Play is active — frozen in place otherwise
  useEffect(() => {
    if (IS_DISPLAY_MODE && !IS_STANDALONE_DISPLAY) return;
    if (!activeEffects.includes('emoji') || (!isAutoMode && !isVCRPlaying && !isMicActive)) return;
    const id = setInterval(() => setEmojiAnimTime(t => t + (emojiRotateSpeed / 60) * vcrPlaybackSpeed), 16);
    return () => clearInterval(id);
  }, [activeEffects, vcrPlaybackSpeed, isAutoMode, isVCRPlaying, isMicActive, emojiRotateSpeed]);

  // Keep a ref mirror of the anim-time fields so the rAF broadcast loop
  // below can read fresh values every frame without itself needing to be
  // torn down and recreated on every tick (which a dependency array would
  // force, since these change ~60x/sec while playing).
  //
  // voronoiAnimTime/flowerAnimTime/tilingAnimTime are intentionally NOT
  // included here anymore — the main loop now writes those directly into
  // animValuesRef every frame (see the loop below), so mirroring them from
  // state here as well would race with that direct write and periodically
  // stomp the fresh ref value with a stale state-derived one. The other
  // clocks below still only exist as state (each driven by its own
  // setInterval elsewhere), so they still need this mirror to reach
  // animValuesRef at all.
  useEffect(() => {
    const av = animValuesRef.current;
    av.auroraAnimTime = auroraAnimTime;
    av.turrellAnimTime = turrellAnimTime;
    av.causticsAnimTime = causticsAnimTime;
    av.lavaAnimTime = lavaAnimTime;
    av.marbleAnimTime = marbleAnimTime;
    av.metaballAnimTime = metaballAnimTime;
    av.flowAnimTime = flowAnimTime;
    av.liquidAnimTime = liquidAnimTime;
    av.emojiAnimTime = emojiAnimTime;
    av.attractorAnimTime = attractorAnimTime;
    av.hatchAnimTime = hatchAnimTime;
    av.noiseAnimTime = noiseAnimTime;
    av.radialAnimTime = radialAnimTime;
    av.audioSubBassLevel = audioSubBassLevel;
    av.audioMidsLevel = audioMidsLevel;
    av.audioTrebleLevel = audioTrebleLevel;
    av.audioEnergy = audioEnergy;
  }, [auroraAnimTime, turrellAnimTime, causticsAnimTime, lavaAnimTime, marbleAnimTime, metaballAnimTime, flowAnimTime, liquidAnimTime, emojiAnimTime, attractorAnimTime, hatchAnimTime, noiseAnimTime, radialAnimTime, audioSubBassLevel, audioMidsLevel, audioTrebleLevel, audioEnergy]);

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
    brushStrokesSize, setBrushStrokesSize, brushStrokesLength, setBrushStrokesLength,
    watercolorBleed, setWatercolorBleed, watercolorGrain, setWatercolorGrain, watercolorStyle, setWatercolorStyle,
    dadaPanels, setDadaPanels, dadaChaos, setDadaChaos,
    duotoneColor1, duotoneColor2, duotoneColor3, duotoneIntensity, duotoneThreeColor, dustCrackleColor, dustCrackleIntensity, dustCrackleLength,
    emojiChars, emojiOffsetX, emojiRotateSpeed, emojiSize, emojiSizeVariation, fadeDirection,
    feedbackDecay, feedbackRotation, feedbackZoom, fisheyeCenterX, fisheyeCenterY, fisheyeStrength,
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
    setFeedbackZoom, setFisheyeCenterX, setFisheyeCenterY, setFisheyeStrength, setFlowParticleCount, setFlowScale,
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
  const saveCurrentState = useCallback(() => {
    const snapshot = buildSnapshot();
    // Push snapshot onto a 10-item stack, discarding any forward history
    const stack = undoStackRef.current;
    const newIndex = undoIndexRef.current + 1;
    undoStackRef.current = [...stack.slice(0, newIndex), snapshot].slice(-10);
    undoIndexRef.current = undoStackRef.current.length - 1;
    setUndoDepth(undoIndexRef.current);
    // A fresh edit invalidates any redo history
    redoStackRef.current = [];
    setRedoDepth(0);
  }, [buildSnapshot]);

  // Randomize all colors
  // Applies a named Look (constants/gradientLooks.ts): the palette plus whichever
  // of Scale/Speed/Bias/Sharpness/Contrast it specifies, resetting the ones it
  // doesn't to their defaults so a look always lands the same way. A palette the
  // same length as the current one eases in; a different length snaps (see
  // setColorsInstant for why a length change can't ease) — Shuffle sidesteps that
  // by passing `colorsOverride`, the look's palette resampled to the current
  // length. No undo snapshot here: callers that want one take it themselves
  // (the chips below; Shuffle already does).
  const applyLookValues = useCallback((look: GradientLook, colorsOverride?: ColorRGB[]) => {
    const colors = colorsOverride ?? look.colors.map(hexToRgb);
    if (colors.length === gradientColorsRef.current.length) setTargetColors(colors);
    else setColorsInstant(colors);
    setFieldScale(look.scale ?? LOOK_DEFAULTS.scale);
    setFieldSpeed(look.speed ?? LOOK_DEFAULTS.speed);
    setPaletteBias(look.bias ?? LOOK_DEFAULTS.bias);
    setPaletteSharp(look.sharp ?? LOOK_DEFAULTS.sharp);
    setFieldContrast(look.contrast ?? LOOK_DEFAULTS.contrast);
    setPaletteStops(null);
    if (look.blend) setColorBlend(look.blend);
    // The gradient's own sliders/modes. Only what the look lists is touched.
    if (look.params) {
      const setters: Record<LookParamKey, (v: any) => void> = { // eslint-disable-line @typescript-eslint/no-explicit-any
        causticsBrightness: setCausticsBrightness, causticsScale: setCausticsScale,
        lavaBlobCount: setLavaBlobCount, lavaBlobSize: setLavaBlobSize, lavaSpeed: setLavaSpeed,
        marbleVeinFreq: setMarbleVeinFreq, marbleTurbulence: setMarbleTurbulence, marbleOctaves: setMarbleOctaves,
        metaballCount: setMetaballCount, metaballSize: setMetaballSize, metaballSpeed: setMetaballSpeed,
        noiseScale: setNoiseScale, noiseOctaves: setNoiseOctaves, noiseWarp: setNoiseWarp, noiseSpeed: setNoiseSpeed, noiseType: setNoiseType,
        topographicScale: setTopographicScale, topographicBands: setTopographicBands, topographicLineWidth: setTopographicLineWidth,
        juliaReal: setJuliaReal, juliaImaginary: setJuliaImaginary, juliaZoom: setJuliaZoom, juliaIterations: setJuliaIterations,
        tilingSize: setTilingSize, tilingSymmetry: setTilingSymmetry, tilingComplexity: setTilingComplexity, tilingRotation: setTilingRotation,
        reactionDiffusionFeed: setReactionDiffusionFeed, reactionDiffusionKill: setReactionDiffusionKill, reactionDiffusionSpeed: setReactionDiffusionSpeed,
        voronoiCellCount: setVoronoiCellCount, voronoiDistortion: setVoronoiDistortion,
        radialSizeScale: setRadialSizeScale, radialSpeed: setRadialSpeed,
        radialBurstMode: setRadialBurstMode, radialBurstCount: setRadialBurstCount, radialBurstSize: setRadialBurstSize, radialBurstSpread: setRadialBurstSpread,
        windmillMode: setWindmillMode, helixTurns: setHelixTurns, helixTightness: setHelixTightness,
        fadeDirection: setFadeDirection, angleStartOffset: setAngleStartOffset,
        flowerCircles: setFlowerCircles, flowerScale: setFlowerScale, flowerSpread: setFlowerSpread,
        gridRows: setGridRows, gridColumns: setGridColumns, shapesCount: setShapesCount, shapesSides: setShapesSides,
        stackCount: setStackCount, stackGap: setStackGap, stackWidth: setStackWidth, stackLength: setStackLength, stackResponse: setStackResponse,
        hatchLayers: setHatchLayers, hatchSpacing: setHatchSpacing, hatchResponse: setHatchResponse, hatchSpeed: setHatchSpeed,
        truchetSize: setTruchetSize, truchetVariation: setTruchetVariation, truchetThickness: setTruchetThickness,
        particlesCount: setParticlesCount, particlesSize: setParticlesSize, particlesSpeed: setParticlesSpeed, particlesTrail: setParticlesTrail, particlesGravity: setParticlesGravity,
        attractorPointCount: setAttractorPointCount, attractorSpeed: setAttractorSpeed, attractorScale: setAttractorScale,
      };
      for (const [key, value] of Object.entries(look.params) as [LookParamKey, number | string][]) {
        setters[key](value);
      }
    }
  }, [setColorsInstant]);

  // What a Look chip does: the same, but undoable.
  const applyGradientLook = useCallback((look: GradientLook) => {
    colorFamilyRef.current.anchor = null;
    saveCurrentState();
    applyLookValues(look);
    // A Look lands the same way every time, so the gradient's shape sliders go back to 1 too.
    setFieldShapes(prev => ({ ...prev, [gradientTypeRef.current]: [1, 1] }));
    setFieldExposure(0);
    setFieldTone('off');
    setFieldGrade({ brightness: 1, contrast: 1, saturation: 1 });
    setFieldSwirl(0);
  }, [saveCurrentState, applyLookValues, setFieldShapes, setFieldExposure, setFieldTone, setFieldGrade, setFieldSwirl, gradientTypeRef]);

  // "Same family": Shuffle keeps to the color family the palette was in when this was switched on (or
  // when you last picked a palette yourself), so a run of shuffles reads as one mood.
  const [keepFamily, setKeepFamilyState] = useState(() => { try { return localStorage.getItem('wavKeepFamily') === '1'; } catch { return false; } });
  const colorFamilyRef = useRef<{ enabled: boolean; anchor: Family | null }>({ enabled: keepFamily, anchor: null });
  colorFamilyRef.current.enabled = keepFamily;
  if (keepFamily && !colorFamilyRef.current.anchor && gradientColorsRef.current.length) colorFamilyRef.current.anchor = paletteFamily(gradientColorsRef.current);
  const reanchorFamily = () => { colorFamilyRef.current.anchor = null; };
  const setKeepFamily = (v: boolean) => {
    colorFamilyRef.current.anchor = v ? paletteFamily(gradientColorsRef.current) : null;
    setKeepFamilyState(v);
    try { localStorage.setItem('wavKeepFamily', v ? '1' : '0'); } catch { /* not persisted */ }
  };

  // A colors-only palette from the library: eases in when it has as many colors as now, else
  // is re-cut to the current count (same rule as the Color tab's Start from > Palettes).
  const applyPalette = useCallback((palette: { colors: string[] }, opts?: { fromShuffle?: boolean }) => {
    if (!opts?.fromShuffle) colorFamilyRef.current.anchor = null; // your own pick re-anchors the family
    saveCurrentState();
    const colors = palette.colors.map(hexToRgb);
    const n = gradientColorsRef.current.length;
    if (colors.length === n) setTargetColors(colors);
    else setColorsInstant(samplePalette(colors, null, 0.5, 0, colorBlend, n));
    setPaletteStops(null);
  }, [saveCurrentState, setTargetColors, setColorsInstant, colorBlend, setPaletteStops]);

  // The shuffle button beside the Looks & palettes menu: a random palette from the library
  // (one that starts dark when the gradient needs a dark backdrop), never the one already showing.
  const lastShuffledPaletteRef = useRef<string | null>(null);
  const shuffleColors = useCallback(() => {
    const dark = DARK_GROUND_GRADIENTS.includes(gradientTypeRef.current);
    const fam = colorFamilyRef.current;
    const anchor = fam.enabled ? (fam.anchor ?? (fam.anchor = paletteFamily(gradientColorsRef.current))) : null;
    const n = gradientColorsRef.current.length;
    let pool = (dark ? PALETTE_PRESETS.filter(startsDark) : PALETTE_PRESETS);
    if (anchor) pool = pool.filter(p => inFamily(p.colors.map(hexToRgb), anchor));
    const live = gradientColorsRef.current;
    const liveKey = live.map(c => `${Math.round(c.r / 8)},${Math.round(c.g / 8)},${Math.round(c.b / 8)}`).join('|');
    // Also never the one picked last time: the live colors are still easing toward it for a second or two.
    const choices = pool.filter(p => p.name !== lastShuffledPaletteRef.current && p.colors.map(hexToRgb).map(c => `${Math.round(c.r / 8)},${Math.round(c.g / 8)},${Math.round(c.b / 8)}`).join('|') !== liveKey);
    if (anchor && (choices.length < 2 || Math.random() < 0.35)) {
      // Too few library palettes in this family (or just for variety): make one.
      saveCurrentState();
      setTargetColors(generateFamilyPalette(anchor, n, dark));
      setPaletteStops(null);
      lastShuffledPaletteRef.current = null;
      return;
    }
    const pick = (choices.length ? choices : pool)[Math.floor(Math.random() * (choices.length ? choices.length : pool.length))];
    if (pick) { lastShuffledPaletteRef.current = pick.name; applyPalette(pick, { fromShuffle: true }); }
  }, [applyPalette, saveCurrentState, setTargetColors, setPaletteStops]);

  const randomizeAllColors = useCallback(() => {
    saveCurrentState();
    setTargetColors(gradientColors.map(() => randomColor()));
    setBaseAIColors(null); // Clear base AI colors when randomizing
    setSubmittedAIPrompt(''); // Clear submitted prompt when randomizing
    
    // Also randomize duotone colors
    const randomHexColor = () => {
      const r = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
      const g = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
      const b = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    };
    setDuotoneColor1(randomHexColor());
    setDuotoneColor2(randomHexColor());
    setDuotoneColor3(randomHexColor());
  }, [gradientColors, randomColor, saveCurrentState]);

  // Gradient display names, and the full/feeling-lucky type lists, now live
  // in constants/gradientEffects.ts (GRADIENT_DISPLAY_NAMES, FULL_GRADIENT_TYPES,
  // FEELING_LUCKY_GRADIENT_TYPES) alongside the rest of the static effect/gradient
  // data tables.
  const getGradientDisplayName = useCallback((type: GradientType): string => {
    return GRADIENT_DISPLAY_NAMES[type] ?? type;
  }, []);

  // Helper function to adjust color array to target length — hoisted above
  // useRandomization() since feelingLucky's preference-blend branch calls it
  // directly (it must exist in the params object passed to that hook, and
  // that call happens at render time, before a definition further down the
  // component body would be initialized).
  const adjustColorArrayLength = useCallback((colors: ColorRGB[], targetLength: number): ColorRGB[] => {
    if (colors.length === targetLength) {
      return colors;
    }

    if (colors.length > targetLength) {
      // If we have more colors than needed, evenly sample them
      const step = colors.length / targetLength;
      return Array.from({ length: targetLength }, (_, i) => {
        const index = Math.floor(i * step);
        return colors[index];
      });
    }

    // If we need more colors, interpolate between existing ones
    const result: ColorRGB[] = [];
    const step = (colors.length - 1) / (targetLength - 1);

    for (let i = 0; i < targetLength; i++) {
      const position = i * step;
      const index = Math.floor(position);
      const fraction = position - index;

      if (index >= colors.length - 1) {
        result.push(colors[colors.length - 1]);
      } else {
        const color1 = colors[index];
        const color2 = colors[index + 1];
        result.push({
          r: Math.round(color1.r + (color2.r - color1.r) * fraction),
          g: Math.round(color1.g + (color2.g - color1.g) * fraction),
          b: Math.round(color1.b + (color2.b - color1.b) * fraction),
        });
      }
    }

    return result;
  }, []);

  // WAV button / Shuffle randomization — extracted to useRandomization.ts
  // (splitting-plan step 2). Wires ~150 setters spanning nearly every
  // piece of gradient/effect state, since randomization touches everything
  // by design.
  const {
    randomizeUncoveredParams, shuffleGradientType, randomizeEffects,
    feelingLucky, evolveWithFactor, shuffleAudiovisuals,
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
    setFisheyeCenterX, setFisheyeCenterY, setFisheyeStrength, setFlowParticleCount, setFlowScale, setFlowSpeed, setFlowThickness, setFlowerCircles,
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
    setOilPaintRadius, setOilPaintLevels, setImpastoStrength, setImpastoLightAngle, setBrushStrokesSize, setBrushStrokesLength, setWatercolorBleed, setWatercolorGrain,
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

  // Auto-shuffle: repeatedly triggers a full wāv remix (same as clicking the
  // wordmark) on a timer, so the artwork keeps evolving
  // hands-free. evolveWithFactor(1) sets new target values that the master
  // RAF loop lerps toward over time — that lerp IS the fade between one
  // result and the next, so no separate opacity/crossfade code is needed.
  const [isAutoShuffleOn, setIsAutoShuffleOn] = useState(false);
  // True while the "name this new preset" field is open (see PresetsPanel's
  // onAddingPresetChange) — pauses Auto Shuffle for that window so it can't
  // randomize the very state the user is trying to save out from under them.
  const [isNewPresetPending, setIsNewPresetPending] = useState(false);
  // Auto Shuffle's remix interval, adjustable from 1s up to an hour via the
  // slider in the Info panel. Persisted so it survives a reload.
  const AUTO_SHUFFLE_MIN_SEC = 1;
  const AUTO_SHUFFLE_MAX_SEC = 3600;
  const [autoShuffleIntervalSec, setAutoShuffleIntervalSecState] = useState(() => {
    try {
      const saved = localStorage.getItem('autoShuffleIntervalSec');
      const n = saved ? Number(saved) : NaN;
      if (Number.isFinite(n) && n >= AUTO_SHUFFLE_MIN_SEC) return Math.min(AUTO_SHUFFLE_MAX_SEC, n);
    } catch (err) {
      if (import.meta.env.DEV) console.warn('Failed to read autoShuffleIntervalSec:', err);
    }
    return 7;
  });
  const setAutoShuffleIntervalSec = (sec: number) => {
    const clamped = Math.min(AUTO_SHUFFLE_MAX_SEC, Math.max(AUTO_SHUFFLE_MIN_SEC, Math.round(sec)));
    setAutoShuffleIntervalSecState(clamped);
    try { localStorage.setItem('autoShuffleIntervalSec', String(clamped)); } catch (err) {
      if (import.meta.env.DEV) console.warn('Failed to persist autoShuffleIntervalSec:', err);
    }
  };
  // Log-scale mapping so the slider gives useful precision across the whole
  // 1s-3600s range instead of a linear scale where the first few seconds
  // (the most commonly used values) would be squeezed into a sliver of the
  // track.
  const autoShuffleSliderMax = 1000;
  const autoShuffleLogRange = Math.log(AUTO_SHUFFLE_MAX_SEC) - Math.log(AUTO_SHUFFLE_MIN_SEC);
  const autoShuffleSecToSlider = (sec: number) =>
    Math.round(autoShuffleSliderMax * (Math.log(Math.max(AUTO_SHUFFLE_MIN_SEC, sec)) - Math.log(AUTO_SHUFFLE_MIN_SEC)) / autoShuffleLogRange);
  const autoShuffleSliderToSec = (v: number) =>
    Math.round(Math.exp(Math.log(AUTO_SHUFFLE_MIN_SEC) + autoShuffleLogRange * (v / autoShuffleSliderMax)));
  const formatAutoShuffleInterval = (sec: number) => {
    if (sec < 60) return `${sec}s`;
    const minutes = Math.floor(sec / 60);
    const remainder = sec % 60;
    return remainder === 0 ? `${minutes}m` : `${minutes}m ${remainder}s`;
  };
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
  const [autoShuffleScope, setAutoShuffleScopeState] = useState<AutoShuffleScope>(() => {
    try {
      const saved = localStorage.getItem('autoShuffleScope');
      return AUTO_SHUFFLE_SCOPES.some(o => o.id === saved) ? (saved as AutoShuffleScope) : 'all';
    } catch { return 'all'; }
  });
  const setAutoShuffleScope = (scope: AutoShuffleScope) => {
    setAutoShuffleScopeState(scope);
    try { localStorage.setItem('autoShuffleScope', scope); } catch { /* storage unavailable: the choice just won't persist */ }
  };
  const [exportSize, setExportSizeState] = useState<ExportSize>(() => {
    try { const v = localStorage.getItem('exportSize'); return EXPORT_SIZES.some(o => o.id === v) ? (v as ExportSize) : 'screen'; } catch { return 'screen'; }
  });
  const [exportAspect, setExportAspectState] = useState<ExportAspect>(() => {
    try { const v = localStorage.getItem('exportAspect'); return EXPORT_ASPECTS.some(o => o.id === v) ? (v as ExportAspect) : 'screen'; } catch { return 'screen'; }
  });
  const setExportSize = (v: ExportSize) => { setExportSizeState(v); try { localStorage.setItem('exportSize', v); } catch { /* not persisted */ } };
  const setExportAspect = (v: ExportAspect) => { setExportAspectState(v); try { localStorage.setItem('exportAspect', v); } catch { /* not persisted */ } };
  const exportSettingsRef = useRef({ size: exportSize, aspect: exportAspect });
  exportSettingsRef.current = { size: exportSize, aspect: exportAspect };
  const [videoSize, setVideoSizeState] = useState<VideoSize>(() => {
    try { const v = localStorage.getItem('videoSize'); return VIDEO_SIZES.some(o => o.id === v) ? (v as VideoSize) : 'screen'; } catch { return 'screen'; }
  });
  const [videoLength, setVideoLengthState] = useState<VideoLength>(() => {
    try { const v = localStorage.getItem('videoLength'); return VIDEO_LENGTHS.some(o => o.id === v) ? (v as VideoLength) : 'manual'; } catch { return 'manual'; }
  });
  const setVideoSize = (v: VideoSize) => { setVideoSizeState(v); try { localStorage.setItem('videoSize', v); } catch { /* not persisted */ } };
  const setVideoLength = (v: VideoLength) => { setVideoLengthState(v); try { localStorage.setItem('videoLength', v); } catch { /* not persisted */ } };
  // True from the moment a take is started from the Save popout until it ends, so the larger render
  // size can be put back and the length timer cleared however the take stops.
  const videoTakeRef = useRef<{ timer: ReturnType<typeof setTimeout> | null; sized: boolean } | null>(null);
  const isRecordingNowRef = useRef(false);
  isRecordingNowRef.current = isRecording;
  // "Copied" feedback for the share buttons in the Save popout: which one, for a moment.
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Older browsers / insecure contexts: fall back to a temporary textarea.
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* nothing more to try */ }
      document.body.removeChild(ta);
    }
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(k => (k === key ? null : k)), 1500);
  };
  // The player link for what is on screen right now (?display=1&preset=…: the look with no controls).
  // Numbers are rounded to 3 decimals first: the snapshot carries floats like 240.40263068951,
  // which roughly doubled the link for no visible difference.
  const currentPlayerUrl = () => {
    const compact = JSON.parse(JSON.stringify(buildSnapshot(), (_k, v) => (typeof v === 'number' ? Math.round(v * 1000) / 1000 : v)));
    return `${window.location.origin}${window.location.pathname}?display=1&preset=${encodePresetData(compact)}`;
  };
  // Which popout the shared anchor below is showing.
  const [popoverMode, setPopoverMode] = useState<'autoShuffle' | 'export'>('autoShuffle');
  const [autoShufflePopoverAnchor, setAutoShufflePopoverAnchor] = useState<{ top?: number; bottom?: number; left: number; width: number; height?: number } | null>(null);
  const autoShufflePopoverRef = useRef<HTMLDivElement>(null);
  // The button that opened the popover — excluded from the outside-click
  // dismiss check below (see that handler for why).
  const autoShuffleTriggerElRef = useRef<HTMLElement | null>(null);
  // Anchored to the rail's own rect (like the drawer/About panel) rather
  // than the trigger button — desktop opens it flush to the right of the
  // panel (matching the drawer's own width, not a separate guessed one),
  // mobile opens it flush above the (bottom-docked) panel at full width
  // (matching the mobile drawer), instead of floating just below whichever
  // button was clicked.
  const openAutoShufflePopover = (triggerEl?: HTMLElement | null, mode: 'autoShuffle' | 'export' = 'autoShuffle') => {
    // Pressing the button of the popout that's already open closes it (the other
    // button's popout swaps in instead of just closing).
    if (autoShufflePopoverAnchor && popoverMode === mode) { setAutoShufflePopoverAnchor(null); return; }
    setPopoverMode(mode);
    // Its own popout now — opening it closes whatever tab drawer/About
    // panel happened to be open instead of stacking on top of it.
    setActiveTab(null);
    setIsAboutOpen(false);
    autoShuffleTriggerElRef.current = triggerEl ?? null;
    const railEl = panelRef.current;
    const rect = railEl ? railEl.getBoundingClientRect() : { top: 16, left: 16, right: 60, bottom: 60, width: 240 } as DOMRect;
    if (isMobile) {
      setAutoShufflePopoverAnchor({ bottom: window.innerHeight - rect.top, left: 0, width: window.innerWidth });
    } else {
      // Unlike the tab drawer/About panel, this one pops out level with the
      // button that opened it rather than flush to the top of the rail —
      // fall back to the rail's own top if it was opened without a trigger
      // element (e.g. a future keyboard shortcut).
      // Much narrower than the tab drawer it pops out next to — its only
      // content is a toggle and one interval slider, not a full panel's
      // worth of controls, so there's no reason to match the drawer's width.
      const triggerRect = triggerEl ? triggerEl.getBoundingClientRect() : rect;
      // The export popout is tall and its button sits near the bottom of the rail, so
      // it grows upward from the button's bottom edge instead of downward off-screen.
      if (mode === 'export') setAutoShufflePopoverAnchor({ bottom: Math.max(8, window.innerHeight - triggerRect.bottom), left: rect.right, width: 200 });
      else setAutoShufflePopoverAnchor({ top: triggerRect.top, left: rect.right, width: 200 });
    }
  };
  const openExportPopover = (triggerEl?: HTMLElement | null) => {
    openAutoShufflePopover(triggerEl, 'export');
  };
  // Same "own popout" treatment as Auto Shuffle above — opening About
  // closes whatever tab drawer/Auto Shuffle popover happened to be open
  // instead of stacking on top of it.
  const openAboutPanel = () => {
    setActiveTab(null);
    setAutoShufflePopoverAnchor(null);
    setIsAboutOpen(true);
  };
  // The reverse direction of the "own popout" rule above — opening a tab
  // drawer (Gradient/Effects/Audio/Color/Presets) closes Auto Shuffle/
  // About too, so only one popout is ever showing at a time regardless of
  // which one was opened last.
  useEffect(() => {
    if (activeTab) {
      setAutoShufflePopoverAnchor(null);
      setIsAboutOpen(false);
    }
  }, [activeTab]);
  useEffect(() => {
    if (!autoShufflePopoverAnchor) return;
    const handleClick = (e: MouseEvent) => {
      // Excluding the trigger button itself, not just the popover, matters
      // because this listens on 'mousedown' (so it can close before an
      // outside click's own action fires) while the trigger's onClick
      // re-opens the popover on 'click' — mousedown fires first. Without
      // this exclusion, clicking the trigger again while open would close it
      // here on mousedown, then immediately reopen it when the same click's
      // onClick handler ran, making the button look like it never closes.
      const target = e.target as Node;
      if (autoShufflePopoverRef.current && !autoShufflePopoverRef.current.contains(target)
        && !(autoShuffleTriggerElRef.current && autoShuffleTriggerElRef.current.contains(target))) {
        setAutoShufflePopoverAnchor(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [autoShufflePopoverAnchor]);
  const renderAutoShufflePopover = () => {
    if (!autoShufflePopoverAnchor) return null;
    // Styled to match the panel's other popouts (bg-black/75, white text,
    // same corner treatment as the drawer) — this popover is portaled to
    // document.body, outside the dock's own DOM subtree, so it doesn't get
    // that theme CSS applied automatically; the colors below are written
    // out directly instead.
    return createPortal(
      <div
        ref={autoShufflePopoverRef}
        // Fixed flush to the rail now (like the drawer) instead of
        // floating free — square on the edge touching the rail, rounded
        // on the edge facing the canvas.
        className="fixed z-50 shadow-sm bg-black/75 rounded-none"
        style={{
          top: autoShufflePopoverAnchor.top,
          bottom: autoShufflePopoverAnchor.bottom,
          left: autoShufflePopoverAnchor.left,
          width: isMobile ? autoShufflePopoverAnchor.width : autoShufflePopoverAnchor.width * POPOVER_SCALE,
          height: autoShufflePopoverAnchor.height,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          maxHeight: 'calc(100vh - 16px)',
          overflowY: 'auto',
        }}
      >
        {/* On desktop the tab drawers render at 1.3x (ControlDrawer's scale wrapper);
            zoom gives this popout the same type size, with layout following it. */}
        <div className="p-3 flex flex-col gap-2" style={isMobile ? undefined : { zoom: POPOVER_SCALE }}>
        {popoverMode === 'export' ? (<>
        <span className="text-xs flex items-center gap-2 text-white"><Camera weight="regular" className="w-4 h-4 shrink-0" /> Save &amp; share</span>
        {([
          { label: 'Size', options: EXPORT_SIZES, value: exportSize, set: setExportSize, hint: 'Long edge of the saved image. Re-renders the artwork at that size.' },
          { label: 'Aspect', options: EXPORT_ASPECTS, value: exportAspect, set: setExportAspect, hint: 'Crops the center of what you see to this shape.' },
        ] as { label: string; options: { id: string; label: string }[]; value: string; set: (v: never) => void; hint: string }[]).map(g => (
          <div key={g.label} className="flex flex-col gap-1" title={g.hint}>
            <span className="text-[10px] text-white/60">{g.label}</span>
            <div className="flex flex-wrap gap-1" role="group" aria-label={`Export ${g.label.toLowerCase()}`}>
              {g.options.map(o => (
                <button
                  key={o.id}
                  onClick={() => g.set(o.id as never)}
                  aria-pressed={g.value === o.id}
                  className="px-2 py-1 text-[10px] transition-all"
                  style={g.value === o.id
                    ? { backgroundColor: '#ffffff', color: '#000000', fontWeight: 700 }
                    : { backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#ffffff' }}
                >{o.label}</button>
              ))}
            </div>
          </div>
        ))}
        <button
          onClick={() => { exportAsPNG(); setAutoShufflePopoverAnchor(null); }}
          className="py-1.5 text-[11px] font-semibold transition-all"
          style={{ backgroundColor: '#ffffff', color: '#000000' }}
        >Save PNG</button>
        {!isMobile && <p className="text-[10px] text-white/50">The S key saves with these settings.</p>}
        <div className="flex flex-col gap-1 pt-1" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <span className="text-[10px] text-white/60" title="Records the live artwork, with sound if audio is on, as an MP4">Record video</span>
          {([
            { label: 'Size', options: VIDEO_SIZES, value: videoSize, set: setVideoSize },
            { label: 'Length', options: VIDEO_LENGTHS, value: videoLength, set: setVideoLength },
          ] as { label: string; options: { id: string; label: string }[]; value: string; set: (v: never) => void }[]).map(g => (
            <div key={g.label} className="flex flex-wrap gap-1" role="group" aria-label={`Video ${g.label.toLowerCase()}`}>
              {g.options.map(o => (
                <button
                  key={o.id}
                  onClick={() => g.set(o.id as never)}
                  aria-pressed={g.value === o.id}
                  disabled={isRecording}
                  className="px-2 py-1 text-[10px] transition-all disabled:opacity-50"
                  style={g.value === o.id
                    ? { backgroundColor: '#ffffff', color: '#000000', fontWeight: 700 }
                    : { backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#ffffff' }}
                >{o.label}</button>
              ))}
            </div>
          ))}
          <button
            onClick={startVideoTake}
            className="py-1.5 text-[11px] font-semibold transition-all"
            style={isRecording ? { backgroundColor: '#ef4444', color: '#ffffff' } : { backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#ffffff' }}
          >{isRecording ? 'Stop recording' : 'Start recording'}</button>
          {videoSize === '4k' && <p className="text-[10px] text-white/50">4K is heavy: busy gradients or effects may drop frames.</p>}
        </div>
        <div className="flex flex-col gap-1 pt-1" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <span className="text-[10px] text-white/60" title="An MP4 whose end leads straight back into its start, for a background that plays forever">Seamless loop</span>
          <div className="flex gap-1" role="group" aria-label="Loop length">
            {LOOP_LENGTHS.map(o => (
              <button
                key={o.id}
                onClick={() => setLoopSeconds(o.id)}
                aria-pressed={loopSeconds === o.id}
                disabled={loopProgress !== null}
                className="flex-1 px-2 py-1 text-[10px] transition-all disabled:opacity-50"
                style={loopSeconds === o.id
                  ? { backgroundColor: '#ffffff', color: '#000000', fontWeight: 700 }
                  : { backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#ffffff' }}
              >{o.label}</button>
            ))}
          </div>
          <button
            onClick={exportLoop}
            disabled={!loopable && loopProgress === null}
            className="py-1.5 text-[11px] font-semibold transition-all disabled:opacity-40"
            style={loopProgress !== null ? { backgroundColor: '#ef4444', color: '#ffffff' } : { backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#ffffff' }}
          >{loopProgress !== null ? `Rendering ${Math.round(loopProgress * 100)}% — Cancel` : 'Export loop'}</button>
          <p className="text-[10px] text-white/50">
            {!loopable
              ? 'Loops work with the shader gradients (Smoke, Glass, Ring, Mesh and the like) — not the simulations.'
              : activeEffects.some(e => HISTORY_EFFECTS.includes(e))
                ? 'Feedback, Chromatic Trails and Slit-Scan remember past frames, so this loop will show a seam. Uses the video Size above; audio is ignored.'
                : 'Uses the video Size above. Audio is ignored and auto-drifts are paused while it renders.'}
          </p>
          {loopError && <p role="alert" className="text-[10px] text-red-300">{loopError}</p>}
        </div>
        <div className="flex flex-col gap-1 pt-1" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <span className="text-[10px] text-white/60" title="A snippet that shows this look, live, on any web page">Embed on a website</span>
          <div className="flex gap-1">
            {([['box', 'Box 16:9'], ['background', 'Background']] as [EmbedKind, string][]).map(([kind, label]) => (
              <button
                key={kind}
                onClick={() => copyText(`embed-${kind}`, embedSnippet(currentPlayerUrl(), kind))}
                title={kind === 'box' ? 'A responsive 16:9 frame' : 'Pinned behind the whole page'}
                className="flex-1 px-2 py-1 text-[10px] transition-all"
                style={copiedKey === `embed-${kind}` ? { backgroundColor: '#ffffff', color: '#000000', fontWeight: 700 } : { backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#ffffff' }}
              >{copiedKey === `embed-${kind}` ? 'Copied' : label}</button>
            ))}
          </div>
          <span className="text-[10px] text-white/60 pt-1">Copy palette as</span>
          <div className="flex gap-1">
            {([['hex', 'Hex'], ['css', 'CSS'], ['tailwind', 'Tailwind'], ['json', 'JSON']] as [PaletteFormat, string][]).map(([fmt, label]) => (
              <button
                key={fmt}
                onClick={() => copyText(`palette-${fmt}`, formatPalette(gradientColors, paletteStops, fmt))}
                className="flex-1 px-1 py-1 text-[10px] transition-all"
                style={copiedKey === `palette-${fmt}` ? { backgroundColor: '#ffffff', color: '#000000', fontWeight: 700 } : { backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#ffffff' }}
              >{copiedKey === `palette-${fmt}` ? 'Copied' : label}</button>
            ))}
          </div>
        </div>
        </>) : (<>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs flex items-center gap-2 text-white"><InfinityIcon weight="regular" className="w-4 h-4 shrink-0" /> Auto Shuffle</span>
          <button
            onClick={() => setIsAutoShuffleOn(prev => !prev)}
            aria-pressed={isAutoShuffleOn}
            aria-label={isAutoShuffleOn ? 'Turn off Auto Shuffle' : 'Turn on Auto Shuffle'}
            className="relative inline-flex w-8 h-[18px] rounded-full transition-colors shrink-0"
            style={{ backgroundColor: isAutoShuffleOn ? '#ffffff' : 'rgba(255, 255, 255, 0.15)' }}
          >
            <span
              className="absolute top-[2px] w-[14px] h-[14px] rounded-full transition-transform"
              style={{ backgroundColor: isAutoShuffleOn ? '#000000' : '#ffffff', transform: isAutoShuffleOn ? 'translateX(18px)' : 'translateX(2px)' }}
            />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={autoShuffleSliderMax}
            value={autoShuffleSecToSlider(autoShuffleIntervalSec)}
            onChange={(e) => setAutoShuffleIntervalSec(autoShuffleSliderToSec(Number(e.target.value)))}
            className="flex-1"
            aria-label="Auto Shuffle interval"
          />
          <input
            type="number"
            min={AUTO_SHUFFLE_MIN_SEC}
            max={AUTO_SHUFFLE_MAX_SEC}
            value={autoShuffleIntervalSec}
            onChange={(e) => setAutoShuffleIntervalSec(Number(e.target.value))}
            className="text-[10px] w-12 text-right rounded px-1 text-white"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.2)' }}
            aria-label="Auto Shuffle interval in seconds"
          />
        </div>
        <div className="flex gap-1" role="group" aria-label="What Auto Shuffle changes">
          {AUTO_SHUFFLE_SCOPES.map(o => (
            <button
              key={o.id}
              onClick={() => setAutoShuffleScope(o.id)}
              aria-pressed={autoShuffleScope === o.id}
              title={o.hint}
              className="flex-1 py-1 text-[10px] transition-all"
              style={autoShuffleScope === o.id
                ? { backgroundColor: '#ffffff', color: '#000000', fontWeight: 700 }
                : { backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#ffffff' }}
            >{o.label}</button>
          ))}
        </div>
        <div className="flex gap-1" role="group" aria-label="Auto Shuffle interval presets">
          {[5, 15, 60, 300].map(sec => (
            <button
              key={sec}
              onClick={() => setAutoShuffleIntervalSec(sec)}
              aria-pressed={autoShuffleIntervalSec === sec}
              className="flex-1 py-1 text-[10px] transition-all"
              style={autoShuffleIntervalSec === sec
                ? { backgroundColor: '#ffffff', color: '#000000', fontWeight: 700 }
                : { backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#ffffff' }}
            >{formatAutoShuffleInterval(sec)}</button>
          ))}
        </div>
        <p className="text-[10px] text-white/50">Remix every {formatAutoShuffleInterval(autoShuffleIntervalSec)}</p>
        </>)}
        </div>
      </div>,
      document.body,
    );
  };
  // Read through a ref rather than depending on evolveWithFactor directly —
  // it's recreated ~4x/sec (gradientColors syncs back from refs every 15
  // frames, and that's one of its deps), which was tearing down and
  // restarting this interval on every recreation, so it never survived long
  // enough to actually fire at 5s.
  const evolveWithFactorRef = useRef(evolveWithFactor);
  evolveWithFactorRef.current = evolveWithFactor;
  // Slows the master RAF loop's color/angle/zoom lerp while auto-shuffle is
  // running, so each result has a longer, more overlapping cross-fade into
  // the next instead of the ~2s ease used for a manual nudge/remix.
  const isAutoShuffleOnRef = useRef(false);
  useEffect(() => { isAutoShuffleOnRef.current = isAutoShuffleOn; }, [isAutoShuffleOn]);
  // What each Auto Shuffle tick changes: everything (a full remix), or just the
  // gradient, the effects or the colors. Read through a ref so changing the scope
  // doesn't restart the timer.
  const autoShuffleScopeRef = useRef(autoShuffleScope);
  autoShuffleScopeRef.current = autoShuffleScope;
  const autoShuffleActionsRef = useRef({ shuffleGradientType, randomizeEffects, randomColor, saveCurrentState, setTargetColors });
  autoShuffleActionsRef.current = { shuffleGradientType, randomizeEffects, randomColor, saveCurrentState, setTargetColors };
  const runAutoShuffleTick = () => {
    const a = autoShuffleActionsRef.current;
    switch (autoShuffleScopeRef.current) {
      case 'gradient': a.shuffleGradientType(); break;
      case 'effects': a.randomizeEffects(); break;
      case 'colors': a.saveCurrentState(); a.setTargetColors(gradientColorsRef.current.map(() => a.randomColor())); break;
      default: evolveWithFactorRef.current(1);
    }
  };
  const runAutoShuffleTickRef = useRef(runAutoShuffleTick);
  runAutoShuffleTickRef.current = runAutoShuffleTick;
  useEffect(() => {
    if (!isAutoShuffleOn || isNewPresetPending) return;
    runAutoShuffleTickRef.current();
    const id = setInterval(() => runAutoShuffleTickRef.current(), autoShuffleIntervalSec * 1000);
    return () => clearInterval(id);
  }, [isAutoShuffleOn, autoShuffleIntervalSec, isNewPresetPending]);
  // Undo to previous state (up to 10 levels)
  // Apply a snapshot's values to live state (shared by undo and redo)

  // Display-window sync: the controller tab periodically diffs its own
  // buildSnapshot() and pushes changes out to any ?display=1 tab. Sent over
  // BOTH BroadcastChannel and localStorage — redundant on purpose. Neither
  // is bulletproof alone: BroadcastChannel can be isolated across a
  // window.open() popup/opener pair in some browsers (the reason we moved
  // off window.open entirely), while localStorage's 'storage' event has
  // been reported unreliable between fully independent top-level windows
  // (as opposed to tabs) in at least one real setup. Between two ordinary,
  // independently-opened tabs/windows of the same origin — which is what
  // the copy-link flow produces — BroadcastChannel is the more standard
  // mechanism, so it's primary; localStorage is the fallback. Polling
  // (rather than wiring into every setter) reuses the existing snapshot
  // machinery instead of duplicating its huge dependency surface a third
  // time.
  useEffect(() => {
    // Standalone playback has no controller to receive from, and must not
    // let a stale DISPLAY_SYNC_KEY value from some earlier, unrelated
    // controller session (or a real one that happens to be open in another
    // tab) stomp the preset this window was opened to play.
    if (!IS_DISPLAY_MODE || IS_STANDALONE_DISPLAY) return;
    const applyRaw = (raw: string | null | undefined) => {
      if (!raw) return;
      try {
        applySnapshot(JSON.parse(raw));
      } catch {
        // Ignore a partial/corrupt write — the next tick will overwrite it.
      }
    };

    applyRaw(localStorage.getItem(DISPLAY_SYNC_KEY));

    const handleStorage = (e: StorageEvent) => {
      if (e.key === DISPLAY_SYNC_KEY) applyRaw(e.newValue);
    };
    window.addEventListener('storage', handleStorage);

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel(DISPLAY_SYNC_KEY);
      channel.onmessage = (e) => applyRaw(e.data);
    }

    return () => {
      window.removeEventListener('storage', handleStorage);
      channel?.close();
    };
  }, [applySnapshot]);

  // Receive the anim-time fields (Display mode only) — written straight into
  // animValuesRef, the same ref draw() actually reads (see useCanvasDraw.ts),
  // instead of through their React state setters. This used to call a
  // setState per field per incoming message (~60/sec while the controller is
  // animating), forcing this whole component to re-render every single
  // message; a state→ref mirror effect further down used to be what
  // actually got those state updates into animValuesRef for rendering. Both
  // sides now write the ref directly — the controller's main loop writes it
  // every frame locally, this receiver writes it every message here — so
  // neither needs the state round-trip, and the mirror effect is gone.
  useEffect(() => {
    if (!IS_DISPLAY_MODE || IS_STANDALONE_DISPLAY || typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel(DISPLAY_ANIM_SYNC_KEY);
    channel.onmessage = (e) => {
      const v = e.data;
      if (!v) return;
      const av = animValuesRef.current;
      if (typeof v.voronoiAnimTime === 'number') av.voronoiAnimTime = v.voronoiAnimTime;
      if (typeof v.flowerAnimTime === 'number') av.flowerAnimTime = v.flowerAnimTime;
      if (typeof v.tilingAnimTime === 'number') av.tilingAnimTime = v.tilingAnimTime;
      if (typeof v.auroraAnimTime === 'number') av.auroraAnimTime = v.auroraAnimTime;
      if (typeof v.turrellAnimTime === 'number') av.turrellAnimTime = v.turrellAnimTime;
      if (typeof v.causticsAnimTime === 'number') av.causticsAnimTime = v.causticsAnimTime;
      if (typeof v.lavaAnimTime === 'number') av.lavaAnimTime = v.lavaAnimTime;
      if (typeof v.marbleAnimTime === 'number') av.marbleAnimTime = v.marbleAnimTime;
      if (typeof v.fieldAnimTime === 'number') av.fieldAnimTime = v.fieldAnimTime;
      if (typeof v.metaballAnimTime === 'number') av.metaballAnimTime = v.metaballAnimTime;
      if (typeof v.flowAnimTime === 'number') av.flowAnimTime = v.flowAnimTime;
      if (typeof v.liquidAnimTime === 'number') av.liquidAnimTime = v.liquidAnimTime;
      if (typeof v.emojiAnimTime === 'number') av.emojiAnimTime = v.emojiAnimTime;
      if (typeof v.attractorAnimTime === 'number') av.attractorAnimTime = v.attractorAnimTime;
      if (typeof v.hatchAnimTime === 'number') av.hatchAnimTime = v.hatchAnimTime;
      if (typeof v.noiseAnimTime === 'number') av.noiseAnimTime = v.noiseAnimTime;
      if (typeof v.radialAnimTime === 'number') av.radialAnimTime = v.radialAnimTime;
      if (typeof v.waveInterferenceAnimTime === 'number') av.waveInterferenceAnimTime = v.waveInterferenceAnimTime;
      if (typeof v.meshWireframeAnimTime === 'number') av.meshWireframeAnimTime = v.meshWireframeAnimTime;
      if (typeof v.gridRotation === 'number') av.gridRotation = v.gridRotation;
      if (typeof v.radarSweepAngle === 'number') av.radarSweepAngle = v.radarSweepAngle;
      av.audioSubBassLevel = v.audioSubBassLevel ?? 0;
      av.audioMidsLevel = v.audioMidsLevel ?? 0;
      av.audioTrebleLevel = v.audioTrebleLevel ?? 0;
      av.audioEnergy = v.audioEnergy ?? 0;
      // Write the live, already-eased color straight into the ref the draw
      // loop actually reads (see gradientColorsRef above) — not through
      // setGradientColors/applySnapshot, which only update React state and
      // would leave this tab re-easing from its own stale ref position.
      if (v.gradientColors) gradientColorsRef.current = v.gradientColors;
      if (typeof v.halftoneTime === 'number') halftoneTimeRef.current = v.halftoneTime;
      // Same idea as gradientColorsRef above, but for Reaction-Diffusion's
      // whole simulation grid — overwrite the ref's `v` array directly
      // rather than restarting the sim locally, so Display renders the
      // controller's actual field instead of an independently-seeded one.
      // The step loop itself is skipped in Display mode (see the
      // IS_DISPLAY_MODE guard in drawReactionDiffusion.ts), so nothing
      // fights this update the way it would if Display kept stepping too.
      if (v.reactionDiffusionV) {
        if (!reactionDiffusionGridRef.current) {
          const RD_W = 220, RD_H = 140;
          const gridCanvas = document.createElement('canvas');
          gridCanvas.width = RD_W;
          gridCanvas.height = RD_H;
          reactionDiffusionGridRef.current = {
            u: new Float32Array(RD_W * RD_H).fill(1),
            v: v.reactionDiffusionV,
            u2: new Float32Array(RD_W * RD_H),
            v2: new Float32Array(RD_W * RD_H),
            canvas: gridCanvas,
            time: 0,
          };
        } else {
          reactionDiffusionGridRef.current.v = v.reactionDiffusionV;
        }
      }
    };
    return () => channel.close();
  }, []);

  // Broadcast the anim-time fields (controller only) on every
  // requestAnimationFrame tick rather than setInterval — rAF keeps running
  // for a visible-but-unfocused window in every major browser, unlike
  // setInterval, which is exactly the throttling that broke the main config
  // sync before it was switched to an event-driven broadcast. Was throttled
  // to every 3rd frame (~20fps) to keep messaging light, but that meant the
  // Display tab was always trailing by roughly that interval — a small,
  // constant, noticeable-in-a-live-performance-context lag. A same-origin
  // BroadcastChannel message is cheap enough to just send every frame.
  useEffect(() => {
    if (IS_DISPLAY_MODE || typeof BroadcastChannel === 'undefined') return;
    animSyncChannelRef.current = new BroadcastChannel(DISPLAY_ANIM_SYNC_KEY);
    let rafId: number;
    const tick = () => {
      animSyncChannelRef.current?.postMessage({
        ...animValuesRef.current,
        gradientColors: gradientColorsRef.current,
        halftoneTime: halftoneTimeRef.current,
        // Reaction-Diffusion's whole Gray-Scott field (not just a scalar
        // clock) — without this, Display seeds its own grid with
        // Math.random() on mount and runs an entirely independent
        // simulation from frame one, not just a phase-drifted one like the
        // other clocks here. Sending only `v` (what's actually rendered,
        // see getMappedColor(t = v[i] * 3, ...) in drawReactionDiffusion.ts)
        // keeps this to one Float32Array (~123KB) per frame instead of two.
        reactionDiffusionV: reactionDiffusionGridRef.current?.v,
      });
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      animSyncChannelRef.current?.close();
      animSyncChannelRef.current = null;
    };
  }, []);

  // Open the broadcast channel once for the controller's lifetime.
  useEffect(() => {
    if (IS_DISPLAY_MODE) return;
    syncChannelRef.current = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(DISPLAY_SYNC_KEY) : null;
    return () => { syncChannelRef.current?.close(); syncChannelRef.current = null; };
  }, []);

  // Broadcast immediately whenever buildSnapshot's identity changes (i.e.
  // on every real state change), rather than polling on a setInterval.
  // Chrome (and others) throttle setInterval/setTimeout in windows that
  // aren't OS-focused — even if fully visible on screen — which silently
  // stalled the old polling loop the moment the user's focus moved to the
  // newly-opened Display window. An effect fired off React's commit phase,
  // itself triggered synchronously by the user's click in the controller,
  // isn't subject to that same timer throttling.
  useEffect(() => {
    if (IS_DISPLAY_MODE) return;
    try {
      const snapshot = buildSnapshot();
      const serialized = JSON.stringify(snapshot);
      if (serialized === lastBroadcastSnapshotRef.current) return;
      lastBroadcastSnapshotRef.current = serialized;
      localStorage.setItem(DISPLAY_SYNC_KEY, serialized);
      syncChannelRef.current?.postMessage(serialized);
    } catch (err) {
      // A bad snapshot must not permanently break future broadcasts.
      console.error('wāv display sync failed:', err);
    }
  }, [buildSnapshot]);

  // Shift+P: copy the Display link — a second, always-fully-hidden-UI tab
  // that mirrors this one, for live/projector use. Deliberately does NOT
  // call window.open(): popup blockers treat keydown-triggered opens as
  // untrusted in several browsers (confirmed directly — even a real
  // keyboard-dispatched window.open() came back null), so the window would
  // silently fail to appear. Copying the link and letting the user open it
  // themselves (new tab, or drag to a second monitor) always works.
  const toggleDisplayWindow = useCallback(() => {
    if (IS_DISPLAY_MODE) return;
    const url = `${window.location.origin}${window.location.pathname}?display=1`;
    navigator.clipboard?.writeText(url).catch(() => {});
    setIsDisplayLinkCopied(true);
    setTimeout(() => setIsDisplayLinkCopied(false), 2500);
  }, []);

  const undoLastChange = useCallback(() => {
    if (undoIndexRef.current < 0) return;
    const snapshot = undoStackRef.current[undoIndexRef.current];
    undoIndexRef.current -= 1;
    setUndoDepth(undoIndexRef.current);
    if (!snapshot) return;

    // Capture the live state onto the redo stack before overwriting it
    const currentSnapshot = buildSnapshot();
    redoStackRef.current = [...redoStackRef.current, currentSnapshot].slice(-10);
    setRedoDepth(redoStackRef.current.length);

    applySnapshot(snapshot);
  }, [buildSnapshot, applySnapshot]);

  const redoLastChange = useCallback(() => {
    const redoStack = redoStackRef.current;
    if (redoStack.length === 0) return;
    const snapshot = redoStack[redoStack.length - 1];
    redoStackRef.current = redoStack.slice(0, -1);
    setRedoDepth(redoStackRef.current.length);

    // Push the live state back onto the undo stack so it can be undone again
    const currentSnapshot = buildSnapshot();
    const stack = undoStackRef.current;
    const newIndex = undoIndexRef.current + 1;
    undoStackRef.current = [...stack.slice(0, newIndex), currentSnapshot].slice(-10);
    undoIndexRef.current = undoStackRef.current.length - 1;
    setUndoDepth(undoIndexRef.current);

    applySnapshot(snapshot);
  }, [buildSnapshot, applySnapshot]);

  // ---- Gesture feedback and the shared actions behind swipes, arrow keys and taps ----------
  // ---- Shared actions behind swipes, arrow keys and taps (each gives a haptic tap, no on-screen message) ----
  const isControlsVisibleRef = useRef(true);
  isControlsVisibleRef.current = isControlsVisible;

  // Back is Undo. Forward is Redo when there is something to redo, otherwise a new
  // Shuffle — so after stepping back, forward walks you back up before it rolls anything new.
  const goBack = useCallback(() => {
    if (undoIndexRef.current < 0) {
      haptic('warn');
      return;
    }
    undoLastChange();
    haptic('tick');
  }, [undoLastChange]);

  const goForward = useCallback(() => {
    if (redoStackRef.current.length > 0) {
      redoLastChange();
      haptic('tick');
      return;
    }
    evolveWithFactor(1);
    haptic('success');
  }, [evolveWithFactor, redoLastChange]);

  const togglePause = useCallback(() => {
    toggleVCRPlayback();
    haptic('tick');
  }, [toggleVCRPlayback]);

  const toggleControls = useCallback(() => {
    if (IS_DISPLAY_MODE) return;
    const wasVisible = isControlsVisibleRef.current;
    setIsControlsVisible(!wasVisible);
    haptic('success');
  }, []);

  const gestureActionsRef = useRef({ goBack, goForward, togglePause, toggleControls });
  gestureActionsRef.current = { goBack, goForward, togglePause, toggleControls };

  // Motion gestures (phone only): shake to Shuffle, tilt to rotate. Off until switched on in the
  // About panel, because iOS asks permission and only from a tap; the choice is remembered.
  const readFlag = (key: string) => { try { return localStorage.getItem(key) === '1'; } catch { return false; } };
  const [shakeEnabled, setShakeEnabledState] = useState(() => readFlag('wavShake'));
  const [tiltEnabled, setTiltEnabledState] = useState(() => readFlag('wavTilt'));
  const [motionDenied, setMotionDenied] = useState(false);
  const toggleMotion = async (kind: 'shake' | 'tilt') => {
    const current = kind === 'shake' ? shakeEnabled : tiltEnabled;
    const next = !current;
    if (next) {
      const ok = await requestMotionPermission();
      if (!ok) { setMotionDenied(true); return; }
      setMotionDenied(false);
    }
    (kind === 'shake' ? setShakeEnabledState : setTiltEnabledState)(next);
    try { localStorage.setItem(kind === 'shake' ? 'wavShake' : 'wavTilt', next ? '1' : '0'); } catch { /* not persisted */ }
    if (next) haptic('tick');
  };
  // Tilt turns the phone's left-right lean into the gradient angle, measured from wherever
  // the phone was held when tilt came on (or when it was last re-centered).
  const tiltBaseRef = useRef<{ gamma: number; angle: number } | null>(null);
  useEffect(() => { if (!tiltEnabled) tiltBaseRef.current = null; }, [tiltEnabled]);
  useMotionGestures({
    shake: shakeEnabled,
    tilt: tiltEnabled,
    onShake: () => { evolveWithFactor(1); haptic('success'); },
    onTilt: (gamma) => {
      if (!tiltBaseRef.current) tiltBaseRef.current = { gamma, angle: targetAngleRef.current };
      setTargetAngle(tiltBaseRef.current.angle + (gamma - tiltBaseRef.current.gamma) * 2.2);
    },
  });

  // Jump all the way back to the oldest snapshot in the stack
  const undoAll = useCallback(() => {
    if (undoIndexRef.current < 0) return;
    undoIndexRef.current = 0;
    undoLastChange();
  }, [undoLastChange]);

  // Reset everything to defaults — shared by the Reset button and the Shift+R hotkey
  const resetToDefaults = useCallback(() => {
    applySnapshot({});
    setIsMultiFxMode(false);
    setIsAutoColor(true);
    setActiveTab(null);
    setAIPrompt('');
  }, [applySnapshot]);

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
  
  // Submit rating for current result
  const submitRating = useCallback((rating: number) => {
    if (pendingRatingState) {
      const newRatedResult = { rating, data: pendingRatingState };
      const updatedRatings = [...ratedResults, newRatedResult];
      setRatedResults(updatedRatings);
      // Never let a full localStorage quota (shared with presets) throw
      // uncaught here — this ran as a side effect of rating, not something
      // the user consciously "saved", so it should degrade quietly rather
      // than surface an alert.
      try {
        localStorage.setItem('gradientRatings', JSON.stringify(updatedRatings));
      } catch (err) {
        console.error('Failed to persist gradientRatings to localStorage:', err);
      }
    }
    setShowRatingUI(false);
    setPendingRatingState(null);
  }, [pendingRatingState, ratedResults]);
  
  // Skip rating
  const skipRating = useCallback(() => {
    setShowRatingUI(false);
    setPendingRatingState(null);
  }, []);
  
  // Capture state when rating UI is shown (fallback if not already captured)
  useEffect(() => {
    if (showRatingUI && !pendingRatingState) {
      captureCurrentStateForRating();
    }
  }, [showRatingUI, pendingRatingState, captureCurrentStateForRating]);

  // Save to presets from rating UI
  const saveRatingAsPreset = useCallback(() => {
    submitRating(10);
    setActiveTab('presets');
    setIsPresetsDropdownOpen(true);
  }, [submitRating, setIsPresetsDropdownOpen]);

  // Shuffle Audiovisuals - randomize the Audio Controls panel (sliders +
  // BEAT/FX-on-Beat toggles), matching each control's actual slider range.
  // Leaves Auto Gain untouched — it's a mode switch, not a randomizable range.

  // Helper function to add color stops to gradient with optional hue shift
  const addGradientStops = useCallback((gradient: CanvasGradient, colors: ColorRGB[], hardEdge?: boolean) => {
    const count = colors.length;
    if (count === 0) return;
    
    // Validate colors and replace any invalid ones
    const validColors = colors.map(color => {
      if (!color || isNaN(color.r) || isNaN(color.g) || isNaN(color.b)) {
        return { r: 128, g: 128, b: 128 }; // Default gray for invalid colors
      }
      return {
        r: Math.max(0, Math.min(255, color.r)),
        g: Math.max(0, Math.min(255, color.g)),
        b: Math.max(0, Math.min(255, color.b))
      };
    });
    
    // Apply hue shift if audio is reactive
    const shouldApplyHueShift = isAudioEnabled && isAudioReactive && audioTrebleLevel > 0;
    
    const applyHueShift = (color: ColorRGB): ColorRGB =>
      shouldApplyHueShift ? shiftHueByTreble(color, audioTrebleLevel) : color;
    
    if (count === 1) {
      const shifted = applyHueShift(validColors[0]);
      gradient.addColorStop(0, `rgb(${shifted.r},${shifted.g},${shifted.b})`);
      return;
    }

    if (hardEdge) {
      // A duplicate stop at each band's start AND end (rather than one
      // shared, crossfading stop between neighbors) is what makes the
      // canvas render a flat solid color per band with a hard cut at the
      // boundary instead of a blend.
      const bandStep = 1 / count;
      for (let i = 0; i < count; i++) {
        const shifted = applyHueShift(validColors[i]);
        const rgb = `rgb(${shifted.r},${shifted.g},${shifted.b})`;
        gradient.addColorStop(Math.min(1, i * bandStep), rgb);
        gradient.addColorStop(Math.min(1, (i + 1) * bandStep), rgb);
      }
      return;
    }

    // Custom stop positions apply here too (Bias and Sharpness can't be
    // expressed as native canvas stops — those only take effect on the WebGL
    // Radial fill this is the fallback for).
    const customStops = getActivePaletteMap().stops;
    const useCustomStops = !!customStops && customStops.length === count;
    const step = 1 / (count - 1);
    for (let i = 0; i < count; i++) {
      const shifted = applyHueShift(validColors[i]);
      gradient.addColorStop(useCustomStops ? customStops![i] : i * step, `rgb(${shifted.r},${shifted.g},${shifted.b})`);
    }
  }, [isAudioEnabled, isAudioReactive, audioTrebleLevel]);

  // Contrast + saturation pulse — bass hits spike both, decay via RAF
  useEffect(() => {
    if (!isAudioEnabled || !isAudioReactive || !contrastBeatEnabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let rafId: number;
    const animate = () => {
      contrastPulseRef.current *= 0.82;
      saturationPulseRef.current *= 0.80;
      const contrast = 1 + contrastPulseRef.current * 2.0;
      const saturate = 1 + saturationPulseRef.current * 3.5;
      const active = contrastPulseRef.current > 0.01 || saturationPulseRef.current > 0.01;
      canvas.style.filter = active ? `contrast(${contrast.toFixed(2)}) saturate(${saturate.toFixed(2)})` : '';
      if (active) rafId = requestAnimationFrame(animate);
    };
    if (audioSubBassLevel > 0.3) {
      const strength = Math.min(1, audioSubBassLevel / 5);
      contrastPulseRef.current = strength;
      saturationPulseRef.current = strength;
      rafId = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(rafId);
  }, [audioSubBassLevel, isAudioEnabled, isAudioReactive, contrastBeatEnabled]);

  // Canvas shake — sub-bass onset triggers a quick x/y rumble
  useEffect(() => {
    if (!isAudioEnabled || !isAudioReactive || !shakeBeatEnabled || subBassOnsetTick === 0) return;
    const wrapper = shakeWrapperRef.current;
    if (!wrapper) return;
    let rafId: number;
    shakeRef.current = { x: (Math.random() - 0.5) * 12, y: (Math.random() - 0.5) * 8 };
    const animate = () => {
      shakeRef.current.x *= 0.65;
      shakeRef.current.y *= 0.65;
      if (Math.abs(shakeRef.current.x) < 0.3 && Math.abs(shakeRef.current.y) < 0.3) {
        wrapper.style.transform = '';
        return;
      }
      wrapper.style.transform = `translate(${shakeRef.current.x.toFixed(1)}px, ${shakeRef.current.y.toFixed(1)}px)`;
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(rafId); wrapper.style.transform = ''; };
  }, [subBassOnsetTick, isAudioEnabled, isAudioReactive, shakeBeatEnabled]);

  // Palette snap — on bass beat, jump to a vivid complementary palette instantly
  useEffect(() => {
    if (!paletteBeatEnabled || !isAudioEnabled || !isAudioReactive || bassOnsetTick === 0) return;
    const hslToRgb = (h: number, s: number, l: number) => {
      s /= 100; l /= 100;
      const k = (n: number) => (n + h / 30) % 12;
      const a = s * Math.min(l, 1 - l);
      const f = (n: number) => Math.round((l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))) * 255);
      return { r: f(0), g: f(8), b: f(4) };
    };
    const count = gradientColors.length || 4;
    const baseHue = Math.random() * 360;
    const newColors = Array.from({ length: count }, (_, i) => {
      const hue = (baseHue + (360 / count) * i + (Math.random() * 20 - 10)) % 360;
      return hslToRgb(hue, 85 + Math.random() * 15, 48 + Math.random() * 14);
    });
    setGradientColors(() => newColors);
    setTargetColors(() => newColors);
  }, [bassOnsetTick, paletteBeatEnabled, isAudioEnabled, isAudioReactive, gradientColors.length]);

  // Structural reseed — a big, energetic hit (not just any beat) rerolls
  // structuralSeed, which Caustics/Voronoi/Marble/Metaballs/
  // Topographic use to vary their underlying pattern structure, not just
  // brightness/scale. Rate-limited to ~once per 4s so a track's drop reads
  // as "the pattern itself just changed" rather than constant reshuffling.
  useEffect(() => {
    if (!isAudioEnabled || !isAudioReactive || bassOnsetTick === 0) return;
    // Scaled by the track's own recent dynamics (musicIntensityRef): a real
    // "drop" (intensity well above 1) lowers the energy bar and shortens the
    // cooldown so reseeds actually land on the big moments; a quiet stretch
    // (intensity below 1) raises both so nothing reseeds during a breakdown.
    const intensity = musicIntensityRef.current ?? 1;
    const energyBar = 0.72 / intensity;
    const cooldown = 4000 / Math.max(0.6, intensity);
    if (audioEnergy < energyBar) return;
    const now = performance.now();
    if (now - lastReseedTimeRef.current < cooldown) return;
    lastReseedTimeRef.current = now;
    setStructuralSeed(s => s + 1);
  }, [bassOnsetTick, isAudioEnabled, isAudioReactive, audioEnergy]);

  // Generate colors from AI prompt
  const generateAIColors = useCallback((prompt: string) => {
    const lowerPrompt = prompt.toLowerCase();
    const words = lowerPrompt.split(/\s+/);
    
    // Get the target length from current gradient colors
    const targetLength = gradientColors.length;
    
    // Color keyword mappings
    const colorMap: Record<string, ColorRGB> = {
      red: { r: 255, g: 50, b: 50 },
      orange: { r: 255, g: 150, b: 50 },
      yellow: { r: 255, g: 230, b: 50 },
      green: { r: 50, g: 200, b: 80 },
      blue: { r: 50, g: 120, b: 255 },
      purple: { r: 180, g: 50, b: 255 },
      pink: { r: 255, g: 100, b: 200 },
      cyan: { r: 50, g: 230, b: 230 },
      magenta: { r: 255, g: 50, b: 200 },
      lime: { r: 150, g: 255, b: 50 },
      teal: { r: 50, g: 200, b: 180 },
      indigo: { r: 100, g: 50, b: 200 },
      violet: { r: 200, g: 100, b: 255 },
      brown: { r: 150, g: 100, b: 50 },
      black: { r: 30, g: 30, b: 30 },
      white: { r: 240, g: 240, b: 240 },
      gray: { r: 128, g: 128, b: 128 },
      gold: { r: 255, g: 215, b: 0 },
      silver: { r: 192, g: 192, b: 192 },
      coral: { r: 255, g: 127, b: 80 },
      peach: { r: 255, g: 180, b: 120 },
      lavender: { r: 200, g: 180, b: 255 },
      mint: { r: 150, g: 255, b: 200 },
      rose: { r: 255, g: 100, b: 150 },
      sky: { r: 100, g: 200, b: 255 },
      navy: { r: 30, g: 50, b: 120 },
      maroon: { r: 128, g: 30, b: 50 },
      olive: { r: 128, g: 128, b: 50 },
      turquoise: { r: 64, g: 224, b: 208 },
      salmon: { r: 250, g: 128, b: 114 },
      amber: { r: 255, g: 191, b: 0 },
      aqua: { r: 0, g: 220, b: 210 },
      beige: { r: 222, g: 202, b: 173 },
      bronze: { r: 176, g: 114, b: 59 },
      burgundy: { r: 128, g: 20, b: 40 },
      charcoal: { r: 70, g: 74, b: 80 },
      crimson: { r: 220, g: 20, b: 60 },
      emerald: { r: 60, g: 190, b: 120 },
      fuchsia: { r: 255, g: 0, b: 200 },
      jade: { r: 0, g: 168, b: 120 },
      mustard: { r: 230, g: 180, b: 40 },
      plum: { r: 160, g: 70, b: 140 },
      rust: { r: 183, g: 65, b: 14 },
    };
    
    // Mood/theme mappings
    const themeMap: Record<string, ColorRGB[]> = {
      sunset: [
        { r: 255, g: 100, b: 50 },
        { r: 255, g: 150, b: 100 },
        { r: 255, g: 180, b: 150 },
        { r: 200, g: 100, b: 180 },
        { r: 150, g: 80, b: 200 },
        { r: 100, g: 50, b: 150 },
      ],
      sunrise: [
        { r: 255, g: 200, b: 150 },
        { r: 255, g: 180, b: 120 },
        { r: 255, g: 150, b: 80 },
        { r: 255, g: 230, b: 180 },
        { r: 200, g: 180, b: 255 },
        { r: 150, g: 150, b: 255 },
      ],
      ocean: [
        { r: 20, g: 100, b: 180 },
        { r: 30, g: 150, b: 220 },
        { r: 50, g: 180, b: 230 },
        { r: 100, g: 200, b: 230 },
        { r: 150, g: 220, b: 240 },
        { r: 200, g: 240, b: 250 },
      ],
      forest: [
        { r: 20, g: 80, b: 40 },
        { r: 40, g: 120, b: 60 },
        { r: 60, g: 150, b: 80 },
        { r: 100, g: 180, b: 100 },
        { r: 150, g: 200, b: 120 },
        { r: 180, g: 220, b: 150 },
      ],
      fire: [
        { r: 255, g: 50, b: 0 },
        { r: 255, g: 100, b: 0 },
        { r: 255, g: 150, b: 0 },
        { r: 255, g: 200, b: 50 },
        { r: 255, g: 230, b: 100 },
        { r: 255, g: 255, b: 150 },
      ],
      ice: [
        { r: 180, g: 230, b: 255 },
        { r: 200, g: 240, b: 255 },
        { r: 220, g: 245, b: 255 },
        { r: 240, g: 250, b: 255 },
        { r: 200, g: 230, b: 250 },
        { r: 180, g: 220, b: 245 },
      ],
      tropical: [
        { r: 255, g: 100, b: 150 },
        { r: 255, g: 180, b: 100 },
        { r: 100, g: 220, b: 180 },
        { r: 80, g: 200, b: 220 },
        { r: 150, g: 100, b: 255 },
        { r: 255, g: 150, b: 200 },
      ],
      neon: [
        { r: 255, g: 0, b: 255 },
        { r: 0, g: 255, b: 255 },
        { r: 255, g: 255, b: 0 },
        { r: 0, g: 255, b: 100 },
        { r: 255, g: 100, b: 0 },
        { r: 150, g: 0, b: 255 },
      ],
      pastel: [
        { r: 255, g: 200, b: 220 },
        { r: 220, g: 200, b: 255 },
        { r: 200, g: 230, b: 255 },
        { r: 200, g: 255, b: 230 },
        { r: 255, g: 255, b: 200 },
        { r: 255, g: 220, b: 200 },
      ],
      autumn: [
        { r: 200, g: 80, b: 50 },
        { r: 220, g: 120, b: 50 },
        { r: 240, g: 150, b: 50 },
        { r: 200, g: 150, b: 80 },
        { r: 150, g: 100, b: 60 },
        { r: 180, g: 80, b: 40 },
      ],
      spring: [
        { r: 255, g: 200, b: 220 },
        { r: 200, g: 255, b: 200 },
        { r: 255, g: 255, b: 180 },
        { r: 180, g: 220, b: 255 },
        { r: 255, g: 220, b: 255 },
        { r: 220, g: 255, b: 220 },
      ],
      winter: [
        { r: 200, g: 220, b: 240 },
        { r: 180, g: 200, b: 230 },
        { r: 220, g: 230, b: 250 },
        { r: 150, g: 180, b: 220 },
        { r: 190, g: 210, b: 240 },
        { r: 210, g: 225, b: 245 },
      ],
      galaxy: [
        { r: 100, g: 50, b: 150 },
        { r: 150, g: 50, b: 200 },
        { r: 80, g: 100, b: 180 },
        { r: 200, g: 100, b: 255 },
        { r: 50, g: 150, b: 255 },
        { r: 150, g: 100, b: 220 },
      ],
      desert: [
        { r: 240, g: 200, b: 150 },
        { r: 230, g: 180, b: 120 },
        { r: 220, g: 160, b: 100 },
        { r: 200, g: 150, b: 90 },
        { r: 210, g: 170, b: 110 },
        { r: 190, g: 140, b: 80 },
      ],
      candy: [
        { r: 255, g: 100, b: 200 },
        { r: 255, g: 150, b: 255 },
        { r: 150, g: 200, b: 255 },
        { r: 255, g: 200, b: 150 },
        { r: 200, g: 255, b: 200 },
        { r: 255, g: 255, b: 150 },
      ],
      earth: [
        { r: 100, g: 80, b: 50 },
        { r: 120, g: 100, b: 60 },
        { r: 80, g: 120, b: 80 },
        { r: 140, g: 120, b: 80 },
        { r: 100, g: 140, b: 100 },
        { r: 160, g: 140, b: 100 },
      ],
      rainbow: [
        { r: 255, g: 0, b: 0 },
        { r: 255, g: 150, b: 0 },
        { r: 255, g: 255, b: 0 },
        { r: 0, g: 255, b: 0 },
        { r: 0, g: 150, b: 255 },
        { r: 150, g: 0, b: 255 },
      ],
      monochrome: [
        { r: 50, g: 50, b: 50 },
        { r: 100, g: 100, b: 100 },
        { r: 150, g: 150, b: 150 },
        { r: 180, g: 180, b: 180 },
        { r: 210, g: 210, b: 210 },
        { r: 230, g: 230, b: 230 },
      ],
      midnight: [
        { r: 20, g: 20, b: 50 },
        { r: 30, g: 30, b: 80 },
        { r: 40, g: 40, b: 100 },
        { r: 50, g: 50, b: 120 },
        { r: 80, g: 60, b: 140 },
        { r: 100, g: 80, b: 160 },
      ],
      cherry: [
        { r: 255, g: 50, b: 100 },
        { r: 255, g: 80, b: 120 },
        { r: 255, g: 100, b: 140 },
        { r: 220, g: 50, b: 100 },
        { r: 200, g: 40, b: 80 },
        { r: 180, g: 30, b: 60 },
      ],
      aurora: [
        { r: 30, g: 200, b: 150 },
        { r: 80, g: 220, b: 180 },
        { r: 100, g: 180, b: 255 },
        { r: 150, g: 100, b: 255 },
        { r: 200, g: 80, b: 220 },
        { r: 80, g: 255, b: 200 },
      ],
      cosmic: [
        { r: 20, g: 10, b: 60 },
        { r: 60, g: 20, b: 120 },
        { r: 120, g: 40, b: 180 },
        { r: 200, g: 60, b: 200 },
        { r: 80, g: 100, b: 220 },
        { r: 255, g: 100, b: 180 },
      ],
      cyberpunk: [
        { r: 255, g: 0, b: 150 },
        { r: 0, g: 255, b: 255 },
        { r: 150, g: 0, b: 255 },
        { r: 255, g: 200, b: 0 },
        { r: 0, g: 200, b: 255 },
        { r: 255, g: 0, b: 100 },
      ],
      dusk: [
        { r: 255, g: 150, b: 100 },
        { r: 220, g: 120, b: 130 },
        { r: 180, g: 100, b: 160 },
        { r: 120, g: 80, b: 180 },
        { r: 70, g: 60, b: 150 },
        { r: 40, g: 40, b: 100 },
      ],
      ember: [
        { r: 80, g: 20, b: 10 },
        { r: 150, g: 40, b: 10 },
        { r: 200, g: 70, b: 20 },
        { r: 255, g: 120, b: 30 },
        { r: 255, g: 170, b: 60 },
        { r: 255, g: 210, b: 120 },
      ],
      frost: [
        { r: 210, g: 230, b: 240 },
        { r: 180, g: 210, b: 230 },
        { r: 150, g: 190, b: 220 },
        { r: 120, g: 170, b: 210 },
        { r: 200, g: 220, b: 235 },
        { r: 230, g: 240, b: 245 },
      ],
      jungle: [
        { r: 10, g: 60, b: 30 },
        { r: 30, g: 100, b: 50 },
        { r: 60, g: 140, b: 60 },
        { r: 100, g: 170, b: 70 },
        { r: 150, g: 200, b: 90 },
        { r: 200, g: 220, b: 120 },
      ],
      lagoon: [
        { r: 10, g: 90, b: 100 },
        { r: 20, g: 130, b: 140 },
        { r: 40, g: 170, b: 170 },
        { r: 80, g: 200, b: 190 },
        { r: 130, g: 220, b: 210 },
        { r: 180, g: 240, b: 230 },
      ],
      lava: [
        { r: 20, g: 10, b: 10 },
        { r: 80, g: 20, b: 10 },
        { r: 180, g: 40, b: 10 },
        { r: 255, g: 80, b: 10 },
        { r: 255, g: 150, b: 30 },
        { r: 255, g: 210, b: 80 },
      ],
      nebula: [
        { r: 60, g: 20, b: 100 },
        { r: 120, g: 40, b: 160 },
        { r: 180, g: 60, b: 200 },
        { r: 220, g: 100, b: 220 },
        { r: 100, g: 80, b: 220 },
        { r: 60, g: 150, b: 220 },
      ],
      retro: [
        { r: 210, g: 100, b: 60 },
        { r: 230, g: 150, b: 60 },
        { r: 220, g: 180, b: 80 },
        { r: 160, g: 110, b: 70 },
        { r: 120, g: 80, b: 60 },
        { r: 200, g: 60, b: 70 },
      ],
      vaporwave: [
        { r: 255, g: 110, b: 200 },
        { r: 180, g: 110, b: 255 },
        { r: 110, g: 200, b: 255 },
        { r: 255, g: 180, b: 230 },
        { r: 200, g: 150, b: 255 },
        { r: 130, g: 230, b: 255 },
      ],
    };
    
    // Check for theme matches first
    for (const [theme, colors] of Object.entries(themeMap)) {
      if (lowerPrompt.includes(theme)) {
        // Adjust theme colors to match target length
        return adjustColorArrayLength(colors, targetLength);
      }
    }
    
    // Check for individual color keywords
    const foundColors: ColorRGB[] = [];
    for (const word of words) {
      if (colorMap[word]) {
        foundColors.push(colorMap[word]);
      }
    }
    
    // If we found colors, create variations to fill targetLength slots
    if (foundColors.length > 0) {
      const colors: ColorRGB[] = [];
      while (colors.length < targetLength) {
        for (const color of foundColors) {
          if (colors.length >= targetLength) break;
          
          // Create variations by adjusting brightness
          const variation = colors.length / targetLength;
          const factor = 0.7 + variation * 0.6; // Range from 0.7 to 1.3
          
          colors.push({
            r: Math.min(255, Math.max(0, Math.floor(color.r * factor))),
            g: Math.min(255, Math.max(0, Math.floor(color.g * factor))),
            b: Math.min(255, Math.max(0, Math.floor(color.b * factor))),
          });
        }
      }
      return colors;
    }
    
    // Mood-based color generation
    if (words.some(w => ['happy', 'joy', 'cheerful', 'bright', 'sunny'].includes(w))) {
      return adjustColorArrayLength([
        { r: 255, g: 230, b: 100 },
        { r: 255, g: 200, b: 150 },
        { r: 255, g: 150, b: 100 },
        { r: 255, g: 180, b: 200 },
        { r: 200, g: 150, b: 255 },
        { r: 150, g: 200, b: 255 },
      ], targetLength);
    }
    
    if (words.some(w => ['sad', 'melancholy', 'dark', 'moody', 'gloomy'].includes(w))) {
      return adjustColorArrayLength([
        { r: 50, g: 60, b: 80 },
        { r: 60, g: 70, b: 100 },
        { r: 70, g: 80, b: 120 },
        { r: 80, g: 90, b: 130 },
        { r: 100, g: 110, b: 150 },
        { r: 120, g: 130, b: 170 },
      ], targetLength);
    }
    
    if (words.some(w => ['calm', 'peaceful', 'serene', 'relaxing', 'zen'].includes(w))) {
      return adjustColorArrayLength([
        { r: 180, g: 220, b: 230 },
        { r: 200, g: 230, b: 235 },
        { r: 180, g: 230, b: 220 },
        { r: 200, g: 235, b: 225 },
        { r: 190, g: 225, b: 235 },
        { r: 210, g: 235, b: 230 },
      ], targetLength);
    }
    
    if (words.some(w => ['energetic', 'vibrant', 'bold', 'intense', 'powerful'].includes(w))) {
      return adjustColorArrayLength([
        { r: 255, g: 0, b: 100 },
        { r: 255, g: 100, b: 0 },
        { r: 255, g: 200, b: 0 },
        { r: 0, g: 255, b: 150 },
        { r: 0, g: 150, b: 255 },
        { r: 200, g: 0, b: 255 },
      ], targetLength);
    }
    
    // Default: Generate random vibrant colors
    return Array.from({ length: targetLength }, () => randomColor());
  }, [gradientColors, adjustColorArrayLength, randomColor]);

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

  // Color AUTO PLAY — cycles colors independently of gradient AUTO PLAY.
  // Skipped entirely in Display mode: this uses Math.random() every 800ms,
  // so two windows each running their own copy would diverge in color
  // immediately even with identical gradient type/shape/animation phase —
  // exactly the "shape matches, colors don't" symptom reported. The
  // resulting gradientColors/targetColors are already part of
  // buildSnapshot, so the Display tab gets the controller's actual colors
  // via the existing sync instead of rolling its own.
  useEffect(() => {
    if (IS_DISPLAY_MODE) return;
    if (!isAutoColor) return;

    const applyColorShift = (color: ColorRGB, baseColor: ColorRGB | null, shiftRange: number): ColorRGB => {
      if (baseColor) {
        const maxDrift = 30;
        const newR = Math.max(baseColor.r - maxDrift, Math.min(baseColor.r + maxDrift, color.r + (Math.random() - 0.5) * shiftRange));
        const newG = Math.max(baseColor.g - maxDrift, Math.min(baseColor.g + maxDrift, color.g + (Math.random() - 0.5) * shiftRange));
        const newB = Math.max(baseColor.b - maxDrift, Math.min(baseColor.b + maxDrift, color.b + (Math.random() - 0.5) * shiftRange));
        return { r: Math.max(0, Math.min(255, newR)), g: Math.max(0, Math.min(255, newG)), b: Math.max(0, Math.min(255, newB)) };
      }
      return {
        r: Math.max(0, Math.min(255, color.r + (Math.random() - 0.5) * shiftRange)),
        g: Math.max(0, Math.min(255, color.g + (Math.random() - 0.5) * shiftRange)),
        b: Math.max(0, Math.min(255, color.b + (Math.random() - 0.5) * shiftRange)),
      };
    };

    const interval = setInterval(() => {
      if (gradientType === 'voronoi' || gradientType === 'radial-burst' || gradientType === 'flower' || gradientType === 'noise') {
        setTargetColors(prev => prev.map((color, index) => applyColorShift(color, baseAIColors?.[index] || null, 60)));
      } else {
        // Capped at the palette size: with 2 colors, asking for 3 distinct indices never
        // finishes, and the loop below froze the whole page.
        const numColorsToChange = Math.min(gradientColors.length, Math.floor(Math.random() * 2) + 2);
        const indicesToChange = new Set<number>();
        while (indicesToChange.size < numColorsToChange) {
          indicesToChange.add(Math.floor(Math.random() * gradientColors.length));
        }
        setTargetColors(prev =>
          prev.map((color, index) =>
            applyColorShift(color, baseAIColors?.[index] || null, indicesToChange.has(index) ? 40 : 16)
          )
        );
      }
    }, 800);

    return () => clearInterval(interval);
  }, [isAutoColor, gradientColors.length, gradientType, baseAIColors]);

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
    kaleidoscopeSegments, kaleidoscopeRotateSpeed, twistAmount, pixelSize, triangleSize, triangulateVariation, chromaticOffset, fisheyeStrength,
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
    ditherType, ditherLevels, ditherScale, oilPaintRadius, oilPaintLevels, impastoStrength, impastoLightAngle, brushStrokesSize, brushStrokesLength, watercolorBleed, watercolorGrain, watercolorStyle, dadaPanels, dadaChaos, slitScanIntensity, slitScanDirection, slitScanHistory,
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
  }), [resolutionMultiplier, gradientType, activeEffects, kaleidoscopeSegments, kaleidoscopeRotateSpeed, twistAmount, pixelSize, triangleSize, triangulateVariation, chromaticOffset, fisheyeStrength, grainIntensity, grainType, grainSize, gessoWhiteness, gessoTexture, gessoResponse, blurMotionAmount, blurGaussianAmount, blurRadialAmount, blurMotionDirection, blurType, posterizeLevels, halftoneSize, halftoneVariation, halftoneMove, halftoneMoveSpeed, halftoneCMYK, bloomIntensity, bloomRadius, feedbackDecay, feedbackZoom, feedbackRotation, vignetteStrength, colorShiftHue, paletteHue, paletteSaturation, paletteBrightness, paletteContrast, pinchStrength, hexGridSize, linesCount, linesAngle, linesThickness, dustCrackleColor, dustCrackleIntensity, dustCrackleLength, vhsGlitchIntensity, vhsJitterAmount, crtIntensity, crtScanlineSpacing, waveDistortionStrength, waveDistortionRotation, liquifyStrength, sepiaIntensity, solarizeThreshold, lightLeakIntensity, duotoneIntensity, duotoneColor1, duotoneColor2, duotoneColor3, duotoneThreeColor, digitalNoiseIntensity, gridRotation, gridRows, gridColumns, gridShapeSize, gridCellAngleStep, gridVariation, gridHardEdge, gridMode, angleStartOffset, angleCenterX, angleCenterY, angleHardEdge, windmillTightness, windmillRotations, windmillThickness, windmillZoom, windmillZoomResponse, windmillMode, shapesSides, shapesCount, shapesMode, concentricRingWidth, concentricRingCount, turrellSpeed, turrellGlow, stackCount, stackGap, stackWidth, stackLength, stackResponse, hatchLayers, hatchSpacing, hatchResponse, hatchSpeed, polygon2Sides, radialSizeScale, radialHardEdge, radialSpeed, noiseScale, noiseOctaves, noiseWarp, noiseType, noiseSpeed, radialBurstCount, radialBurstMode, radialBurstSpread, radialBurstSize, voronoiCellCount, voronoiDistortion, helixTurns, helixTightness, radarSweepAngle, radarFadeLength, flowerCircles, flowerScale, flowerSpread, flowerRotation, flowerSymmetry, flowerOpacity, auroraBandCount, auroraWaveSpeed, auroraBandHeight, causticsBrightness, causticsScale, lavaBlobCount, lavaBlobSize, lavaSpeed, marbleVeinFreq, marbleTurbulence, marbleOctaves, noiseDirection, ditherType, ditherLevels, ditherScale, oilPaintRadius, oilPaintLevels, impastoStrength, impastoLightAngle, brushStrokesSize, brushStrokesLength, watercolorBleed, watercolorGrain, watercolorStyle, dadaPanels, dadaChaos, slitScanIntensity, slitScanDirection, slitScanHistory, addGradientStops, isAudioEnabled, isAudioReactive, fadeDirection, fadeMode, radarBeamWidth, chromaticAngle, vignetteSoftness, fisheyeCenterX, fisheyeCenterY, mirrorMode, mirrorTileCount, metaballCount, metaballSize, metaballSpeed, truchetSize, truchetVariation, truchetThickness, flowParticleCount, flowSpeed, flowScale, flowThickness, attractorPointCount, attractorSpeed, attractorScale, attractorDotSize, particlesCount, particlesSpeed, particlesSize, particlesTrail, particlesGravity, particlesSides, particlesMode, marksCount, marksSize, marksDecay, tilingSize, tilingSymmetry, tilingComplexity, tilingRotation, tilingAnimTime, tilingRowOffset, waveInterferenceAnimTime, waveInterferenceSourceCount, waveInterferenceFrequency, waveInterferenceSpeed, meshWireframeAnimTime, meshWireframeGridSize, meshWireframeJitter, meshWireframeLineWidth, fireworksCount, fireworksParticleCount, fireworksTrailFade, lightningBoltCount, lightningJitter, lightningBranchiness, reactionDiffusionFeed, reactionDiffusionKill, reactionDiffusionSpeed, topographicScale, topographicBands, topographicLineWidth, juliaReal, juliaImaginary, juliaZoom, juliaIterations, auraGlowCount, auraGlowSpeed, auraGlowOpacity, asciiSize, asciiColor, asciiChars, emojiSize, emojiChars, emojiRotateSpeed, liquidStrength, liquidScale, chromaticTrailsDecay, chromaticTrailsOffset, fieldContrast, paletteMode, colorBlend, fieldScale, fieldSpeed, fieldShapeA, fieldShapeB, fieldExposure, fieldTone, fieldGrade, fieldSwirl, paletteStops, paletteBias, paletteSharp, paletteBands, invertAmount, attractorTrailFade, structuralSeed, audioBindings, photoVersion, photoBlendMode, photoOpacity, depthLayerEnabled, depthLayerStrength]);

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
    concentricRingWidth, helixTightness, helixTurns, ditherLevels, ditherType, ditherScale, oilPaintRadius, oilPaintLevels, impastoStrength, impastoLightAngle, brushStrokesSize, brushStrokesLength, watercolorBleed, watercolorGrain, watercolorStyle, dadaPanels, dadaChaos, drawParams,
    auraGlowCount, auraGlowSpeed, auraGlowOpacity,
    fieldContrast, paletteMode, colorBlend, fieldScale, fieldSpeed, fieldShapeA, fieldShapeB, fieldExposure, fieldTone, fieldGrade, fieldSwirl, paletteStops, paletteBias, paletteSharp, paletteBands, invertAmount, attractorTrailFade, structuralSeed,
    depthLayerEnabled, depthLayerStrength,
    drawParamsDirtyRef, drawRef, duotoneColor1, duotoneColor2, duotoneColor3, duotoneIntensity,
    duotoneThreeColor, dustCrackleColor, dustCrackleIntensity, dustCrackleLength, emojiChars, emojiOffsetX, emojiSize,
    emojiSizeVariation, fadeDirection, feedbackBufferRef, feedbackDecay, feedbackRotation, feedbackZoom,
    fisheyeCenterX, fisheyeCenterY, fisheyeStrength, flowBufferRef, flowParticleCount,
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



  const handleInteraction = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Calculate angle from the center of the canvas's own display box, not
    // the window — the canvas no longer spans the full viewport now that
    // the rail is a docked sidebar the canvas area reflows around.
    const canvasRect = canvas.getBoundingClientRect();
    const centerX = canvasRect.left + canvasRect.width / 2;
    const centerY = canvasRect.top + canvasRect.height / 2;
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;

    // Update gradient angle based on mouse position relative to center
    if (previousPosition.current) {
      const prevDeltaX = previousPosition.current.x - centerX;
      const prevDeltaY = previousPosition.current.y - centerY;

      // Calculate cross product to determine rotation direction
      const crossProduct = prevDeltaX * deltaY - prevDeltaY * deltaX;

      // If moving in a circular pattern, update the angle
      if (Math.abs(crossProduct) > 100) { // Threshold to detect circular motion
        const angleIncrement = crossProduct > 0 ? 5 : -5;
        setTargetAngle(prev => prev + angleIncrement);
      }
    }

    previousPosition.current = { x: clientX, y: clientY };

    const currentTime = Date.now();
    if (currentTime - lastChangeTime.current < CHANGE_INTERVAL) return;

    // Calculate which part of the canvas was touched to determine which color to change
    const relativeX = (clientX - canvasRect.left) / canvasRect.width;
    
    // Determine which color index to change based on horizontal position
    const colorIndex = Math.floor(relativeX * gradientColors.length);
    const clampedIndex = Math.max(0, Math.min(colorIndex, gradientColors.length - 1));

    // Update only the selected color
    setTargetColors(prev => 
      prev.map((color, index) => {
        if (index === clampedIndex) {
          // If we have base AI colors, create a variation of the base color
          if (baseAIColors && baseAIColors[index]) {
            const baseColor = baseAIColors[index];
            const maxDrift = 40; // Allow some variation during interaction
            return {
              r: Math.max(0, Math.min(255, baseColor.r + (Math.random() - 0.5) * maxDrift * 2)),
              g: Math.max(0, Math.min(255, baseColor.g + (Math.random() - 0.5) * maxDrift * 2)),
              b: Math.max(0, Math.min(255, baseColor.b + (Math.random() - 0.5) * maxDrift * 2)),
            };
          }
          // No base colors, use random
          return randomColor();
        }
        return color;
      })
    );
    
    lastChangeTime.current = currentTime;
  }, [isDragging, gradientColors.length, baseAIColors, randomColor]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Clicking the canvas is "outside" whichever tab drawer (Gradient/
    // Effects/Audio/Color/Presets) is open — same dismissal Escape already
    // does, just reachable without the keyboard. Auto Shuffle/About already
    // close on any outside click via their own document-level listeners
    // (see the effect above renderAutoShufflePopover), so this only needs
    // to cover the one popup that didn't have that: the main drawer.
    if (activeTab) setActiveTab(null);
    // Self-animating gradients — drag interaction conflicts with their own animation
    if (NO_DRAG_TYPES.includes(gradientType ?? '')) return;
    // Particles' 'flow-field' mode drifts on its own too — same reasoning
    // as NO_DRAG_TYPES above, just mode- rather than type-gated since it's
    // no longer its own standalone gradient type.
    if (gradientType === 'particles' && particlesMode === 'flow-field') return;

    setIsDragging(true);
    previousPosition.current = null;
  };

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    previousPosition.current = null;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    handleInteraction(e.clientX, e.clientY);
  }, [handleInteraction]);

  // ---- Touch gestures on the canvas -------------------------------------------------
  //   flick left / right     forward (redo, else Shuffle) / back (Undo)
  //   pinch                  zoom
  //   twist with two fingers rotate
  //   double-tap             pause / play
  //   press and hold         hide / show the controls
  //   drag in a circle       spin the gradient and re-roll the color under the finger (as before)
  // Once a touch is clearly horizontal it stops driving that drag and puts back whatever the
  // first few pixels changed, so a flick doesn't leave stray color changes. Slow horizontal
  // drags therefore do nothing; vertical and circular drags work as before.
  interface TouchGesture {
    x: number; y: number; t: number;
    horizontal: boolean; moved: boolean; longFired: boolean; wasPinch: boolean; threeFinger: boolean; threeMoved?: boolean;
    longTimer: ReturnType<typeof setTimeout> | null;
    colors: ColorRGB[]; angle: number;
    pinch: { d0: number; a0: number; zoom0: number; angle0: number } | null;
  }
  const gestureRef = useRef<TouchGesture | null>(null);
  const lastTapRef = useRef<{ t: number; x: number; y: number } | null>(null);
  const SWIPE_MIN_PX = 70;
  const SWIPE_MAX_MS = 700;
  const LONG_PRESS_MS = 550;
  const MOVE_SLOP_PX = 10;
  const DOUBLE_TAP_MS = 320;

  const clearLongTimer = (g: TouchGesture | null) => {
    if (g?.longTimer) { clearTimeout(g.longTimer); g.longTimer = null; }
  };
  const pinchMetrics = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const a = e.touches[0], b = e.touches[1];
    const dx = b.clientX - a.clientX, dy = b.clientY - a.clientY;
    return { d: Math.max(1, Math.hypot(dx, dy)), a: (Math.atan2(dy, dx) * 180) / Math.PI };
  };

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (activeTab) setActiveTab(null);
    setIsDragging(true);
    previousPosition.current = null;
    const prev = gestureRef.current;
    if (e.touches.length >= 2 && prev) {
      // A second finger: this is a pinch/twist, not a tap, swipe or hold. A third makes it a
      // three-finger tap instead (see touchend), so the pinch is dropped.
      clearLongTimer(prev);
      prev.moved = true; prev.horizontal = false; prev.wasPinch = true;
      if (e.touches.length >= 3) { prev.threeFinger = true; prev.pinch = null; return; }
      const m = pinchMetrics(e);
      prev.pinch = { d0: m.d, a0: m.a, zoom0: targetZoomRef.current, angle0: targetAngleRef.current };
      return;
    }
    clearLongTimer(prev);
    const t = e.touches[0];
    if (!t) { gestureRef.current = null; return; }
    const g: TouchGesture = {
      x: t.clientX, y: t.clientY, t: performance.now(),
      horizontal: false, moved: false, longFired: false, wasPinch: false, threeFinger: false, longTimer: null,
      colors: targetColorsRef.current.map(c => ({ ...c })), angle: targetAngleRef.current, pinch: null,
    };
    g.longTimer = setTimeout(() => {
      g.longTimer = null;
      if (g.moved || g.longFired) return;
      g.longFired = true;
      gestureActionsRef.current.toggleControls();
    }, LONG_PRESS_MS);
    gestureRef.current = g;
  }, [activeTab, setActiveTab]);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    setIsDragging(false);
    previousPosition.current = null;
    const g = gestureRef.current;
    if (!g) return;
    clearLongTimer(g);
    if (e.touches.length > 0) return; // fingers still down: the gesture isn't over
    gestureRef.current = null;
    // Three fingers down and up together, without sliding: Save PNG (the S key's job).
    if (g.threeFinger && !g.threeMoved && performance.now() - g.t < 600) {
      haptic('success');
      exportAsPNG('preview');
      return;
    }
    if (g.wasPinch || g.longFired) return;
    const t = e.changedTouches[0];
    if (!t) return;
    const elapsed = performance.now() - g.t;
    const dx = t.clientX - g.x;
    // Flick: forward / back.
    if (g.horizontal && Math.abs(dx) >= SWIPE_MIN_PX && elapsed <= SWIPE_MAX_MS) {
      if (dx < 0) gestureActionsRef.current.goForward();
      else gestureActionsRef.current.goBack();
      return;
    }
    // Tap: a second one close behind the first is a double-tap (pause / play).
    if (!g.moved && elapsed < 260) {
      const now = performance.now();
      const last = lastTapRef.current;
      if (last && now - last.t < DOUBLE_TAP_MS && Math.hypot(t.clientX - last.x, t.clientY - last.y) < 40) {
        lastTapRef.current = null;
        gestureActionsRef.current.togglePause();
      } else {
        lastTapRef.current = { t: now, x: t.clientX, y: t.clientY };
      }
    }
  }, []);

  const handleTouchCancel = useCallback(() => {
    setIsDragging(false);
    previousPosition.current = null;
    clearLongTimer(gestureRef.current);
    gestureRef.current = null;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    const g = gestureRef.current;
    if (e.touches.length >= 2) {
      if (!g) return;
      clearLongTimer(g);
      g.moved = true; g.horizontal = false; g.wasPinch = true;
      if (g.threeFinger || e.touches.length >= 3) {
        g.threeFinger = true;
        // Any real slide turns the three-finger touch into nothing (not a tap).
        if (Math.hypot(e.touches[0].clientX - g.x, e.touches[0].clientY - g.y) > 24) g.threeMoved = true;
        return;
      }
      const m = pinchMetrics(e);
      if (!g.pinch) g.pinch = { d0: m.d, a0: m.a, zoom0: targetZoomRef.current, angle0: targetAngleRef.current };
      // Pinch scales zoom by how far the fingers have spread; twisting adds the change in
      // the angle between them to the gradient's angle.
      lastManualZoomTime.current = Date.now();
      setTargetZoom(Math.max(0.05, Math.min(20, g.pinch.zoom0 * (m.d / g.pinch.d0))));
      let dA = m.a - g.pinch.a0;
      if (dA > 180) dA -= 360; else if (dA < -180) dA += 360;
      setTargetAngle(g.pinch.angle0 + dA);
      return;
    }
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      if (g) {
        const dx = touch.clientX - g.x, dy = touch.clientY - g.y;
        if (!g.moved && Math.hypot(dx, dy) > MOVE_SLOP_PX) { g.moved = true; clearLongTimer(g); }
        if (!g.horizontal && Math.abs(dx) > 24 && Math.abs(dx) > Math.abs(dy) * 1.8) {
          g.horizontal = true;
          // Undo what the first pixels of this flick already did to the colors and angle.
          setTargetColors(g.colors.map(c => ({ ...c })));
          setTargetAngle(g.angle);
        }
        if (g.horizontal) return;
      }
      handleInteraction(touch.clientX, touch.clientY);
    }
  }, [handleInteraction, isAutoMode]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    // ctrlKey signals a trackpad pinch gesture — ignore it
    if (e.ctrlKey) { e.preventDefault(); return; }
    e.preventDefault();
    lastManualZoomTime.current = Date.now();
    const multiplier = (isAutoMode ? 0.01 : 0.025) * 0.5;
    const zoomDelta = -e.deltaY * multiplier;
    setTargetZoom(prev => Math.max(0.05, Math.min(20, prev + zoomDelta)));
  }, [isAutoMode]);

  // Export gradient as JPG
  const exportGradient = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Convert canvas to JPG and download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `gradient-${Date.now()}.jpg`;
        link.click();
        URL.revokeObjectURL(url);
      }
    }, 'image/jpeg', 0.95);
  }, []);

  // Export gradient as PNG. With a size picked, the artwork is re-rendered at that
  // size (full-resolution gradients, no pixel budget) for a few frames, the
  // wanted region is copied out, and normal rendering resumes. Effects that keep
  // history between frames (Feedback, Chromatic Trails, Slit-Scan) restart when
  // the canvas changes size, so they come out as a fresh frame.
  const isExportingRef = useRef(false);
  // `preview` (the three-finger tap) doesn't download: it opens a sheet showing the image, because
  // a web page can't write to the photo library. Pressing and holding the image on an iPhone or
  // Android offers Add to Photos, which the share sheet's file route (Files, Drive) does not.
  const [savePreview, setSavePreview] = useState<{ url: string; blob: Blob; name: string } | null>(null);
  const exportAsPNG = useCallback(async (mode: 'download' | 'preview' = 'download') => {
    const canvas = canvasRef.current;
    if (!canvas || isExportingRef.current) return;
    isExportingRef.current = true;
    const { size, aspect } = exportSettingsRef.current;
    const cssW = canvas.clientWidth || canvas.width;
    const cssH = canvas.clientHeight || canvas.height;
    // The region to keep, in CSS pixels, centered.
    const ratio = EXPORT_ASPECTS.find(a => a.id === aspect)?.ratio ?? 0;
    let cropW = cssW, cropH = cssH;
    if (ratio > 0) {
      if (cssW / cssH > ratio) cropW = cssH * ratio; else cropH = cssW / ratio;
    }
    const longEdge = EXPORT_SIZES.find(o => o.id === size)?.longEdge ?? 0;
    const nextFrame = () => new Promise<void>(r => requestAnimationFrame(() => r()));
    try {
      if (longEdge > 0) {
        const want = longEdge / Math.max(cropW, cropH);
        const mult = Math.min(want, EXPORT_MAX_EDGE / Math.max(cssW, cssH), Math.sqrt(EXPORT_MAX_PIXELS / (cssW * cssH)));
        exportRender.multiplier = mult;
        drawParamsDirtyRef.current = true;
        // Wait for the canvas to actually reach that size, then two more frames so
        // the render at that size is on it.
        for (let i = 0; i < 90 && canvas.width < Math.floor(cssW * mult); i++) await nextFrame();
        await nextFrame();
        await nextFrame();
      }
      const k = canvas.width / cssW;
      const outW = Math.max(1, Math.round(cropW * k));
      const outH = Math.max(1, Math.round(cropH * k));
      const out = document.createElement('canvas');
      out.width = outW;
      out.height = outH;
      const octx = out.getContext('2d');
      if (!octx) return;
      octx.drawImage(canvas, Math.round((canvas.width - outW) / 2), Math.round((canvas.height - outH) / 2), outW, outH, 0, 0, outW, outH);
      const blob = await new Promise<Blob | null>(r => out.toBlob(r, 'image/png'));
      if (blob) {
        const name = `gradient-${outW}x${outH}-${Date.now()}.png`;
        if (mode === 'preview') {
          setSavePreview(prev => { if (prev) URL.revokeObjectURL(prev.url); return { url: URL.createObjectURL(blob), blob, name }; });
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = name;
        link.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      exportRender.multiplier = 0;
      drawParamsDirtyRef.current = true;
      isExportingRef.current = false;
    }
  }, []);

  // Seamless loop: renders the shader gradient frame by frame into an MP4 whose last frame leads straight
  // back into its first (the picture is cross-faded with itself one loop earlier; see loopRender).
  const [loopSeconds, setLoopSecondsState] = useState<LoopSeconds>(() => {
    try { const v = localStorage.getItem('loopSeconds'); return LOOP_LENGTHS.some(o => o.id === v) ? (v as LoopSeconds) : '6'; } catch { return '6'; }
  });
  const setLoopSeconds = (v: LoopSeconds) => { setLoopSecondsState(v); try { localStorage.setItem('loopSeconds', v); } catch { /* not persisted */ } };
  const [loopProgress, setLoopProgress] = useState<number | null>(null);
  const [loopError, setLoopError] = useState<string | null>(null);
  const loopCancelRef = useRef(false);
  const loopable = STYLE_FIELD_GRADIENT_TYPES.includes(gradientType as GradientType);
  const exportLoop = async () => {
    if (loopProgress !== null) { loopCancelRef.current = true; return; }
    const canvas = canvasRef.current;
    if (!canvas || !loopable) return;
    setLoopError(null);
    if (!webCodecsAvailable()) { setLoopError('This browser can’t encode video (it needs WebCodecs).'); return; }
    loopCancelRef.current = false;
    setLoopProgress(0);
    // Freeze everything that drifts on its own, so the only thing moving is the loop.
    const wasAutoColor = isAutoColorRef.current, wasAuto = isAutoModeRef.current, wasShuffle = isAutoShuffleOn;
    if (wasAutoColor) setIsAutoColor(false);
    if (wasAuto) setIsAutoMode(false);
    if (wasShuffle) setIsAutoShuffleOn(false);
    const nextFrame = () => new Promise<void>(r => requestAnimationFrame(() => r()));
    try {
      await nextFrame();
      const longEdge = VIDEO_SIZES.find(o => o.id === videoSize)?.longEdge ?? 0;
      const cssW = canvas.clientWidth || canvas.width, cssH = canvas.clientHeight || canvas.height;
      const mult = evenMultiplier(cssW, cssH, longEdge || Math.max(cssW, cssH) * (canvas.width / cssW));
      exportRender.multiplier = mult;
      const seconds = Number(loopSeconds);
      // Shader time runs at (playback speed x this gradient's Speed) per real second.
      const speed = vcrPlaybackSpeedRef.current * (animValuesRef.current.fieldSpeedLive ?? 1);
      loopRender.base = animValuesRef.current.fieldAnimTime ?? 0;
      loopRender.T = Math.max(0.001, seconds * speed);
      loopRender.phase = 0;
      loopRender.active = true;
      drawParamsDirtyRef.current = true;
      for (let i = 0; i < 90 && canvas.width < Math.floor(cssW * mult); i++) await nextFrame();
      await nextFrame();
      const blob = await renderLoopToMp4({
        canvas, seconds, fps: 30,
        drawFrame: async (phase) => { loopRender.phase = phase; drawParamsDirtyRef.current = true; await nextFrame(); await nextFrame(); },
        onProgress: setLoopProgress,
        isCancelled: () => loopCancelRef.current,
      });
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `wav-loop-${canvas.width}x${canvas.height}-${seconds}s.mp4`;
        link.click();
        URL.revokeObjectURL(url);
        haptic('success');
      }
    } catch (err) {
      console.error('Loop export failed:', err);
      setLoopError(err instanceof Error ? err.message : 'The loop could not be rendered.');
    } finally {
      loopRender.active = false;
      exportRender.multiplier = 0;
      drawParamsDirtyRef.current = true;
      if (wasAutoColor) setIsAutoColor(true);
      if (wasAuto) setIsAutoMode(true);
      if (wasShuffle) setIsAutoShuffleOn(true);
      setLoopProgress(null);
    }
  };

  // Starts (or stops) a video take from the Save popout. A chosen size re-renders the artwork at that
  // size first, since the encoder is fixed to the canvas size at the moment recording begins.
  const startVideoTake = async () => {
    if (isRecording) { toggleVCRRecording(); return; }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const longEdge = VIDEO_SIZES.find(o => o.id === videoSize)?.longEdge ?? 0;
    let sized = false;
    if (longEdge > 0) {
      const cssW = canvas.clientWidth || canvas.width, cssH = canvas.clientHeight || canvas.height;
      // H.264 wants even width and height: nudge the scale until both come out even.
      let mult = Math.min(longEdge / Math.max(cssW, cssH), EXPORT_MAX_EDGE / Math.max(cssW, cssH));
      for (let k = 0; k < 60; k++, mult += 0.0007) {
        if (Math.floor(cssW * mult) % 2 === 0 && Math.floor(cssH * mult) % 2 === 0) break;
      }
      exportRender.multiplier = mult;
      drawParamsDirtyRef.current = true;
      sized = true;
      const nextFrame = () => new Promise<void>(r => requestAnimationFrame(() => r()));
      for (let i = 0; i < 90 && canvas.width < Math.floor(cssW * mult); i++) await nextFrame();
      await nextFrame();
      await nextFrame();
    }
    videoTakeRef.current = { timer: null, sized };
    toggleVCRRecording();
    const seconds = VIDEO_LENGTHS.find(o => o.id === videoLength)?.seconds ?? 0;
    if (seconds > 0) videoTakeRef.current.timer = setTimeout(() => toggleVCRRecording(), seconds * 1000);
    // If recording never actually began (encoders unavailable, permission refused), put the size back.
    setTimeout(() => {
      const take = videoTakeRef.current;
      if (take && !isRecordingNowRef.current) {
        videoTakeRef.current = null;
        if (take.timer) clearTimeout(take.timer);
        if (take.sized) { exportRender.multiplier = 0; drawParamsDirtyRef.current = true; }
      }
    }, 6000);
  };
  // Whenever recording ends (length reached, or the Record button pressed), undo the take's setup.
  useEffect(() => {
    if (isRecording || !videoTakeRef.current) return;
    const take = videoTakeRef.current;
    videoTakeRef.current = null;
    if (take.timer) clearTimeout(take.timer);
    if (take.sized) { exportRender.multiplier = 0; drawParamsDirtyRef.current = true; }
  }, [isRecording]);

  // Export animated GIF
  const { isRecordingGif, isFinalizingGif, toggleGifRecording } = useGifExport({ canvasRef });

  // Export as video (MP4/WebM) with audio
  const exportAsVideo = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const recordDuration = 10000; // 10 seconds

    try {
      const videoStream = canvas.captureStream(60);
      let finalStream: MediaStream = videoStream;

      if (audioFile && audioRef.current) {
        try {
          if (audioContextRef.current && analyserRef.current) {
            // Audio is already in Web Audio graph — tap the analyser output
            const dest = audioContextRef.current.createMediaStreamDestination();
            analyserRef.current.connect(dest);
            const audioTracks = dest.stream.getAudioTracks();
            if (audioTracks.length > 0) {
              finalStream = new MediaStream([...videoStream.getVideoTracks(), ...audioTracks]);
            }
          } else {
            // Audio not yet in Web Audio graph — safe to call createMediaElementSource
            const audioCtx = new AudioContext();
            const source = audioCtx.createMediaElementSource(audioRef.current);
            const dest = audioCtx.createMediaStreamDestination();
            source.connect(dest);
            source.connect(audioCtx.destination);
            const audioTracks = dest.stream.getAudioTracks();
            if (audioTracks.length > 0) {
              finalStream = new MediaStream([...videoStream.getVideoTracks(), ...audioTracks]);
            }
          }
        } catch (audioErr) {
          console.warn('Audio capture failed, exporting video only:', audioErr);
        }
      }

      const HIGH_BITRATE = 40_000_000; // 40 Mbps
      let options: MediaRecorderOptions;
      if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')) {
        options = { mimeType: 'video/mp4;codecs=avc1', videoBitsPerSecond: HIGH_BITRATE };
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
        options = { mimeType: 'video/webm;codecs=h264', videoBitsPerSecond: HIGH_BITRATE };
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        options = { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: HIGH_BITRATE };
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        options = { mimeType: 'video/mp4', videoBitsPerSecond: HIGH_BITRATE };
      } else {
        options = { mimeType: 'video/webm', videoBitsPerSecond: HIGH_BITRATE };
      }

      const mediaRecorder = new MediaRecorder(finalStream, options);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: options.mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const ext = options.mimeType.includes('mp4') ? 'mp4' : 'webm';
        link.download = `gradient-video-${Date.now()}.${ext}`;
        link.click();
        URL.revokeObjectURL(url);
      };

      mediaRecorder.start();
      setTimeout(() => { mediaRecorder.stop(); }, recordDuration);

    } catch (error) {
      console.error('Video export failed:', error);
    }
  };

  // Export as mobile home screen wallpaper
  const exportAsMobileWallpaper = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a new canvas with mobile wallpaper dimensions (1170x2532 for iPhone)
    const mobileCanvas = document.createElement('canvas');
    mobileCanvas.width = 1170;
    mobileCanvas.height = 2532;
    const ctx = mobileCanvas.getContext('2d');
    
    if (!ctx) return;

    // Save context state
    ctx.save();
    
    // Rotate 90 degrees clockwise and translate to correct position
    // Move to center of canvas
    ctx.translate(mobileCanvas.width / 2, mobileCanvas.height / 2);
    // Rotate 90 degrees clockwise
    ctx.rotate(90 * DEG_TO_RAD);
    // Translate back, accounting for swapped dimensions
    ctx.translate(-mobileCanvas.height / 2, -mobileCanvas.width / 2);
    
    // Now calculate aspect ratios (with swapped dimensions due to rotation)
    const sourceAspect = canvas.width / canvas.height;
    const targetAspect = mobileCanvas.height / mobileCanvas.width; // Swapped for rotation
    
    let drawWidth, drawHeight, offsetX, offsetY;
    
    // Cover mode: scale to fill, crop edges if needed (no distortion)
    if (sourceAspect > targetAspect) {
      // Source is wider - fit height, crop width
      drawHeight = mobileCanvas.width; // Swapped due to rotation
      drawWidth = drawHeight * sourceAspect;
      offsetX = (mobileCanvas.height - drawWidth) / 2; // Swapped due to rotation
      offsetY = 0;
    } else {
      // Source is taller - fit width, crop height
      drawWidth = mobileCanvas.height; // Swapped due to rotation
      drawHeight = drawWidth / sourceAspect;
      offsetX = 0;
      offsetY = (mobileCanvas.width - drawHeight) / 2; // Swapped due to rotation
    }
    
    // Draw with cover behavior (no distortion)
    ctx.drawImage(canvas, offsetX, offsetY, drawWidth, drawHeight);
    
    // Restore context state
    ctx.restore();

    // Download
    mobileCanvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `gradient-mobile-wallpaper-${Date.now()}.png`;
        link.click();
        URL.revokeObjectURL(url);
      }
    }, 'image/png');
  };

  // startRecording/stopRecording/toggleVCRRecording/toggleVCRPlayback/handleStop are now in useVCRPlayback hook

  // Toggle full screen
  const toggleFullScreen = () => {
    const currentRef = containerRef.current;
    if (!currentRef) return;
    
    try {
      if (isFullscreen) {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          (document as any).mozCancelFullScreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          (document as any).msExitFullscreen();
        }
      } else {
        if (currentRef.requestFullscreen) {
          currentRef.requestFullscreen().catch(() => {
            alert(
              '️ Full Screen Not Available\n\n' +
              '⚠️ This feature cannot work in Figma Make\'s preview environment.\n' +
              'Browsers block fullscreen API in embedded/iframe content for security.\n\n' +
              '✅ All other features work great:\n' +
              '• Interactive gradient (click & drag)\n' +
              '• All gradient types (Linear, Radial, etc.)\n' +
              '• Auto mode\n' +
              '• Export Image (JPG)\n' +
              '• Record Video\n\n' +
              'The full screen feature would work if this app were deployed to a web server.'
            );
          });
        } else if ((currentRef as any).mozRequestFullScreen) {
          (currentRef as any).mozRequestFullScreen().catch(() => {
            throw new Error('Fullscreen not supported');
          });
        } else if ((currentRef as any).webkitRequestFullscreen) {
          (currentRef as any).webkitRequestFullscreen().catch(() => {
            throw new Error('Fullscreen not supported');
          });
        } else if ((currentRef as any).msRequestFullscreen) {
          (currentRef as any).msRequestFullscreen().catch(() => {
            throw new Error('Fullscreen not supported');
          });
        } else {
          throw new Error('Fullscreen not supported');
        }
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
      alert(
        '🖥️ Full Screen Not Available\n\n' +
        '⚠️ This feature doesn\'t work in preview environments.\n\n' +
        '✅ All other features work great:\n' +
        '• Click & drag to change colors\n' +
        '• Switch gradient types\n' +
        '• Auto mode animations\n' +
        '• Export images\n' +
        '• Record videos'
      );
    }
  };

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

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        // Silently fail if fullscreen is not allowed by permissions policy
        console.log('Fullscreen not available:', err.message);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch((err) => {
        console.error('Error attempting to exit fullscreen:', err);
      });
    }
  }, []);
  
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

  // Which Look the L key lands on next, per press (not tied to which chip is highlighted).
  const lookIndexRef = useRef(-1);

  // Global hotkeys. Bare letters (no Cmd/Ctrl/Alt) so nothing collides with
  // browser shortcuts; suppressed while typing in any text field so letters
  // like "g" or "f" still type normally there.
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redoLastChange(); else undoLastChange();
        return;
      }
      // e.code (physical key), not e.key — Option remaps e.key to a
      // different character on Mac (e.g. Option+W -> "∑"), so the 'w'
      // string comparison never matched with Alt held.
      if (e.altKey && e.shiftKey && e.code === 'KeyW') {
        e.preventDefault();
        setIsAutoShuffleOn(prev => !prev);
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goBack();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goForward();
          break;
        case 'g': case 'G':
          e.preventDefault();
          if (e.shiftKey) shuffleGradientType();
          else setActiveTab(prev => prev === 'gradients' ? null : 'gradients');
          break;
        case 'f': case 'F':
          e.preventDefault();
          if (e.shiftKey) randomizeEffects();
          else setActiveTab(prev => prev === 'effects' ? null : 'effects');
          break;
        case 'a': case 'A':
          e.preventDefault();
          if (e.shiftKey) shuffleAudiovisuals();
          else setActiveTab(prev => prev === 'audio' ? null : 'audio');
          break;
        case 'c': case 'C':
          e.preventDefault();
          setActiveTab(prev => prev === 'color' ? null : 'color');
          break;
        case 'p': case 'P':
          e.preventDefault();
          if (e.shiftKey) toggleDisplayWindow();
          else setActiveTab(prev => prev === 'presets' ? null : 'presets');
          break;
        case 'h': case 'H':
          e.preventDefault();
          if (IS_DISPLAY_MODE) break;
          // Simple 2-state toggle now — the rail's icon-only look already
          // serves the role the old separate "collapsed pill" state used
          // to (previously a 3-state cycle: full panel -> pill -> hidden).
          setIsControlsVisible(v => !v);
          break;
        case 's': case 'S':
          e.preventDefault();
          if (e.shiftKey) toggleGifRecording(); else exportAsPNG();
          break;
        case 'r': case 'R':
          // Reset-to-defaults wipes the whole current look — every other
          // destructive-ish shortcut in the app (Shift+W remix, Shift+P
          // display toggle, etc.) already requires a modifier; this was the
          // one exception, sitting on a bare unmodified letter key.
          if (e.shiftKey) {
            e.preventDefault();
            resetToDefaults();
          }
          break;
        case 'v': case 'V':
          e.preventDefault();
          toggleVCRRecording();
          break;
        case ' ':
          e.preventDefault();
          toggleVCRPlayback();
          break;
        case '[':
          e.preventDefault();
          setVcrPlaybackSpeed(prev => {
            if (prev > 2) return prev - 1;
            if (prev === 2) return 1;
            if (prev === 1) return 0.5;
            return prev;
          });
          break;
        case ']':
          e.preventDefault();
          setVcrPlaybackSpeed(prev => {
            if (prev >= 2) return Math.min(10, prev + 1);
            if (prev >= 1) return 2;
            return 1;
          });
          break;
        case 'd': case 'D':
          e.preventDefault();
          setRotationDirection(prev => prev === 'clockwise' ? 'counter' : 'clockwise');
          break;
        case 'w': case 'W':
          e.preventDefault();
          evolveWithFactor(e.shiftKey ? 1 : 0.15);
          break;
        case 'm': case 'M':
          e.preventDefault();
          setIsMultiFxMode(prev => !prev);
          break;
        case 'l': case 'L': {
          // Step through the current gradient's Looks (Shift goes back).
          const looks = GRADIENT_LOOKS[gradientTypeRef.current as GradientType];
          if (!looks?.length) break;
          e.preventDefault();
          lookIndexRef.current = (lookIndexRef.current + (e.shiftKey ? looks.length - 1 : 1)) % looks.length;
          applyGradientLook(looks[lookIndexRef.current]);
          break;
        }
        case '?':
          e.preventDefault();
          setIsAboutOpen(prev => !prev);
          break;
        case 'Escape':
          if (isAboutOpen) { e.preventDefault(); setIsAboutOpen(false); }
          else if (autoShufflePopoverAnchor) { e.preventDefault(); setAutoShufflePopoverAnchor(null); }
          else if (activeTab) { e.preventDefault(); setActiveTab(null); }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [
    undoLastChange, redoLastChange, shuffleGradientType, randomizeEffects,
    setActiveTab, setIsControlsVisible, exportAsPNG, resetToDefaults,
    toggleVCRRecording, toggleVCRPlayback, setVcrPlaybackSpeed, setRotationDirection,
    evolveWithFactor, setIsMultiFxMode, isAboutOpen, setIsAboutOpen, activeTab,
    isControlsVisible, toggleDisplayWindow, setIsAutoShuffleOn, toggleGifRecording,
    autoShufflePopoverAnchor, setAutoShufflePopoverAnchor, applyGradientLook, goBack, goForward,
  ]);

  // Manual touch-drag scroll for the mobile control panel — a fallback
  // that doesn't depend on native momentum-scroll/touch-action behavior at
  // all. Three rounds of CSS-only fixes (touchAction:'pan-y', separating
  // transform off the scrolling element, removing a poisoning
  // touchAction:'none' ancestor) all produced textbook-correct computed
  // styles yet still failed to scroll on a real device, which points at an
  // iOS Safari native-gesture quirk this couldn't pin down further without
  // device access. This bypasses that entirely: touchmove deltas are read
  // directly and applied to scrollTop by hand, so it can't be silently
  // eaten by whatever's blocking the native gesture.
  //
  // Disambiguates by gesture DIRECTION rather than fully excluding drags
  // that start on a range input — the first version excluded any touch
  // starting on input/select, which worked fine on the Gradients tab
  // (few, sparse sliders, easy to grab a gap) but effectively disabled
  // scrolling on Effects/Multi-FX, which is dense with range sliders, so
  // almost any drag started on or right next to one and fell through to
  // the (broken) native path. Now every touch is allowed to become a
  // scroll: once movement exceeds a small threshold, a mostly-vertical
  // drag scrolls the panel (even if it started on a slider — the user is
  // clearly trying to scroll, not drag it sideways), a mostly-horizontal
  // drag is left alone so the slider's own native dragging still works.
  useEffect(() => {
    if (!isMobile) return;
    const el = drawerRef.current;
    if (!el) return;
    const DIRECTION_THRESHOLD = 6; // px of movement before committing to scroll vs. slider-drag
    let startX = 0;
    let startY = 0;
    let startScrollTop = 0;
    let scrolling = false;
    const onTouchStart = (e: TouchEvent) => {
      scrolling = false;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startScrollTop = el.scrollTop;
    };
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      if (!scrolling) {
        const absDx = Math.abs(dx), absDy = Math.abs(dy);
        if (absDx < DIRECTION_THRESHOLD && absDy < DIRECTION_THRESHOLD) {
          return;
        }
        // Re-evaluated on every move rather than decided once and locked —
        // real touch gestures are noisy in the first few pixels (the
        // finger hasn't "settled" into a direction yet), so a one-shot
        // decision on an early ambiguous/diagonal wobble could permanently
        // misread a genuine vertical scroll as a horizontal slider-drag for
        // the rest of that gesture. Biased toward scroll (0.8 ratio, not
        // 1:1) since scrolling the panel is the much more common intent
        // here and a slightly-diagonal scroll swipe shouldn't get read as
        // "trying to drag the slider".
        if (absDy < absDx * 0.8) {
          return; // stays undecided — let native/slider handle this move, re-check next one
        }
        scrolling = true;
      }
      const maxScroll = el.scrollHeight - el.clientHeight;
      if (maxScroll <= 0) return;
      el.scrollTop = Math.max(0, Math.min(maxScroll, startScrollTop - dy));
      e.preventDefault();
    };
    const onTouchEnd = () => { scrolling = false; };
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
    // activeTab included: the drawer only exists in the DOM while a tab is
    // open, so drawerRef.current is a different (or null) node each time
    // one opens/closes — this needs to re-run and re-attach listeners to
    // whatever the current node actually is, not just once per isMobile.
  }, [isMobile, activeTab]);

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
    fisheyeStrength, setFisheyeStrength, fisheyeCenterX, setFisheyeCenterX, fisheyeCenterY, setFisheyeCenterY,
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
    brushStrokesSize, setBrushStrokesSize, brushStrokesLength, setBrushStrokesLength,
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
    onShuffleAudio: shuffleAudiovisuals,
  };

  // The rail (+ its drawer, when a tab is open) is a real docked sidebar
  // now, not a floating overlay — it's a flex sibling of the canvas area
  // below, so the canvas area actually shrinks to share the frame with it
  // instead of being covered. Built once here and placed on whichever side
  // matches the layout (left of canvas on desktop, below it on mobile).
  const dock = (
    <div
      data-role="dock"
      className={isMobile ? 'flex-shrink-0 w-full flex flex-col' : 'flex-shrink-0 h-full flex flex-row'}
    >
      {!isMobile && (
        <ControlRail
          ref={panelRef}
          isMobile={isMobile}
          onWordmarkClick={openAboutPanel}
          handleWavClick={handleWavClick}
          isWavPressed={isWavPressed}
          isAutoShuffleOn={isAutoShuffleOn}
          isNewPresetPending={isNewPresetPending}
          autoShuffleIntervalSec={autoShuffleIntervalSec}
          formatAutoShuffleInterval={formatAutoShuffleInterval}
          autoShufflePopoverAnchor={autoShufflePopoverAnchor}
          setAutoShufflePopoverAnchor={setAutoShufflePopoverAnchor}
          openAutoShufflePopover={openAutoShufflePopover}
          openExportPopover={openExportPopover}
          exportAsPNG={exportAsPNG}
          toggleGifRecording={toggleGifRecording}
          isFinalizingGif={isFinalizingGif}
          isRecordingGif={isRecordingGif}
          undoLastChange={undoLastChange}
          redoLastChange={redoLastChange}
          undoDepth={undoDepth}
          redoDepth={redoDepth}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMicActive={isMicActive}
          liveSubBassLevel={liveSubBassLevel}
          liveBassLevel={liveBassLevel}
          liveMidsLevel={liveMidsLevel}
          liveTrebleLevel={liveTrebleLevel}
          audioEnergy={audioEnergy}
          isRecording={isRecording}
          isEncoding={isEncoding}
          encodingProgress={encodingProgress}
          toggleVCRRecording={toggleVCRRecording}
        />
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
        <ControlRail
          ref={panelRef}
          isMobile={isMobile}
          onWordmarkClick={openAboutPanel}
          handleWavClick={handleWavClick}
          isWavPressed={isWavPressed}
          isAutoShuffleOn={isAutoShuffleOn}
          isNewPresetPending={isNewPresetPending}
          autoShuffleIntervalSec={autoShuffleIntervalSec}
          formatAutoShuffleInterval={formatAutoShuffleInterval}
          autoShufflePopoverAnchor={autoShufflePopoverAnchor}
          setAutoShufflePopoverAnchor={setAutoShufflePopoverAnchor}
          openAutoShufflePopover={openAutoShufflePopover}
          openExportPopover={openExportPopover}
          exportAsPNG={exportAsPNG}
          toggleGifRecording={toggleGifRecording}
          isFinalizingGif={isFinalizingGif}
          isRecordingGif={isRecordingGif}
          undoLastChange={undoLastChange}
          redoLastChange={redoLastChange}
          undoDepth={undoDepth}
          redoDepth={redoDepth}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMicActive={isMicActive}
          liveSubBassLevel={liveSubBassLevel}
          liveBassLevel={liveBassLevel}
          liveMidsLevel={liveMidsLevel}
          liveTrebleLevel={liveTrebleLevel}
          audioEnergy={audioEnergy}
          isRecording={isRecording}
          isEncoding={isEncoding}
          encodingProgress={encodingProgress}
          toggleVCRRecording={toggleVCRRecording}
        />
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
      <div ref={shakeWrapperRef} className="fixed inset-0 z-0">
        <canvas
          ref={canvasRef}
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
      </div>
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

      
      {/* Rating UI overlay — temporarily hidden */}
      {false && showRatingUI && (
        <div
          className="absolute pointer-events-auto z-[9999]"
          style={{ left: 231, top: 16 }}
        >
          <div
            className="flex flex-col items-center gap-3 px-5 py-4 rounded-2xl shadow-sm"
            style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-white/70 text-xs font-semibold tracking-wide uppercase">Rate this result</span>
              {isAudioEnabled && isAudioReactive && <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 rounded px-1.5 py-0.5 font-semibold">🎤 Audio</span>}
            </div>
            <div className="flex gap-2">
              {[['👎', 2, 'rgba(239,68,68,0.2)', 'rgba(239,68,68,0.4)'], ['😐', 6, 'rgba(234,179,8,0.2)', 'rgba(234,179,8,0.4)'], ['👍', 8, 'rgba(34,197,94,0.2)', 'rgba(34,197,94,0.4)'], ['🔥', 10, 'rgba(168,85,247,0.2)', 'rgba(168,85,247,0.4)']].map(([emoji, rating, bg, border]) => (
                <button
                  key={String(rating)}
                  onClick={() => submitRating(Number(rating))}
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all hover:scale-110 active:scale-95"
                  style={{ background: String(bg), border: `1px solid ${String(border)}` }}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="flex gap-2 w-full">
              <button
                onClick={saveRatingAsPreset}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(to right, #9333ea, #ec4899, #facc15)' }}
              >
                ❤️ Save to Presets
              </button>
              <button
                onClick={skipRating}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white/50 hover:text-white/80 transition-all"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                Skip
              </button>
            </div>
            <span className="text-white/30 text-[10px]">{ratedResults.length} rated</span>
          </div>
        </div>
      )}

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
                className="px-4 py-2 text-[13px] font-semibold bg-white/15 text-white"
                onClick={async () => {
                  const file = new File([savePreview.blob], savePreview.name, { type: 'image/png' });
                  try { if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file] }); } catch { /* closed or unsupported */ }
                }}
              >Share…</button>
            )}
            <button
              className="px-4 py-2 text-[13px] font-semibold bg-white/15 text-white"
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
      {showWavHint && !activeTab && railRect && (
        <div
          className="fixed z-40 pointer-events-auto flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/25 border border-white/10 text-white/80 max-w-[220px]"
          style={isMobile
            ? { left: railRect.left, bottom: window.innerHeight - railRect.top + 8 }
            : { left: railRect.right + 12, top: railRect.top }}
        >
          <span className="text-[10px] leading-snug flex-1">
            Tap <span className="text-white font-medium">wāv</span> for gestures and help · tap <Shuffle weight="regular" className="w-2.5 h-2.5 inline -translate-y-px" /> to shuffle a new look
          </span>
          <button
            onClick={dismissWavHint}
            className="text-white/50 hover:text-white transition-all flex-shrink-0"
            title="Dismiss"
            aria-label="Dismiss hint"
          >
            <X weight="bold" className="w-3 h-3" />
          </button>
        </div>
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
      {renderAutoShufflePopover()}

      {/* Display-link-copied toast — brief confirmation for Shift+P */}
      {isDisplayLinkCopied && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none bg-black/70 backdrop-blur-sm text-white text-xs px-4 py-2 rounded-full shadow-lg z-50">
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
        <div className="absolute inset-0 pointer-events-auto z-50">
          <div className="absolute inset-0" onClick={() => setIsAboutOpen(false)} />
          <div
            ref={aboutDialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="About wāv"
            className={
              isMobile
                ? 'absolute bg-black/75 rounded-none p-8 max-w-sm max-h-[80vh] overflow-y-auto text-white shadow-2xl w-[calc(100%-3rem)] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 outline-none'
                : 'absolute bg-black/75 rounded-none p-8 max-w-sm overflow-y-auto text-white shadow-2xl outline-none'
            }
            style={isMobile ? undefined : (railRect
              ? { left: railRect.right, top: railRect.top, height: window.innerHeight - railRect.top }
              : { top: 16, left: 16 })}
          >
            <div className="flex flex-col gap-4 text-sm text-white/80 leading-relaxed mt-6">
              <p><strong>wāv</strong> is a gradient-based, user-friendly art creation environment with audio visualization capabilities.</p>
              <p><strong>wāv</strong> artwork can dynamically react, creating a mesmerizing display of colors, patterns, and shapes that synchronize with the music.</p>
              <p><strong>wāv</strong> uses advanced algorithms to analyze the audio signal and generate visuals that respond to the beat, rhythm, and character of the music.</p>
              <p>Whether performing live music or theater, planning an art installation, or simply enjoying your favorite tunes at home, <strong>wāv</strong> can transform your audio experience into a spectacle.</p>
            </div>

            <div className="flex flex-col gap-8 text-sm text-white/80 leading-relaxed mt-8">
              <div className="flex flex-col gap-3">
                <p className="font-semibold text-white">Rail</p>
                <p>Click the <strong>wāv</strong> mark at the top of the rail for this About screen.</p>
              </div>

              <div className="flex flex-col gap-3">
                <p className="font-semibold text-white">Rail icons</p>
                <p className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><Eye weight="regular" className="w-4 h-4 shrink-0" /> Eye — hide the control rail</span><Kbd label="H" /></p>
                <p className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><EyeSlash weight="regular" className="w-4 h-4 shrink-0" /> Copy Display link — fully hide all UI for live/projector output</span><Kbd label="Shift+P" /></p>
                <p className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><Shuffle weight="regular" className="w-4 h-4 shrink-0" /> Shuffle — remix everything at once: gradient, colors, and effects</span><Kbd label="Shift+W" /></p>
                <button
                  onClick={() => setIsAutoShuffleOn(prev => !prev)}
                  className="flex items-center justify-between gap-2 text-left"
                  aria-pressed={isAutoShuffleOn}
                >
                  <span className="flex items-center gap-2"><InfinityIcon weight="regular" className="w-4 h-4 shrink-0" /> Auto Shuffle — remix every {formatAutoShuffleInterval(autoShuffleIntervalSec)}</span>
                  <span className="flex items-center gap-2">
                    <Kbd label="⌥⇧W" />
                    <span
                      className={`relative inline-flex w-8 h-[18px] rounded-full transition-colors shrink-0 ${isAutoShuffleOn ? 'bg-white' : 'bg-white/15'}`}
                    >
                      <span
                        className={`absolute top-[2px] w-[14px] h-[14px] rounded-full transition-transform ${isAutoShuffleOn ? 'bg-black translate-x-[18px]' : 'bg-white translate-x-[2px]'}`}
                      />
                    </span>
                  </span>
                </button>
                {/* Auto Shuffle interval — log-scale slider (see
                    autoShuffleSecToSlider/autoShuffleSliderToSec) so 1s-3600s
                    are all reachable with useful precision, plus a direct
                    number input for typing an exact value. Adjustable
                    whether Auto Shuffle is currently on or off. */}
                <div className="flex items-center gap-2 pl-6">
                  <input
                    type="range"
                    min={0}
                    max={autoShuffleSliderMax}
                    value={autoShuffleSecToSlider(autoShuffleIntervalSec)}
                    onChange={(e) => setAutoShuffleIntervalSec(autoShuffleSliderToSec(Number(e.target.value)))}
                    className="flex-1"
                    aria-label="Auto Shuffle interval"
                  />
                  <input
                    type="number"
                    min={AUTO_SHUFFLE_MIN_SEC}
                    max={AUTO_SHUFFLE_MAX_SEC}
                    value={autoShuffleIntervalSec}
                    onChange={(e) => setAutoShuffleIntervalSec(Number(e.target.value))}
                    className="text-[10px] text-white w-12 text-right bg-white/10 border border-white/20 rounded px-1"
                    aria-label="Auto Shuffle interval in seconds"
                  />
                  <span className="text-[10px] text-white/50 shrink-0">sec</span>
                </div>
                <p className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><Camera weight="regular" className="w-4 h-4 shrink-0" /> Camera — save the current frame as a PNG</span><Kbd label="S" /></p>
                <p className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><Gif weight="regular" className="w-4 h-4 shrink-0" /> GIF — start/stop recording an animated GIF</span><Kbd label="Shift+S" /></p>
              </div>

              <div className="flex flex-col gap-3">
                <p className="font-semibold text-white">Playback row</p>
                <p className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><Circle weight="regular" className="w-4 h-4 shrink-0" /> Record — capture video of the live animation</span><Kbd label="V" /></p>
                <p className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><Play weight="regular" className="w-4 h-4 shrink-0" /><Stop weight="regular" className="w-4 h-4 shrink-0 -ml-1" /> Play / stop — start or stop all motion and audio reactivity</span><Kbd label="Space" /></p>
                <p className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><Rewind weight="regular" className="w-4 h-4 shrink-0" /><FastForward weight="regular" className="w-4 h-4 shrink-0 -ml-1" /> Slower / faster — adjust playback speed</span><Kbd label="[ / ]" /></p>
                <p className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><ArrowClockwise weight="regular" className="w-4 h-4 shrink-0" /> Direction arrow — reverse the rotation direction</span><Kbd label="D" /></p>
              </div>

              <div className="flex flex-col gap-3">
                <p className="font-semibold text-white">Tabs</p>
                <p className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><Gradient weight="regular" className="w-4 h-4 shrink-0" /> Gradient — choose the base pattern and tune its sliders</span><Kbd label="G" /></p>
                <p className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><MagicWand weight="regular" className="w-4 h-4 shrink-0" /> Effects — layer on effects; toggle Multi to stack several at once</span><Kbd label="F" /></p>
                <p className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><SpeakerHigh weight="regular" className="w-4 h-4 shrink-0" /> Audio — connect a microphone or audio file so the artwork reacts to sound</span><Kbd label="A" /></p>
                <p className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><Palette weight="regular" className="w-4 h-4 shrink-0" /> Color — pick or generate a color palette, or turn on Auto Play to colors looks automatically</span><Kbd label="C" /></p>
                <p className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><FloppyDisk weight="regular" className="w-4 h-4 shrink-0" /> Presets — save the current look by name and reload it anytime</span><Kbd label="P" /></p>
              </div>

              <div className="flex flex-col gap-3">
                <p className="font-semibold text-white">Touch gestures</p>
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
                  {TOUCH_GESTURES.map(([k, v]) => (
                    <Fragment key={k}>
                      <span className="text-white font-medium whitespace-nowrap">{k}</span>
                      <span>{v}</span>
                    </Fragment>
                  ))}
                </div>
                <p className="text-xs text-white/50">Flicks are quick, mostly horizontal swipes; slower sideways drags do nothing.</p>
                {motionSensorsSupported() && (
                  <div className="flex flex-col gap-2 pt-1">
                    <p className="text-white font-medium">Motion</p>
                    {([
                      { kind: 'shake' as const, label: 'Shake to Shuffle', on: shakeEnabled },
                      { kind: 'tilt' as const, label: 'Tilt to rotate', on: tiltEnabled },
                    ]).map(m => (
                      <div key={m.kind} className="flex items-center justify-between gap-2">
                        <span>{m.label}</span>
                        <button
                          onClick={() => toggleMotion(m.kind)}
                          aria-pressed={m.on}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${m.on ? 'bg-white text-black' : 'bg-black/25 text-white hover:bg-white/15'}`}
                        >{m.on ? 'On' : 'Off'}</button>
                      </div>
                    ))}
                    {motionDenied && <p className="text-xs text-red-300">Motion access was blocked. Allow it in your browser settings, then try again.</p>}
                    <p className="text-xs text-white/50">Phones only. iPhones ask permission the first time. Tilt measures from how you hold the phone when you turn it on.</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <p className="font-semibold text-white">Arrows and keys</p>
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
                  {KEY_GESTURES.map(([k, v]) => (
                    <Fragment key={k}>
                      <span className="flex"><Kbd label={k} /></span>
                      <span>{v}</span>
                    </Fragment>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <p className="font-semibold text-white">Randomizing</p>
                <p>Five ways to randomize, from smallest to biggest change:</p>
                <p className="flex items-center justify-between gap-2"><span><span className="text-white font-semibold">Nudge</span> — a small drift in color, angle, and zoom. Never changes the gradient type or which effects are active.</span><Kbd label="W" /></p>
                <p className="flex items-center justify-between gap-2"><span><span className="text-white font-semibold">Shuffle Effects</span> — reshuffles which effects are active and their sliders. Gradient type and colors stay put.</span><Kbd label="Shift+F" /></p>
                <p className="flex items-center justify-between gap-2"><span><span className="text-white font-semibold">Shuffle Gradient</span> — reshuffles the gradient type and its sliders. Effects and colors stay put.</span><Kbd label="Shift+G" /></p>
                <p className="flex items-center justify-between gap-2"><span><span className="text-white font-semibold">Shuffle Audio Controls</span> — reshuffles sensitivity, band multipliers, beat-sync toggles, and Modulation bindings (scoped to the current gradient and active effects). Gradient, effects, and colors stay put.</span><Kbd label="Shift+A" /></p>
                <p className="flex items-center justify-between gap-2"><span><span className="text-white font-semibold">Remix</span> — click Shuffle to randomize everything at once: gradient, colors, and effects.</span><Kbd label="Shift+W" /></p>
              </div>

              <div className="flex flex-col gap-3">
                <p className="font-semibold text-white">More shortcuts</p>
                <p className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><ArrowUUpLeft weight="regular" className="w-4 h-4 shrink-0" /><ArrowUUpRight weight="regular" className="w-4 h-4 shrink-0 -ml-1" /> Undo / redo — step backward or forward</span><Kbd label="⌘Z / ⌘⇧Z" /></p>
                <p className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><ArrowsClockwise weight="regular" className="w-4 h-4 shrink-0" /> Reset to defaults</span><Kbd label="Shift+R" /></p>
                <p className="flex items-center justify-between gap-2"><span>On a touch screen: swipe left to Shuffle, right to Undo</span><Kbd label="← →" /></p>
                <p className="flex items-center justify-between gap-2"><span>Toggle Multi-FX mode</span><Kbd label="M" /></p>
                <p className="flex items-center justify-between gap-2"><span>Next / previous Look for the current gradient</span><Kbd label="L" /></p>
                <p className="flex items-center justify-between gap-2"><span>Close the active tab / this panel</span><Kbd label="Esc" /></p>
                <p className="flex items-center justify-between gap-2"><span>Toggle this cheat sheet</span><Kbd label="?" /></p>
                <p className="text-xs text-white/50">Shortcuts are disabled while a text field is focused.</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
