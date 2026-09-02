import { useState, useRef } from 'react';
import type { ColorRGB, GradientType, EffectType } from '../../constants/gradientEffects';
import { DEFAULT_COLORS, migrateId, migrateIds } from '../../constants/gradientEffects';

const IS_DISPLAY_MODE = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('display') === '1';

export function useMiscState() {
  const lastBroadcastSnapshotRef = useRef<string>('');
  const syncChannelRef = useRef<BroadcastChannel | null>(null);
  const animSyncChannelRef = useRef<BroadcastChannel | null>(null);
  const animValuesRef = useRef({
    voronoiAnimTime: 0, flowerAnimTime: 0, auroraAnimTime: 0, turrellAnimTime: 0, causticsAnimTime: 0,
    lavaAnimTime: 0, marbleAnimTime: 0, metaballAnimTime: 0,
    flowAnimTime: 0, liquidAnimTime: 0, emojiAnimTime: 0, attractorAnimTime: 0, tilingAnimTime: 0, hatchAnimTime: 0,
    noiseAnimTime: 0, radialAnimTime: 0,
    waveInterferenceAnimTime: 0, meshWireframeAnimTime: 0,
    audioSubBassLevel: 0, audioMidsLevel: 0, audioTrebleLevel: 0, audioEnergy: 0,
    // gridRotation/radarSweepAngle: same ref-primary treatment as the anim
    // times above — the main loop writes these directly every frame now
    // instead of calling setState, so draw() always reads a fresh value
    // without the state update forcing a full component re-render 60x/sec.
    gridRotation: 0, radarSweepAngle: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const lastChangeTime = useRef<number>(0);
  const previousPosition = useRef<{ x: number; y: number } | null>(null);
  const [gradientType, setGradientType] = useState<GradientType | null>('angle');
  // Capped at 2 — full devicePixelRatio (3 on many phones) quadratically
  // inflates every per-pixel gradient/effect's fragment cost for sharpness
  // gains that are barely perceptible on a soft, blurry gradient background.
  // The MAX_CANVAS_PIXELS budget in useCanvasDraw.ts already catches the
  // worst cases (large high-DPI external displays) but only kicks in once
  // total pixel count exceeds its budget — this caps the common case (a
  // normal-sized high-DPI phone/laptop screen) at the source instead.
  const [resolutionMultiplier, setResolutionMultiplier] = useState(() => Math.min(window.devicePixelRatio || 1, 2));
  const [zoomBeatEnabled, setZoomBeatEnabled] = useState(true);
  const [shakeBeatEnabled, setShakeBeatEnabled] = useState(false);
  const [contrastBeatEnabled, setContrastBeatEnabled] = useState(true);
  const [paletteBeatEnabled, setPaletteBeatEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [isAutoColor, setIsAutoColor] = useState(true);
  const [gradientColors, setGradientColors] = useState<ColorRGB[]>(DEFAULT_COLORS);
  const [targetColors, setTargetColors] = useState<ColorRGB[]>(gradientColors);
  const [gradientAngle, setGradientAngle] = useState(45);
  const [targetAngle, setTargetAngle] = useState(45);
  const [zoom, setZoom] = useState(1);
  const [targetZoom, setTargetZoom] = useState(1);
  const gradientColorsRef = useRef<ColorRGB[]>(DEFAULT_COLORS);
  const gradientAngleRef = useRef<number>(45);
  const zoomRef = useRef<number>(1);
  const targetColorsRef = useRef<ColorRGB[]>(DEFAULT_COLORS);
  const targetAngleRef = useRef<number>(45);
  const targetZoomRef = useRef<number>(1);
  const vcrPlaybackSpeedRef = useRef<number>(1);
  const isAutoModeRef = useRef<boolean>(false);
  const rotationDirectionRef = useRef<'clockwise' | 'counter'>('clockwise');
  const isVCRPlayingRef = useRef<boolean>(false);
  const isAudioActiveRef = useRef<boolean>(false);
  const drawParamsDirtyRef = useRef(true); // true until first draw
  const lerpSyncFrameRef = useRef(0);
  const [isControlsVisible, setIsControlsVisible] = useState(!IS_DISPLAY_MODE);
  const [isFullyHidden, setIsFullyHidden] = useState(IS_DISPLAY_MODE);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isDisplayLinkCopied, setIsDisplayLinkCopied] = useState(false);
  const [rotationDirection, setRotationDirection] = useState<'clockwise' | 'counter'>('clockwise');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMultiFxMode, setIsMultiFxMode] = useState(false);
  // Tracks which Multi-FX effect sections the user has manually collapsed
  // (inverted from the old "expanded" set) — empty by default means every
  // active effect's section starts open, since there's now enough vertical
  // room in the docked drawer to not need them collapsed by default.
  const [collapsedEffects, setCollapsedEffects] = useState<Set<string>>(new Set());
  const [wavRandomGradient, setWavRandomGradient] = useState('linear-gradient(to top, #7c3aed, #ec4899, #eab308)');
  const [isAIPromptOpen, setIsAIPromptOpen] = useState(false);
  const [isUploadDropdownOpen, setIsUploadDropdownOpen] = useState(false);
  const [aiPrompt, setAIPrompt] = useState('');
  const [submittedAIPrompt, setSubmittedAIPrompt] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeEffects, setActiveEffects] = useState<EffectType[]>([]);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [showWavHint, setShowWavHint] = useState(() => {
    try { return !localStorage.getItem('wavGestureHintSeen'); } catch (err) {
      if (import.meta.env.DEV) console.warn('Failed to read wavGestureHintSeen:', err);
      return true;
    }
  });
  const [isGradientsOpen, setIsGradientsOpen] = useState(false);
  const [isEffectsOpen, setIsEffectsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'color' | 'gradients' | 'effects' | 'audio' | 'presets' | null>(null);
  const [isAIColorPickerOpen, setIsAIColorPickerOpen] = useState(false);
  const [isKeywordHelpOpen, setIsKeywordHelpOpen] = useState(false);
  const [concentricRingWidth, setConcentricRingWidth] = useState(100);
  const [concentricRingCount, setConcentricRingCount] = useState(10);
  const [scanType, setScanType] = useState<'horizontal' | 'vertical' | 'interlaced' | 'crt'>('horizontal');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [baseAIColors, setBaseAIColors] = useState<ColorRGB[] | null>(null);
  const [showRatingUI, setShowRatingUI] = useState(false);
  const [ratedResults, setRatedResults] = useState<Array<{rating: number; data: any}>>(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem('gradientRatings') || '[]');
      // Migrate any pre-rename ids in cached rating data (see ID_MIGRATIONS).
      return parsed.map((r: { rating: number; data: any }) => ({
        ...r,
        data: {
          ...r.data,
          gradientType: r.data?.gradientType ? migrateId(r.data.gradientType) : r.data?.gradientType,
          activeEffects: migrateIds(r.data?.activeEffects),
        },
      }));
    } catch { return []; }
  });
  const [pendingRatingState, setPendingRatingState] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const lastManualZoomTime = useRef<number>(0);
  const kaleidoAngleRef = useRef(0);
  const isAutoColorRef = useRef(true);
  const contrastPulseRef = useRef(0);
  const saturationPulseRef = useRef(0);
  const shakeRef = useRef({ x: 0, y: 0 });
  const shakeWrapperRef = useRef<HTMLDivElement>(null);
  const activeEffectsRef = useRef(activeEffects);
  const gradientTypeRef = useRef(gradientType);

  return {
    lastBroadcastSnapshotRef,
    syncChannelRef,
    animSyncChannelRef,
    animValuesRef,
    isDragging,
    setIsDragging,
    lastChangeTime,
    previousPosition,
    gradientType,
    setGradientType,
    resolutionMultiplier,
    setResolutionMultiplier,
    zoomBeatEnabled,
    setZoomBeatEnabled,
    shakeBeatEnabled,
    setShakeBeatEnabled,
    contrastBeatEnabled,
    setContrastBeatEnabled,
    paletteBeatEnabled,
    setPaletteBeatEnabled,
    isRecording,
    setIsRecording,
    isAutoMode,
    setIsAutoMode,
    isAutoColor,
    setIsAutoColor,
    gradientColors,
    setGradientColors,
    targetColors,
    setTargetColors,
    gradientAngle,
    setGradientAngle,
    targetAngle,
    setTargetAngle,
    zoom,
    setZoom,
    targetZoom,
    setTargetZoom,
    gradientColorsRef,
    gradientAngleRef,
    zoomRef,
    targetColorsRef,
    targetAngleRef,
    targetZoomRef,
    vcrPlaybackSpeedRef,
    isAutoModeRef,
    rotationDirectionRef,
    isVCRPlayingRef,
    isAudioActiveRef,
    drawParamsDirtyRef,
    lerpSyncFrameRef,
    isControlsVisible,
    setIsControlsVisible,
    isFullyHidden,
    setIsFullyHidden,
    isAboutOpen,
    setIsAboutOpen,
    isDisplayLinkCopied,
    setIsDisplayLinkCopied,
    rotationDirection,
    setRotationDirection,
    isDropdownOpen,
    setIsDropdownOpen,
    isMultiFxMode,
    setIsMultiFxMode,
    collapsedEffects,
    setCollapsedEffects,
    wavRandomGradient,
    setWavRandomGradient,
    isAIPromptOpen,
    setIsAIPromptOpen,
    isUploadDropdownOpen,
    setIsUploadDropdownOpen,
    aiPrompt,
    setAIPrompt,
    submittedAIPrompt,
    setSubmittedAIPrompt,
    containerRef,
    activeEffects,
    setActiveEffects,
    isExportDropdownOpen,
    setIsExportDropdownOpen,
    showWavHint,
    setShowWavHint,
    isGradientsOpen,
    setIsGradientsOpen,
    isEffectsOpen,
    setIsEffectsOpen,
    activeTab,
    setActiveTab,
    isAIColorPickerOpen,
    setIsAIColorPickerOpen,
    isKeywordHelpOpen,
    setIsKeywordHelpOpen,
    concentricRingWidth,
    setConcentricRingWidth,
    concentricRingCount,
    setConcentricRingCount,
    scanType,
    setScanType,
    isEmojiPickerOpen,
    setIsEmojiPickerOpen,
    baseAIColors,
    setBaseAIColors,
    showRatingUI,
    setShowRatingUI,
    ratedResults,
    setRatedResults,
    pendingRatingState,
    setPendingRatingState,
    fileInputRef,
    isFullscreen,
    setIsFullscreen,
    lastManualZoomTime,
    kaleidoAngleRef,
    isAutoColorRef,
    contrastPulseRef,
    saturationPulseRef,
    shakeRef,
    shakeWrapperRef,
    activeEffectsRef,
    gradientTypeRef,
  };
}
