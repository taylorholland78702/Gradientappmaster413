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
 * Pinch/Zoom Support:
 * - Trackpad pinch-to-zoom (Ctrl+wheel event)
 * - Two-finger touch pinch-to-zoom on mobile/tablet
 * - Mouse wheel scroll zoom
 * - All zoom methods prevent browser default behavior for smooth experience
 */
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';import { db, auth } from '../../firebase';import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';import { signInAnonymously } from 'firebase/auth';
import { ChevronDown, Circle, Square, Play, Pause, SkipBack, FastForward, Rewind, Repeat, RotateCw, RotateCcw, Mic, MicOff, Eye, EyeOff, Undo, Shuffle, Maximize, Minimize, Plus, RefreshCw, SlidersHorizontal, Camera } from 'lucide-react';

interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

type GradientType = 'radial' | 'angle' | 'spiral' | 'polygon-solid' | 'waves' | 'fade' | 'conical-spiral' | 'radial-burst' | 'noise' | 'plasma' | 'grid' | 'freeform' | 'shapes' | 'voronoi' | 'mesh' | 'iridescent' | 'radar' | 'flower';

interface ColorPin {
  id: string;
  x: number; // 0-1 normalized position
  y: number; // 0-1 normalized position
  color: RGB;
  radius: number; // influence radius in pixels
}

type EffectType = 'none' | 'kaleidoscope' | 'invert' | 'pixelate' | 'triangulate' | 'chromatic' | 'fisheye' | 'film-grain' | 'charcoal' | 'posterize' | 'halftone' | 'vhs-glitch' | 'dust-scratches' | 'blur' | 'wave-distortion' | 'color-shift' | 'duotone' | 'tritone' | 'vignette' | 'grid' | 'bokeh' | 'brightness' | 'dither' | 'slit-scan';

type BlendMode = 'none' | 'double-exposure' | 'screen' | 'multiply' | 'overlay' | 'soft-light' | 'hard-light' | 'difference' | 'exclusion';

// Recording frame interface
interface RecordingFrame {
  colors: ColorRGB[];
  angle: number;
  zoom: number;
  timestamp: number;
}

// Default colors - defined outside component to prevent recreation
const DEFAULT_COLORS: ColorRGB[] = [
  { r: 255, g: 100, b: 200 }, // Pink
  { r: 180, g: 100, b: 255 }, // Purple
  { r: 100, g: 150, b: 255 }, // Blue
  { r: 100, g: 255, b: 200 }, // Cyan
  { r: 150, g: 255, b: 150 }, // Green
  { r: 255, g: 200, b: 100 }, // Orange
];

// Math constants - pre-calculated for performance
const DEG_TO_RAD = Math.PI / 180;
const TWO_PI = Math.PI * 2;

export function InteractiveGradient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastChangeTime = useRef<number>(0);
  const previousPosition = useRef<{ x: number; y: number } | null>(null);
  const [gradientType, setGradientType] = useState<GradientType | null>('angle');
  const [resolutionMultiplier, setResolutionMultiplier] = useState(1); // 1x, 2x, 3x, 4x
  
  // Pinch-to-zoom tracking
  const lastPinchDistance = useRef<number | null>(null);
  
  // Audio refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const bassSmoothedRef = useRef(0);
  const midsSmoothedRef = useRef(0);
  const trebleSmoothedRef = useRef(0);
  // Beat detection refs
  const lastBeatTimeRef = useRef(0);
  const beatIntervalsRef = useRef<number[]>([]);
  const bassPrevRef = useRef(0);
  const treblePrevRef = useRef(0);
  const lastTrebleBeatRef = useRef(0);
  const bassBeatPulseRef = useRef(0);
  const midsBeatPulseRef = useRef(0);
  const trebleBeatPulseRef = useRef(0);
  // Live level refs (updated every rAF frame, read by UI polling)
  const liveBaseLevelRef = useRef(0);
  const liveMidsLevelRef = useRef(0);
  const liveTrebleLevelRef = useRef(0);
  const liveBassSmoothedRef = useRef(0);
  const liveMidsSmoothedRef = useRef(0);
  const liveTrebleSmoothedRef = useRef(0);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [audioFile, setAudioFile] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [audioFileMetadata, setAudioFileMetadata] = useState<{ sampleRate: number; duration: number; } | null>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isAudioReactive, setIsAudioReactive] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  
  // Audio-reactive canvas properties
  const [audioGradientParam, setAudioGradientParam] = useState(0); // For gradient parameters
  const [audioEffectParam, setAudioEffectParam] = useState(0); // For first effect parameter
  const [audioColorShift, setAudioColorShift] = useState(0); // For color hue shift
  
  // Video recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const recordingAnimationRef = useRef<number | null>(null);
  const recordCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [gradientColors, setGradientColors] = useState<ColorRGB[]>(DEFAULT_COLORS);
  const [targetColors, setTargetColors] = useState<ColorRGB[]>(gradientColors);
  const [gradientAngle, setGradientAngle] = useState(45);
  const [targetAngle, setTargetAngle] = useState(45);
  const [zoom, setZoom] = useState(1);
  const [targetZoom, setTargetZoom] = useState(1);
  const [isAutoMode, setIsAutoMode] = useState(false);
  
  // Freeform gradient pins
  const [colorPins, setColorPins] = useState<ColorPin[]>([
    { id: '1', x: 0.3, y: 0.3, color: { r: 255, g: 100, b: 100 }, radius: 300 },
    { id: '2', x: 0.7, y: 0.7, color: { r: 100, g: 100, b: 255 }, radius: 300 },
    { id: '3', x: 0.5, y: 0.5, color: { r: 100, g: 255, b: 100 }, radius: 300 },
  ]);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [isDraggingPin, setIsDraggingPin] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [rotationDirection, setRotationDirection] = useState<'clockwise' | 'counter'>('clockwise');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMultiFxMode, setIsMultiFxMode] = useState(false);
  
  // VCR controls
  const [isVCRRecording, setIsVCRRecording] = useState(false);
  const [isVCRPlaying, setIsVCRPlaying] = useState(false);
  const [vcrRecordedFrames, setVcrRecordedFrames] = useState<RecordingFrame[]>([]);
  const [vcrPlaybackSpeed, setVcrPlaybackSpeed] = useState(1);
  const [vcrLoop, setVcrLoop] = useState(false);
  const [vcrPlaybackIndex, setVcrPlaybackIndex] = useState(0);
  const vcrRecordingStartTime = useRef<number>(0);
  const vcrPlaybackStartTime = useRef<number>(0);
  const [isAIPromptOpen, setIsAIPromptOpen] = useState(false);
  const [isUploadDropdownOpen, setIsUploadDropdownOpen] = useState(false);
  const [aiPrompt, setAIPrompt] = useState('');
  const [submittedAIPrompt, setSubmittedAIPrompt] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeEffects, setActiveEffects] = useState<EffectType[]>([]);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isPresetsDropdownOpen, setIsPresetsDropdownOpen] = useState(false);
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string>('default');
  const [panelPos, setPanelPos] = useState<{x: number, y: number} | null>(null);
  const panelDragRef = useRef<{startX: number, startY: number, origX: number, origY: number} | null>(null);
  const [isGradientsOpen, setIsGradientsOpen] = useState(false);
  const [isEffectsOpen, setIsEffectsOpen] = useState(false);
  const [isAIColorPickerOpen, setIsAIColorPickerOpen] = useState(false);
  const [isKeywordHelpOpen, setIsKeywordHelpOpen] = useState(false);
  const [renamingPresetIndex, setRenamingPresetIndex] = useState<number | null>(null);
  const [renamingPresetValue, setRenamingPresetValue] = useState('');
  
  // Effect parameters
  const [kaleidoscopeSegments, setKaleidoscopeSegments] = useState(8);
  const [twistAmount, setTwistAmount] = useState(2);
  const [pixelSize, setPixelSize] = useState(20);
  const [triangleSize, setTriangleSize] = useState(40);
  const [chromaticOffset, setChromaticOffset] = useState(5);
  const [fisheyeStrength, setFisheyeStrength] = useState(0.5);
  const [tileCount, setTileCount] = useState(2);
  const [grainIntensity, setGrainIntensity] = useState(0.3);
  const [blurMotionAmount, setBlurMotionAmount] = useState(5);
  const [blurMotionDirection, setBlurMotionDirection] = useState(0); // 0-360 degrees
  const [blurGaussianAmount, setBlurGaussianAmount] = useState(5);
  const [blurRadialAmount, setBlurRadialAmount] = useState(5);
  const [blurType, setBlurType] = useState<'gaussian' | 'motion' | 'radial'>('gaussian');
  const [posterizeLevels, setPosterizeLevels] = useState(8);
  const [halftoneSize, setHalftoneSize] = useState(4);
  const [halftoneVariation, setHalftoneVariation] = useState(0);
  const [halftoneMove, setHalftoneMove] = useState(false);
  const [halftoneMoveSpeed, setHalftoneMoveSpeed] = useState(1);
  const [vignetteStrength, setVignetteStrength] = useState(0.5);
  const [colorShiftHue, setColorShiftHue] = useState(0);
  const [bulgeStrength, setBulgeStrength] = useState(0.5);
  const [charcoalIntensity, setCharcoalIntensity] = useState(0.5);
  const [colorBurnIntensity, setColorBurnIntensity] = useState(0.5);
  const [colorDodgeIntensity, setColorDodgeIntensity] = useState(0.5);
  const [digitalNoiseIntensity, setDigitalNoiseIntensity] = useState(0.3);
  const [duotoneIntensity, setDuotoneIntensity] = useState(1);
  const [dustIntensity, setDustIntensity] = useState(0.5);
  const [dustCrackleIntensity, setDustCrackleIntensity] = useState(0.5);
  const [gridSize, setGridSize] = useState(20);
  const [hexGridSize, setHexGridSize] = useState(20);
  const [lightLeakIntensity, setLightLeakIntensity] = useState(0.5);
  const [lensFlareIntensity, setLensFlareIntensity] = useState(0.5);
  const [lensFlareX, setLensFlareX] = useState(0.5); // 0-1 normalized position
  const [lensFlareY, setLensFlareY] = useState(0.5); // 0-1 normalized position
  const [lensFlareSize, setLensFlareSize] = useState(300); // radius in pixels
  const [linesCount, setLinesCount] = useState(50);
  const [linesAngle, setLinesAngle] = useState(0); // 0-360 degrees
  const [linesThickness, setLinesThickness] = useState(1);
  const [liquifyStrength, setLiquifyStrength] = useState(30);
  const [mandalaSegments, setMandalaSegments] = useState(8);
  const [pinchStrength, setPinchStrength] = useState(0.5);
  const [polarAngle, setPolarAngle] = useState(0);
  const [polarRadius, setPolarRadius] = useState(1);
  const [polarRotation, setPolarRotation] = useState(0);
  const [scanLineSize, setScanLineSize] = useState(4);
  const [scanLineOffset, setScanLineOffset] = useState(0);
  const [sepiaIntensity, setSepiaIntensity] = useState(1);
  const [solarizeThreshold, setSolarizeThreshold] = useState(128);
  const [triGridSize, setTriGridSize] = useState(30);
  const [gridSides, setGridSides] = useState(6);
  const [tritoneIntensity, setTritoneIntensity] = useState(1);
  const [tritoneColor1, setTritoneColor1] = useState('#000033'); // Dark blue
  const [tritoneColor2, setTritoneColor2] = useState('#FF6B35'); // Orange
  const [tritoneColor3, setTritoneColor3] = useState('#F7F7FF'); // Near white
  const [duotoneColor1, setDuotoneColor1] = useState('#000033'); // Dark blue
  const [duotoneColor2, setDuotoneColor2] = useState('#FF6B35'); // Orange
  const [vhsGlitchIntensity, setVhsGlitchIntensity] = useState(0.5);
  const [gridRows, setGridRows] = useState(5);
  const [gridColumns, setGridColumns] = useState(5);
  const [gridRotation, setGridRotation] = useState(0);
  const [gridRotationDirection, setGridRotationDirection] = useState<'none' | 'clockwise' | 'counterclockwise'>('none');
  const [shapesRotation, setShapesRotation] = useState(0);
  const [shapesRotationDirection, setShapesRotationDirection] = useState<'none' | 'clockwise' | 'counterclockwise'>('none');
  const [polygonSides, setPolygonSides] = useState(5);
  const [polygon2Sides, setPolygon2Sides] = useState(5); // For polar-grid gradient
  const [angleStartOffset, setAngleStartOffset] = useState(0);
  const [angleCenterX, setAngleCenterX] = useState(50);
  const [angleCenterY, setAngleCenterY] = useState(50);
  const [spiralTightness, setSpiralTightness] = useState(5);
  const [spiralRotations, setSpiralRotations] = useState(3);
  const [spiralThickness, setSpiralThickness] = useState(20);
  const [spiralZoom, setSpiralZoom] = useState(3.5);
  const [shapesSides, setShapesSides] = useState(6);
  const [shapesCount, setShapesCount] = useState(15);
  const [concentricRingWidth, setConcentricRingWidth] = useState(100);
  const [concentricRingCount, setConcentricRingCount] = useState(10);
  const [waveAmplitude, setWaveAmplitude] = useState(50);
  const [waveFrequency, setWaveFrequency] = useState(3);
  const [waveNumber, setWaveNumber] = useState(3);
  const [waveRotation, setWaveRotation] = useState(0);
  const [meshGridSize, setMeshGridSize] = useState(4);
  
  // New effect parameters
  const [brightnessAmount, setBrightnessAmount] = useState(0);
  const [bokehSize, setBokehSize] = useState(20);
  const [bokehIntensity, setBokehIntensity] = useState(0.5);
  const [bokehColorize, setBokehColorize] = useState(0);
  const [dustSize, setDustSize] = useState(5);
  const [grainType, setGrainType] = useState<'fine' | 'medium' | 'coarse' | 'film'>('medium');
  const [gridVariation, setGridVariation] = useState(0);
  const [gridShapeSize, setGridShapeSize] = useState(20);
  const [kaleidoscopeReflections, setKaleidoscopeReflections] = useState(1);
  const [pixelateScaleDirection, setPixelateScaleDirection] = useState<'out' | 'in'>('out');
  const [scanType, setScanType] = useState<'horizontal' | 'vertical' | 'interlaced' | 'crt'>('horizontal');
  const [posterizeSolarize, setPosterizeSolarize] = useState(0);
  const [audioReactiveColors, setAudioReactiveColors] = useState(false);
  const [noiseScale, setNoiseScale] = useState(25);
  const [noiseOctaves, setNoiseOctaves] = useState(2);
  const [noiseDirection, setNoiseDirection] = useState(0);
  const [plasmaSpeed, setPlasmaSpeed] = useState(1);
  const [plasmaComplexity, setPlasmaComplexity] = useState(5);
  const [radialBurstCount, setRadialBurstCount] = useState(6);
  const [radialBurstSpread, setRadialBurstSpread] = useState(30);
  
  // New dither, slit-scan, and diffusion effect parameters
  const [ditherType, setDitherType] = useState<'bayer' | 'floyd-steinberg'>('bayer');
  const [ditherLevels, setDitherLevels] = useState(2); // Color depth levels
  const [slitScanIntensity, setSlitScanIntensity] = useState(0.5);
  const [slitScanDirection, setSlitScanDirection] = useState<'horizontal' | 'vertical' | 'radial'>('horizontal');
  const [slitScanAnimTrigger, setSlitScanAnimTrigger] = useState(0); // Animation trigger for continuous updates
  const [diffusionSpeed, setDiffusionSpeed] = useState(1);
  const [diffusionFeed, setDiffusionFeed] = useState(0.055);
  const [diffusionKill, setDiffusionKill] = useState(0.062);
  const [diffusionAnimTrigger, setDiffusionAnimTrigger] = useState(0); // Animation trigger for continuous updates
  const [voronoiCellCount, setVoronoiCellCount] = useState(10);
  const [voronoiDistortion, setVoronoiDistortion] = useState(0);
  const [voronoiMorphSpeed, setVoronoiMorphSpeed] = useState(1);
  const [voronoiAnimTime, setVoronoiAnimTime] = useState(0);
  const [conicalSpiralTurns, setConicalSpiralTurns] = useState(5);
  const [conicalSpiralTightness, setConicalSpiralTightness] = useState(0.5);
  const [windmillBlades, setWindmillBlades] = useState(8);
  const [windmillRotation, setWindmillRotation] = useState(0);
  const [iridescentAngle, setIridescentAngle] = useState(0);
  const [iridescentIntensity, setIridescentIntensity] = useState(1);
  const [iridescentScale, setIridescentScale] = useState(1);
  const [waveDistortionStrength, setWaveDistortionStrength] = useState(20);
  const [waveDistortionRotation, setWaveDistortionRotation] = useState(0);
  const [radarSweepAngle, setRadarSweepAngle] = useState(0);
  const [radarFadeLength, setRadarFadeLength] = useState(90);
  const [radarSpeed, setRadarSpeed] = useState(2);
  const [flowerCircles, setFlowerCircles] = useState(7);
  const [flowerScale, setFlowerScale] = useState(1);
  const [flowerRotation, setFlowerRotation] = useState(0);
  const [flowerAnimTime, setFlowerAnimTime] = useState(0);

  // Store base AI colors to keep them anchored
  const [baseAIColors, setBaseAIColors] = useState<ColorRGB[] | null>(null);
  
  // Preset management
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [savedPresets, setSavedPresets] = useState<Array<{name: string; data: any}>>([]);
  
  // Rating system for Randomize
  const [showRatingUI, setShowRatingUI] = useState(false);
  const [ratedResults, setRatedResults] = useState<Array<{rating: number; data: any}>>([]);
  const [pendingRatingState, setPendingRatingState] = useState<any>(null);
  
  // File input refs for uploads
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Undo state - store previous settings for one-level undo
  const [previousState, setPreviousState] = useState<any>(null);

  // Track manual zoom interaction
  const lastManualZoomTime = useRef<number>(0);
  
  // Halftone animation time tracker
  const halftoneTimeRef = useRef<number>(0);

  // Diffusion simulation buffers (for reaction-diffusion)
  const diffusionGridRef = useRef<{a: number[][], b: number[][], width: number, height: number} | null>(null);
  
  // Slit-scan temporal buffer
  const slitScanBufferRef = useRef<ImageData[]>([]);
  
  // Audio reactivity sensitivity/multipliers
  const [bassMultiplier, setBassMultiplier] = useState(1); // Default 1 (range 0-2)
  const [midsMultiplier, setMidsMultiplier] = useState(1); // Default 1 (range 0-2)
  const [trebleMultiplier, setTrebleMultiplier] = useState(1); // Default 1 (range 0-2)
  // Per-band smoothing (0=instant, 0.99=very slow) – default 0.8
  const [bassSmoothing, setBassSmoothing] = useState(0.8);
  const [midsSmoothing, setMidsSmoothing] = useState(0.8);
  const [trebleSmoothing, setTrebleSmoothing] = useState(0.8);
  // Per-band threshold (0–1 fraction of 255) – signals below are gated to 0
  const [bassThreshold, setBassThreshold] = useState(0);
  const [midsThreshold, setMidsThreshold] = useState(0);
  const [trebleThreshold, setTrebleThreshold] = useState(0);
  // Per-band output range clamp
  const [bassMin, setBassMin] = useState(0);
  const [bassMax, setBassMax] = useState(2);
  const [midsMin, setMidsMin] = useState(0);
  const [midsMax, setMidsMax] = useState(2);
  const [trebleMin, setTrebleMin] = useState(0);
  const [trebleMax, setTrebleMax] = useState(2);
  // Master sensitivity - scales all band multipliers
  const [masterSensitivity, setMasterSensitivity] = useState(1);
  // Per-band beat sync mode
  const [bassBeatSync, setBassBeatSync] = useState(false);
  const [midsBeatSync, setMidsBeatSync] = useState(false);
  const [trebleBeatSync, setTrebleBeatSync] = useState(false);
  // BPM display
  const [bpm, setBpm] = useState(0);
  // Band expand/collapse state
  const [bassOpen, setBassOpen] = useState(false);
  const [midsOpen, setMidsOpen] = useState(false);
  const [trebleOpen, setTrebleOpen] = useState(false);
  // Beat flash state (momentary highlight on beat)
  const [bassFlash, setBassFlash] = useState(false);
  const [midsFlash, setMidsFlash] = useState(false);
  const [trebleFlash, setTrebleFlash] = useState(false);
  const [bpmFlash, setBpmFlash] = useState(false);
  // Live level display state (polled from refs)
  const [liveBassLevel, setLiveBassLevel] = useState(0);
  const [liveMidsLevel, setLiveMidsLevel] = useState(0);
  const [liveTrebleLevel, setLiveTrebleLevel] = useState(0);
  const [isAudiovisualsOpen, setIsAudiovisualsOpen] = useState(false);
  const [isAudioControlsOpen, setIsAudioControlsOpen] = useState(false);

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

  // Initialize audio context and analyser
  // Unified audio initialization
  const initAudioContext = useCallback((source: HTMLAudioElement | MediaStream, connectToOutput: boolean = true) => {
    if (!audioContextRef.current) {
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const audioSource = source instanceof HTMLAudioElement
        ? audioContext.createMediaElementSource(source)
        : audioContext.createMediaStreamSource(source);
      sourceRef.current = audioSource;

      audioSource.connect(analyser);
      if (connectToOutput) {
        analyser.connect(audioContext.destination);
      }
    }
  }, []);

  const initAudio = (audioElement: HTMLAudioElement) => initAudioContext(audioElement, true);
  const initMicAudio = (stream: MediaStream) => initAudioContext(stream, false);

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

    // Update on every input event
    const onInput = (e: Event) => { if ((e.target as HTMLElement).matches('input[type="range"]')) update(e.target as HTMLInputElement); };
    document.addEventListener('input', onInput);

    // Watch for new sliders added to the DOM (conditional renders / dropdowns opening)
    const observer = new MutationObserver(() => initAll());
    observer.observe(document.body, { childList: true, subtree: true });

    initAll();
    return () => {
      document.removeEventListener('input', onInput);
      observer.disconnect();
    };
  }, []);

  // Shape BEAT: pulse zoom/scale on every detected beat
  useEffect(() => {
    if (!bassBeatSync || !bassFlash) return;
    setTargetZoom(prev => {
      const pulseZoom = 0.8 + Math.random() * 1.6; // 0.8–2.4 range
      return pulseZoom !== prev ? pulseZoom : pulseZoom + 0.1;
    });
  }, [bassFlash, bassBeatSync]);

  // Motion BEAT: toggle rotation direction on every detected beat
  useEffect(() => {
    if (!midsBeatSync || !midsFlash) return;
    setRotationDirection(prev => prev === 'clockwise' ? 'counter' : 'clockwise');
  }, [midsFlash, midsBeatSync]);

  // Color BEAT: shuffle colors instantly on every detected beat
  useEffect(() => {
    if (!trebleBeatSync || !trebleFlash) return;
    setGradientColors(prev => prev.map(() => randomColor()));
    setTargetColors(prev => prev.map(() => randomColor()));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trebleFlash, trebleBeatSync]);

  // Audio reactivity loop
  useEffect(() => {
    if (!isAudioEnabled || !analyserRef.current || !isAudioReactive) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const analyzeAudio = () => {
      if (!isAudioEnabled || !isAudioReactive) return;

      analyser.getByteFrequencyData(dataArray);

      // ---- Read frequency data ----
      analyser.getByteFrequencyData(dataArray);

      // ---- BASS (bins 0–9) ----
      let bassSum = 0;
      for (let i = 0; i < 10 && i < bufferLength; i++) bassSum += dataArray[i];
      const bassAvgRaw = (bassSum / 10) / 255; // 0-1
      liveBaseLevelRef.current = bassAvgRaw;

      // Beat detection on bass band
      const now = performance.now();
      const bassOnset = bassAvgRaw > bassPrevRef.current * 1.3 && bassAvgRaw > bassThreshold + 0.05;
      if (bassOnset && now - lastBeatTimeRef.current > 200) {
        const interval = now - lastBeatTimeRef.current;
        if (interval < 2000) {
          beatIntervalsRef.current.push(interval);
          if (beatIntervalsRef.current.length > 8) beatIntervalsRef.current.shift();
          const avgInterval = beatIntervalsRef.current.reduce((a, b) => a + b, 0) / beatIntervalsRef.current.length;
          setBpm(Math.round(60000 / avgInterval));
        }
        lastBeatTimeRef.current = now;
        if (bassBeatSync) bassBeatPulseRef.current = 1.0;
        if (midsBeatSync) midsBeatPulseRef.current = 1.0;
        if (trebleBeatSync) trebleBeatPulseRef.current = 1.0;
        // Trigger beat flash indicators
        setBassFlash(true); setMidsFlash(true); setTrebleFlash(true); setBpmFlash(true);
        setTimeout(() => { setBassFlash(false); setMidsFlash(false); setTrebleFlash(false); setBpmFlash(false); }, 120);
      }
      bassPrevRef.current = bassAvgRaw;

      // Bass output: continuous or beat-pulse
      const bassAboveThreshold = bassAvgRaw > bassThreshold;
      let bassRaw: number;
      if (bassBeatSync) {
        bassRaw = bassBeatPulseRef.current * bassMultiplier * masterSensitivity;
        bassBeatPulseRef.current *= 0.85; // decay
      } else {
        bassRaw = bassAboveThreshold ? bassAvgRaw * bassMultiplier * masterSensitivity : 0;
      }
      bassSmoothedRef.current = bassSmoothing * bassSmoothedRef.current + (1 - bassSmoothing) * bassRaw;
      const bassGradientValue = Math.max(bassMin, Math.min(bassMax, bassSmoothedRef.current));
      liveBassSmoothedRef.current = bassGradientValue;
      setAudioGradientParam(bassGradientValue);

      // ---- MIDS (bins 10–49) ----
      let midsSum = 0;
      for (let i = 10; i < 50 && i < bufferLength; i++) midsSum += dataArray[i];
      const midsAvgRaw = (midsSum / 40) / 255;
      liveMidsLevelRef.current = midsAvgRaw;

      const midsAboveThreshold = midsAvgRaw > midsThreshold;
      let midsRaw: number;
      if (midsBeatSync) {
        midsRaw = midsBeatPulseRef.current * midsMultiplier * masterSensitivity;
        midsBeatPulseRef.current *= 0.85;
      } else {
        midsRaw = midsAboveThreshold ? midsAvgRaw * midsMultiplier * masterSensitivity : 0;
      }
      midsSmoothedRef.current = midsSmoothing * midsSmoothedRef.current + (1 - midsSmoothing) * midsRaw;
      const midsEffectValue = Math.max(midsMin, Math.min(midsMax, midsSmoothedRef.current));
      liveMidsSmoothedRef.current = midsEffectValue;
      setAudioEffectParam(midsEffectValue);

      // ---- TREBLE (bins 50–119) ----
      let trebleSum = 0;
      for (let i = 50; i < 120 && i < bufferLength; i++) trebleSum += dataArray[i];
      const trebleAvgRaw = (trebleSum / 70) / 255;
      liveTrebleLevelRef.current = trebleAvgRaw;

      const trebleAboveThreshold = trebleAvgRaw > trebleThreshold;
      let trebleRaw: number;
      if (trebleBeatSync) {
        trebleRaw = trebleBeatPulseRef.current * trebleMultiplier * masterSensitivity * 360;
        trebleBeatPulseRef.current *= 0.85;
      } else {
        trebleRaw = trebleAboveThreshold ? trebleAvgRaw * trebleMultiplier * masterSensitivity * 360 : 0;
      }
      trebleSmoothedRef.current = trebleSmoothing * trebleSmoothedRef.current + (1 - trebleSmoothing) * trebleRaw;
      const trebleColorValue = Math.max(trebleMin * 360, Math.min(trebleMax * 360, trebleSmoothedRef.current));
      liveTrebleSmoothedRef.current = trebleColorValue;
      setAudioColorShift(trebleColorValue);

      // Treble onset detection for Color BEAT
      const trebleOnset = trebleAvgRaw > treblePrevRef.current * 1.2 && trebleAvgRaw > 0.05;
      if (trebleBeatSync && trebleOnset && now - lastTrebleBeatRef.current > 200) {
        lastTrebleBeatRef.current = now;
        setGradientColors(prev => prev.map(() => ({ r: Math.floor(Math.random() * 256), g: Math.floor(Math.random() * 256), b: Math.floor(Math.random() * 256) })));
        setTargetColors(prev => prev.map(() => ({ r: Math.floor(Math.random() * 256), g: Math.floor(Math.random() * 256), b: Math.floor(Math.random() * 256) })));
      }
      treblePrevRef.current = trebleAvgRaw;

      requestAnimationFrame(analyzeAudio);
    };

    const animId = requestAnimationFrame(analyzeAudio);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isAudioEnabled, isAudioReactive, bassMultiplier, midsMultiplier, trebleMultiplier, bassSmoothing, midsSmoothing, trebleSmoothing, bassThreshold, midsThreshold, trebleThreshold, bassMin, bassMax, midsMin, midsMax, trebleMin, trebleMax, masterSensitivity, bassBeatSync, midsBeatSync, trebleBeatSync]);

  // Poll live level refs at ~30fps to drive the bar graph
  useEffect(() => {
    if (!isAudioEnabled || !isAudioReactive) return;
    let rafId: number;
    const poll = () => {
      setLiveBassLevel(liveBaseLevelRef.current);
      setLiveMidsLevel(liveMidsLevelRef.current);
      setLiveTrebleLevel(liveTrebleLevelRef.current);
      rafId = requestAnimationFrame(poll);
    };
    rafId = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(rafId);
  }, [isAudioEnabled, isAudioReactive]);

  // Auto-reactive colors - change colors based on audio
  useEffect(() => {
    if (!audioReactiveColors || !isAudioEnabled || !analyserRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let lastColorChange = 0;
    const colorChangeInterval = 500; // Change colors every 500ms when audio is strong

    const analyzeForColors = () => {
      if (!audioReactiveColors || !isAudioEnabled) return;

      analyser.getByteFrequencyData(dataArray);

      // Calculate overall audio energy
      let totalEnergy = 0;
      for (let i = 0; i < bufferLength; i++) {
        totalEnergy += dataArray[i];
      }
      const avgEnergy = totalEnergy / bufferLength;

      // When audio is strong enough, gradually shift colors
      if (avgEnergy > 30 && Date.now() - lastColorChange > colorChangeInterval) {
        setTargetColors(prev => prev.map(color => {
          // Slightly shift each color based on frequency data
          const hueShift = (avgEnergy / 255) * 30; // Shift up to 30 degrees
          return {
            r: Math.min(255, Math.max(0, color.r + (Math.random() - 0.5) * hueShift)),
            g: Math.min(255, Math.max(0, color.g + (Math.random() - 0.5) * hueShift)),
            b: Math.min(255, Math.max(0, color.b + (Math.random() - 0.5) * hueShift)),
          };
        }));
        lastColorChange = Date.now();
      }

      requestAnimationFrame(analyzeForColors);
    };

    const animId = requestAnimationFrame(analyzeForColors);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [audioReactiveColors, isAudioEnabled]);

  // Handle audio file upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioFile(url);
      setAudioFileName(file.name);
      
      // Create a temporary audio element to extract metadata and waveform
      const tempAudio = new Audio(url);
      tempAudio.addEventListener('loadedmetadata', async () => {
        const duration = tempAudio.duration;
        
        // Extract waveform data using Web Audio API
        try {
          const audioContext = new AudioContext();
          const response = await fetch(url);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          // Store metadata
          setAudioFileMetadata({
            sampleRate: audioBuffer.sampleRate,
            duration: duration
          });
          
          // Generate waveform data with min/max values for actual waveform display
          const channelData = audioBuffer.getChannelData(0);
          const samples = 100; // Number of bars to display
          const blockSize = Math.floor(channelData.length / samples);
          const waveform: number[] = [];
          
          for (let i = 0; i < samples; i++) {
            let min = 1;
            let max = -1;
            for (let j = 0; j < blockSize; j++) {
              const sample = channelData[i * blockSize + j];
              if (sample < min) min = sample;
              if (sample > max) max = sample;
            }
            // Store both min and max as a combined amplitude value
            waveform.push(max - min);
          }
          
          setWaveformData(waveform);
        } catch (error) {
          console.error('Error generating waveform:', error);
        }
      });
      
      // Wait for audio element to be created
      setTimeout(() => {
        if (audioRef.current) {
          initAudio(audioRef.current);
          audioRef.current.play();
          setIsAudioEnabled(true);
          setIsAudioReactive(true); // Auto-enable audio reactivity when loaded
        }
      }, 100);
    }
  }, []);

  // Start microphone visualization
  const startMicVisualization = async (deviceId?: string) => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: deviceId && deviceId !== 'default' ? { deviceId: { exact: deviceId } } : true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Enumerate devices after permission is granted (browser requires permission first)
      const devices = await navigator.mediaDevices.enumerateDevices();
      setAudioInputDevices(devices.filter(d => d.kind === 'audioinput'));

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      setIsMicActive(true);
      setIsAudioEnabled(true);
      setIsAudioReactive(true);
    } catch (error) {
      // Silently fail - microphone access is blocked in preview environments
    }
  };

  // Stop microphone visualization
  const stopMicVisualization = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    analyserRef.current = null;
    setIsMicActive(false);
    setIsAudioEnabled(false);
    setIsAudioReactive(false);
  };

  // Toggle audio reactivity
  const toggleAudio = () => {
    if (audioRef.current) {
      if (isAudioEnabled) {
        audioRef.current.pause();
        setIsAudioEnabled(false);
      } else {
        audioRef.current.play();
        setIsAudioEnabled(true);
      }
    }
  };

  // Interpolate between current and target colors and angle (optimized with single RAF)
  useEffect(() => {
    let rafId: number;
    
    const animate = () => {
      // Batch all state updates together for better performance
      setGradientColors(prev => 
        prev.map((color, index) => {
          const target = targetColors[index];
          // Safety check: ensure both color and target exist
          if (!color || !target) return color || { r: 128, g: 128, b: 128 };
          
          const speed = 0.08 * vcrPlaybackSpeed; // Apply VCR speed control
          
          const newColor = {
            r: color.r + (target.r - color.r) * speed,
            g: color.g + (target.g - color.g) * speed,
            b: color.b + (target.b - color.b) * speed,
          };
          
          // Safety check: ensure no NaN values
          if (isNaN(newColor.r) || isNaN(newColor.g) || isNaN(newColor.b)) {
            return target; // Fall back to target if calculation produced NaN
          }
          
          return newColor;
        })
      );
      
      setGradientAngle(prev => {
        const speed = 0.1 * vcrPlaybackSpeed; // Apply VCR speed control
        return prev + (targetAngle - prev) * speed;
      });
      
      setZoom(prev => {
        const baseSpeed = isAutoMode ? 0.1 : 0.3;
        const speed = baseSpeed * vcrPlaybackSpeed; // Apply VCR speed control
        return prev + (targetZoom - prev) * speed;
      });
      
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [targetColors, targetAngle, targetZoom, isAutoMode, vcrPlaybackSpeed]);

  // Generate random color (memoized as it doesn't depend on state)
  const randomColor = useCallback((): ColorRGB => ({
    r: Math.floor(Math.random() * 256),
    g: Math.floor(Math.random() * 256),
    b: Math.floor(Math.random() * 256),
  }), []);

  // Continuous animation for halftone when Move is enabled
  const [halftoneAnimTrigger, setHalftoneAnimTrigger] = useState(0);
  useEffect(() => {
    if (!activeEffects.includes('halftone') || !halftoneMove) return;
    
    let rafId: number;
    const animateHalftone = () => {
      // Update time directly in the animation loop with VCR speed control
      halftoneTimeRef.current += 0.5 * halftoneMoveSpeed * vcrPlaybackSpeed;
      setHalftoneAnimTrigger(prev => prev + 1);
      rafId = requestAnimationFrame(animateHalftone);
    };
    
    rafId = requestAnimationFrame(animateHalftone);
    return () => cancelAnimationFrame(rafId);
  }, [activeEffects, halftoneMove, halftoneMoveSpeed, vcrPlaybackSpeed]);

  // Continuous animation for grid rotation
  useEffect(() => {
    if (!activeEffects.includes('grid') || gridRotationDirection === 'none') return;
    
    let rafId: number;
    const animateGridRotation = () => {
      setGridRotation(prev => {
        const increment = gridRotationDirection === 'clockwise' ? 2 : -2;
        return (prev + increment) % 360;
      });
      rafId = requestAnimationFrame(animateGridRotation);
    };
    
    rafId = requestAnimationFrame(animateGridRotation);
    return () => cancelAnimationFrame(rafId);
  }, [activeEffects, gridRotationDirection]);

  // Continuous animation for shapes rotation
  useEffect(() => {
    // Rotate shapes when VCR is playing OR when manual rotation is enabled
    const shouldRotate = (gradientType === 'shapes' && isVCRPlaying) ||
                        (gradientType === 'shapes' && shapesRotationDirection !== 'none');
    if (!shouldRotate) return;

    let rafId: number;
    const animateShapesRotation = () => {
      setShapesRotation(prev => {
        // If VCR is playing, rotate clockwise; otherwise use manual direction
        const increment = isVCRPlaying ? 2 * vcrPlaybackSpeed :
                         (shapesRotationDirection === 'clockwise' ? 2 : -2);
        return (prev + increment) % 360;
      });
      rafId = requestAnimationFrame(animateShapesRotation);
    };

    rafId = requestAnimationFrame(animateShapesRotation);
    return () => cancelAnimationFrame(rafId);
  }, [gradientType, isVCRPlaying, vcrPlaybackSpeed, shapesRotationDirection]);

  // Continuous animation for slit-scan effect
  useEffect(() => {
    if (!activeEffects.includes('slit-scan')) {
      // Clear buffer when effect is disabled
      slitScanBufferRef.current = [];
      return;
    }

    let rafId: number;
    const animateSlitScan = () => {
      setSlitScanAnimTrigger(prev => prev + 1);
      // Auto-rotate gradient to make slit-scan effect visible
      setGradientAngle(prev => (prev + 0.5) % 360);
      rafId = requestAnimationFrame(animateSlitScan);
    };

    rafId = requestAnimationFrame(animateSlitScan);
    return () => {
      cancelAnimationFrame(rafId);
      // Clear buffer on cleanup
      slitScanBufferRef.current = [];
    };
  }, [activeEffects]);

  // Continuous animation for Voronoi morphing
  useEffect(() => {
    if (gradientType !== 'voronoi' || voronoiMorphSpeed === 0) return;

    let rafId: number;
    const animateVoronoi = () => {
      setVoronoiAnimTime(prev => prev + voronoiMorphSpeed * 0.01);
      rafId = requestAnimationFrame(animateVoronoi);
    };

    rafId = requestAnimationFrame(animateVoronoi);
    return () => cancelAnimationFrame(rafId);
  }, [gradientType, voronoiMorphSpeed]);

  // Continuous animation for Radar sweep
  useEffect(() => {
    if (gradientType !== 'radar' || radarSpeed === 0) return;

    let rafId: number;
    const animateRadar = () => {
      setRadarSweepAngle(prev => (prev + radarSpeed) % 360);
      rafId = requestAnimationFrame(animateRadar);
    };

    rafId = requestAnimationFrame(animateRadar);
    return () => cancelAnimationFrame(rafId);
  }, [gradientType, radarSpeed]);

  // Continuous rotation animation for Flower gradient
  useEffect(() => {
    if (gradientType !== 'flower') return;

    let rafId: number;
    const animateFlower = () => {
      setFlowerAnimTime(prev => prev + 0.5);
      rafId = requestAnimationFrame(animateFlower);
    };

    rafId = requestAnimationFrame(animateFlower);
    return () => cancelAnimationFrame(rafId);
  }, [gradientType]);

  // Save current state for undo (defined early for use in other functions)
  const saveCurrentState = useCallback(() => {
    setPreviousState({
      gradientColors: [...gradientColors],
      targetColors: [...targetColors],
      gradientType,
      gradientAngle,
      targetAngle,
      zoom,
      targetZoom,
      activeEffects: [...activeEffects],
      colorPins: colorPins.map(pin => ({...pin})),
      kaleidoscopeSegments,
      twistAmount,
      pixelSize,
      triangleSize,
      chromaticOffset,
      fisheyeStrength,
      tileCount,
      grainIntensity,
      blurMotionAmount,
      blurMotionDirection,
      blurGaussianAmount,
      blurRadialAmount,
      blurType,
      posterizeLevels,
      halftoneSize,
      halftoneVariation,
      halftoneMove,
      halftoneMoveSpeed,
      vignetteStrength,
      colorShiftHue,
      bulgeStrength,
      charcoalIntensity,
      colorBurnIntensity,
      colorDodgeIntensity,
      digitalNoiseIntensity,
      duotoneIntensity,
      duotoneColor1,
      duotoneColor2,
      dustIntensity,
      dustCrackleIntensity,
      gridSize,
      hexGridSize,
      lightLeakIntensity,
      lensFlareIntensity,
      lensFlareX,
      lensFlareY,
      lensFlareSize,
      linesCount,
      linesAngle,
      linesThickness,
      liquifyStrength,
      mandalaSegments,
      pinchStrength,
      polarAngle,
      polarRadius,
      polarRotation,
      scanLineSize,
      sepiaIntensity,
      solarizeThreshold,
      triGridSize,
      gridSides,
      gridRows,
      gridColumns,
      tritoneIntensity,
      tritoneColor1,
      tritoneColor2,
      tritoneColor3,
      vhsGlitchIntensity,
      polygonSides,
      polygon2Sides,
      waveDistortionStrength,
      spiralTightness,
      spiralRotations,
      spiralThickness,
      spiralZoom,
      shapesSides,
      shapesCount,
      concentricRingWidth,
      concentricRingCount,
      waveAmplitude,
      waveFrequency,
      waveNumber,
      waveRotation,
      meshGridSize,
      noiseScale,
      noiseOctaves,
      noiseDirection,
      plasmaSpeed,
      plasmaComplexity,
      radialBurstCount,
      radialBurstSpread,
      conicalSpiralTurns,
      conicalSpiralTightness,
      windmillBlades,
      windmillRotation,
      gridRotation,
      shapesRotation,
      angleStartOffset,
      angleCenterX,
      angleCenterY,
      iridescentAngle,
      iridescentIntensity,
      iridescentScale,
      resolutionMultiplier,
      baseAIColors: baseAIColors ? [...baseAIColors] : null,
      submittedAIPrompt,
    });
  }, [resolutionMultiplier, gradientColors, targetColors, gradientType, gradientAngle, targetAngle, zoom, targetZoom, 
      activeEffects, colorPins, kaleidoscopeSegments, twistAmount, pixelSize, triangleSize, 
      chromaticOffset, fisheyeStrength, tileCount, grainIntensity, blurMotionAmount, 
      blurMotionDirection, blurGaussianAmount, blurRadialAmount, blurType, posterizeLevels, halftoneSize, halftoneVariation, halftoneMove, halftoneMoveSpeed, 
      vignetteStrength, colorShiftHue, bulgeStrength, charcoalIntensity, colorBurnIntensity, 
      colorDodgeIntensity, digitalNoiseIntensity, duotoneIntensity, duotoneColor1, duotoneColor2, dustIntensity, 
      dustCrackleIntensity, gridSize, hexGridSize, lightLeakIntensity, lensFlareIntensity, lensFlareX, lensFlareY, lensFlareSize, linesCount, linesAngle, 
      linesThickness, liquifyStrength, mandalaSegments, pinchStrength, polarAngle, polarRadius, 
      polarRotation, scanLineSize, sepiaIntensity, solarizeThreshold, triGridSize, gridSides, gridRows, gridColumns, 
      tritoneIntensity, tritoneColor1, tritoneColor2, tritoneColor3, vhsGlitchIntensity, 
      polygonSides, polygon2Sides, waveDistortionStrength,
      spiralTightness, spiralRotations, spiralThickness, spiralZoom, shapesSides, shapesCount, concentricRingWidth, concentricRingCount,
      waveAmplitude, waveFrequency, waveNumber, waveRotation, meshGridSize, noiseScale, noiseOctaves, noiseDirection, plasmaSpeed,
      plasmaComplexity, radialBurstCount, radialBurstSpread,
      conicalSpiralTurns, conicalSpiralTightness, windmillBlades, windmillRotation, gridRotation,
      angleStartOffset, angleCenterX, angleCenterY,
      iridescentAngle, iridescentIntensity, iridescentScale,
      baseAIColors, submittedAIPrompt]);

  // Randomize all colors
  const randomizeAllColors = useCallback(() => {
    saveCurrentState();
    setTargetColors(gradientColors.map(() => randomColor()));
    setBaseAIColors(null); // Clear base AI colors when randomizing
    setSubmittedAIPrompt(''); // Clear submitted prompt when randomizing
    
    // Also randomize tritone and duotone colors
    const randomHexColor = () => {
      const r = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
      const g = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
      const b = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    };
    setTritoneColor1(randomHexColor());
    setTritoneColor2(randomHexColor());
    setTritoneColor3(randomHexColor());
    setDuotoneColor1(randomHexColor());
    setDuotoneColor2(randomHexColor());
  }, [gradientColors, randomColor, saveCurrentState]);

  // Memoize gradient name mapping
  const getGradientDisplayName = useCallback((type: GradientType): string => {
    if (type === 'spiral') return 'Windmill';
    if (type === 'polygon-solid') return 'Polar Grid';
    if (type === 'shapes') return 'Shapes';
    if (type === 'voronoi') return 'Voronoi';
    if (type === 'mesh') return 'Mesh';
    if (type === 'iridescent') return 'Iridescent';
    if (type === 'radar') return 'Radar';
    if (type === 'flower') return 'Flower';
    return type;
  }, []);

  // Memoize full gradient type list for UI
  const FULL_GRADIENT_TYPES: GradientType[] = useMemo(() =>
    ['angle', 'conical-spiral', 'fade', 'flower', 'grid', 'iridescent', 'noise', 'plasma', 'polygon-solid', 'radar', 'radial', 'radial-burst', 'shapes', 'spiral', 'voronoi', 'waves'],
    []
  );

  // Gradient types for Randomize (excludes freeform and mesh)
  const FEELING_LUCKY_GRADIENT_TYPES: GradientType[] = useMemo(() =>
    ['angle', 'conical-spiral', 'fade', 'flower', 'grid', 'iridescent', 'noise', 'plasma', 'polygon-solid', 'radar', 'radial', 'radial-burst', 'shapes', 'voronoi', 'waves', 'spiral'],
    []
  );

  // Shuffle gradient type
  const shuffleGradientType = useCallback(() => {
    saveCurrentState();
    const currentIndex = gradientType ? FULL_GRADIENT_TYPES.indexOf(gradientType) : -1;
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * FULL_GRADIENT_TYPES.length);
    } while (newIndex === currentIndex && FULL_GRADIENT_TYPES.length > 1);
    setGradientType(FULL_GRADIENT_TYPES[newIndex]);
  }, [gradientType, FULL_GRADIENT_TYPES, saveCurrentState]);

  // Randomize effects
  const randomizeEffects = useCallback(() => {
    saveCurrentState();
    const allEffects: EffectType[] = [
      'blur', 'charcoal', 'chromatic', 'duotone',
      'dust-scratches', 'fisheye', 'film-grain', 'grid', 'halftone', 'invert',
      'kaleidoscope', 'pixelate', 'posterize',
      'tritone', 'triangulate',
      'vhs-glitch', 'vignette', 'wave-distortion', 'color-shift'
    ];
    
    // Randomly select 1-3 effects
    const numEffects = Math.floor(Math.random() * 3) + 1;
    const shuffled = [...allEffects].sort(() => Math.random() - 0.5);
    const selectedEffects = shuffled.slice(0, numEffects);
    
    setActiveEffects(selectedEffects);
    if (selectedEffects.length > 1) {
      setIsMultiFxMode(true);
    }
  }, [saveCurrentState]);

  // Undo to previous state
  const undoLastChange = useCallback(() => {
    if (!previousState) return;
    
    // Ensure colors are valid and match in length
    const colors = previousState.gradientColors || DEFAULT_COLORS;
    const targets = previousState.targetColors || colors;
    setGradientColors(colors);
    setTargetColors(targets);
    setGradientType(previousState.gradientType);
    setGradientAngle(previousState.gradientAngle);
    setTargetAngle(previousState.targetAngle);
    setZoom(previousState.zoom);
    setTargetZoom(previousState.targetZoom);
    setActiveEffects(previousState.activeEffects);
    setColorPins(previousState.colorPins);
    setKaleidoscopeSegments(previousState.kaleidoscopeSegments);
    setTwistAmount(previousState.twistAmount);
    setPixelSize(previousState.pixelSize);
    setTriangleSize(previousState.triangleSize);
    setChromaticOffset(previousState.chromaticOffset);
    setFisheyeStrength(previousState.fisheyeStrength);
    setTileCount(previousState.tileCount);
    setGrainIntensity(previousState.grainIntensity);
    setBlurMotionAmount(previousState.blurMotionAmount);
    setBlurMotionDirection(previousState.blurMotionDirection);
    setBlurGaussianAmount(previousState.blurGaussianAmount);
    setBlurRadialAmount(previousState.blurRadialAmount);
    setBlurType(previousState.blurType);
    setPosterizeLevels(previousState.posterizeLevels);
    setHalftoneSize(previousState.halftoneSize);
    setHalftoneVariation(previousState.halftoneVariation);
    setHalftoneMove(previousState.halftoneMove);
    setHalftoneMoveSpeed(previousState.halftoneMoveSpeed);
    setVignetteStrength(previousState.vignetteStrength);
    setColorShiftHue(previousState.colorShiftHue);
    setBulgeStrength(previousState.bulgeStrength);
    setCharcoalIntensity(previousState.charcoalIntensity);
    setColorBurnIntensity(previousState.colorBurnIntensity);
    setColorDodgeIntensity(previousState.colorDodgeIntensity);
    setDigitalNoiseIntensity(previousState.digitalNoiseIntensity);
    setDuotoneIntensity(previousState.duotoneIntensity);
    setDuotoneColor1(previousState.duotoneColor1);
    setDuotoneColor2(previousState.duotoneColor2);
    setDustIntensity(previousState.dustIntensity);
    setDustCrackleIntensity(previousState.dustCrackleIntensity);
    setGridSize(previousState.gridSize);
    setHexGridSize(previousState.hexGridSize);
    setLightLeakIntensity(previousState.lightLeakIntensity);
    setLensFlareIntensity(previousState.lensFlareIntensity);
    setLensFlareX(previousState.lensFlareX);
    setLensFlareY(previousState.lensFlareY);
    setLensFlareSize(previousState.lensFlareSize);
    setLinesCount(previousState.linesCount);
    setLinesAngle(previousState.linesAngle);
    setLinesThickness(previousState.linesThickness);
    setLiquifyStrength(previousState.liquifyStrength);
    setMandalaSegments(previousState.mandalaSegments);
    setPinchStrength(previousState.pinchStrength);
    setPolarAngle(previousState.polarAngle);
    setPolarRadius(previousState.polarRadius);
    setPolarRotation(previousState.polarRotation);
    setScanLineSize(previousState.scanLineSize);
    setSepiaIntensity(previousState.sepiaIntensity);
    setSolarizeThreshold(previousState.solarizeThreshold);
    setTriGridSize(previousState.triGridSize);
    setGridSides(previousState.gridSides);
    setTritoneIntensity(previousState.tritoneIntensity);
    setTritoneColor1(previousState.tritoneColor1);
    setTritoneColor2(previousState.tritoneColor2);
    setTritoneColor3(previousState.tritoneColor3);
    setVhsGlitchIntensity(previousState.vhsGlitchIntensity);
    setGridRows(previousState.gridRows);
    setGridColumns(previousState.gridColumns);
    setPolygonSides(previousState.polygonSides);
    setPolygon2Sides(previousState.polygon2Sides);
    setWaveDistortionStrength(previousState.waveDistortionStrength);
    setSpiralTightness(previousState.spiralTightness);
    setSpiralRotations(previousState.spiralRotations);
    setSpiralThickness(previousState.spiralThickness);
    setSpiralZoom(previousState.spiralZoom);
    setShapesSides(previousState.shapesSides);
    setShapesCount(previousState.shapesCount);
    setConcentricRingWidth(previousState.concentricRingWidth);
    setConcentricRingCount(previousState.concentricRingCount);
    setWaveAmplitude(previousState.waveAmplitude);
    setWaveFrequency(previousState.waveFrequency);
    setWaveNumber(previousState.waveNumber || 3);
    setWaveRotation(previousState.waveRotation || 0);
    setMeshGridSize(previousState.meshGridSize);
    setNoiseScale(previousState.noiseScale);
    setNoiseOctaves(previousState.noiseOctaves);
    setNoiseDirection(previousState.noiseDirection || 0);
    setPlasmaSpeed(previousState.plasmaSpeed);
    setPlasmaComplexity(previousState.plasmaComplexity);
    setRadialBurstCount(previousState.radialBurstCount);
    setRadialBurstSpread(previousState.radialBurstSpread);
    setConicalSpiralTurns(previousState.conicalSpiralTurns);
    setConicalSpiralTightness(previousState.conicalSpiralTightness);
    setWindmillBlades(previousState.windmillBlades);
    setWindmillRotation(previousState.windmillRotation);
    setGridRotation(previousState.gridRotation);
    setShapesRotation(previousState.shapesRotation || 0);
    setAngleStartOffset(previousState.angleStartOffset);
    setAngleCenterX(previousState.angleCenterX);
    setAngleCenterY(previousState.angleCenterY);
    setIridescentAngle(previousState.iridescentAngle);
    setIridescentIntensity(previousState.iridescentIntensity);
    setIridescentScale(previousState.iridescentScale);
    setResolutionMultiplier(previousState.resolutionMultiplier || 1);
    setBaseAIColors(previousState.baseAIColors);
    setSubmittedAIPrompt(previousState.submittedAIPrompt);

    setPreviousState(null); // Clear undo after using it
  }, [previousState]);

  // Keyboard shortcuts - Cmd/Ctrl+Z for undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+Z (Mac) or Ctrl+Z (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undoLastChange();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoLastChange]);

  // Memoize gradient and effect type arrays (constant values)
  const GRADIENT_TYPES: GradientType[] = useMemo(() => 
    ['linear', 'radial', 'angle', 'spiral', 'starburst', 'polygon', 'waves', 'circles', 'fade', 'mesh', 'conical-spiral', 'radial-burst', 'voronoi', 'noise', 'plasma', 'grid', 'checkerboard', 'tunnel'], 
    []
  );
  
  const ALL_EFFECTS: EffectType[] = useMemo(() =>
    ['blur', 'bokeh', 'brightness', 'charcoal', 'chromatic', 'dither', 'duotone', 'dust-scratches', 'fisheye', 'film-grain', 'grid', 'halftone', 'invert', 'kaleidoscope', 'pixelate', 'posterize', 'color-shift', 'slit-scan', 'triangulate', 'vhs-glitch', 'vignette', 'wave-distortion'],
    []
  );

  // Randomize - randomize everything!
  const feelingLucky = useCallback(() => {
    saveCurrentState();

    // If no gradient type is selected, select a random one
    let currentGradientType = gradientType;
    if (currentGradientType === null) {
      const randomGradient = FEELING_LUCKY_GRADIENT_TYPES[Math.floor(Math.random() * FEELING_LUCKY_GRADIENT_TYPES.length)];
      setGradientType(randomGradient);
      currentGradientType = randomGradient;
    }

    // Get high-rated results (7+) to use as preference guidance
    const highRatedResults = ratedResults.filter(r => r.rating >= 7);
    const usePreferences = highRatedResults.length > 0 && Math.random() < 0.7; // 70% chance to use preferences
    
    if (usePreferences && highRatedResults.length > 0) {
      // Blend with a high-rated result
      const baseResult = highRatedResults[Math.floor(Math.random() * highRatedResults.length)];
      const blendFactor = 0.3 + Math.random() * 0.4; // 30-70% blend
      
      // Use base result's gradient type and effects with some variation
      // Ensure we always have a valid gradient type (fallback to current or random if base is null)
      const targetGradientType = baseResult.data.gradientType || currentGradientType || FEELING_LUCKY_GRADIENT_TYPES[Math.floor(Math.random() * FEELING_LUCKY_GRADIENT_TYPES.length)];
      setGradientType(targetGradientType);
      
      // Blend colors from base with some random variation
      const blendedColors = baseResult.data.gradientColors.map((baseColor: ColorRGB) => {
        if (Math.random() < blendFactor) {
          return baseColor; // Keep base color
        } else {
          // Mix base color with random color
          const randColor = randomColor();
          return {
            r: Math.round(baseColor.r * 0.7 + randColor.r * 0.3),
            g: Math.round(baseColor.g * 0.7 + randColor.g * 0.3),
            b: Math.round(baseColor.b * 0.7 + randColor.b * 0.3),
          };
        }
      });
      
      // Ensure blendedColors matches the current gradientColors length
      const adjustedColors = adjustColorArrayLength(blendedColors, gradientColors.length);
      setTargetColors(adjustedColors);
      setGradientColors(adjustedColors); // Also update current colors immediately
      
      // Use similar effects from base result
      const baseEffects = baseResult.data.activeEffects || [];
      const keepEffectsCount = Math.floor(baseEffects.length * blendFactor);
      const keptEffects = baseEffects.slice(0, keepEffectsCount);
      
      // Add some random effects
      const additionalEffects = Math.floor(Math.random() * 3);
      for (let i = 0; i < additionalEffects; i++) {
        const randomEffect = ALL_EFFECTS[Math.floor(Math.random() * ALL_EFFECTS.length)];
        if (!keptEffects.includes(randomEffect)) {
          keptEffects.push(randomEffect);
        }
      }
      setActiveEffects(keptEffects);
      setIsMultiFxMode(true);
      
      // Blend numerical parameters with base result
      const blendValue = (baseVal: number, min: number, max: number) => {
        const randomVal = min + Math.random() * (max - min);
        return baseVal * blendFactor + randomVal * (1 - blendFactor);
      };
      
      setTargetAngle(blendValue(baseResult.data.gradientAngle || 0, 0, 360));
      setTargetZoom(blendValue(baseResult.data.zoom || 1, 0.5, 3));
      
      const speedOptions = [0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const randomSpeed = speedOptions[Math.floor(Math.random() * speedOptions.length)];
      setVcrPlaybackSpeed(randomSpeed);
      
      setRotationDirection(Math.random() < 0.5 ? 'clockwise' : 'counter');
      
      // Set FX parameters with blending
      if (baseResult.data.kaleidoscopeSegments) setKaleidoscopeSegments(Math.round(blendValue(baseResult.data.kaleidoscopeSegments, 3, 22)));
      if (baseResult.data.twistAmount) setTwistAmount(blendValue(baseResult.data.twistAmount, 0, 5));
      if (baseResult.data.pixelSize) setPixelSize(Math.round(blendValue(baseResult.data.pixelSize, 5, 54)));
      if (baseResult.data.vignetteStrength) setVignetteStrength(blendValue(baseResult.data.vignetteStrength, 0, 1));
      if (baseResult.data.spiralTightness) setSpiralTightness(Math.round(blendValue(baseResult.data.spiralTightness, 1, 20)));
      if (baseResult.data.plasmaSpeed) setPlasmaSpeed(blendValue(baseResult.data.plasmaSpeed, 0.25, 5));
      
      // Randomize remaining parameters normally
      setTriangleSize(Math.floor(Math.random() * 80) + 20);
      setChromaticOffset(Math.floor(Math.random() * 20) + 1);
      setFisheyeStrength(Math.random());
      setTileCount(Math.floor(Math.random() * 5) + 1);
      setGrainIntensity(Math.random() * 0.5);
    } else {
      // Full random generation (original logic)
      setTargetColors(gradientColors.map(() => randomColor()));
      
      const randomGradient = FEELING_LUCKY_GRADIENT_TYPES[Math.floor(Math.random() * FEELING_LUCKY_GRADIENT_TYPES.length)];
      setGradientType(randomGradient);
      
      // Generate between 1-8 effects
      const numEffects = Math.floor(Math.random() * 8) + 1; // Random number from 1 to 8
      const selectedEffects: EffectType[] = [];
      
      for (let i = 0; i < numEffects; i++) {
        const randomEffect = ALL_EFFECTS[Math.floor(Math.random() * ALL_EFFECTS.length)];
        if (!selectedEffects.includes(randomEffect)) {
          selectedEffects.push(randomEffect);
        }
      }
      
      setActiveEffects(selectedEffects);
      setIsMultiFxMode(true);
      
      setTargetAngle(Math.random() * 360);
      setTargetZoom(0.5 + Math.random() * 2.5);
      
      const speedOptions = [0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const randomSpeed = speedOptions[Math.floor(Math.random() * speedOptions.length)];
      setVcrPlaybackSpeed(randomSpeed);
      
      setRotationDirection(Math.random() < 0.5 ? 'clockwise' : 'counter');
      
      setKaleidoscopeSegments(Math.floor(Math.random() * 20) + 3);
      setTwistAmount(Math.random() * 5);
      setPixelSize(Math.floor(Math.random() * 50) + 5);
      setTriangleSize(Math.floor(Math.random() * 80) + 20);
      setChromaticOffset(Math.floor(Math.random() * 20) + 1);
      setFisheyeStrength(Math.random());
      setTileCount(Math.floor(Math.random() * 5) + 1);
      setGrainIntensity(Math.random() * 0.5);
    }
    
    setBaseAIColors(null);
    setSubmittedAIPrompt('');
    
    // Randomize colors
    // setTargetColors(gradientColors.map(() => randomColor()));
    // setBaseAIColors(null);
    // setSubmittedAIPrompt('');
    
    // Pick a random gradient type from the valid gradient types (excludes freeform)
    // const randomGradient = FEELING_LUCKY_GRADIENT_TYPES[Math.floor(Math.random() * FEELING_LUCKY_GRADIENT_TYPES.length)];
    // setGradientType(randomGradient);
    
    // Pick 1-10 random effects with a mean of 5 using triangular distribution
    // Use triangular distribution: sum of two uniform randoms gives a distribution centered around 5
    // const numEffects = Math.min(10, Math.max(1, Math.round((Math.random() + Math.random()) * 5)));
    // const selectedEffects: EffectType[] = [];
    
    // for (let i = 0; i < numEffects; i++) {
    //   const randomEffect = ALL_EFFECTS[Math.floor(Math.random() * ALL_EFFECTS.length)];
    //   if (!selectedEffects.includes(randomEffect)) {
    //     selectedEffects.push(randomEffect);
    //   }
    // }
    
    // setActiveEffects(selectedEffects);
    // Enable MULTI FX mode so users can deselect individual effects
    // setIsMultiFxMode(true);
    
    // Random rotation angle
    // setTargetAngle(Math.random() * 360);
    
    // Random zoom
    // setTargetZoom(0.5 + Math.random() * 2.5); // 0.5 to 3
    
    // Random playback speed - only 0.5x, 1x, and 2x-10x
    // const speedOptions = [0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    // const randomSpeed = speedOptions[Math.floor(Math.random() * speedOptions.length)];
    // setVcrPlaybackSpeed(randomSpeed);
    
    // Random rotation direction
    // setRotationDirection(Math.random() < 0.5 ? 'clockwise' : 'counter');
    
    // Randomize all FX slider variables
    // setKaleidoscopeSegments(Math.floor(Math.random() * 20) + 3); // 3-22
    // setTwistAmount(Math.random() * 5); // 0-5
    // setPixelSize(Math.floor(Math.random() * 50) + 5); // 5-54
    // setTriangleSize(Math.floor(Math.random() * 80) + 20); // 20-99
    // setChromaticOffset(Math.floor(Math.random() * 20) + 1); // 1-20
    // setFisheyeStrength(Math.random()); // 0-1
    // setTileCount(Math.floor(Math.random() * 5) + 1); // 1-5
    // setGrainIntensity(Math.random() * 0.5); // 0-0.5
    setBlurMotionAmount(Math.floor(Math.random() * 20) + 1); // 1-20
    setBlurMotionDirection(Math.floor(Math.random() * 360)); // 0-360
    setBlurGaussianAmount(Math.floor(Math.random() * 20) + 1); // 1-20
    setBlurRadialAmount(Math.floor(Math.random() * 20) + 1); // 1-20
    setPosterizeLevels(Math.floor(Math.random() * 14) + 2); // 2-15
    setHalftoneSize(Math.floor(Math.random() * 198) + 2); // 2-200
    setHalftoneVariation(Math.random()); // 0-1
    setHalftoneMove(Math.random() > 0.5); // random true/false
    setHalftoneMoveSpeed(Math.random() * 9 + 1); // 1-10
    setVignetteStrength(Math.random()); // 0-1
    setColorShiftHue(Math.floor(Math.random() * 360)); // 0-360
    setBulgeStrength(Math.random()); // 0-1
    setCharcoalIntensity(Math.random()); // 0-1
    setColorBurnIntensity(Math.random()); // 0-1
    setColorDodgeIntensity(Math.random()); // 0-1
    setDigitalNoiseIntensity(Math.random()); // 0-1
    setDuotoneIntensity(Math.random()); // 0-1
    setDustIntensity(Math.random()); // 0-1
    setDustCrackleIntensity(Math.random()); // 0-1
    setGridSize(Math.floor(Math.random() * 40) + 10); // 10-49
    setHexGridSize(Math.floor(Math.random() * 190) + 10); // 10-200
    setLightLeakIntensity(Math.random()); // 0-1
    setLensFlareIntensity(Math.random()); // 0-1
    setLensFlareX(Math.random()); // 0-1
    setLensFlareY(Math.random()); // 0-1
    setLensFlareSize(Math.floor(Math.random() * 400) + 100); // 100-499
    setLinesCount(Math.floor(Math.random() * 150) + 10); // 10-159
    setLinesAngle(Math.floor(Math.random() * 360)); // 0-360
    setLinesThickness(Math.floor(Math.random() * 49) + 1); // 1-50
    setLiquifyStrength(Math.floor(Math.random() * 80) + 10); // 10-89
    setMandalaSegments(Math.floor(Math.random() * 20) + 4); // 4-23
    setPinchStrength(Math.random()); // 0-1
    setPolarAngle(Math.floor(Math.random() * 360)); // 0-360
    setPolarRadius(Math.random() * 2 + 0.5); // 0.5-2.5
    setPolarRotation(Math.floor(Math.random() * 360)); // 0-360
    setScanLineSize(Math.floor(Math.random() * 15) + 2); // 2-16
    setSepiaIntensity(Math.random()); // 0-1
    setSolarizeThreshold(Math.floor(Math.random() * 255)); // 0-255
    setTriGridSize(Math.floor(Math.random() * 50) + 10); // 10-59
    setGridSides(Math.floor(Math.random() * 10) + 1); // 1-10 sides
    setTritoneIntensity(Math.random()); // 0-1
    setVhsGlitchIntensity(Math.random()); // 0-1
    setGridRows(Math.floor(Math.random() * 50) + 1); // 1-50
    setGridColumns(Math.floor(Math.random() * 50) + 1); // 1-50
    setPolygonSides(Math.floor(Math.random() * 10) + 1); // 1-10
    setPolygon2Sides(Math.floor(Math.random() * 10) + 1); // 1-10
    setWaveDistortionStrength(Math.floor(Math.random() * 80) + 10); // 10-89
    
    // Randomize gradient-specific controls
    setSpiralTightness(Math.floor(Math.random() * 19) + 1); // 1-20
    setSpiralRotations(Math.floor(Math.random() * 9) + 1); // 1-10
    setSpiralThickness(Math.floor(Math.random() * 95) + 5); // 5-100
    setSpiralZoom(Math.random() * 4.9 + 0.1); // 0.1-5
    setShapesSides(Math.floor(Math.random() * 10) + 1); // 1-10
    setShapesCount(Math.floor(Math.random() * 49) + 1); // 1-50
    setConcentricRingWidth(Math.floor(Math.random() * 280) + 20); // 20-300
    setConcentricRingCount(Math.floor(Math.random() * 29) + 1); // 1-30
    setWaveAmplitude(Math.floor(Math.random() * 190) + 10); // 10-200
    setWaveFrequency(Math.floor(Math.random() * 9) + 1); // 1-10
    setWaveNumber(Math.floor(Math.random() * 19) + 1); // 1-20
    setWaveRotation(Math.floor(Math.random() * 360)); // 0-360
    setMeshGridSize(Math.floor(Math.random() * 9) + 1); // 1-10
    setNoiseScale(Math.floor(Math.random() * 100) + 1); // 1-100
    setNoiseOctaves(Math.floor(Math.random() * 7) + 1); // 1-8
    setNoiseDirection(Math.floor(Math.random() * 360)); // 0-360
    setPlasmaSpeed(Math.random() * 4.75 + 0.25); // 0.25-5
    setPlasmaComplexity(Math.floor(Math.random() * 9) + 1); // 1-10
    setRadialBurstCount(Math.floor(Math.random() * 19) + 2); // 2-20
    setRadialBurstSpread(Math.floor(Math.random() * 91) + 10); // 10-100
    setVoronoiCellCount(Math.floor(Math.random() * 41) + 5); // 5-45
    setVoronoiDistortion(Math.floor(Math.random() * 51)); // 0-50
    setConicalSpiralTurns(Math.floor(Math.random() * 14) + 1); // 1-15
    setConicalSpiralTightness(Math.random() * 1.5 + 0.1); // 0.1-1.6
    setWindmillBlades(Math.floor(Math.random() * 15) + 3); // 3-17
    setWindmillRotation(Math.floor(Math.random() * 360)); // 0-360
    setGridRotation(Math.floor(Math.random() * 360)); // 0-360
    setAngleStartOffset(Math.floor(Math.random() * 360)); // 0-360
    setAngleCenterX(Math.floor(Math.random() * 100)); // 0-100
    setAngleCenterY(Math.floor(Math.random() * 100)); // 0-100
    setIridescentAngle(Math.floor(Math.random() * 360)); // 0-360
    setIridescentIntensity(Math.random() * 1.5 + 0.5); // 0.5-2.0
    setIridescentScale(Math.random() * 2 + 0.5); // 0.5-2.5
    
    // Randomize tritone colors
    const randomHexColor = () => {
      const r = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
      const g = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
      const b = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    };
    setTritoneColor1(randomHexColor());
    setTritoneColor2(randomHexColor());
    setTritoneColor3(randomHexColor());
    
    setDuotoneColor1(randomHexColor());
    setDuotoneColor2(randomHexColor());
    
    // Randomize freeform gradient pins (3-8 random pins)
    const numPins = Math.floor(Math.random() * 6) + 3; // 3-8 pins
    const newPins: ColorPin[] = [];
    for (let i = 0; i < numPins; i++) {
      newPins.push({
        id: `${Date.now()}-${i}`,
        x: 0.2 + Math.random() * 0.6, // Keep pins within 0.2-0.8 range
        y: 0.2 + Math.random() * 0.6,
        color: {
          r: Math.floor(Math.random() * 255),
          g: Math.floor(Math.random() * 255),
          b: Math.floor(Math.random() * 255),
        },
        radius: 150 + Math.floor(Math.random() * 350), // 150-500
      });
    }
    setColorPins(newPins);
    setSelectedPinId(null); // Clear selection

    // Rating UI removed - keeping backend rating system for Randomize algorithm
    // setShowRatingUI(true);
  }, [gradientType, gradientColors, randomColor, FEELING_LUCKY_GRADIENT_TYPES, ALL_EFFECTS, saveCurrentState, ratedResults]);

  // Capture current state for rating
  const captureCurrentStateForRating = useCallback(() => {
    setPendingRatingState({
      gradientColors,
      gradientType,
      activeEffects,
      gradientAngle,
      zoom,
      vcrPlaybackSpeed,
      rotationDirection,
      kaleidoscopeSegments,
      twistAmount,
      pixelSize,
      triangleSize,
      chromaticOffset,
      fisheyeStrength,
      tileCount,
      grainIntensity,
      blurMotionAmount,
      blurMotionDirection,
      blurGaussianAmount,
      blurRadialAmount,
      posterizeLevels,
      halftoneSize,
      halftoneVariation,
      halftoneMove,
      halftoneMoveSpeed,
      vignetteStrength,
      colorShiftHue,
      bulgeStrength,
      charcoalIntensity,
      colorBurnIntensity,
      colorDodgeIntensity,
      digitalNoiseIntensity,
      duotoneIntensity,
      duotoneColor1,
      duotoneColor2,
      dustIntensity,
      dustCrackleIntensity,
      gridSize,
      hexGridSize,
      lightLeakIntensity,
      lensFlareIntensity,
      lensFlareX,
      lensFlareY,
      lensFlareSize,
      linesCount,
      linesAngle,
      linesThickness,
      liquifyStrength,
      mandalaSegments,
      pinchStrength,
      polarAngle,
      polarRadius,
      polarRotation,
      scanLineSize,
      sepiaIntensity,
      solarizeThreshold,
      triGridSize,
      gridSides,
      tritoneIntensity,
      tritoneColor1,
      tritoneColor2,
      tritoneColor3,
      vhsGlitchIntensity,
      gridRows,
      gridColumns,
      polygonSides,
      polygon2Sides,
      waveDistortionStrength,
      spiralTightness,
      spiralRotations,
      spiralThickness,
      spiralZoom,
      shapesSides,
      shapesCount,
      concentricRingWidth,
      concentricRingCount,
      waveAmplitude,
      waveFrequency,
      waveNumber,
      waveRotation,
      meshGridSize,
      noiseScale,
      noiseOctaves,
      noiseDirection,
      plasmaSpeed,
      plasmaComplexity,
      radialBurstCount,
      radialBurstSpread,
      voronoiCellCount,
      voronoiDistortion,
      conicalSpiralTurns,
      conicalSpiralTightness,
      windmillBlades,
      windmillRotation,
      gridRotation,
      shapesRotation,
      angleStartOffset,
      angleCenterX,
      angleCenterY,
      iridescentAngle,
      iridescentIntensity,
      iridescentScale,
    });
  }, [
    gradientColors, gradientType, activeEffects, gradientAngle, zoom, vcrPlaybackSpeed, rotationDirection,
    kaleidoscopeSegments, twistAmount, pixelSize, triangleSize, chromaticOffset, fisheyeStrength,
    tileCount, grainIntensity, blurMotionAmount, blurMotionDirection, blurGaussianAmount, blurRadialAmount,
    posterizeLevels, halftoneSize, halftoneVariation, halftoneMove, halftoneMoveSpeed, vignetteStrength,
    colorShiftHue, bulgeStrength, charcoalIntensity, colorBurnIntensity, colorDodgeIntensity,
    digitalNoiseIntensity, duotoneIntensity, duotoneColor1, duotoneColor2, dustIntensity, dustCrackleIntensity,
    gridSize, hexGridSize, lightLeakIntensity, lensFlareIntensity, lensFlareX, lensFlareY, lensFlareSize,
    linesCount, linesAngle, linesThickness, liquifyStrength, mandalaSegments, pinchStrength,
    polarAngle, polarRadius, polarRotation, scanLineSize, sepiaIntensity, solarizeThreshold,
    triGridSize, gridSides, tritoneIntensity, tritoneColor1, tritoneColor2, tritoneColor3,
    vhsGlitchIntensity, gridRows, gridColumns, polygonSides, polygon2Sides, waveDistortionStrength,
    spiralTightness, spiralRotations, spiralThickness, spiralZoom, shapesSides, shapesCount,
    concentricRingWidth, concentricRingCount, waveAmplitude, waveFrequency, meshGridSize,
    noiseScale, noiseOctaves, plasmaSpeed, plasmaComplexity, radialBurstCount, radialBurstSpread,
    voronoiCellCount, voronoiDistortion, conicalSpiralTurns, conicalSpiralTightness, windmillBlades,
    windmillRotation, gridRotation, angleStartOffset, angleCenterX, angleCenterY,
    iridescentAngle, iridescentIntensity, iridescentScale,
  ]);
  
  // Submit rating for current result
  const submitRating = useCallback((rating: number) => {
    if (pendingRatingState) {
      const newRatedResult = { rating, data: pendingRatingState };
      const updatedRatings = [...ratedResults, newRatedResult];
      setRatedResults(updatedRatings);
      localStorage.setItem('gradientRatings', JSON.stringify(updatedRatings));
    }
    setShowRatingUI(false);
    setPendingRatingState(null);
  }, [pendingRatingState, ratedResults]);
  
  // Skip rating
  const skipRating = useCallback(() => {
    setShowRatingUI(false);
    setPendingRatingState(null);
  }, []);
  
  // Capture state when rating UI is shown
  useEffect(() => {
    if (showRatingUI && !pendingRatingState) {
      captureCurrentStateForRating();
    }
  }, [showRatingUI, pendingRatingState, captureCurrentStateForRating]);

  // Shuffle Effects - randomize only effects and their settings (1-15 effects)
  const shuffleEffects = useCallback(() => {
    // Pick 1-10 random effects with a mean of 5 using triangular distribution
    const numEffects = Math.min(10, Math.max(1, Math.round((Math.random() + Math.random()) * 5)));
    const selectedEffects: EffectType[] = [];
    
    for (let i = 0; i < numEffects; i++) {
      const randomEffect = ALL_EFFECTS[Math.floor(Math.random() * ALL_EFFECTS.length)];
      if (!selectedEffects.includes(randomEffect)) {
        selectedEffects.push(randomEffect);
      }
    }
    
    setActiveEffects(selectedEffects);
    
    // Randomize all FX slider variables
    setKaleidoscopeSegments(Math.floor(Math.random() * 20) + 3); // 3-22
    setTwistAmount(Math.random() * 5); // 0-5
    setPixelSize(Math.floor(Math.random() * 50) + 5); // 5-54
    setTriangleSize(Math.floor(Math.random() * 80) + 20); // 20-99
    setChromaticOffset(Math.floor(Math.random() * 20) + 1); // 1-20
    setFisheyeStrength(Math.random()); // 0-1
    setTileCount(Math.floor(Math.random() * 5) + 1); // 1-5
    setGrainIntensity(Math.random() * 0.5); // 0-0.5
    setBlurMotionAmount(Math.floor(Math.random() * 20) + 1); // 1-20
    setBlurMotionDirection(Math.floor(Math.random() * 360)); // 0-360
    setBlurGaussianAmount(Math.floor(Math.random() * 20) + 1); // 1-20
    setBlurRadialAmount(Math.floor(Math.random() * 20) + 1); // 1-20
    setPosterizeLevels(Math.floor(Math.random() * 14) + 2); // 2-15
    setHalftoneSize(Math.floor(Math.random() * 198) + 2); // 2-200
    setHalftoneVariation(Math.random()); // 0-1
    setHalftoneMove(Math.random() > 0.5); // random true/false
    setHalftoneMoveSpeed(Math.random() * 9 + 1); // 1-10
    setVignetteStrength(Math.random()); // 0-1
    setColorShiftHue(Math.floor(Math.random() * 360)); // 0-360
    setBulgeStrength(Math.random()); // 0-1
    setCharcoalIntensity(Math.random()); // 0-1
    setColorBurnIntensity(Math.random()); // 0-1
    setColorDodgeIntensity(Math.random()); // 0-1
    setDigitalNoiseIntensity(Math.random()); // 0-1
    setDuotoneIntensity(Math.random()); // 0-1
    setDustIntensity(Math.random()); // 0-1
    setDustCrackleIntensity(Math.random()); // 0-1
    setGridSize(Math.floor(Math.random() * 40) + 10); // 10-49
    setHexGridSize(Math.floor(Math.random() * 190) + 10); // 10-200
    setLightLeakIntensity(Math.random()); // 0-1
    setLensFlareIntensity(Math.random()); // 0-1
    setLensFlareX(Math.random()); // 0-1
    setLensFlareY(Math.random()); // 0-1
    setLensFlareSize(Math.floor(Math.random() * 400) + 100); // 100-499
    setLinesCount(Math.floor(Math.random() * 150) + 10); // 10-159
    setLinesAngle(Math.floor(Math.random() * 360)); // 0-360
    setLinesThickness(Math.floor(Math.random() * 49) + 1); // 1-50
    setLiquifyStrength(Math.floor(Math.random() * 80) + 10); // 10-89
    setMandalaSegments(Math.floor(Math.random() * 20) + 4); // 4-23
    setPinchStrength(Math.random()); // 0-1
    setPolarAngle(Math.floor(Math.random() * 360)); // 0-360
    setPolarRadius(Math.random() * 2 + 0.5); // 0.5-2.5
    setPolarRotation(Math.floor(Math.random() * 360)); // 0-360
    setScanLineSize(Math.floor(Math.random() * 15) + 2); // 2-16
    setSepiaIntensity(Math.random()); // 0-1
    setSolarizeThreshold(Math.floor(Math.random() * 255)); // 0-255
    setTriGridSize(Math.floor(Math.random() * 50) + 10); // 10-59
    setGridSides(Math.floor(Math.random() * 10) + 1); // 1-10 sides
    setTritoneIntensity(Math.random()); // 0-1
    setVhsGlitchIntensity(Math.random()); // 0-1
    setGridRows(Math.floor(Math.random() * 50) + 1); // 1-50
    setGridColumns(Math.floor(Math.random() * 50) + 1); // 1-50
    setPolygonSides(Math.floor(Math.random() * 10) + 1); // 1-10
    setPolygon2Sides(Math.floor(Math.random() * 10) + 1); // 1-10
    setWaveDistortionStrength(Math.floor(Math.random() * 80) + 10); // 10-89
    
    // Randomize tritone colors
    setTritoneColor1(randomHexColor());
    setTritoneColor2(randomHexColor());
    setTritoneColor3(randomHexColor());
  }, [ALL_EFFECTS, randomHexColor]);

  // Shuffle Audiovisuals - randomize audio reactivity multipliers
  const shuffleAudiovisuals = useCallback(() => {
    // Random values between 0 and 2 for each multiplier
    setBassMultiplier(Math.random() * 2);
    setMidsMultiplier(Math.random() * 2);
    setTrebleMultiplier(Math.random() * 2);
  }, []);

  // Helper function to add color stops to gradient with optional hue shift
  const addGradientStops = useCallback((gradient: CanvasGradient, colors: ColorRGB[]) => {
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
    const shouldApplyHueShift = isAudioEnabled && isAudioReactive && audioColorShift > 0;
    
    const applyHueShift = (color: ColorRGB): ColorRGB => {
      if (!shouldApplyHueShift) return color;
      
      // Convert RGB to HSL
      const r = color.r / 255;
      const g = color.g / 255;
      const b = color.b / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0;
      const l = (max + min) / 2;
      const d = max - min;
      const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
      
      if (d !== 0) {
        if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        else if (max === g) h = ((b - r) / d + 2) / 6;
        else h = ((r - g) / d + 4) / 6;
      }
      
      // Apply hue shift (in 0-1 range)
      h = (h + audioColorShift / 360) % 1;
      
      // Convert back to RGB
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      let newR, newG, newB;
      if (s === 0) {
        newR = newG = newB = l;
      } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        newR = hue2rgb(p, q, h + 1/3);
        newG = hue2rgb(p, q, h);
        newB = hue2rgb(p, q, h - 1/3);
      }
      
      return {
        r: Math.round(newR * 255),
        g: Math.round(newG * 255),
        b: Math.round(newB * 255)
      };
    };
    
    if (count === 1) {
      const shifted = applyHueShift(validColors[0]);
      gradient.addColorStop(0, `rgb(${shifted.r},${shifted.g},${shifted.b})`);
      return;
    }
    
    const step = 1 / (count - 1);
    for (let i = 0; i < count; i++) {
      const shifted = applyHueShift(validColors[i]);
      gradient.addColorStop(i * step, `rgb(${shifted.r},${shifted.g},${shifted.b})`);
    }
  }, [isAudioEnabled, isAudioReactive, audioColorShift]);

  // Helper function to adjust color array to target length
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

  // Generate colors from AI prompt
  const generateAIColors = (prompt: string) => {
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
  };

  const handleAIPromptSubmit = () => {
    if (!aiPrompt.trim()) return;
    
    const newColors = generateAIColors(aiPrompt);
    setTargetColors(newColors);
    setBaseAIColors(newColors); // Store as base colors to anchor future changes
    setSubmittedAIPrompt(aiPrompt); // Save the submitted prompt
    setIsAIColorPickerOpen(false); // Close dropdown instead of modal
    setAIPrompt('');
  };

  // Auto mode - automatically change colors
  useEffect(() => {
    if (!isAutoMode) return;
    setIsVCRRecording(false);
    setIsVCRPlaying(false);

    const interval = setInterval(() => {
      // Helper function to keep colors tethered to base AI colors
      const applyColorShift = (color: ColorRGB, baseColor: ColorRGB | null, shiftRange: number) => {
        if (baseColor) {
          // If we have base AI colors, keep colors anchored to them
          const maxDrift = 30; // Maximum allowed drift from base color
          
          // Calculate small random shift
          const rShift = (Math.random() - 0.5) * shiftRange;
          const gShift = (Math.random() - 0.5) * shiftRange;
          const bShift = (Math.random() - 0.5) * shiftRange;
          
          // Apply shift but then pull back toward base color
          let newR = color.r + rShift;
          let newG = color.g + gShift;
          let newB = color.b + bShift;
          
          // Clamp to stay within maxDrift of base color
          newR = Math.max(baseColor.r - maxDrift, Math.min(baseColor.r + maxDrift, newR));
          newG = Math.max(baseColor.g - maxDrift, Math.min(baseColor.g + maxDrift, newG));
          newB = Math.max(baseColor.b - maxDrift, Math.min(baseColor.b + maxDrift, newB));
          
          return {
            r: Math.max(0, Math.min(255, newR)),
            g: Math.max(0, Math.min(255, newG)),
            b: Math.max(0, Math.min(255, newB)),
          };
        } else {
          // No base colors, use original behavior
          const rShift = (Math.random() - 0.5) * shiftRange;
          const gShift = (Math.random() - 0.5) * shiftRange;
          const bShift = (Math.random() - 0.5) * shiftRange;
          
          return {
            r: Math.max(0, Math.min(255, color.r + rShift)),
            g: Math.max(0, Math.min(255, color.g + gShift)),
            b: Math.max(0, Math.min(255, color.b + bShift)),
          };
        }
      };
      
      // Different behavior for different gradient types
      if (gradientType === 'fade') {
        setTargetColors(prev => 
          prev.map((color, index) => 
            applyColorShift(color, baseAIColors?.[index] || null, 30)
          )
        );
      } else if (gradientType === 'stripes' || gradientType === 'waves') {
        // Stripes and waves use subtle shifts for smooth scrolling
        setTargetColors(prev => 
          prev.map((color, index) => 
            applyColorShift(color, baseAIColors?.[index] || null, 12)
          )
        );
      } else {
        // All other gradient types
        const numColorsToChange = Math.floor(Math.random() * 2) + 2;
        const indicesToChange = new Set<number>();
        
        while (indicesToChange.size < numColorsToChange) {
          indicesToChange.add(Math.floor(Math.random() * gradientColors.length));
        }
        
        setTargetColors(prev => 
          prev.map((color, index) => {
            const shiftRange = indicesToChange.has(index) ? 40 : 16;
            return applyColorShift(color, baseAIColors?.[index] || null, shiftRange);
          })
        );
      }
      
      // Rotation speeds based on gradient type
      let rotationAmount;
      if (gradientType === 'fade') {
        rotationAmount = rotationDirection === 'clockwise' ? 0.8 : -0.8;
      } else if (gradientType === 'stripes' || gradientType === 'waves') {
        // Stripes and waves move vertically instead of rotating
        rotationAmount = rotationDirection === 'clockwise' ? 0.4 : -0.4;
      } else {
        rotationAmount = rotationDirection === 'clockwise' ? 1.5 : -1.5;
      }
      // Apply VCR speed control to rotation
      setTargetAngle(prev => prev + (rotationAmount * vcrPlaybackSpeed));
    }, 100);

    return () => clearInterval(interval);
  }, [isAutoMode, gradientColors.length, gradientType, rotationDirection, baseAIColors, vcrPlaybackSpeed]);

  // VCR Recording
  useEffect(() => {
    if (!isVCRRecording) return;

    // Start recording timestamp
    if (vcrRecordedFrames.length === 0) {
      vcrRecordingStartTime.current = Date.now();
    }

    const interval = setInterval(() => {
      const frame: RecordingFrame = {
        colors: [...gradientColors],
        angle: gradientAngle,
        zoom: zoom,
        timestamp: Date.now() - vcrRecordingStartTime.current
      };
      setVcrRecordedFrames(prev => [...prev, frame]);
    }, 50); // Record at 20fps

    return () => clearInterval(interval);
  }, [isVCRRecording, gradientColors, gradientAngle, zoom]);

  // VCR Playback
  useEffect(() => {
    if (!isVCRPlaying || vcrRecordedFrames.length === 0) return;

    vcrPlaybackStartTime.current = Date.now();
    
    const playbackInterval = setInterval(() => {
      const elapsed = (Date.now() - vcrPlaybackStartTime.current) * vcrPlaybackSpeed;
      
      // Find the frame to display based on elapsed time
      let frameIndex = vcrRecordedFrames.findIndex((frame, i) => {
        const nextFrame = vcrRecordedFrames[i + 1];
        return frame.timestamp <= elapsed && (!nextFrame || nextFrame.timestamp > elapsed);
      });

      if (frameIndex === -1) {
        // Playback complete - we've gone past the last frame
        if (vcrLoop && vcrRecordedFrames.length > 0) {
          // Seamlessly loop back to the beginning
          vcrPlaybackStartTime.current = Date.now();
          frameIndex = 0;
        } else {
          setIsVCRPlaying(false);
          setVcrPlaybackIndex(0);
          return;
        }
      }

      setVcrPlaybackIndex(frameIndex);
      const frame = vcrRecordedFrames[frameIndex];
      if (frame) {
        setTargetColors(frame.colors);
        setTargetAngle(frame.angle);
        setTargetZoom(frame.zoom);
      }
    }, 50);

    return () => clearInterval(playbackInterval);
  }, [isVCRPlaying, vcrRecordedFrames, vcrPlaybackSpeed, vcrLoop]);

  // Draw gradient on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Set canvas internal resolution (with multiplier for higher quality)
    // Canvas will render at higher resolution but display at window size via CSS
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;
    canvas.width = displayWidth * resolutionMultiplier;
    canvas.height = displayHeight * resolutionMultiplier;

    // Set CSS display size to match window (this keeps visual size consistent)
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    // Scale context for high-resolution rendering
    ctx.scale(resolutionMultiplier, resolutionMultiplier);

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
    
    // Apply audio reactivity to gradient angle if enabled
    const audioAdjustedAngle = (isAudioEnabled && isAudioReactive) 
      ? gradientAngle + (audioGradientParam * 360) // Bass affects angle by up to 360 degrees
      : gradientAngle;
    
    const angleRad = audioAdjustedAngle * DEG_TO_RAD;
    const cosAngle = Math.cos(angleRad);
    const sinAngle = Math.sin(angleRad);

    // Fill canvas with black background before drawing
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    // Apply audio-reactive transformations when audio is enabled
    if (isAudioEnabled && isAudioReactive) {
      ctx.save();
      // Audio transformations will be applied to specific gradient/effect parameters
      // rather than global canvas transformations
    }

    let gradient: CanvasGradient | undefined;

    switch (gradientType) {
      case 'linear':
        // Invert zoom so zooming out expands the gradient (divide by zoom)
        const linearScale = 1 / zoom;
        const halfWidth = displayWidth / 2 * linearScale;
        const halfHeight = displayHeight / 2 * linearScale;
        gradient = ctx.createLinearGradient(
          centerX + cosAngle * halfWidth,
          centerY + sinAngle * halfHeight,
          centerX - cosAngle * halfWidth,
          centerY - sinAngle * halfHeight
        );
        break;

      case 'radial':
        // Invert zoom for radial gradient - show entire circle on load
        // Add damping to make radial animate more slowly
        const radialDampening = 0.2; // Reduce zoom impact for slower, more subtle animation
        const dampenedRadialZoom = 1 + (zoom - 1) * radialDampening;
        // Audio reactivity: bass affects radius pulsing
        const audioRadiusScale = (isAudioEnabled && isAudioReactive) 
          ? 1 + (audioGradientParam * 0.5) // Up to 50% larger radius
          : 1;
        const radialScale = (1 / dampenedRadialZoom) * audioRadiusScale;
        const radialCenterX = (displayWidth * angleCenterX) / 100;
        const radialCenterY = (displayHeight * angleCenterY) / 100;
        const radialRadius = Math.max(0, Math.min(displayWidth, displayHeight) / 2 * radialScale);
        gradient = ctx.createRadialGradient(radialCenterX, radialCenterY, 0, radialCenterX, radialCenterY, radialRadius);
        break;

      case 'angle':
        // Save context and apply zoom transformation
        ctx.save();
        const conicCenterX = (displayWidth * angleCenterX) / 100;
        const conicCenterY = (displayHeight * angleCenterY) / 100;
        ctx.translate(conicCenterX, conicCenterY);
        ctx.scale(zoom, zoom);
        ctx.translate(-conicCenterX, -conicCenterY);
        const conicStartAngle = angleRad + (angleStartOffset * Math.PI) / 180;
        gradient = ctx.createConicGradient(conicStartAngle, conicCenterX, conicCenterY);
        break;



      case 'polygon':
        // Create a polygon pattern - centered and sized to fit window on load
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        
        const polygonScale = 1 / zoom;
        const polygonRadius = fitRadius; // Use fitRadius to ensure shape fits
        const sides = Math.max(1, polygonSides); // Ensure at least 1 side
        const anglePerSide = 360 / sides;
        const sectorHalf = Math.PI / sides;
        
        const drawPolygon = () => {
          for (let i = 0; i < sides; i++) {
            const angle = (i * anglePerSide + gradientAngle) * DEG_TO_RAD;
            const gradient = ctx.createLinearGradient(
              centerX,
              centerY,
              centerX + Math.cos(angle) * polygonRadius * polygonScale,
              centerY + Math.sin(angle) * polygonRadius * polygonScale
            );
            
            addGradientStops(gradient, gradientColors);
            
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            // Extend the arc to overlap slightly and prevent gaps
            const angleStart = angle - sectorHalf - 0.01;
            const angleEnd = angle + sectorHalf + 0.01;
            ctx.arc(centerX, centerY, maxRadius, angleStart, angleEnd);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.restore();
          }
        };
        
        drawPolygon();
        break;

      case 'polygon-solid':
        // Create a polygon pattern with solid colors and concentric rings - centered and sized to fit window on load
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, displayWidth, displayHeight);

        const polygonSolidScale = 1 / zoom;
        const polygonSolidRadius = fitRadius; // Use fitRadius to ensure shape fits

        // Audio reactivity: bass affects radial count, mid affects ring count, treble affects rotation
        const audioRadialBoost = (isAudioEnabled && isAudioReactive)
          ? Math.floor(audioGradientParam * 12) // Bass adds up to 12 radials
          : 0;
        const audioRingBoost = (isAudioEnabled && isAudioReactive)
          ? Math.floor(audioEffectParam * 10) // Mid adds up to 10 rings
          : 0;
        const audioRotation = (isAudioEnabled && isAudioReactive)
          ? audioColorShift * 180 // Treble rotates up to 180 degrees
          : 0;

        const solidSides = Math.max(1, polygon2Sides + audioRadialBoost); // Use polygon2Sides for this gradient type
        const solidAnglePerSide = 360 / solidSides;
        const solidSectorHalf = Math.PI / solidSides;
        const polygonRingCount = concentricRingCount + audioRingBoost;
        
        const drawPolygonSolid = () => {
          // Draw from outside in for proper layering
          for (let ring = polygonRingCount; ring >= 0; ring--) {
            const ringRadius = maxRadius * (ring / polygonRingCount);

            for (let i = 0; i < solidSides; i++) {
              const angle = (i * solidAnglePerSide + gradientAngle + audioRotation) * DEG_TO_RAD;
              
              // Color based on ring and side
              const colorIndex = (i + ring) % gradientColors.length;
              const color = gradientColors[colorIndex];
              
              // Safety check
              if (!color) continue;
              
              ctx.save();
              ctx.beginPath();
              ctx.moveTo(centerX, centerY);
              // Extend the arc to overlap slightly and prevent gaps
              const angleStart = angle - solidSectorHalf - 0.01;
              const angleEnd = angle + solidSectorHalf + 0.01;
              ctx.arc(centerX, centerY, ringRadius, angleStart, angleEnd);
              ctx.closePath();
              ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
              ctx.fill();
              ctx.restore();
            }
          }
        };
        
        drawPolygonSolid();
        break;

      case 'star':
        // Create a five-pointed star pattern
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        
        const starScale = 1 / zoom;
        const starRadius = fitRadius; // Use fitRadius to ensure shape fits
        
        const drawStar = () => {
          const points = 5;
          for (let i = 0; i < points; i++) {
            const angle = (i * 72 + gradientAngle) * DEG_TO_RAD;
            const gradient = ctx.createLinearGradient(
              centerX,
              centerY,
              centerX + Math.cos(angle) * starRadius * starScale,
              centerY + Math.sin(angle) * starRadius * starScale
            );
            
            addGradientStops(gradient, gradientColors);
            
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            // Extend the arc to overlap slightly and prevent gaps
            const angleStart = angle - Math.PI / 5 - 0.01;
            const angleEnd = angle + Math.PI / 5 + 0.01;
            ctx.arc(centerX, centerY, maxRadius, angleStart, angleEnd);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.restore();
          }
        };
        
        drawStar();
        break;



      case 'spiral':
        // Create a spiral gradient
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        
        // Dampen zoom effect for smoother, less dramatic changes
        const zoomDampening = 0.3; // Reduce zoom impact to 30% of original
        const dampenedZoom = 1 + (zoom - 1) * zoomDampening;
        const spiralScale = 1 / dampenedZoom;
        // Audio reactivity: bass affects spiral tightness
        const audioSpiralTightness = (isAudioEnabled && isAudioReactive) 
          ? audioGradientParam * 5 // Up to 5x tighter
          : 0;
        const spiralSegments = 60 * (spiralTightness + audioSpiralTightness) / 5; // More segments for tighter spirals
        const effectiveSpiralRotations = spiralRotations * spiralScale; // Number of rotations scales with dampened zoom
        
        for (let i = 0; i < spiralSegments; i++) {
          const t = i / spiralSegments;
          const angle = (t * 360 * effectiveSpiralRotations + gradientAngle) * DEG_TO_RAD;
          const radius = t * maxRadius * spiralScale * spiralZoom;
          
          const colorIndex = Math.floor(t * (gradientColors.length - 1));
          const nextColorIndex = Math.min(colorIndex + 1, gradientColors.length - 1);
          const localT = (t * (gradientColors.length - 1)) - colorIndex;
          
          const color = gradientColors[colorIndex];
          const nextColor = gradientColors[nextColorIndex];
          
          // Safety check
          if (!color || !nextColor) continue;
          
          const r = color.r + (nextColor.r - color.r) * localT;
          const g = color.g + (nextColor.g - color.g) * localT;
          const b = color.b + (nextColor.b - color.b) * localT;
          
          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.rotate(angle);
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fillRect(-maxRadius, -spiralThickness / 2, maxRadius * 2, spiralThickness);
          ctx.restore();
        }
        break;

      case 'starburst':
        // Create a starburst/sunburst gradient - centered and sized to fit window on load
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        
        const starburstScale = 1 / zoom;
        const starburstRadius = fitRadius; // Use fitRadius to ensure shape fits
        const rays = 12;
        
        for (let i = 0; i < rays; i++) {
          const angle = (i * (360 / rays) + gradientAngle) * DEG_TO_RAD;
          const gradient = ctx.createLinearGradient(
            centerX,
            centerY,
            centerX + Math.cos(angle) * starburstRadius * starburstScale,
            centerY + Math.sin(angle) * starburstRadius * starburstScale
          );
          
          gradientColors.forEach((color, index) => {
            const stop = gradientColors.length > 1 
              ? index / (gradientColors.length - 1)
              : 0;
            if (isFinite(stop)) {
              gradient.addColorStop(stop, `rgb(${color.r}, ${color.g}, ${color.b})`);
            }
          });
          
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          // Extend the arc to overlap slightly and prevent gaps
          const angleStart = angle - Math.PI / rays - 0.01;
          const angleEnd = angle + Math.PI / rays + 0.01;
          ctx.arc(centerX, centerY, maxRadius, angleStart, angleEnd);
          ctx.closePath();
          ctx.fillStyle = gradient;
          ctx.fill();
          ctx.restore();
        }
        break;

      case 'waves':
        // Create horizontal wave pattern with infinite width coverage
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, displayWidth, displayHeight);

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((waveRotation * Math.PI) / 180);
        ctx.scale(zoom, zoom);
        ctx.translate(-centerX, -centerY);
        
        const waveScaleForWave = 1 / zoom;
        const waveWidth = (displayWidth / waveNumber) * waveScaleForWave;
        // Audio reactivity: bass affects wave amplitude
        const audioWaveAmplitude = (isAudioEnabled && isAudioReactive) 
          ? audioGradientParam * 100 // Up to 100 extra amplitude
          : 0;
        const amplitude = (waveAmplitude + audioWaveAmplitude) * waveScaleForWave;
        const frequency = waveFrequency * 0.0033;
        
        // Calculate visible area in transformed space to ensure full coverage
        const visibleWidth = (displayWidth * 3) / zoom; // Triple width for safety
        const numWavesForWave = Math.ceil(visibleWidth / waveWidth) + 20; // Extra waves for infinite appearance
        const startOffset = Math.floor(numWavesForWave / 2);
        
        for (let i = -startOffset; i < numWavesForWave - startOffset; i++) {
          const baseX = i * waveWidth;
          const colorIndex = ((i % gradientColors.length) + gradientColors.length) % gradientColors.length;
          const color = gradientColors[colorIndex];
          const nextColor = gradientColors[(colorIndex + 1) % gradientColors.length];
          
          // Safety check
          if (!color || !nextColor) continue;
          
          const gradient = ctx.createLinearGradient(baseX, 0, baseX + waveWidth, 0);
          gradient.addColorStop(0, `rgb(${color.r}, ${color.g}, ${color.b})`);
          gradient.addColorStop(1, `rgb(${nextColor.r}, ${nextColor.g}, ${nextColor.b})`);
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          
          // Start from top left of wave - extend far beyond canvas
          ctx.moveTo(baseX, -displayHeight * 3);
          
          // Draw the left wavy edge
          for (let y = -displayHeight * 3; y <= displayHeight * 3; y += 5) {
            const waveX = baseX + Math.sin(y * frequency) * amplitude;
            ctx.lineTo(waveX, y);
          }
          
          // Draw bottom edge
          ctx.lineTo(baseX + waveWidth + amplitude, displayHeight * 3);
          
          // Draw the right wavy edge
          for (let y = displayHeight * 3; y >= -displayHeight * 3; y -= 5) {
            const waveX = baseX + waveWidth + Math.sin(y * frequency) * amplitude;
            ctx.lineTo(waveX, y);
          }
          
          // Close path back to start
          ctx.lineTo(baseX - amplitude, -displayHeight * 3);
          ctx.closePath();
          ctx.fill();
        }
        
        ctx.restore();
        break;

      case 'shapes':
        // Create concentric polygons with variable sides
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        
        const shapesScale = 1 / zoom;
        // Audio reactivity: bass affects ring width
        const audioShapeRingWidth = (isAudioEnabled && isAudioReactive) 
          ? audioGradientParam * 100 // Up to 100 extra width
          : 0;
        const shapeRingWidth = (concentricRingWidth + audioShapeRingWidth) * shapesScale;
        const numShapeRings = Math.min(shapesCount, Math.ceil(maxRadius / shapeRingWidth) + 2);
        
        for (let i = numShapeRings - 1; i >= 0; i--) {
          const radius = i * shapeRingWidth;
          if (radius <= 0) continue;
          
          // Static color assignment based on ring index
          const colorIndex = i % gradientColors.length;
          const color = gradientColors[colorIndex];
          
          // Safety check
          if (!color) continue;
          
          // Draw solid color polygon
          ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
          ctx.beginPath();
          
          if (shapesSides === 1) {
            // Dot (circle)
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          } else if (shapesSides === 2) {
            // Line (vertical line with thickness = radius)
            ctx.rect(centerX - radius, centerY - displayHeight * 2, radius * 2, displayHeight * 4);
          } else {
            // Polygon (3+ sides)
            const angleStep = (Math.PI * 2) / shapesSides;
            const rotationRadians = (shapesRotation * Math.PI) / 180;
            const startAngle = -Math.PI / 2 + rotationRadians; // Start from top + rotation

            for (let j = 0; j <= shapesSides; j++) {
              const angle = startAngle + angleStep * j;
              const x = centerX + Math.cos(angle) * radius;
              const y = centerY + Math.sin(angle) * radius;
              
              if (j === 0) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }
            }
            ctx.closePath();
          }
          
          ctx.fill();
        }
        break;

      case 'fade':
        // Simple solid color that progressively fades through gradient colors
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        
        // Use continuous gradientAngle without modulo to avoid jumps
        const totalColors = gradientColors.length;
        const normalizedAngle = gradientAngle / 360; // Slowed down even more (1 full color cycle per 360*6 degrees = 2160 degrees)
        const exactPosition = normalizedAngle % totalColors;
        const currentColorIndex = Math.floor(exactPosition);
        const nextColorIndex = (currentColorIndex + 1) % totalColors;
        const blendAmount = exactPosition - currentColorIndex;
        
        // Get current and next colors
        const currentColor = gradientColors[currentColorIndex];
        const nextColor = gradientColors[nextColorIndex];
        
        // Safety check
        if (!currentColor || !nextColor) {
          break;
        }
        
        // Interpolate between the two colors smoothly
        const r = currentColor.r + (nextColor.r - currentColor.r) * blendAmount;
        const g = currentColor.g + (nextColor.g - currentColor.g) * blendAmount;
        const b = currentColor.b + (nextColor.b - currentColor.b) * blendAmount;
        
        // Fill entire canvas with the interpolated color
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        break;
      
      case 'mesh':
        // Multi-point gradient mesh - centered and sized to fit window on load
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        const meshPoints = meshGridSize;
        const meshScale = 1 / zoom;
        // Audio reactivity: bass affects mesh point spread
        const audioMeshScale = (isAudioEnabled && isAudioReactive) 
          ? 1 + (audioGradientParam * 0.5) // Up to 50% larger spread
          : 1;
        for (let i = 0; i < meshPoints; i++) {
          const meshAngle = (i * 360 / meshPoints + gradientAngle) * DEG_TO_RAD;
          const meshX = centerX + Math.cos(meshAngle) * fitRadius * 0.6 * meshScale * audioMeshScale;
          const meshY = centerY + Math.sin(meshAngle) * fitRadius * 0.6 * meshScale * audioMeshScale;
          const meshRadius = Math.max(0, fitRadius * 0.8 * meshScale * audioMeshScale);
          const meshGrad = ctx.createRadialGradient(meshX, meshY, 0, meshX, meshY, meshRadius);
          const colorIndex = i % gradientColors.length;
          const meshColor = gradientColors[colorIndex];
          if (!meshColor) continue;
          meshGrad.addColorStop(0, `rgb(${meshColor.r}, ${meshColor.g}, ${meshColor.b})`);
          meshGrad.addColorStop(0.6, `rgba(${meshColor.r}, ${meshColor.g}, ${meshColor.b}, 0.5)`);
          meshGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = meshGrad;
          ctx.fillRect(0, 0, displayWidth, displayHeight);
        }
        ctx.globalCompositeOperation = 'source-over';
        break;
      
      case 'noise':
        // Perlin-style noise gradient
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        const noiseImageData = ctx.createImageData(displayWidth, displayHeight);
        const noiseData = noiseImageData.data;

        const audioActive = isAudioEnabled && isAudioReactive;
        // Bass: scale pulse
        const audioNoiseScale = audioActive ? audioGradientParam * 0.005 : 0;
        const baseNoiseScale = ((noiseScale + audioNoiseScale * 1000) * 0.001) / zoom;
        // Bass: rotation angle
        const noiseAudioRotation = audioActive ? audioGradientParam * Math.PI * 0.5 : 0;
        const noiseRotCos = Math.cos(noiseDirection * 0.01 + noiseAudioRotation);
        const noiseRotSin = Math.sin(noiseDirection * 0.01 + noiseAudioRotation);
        // Mids: flowing warp offset
        const noiseWarpX = audioActive ? audioEffectParam * 300 : 0;
        const noiseWarpY = audioActive ? audioEffectParam * 200 : 0;

        const noiseCX = displayWidth / 2;
        const noiseCY = displayHeight / 2;
        for (let ny = 0; ny < displayHeight; ny++) {
          for (let nx = 0; nx < displayWidth; nx++) {
            const ndx = nx - noiseCX;
            const ndy = ny - noiseCY;
            // Rotate coordinate space around center
            const rx = ndx * noiseRotCos - ndy * noiseRotSin + noiseWarpX;
            const ry = ndx * noiseRotSin + ndy * noiseRotCos + noiseWarpY;
            // Multi-octave noise based on noiseOctaves setting
            let combinedNoise = 0;
            let amplitude = 1;
            let totalAmplitude = 0;

            for (let octave = 0; octave < noiseOctaves; octave++) {
              const frequency = Math.pow(2, octave);
              const scale = baseNoiseScale * frequency;
              const noise = Math.sin(rx * scale + noiseDirection * 0.1 * frequency) *
                           Math.cos(ry * scale + noiseDirection * 0.1 * frequency);
              combinedNoise += noise * amplitude;
              totalAmplitude += amplitude;
              amplitude *= 0.5;
            }

            combinedNoise = (combinedNoise / totalAmplitude + 1) / 2; // Normalize to 0-1
            
            // Interpolate between colors
            const colorPos = combinedNoise * (gradientColors.length - 1);
            const colorIdx = Math.floor(colorPos);
            const colorFrac = colorPos - colorIdx;
            const color1 = gradientColors[colorIdx % gradientColors.length];
            const color2 = gradientColors[(colorIdx + 1) % gradientColors.length];
            
            if (!color1 || !color2) continue;
            
            const idx = (ny * displayWidth + nx) * 4;
            noiseData[idx] = Math.round(color1.r + (color2.r - color1.r) * colorFrac);
            noiseData[idx + 1] = Math.round(color1.g + (color2.g - color1.g) * colorFrac);
            noiseData[idx + 2] = Math.round(color1.b + (color2.b - color1.b) * colorFrac);
            noiseData[idx + 3] = 255;
          }
        }
        ctx.putImageData(noiseImageData, 0, 0);
        break;
      
      case 'plasma':
        // Animated plasma effect - smooth rendering
        const plasmaImageData = ctx.createImageData(displayWidth, displayHeight);
        const plasmaData = plasmaImageData.data;

        // Audio reactivity: bass affects plasma complexity
        const audioPlasmaComplexity = (isAudioEnabled && isAudioReactive)
          ? audioGradientParam * 50 // Up to 50 extra complexity
          : 0;
        const plasmaScale = ((plasmaComplexity + audioPlasmaComplexity) * 0.004) / zoom;

        const plasmaCX = displayWidth / 2;
        const plasmaCY = displayHeight / 2;
        for (let py = 0; py < displayHeight; py++) {
          for (let px = 0; px < displayWidth; px++) {
            const dx = px - plasmaCX;
            const dy = py - plasmaCY;
            const value = (
              Math.sin(px * plasmaScale + gradientAngle * 0.05) +
              Math.sin(py * plasmaScale + gradientAngle * 0.05) +
              Math.sin((px + py) * plasmaScale * 0.75) +
              Math.sin(Math.sqrt(dx * dx + dy * dy) * plasmaScale + gradientAngle * 0.05)
            ) / 4 + 0.5;
            
            // Interpolate between colors
            const colorPos = value * (gradientColors.length - 1);
            const colorIdx = Math.floor(colorPos);
            const colorFrac = colorPos - colorIdx;
            const color1 = gradientColors[colorIdx % gradientColors.length];
            const color2 = gradientColors[(colorIdx + 1) % gradientColors.length];
            
            if (!color1 || !color2) continue;
            
            const r = Math.round(color1.r + (color2.r - color1.r) * colorFrac);
            const g = Math.round(color1.g + (color2.g - color1.g) * colorFrac);
            const b = Math.round(color1.b + (color2.b - color1.b) * colorFrac);
            
            const idx = (py * displayWidth + px) * 4;
            plasmaData[idx] = r;
            plasmaData[idx + 1] = g;
            plasmaData[idx + 2] = b;
            plasmaData[idx + 3] = 255;
          }
        }
        ctx.putImageData(plasmaImageData, 0, 0);
        break;
      
      case 'grid':
        // Grid pattern with customizable rows and columns
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        
        // Audio reactivity: bass affects gradient animation in cells
        const audioGridOffset = (isAudioEnabled && isAudioReactive) 
          ? audioGradientParam * 360 // Up to 360 degree offset
          : 0;
        
        const cellWidth = displayWidth / gridColumns;
        const cellHeight = displayHeight / gridRows;
        for (let row = 0; row < gridRows; row++) {
          for (let col = 0; col < gridColumns; col++) {
            // Calculate the angle for this cell's gradient
            const cellAngle = (gradientAngle + row * 30 + col * 30 + audioGridOffset) % 360;
            const angleRad = (cellAngle * Math.PI) / 180;
            
            // Calculate gradient direction based on angle
            const cellCenterX = col * cellWidth + cellWidth / 2;
            const cellCenterY = row * cellHeight + cellHeight / 2;
            const gradLength = Math.max(cellWidth, cellHeight);
            
            const x1 = cellCenterX - Math.cos(angleRad) * gradLength / 2;
            const y1 = cellCenterY - Math.sin(angleRad) * gradLength / 2;
            const x2 = cellCenterX + Math.cos(angleRad) * gradLength / 2;
            const y2 = cellCenterY + Math.sin(angleRad) * gradLength / 2;
            
            const cellGrad = ctx.createLinearGradient(x1, y1, x2, y2);
            
            for (let j = 0; j < gradientColors.length; j++) {
              const cellColor = gradientColors[(j + row + col) % gradientColors.length];
              if (!cellColor) continue;
              cellGrad.addColorStop(j / (gradientColors.length - 1), 
                `rgb(${cellColor.r}, ${cellColor.g}, ${cellColor.b})`);
            }
            ctx.fillStyle = cellGrad;
            ctx.fillRect(col * cellWidth, row * cellHeight, Math.ceil(cellWidth) + 1, Math.ceil(cellHeight) + 1);
          }
        }
        break;
      
      case 'checkerboard':
        // Checkerboard pattern with exact squares
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        const checkSize = Math.max(10, Math.round(100 / zoom)); // Ensure integer size
        const checksX = Math.ceil(displayWidth / checkSize);
        const checksY = Math.ceil(displayHeight / checkSize);
        
        for (let row = 0; row < checksY; row++) {
          for (let col = 0; col < checksX; col++) {
            const checkIdx = (col + row) % gradientColors.length;
            const checkColor = gradientColors[checkIdx];
            if (!checkColor) continue;
            ctx.fillStyle = `rgb(${checkColor.r}, ${checkColor.g}, ${checkColor.b})`;
            // Draw exact squares
            ctx.fillRect(col * checkSize, row * checkSize, checkSize, checkSize);
          }
        }
        break;
      

      case 'conical-spiral':
        // Conical gradient with spiral
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        const spiralImageData = ctx.createImageData(displayWidth, displayHeight);
        const spiralData = spiralImageData.data;
        
        // Audio reactivity: bass affects spiral tightness
        const audioConicalTightness = (isAudioEnabled && isAudioReactive) 
          ? audioGradientParam * 10 // Up to 10x tighter
          : 0;
        
        for (let sy = 0; sy < displayHeight; sy++) {
          for (let sx = 0; sx < displayWidth; sx++) {
            const dx = sx - centerX;
            const dy = sy - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const spiralAngle = Math.atan2(dy, dx);
            const finalAngle = (spiralAngle + (dist * (conicalSpiralTightness + audioConicalTightness) * 0.01) * conicalSpiralTurns / zoom + gradientAngle * DEG_TO_RAD) % TWO_PI;
            const normalizedAngle = (finalAngle + Math.PI) / (Math.PI * 2); // 0 to 1
            
            // Interpolate between colors
            const colorPos = normalizedAngle * (gradientColors.length - 1);
            const colorIdx = Math.floor(colorPos);
            const colorFrac = colorPos - colorIdx;
            const color1 = gradientColors[colorIdx % gradientColors.length];
            const color2 = gradientColors[(colorIdx + 1) % gradientColors.length];
            
            if (!color1 || !color2) continue;
            
            const pixelIndex = (sy * displayWidth + sx) * 4;
            spiralData[pixelIndex] = Math.round(color1.r + (color2.r - color1.r) * colorFrac);
            spiralData[pixelIndex + 1] = Math.round(color1.g + (color2.g - color1.g) * colorFrac);
            spiralData[pixelIndex + 2] = Math.round(color1.b + (color2.b - color1.b) * colorFrac);
            spiralData[pixelIndex + 3] = 255;
          }
        }
        ctx.putImageData(spiralImageData, 0, 0);
        break;
      
      case 'radial-burst':
        // Multiple radial gradients - centered and sized to fit window on load
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        const burstCount = radialBurstCount;
        const burstScale = 1 / zoom;
        const burstRadius = fitRadius * 0.7;
        // Audio reactivity: bass affects burst spread
        const audioBurstSpread = (isAudioEnabled && isAudioReactive) 
          ? audioGradientParam * 100 // Up to 100 extra spread
          : 0;
        const spreadFactor = (radialBurstSpread + audioBurstSpread) * 0.01;
        
        for (let i = 0; i < burstCount; i++) {
          const burstAngle = (i * 360 / burstCount + gradientAngle) * DEG_TO_RAD;
          const offsetDist = fitRadius * spreadFactor * burstScale;
          const burstX = centerX + Math.cos(burstAngle) * offsetDist;
          const burstY = centerY + Math.sin(burstAngle) * offsetDist;
          const burstRadiusValue = Math.max(0, burstRadius * burstScale);
          const burstGrad = ctx.createRadialGradient(burstX, burstY, 0, burstX, burstY, burstRadiusValue);
          const burstColor = gradientColors[i % gradientColors.length];
          if (!burstColor) continue;
          burstGrad.addColorStop(0, `rgb(${burstColor.r}, ${burstColor.g}, ${burstColor.b})`);
          burstGrad.addColorStop(0.5, `rgba(${burstColor.r}, ${burstColor.g}, ${burstColor.b}, 0.6)`);
          burstGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = burstGrad;
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillRect(0, 0, displayWidth, displayHeight);
        }
        ctx.globalCompositeOperation = 'source-over';
        break;

      case 'freeform':
        // Freeform gradient with color pins
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        
        // Audio reactivity: bass affects pin radius
        const audioFreeformRadius = (isAudioEnabled && isAudioReactive) 
          ? audioGradientParam * 200 // Up to 200 extra radius
          : 0;
        
        // Create a pixel-based blend using distance to each pin
        const imageData = ctx.createImageData(displayWidth, displayHeight);
        const data = imageData.data;
        
        for (let y = 0; y < displayHeight; y++) {
          for (let x = 0; x < displayWidth; x++) {
            let totalWeight = 0;
            let r = 0, g = 0, b = 0;
            
            // Calculate influence from each pin
            colorPins.forEach(pin => {
              const pinX = pin.x * displayWidth;
              const pinY = pin.y * displayHeight;
              const dx = x - pinX;
              const dy = y - pinY;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              // Use inverse distance squared for smooth falloff, with audio reactivity
              const effectiveRadius = pin.radius + audioFreeformRadius;
              const influence = effectiveRadius / (distance + 1);
              const weight = Math.pow(influence, 2);
              
              r += pin.color.r * weight;
              g += pin.color.g * weight;
              b += pin.color.b * weight;
              totalWeight += weight;
            });
            
            // Normalize colors
            if (totalWeight > 0) {
              const idx = (y * displayWidth + x) * 4;
              data[idx] = Math.min(255, r / totalWeight);
              data[idx + 1] = Math.min(255, g / totalWeight);
              data[idx + 2] = Math.min(255, b / totalWeight);
              data[idx + 3] = 255;
            }
          }
        }
        
        ctx.putImageData(imageData, 0, 0);
        break;

      case 'voronoi':
        // Voronoi (Cellular) gradient - creates stained glass/cell structure effect
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, displayWidth, displayHeight);

        const voronoiImageData = ctx.createImageData(displayWidth, displayHeight);
        const voronoiData = voronoiImageData.data;

        // Seeded random number generator for animated pattern
        const voronoiSeed = (x: number) => {
          const s = Math.sin(x * 12.9898 + voronoiCellCount * 78.233) * 43758.5453;
          return s - Math.floor(s);
        };

        // Generate seed points with animated positions
        const voronoiSeeds: Array<{x: number, y: number, colorIndex: number}> = [];
        const audioVoronoiCount = (isAudioEnabled && isAudioReactive)
          ? Math.floor(audioGradientParam * 10) // Up to 10 extra cells
          : 0;
        const totalVoronoiCells = voronoiCellCount + audioVoronoiCount;

        for (let i = 0; i < totalVoronoiCells; i++) {
          // Base position from seed
          const baseX = voronoiSeed(i * 2) * displayWidth;
          const baseY = voronoiSeed(i * 2 + 1) * displayHeight;

          // Add morphing offset based on time
          const offsetX = Math.sin(voronoiAnimTime + i * 0.5) * displayWidth * 0.1;
          const offsetY = Math.cos(voronoiAnimTime + i * 0.7) * displayHeight * 0.1;

          voronoiSeeds.push({
            x: baseX + offsetX,
            y: baseY + offsetY,
            colorIndex: i % gradientColors.length
          });
        }
        
        // Audio reactivity: bass affects distortion
        const audioVoronoiDistortion = (isAudioEnabled && isAudioReactive) 
          ? audioGradientParam * 50 // Up to 50 extra distortion
          : 0;
        const totalVoronoiDistortion = (voronoiDistortion + audioVoronoiDistortion) * 0.01;
        
        // Render Voronoi cells
        for (let vy = 0; vy < displayHeight; vy++) {
          for (let vx = 0; vx < displayWidth; vx++) {
            let minDist = Infinity;
            let nearestSeed = voronoiSeeds[0];
            
            // Find nearest seed point
            voronoiSeeds.forEach(seed => {
              const dx = vx - seed.x;
              const dy = vy - seed.y;
              // Add distortion to create more organic shapes
              const distortion = totalVoronoiDistortion * (Math.sin(dx * 0.01) * Math.cos(dy * 0.01)) * 100;
              const dist = Math.sqrt(dx * dx + dy * dy) + distortion;
              if (dist < minDist) {
                minDist = dist;
                nearestSeed = seed;
              }
            });
            
            const color = gradientColors[nearestSeed.colorIndex];
            if (!color) continue;
            
            const idx = (vy * displayWidth + vx) * 4;
            voronoiData[idx] = color.r;
            voronoiData[idx + 1] = color.g;
            voronoiData[idx + 2] = color.b;
            voronoiData[idx + 3] = 255;
          }
        }
        
        ctx.putImageData(voronoiImageData, 0, 0);
        break;

      case 'iridescent':
        // Iridescent (Spectral) gradient - thin-film interference effect
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        
        const iridescentImageData = ctx.createImageData(displayWidth, displayHeight);
        const iridescentData = iridescentImageData.data;
        
        // Audio reactivity: bass affects interference angle
        const audioIridescentAngle = (isAudioEnabled && isAudioReactive) 
          ? audioGradientParam * 180 // Up to 180 degree shift
          : 0;
        const totalIridescentAngle = (iridescentAngle + gradientAngle + audioIridescentAngle) * DEG_TO_RAD;
        
        // Audio reactivity: mids affect intensity
        const audioIridescentIntensity = (isAudioEnabled && isAudioReactive) 
          ? audioGradientParam * 0.5 // Up to 0.5 extra intensity
          : 0;
        const totalIridescentIntensity = iridescentIntensity + audioIridescentIntensity;
        
        for (let iy = 0; iy < displayHeight; iy++) {
          for (let ix = 0; ix < displayWidth; ix++) {
            const dx = ix - centerX;
            const dy = iy - centerY;
            
            // Calculate viewing angle (simulates looking at surface from different angles)
            const angle = Math.atan2(dy, dx);
            const dist = Math.sqrt(dx * dx + dy * dy) / zoom;
            
            // Thin-film interference calculation
            // Creates rainbow-like color shifts based on angle and distance
            const interference = Math.sin(angle * 3 + totalIridescentAngle) * 
                               Math.cos(dist * 0.01 * iridescentScale) * 
                               totalIridescentIntensity;
            
            // Map interference to color spectrum
            const hue = ((interference + 1) * 0.5 * 360) % 360;
            
            // Convert HSV to RGB for spectral effect
            const h = hue / 60;
            const c = totalIridescentIntensity;
            const x = c * (1 - Math.abs((h % 2) - 1));
            
            let r = 0, g = 0, b = 0;
            if (h >= 0 && h < 1) { r = c; g = x; b = 0; }
            else if (h >= 1 && h < 2) { r = x; g = c; b = 0; }
            else if (h >= 2 && h < 3) { r = 0; g = c; b = x; }
            else if (h >= 3 && h < 4) { r = 0; g = x; b = c; }
            else if (h >= 4 && h < 5) { r = x; g = 0; b = c; }
            else if (h >= 5 && h < 6) { r = c; g = 0; b = x; }
            
            // Blend with gradient colors
            const colorPos = ((interference + 1) * 0.5) * (gradientColors.length - 1);
            const colorIdx = Math.floor(colorPos);
            const colorFrac = colorPos - colorIdx;
            const color1 = gradientColors[colorIdx % gradientColors.length];
            const color2 = gradientColors[(colorIdx + 1) % gradientColors.length];
            
            if (!color1 || !color2) continue;
            
            // Mix spectral effect with gradient colors
            const baseR = color1.r + (color2.r - color1.r) * colorFrac;
            const baseG = color1.g + (color2.g - color1.g) * colorFrac;
            const baseB = color1.b + (color2.b - color1.b) * colorFrac;
            
            const idx = (iy * displayWidth + ix) * 4;
            iridescentData[idx] = Math.min(255, baseR * (1 - totalIridescentIntensity * 0.5) + r * 255 * totalIridescentIntensity);
            iridescentData[idx + 1] = Math.min(255, baseG * (1 - totalIridescentIntensity * 0.5) + g * 255 * totalIridescentIntensity);
            iridescentData[idx + 2] = Math.min(255, baseB * (1 - totalIridescentIntensity * 0.5) + b * 255 * totalIridescentIntensity);
            iridescentData[idx + 3] = 255;
          }
        }
        
        ctx.putImageData(iridescentImageData, 0, 0);
        break;

      case 'radar':
        // Radar sweep gradient - rotating scan line with fade trail
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, displayWidth, displayHeight);

        const radarImageData = ctx.createImageData(displayWidth, displayHeight);
        const radarData = radarImageData.data;

        for (let ry = 0; ry < displayHeight; ry++) {
          for (let rx = 0; rx < displayWidth; rx++) {
            const dx = rx - centerX;
            const dy = ry - centerY;
            const pixelAngle = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;

            // Calculate how far behind the sweep this pixel is
            let angleDiff = (radarSweepAngle - pixelAngle + 360) % 360;

            // Determine brightness based on proximity to sweep line
            let brightness = 0;
            if (angleDiff <= radarFadeLength) {
              // Fade trail: brightest at sweep line, fading behind it
              brightness = 1 - (angleDiff / radarFadeLength);
            }

            // Get color from gradient
            const colorPos = (pixelAngle / 360) * (gradientColors.length - 1);
            const colorIdx = Math.floor(colorPos);
            const colorFrac = colorPos - colorIdx;
            const color1 = gradientColors[colorIdx % gradientColors.length];
            const color2 = gradientColors[(colorIdx + 1) % gradientColors.length];

            if (!color1 || !color2) continue;

            const r = color1.r + (color2.r - color1.r) * colorFrac;
            const g = color1.g + (color2.g - color1.g) * colorFrac;
            const b = color1.b + (color2.b - color1.b) * colorFrac;

            const idx = (ry * displayWidth + rx) * 4;
            radarData[idx] = r * brightness;
            radarData[idx + 1] = g * brightness;
            radarData[idx + 2] = b * brightness;
            radarData[idx + 3] = 255;
          }
        }

        ctx.putImageData(radarImageData, 0, 0);
        break;

      case 'flower':
        // Flower of Life - sacred geometry pattern with overlapping circles
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, displayWidth, displayHeight);

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(((flowerRotation + flowerAnimTime) * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);

        const baseRadius = Math.min(displayWidth, displayHeight) / 6 * flowerScale;
        const circles: Array<{x: number, y: number, colorIndex: number}> = [];

        // Center circle
        circles.push({x: centerX, y: centerY, colorIndex: 0});

        // Create hexagonal pattern of overlapping circles
        const layers = flowerCircles;
        for (let layer = 1; layer <= layers; layer++) {
          const circlesInLayer = layer * 6;
          const angleStep = (Math.PI * 2) / circlesInLayer;
          const layerRadius = baseRadius * layer;

          for (let i = 0; i < circlesInLayer; i++) {
            const angle = angleStep * i;
            const x = centerX + Math.cos(angle) * layerRadius;
            const y = centerY + Math.sin(angle) * layerRadius;
            circles.push({x, y, colorIndex: (layer + i) % gradientColors.length});
          }
        }

        // Draw all circles with gradient colors
        circles.forEach((circle, idx) => {
          const color = gradientColors[circle.colorIndex % gradientColors.length];
          if (!color) return;

          // Create radial gradient for each circle
          const grad = ctx.createRadialGradient(circle.x, circle.y, 0, circle.x, circle.y, baseRadius);
          grad.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`);
          grad.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0.2)`);

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(circle.x, circle.y, baseRadius, 0, Math.PI * 2);
          ctx.fill();

          // Draw circle outline
          ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`;
          ctx.lineWidth = 2;
          ctx.stroke();
        });

        ctx.restore();
        break;

      default:
        break;
    }

    // For gradients that use the gradient variable (not direct pixel manipulation)
    const directRenderTypes = ['mesh', 'voronoi', 'iridescent', 'noise', 'plasma', 'waves', 'checkerboard', 'zigzag', 'tunnel', 'conical-spiral', 'radial-burst', 'freeform', 'flower', 'radar'];
    if (!directRenderTypes.includes(gradientType)) {
      if (gradient) {
        addGradientStops(gradient, gradientColors);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        
        // Restore context for angle gradient
        if (gradientType === 'angle') {
          ctx.restore();
        }
      }
    }

    // Restore audio-reactive transformations before applying effects
    if (isAudioEnabled && isAudioReactive) {
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
      
      // Check if this is the first effect and audio reactivity is enabled
      const isFirstEffect = index === 0;
      const audioModulation = (isAudioEnabled && isAudioReactive && isFirstEffect) 
        ? audioEffectParam 
        : 0;
      
      // Get imageData only for effects that need it
      const needsImageData = ['invert', 'film-grain', 'charcoal', 'posterize', 'halftone', 'crackle', 'dust-scratches', 'color-shift', 'duotone', 'tritone', 'gradient-map'].includes(effectType);
      let imageData: ImageData | null = null;
      
      if (needsImageData) {
        try {
          imageData = ctx.getImageData(0, 0, displayWidth, displayHeight);
        } catch (e) {
          console.error('Failed to get image data:', e);
          return;
        }
      }
      
      switch (effectType) {
        case 'kaleidoscope': {
          const tmp = document.createElement('canvas');
          tmp.width = displayWidth;
          tmp.height = displayHeight;
          const tc = tmp.getContext('2d');
          if (tc) {
            tc.drawImage(canvas, 0, 0);
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, displayWidth, displayHeight);
            ctx.imageSmoothingEnabled = true;
            const cx = displayWidth / 2, cy = displayHeight / 2;
            const seg = Math.max(1, kaleidoscopeSegments + (isFirstEffect ? Math.floor(audioModulation * 8) : 0));
            const aps = (Math.PI * 2) / seg;
            // Use diagonal so segments always reach every corner
            const r = Math.sqrt(cx * cx + cy * cy) * 1.5;
            for (let i = 0; i < seg; i++) {
              ctx.save();
              ctx.translate(cx, cy);
              ctx.rotate(i * aps);
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.lineTo(r, -r);
              ctx.lineTo(r, r);
              ctx.closePath();
              ctx.clip();
              if (i % 2 === 0) ctx.scale(1, -1);
              ctx.rotate(-i * aps);
              // Scale source up so it fills beyond edges
              const scale = r / Math.max(cx, cy);
              ctx.drawImage(tmp, -cx * scale, -cy * scale, displayWidth * scale, displayHeight * scale);
              ctx.restore();
            }
            ctx.imageSmoothingEnabled = true;
          }
          break;
        }
          
        case 'invert':
          // Invert colors
          if (!imageData) break;
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i];         // Red
            data[i + 1] = 255 - data[i + 1]; // Green
            data[i + 2] = 255 - data[i + 2]; // Blue
          }
          ctx.putImageData(imageData, 0, 0);
          break;
          
        case 'pixelate': {
          const pxTmp = document.createElement('canvas');
          const pxSize = Math.max(1, pixelSize + (isFirstEffect ? Math.floor(audioModulation * 30) : 0));
          pxTmp.width = Math.max(1, Math.floor(displayWidth / pxSize));
          pxTmp.height = Math.max(1, Math.floor(displayHeight / pxSize));
          const pxCtx = pxTmp.getContext('2d');
          if (pxCtx) {
            pxCtx.drawImage(canvas, 0, 0, pxTmp.width, pxTmp.height);
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(pxTmp, 0, 0, displayWidth, displayHeight);
            ctx.imageSmoothingEnabled = true;
          }
          break;
        }
          
        case 'triangulate': {
          const tCtx = document.createElement('canvas').getContext('2d');
          if (!tCtx) break;
          tCtx.canvas.width = canvas.width;
          tCtx.canvas.height = canvas.height;
          tCtx.drawImage(canvas, 0, 0);
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, displayWidth, displayHeight);
          const tSz = Math.max(10, triangleSize + (isFirstEffect ? Math.floor(audioModulation * 40) : 0));
          const cols = Math.ceil(displayWidth / tSz), rows = Math.ceil(displayHeight / tSz);
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const x = c * tSz, y = r * tSz;
              const d1 = tCtx.getImageData(Math.min(x + tSz/2, displayWidth-1), Math.min(y + tSz/2, displayHeight-1), 1, 1).data;
              ctx.fillStyle = `rgb(${d1[0]},${d1[1]},${d1[2]})`;
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(x + tSz, y);
              ctx.lineTo(x + tSz, y + tSz);
              ctx.fill();
              const d2 = tCtx.getImageData(Math.min(x + tSz/3, displayWidth-1), Math.min(y + tSz/3, displayHeight-1), 1, 1).data;
              ctx.fillStyle = `rgb(${d2[0]},${d2[1]},${d2[2]})`;
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(x, y + tSz);
              ctx.lineTo(x + tSz, y + tSz);
              ctx.fill();
            }
          }
          break;
        }
          
        case 'chromatic': {
          if (displayWidth <= 1 || displayHeight <= 1) break;
          const src = ctx.getImageData(0, 0, displayWidth, displayHeight);
          const dst = ctx.createImageData(displayWidth, displayHeight);
          const off = Math.min(Math.abs(chromaticOffset + (isFirstEffect ? Math.floor(audioModulation * 10) : 0)), Math.floor(displayWidth / 3));
          for (let y = 0; y < displayHeight; y++) {
            for (let x = 0; x < displayWidth; x++) {
              const i = (y * displayWidth + x) * 4;
              const rx = Math.max(0, Math.min(displayWidth - 1, x - off));
              const bx = Math.max(0, Math.min(displayWidth - 1, x + off));
              dst.data[i] = src.data[(y * displayWidth + rx) * 4];
              dst.data[i + 1] = src.data[i + 1];
              dst.data[i + 2] = src.data[(y * displayWidth + bx) * 4 + 2];
              dst.data[i + 3] = 255;
            }
          }
          ctx.putImageData(dst, 0, 0);
          break;
        }
          
        case 'fisheye': {
          const src = ctx.getImageData(0, 0, displayWidth, displayHeight);
          const dst = ctx.createImageData(displayWidth, displayHeight);
          const cx = displayWidth / 2, cy = displayHeight / 2;
          const md = Math.sqrt(cx * cx + cy * cy);
          const str = fisheyeStrength + (isFirstEffect ? audioModulation : 0);
          for (let y = 0; y < displayHeight; y++) {
            for (let x = 0; x < displayWidth; x++) {
              const dx = x - cx, dy = y - cy;
              const d = Math.sqrt(dx * dx + dy * dy);
              const di = (y * displayWidth + x) * 4;
              if (d < md) {
                const dd = Math.pow(d / md, 1 + str) * md;
                const a = Math.atan2(dy, dx);
                const sx = Math.floor(cx + Math.cos(a) * dd);
                const sy = Math.floor(cy + Math.sin(a) * dd);
                if (sx >= 0 && sx < displayWidth && sy >= 0 && sy < displayHeight) {
                  const si = (sy * displayWidth + sx) * 4;
                  dst.data[di] = src.data[si];
                  dst.data[di + 1] = src.data[si + 1];
                  dst.data[di + 2] = src.data[si + 2];
                  dst.data[di + 3] = 255;
                }
              }
            }
          }
          ctx.putImageData(dst, 0, 0);
          break;
        }
        
        // New effects - basic implementations
        case 'film-grain': {
          if (!imageData) break;
          const d = imageData.data;
          const int = grainIntensity + (isFirstEffect ? audioModulation * 0.3 : 0);
          const sz = { 'fine': 0.5, 'medium': 1, 'coarse': 2, 'film': 1.5 }[grainType];
          for (let i = 0; i < d.length; i += 4) {
            const n = (Math.random() - 0.5) * int * 255 * sz;
            d[i] += n; d[i + 1] += n; d[i + 2] += n;
          }
          ctx.putImageData(imageData, 0, 0);
          break;
        }
        
        case 'oil-paint':
          // Oil paint effect
          ctx.filter = `blur(${oilPaintRadius}px)`;
          ctx.drawImage(canvas, 0, 0);
          ctx.filter = 'none';
          break;
        

        
        case 'charcoal': {
          if (!imageData) break;
          const d = imageData.data;
          for (let i = 0; i < d.length; i += 4) {
            const g = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11;
            if (charcoalIntensity < 0.5) {
              const a = 1 - (charcoalIntensity * 2);
              d[i] = d[i] * (1 - a) + g * a;
              d[i + 1] = d[i + 1] * (1 - a) + g * a;
              d[i + 2] = d[i + 2] * (1 - a) + g * a;
            } else {
              const b = (charcoalIntensity - 0.5) * 4;
              d[i] = Math.min(255, Math.max(0, d[i] + (d[i] - g) * b));
              d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + (d[i + 1] - g) * b));
              d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + (d[i + 2] - g) * b));
            }
          }
          ctx.putImageData(imageData, 0, 0);
          break;
        }
        
        case 'posterize': {
          if (!imageData) break;
          const d = imageData.data, lv = posterizeLevels, s = 256 / lv;
          for (let i = 0; i < d.length; i += 4) {
            d[i] = Math.floor(d[i] / 256 * lv) * s;
            d[i + 1] = Math.floor(d[i + 1] / 256 * lv) * s;
            d[i + 2] = Math.floor(d[i + 2] / 256 * lv) * s;
          }
          ctx.putImageData(imageData, 0, 0);
          break;
        }
        
        case 'halftone': {
          if (!imageData) break;
          const htCtx = document.createElement('canvas').getContext('2d');
          if (!htCtx) break;
          htCtx.canvas.width = canvas.width;
          htCtx.canvas.height = canvas.height;
          htCtx.putImageData(imageData, 0, 0);
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, displayWidth, displayHeight);
          const sz = halftoneSize;
          for (let y = 0; y < displayHeight; y += sz) {
            for (let x = 0; x < displayWidth; x += sz) {
              const pd = htCtx.getImageData(x, y, 1, 1).data;
              const br = (pd[0] + pd[1] + pd[2]) / 3;
              const s = Math.sin(x * 12.9898 + y * 78.233 + (halftoneMove ? halftoneTimeRef.current * 1000 : 0)) * 43758.5453;
              const vf = 1 + ((s - Math.floor(s)) - 0.5) * halftoneVariation;
              const r = (br / 255) * (sz / 2) * vf;
              ctx.fillStyle = `rgb(${pd[0]},${pd[1]},${pd[2]})`;
              ctx.beginPath();
              ctx.arc(x + sz / 2, y + sz / 2, r, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          break;
        }

        case 'vhs-glitch':
          // VHS effect with horizontal disruption - blurrier and more intense
          if (canvas.width === 0 || canvas.height === 0) break;
          
          // Apply horizontal blur first for VHS tape tracking blur
          const blurStrength = Math.floor(2 + vhsGlitchIntensity * 3);
          ctx.filter = `blur(${blurStrength}px)`;
          ctx.drawImage(canvas, 0, 0);
          ctx.filter = 'none';
          
          // More horizontal glitches with varying sizes
          const numGlitches = Math.floor(15 + vhsGlitchIntensity * 50); // 15-65 glitches
          for (let i = 0; i < numGlitches; i++) {
            const y = Math.random() * displayHeight;
            const h = Math.max(2, Math.min(60, Math.random() * 60 * vhsGlitchIntensity)); // Larger glitches
            const offset = (Math.random() - 0.5) * 300 * vhsGlitchIntensity; // More displacement
            if (y >= 0 && y + h <= displayHeight && displayWidth > 0) {
              try {
                const slice = ctx.getImageData(0, y, displayWidth, h);
                // Apply additional blur to the displaced slice
                ctx.filter = `blur(${blurStrength * 1.5}px)`;
                ctx.putImageData(slice, offset, y);
                ctx.filter = 'none';
              } catch (e) {
                // Skip if getImageData fails
              }
            }
          }
          
          // Add strong RGB channel shift for VHS chromatic aberration
          if (imageData) {
            const shiftAmount = Math.floor(vhsGlitchIntensity * 8); // Increased shift
            const data = imageData.data;
            const tempData = new Uint8ClampedArray(data);
            
            // Shift red and blue channels
            for (let y = 0; y < displayHeight; y++) {
              for (let x = 0; x < displayWidth; x++) {
                const i = (y * displayWidth + x) * 4;
                
                // Red channel shift right
                const redSourceX = Math.max(0, x - shiftAmount);
                const redSourceI = (y * displayWidth + redSourceX) * 4;
                data[i] = tempData[redSourceI];
                
                // Blue channel shift left
                const blueSourceX = Math.min(displayWidth - 1, x + shiftAmount);
                const blueSourceI = (y * displayWidth + blueSourceX) * 4;
                data[i + 2] = tempData[blueSourceI + 2];
              }
            }
            ctx.putImageData(imageData, 0, 0);
          }
          break;
        

        case 'dust-scratches':
          // Texture overlay with dust noise and crackle lines
          if (!imageData) break;
          const texData = imageData.data;
          // Add dust noise
          for (let i = 0; i < texData.length; i += 4) {
            const noise = (Math.random() - 0.5) * 30 * dustIntensity;
            texData[i] += noise;
            texData[i + 1] += noise;
            texData[i + 2] += noise;
          }
          ctx.putImageData(imageData, 0, 0);
          
          // Add crackle lines
          if (dustCrackleIntensity > 0) {
            ctx.strokeStyle = `rgba(0,0,0,${dustCrackleIntensity * 0.3})`;
            ctx.lineWidth = 1;
            const numCracks = Math.floor(20 * dustCrackleIntensity);
            for (let i = 0; i < numCracks; i++) {
              ctx.beginPath();
              let x = Math.random() * displayWidth;
              let y = Math.random() * displayHeight;
              ctx.moveTo(x, y);
              
              // Random walk for crack line
              const steps = Math.floor(10 + Math.random() * 30);
              for (let j = 0; j < steps; j++) {
                x += (Math.random() - 0.5) * 20;
                y += (Math.random() - 0.5) * 20;
                ctx.lineTo(x, y);
              }
              ctx.stroke();
            }
          }
          break;
        
        case 'motion-blur':
          ctx.filter = `blur(${blurAmount}px)`;
          ctx.drawImage(canvas, 5, 0);
          ctx.filter = 'none';
          break;
        
        case 'radial-blur':
          // Simplified radial blur
          ctx.filter = `blur(${blurAmount}px)`;
          ctx.drawImage(canvas, 0, 0);
          ctx.filter = 'none';
          break;
        

        case 'wave-distortion':
          // Wave distortion with rotation and wrapped edges to prevent white gaps
          if (canvas.width === 0 || canvas.height === 0) break;
          try {
            const waveData = ctx.getImageData(0, 0, displayWidth, displayHeight);
            const tempWave = ctx.createImageData(displayWidth, displayHeight);
            const angleRad = waveDistortionRotation * Math.PI / 180;
          for (let y = 0; y < displayHeight; y++) {
            for (let x = 0; x < displayWidth; x++) {
              // Apply wave in the direction of rotation
              const waveOffset = Math.sin((y * Math.cos(angleRad) + x * Math.sin(angleRad)) * 0.05) * waveDistortionStrength;
              const sourceX = x + waveOffset * Math.cos(angleRad);
              const sourceY = y + waveOffset * Math.sin(angleRad);
              // Wrap coordinates to prevent white gaps at edges
              const wrappedX = ((Math.floor(sourceX) % displayWidth) + displayWidth) % displayWidth;
              const wrappedY = ((Math.floor(sourceY) % displayHeight) + displayHeight) % displayHeight;
              const destIdx = (y * displayWidth + x) * 4;
              const srcIdx = (wrappedY * displayWidth + wrappedX) * 4;
              tempWave.data[destIdx] = waveData.data[srcIdx];
              tempWave.data[destIdx + 1] = waveData.data[srcIdx + 1];
              tempWave.data[destIdx + 2] = waveData.data[srcIdx + 2];
              tempWave.data[destIdx + 3] = 255;
            }
          }
          ctx.putImageData(tempWave, 0, 0);
          } catch (e) {
            console.error('Wave distortion error:', e);
          }
          break;
        


        case 'color-shift': {
          if (!imageData) break;
          const d = imageData.data;
          for (let i = 0; i < d.length; i += 4) {
            d[i] = (d[i] + colorShiftHue) % 256;
            d[i + 1] = (d[i + 1] + colorShiftHue) % 256;
            d[i + 2] = (d[i + 2] + colorShiftHue) % 256;
          }
          ctx.putImageData(imageData, 0, 0);
          break;
        }
        
        case 'duotone': {
          if (!imageData) break;
          const d = imageData.data;
          const h2r = (h: string) => {
            const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
            return r ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) } : { r: 0, g: 0, b: 0 };
          };
          const c0 = h2r(duotoneColor1), c1 = h2r(duotoneColor2);
          for (let i = 0; i < d.length; i += 4) {
            const g = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11, t = g / 255;
            d[i] = (c0.r * (1 - t) + c1.r * t) * duotoneIntensity + d[i] * (1 - duotoneIntensity);
            d[i + 1] = (c0.g * (1 - t) + c1.g * t) * duotoneIntensity + d[i + 1] * (1 - duotoneIntensity);
            d[i + 2] = (c0.b * (1 - t) + c1.b * t) * duotoneIntensity + d[i + 2] * (1 - duotoneIntensity);
          }
          ctx.putImageData(imageData, 0, 0);
          break;
        }
        
        case 'tritone': {
          if (!imageData) break;
          const d = imageData.data;
          const h2r = (h: string) => {
            const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
            return r ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) } : { r: 0, g: 0, b: 0 };
          };
          const c0 = h2r(tritoneColor1), c1 = h2r(tritoneColor2), c2 = h2r(tritoneColor3);
          for (let i = 0; i < d.length; i += 4) {
            const g = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11, t = g / 255;
            let r, gr, b;
            if (t < 0.5) {
              const lt = t * 2;
              r = c0.r * (1 - lt) + c1.r * lt;
              gr = c0.g * (1 - lt) + c1.g * lt;
              b = c0.b * (1 - lt) + c1.b * lt;
            } else {
              const lt = (t - 0.5) * 2;
              r = c1.r * (1 - lt) + c2.r * lt;
              gr = c1.g * (1 - lt) + c2.g * lt;
              b = c1.b * (1 - lt) + c2.b * lt;
            }
            d[i] = r * tritoneIntensity + d[i] * (1 - tritoneIntensity);
            d[i + 1] = gr * tritoneIntensity + d[i + 1] * (1 - tritoneIntensity);
            d[i + 2] = b * tritoneIntensity + d[i + 2] * (1 - tritoneIntensity);
          }
          ctx.putImageData(imageData, 0, 0);
          break;
        }
        
        case 'vignette':
          // Darken edges
          const vigRadius = Math.max(0, Math.max(displayWidth, displayHeight) / 1.5);
          const vigGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, vigRadius);
          vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
          // Audio modulation affects vignette strength
          const audioVignetteStrength = isFirstEffect ? audioModulation * 0.5 : 0;
          const effectiveVignetteStrength = Math.min(1, vignetteStrength + audioVignetteStrength);
          vigGrad.addColorStop(1, `rgba(0,0,0,${effectiveVignetteStrength})`);
          ctx.fillStyle = vigGrad;
          ctx.fillRect(0, 0, displayWidth, displayHeight);
          break;
        
        case 'grid': {
          if (canvas.width === 0 || canvas.height === 0) break;
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = displayWidth;
          tempCanvas.height = displayHeight;
          const gCtx = tempCanvas.getContext('2d');
          if (!gCtx) break;
          gCtx.drawImage(canvas, 0, 0);
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, displayWidth, displayHeight);
          const cw = displayWidth / gridColumns, ch = displayHeight / gridRows;
          for (let r = 0; r < gridRows + 1; r++) {
            for (let c = 0; c < gridColumns + 1; c++) {
              const x = c * cw, y = r * ch;
              const vx = gridVariation > 0 ? (Math.random() - 0.5) * cw * gridVariation : 0;
              const vy = gridVariation > 0 ? (Math.random() - 0.5) * ch * gridVariation : 0;
              const cx = x + cw / 2 + vx, cy = y + ch / 2 + vy;
              const rad = Math.min(cw, ch) / 2 * (gridShapeSize / 25) * (gridVariation > 0 ? 1 + (Math.random() - 0.5) * gridVariation * 0.5 : 1);
              const scx = Math.min(Math.max(0, cx), displayWidth - 1);
              const scy = Math.min(Math.max(0, cy), displayHeight - 1);
              const sex = Math.min(Math.max(0, x), displayWidth - 1);
              const sey = Math.min(Math.max(0, y), displayHeight - 1);
              let cc = '#000', ec = '#000';
              try {
                const cp = gCtx.getImageData(scx, scy, 1, 1).data;
                cc = `rgb(${cp[0]},${cp[1]},${cp[2]})`;
                const ep = gCtx.getImageData(sex, sey, 1, 1).data;
                ec = `rgb(${ep[0]},${ep[1]},${ep[2]})`;
              } catch (e) { cc = '#000'; ec = '#333'; }
              const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
              g.addColorStop(0, cc);
              g.addColorStop(1, ec);
              ctx.fillStyle = g;
              ctx.save();
              ctx.translate(cx, cy);
              ctx.rotate((gridRotation * Math.PI) / 180 + (gridVariation > 0 ? Math.random() * gridVariation * Math.PI : 0));
              ctx.translate(-cx, -cy);
              ctx.beginPath();
              if (gridSides === 1) {
                // Dot (circle)
                ctx.arc(cx, cy, rad, 0, Math.PI * 2);
              } else if (gridSides === 2) {
                // Line (vertical line with thickness = rad)
                ctx.rect(cx - rad, cy - displayHeight * 2, rad * 2, displayHeight * 4);
              } else if (gridSides > 2) {
                // Polygon (3+ sides)
                for (let i = 0; i < gridSides; i++) {
                  const a = (i * 2 * Math.PI / gridSides) - (gridSides % 2 === 1 ? Math.PI / 2 : 0);
                  const px = cx + rad * Math.cos(a), py = cy + rad * Math.sin(a);
                  if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                }
              }
              ctx.closePath();
              ctx.fill();
              ctx.restore();
            }
          }
          break;
        }
        
        case 'blur': {
          if (blurType === 'gaussian') {
            ctx.filter = `blur(${blurGaussianAmount + (isFirstEffect ? audioModulation * 10 : 0)}px)`;
            ctx.drawImage(canvas, 0, 0);
            ctx.filter = 'none';
          } else if (blurType === 'motion') {
            const amt = blurMotionAmount + (isFirstEffect ? audioModulation * 10 : 0);
            const rad = (blurMotionDirection * Math.PI) / 180;
            const iterations = Math.max(10, Math.floor(10 + amt / 2));
            const ox = Math.cos(rad) * amt, oy = Math.sin(rad) * amt;
            ctx.filter = `blur(${amt * 0.2}px)`;
            ctx.globalAlpha = 0.8 / iterations;
            for (let i = 1; i <= iterations; i++) {
              ctx.drawImage(canvas, ox * (i / iterations), oy * (i / iterations));
            }
            ctx.globalAlpha = 1.0;
            ctx.filter = 'none';
          }
          break;
        }
        
        case 'bokeh': {
          const bsz = bokehSize + (isFirstEffect ? audioModulation * 5 : 0);
          ctx.filter = `blur(${bsz}px)`;
          ctx.drawImage(canvas, 0, 0);
          ctx.filter = 'none';
          const nc = Math.floor(50 * bokehIntensity);

          // Seeded random for consistent positions
          const bokehSeed = (n: number) => {
            const x = Math.sin(n * 12.9898 + bokehSize * 78.233) * 43758.5453;
            return x - Math.floor(x);
          };

          for (let i = 0; i < nc; i++) {
            const x = bokehSeed(i * 2) * displayWidth;
            const y = bokehSeed(i * 2 + 1) * displayHeight;
            const r = bokehSeed(i * 2 + 0.5) * bsz * 2 + bsz;
            const sx = Math.min(Math.max(0, Math.floor(x)), displayWidth - 1);
            const sy = Math.min(Math.max(0, Math.floor(y)), displayHeight - 1);
            const pd = ctx.getImageData(sx, sy, 1, 1).data;

            // Apply colorize by shifting hue
            let r1 = pd[0], g1 = pd[1], b1 = pd[2];
            if (bokehColorize > 0) {
              const hueShift = bokehColorize * 360;
              const max = Math.max(r1, g1, b1);
              const min = Math.min(r1, g1, b1);
              const delta = max - min;
              let h = 0;
              if (delta !== 0) {
                if (max === r1) h = ((g1 - b1) / delta) % 6;
                else if (max === g1) h = (b1 - r1) / delta + 2;
                else h = (r1 - g1) / delta + 4;
                h = h * 60;
                if (h < 0) h += 360;
              }
              h = (h + hueShift) % 360;
              const s = max === 0 ? 0 : delta / max;
              const v = max / 255;
              const c = v * s;
              const x = c * (1 - Math.abs((h / 60) % 2 - 1));
              const m = v - c;
              let r2 = 0, g2 = 0, b2 = 0;
              if (h < 60) { r2 = c; g2 = x; }
              else if (h < 120) { r2 = x; g2 = c; }
              else if (h < 180) { g2 = c; b2 = x; }
              else if (h < 240) { g2 = x; b2 = c; }
              else if (h < 300) { r2 = x; b2 = c; }
              else { r2 = c; b2 = x; }
              r1 = (r2 + m) * 255;
              g1 = (g2 + m) * 255;
              b1 = (b2 + m) * 255;
            }

            const g = ctx.createRadialGradient(x, y, 0, x, y, r);
            g.addColorStop(0, `rgba(${Math.min(255, r1)},${Math.min(255, g1)},${Math.min(255, b1)},${bokehIntensity * 0.6})`);
            g.addColorStop(0.5, `rgba(${Math.min(255, r1 * 0.8)},${Math.min(255, g1 * 0.8)},${Math.min(255, b1 * 0.8)},${bokehIntensity * 0.3})`);
            g.addColorStop(1, `rgba(${pd[0]},${pd[1]},${pd[2]},0)`);
            ctx.fillStyle = g;
            ctx.globalCompositeOperation = 'screen';
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
          }
          break;
        }
        
        case 'brightness':
          // Brightness adjustment
          const audioBrightnessBoost = isFirstEffect ? audioModulation * 0.5 : 0;
          const effectiveBrightness = 1 + brightnessAmount + audioBrightnessBoost;
          ctx.filter = `brightness(${effectiveBrightness})`;
          ctx.drawImage(canvas, 0, 0);
          ctx.filter = 'none';
          break;
        
        case 'dither':
          // Dither effect
          const ditherImageData = ctx.getImageData(0, 0, displayWidth, displayHeight);
          const ditherData = ditherImageData.data;
          
          const bayer = [[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
          const lv = Math.max(2, ditherLevels);
          const st = 255 / (lv - 1);
          
          if (ditherType === 'bayer') {
            for (let y = 0; y < displayHeight; y++) {
              for (let x = 0; x < displayWidth; x++) {
                const i = (y * displayWidth + x) * 4;
                const t = (bayer[y % 4][x % 4] / 16) * st;
                for (let c = 0; c < 3; c++) {
                  const v = Math.round(ditherData[i+c] / st) * st;
                  ditherData[i+c] = ditherData[i+c] + t > v + st/2 ? Math.min(255, v+st) : v;
                }
              }
            }
          } else {
            for (let y = 0; y < displayHeight; y++) {
              for (let x = 0; x < displayWidth; x++) {
                const i = (y * displayWidth + x) * 4;
                for (let c = 0; c < 3; c++) {
                  const old = ditherData[i+c];
                  const nv = Math.round(old / st) * st;
                  ditherData[i+c] = nv;
                  const e = old - nv;
                  if (x+1 < displayWidth) ditherData[i+4+c] += e*.44;
                  if (y+1 < displayHeight) {
                    if (x > 0) ditherData[i+displayWidth*4-4+c] += e*.19;
                    ditherData[i+displayWidth*4+c] += e*.31;
                    if (x+1 < displayWidth) ditherData[i+displayWidth*4+4+c] += e*.06;
                  }
                }
              }
            }
          }
          
          ctx.putImageData(ditherImageData, 0, 0);
          break;

        case 'slit-scan':
          // Temporal pixel stretching
          const ssImg = ctx.getImageData(0, 0, displayWidth, displayHeight);
          slitScanBufferRef.current.push(ssImg);
          if (slitScanBufferRef.current.length > 60) slitScanBufferRef.current.shift();

          if (slitScanBufferRef.current.length > 1) {
            const out = ctx.createImageData(displayWidth, displayHeight);
            const int = slitScanIntensity;
            const buf = slitScanBufferRef.current;

            if (slitScanDirection === 'horizontal') {
              for (let y = 0; y < displayHeight; y++) {
                const fi = Math.min(Math.floor((y / displayHeight) * (buf.length - 1) * int), buf.length - 1);
                const sf = buf[fi];
                for (let x = 0; x < displayWidth; x++) {
                  const i = (y * displayWidth + x) * 4;
                  out.data[i] = sf.data[i];
                  out.data[i+1] = sf.data[i+1];
                  out.data[i+2] = sf.data[i+2];
                  out.data[i+3] = sf.data[i+3];
                }
              }
            } else if (slitScanDirection === 'vertical') {
              for (let x = 0; x < displayWidth; x++) {
                const fi = Math.min(Math.floor((x / displayWidth) * (buf.length - 1) * int), buf.length - 1);
                const sf = buf[fi];
                for (let y = 0; y < displayHeight; y++) {
                  const i = (y * displayWidth + x) * 4;
                  out.data[i] = sf.data[i];
                  out.data[i+1] = sf.data[i+1];
                  out.data[i+2] = sf.data[i+2];
                  out.data[i+3] = sf.data[i+3];
                }
              }
            } else {
              const cx = displayWidth / 2, cy = displayHeight / 2;
              const md = Math.sqrt(cx*cx + cy*cy);
              for (let y = 0; y < displayHeight; y++) {
                for (let x = 0; x < displayWidth; x++) {
                  const d = Math.sqrt((x-cx)*(x-cx) + (y-cy)*(y-cy));
                  const fi = Math.min(Math.floor((d / md) * (buf.length - 1) * int), buf.length - 1);
                  const sf = buf[fi];
                  const i = (y * displayWidth + x) * 4;
                  out.data[i] = sf.data[i];
                  out.data[i+1] = sf.data[i+1];
                  out.data[i+2] = sf.data[i+2];
                  out.data[i+3] = sf.data[i+3];
                }
              }
            }
            ctx.putImageData(out, 0, 0);
          }
          break;
      }
    });

    const handleResize = () => {
      // Force re-render on resize - useEffect will re-run
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [resolutionMultiplier, gradientColors, gradientAngle, gradientType, zoom, activeEffects, kaleidoscopeSegments, twistAmount, pixelSize, triangleSize, chromaticOffset, fisheyeStrength, tileCount, grainIntensity, grainType, blurMotionAmount, blurGaussianAmount, blurRadialAmount, blurMotionDirection, blurType, posterizeLevels, halftoneSize, halftoneVariation, halftoneMove, halftoneMoveSpeed, halftoneAnimTrigger, vignetteStrength, colorShiftHue, bulgeStrength, pinchStrength, scanLineSize, triGridSize, hexGridSize, linesCount, linesAngle, linesThickness, polarAngle, polarRadius, dustIntensity, dustCrackleIntensity, vhsGlitchIntensity, waveDistortionStrength, waveDistortionRotation, liquifyStrength, charcoalIntensity, sepiaIntensity, solarizeThreshold, lightLeakIntensity, duotoneIntensity, duotoneColor1, duotoneColor2, tritoneIntensity, tritoneColor1, tritoneColor2, tritoneColor3, colorDodgeIntensity, colorBurnIntensity, digitalNoiseIntensity, gridRotation, shapesRotation, gridRows, gridColumns, gridShapeSize, gridVariation, angleStartOffset, angleCenterX, angleCenterY, spiralTightness, spiralRotations, spiralThickness, spiralZoom, shapesSides, shapesCount, concentricRingWidth, concentricRingCount, waveAmplitude, waveFrequency, meshGridSize, noiseScale, noiseOctaves, plasmaSpeed, plasmaComplexity, radialBurstCount, radialBurstSpread, voronoiCellCount, voronoiDistortion, voronoiAnimTime, conicalSpiralTurns, conicalSpiralTightness, windmillBlades, windmillRotation, iridescentAngle, iridescentIntensity, iridescentScale, radarSweepAngle, radarFadeLength, flowerCircles, flowerScale, flowerRotation, flowerAnimTime, bokehSize, bokehIntensity, bokehColorize, brightnessAmount, ditherType, ditherLevels, slitScanIntensity, slitScanDirection, slitScanAnimTrigger, addGradientStops, isAudioEnabled, isAudioReactive, audioGradientParam, audioEffectParam, audioColorShift]);

  const handleInteraction = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Calculate angle from center of screen
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
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

    // Calculate which part of the screen was touched to determine which color to change
    const relativeX = clientX / window.innerWidth;
    
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
    // In freeform mode, if not dragging a pin, clicking adds a new pin or changes interaction
    if (gradientType === 'freeform' && !isDraggingPin) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      
      // Check if clicking on existing pin
      let clickedPin = false;
      for (const pin of colorPins) {
        const dx = Math.abs(pin.x - x) * rect.width;
        const dy = Math.abs(pin.y - y) * rect.height;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 15) {
          setSelectedPinId(pin.id);
          setIsDraggingPin(true);
          clickedPin = true;
          break;
        }
      }
      
      if (!clickedPin) {
        // Add new pin at click position
        const newPin: ColorPin = {
          id: Date.now().toString(),
          x,
          y,
          color: {
            r: Math.floor(Math.random() * 255),
            g: Math.floor(Math.random() * 255),
            b: Math.floor(Math.random() * 255),
          },
          radius: 300,
        };
        setColorPins(prev => [...prev, newPin]);
        setSelectedPinId(newPin.id);
      }
      return;
    }
    
    setIsDragging(true);
    previousPosition.current = null;
  };

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsDraggingPin(false);
    previousPosition.current = null;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    // Handle pin dragging in freeform mode
    if (gradientType === 'freeform' && isDraggingPin && selectedPinId) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      
      setColorPins(prev => prev.map(p => 
        p.id === selectedPinId ? { ...p, x, y } : p
      ));
      return;
    }
    
    handleInteraction(e.clientX, e.clientY);
  }, [gradientType, isDraggingPin, selectedPinId, handleInteraction]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (gradientType === 'freeform' && !isDraggingPin && e.touches.length === 1) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const x = (touch.clientX - rect.left) / rect.width;
      const y = (touch.clientY - rect.top) / rect.height;
      
      // Check if touching existing pin
      let touchedPin = false;
      for (const pin of colorPins) {
        const dx = Math.abs(pin.x - x) * rect.width;
        const dy = Math.abs(pin.y - y) * rect.height;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 20) {
          setSelectedPinId(pin.id);
          setIsDraggingPin(true);
          touchedPin = true;
          break;
        }
      }
      
      if (!touchedPin) {
        // Add new pin at touch position
        const newPin: ColorPin = {
          id: Date.now().toString(),
          x,
          y,
          color: {
            r: Math.floor(Math.random() * 255),
            g: Math.floor(Math.random() * 255),
            b: Math.floor(Math.random() * 255),
          },
          radius: 300,
        };
        setColorPins(prev => [...prev, newPin]);
        setSelectedPinId(newPin.id);
      }
      return;
    }
    
    setIsDragging(true);
    previousPosition.current = null;
  }, [gradientType, isDraggingPin, colorPins]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setIsDraggingPin(false);
    previousPosition.current = null;
    lastPinchDistance.current = null; // Reset pinch distance
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    // Handle pinch-to-zoom with two fingers
    if (e.touches.length === 2) {
      e.preventDefault(); // Prevent default pinch zoom behavior
      
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      // Calculate distance between two touch points
      const deltaX = touch2.clientX - touch1.clientX;
      const deltaY = touch2.clientY - touch1.clientY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      if (lastPinchDistance.current !== null) {
        // Track manual zoom interaction to prevent audio from overriding
        lastManualZoomTime.current = Date.now();
        
        // Calculate zoom change based on pinch distance change
        const distanceChange = distance - lastPinchDistance.current;
        const zoomMultiplier = isAutoMode ? 0.005 : 0.01; // Faster zoom when auto is off
        const zoomDelta = distanceChange * zoomMultiplier;
        
        // Update zoom level (clamp between 0.05 and 20 for extreme zoom range)
        setTargetZoom(prev => Math.max(0.05, Math.min(20, prev + zoomDelta)));
      }
      
      lastPinchDistance.current = distance;
      return;
    }
    
    // Reset pinch distance when not using two fingers
    lastPinchDistance.current = null;
    
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      
      // Handle pin dragging in freeform mode
      if (gradientType === 'freeform' && isDraggingPin && selectedPinId) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (touch.clientY - rect.top) / rect.height));
        
        setColorPins(prev => prev.map(p => 
          p.id === selectedPinId ? { ...p, x, y } : p
        ));
        return;
      }
      
      handleInteraction(touch.clientX, touch.clientY);
    }
  }, [gradientType, isDraggingPin, selectedPinId, handleInteraction, isAutoMode]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    // Support both trackpad pinch (with ctrlKey) and regular mouse wheel scroll
    // ctrlKey indicates trackpad pinch or Ctrl+wheel
    const isPinch = e.ctrlKey;
    
    // Always handle zoom for better UX
    e.preventDefault();
    
    // Track manual zoom interaction to prevent audio from overriding
    lastManualZoomTime.current = Date.now();
    
    // Use deltaY to determine zoom direction and magnitude
    // More responsive when auto mode is off, and adjust for pinch vs wheel
    const baseMultiplier = isAutoMode ? 0.01 : 0.025;
    const zoomMultiplier = isPinch ? baseMultiplier : baseMultiplier * 0.5; // Slower for mouse wheel
    const zoomDelta = -e.deltaY * zoomMultiplier;
    
    // Update zoom level (clamp between 0.05 and 20 for extreme zoom range)
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

  // Export gradient as PNG
  const exportAsPNG = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Convert canvas to PNG and download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `gradient-${Date.now()}.png`;
        link.click();
        URL.revokeObjectURL(url);
      }
    }, 'image/png');
  }, []);

  // Export animated GIF
  const exportAsGIF = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // If loop is enabled, capture a full 360-degree rotation for seamless looping
    // Calculate duration based on one complete rotation (assumes ~2 degrees per frame at 60fps)
    const duration = vcrLoop ? 6000 : 3000; // 6 seconds for seamless loop, 3 seconds otherwise
    const loopText = vcrLoop ? ' (seamless loop)' : '';
    
    alert(`Capturing ${duration/1000} seconds of animation for GIF${loopText}...`);
    
    // Capture frames at 10fps
    const frames: string[] = [];
    const fps = 10;
    const frameCount = (duration / 1000) * fps;
    const frameDelay = 1000 / fps;

    for (let i = 0; i < frameCount; i++) {
      await new Promise(resolve => setTimeout(resolve, frameDelay));
      frames.push(canvas.toDataURL('image/png'));
    }

    // For now, download first frame as PNG (GIF encoding would require a library)
    // In production, you'd use a GIF encoder library
    const link = document.createElement('a');
    link.href = frames[0];
    link.download = `gradient-animated-${Date.now()}.png`;
    link.click();
    
    const loopInfo = vcrLoop ? ' Seamless loop enabled.' : '';
    alert(`GIF export complete!${loopInfo} (Currently exports first frame as PNG. Full GIF encoding requires additional library.)`);
  };

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

      let options: MediaRecorderOptions;
      if (MediaRecorder.isTypeSupported('video/mp4')) {
        options = { mimeType: 'video/mp4', videoBitsPerSecond: 8000000 };
      } else {
        options = { mimeType: 'video/webm', videoBitsPerSecond: 8000000 };
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

  // Start recording video
  const startRecording = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      // Create offscreen canvas at 1080p for high-quality recording
      const recordCanvas = document.createElement('canvas');
      recordCanvas.width = 2560;
      recordCanvas.height = 1440;
      const recordCtx = recordCanvas.getContext('2d');
      if (!recordCtx) return;

      // Store canvas in ref for access in stop function
      recordCanvasRef.current = recordCanvas;

      // Start capturing the recording canvas at 60fps
      const stream = recordCanvas.captureStream(60);
      
      // Determine best supported format - prioritize MP4 for QuickTime/Premiere compatibility
      let options: MediaRecorderOptions;
      let fileExtension = 'mp4';
      
      if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')) {
        // H.264 in MP4 - best compatibility with QuickTime/Premiere
        options = { 
          mimeType: 'video/mp4;codecs=avc1',
          videoBitsPerSecond: 25000000 // 25 Mbps for 2K
        };
        fileExtension = 'mp4';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        options = { 
          mimeType: 'video/mp4',
          videoBitsPerSecond: 25000000
        };
        fileExtension = 'mp4';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
        // H.264 in WebM container - works in some editors
        options = { 
          mimeType: 'video/webm;codecs=h264',
          videoBitsPerSecond: 25000000
        };
        fileExtension = 'mp4'; // Can often be played as MP4
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        options = { 
          mimeType: 'video/webm;codecs=vp9',
          videoBitsPerSecond: 25000000
        };
        fileExtension = 'webm';
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        options = { 
          mimeType: 'video/webm',
          videoBitsPerSecond: 25000000
        };
        fileExtension = 'webm';
      } else {
        options = { 
          videoBitsPerSecond: 25000000
        };
        fileExtension = 'mp4';
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      // Animation loop to continuously copy main canvas to recording canvas at 1080p
      const copyToRecordCanvas = () => {
        if (!recordCanvasRef.current || !canvasRef.current) return;
        const ctx = recordCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.drawImage(canvasRef.current, 0, 0, recordCanvasRef.current.width, recordCanvasRef.current.height);
        }
        recordingAnimationRef.current = requestAnimationFrame(copyToRecordCanvas);
      };
      
      // Start the animation loop
      copyToRecordCanvas();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
          console.log(`Recorded chunk: ${event.data.size} bytes`);
        }
      };

      mediaRecorder.onstop = () => {
        // Stop the animation loop
        if (recordingAnimationRef.current !== null) {
          cancelAnimationFrame(recordingAnimationRef.current);
          recordingAnimationRef.current = null;
        }
        
        // Create blob with the correct mimeType
        const mimeType = mediaRecorder.mimeType || options.mimeType || 'video/mp4';
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        
        console.log(`Recording stopped. Total size: ${blob.size} bytes from ${recordedChunksRef.current.length} chunks`);
        
        if (blob.size === 0) {
          alert('Recording failed: No data captured');
          recordedChunksRef.current = [];
          return;
        }
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `gradient-1080p-${Date.now()}.${fileExtension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up after download completes
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 1000);
        recordedChunksRef.current = [];
        recordCanvasRef.current = null;
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        alert('Recording error occurred');
        setIsRecording(false);
        if (recordingAnimationRef.current !== null) {
          cancelAnimationFrame(recordingAnimationRef.current);
          recordingAnimationRef.current = null;
        }
      };

      // Start recording with timeslice for regular data collection
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not start recording. Your browser may not support this feature.');
    }
  }, []);

  // Stop recording video
  const stopRecording = useCallback(() => {
    console.log('Stop recording called');
    const mediaRecorder = mediaRecorderRef.current;
    
    // Stop animation loop first
    if (recordingAnimationRef.current !== null) {
      cancelAnimationFrame(recordingAnimationRef.current);
      recordingAnimationRef.current = null;
    }
    
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      // Request final data before stopping
      if (mediaRecorder.state === 'recording') {
        console.log('Stopping MediaRecorder...');
        mediaRecorder.stop();
      }
      setIsRecording(false);
      
      // Stop all tracks in the stream
      const stream = mediaRecorder.stream;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }
  }, []);

  // VCR toggle handlers
  const toggleVCRRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
      setIsVCRRecording(false);
    } else {
      startRecording();
      setIsVCRRecording(true);
    }
  }, [isRecording, startRecording, stopRecording]);

  const toggleVCRPlayback = useCallback(() => {
    // Stop/Play toggle button — never touches recording state
    if (isVCRPlaying || isAutoMode) {
      setIsVCRRecording(false);
      setIsVCRPlaying(false);
      setVcrPlaybackIndex(0);
      setIsAutoMode(false);
    } else {
      if (vcrRecordedFrames.length > 0) {
        setIsVCRRecording(false);
        setIsVCRPlaying(true);
        setIsAutoMode(false);
      } else {
        setIsAutoMode(true);
        setIsVCRRecording(false);
        setIsVCRPlaying(false);
      }
    }
  }, [isVCRPlaying, isAutoMode, vcrRecordedFrames.length]);

  // Stop button - completely stops playback and resets to beginning (does not touch recording)
  const handleStop = useCallback(() => {
    setIsVCRRecording(false);
    setIsVCRPlaying(false);
    setIsAutoMode(false);
    setVcrPlaybackIndex(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsAudioEnabled(false);
    }
  }, []);

  // Toggle full screen
  const toggleFullScreen = () => {
    const currentRef = containerRef.current;
    if (!currentRef) return;
    
    try {
      if (isFullScreen) {
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
              '• Pinch to zoom\n' +
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
        '• Pinch to zoom\n' +
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
        setIsFullScreen(!!document.fullscreenElement);
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

  // Load presets from Firestore on auth state change
  useEffect(() => {
    signInAnonymously(auth).then(async (cred) => {
      const snap = await getDocs(collection(db, 'users', cred.user.uid, 'presets'));
      if (!snap.empty) {
        const presets = snap.docs.map((d: any) => d.data());
        setSavedPresets(presets);
      }
    });

    // Load rated results
    const storedRatings = localStorage.getItem('gradientRatings');
    if (storedRatings) {
      try {
        setRatedResults(JSON.parse(storedRatings));
      } catch (e) {
        console.error('Failed to load ratings:', e);
      }
    }
  }, []);
  
  // Save preset
  const savePreset = async () => {
    if (!presetName.trim()) {
      alert('Please enter a preset name');
      return;
    }
    
    const preset = {
      name: presetName.trim(),
      data: {
        gradientColors,
        gradientAngle,
        gradientType,
        zoom,
        activeEffects,
        kaleidoscopeSegments,
        twistAmount,
        pixelSize,
        triangleSize,
        chromaticOffset,
        fisheyeStrength,
        tileCount,
        grainIntensity,
        blurMotionAmount,
        blurMotionDirection,
        blurGaussianAmount,
        blurRadialAmount,
        posterizeLevels,
        halftoneSize,
        halftoneMove,
        vignetteStrength,
        colorShiftHue,
        submittedAIPrompt,
        baseAIColors
      }
    };
    
    const newPresets = [...savedPresets, preset];
    setSavedPresets(newPresets);
    if (auth.currentUser) { await setDoc(doc(collection(db, 'users', auth.currentUser.uid, 'presets'), String(newPresets.length - 1)), newPresets[newPresets.length - 1]); }
    setPresetName('');
    setIsPresetModalOpen(false);
  };
  
  // Load preset
  const loadPreset = (preset: any) => {
    const data = preset.data;
    // Allow presets to have different numbers of colors
    const colors = data.gradientColors || DEFAULT_COLORS;
    setGradientColors(colors);
    setTargetColors(colors);
    setGradientAngle(data.gradientAngle);
    setTargetAngle(data.gradientAngle);
    setGradientType(data.gradientType);
    setZoom(data.zoom);
    setTargetZoom(data.zoom);
    setActiveEffects(data.activeEffects || []);
    setKaleidoscopeSegments(data.kaleidoscopeSegments || 8);
    setTwistAmount(data.twistAmount || 2);
    setPixelSize(data.pixelSize || 20);
    setTriangleSize(data.triangleSize || 40);
    setChromaticOffset(data.chromaticOffset || 5);
    setFisheyeStrength(data.fisheyeStrength || 0.5);
    setTileCount(data.tileCount || 2);
    setGrainIntensity(data.grainIntensity || 0.1);
    setBlurMotionAmount(data.blurMotionAmount || data.blurAmount || 5);
    setBlurMotionDirection(data.blurMotionDirection || 0);
    setBlurGaussianAmount(data.blurGaussianAmount || 5);
    setBlurRadialAmount(data.blurRadialAmount || 5);
    setPosterizeLevels(data.posterizeLevels || 8);
    setHalftoneSize(data.halftoneSize || 4);
    setHalftoneMove(data.halftoneMove || false);
    setVignetteStrength(data.vignetteStrength || 0.5);
    setColorShiftHue(data.colorShiftHue || 0);
    setSubmittedAIPrompt(data.submittedAIPrompt || '');
    setBaseAIColors(data.baseAIColors || null);
    setIsPresetModalOpen(false);
  };
  
  // Delete preset
  const deletePreset = async (index: number) => {
    const newPresets = savedPresets.filter((_, i) => i !== index);
    setSavedPresets(newPresets);
    if (auth.currentUser) { const presetsRef = collection(db, 'users', auth.currentUser.uid, 'presets'); const snap = await getDocs(presetsRef); snap.docs.forEach(d => deleteDoc(d.ref)); newPresets.forEach((p, i) => setDoc(doc(presetsRef, String(i)), p)); }
  };

  const renamePreset = async (index: number, newName: string) => {
    if (!newName.trim()) return;
    const newPresets = savedPresets.map((p, i) => i === index ? { ...p, name: newName.trim() } : p);
    setSavedPresets(newPresets);
    if (auth.currentUser) { const presetsRef = collection(db, 'users', auth.currentUser.uid, 'presets'); const snap = await getDocs(presetsRef); snap.docs.forEach(d => deleteDoc(d.ref)); newPresets.forEach((p, i) => setDoc(doc(presetsRef, String(i)), p)); }
  };
  
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
  
  return (
    <div className="fixed inset-0 overflow-hidden cursor-crosshair" ref={containerRef} style={{ touchAction: 'none' }}>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onWheel={handleWheel}
        className="w-full h-full"
        style={{ touchAction: 'none' }}
      />
      
      {/* Freeform Pins Overlay */}
      {gradientType === 'freeform' && (
        <div className="absolute inset-0 pointer-events-none">
          {colorPins.map((pin) => {
            const canvas = canvasRef.current;
            if (!canvas) return null;
            const pixelX = pin.x * window.innerWidth;
            const pixelY = pin.y * window.innerHeight;
            const isSelected = selectedPinId === pin.id;
            
            return (
              <div
                key={pin.id}
                className="absolute pointer-events-auto cursor-pointer"
                style={{
                  left: `${pin.x * 100}%`,
                  top: `${pin.y * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setSelectedPinId(pin.id);
                  setIsDraggingPin(true);
                }}
              >
                {/* Influence radius visualization */}
                <div
                  className="absolute rounded-full border-2 border-white/30 pointer-events-none"
                  style={{
                    width: `${pin.radius * 2}px`,
                    height: `${pin.radius * 2}px`,
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    opacity: isSelected ? 0.5 : 0.2,
                  }}
                />
                {/* Pin marker */}
                <div
                  className={`w-6 h-6 rounded-full border-3 ${isSelected ? 'border-white' : 'border-white/50'} shadow-lg`}
                  style={{
                    backgroundColor: `rgb(${pin.color.r}, ${pin.color.g}, ${pin.color.b})`,
                  }}
                />
              </div>
            );
          })}
        </div>
      )}
      
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
          className="hidden"
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          className="hidden"
        />
      </div>

      {/* Preset Modal */}
      {isPresetModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4 text-black">Manage Presets</h3>
            
            {/* Save New Preset Section */}
            <div className="mb-6 pb-6 border-b border-gray-300">
              <p className="text-sm text-gray-700 mb-3">Save current settings as a new preset:</p>
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    savePreset();
                  } else if (e.key === 'Escape') {
                    setIsPresetModalOpen(false);
                    setPresetName('');
                  }
                }}
                placeholder="Enter preset name..."
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-purple-500 focus:outline-none text-black mb-3"
                autoFocus
              />
              <button
                onClick={savePreset}
                className="w-full px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
              >
                Save Current Settings
              </button>
            </div>
            
            {/* Saved Presets Section */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-black mb-3">Saved Presets ({savedPresets.length})</h4>
              {savedPresets.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No saved presets yet</p>
              ) : (
                <div className="space-y-2">
                  {savedPresets.map((preset, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gray-100 rounded-lg p-3">
                      <button
                        onClick={() => loadPreset(preset)}
                        className="flex-1 text-left text-sm text-black hover:text-purple-600 font-medium"
                      >
                        {preset.name}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete preset "${preset.name}"?`)) {
                            deletePreset(index);
                          }
                        }}
                        className="px-3 py-1 rounded text-xs bg-red-500 text-white hover:bg-red-600 transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex gap-2 justify-end pt-4 border-t border-gray-300">
              <button
                onClick={() => {
                  setIsPresetModalOpen(false);
                  setPresetName('');
                }}
                className="px-4 py-2 rounded-lg text-sm bg-gray-300 text-black hover:bg-gray-400 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Eye-off button when controls are hidden */}
      {!isControlsVisible && (
        <div className="absolute top-4 left-4 pointer-events-auto flex gap-1.5 scale-[1.15] origin-top-left">
          <button
            onClick={() => setIsControlsVisible(true)}
            className="w-[32px] h-[32px] p-1.5 rounded-lg transition-all bg-[#2a2a4e] text-white hover:bg-[#3a3a5e] flex items-center justify-center"
            title="Show Controls"
          >
            <EyeOff className="w-4 h-4" />
          </button>
          <button
            onClick={feelingLucky}
            className="w-[32px] h-[32px] p-1.5 rounded-lg transition-all bg-gradient-to-r from-purple-600 via-pink-500 to-yellow-400 text-white shadow-lg hover:shadow-xl flex items-center justify-center"
            title="Randomize"
          >
            <Shuffle className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsPresetModalOpen(true)}
            className="w-[32px] h-[32px] p-1.5 rounded-lg transition-all bg-[#2a2a4e] text-white hover:bg-[#3a3a5e] flex items-center justify-center"
            title="Add Preset"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {/* Main controls */}
      <div
        className={`absolute flex flex-col gap-[3.5px] pointer-events-auto transition-opacity duration-300 w-[280px] max-h-[calc(100vh-2rem)] overflow-y-auto bg-[#1a1a2e]/40 backdrop-blur-md rounded-xl p-[6px] scale-[1.15] origin-top-left ${isControlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={panelPos ? { left: panelPos.x, top: panelPos.y } : { top: 16, left: 16 }}
      >
        {/* Drag handle */}
        <div
          className="w-full flex justify-center items-center py-0.5 cursor-grab active:cursor-grabbing select-none"
          onMouseDown={(e) => {
            const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
            panelDragRef.current = { startX: e.clientX, startY: e.clientY, origX: rect.left, origY: rect.top };
            const onMove = (ev: MouseEvent) => {
              if (!panelDragRef.current) return;
              setPanelPos({
                x: panelDragRef.current.origX + (ev.clientX - panelDragRef.current.startX),
                y: panelDragRef.current.origY + (ev.clientY - panelDragRef.current.startY),
              });
            };
            const onUp = () => {
              panelDragRef.current = null;
              window.removeEventListener('mousemove', onMove);
              window.removeEventListener('mouseup', onUp);
            };
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
          }}
        >
          <div className="w-8 h-1 rounded-full bg-white/20"></div>
        </div>

        {/* Top row with Eye, Randomize, and Refresh buttons */}
        <div className="flex gap-[3.5px] w-full mb-0.5">
          <button
            onClick={() => setIsControlsVisible(false)}
            className="w-[32px] h-[32px] p-1.5 rounded-lg transition-all bg-[#2a2a4e] text-white hover:bg-[#3a3a5e] flex items-center justify-center"
            title="Hide Controls"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={feelingLucky}
            className="px-2 h-[32px] rounded-lg text-[13px] transition-all bg-gradient-to-r from-purple-600 via-pink-500 to-yellow-400 text-white font-semibold shadow-lg hover:shadow-xl flex-1 flex items-center justify-center"
          >
RANDOMIZE
          </button>
          <button
            onClick={undoLastChange}
            disabled={!previousState}
            className={`w-[32px] h-[32px] p-1.5 rounded-lg transition-all flex items-center justify-center ${
              previousState 
                ? 'bg-[#2a2a4e] text-white hover:bg-[#3a3a5e]' 
                : 'bg-[#1a1a2e] text-white/30 cursor-not-allowed'
            }`}
            title="Undo (Cmd+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              // Refresh functionality - reset to default state
              window.location.reload();
            }}
            className="w-[32px] h-[32px] p-1.5 rounded-lg transition-all bg-[#2a2a4e] text-white hover:bg-[#3a3a5e] flex items-center justify-center"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        
        {/* VCR Controls */}
        <div className="flex items-center justify-between gap-0.5 bg-[#2a2a4e] rounded-lg p-0.5 mb-0.5 w-full">
            <button
              onClick={exportAsPNG}
              className="p-1 rounded hover:bg-[#3a3a5e] text-white transition-all"
              title="Save PNG"
            >
              <Camera className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-white/20"></div>

            <button
              onClick={toggleVCRRecording}
              className="p-1 rounded hover:bg-[#3a3a5e] text-white transition-all"
              title="Record Video"
            >
              <Circle className={`w-4 h-4 ${isRecording ? 'fill-red-500 stroke-red-500' : ''}`} />
            </button>
            
            <button
              onClick={handleStop}
              className="p-1 rounded hover:bg-[#3a3a5e] text-white transition-all"
              title="Stop"
            >
              <Square className="w-4 h-4" />
            </button>
            
            <button
              onClick={toggleVCRPlayback}
              className="p-1 rounded hover:bg-[#3a3a5e] text-white transition-all"
              title={isVCRPlaying || isAutoMode ? "Pause" : (vcrRecordedFrames.length > 0 ? "Play Recording" : "Auto Play")}
            >
              {(isVCRPlaying || isAutoMode) ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            
            <div className="w-px h-5 bg-white/20"></div>
            
            <button
              onClick={() => {
                if (vcrPlaybackSpeed > 2) {
                  // Decrement by 1x when above 2x
                  setVcrPlaybackSpeed(vcrPlaybackSpeed - 1);
                } else if (vcrPlaybackSpeed === 2) {
                  // At 2x, go to 1x
                  setVcrPlaybackSpeed(1);
                } else if (vcrPlaybackSpeed === 1) {
                  // At 1x, go to 0.5x
                  setVcrPlaybackSpeed(0.5);
                }
                // At 0.5x or below, stay at 0.5x (do nothing)
              }}
              className="p-1 rounded hover:bg-[#3a3a5e] text-white transition-all"
              title="Slower"
            >
              <Rewind className="w-4 h-4" />
            </button>
            
            <span className="text-xs text-white text-center">{vcrPlaybackSpeed}x</span>
            
            <button
              onClick={() => {
                if (vcrPlaybackSpeed >= 2) {
                  // Increment by 1x when at or above 2x, max 10x
                  setVcrPlaybackSpeed(Math.min(10, vcrPlaybackSpeed + 1));
                } else if (vcrPlaybackSpeed >= 1) {
                  // At 1x, jump to 2x
                  setVcrPlaybackSpeed(2);
                } else {
                  // Below 1x (0.5x), jump to 1x
                  setVcrPlaybackSpeed(1);
                }
              }}
              className="p-1 rounded hover:bg-[#3a3a5e] text-white transition-all"
              title="Faster"
            >
              <FastForward className="w-4 h-4" />
            </button>
            
            <div className="w-px h-5 bg-white/20"></div>
            
            <button
              onClick={() => setRotationDirection(rotationDirection === 'clockwise' ? 'counter' : 'clockwise')}
              className="p-1 rounded hover:bg-[#3a3a5e] text-white transition-all"
              title={rotationDirection === 'clockwise' ? 'Clockwise' : 'Counter-Clockwise'}
            >
              {rotationDirection === 'clockwise' ? <RotateCw className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
            </button>
          </div>
        
        {/* Color Picker (AI) button */}
        <div className="flex gap-[3.5px] w-full mb-0.5">
          <button
            onClick={() => setIsAIColorPickerOpen(!isAIColorPickerOpen)}
            className="flex-1 px-1.5 py-1.5 rounded-lg text-xs transition-all bg-[#2a2a4e] text-white hover:bg-[#3a3a5e] font-semibold shadow-lg hover:shadow-xl flex items-center justify-between"
          >
            <span>Color Picker (AI)</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isAIColorPickerOpen ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={() => {
              saveCurrentState();
              setTargetColors(gradientColors.map(() => randomColor()));
            }}
            className="w-[32px] px-1 py-1.5 rounded-lg text-xs transition-all bg-[#2a2a4e] text-white hover:bg-[#3a3a5e] font-semibold shadow-lg flex items-center justify-center"
            title="Shuffle Colors"
          >
            <Shuffle className="w-4 h-4" />
          </button>
        </div>
        {submittedAIPrompt && (
          <div className="flex items-center gap-1 mb-0.5">
            <div className="flex-1 px-2 py-1 text-xs text-white/70 bg-[#2a2a4e]/50 rounded text-center truncate">
              "{submittedAIPrompt}"
            </div>
            <button
              onClick={() => {
                setSubmittedAIPrompt('');
                setBaseAIColors(null);
                setGradientColors(DEFAULT_COLORS);
                setTargetColors(DEFAULT_COLORS);
                setAIPrompt('');
              }}
              className="w-6 h-6 flex-shrink-0 rounded bg-[#2a2a4e]/50 hover:bg-red-500/40 text-white/50 hover:text-white text-xs flex items-center justify-center transition-all"
              title="Clear keywords"
            >×</button>
          </div>
        )}
        
        {/* AI Color Picker Dropdown */}
        {isAIColorPickerOpen && (
          <div className="w-full mb-0.5 bg-[#2a2a4e] rounded-lg p-3">
            {/* Selected keyword chips */}
            <div className="flex flex-wrap gap-1 mb-2 min-h-[28px]">
              {aiPrompt.split(' ').filter(Boolean).map((kw, i) => (
                <span key={i} className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-gradient-to-r from-pink-500/60 to-purple-500/60 text-white">
                  {kw}
                  <button onClick={() => setAIPrompt(prev => prev.split(' ').filter(Boolean).filter((_, j) => j !== i).join(' '))} className="ml-0.5 text-white/60 hover:text-white leading-none">×</button>
                </span>
              ))}
              {aiPrompt.split(' ').filter(Boolean).length === 0 && (
                <span className="text-[10px] text-white/30 italic">Click keywords below to add (up to 8)</span>
              )}
            </div>

            <div className="mb-2">
              <input
                type="text"
                value=""
                readOnly
                placeholder={aiPrompt.split(' ').filter(Boolean).length >= 8 ? 'Max 8 keywords selected' : 'Click to browse keywords…'}
                onFocus={() => setIsKeywordHelpOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAIPromptSubmit();
                  if (e.key === 'Escape') { setIsAIColorPickerOpen(false); setAIPrompt(''); }
                }}
                className="w-full px-2 py-1.5 rounded text-xs border border-white/30 focus:border-white/60 focus:outline-none text-white placeholder-white/40 cursor-pointer"
                style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(236,72,153,0.3), rgba(251,146,60,0.3))' }}
              />
            </div>

            {isKeywordHelpOpen && (
              <div className="mb-2 p-2 rounded bg-black/30 text-[10px] text-white/70 leading-relaxed">
                <div className="font-bold text-white/90 mb-1">Themes</div>
                <div className="mb-2 flex flex-wrap gap-1">
                  {['sunset','sunrise','ocean','forest','fire','ice','tropical','neon','pastel','autumn','spring','winter','galaxy','desert','candy','earth','rainbow','monochrome','midnight','cherry'].map(t => {
                    const selected = aiPrompt.split(' ').filter(Boolean).includes(t);
                    const full = aiPrompt.split(' ').filter(Boolean).length >= 8;
                    return (
                      <span key={t} onClick={() => {
                        const current = aiPrompt.split(' ').filter(Boolean);
                        if (selected) setAIPrompt(current.filter(k => k !== t).join(' '));
                        else if (!full) setAIPrompt(current.concat(t).join(' '));
                      }} className={`px-1.5 py-0.5 rounded-full cursor-pointer transition-all ${selected ? 'bg-pink-500/70 text-white' : full ? 'opacity-30 cursor-not-allowed' : 'bg-white/10 hover:bg-white/20 text-white/80'}`}>{t}</span>
                    );
                  })}
                </div>
                <div className="font-bold text-white/90 mb-1">Colors</div>
                <div className="flex flex-wrap gap-1">
                  {['red','orange','yellow','green','blue','purple','pink','cyan','magenta','lime','teal','indigo','violet','brown','black','white','gray','gold','silver','coral','peach','lavender','mint','rose','sky','navy','maroon','olive','turquoise','salmon'].map(c => {
                    const selected = aiPrompt.split(' ').filter(Boolean).includes(c);
                    const full = aiPrompt.split(' ').filter(Boolean).length >= 8;
                    return (
                      <span key={c} onClick={() => {
                        const current = aiPrompt.split(' ').filter(Boolean);
                        if (selected) setAIPrompt(current.filter(k => k !== c).join(' '));
                        else if (!full) setAIPrompt(current.concat(c).join(' '));
                      }} className={`px-1.5 py-0.5 rounded-full cursor-pointer transition-all ${selected ? 'bg-purple-500/70 text-white' : full ? 'opacity-30 cursor-not-allowed' : 'bg-white/10 hover:bg-white/20 text-white/80'}`}>{c}</span>
                    );
                  })}
                </div>
                <div className="mt-1.5 text-white/40 text-right">{aiPrompt.split(' ').filter(Boolean).length}/8 selected</div>
              </div>
            )}

            <div className="flex gap-1.5 justify-end">
              <button
                onClick={() => {
                  setIsAIColorPickerOpen(false);
                  setAIPrompt('');
                  setIsKeywordHelpOpen(false);
                }}
                className="px-3 py-1 rounded text-xs bg-[#3a3a5e] text-white hover:bg-[#4a4a6e] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAIPromptSubmit}
                className="px-3 py-1 rounded text-xs bg-gradient-to-r from-pink-500 to-orange-500 text-white hover:from-pink-600 hover:to-orange-600 transition-all"
              >
                Generate
              </button>
            </div>
          </div>
        )}
        
        {/* Gradients Header */}
        <div className="w-full mb-0.5 flex gap-[3.5px]">
          <button
            onClick={() => setIsGradientsOpen(!isGradientsOpen)}
            className="flex-1 px-1.5 py-1.5 rounded-lg text-xs transition-all bg-[#2a2a4e] text-white hover:bg-[#3a3a5e] font-semibold shadow-lg flex items-center justify-between"
          >
            <span>Gradients</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isGradientsOpen ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={shuffleGradientType}
            className="w-[32px] px-1 py-1.5 rounded-lg text-xs transition-all bg-[#2a2a4e] text-white hover:bg-[#3a3a5e] font-semibold shadow-lg flex items-center justify-center"
            title="Shuffle Gradient Type"
          >
            <Shuffle className="w-4 h-4" />
          </button>
        </div>
        
        {/* Gradient Type Buttons - 2 Column Grid */}
        {isGradientsOpen && (
        <div className="w-full mb-0.5">
          <div className="grid grid-cols-2 gap-0.5" style={{ gridAutoFlow: 'column', gridTemplateRows: 'repeat(8, auto)' }}>
            {FULL_GRADIENT_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setGradientType(type)}
                className={`px-0.5 py-0.5 rounded text-xs capitalize transition-all whitespace-nowrap ${
                  gradientType === type
                    ? 'bg-white text-black shadow-lg'
                    : 'bg-[#2a2a4e] text-white hover:bg-[#3a3a5e]'
                }`}
              >
                {getGradientDisplayName(type)}
              </button>
            ))}
          </div>
        </div>
        )}
        
        {/* Gradient-specific Controls - only show when Gradients dropdown is open */}
        {isGradientsOpen && (
        <>
        {/* Grid Controls */}
        {gradientType === 'grid' && (
          <div className="w-full mt-1 mb-0.5 p-2 bg-[#2a2a4e] rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-white">Rows:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={gridRows}
                  onChange={(e) => setGridRows(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={gridRows}
                  onChange={(e) => setGridRows(Number(e.target.value))}
                  className="text-xs text-white w-10 text-right bg-transparent border border-white/20 rounded px-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-white">Columns:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={gridColumns}
                  onChange={(e) => setGridColumns(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={gridColumns}
                  onChange={(e) => setGridColumns(Number(e.target.value))}
                  className="text-xs text-white w-10 text-right bg-transparent border border-white/20 rounded px-1"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Freeform Controls */}
        {gradientType === 'freeform' && (
          <div className="w-full mt-1 mb-0.5 p-2 bg-[#2a2a4e] rounded-lg">
            <div className="flex flex-col gap-1">
              <button
                onClick={(e) => {
                  // Add a new pin at center with random color
                  const newPin: ColorPin = {
                    id: Date.now().toString(),
                    x: 0.5 + (Math.random() - 0.5) * 0.3,
                    y: 0.5 + (Math.random() - 0.5) * 0.3,
                    color: {
                      r: Math.floor(Math.random() * 255),
                      g: Math.floor(Math.random() * 255),
                      b: Math.floor(Math.random() * 255),
                    },
                    radius: 300,
                  };
                  setColorPins(prev => [...prev, newPin]);
                  setSelectedPinId(newPin.id);
                }}
                className="px-2 py-1 rounded text-xs bg-white/20 text-white hover:bg-white/30 transition-all"
              >
                + Add Pin
              </button>
              
              {selectedPinId && (
                <>
                  <button
                    onClick={() => {
                      setColorPins(prev => prev.filter(p => p.id !== selectedPinId));
                      setSelectedPinId(null);
                    }}
                    className="px-2 py-1 rounded text-xs bg-red-500/50 text-white hover:bg-red-500/70 transition-all"
                  >
                    Delete Selected
                  </button>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-white">Radius:</label>
                    <div className="flex items-center gap-1 flex-1 ml-2">
                      <input
                        type="range"
                        min="100"
                        max="800"
                        value={colorPins.find(p => p.id === selectedPinId)?.radius || 300}
                        onChange={(e) => {
                          const newRadius = Number(e.target.value);
                          setColorPins(prev => prev.map(p =>
                            p.id === selectedPinId ? { ...p, radius: newRadius } : p
                          ));
                        }}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="100"
                        max="800"
                        value={colorPins.find(p => p.id === selectedPinId)?.radius || 300}
                        onChange={(e) => {
                          const newRadius = Number(e.target.value);
                          setColorPins(prev => prev.map(p =>
                            p.id === selectedPinId ? { ...p, radius: newRadius } : p
                          ));
                        }}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-white">Color:</label>
                    <input
                      type="color"
                      value={(() => {
                        const pin = colorPins.find(p => p.id === selectedPinId);
                        if (!pin) return '#000000';
                        const r = pin.color.r.toString(16).padStart(2, '0');
                        const g = pin.color.g.toString(16).padStart(2, '0');
                        const b = pin.color.b.toString(16).padStart(2, '0');
                        return `#${r}${g}${b}`;
                      })()}
                      onChange={(e) => {
                        const hex = e.target.value;
                        const r = parseInt(hex.slice(1, 3), 16);
                        const g = parseInt(hex.slice(3, 5), 16);
                        const b = parseInt(hex.slice(5, 7), 16);
                        setColorPins(prev => prev.map(p => 
                          p.id === selectedPinId ? { ...p, color: { r, g, b } } : p
                        ));
                      }}
                      className="ml-2 w-12 h-8 rounded cursor-pointer"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Polygon Controls */}
        {gradientType === 'polygon' && (
          <div className="w-full mt-1 mb-0.5 p-2 bg-[#2a2a4e] rounded-lg">
            <div className="flex items-center justify-between">
              <label className="text-xs text-white">Sides:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={polygonSides}
                  onChange={(e) => setPolygonSides(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={polygonSides}
                  onChange={(e) => setPolygonSides(Number(e.target.value))}
                  className="text-xs text-white w-10 text-right bg-transparent border border-white/20 rounded px-1"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Polar Grid Controls */}
        {gradientType === 'polygon-solid' && (
          <div className="w-full mt-1 mb-0.5 p-2 bg-[#2a2a4e] rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-white">Radials:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="1"
                  max="24"
                  value={polygon2Sides}
                  onChange={(e) => setPolygon2Sides(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={polygon2Sides}
                  onChange={(e) => setPolygon2Sides(Number(e.target.value))}
                  className="text-xs text-white w-10 text-right bg-transparent border border-white/20 rounded px-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-white">Ring Count:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={concentricRingCount}
                  onChange={(e) => setConcentricRingCount(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={concentricRingCount}
                  onChange={(e) => setConcentricRingCount(Number(e.target.value))}
                  className="text-xs text-white w-10 text-right bg-transparent border border-white/20 rounded px-1"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Iridescent Controls */}
        {gradientType === 'iridescent' && (
          <div className="w-full mt-1 mb-0.5 p-2 bg-[#2a2a4e] rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-white">Intensity:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="0.1"
                  max="2"
                  step="0.1"
                  value={iridescentIntensity}
                  onChange={(e) => setIridescentIntensity(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="0.1"
                  max="2"
                  step="0.1"
                  value={iridescentIntensity}
                  onChange={(e) => setIridescentIntensity(Number(e.target.value))}
                  className="text-xs text-white w-10 text-right bg-transparent border border-white/20 rounded px-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-white">Scale:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={iridescentScale}
                  onChange={(e) => setIridescentScale(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={iridescentScale}
                  onChange={(e) => setIridescentScale(Number(e.target.value))}
                  className="text-xs text-white w-10 text-right bg-transparent border border-white/20 rounded px-1"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Angle Gradient Controls */}
        {gradientType === 'angle' && (
          <div className="w-full mt-1 mb-0.5 p-2 bg-[#2a2a4e] rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-white">Start Angle:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={angleStartOffset}
                  onChange={(e) => setAngleStartOffset(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="0"
                  max="360"
                  value={angleStartOffset}
                  onChange={(e) => setAngleStartOffset(Number(e.target.value))}
                  className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-white">Center X:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={angleCenterX}
                  onChange={(e) => setAngleCenterX(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={angleCenterX}
                  onChange={(e) => setAngleCenterX(Number(e.target.value))}
                  className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-white">Center Y:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={angleCenterY}
                  onChange={(e) => setAngleCenterY(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={angleCenterY}
                  onChange={(e) => setAngleCenterY(Number(e.target.value))}
                  className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Shapes Controls */}
        {gradientType === 'shapes' && (
          <div className="w-full mt-1 mb-0.5 p-2 bg-[#2a2a4e] rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-white">Sides:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={shapesSides}
                  onChange={(e) => setShapesSides(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={shapesSides}
                  onChange={(e) => setShapesSides(Number(e.target.value))}
                  className="text-xs text-white w-10 text-right bg-transparent border border-white/20 rounded px-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-white">Count:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={shapesCount}
                  onChange={(e) => setShapesCount(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={shapesCount}
                  onChange={(e) => setShapesCount(Number(e.target.value))}
                  className="text-xs text-white w-10 text-right bg-transparent border border-white/20 rounded px-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-white whitespace-nowrap">Rotate:</label>
              <div className="flex gap-0.5 flex-1 ml-2">
                <button
                  onClick={() => setShapesRotationDirection('none')}
                  className={`flex-1 px-1 py-0.5 rounded text-[10px] transition-all ${
                    shapesRotationDirection === 'none'
                      ? 'bg-white text-black'
                      : 'bg-black/30 text-white hover:bg-black/40'
                  }`}
                >
                  OFF
                </button>
                <button
                  onClick={() => setShapesRotationDirection('clockwise')}
                  className={`flex-1 px-1 py-0.5 rounded text-[10px] transition-all ${
                    shapesRotationDirection === 'clockwise'
                      ? 'bg-white text-black'
                      : 'bg-black/30 text-white hover:bg-black/40'
                  }`}
                >
                  ⟳
                </button>
                <button
                  onClick={() => setShapesRotationDirection('counterclockwise')}
                  className={`flex-1 px-1 py-0.5 rounded text-[10px] transition-all ${
                    shapesRotationDirection === 'counterclockwise'
                      ? 'bg-white text-black'
                      : 'bg-black/30 text-white hover:bg-black/40'
                  }`}
                >
                  ⟲
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Spiral Controls */}
        {gradientType === 'spiral' && (
          <div className="w-full mt-1 mb-0.5 p-2 bg-[#2a2a4e] rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-white">Tightness:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={spiralTightness}
                  onChange={(e) => setSpiralTightness(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={spiralTightness}
                  onChange={(e) => setSpiralTightness(Number(e.target.value))}
                  className="text-xs text-white w-10 text-right bg-transparent border border-white/20 rounded px-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-white">Rotations:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={spiralRotations}
                  onChange={(e) => setSpiralRotations(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={spiralRotations}
                  onChange={(e) => setSpiralRotations(Number(e.target.value))}
                  className="text-xs text-white w-10 text-right bg-transparent border border-white/20 rounded px-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-white">Thickness:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={spiralThickness}
                  onChange={(e) => setSpiralThickness(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={spiralThickness}
                  onChange={(e) => setSpiralThickness(Number(e.target.value))}
                  className="text-xs text-white w-10 text-right bg-transparent border border-white/20 rounded px-1"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Waves Controls */}
        {gradientType === 'waves' && (
          <div className="w-full mt-1 mb-0.5 p-2 bg-[#2a2a4e] rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-white">Amplitude:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="10"
                  max="200"
                  value={waveAmplitude}
                  onChange={(e) => setWaveAmplitude(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="10"
                  max="200"
                  value={waveAmplitude}
                  onChange={(e) => setWaveAmplitude(Number(e.target.value))}
                  className="text-xs text-white w-10 text-right bg-transparent border border-white/20 rounded px-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-white">Frequency:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={waveFrequency}
                  onChange={(e) => setWaveFrequency(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={waveFrequency}
                  onChange={(e) => setWaveFrequency(Number(e.target.value))}
                  className="text-xs text-white w-10 text-right bg-transparent border border-white/20 rounded px-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-white">Number:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={waveNumber}
                  onChange={(e) => setWaveNumber(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={waveNumber}
                  onChange={(e) => setWaveNumber(Number(e.target.value))}
                  className="text-xs text-white w-10 text-right bg-transparent border border-white/20 rounded px-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-white">Direction:</label>
              <div className="flex items-center gap-1 flex-1">
                <div className="relative w-16 h-16 mx-auto">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                    <circle cx="50" cy="50" r="40" fill="rgba(0,0,0,0.3)" />
                    <line
                      x1="50"
                      y1="50"
                      x2={50 + 35 * Math.cos((waveRotation - 90) * Math.PI / 180)}
                      y2={50 + 35 * Math.sin((waveRotation - 90) * Math.PI / 180)}
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={waveRotation}
                    onChange={(e) => setWaveRotation(Number(e.target.value))}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    style={{ WebkitAppearance: 'none' }}
                  />
                </div>
                <input
                  type="number"
                  min="0"
                  max="360"
                  value={waveRotation}
                  onChange={(e) => setWaveRotation(Number(e.target.value))}
                  className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Mesh Controls */}
        {gradientType === 'mesh' && (
          <div className="w-full mt-1 mb-0.5 p-2 bg-[#2a2a4e] rounded-lg">
            <div className="flex items-center justify-between">
              <label className="text-xs text-white">Grid Size:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={meshGridSize}
                  onChange={(e) => setMeshGridSize(Number(e.target.value))}
                  className="flex-1"
                />
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={meshGridSize}
                        onChange={(e) => setMeshGridSize(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
              </div>
            </div>
          </div>
        )}
        
        {/* Noise Controls */}
        {gradientType === 'noise' && (
          <div className="w-full mt-1 mb-0.5 p-2 bg-[#2a2a4e] rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-white">Scale:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="10"
                  max="200"
                  value={noiseScale}
                  onChange={(e) => setNoiseScale(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={noiseScale}
                  onChange={(e) => setNoiseScale(Number(e.target.value))}
                  className="text-xs text-white w-10 text-right bg-transparent border border-white/20 rounded px-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-white">Octaves:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={noiseOctaves}
                  onChange={(e) => setNoiseOctaves(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={noiseOctaves}
                  onChange={(e) => setNoiseOctaves(Number(e.target.value))}
                  className="text-xs text-white w-10 text-right bg-transparent border border-white/20 rounded px-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-white">Direction:</label>
              <div className="flex items-center gap-1 flex-1">
                <div className="relative w-16 h-16 mx-auto">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                    <circle cx="50" cy="50" r="40" fill="rgba(0,0,0,0.3)" />
                    <line
                      x1="50"
                      y1="50"
                      x2={50 + 35 * Math.cos((noiseDirection - 90) * Math.PI / 180)}
                      y2={50 + 35 * Math.sin((noiseDirection - 90) * Math.PI / 180)}
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={noiseDirection}
                    onChange={(e) => setNoiseDirection(Number(e.target.value))}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    style={{ WebkitAppearance: 'none' }}
                  />
                </div>
                <input
                  type="number"
                  min="0"
                  max="360"
                  value={noiseDirection}
                  onChange={(e) => setNoiseDirection(Number(e.target.value))}
                  className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Plasma Gradient Controls */}
        {gradientType === 'plasma' && (
          <div className="w-full mt-1 mb-0.5 p-2 bg-[#2a2a4e] rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-white">Speed:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={plasmaSpeed}
                  onChange={(e) => setPlasmaSpeed(Number(e.target.value))}
                  className="flex-1"
                />
                      <input
                        type="number"
                        min="0.1"
                        max="5"
                        step="0.1"
                        value={plasmaSpeed}
                        onChange={(e) => setPlasmaSpeed(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-white">Complexity:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={plasmaComplexity}
                  onChange={(e) => setPlasmaComplexity(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={plasmaComplexity}
                  onChange={(e) => setPlasmaComplexity(Number(e.target.value))}
                  className="text-xs text-white w-10 text-right bg-transparent border border-white/20 rounded px-1"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Radial Controls */}
        {gradientType === 'radial' && (
          <div className="w-full mt-1 mb-0.5 p-2 bg-[#2a2a4e] rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-white">Center X:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={angleCenterX}
                  onChange={(e) => setAngleCenterX(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={angleCenterX}
                  onChange={(e) => setAngleCenterX(Number(e.target.value))}
                  className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-white">Center Y:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={angleCenterY}
                  onChange={(e) => setAngleCenterY(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={angleCenterY}
                  onChange={(e) => setAngleCenterY(Number(e.target.value))}
                  className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Radial Burst Controls */}
        {gradientType === 'radial-burst' && (
          <div className="w-full mt-1 mb-0.5 p-2 bg-[#2a2a4e] rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-white">Burst Count:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="3"
                  max="16"
                  value={radialBurstCount}
                  onChange={(e) => setRadialBurstCount(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="1"
                  max="16"
                  value={radialBurstCount}
                  onChange={(e) => setRadialBurstCount(Number(e.target.value))}
                  className="text-xs text-white w-10 text-right bg-transparent border border-white/20 rounded px-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-white">Spread:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={radialBurstSpread}
                  onChange={(e) => setRadialBurstSpread(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={radialBurstSpread}
                  onChange={(e) => setRadialBurstSpread(Number(e.target.value))}
                  className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Voronoi Controls */}
        {gradientType === 'voronoi' && (
          <div className="w-full mt-1 mb-0.5 p-2 bg-black/30 backdrop-blur-sm rounded-lg">
            <div className="text-xs text-white font-semibold mb-2">Voronoi Controls</div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-white">Cell Count:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="3"
                  max="30"
                  value={voronoiCellCount}
                  onChange={(e) => setVoronoiCellCount(Number(e.target.value))}
                  className="flex-1"
                />
                      <input
                        type="number"
                        min="3"
                        max="30"
                        value={voronoiCellCount}
                        onChange={(e) => setVoronoiCellCount(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-white">Distortion:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={voronoiDistortion}
                  onChange={(e) => setVoronoiDistortion(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={voronoiDistortion}
                  onChange={(e) => setVoronoiDistortion(Number(e.target.value))}
                  className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-white">Morph Speed:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={voronoiMorphSpeed}
                  onChange={(e) => setVoronoiMorphSpeed(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={voronoiMorphSpeed}
                  onChange={(e) => setVoronoiMorphSpeed(Number(e.target.value))}
                  className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Radar Controls */}
        {gradientType === 'radar' && (
          <div className="w-full mt-1 mb-0.5 p-2 bg-black/30 backdrop-blur-sm rounded-lg">
            <div className="text-xs text-white font-semibold mb-2">Radar Controls</div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-white">Speed:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={radarSpeed}
                  onChange={(e) => setRadarSpeed(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={radarSpeed}
                  onChange={(e) => setRadarSpeed(Number(e.target.value))}
                  className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-white">Fade Length:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="10"
                  max="180"
                  value={radarFadeLength}
                  onChange={(e) => setRadarFadeLength(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="10"
                  max="180"
                  value={radarFadeLength}
                  onChange={(e) => setRadarFadeLength(Number(e.target.value))}
                  className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Flower Controls */}
        {gradientType === 'flower' && (
          <div className="w-full mt-1 mb-0.5 p-2 bg-black/30 backdrop-blur-sm rounded-lg">
            <div className="text-xs text-white font-semibold mb-2">Flower Controls</div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-white">Circles:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={flowerCircles}
                  onChange={(e) => setFlowerCircles(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={flowerCircles}
                  onChange={(e) => setFlowerCircles(Number(e.target.value))}
                  className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-white">Scale:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={flowerScale}
                  onChange={(e) => setFlowerScale(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={flowerScale}
                  onChange={(e) => setFlowerScale(Number(e.target.value))}
                  className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-white">Rotation:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={flowerRotation}
                  onChange={(e) => setFlowerRotation(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="0"
                  max="360"
                  value={flowerRotation}
                  onChange={(e) => setFlowerRotation(Number(e.target.value))}
                  className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Conical Spiral Controls */}
        {gradientType === 'conical-spiral' && (
          <div className="w-full mt-1 mb-0.5 p-2 bg-[#2a2a4e] rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-white">Turns:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={conicalSpiralTurns}
                  onChange={(e) => setConicalSpiralTurns(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={conicalSpiralTurns}
                  onChange={(e) => setConicalSpiralTurns(Number(e.target.value))}
                  className="text-xs text-white w-10 text-right bg-transparent border border-white/20 rounded px-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-white">Tightness:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="0.1"
                  max="2"
                  step="0.1"
                  value={conicalSpiralTightness}
                  onChange={(e) => setConicalSpiralTightness(Number(e.target.value))}
                  className="flex-1"
                />
                      <input
                        type="number"
                        min="0.1"
                        max="2"
                        step="0.1"
                        value={conicalSpiralTightness}
                        onChange={(e) => setConicalSpiralTightness(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
              </div>
            </div>
          </div>
        )}

        </>

        )}
        
        {/* Effects Header */}
        <div className="w-full mb-0.5 flex gap-[3.5px]">
          <button
            onClick={() => setIsEffectsOpen(!isEffectsOpen)}
            className="px-1.5 py-1.5 rounded-lg text-xs transition-all bg-[#2a2a4e] text-white hover:bg-[#3a3a5e] font-semibold shadow-lg flex-1 flex items-center justify-between"
          >
            <span>Effects</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isEffectsOpen ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={randomizeEffects}
            className="w-[32px] px-1 py-1.5 rounded-lg text-xs transition-all bg-[#2a2a4e] text-white hover:bg-[#3a3a5e] font-semibold shadow-lg flex items-center justify-center"
            title="Shuffle Effects"
          >
            <Shuffle className="w-4 h-4" />
          </button>
        </div>
        
        {/* Effect Type Buttons - 2 Column Grid */}
        {isEffectsOpen && (
        <>
        {/* Top row with NO FX and MULTI FX */}
        <div className="w-full mb-0.5 flex gap-0.5">
          <button
            onClick={() => {
              setActiveEffects([]);
              setIsMultiFxMode(false);
            }}
            className={`flex-1 px-0.5 py-0.5 rounded text-xs transition-all whitespace-nowrap shadow-lg active:scale-100 ${
              activeEffects.length === 0 && !isMultiFxMode
                ? 'bg-green-600 text-white'
                : 'bg-[#2a2a4e] text-white hover:bg-[#3a3a5e]'
            }`}
          >
            NO FX
          </button>
          <button
            onClick={() => {
              setIsMultiFxMode(!isMultiFxMode);
              // When enabling MULTI FX mode, ensure NO FX is deactivated
              if (!isMultiFxMode && activeEffects.length === 0) {
                // Add a default effect or do nothing, just ensure it's not in NO FX state
              }
            }}
            className={`flex-1 px-0.5 py-0.5 rounded text-xs transition-all whitespace-nowrap shadow-lg active:scale-100 ${
              isMultiFxMode
                ? 'bg-green-600 text-white'
                : 'bg-[#2a2a4e] text-white hover:bg-[#3a3a5e]'
            }`}
          >
            MULTI FX
          </button>
        </div>
        <div className="w-full">
          <div className="grid grid-cols-2 gap-0.5" style={{ gridAutoFlow: 'column', gridTemplateRows: 'repeat(11, auto)' }}>
            {([
              { value: 'blur', label: 'Blur' },
              { value: 'bokeh', label: 'Bokeh' },
              { value: 'brightness', label: 'Brightness' },
              { value: 'charcoal', label: 'Saturate' },
              { value: 'chromatic', label: 'Chromatic' },
              { value: 'dither', label: 'Dither' },
              { value: 'duotone', label: 'Duotone' },
              { value: 'dust-scratches', label: 'Dust' },
              { value: 'fisheye', label: 'Fisheye' },
              { value: 'film-grain', label: 'Grain' },
              { value: 'grid', label: 'Grid' },
              { value: 'halftone', label: 'Halftone' },
              { value: 'invert', label: 'Invert' },
              { value: 'kaleidoscope', label: 'Kaleidoscope' },
              { value: 'pixelate', label: 'Pixelate' },
              { value: 'posterize', label: 'Posterize' },
              { value: 'color-shift', label: 'Shift' },
              { value: 'slit-scan', label: 'Slit-Scan' },
              { value: 'triangulate', label: 'Triangulate' },
              { value: 'vhs-glitch', label: 'VHS' },
              { value: 'vignette', label: 'Vignette' },
              { value: 'wave-distortion', label: 'Wave' },
            ] as { value: EffectType; label: string }[]).filter(e => e.value !== 'none').map((effect) => (
              <button
                key={effect.value}
                onClick={() => {
                  if (isMultiFxMode) {
                    // Multi-FX mode: toggle effects on/off
                    if (activeEffects.includes(effect.value)) {
                      setActiveEffects(activeEffects.filter(e => e !== effect.value));
                    } else {
                      setActiveEffects([...activeEffects, effect.value]);
                    }
                  } else {
                    // Single-FX mode: select only this effect
                    if (activeEffects.includes(effect.value) && activeEffects.length === 1) {
                      // If clicking the only active effect, clear it
                      setActiveEffects([]);
                    } else {
                      // Otherwise, set only this effect
                      setActiveEffects([effect.value]);
                    }
                  }
                }}
                className={`px-0.5 py-0.5 rounded text-xs transition-all whitespace-nowrap shadow-lg ${
                  activeEffects.includes(effect.value)
                    ? 'bg-purple-500 text-white'
                    : 'bg-black/30 text-white backdrop-blur-sm hover:bg-black/40'
                }`}
              >
                {effect.label}
              </button>
            ))}
          </div>
        </div>
        
        {activeEffects.length > 0 && activeEffects.some(effect => effect !== 'invert') && (
          <div className="w-full bg-black/40 backdrop-blur-sm px-3 py-2 rounded-lg mb-0.5">
            <div className="flex flex-col gap-1">
              {activeEffects.includes('kaleidoscope') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Kaleidoscope</div>
                  )}
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Segments:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="2"
                        max="50"
                        value={kaleidoscopeSegments}
                        onChange={(e) => setKaleidoscopeSegments(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="2"
                        max="50"
                        value={kaleidoscopeSegments}
                        onChange={(e) => setKaleidoscopeSegments(Number(e.target.value))}
                        className="text-xs text-white w-10 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                </>
              )}
              {activeEffects.includes('tile') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Tile</div>
                  )}
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Tiles:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="1"
                        max="64"
                        value={tileCount}
                        onChange={(e) => setTileCount(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="1"
                        max="64"
                        value={tileCount}
                        onChange={(e) => setTileCount(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                </>
              )}
              {activeEffects.includes('ripple') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Ripple</div>
                  )}
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Frequency:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="0.005"
                        max="0.05"
                        step="0.001"
                        value={rippleFrequency}
                        onChange={(e) => setRippleFrequency(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="0.005"
                        max="0.05"
                        step="0.001"
                        value={rippleFrequency}
                        onChange={(e) => setRippleFrequency(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Amplitude:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="5"
                        max="50"
                        value={rippleAmplitude}
                        onChange={(e) => setRippleAmplitude(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="5"
                        max="50"
                        value={rippleAmplitude}
                        onChange={(e) => setRippleAmplitude(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                </>
              )}
              {activeEffects.includes('pixelate') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Pixelate</div>
                  )}
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Size:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="5"
                        max="200"
                        value={pixelSize}
                        onChange={(e) => setPixelSize(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="5"
                        max="200"
                        value={pixelSize}
                        onChange={(e) => setPixelSize(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                </>
              )}
              {activeEffects.includes('triangulate') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Triangulate</div>
                  )}
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Size:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="10"
                        max="200"
                        value={triangleSize}
                        onChange={(e) => setTriangleSize(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="10"
                        max="200"
                        value={triangleSize}
                        onChange={(e) => setTriangleSize(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                </>
              )}
              {activeEffects.includes('chromatic') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Chromatic</div>
                  )}
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Offset:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="1"
                        max="200"
                        value={chromaticOffset}
                        onChange={(e) => setChromaticOffset(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={chromaticOffset}
                        onChange={(e) => setChromaticOffset(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                </>
              )}
              {activeEffects.includes('fisheye') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Fisheye</div>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs text-white whitespace-nowrap">Strength:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.1"
                        value={fisheyeStrength}
                        onChange={(e) => setFisheyeStrength(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={fisheyeStrength}
                        onChange={(e) => setFisheyeStrength(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                </>
              )}
              {activeEffects.includes('bloom') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Bloom</div>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs text-white whitespace-nowrap">Intensity:</label>
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.05"
                        value={bloomIntensity}
                        onChange={(e) => setBloomIntensity(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="0"
                        max="2"
                        step="0.05"
                        value={bloomIntensity}
                        onChange={(e) => setBloomIntensity(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                </>
              )}
              {activeEffects.includes('vignette') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Vignette</div>
                  )}
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Strength:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={vignetteStrength}
                        onChange={(e) => setVignetteStrength(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.05"
                        value={vignetteStrength}
                        onChange={(e) => setVignetteStrength(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                </>
              )}
              {activeEffects.includes('color-shift') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Shift</div>
                  )}
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Hue:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={colorShiftHue}
                        onChange={(e) => setColorShiftHue(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="0"
                        max="255"
                        value={colorShiftHue}
                        onChange={(e) => setColorShiftHue(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                </>
              )}
              {activeEffects.includes('film-grain') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Grain</div>
                  )}
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Intensity:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={grainIntensity}
                        onChange={(e) => setGrainIntensity(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        value={grainIntensity}
                        onChange={(e) => setGrainIntensity(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Type:</label>
                    <div className="flex gap-0.5 flex-1">
                      <button
                        onClick={() => setGrainType('fine')}
                        className={`flex-1 px-1 py-0.5 rounded text-[10px] transition-all ${
                          grainType === 'fine'
                            ? 'bg-white text-black'
                            : 'bg-black/30 text-white hover:bg-black/40'
                        }`}
                      >
                        Fine
                      </button>
                      <button
                        onClick={() => setGrainType('medium')}
                        className={`flex-1 px-1 py-0.5 rounded text-[10px] transition-all ${
                          grainType === 'medium'
                            ? 'bg-white text-black'
                            : 'bg-black/30 text-white hover:bg-black/40'
                        }`}
                      >
                        Med
                      </button>
                      <button
                        onClick={() => setGrainType('coarse')}
                        className={`flex-1 px-1 py-0.5 rounded text-[10px] transition-all ${
                          grainType === 'coarse'
                            ? 'bg-white text-black'
                            : 'bg-black/30 text-white hover:bg-black/40'
                        }`}
                      >
                        Coarse
                      </button>
                      <button
                        onClick={() => setGrainType('film')}
                        className={`flex-1 px-1 py-0.5 rounded text-[10px] transition-all ${
                          grainType === 'film'
                            ? 'bg-white text-black'
                            : 'bg-black/30 text-white hover:bg-black/40'
                        }`}
                      >
                        Film
                      </button>
                    </div>
                  </div>
                </>
              )}
              {activeEffects.includes('blur') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Blur</div>
                  )}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <label className="text-xs text-white whitespace-nowrap">Type:</label>
                    <div className="flex gap-0.5 flex-1">
                      <button
                        onClick={() => setBlurType('gaussian')}
                        className={`flex-1 px-1 py-0.5 rounded text-xs transition-all ${
                          blurType === 'gaussian'
                            ? 'bg-white text-black'
                            : 'bg-black/30 text-white hover:bg-black/40'
                        }`}
                      >
                        Gaussian
                      </button>
                      <button
                        onClick={() => setBlurType('motion')}
                        className={`flex-1 px-1 py-0.5 rounded text-xs transition-all ${
                          blurType === 'motion'
                            ? 'bg-white text-black'
                            : 'bg-black/30 text-white hover:bg-black/40'
                        }`}
                      >
                        Motion
                      </button>
                    </div>
                  </div>
                  {blurType === 'gaussian' && (
                    <div className="flex items-center justify-between gap-1">
                      <label className="text-xs text-white whitespace-nowrap">Amount:</label>
                      <div className="flex items-center gap-1 flex-1">
                        <input
                          type="range"
                          min="1"
                          max="50"
                          value={blurGaussianAmount}
                          onChange={(e) => setBlurGaussianAmount(Number(e.target.value))}
                          className="flex-1"
                        />
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={blurGaussianAmount}
                        onChange={(e) => setBlurGaussianAmount(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                      </div>
                    </div>
                  )}
                  {blurType === 'motion' && (
                    <>
                      <div className="flex items-center justify-between gap-1">
                        <label className="text-xs text-white whitespace-nowrap">Amount:</label>
                        <div className="flex items-center gap-1 flex-1">
                          <input
                            type="range"
                            min="1"
                            max="50"
                            value={blurMotionAmount}
                            onChange={(e) => setBlurMotionAmount(Number(e.target.value))}
                            className="flex-1"
                          />
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={blurMotionAmount}
                        onChange={(e) => setBlurMotionAmount(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <label className="text-xs text-white whitespace-nowrap">Direction:</label>
                        <div className="flex items-center gap-1 flex-1">
                          <div className="relative w-16 h-16 mx-auto">
                            <svg viewBox="0 0 100 100" className="w-full h-full">
                              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                              <circle cx="50" cy="50" r="40" fill="rgba(0,0,0,0.3)" />
                              <line
                                x1="50"
                                y1="50"
                                x2={50 + 35 * Math.cos((blurMotionDirection - 90) * Math.PI / 180)}
                                y2={50 + 35 * Math.sin((blurMotionDirection - 90) * Math.PI / 180)}
                                stroke="white"
                                strokeWidth="3"
                                strokeLinecap="round"
                              />
                              <circle
                                cx={50 + 35 * Math.cos((blurMotionDirection - 90) * Math.PI / 180)}
                                cy={50 + 35 * Math.sin((blurMotionDirection - 90) * Math.PI / 180)}
                                r="6"
                                fill="white"
                                style={{ cursor: 'pointer' }}
                              />
                            </svg>
                            <div
                              className="absolute inset-0 cursor-pointer"
                              onMouseDown={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const centerX = rect.left + rect.width / 2;
                                const centerY = rect.top + rect.height / 2;
                                
                                const updateDirection = (clientX: number, clientY: number) => {
                                  const angle = Math.atan2(clientY - centerY, clientX - centerX) * 180 / Math.PI + 90;
                                  setBlurMotionDirection((angle + 360) % 360);
                                };

                                updateDirection(e.clientX, e.clientY);

                                const handleMouseMove = (e: MouseEvent) => {
                                  updateDirection(e.clientX, e.clientY);
                                };

                                const handleMouseUp = () => {
                                  document.removeEventListener('mousemove', handleMouseMove);
                                  document.removeEventListener('mouseup', handleMouseUp);
                                };

                                document.addEventListener('mousemove', handleMouseMove);
                                document.addEventListener('mouseup', handleMouseUp);
                              }}
                            />
                          </div>
                          <span className="text-xs text-white w-12 text-right">{Math.round(blurMotionDirection)}°</span>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
              {activeEffects.includes('posterize') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Posterize</div>
                  )}
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Levels:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="2"
                        max="16"
                        value={posterizeLevels}
                        onChange={(e) => setPosterizeLevels(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="2"
                        max="16"
                        value={posterizeLevels}
                        onChange={(e) => setPosterizeLevels(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                </>
              )}
              {activeEffects.includes('halftone') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Halftone</div>
                  )}
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Dot Size:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="2"
                        max="200"
                        value={halftoneSize}
                        onChange={(e) => setHalftoneSize(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="2"
                        max="200"
                        value={halftoneSize}
                        onChange={(e) => setHalftoneSize(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Variation:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={halftoneVariation}
                        onChange={(e) => setHalftoneVariation(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        value={halftoneVariation}
                        onChange={(e) => setHalftoneVariation(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Move:</label>
                    <button
                      onClick={() => setHalftoneMove(!halftoneMove)}
                      className={`px-2 py-1 text-xs rounded transition-all ${
                        halftoneMove
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-700 text-white hover:bg-gray-600'
                      }`}
                    >
                      {halftoneMove ? 'ON' : 'OFF'}
                    </button>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="0.1"
                        max="10"
                        step="0.1"
                        value={halftoneMoveSpeed}
                        onChange={(e) => setHalftoneMoveSpeed(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="0.1"
                        max="10"
                        step="0.1"
                        value={halftoneMoveSpeed}
                        onChange={(e) => setHalftoneMoveSpeed(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                </>
              )}
              {activeEffects.includes('bulge') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Bulge</div>
                  )}
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Strength:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={bulgeStrength}
                        onChange={(e) => setBulgeStrength(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.05"
                        value={bulgeStrength}
                        onChange={(e) => setBulgeStrength(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                </>
              )}
              {activeEffects.includes('charcoal') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Saturate</div>
                  )}
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Intensity:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={charcoalIntensity}
                        onChange={(e) => setCharcoalIntensity(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.05"
                        value={charcoalIntensity}
                        onChange={(e) => setCharcoalIntensity(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                </>
              )}
              
              
              {activeEffects.includes('crackle') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Crackle</div>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs text-white whitespace-nowrap">Intensity:</label>
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={crackleIntensity}
                        onChange={(e) => setCrackleIntensity(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.05"
                        value={crackleIntensity}
                        onChange={(e) => setCrackleIntensity(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                </>
              )}

              {activeEffects.includes('crystallize') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Crystallize</div>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs text-white whitespace-nowrap">Size:</label>
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="range"
                        min="5"
                        max="50"
                        value={crystallizeSize}
                        onChange={(e) => setCrystallizeSize(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="5"
                        max="50"
                        value={crystallizeSize}
                        onChange={(e) => setCrystallizeSize(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                </>
              )}
              
              {activeEffects.includes('displacement') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Displacement</div>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs text-white whitespace-nowrap">Strength:</label>
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="range"
                      min="5"
                      max="50"
                      value={displacementStrength}
                      onChange={(e) => setDisplacementStrength(Number(e.target.value))}
                      className="flex-1"
                    />
                      <input
                        type="number"
                        min="5"
                        max="50"
                        value={displacementStrength}
                        onChange={(e) => setDisplacementStrength(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                  </div>
                </div>
                </>
              )}
              {activeEffects.includes('duotone') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Duotone</div>
                  )}
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Intensity:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={duotoneIntensity}
                        onChange={(e) => setDuotoneIntensity(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.05"
                        value={duotoneIntensity}
                        onChange={(e) => setDuotoneIntensity(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Color 1:</label>
                    <input
                      type="color"
                      value={duotoneColor1}
                      onChange={(e) => setDuotoneColor1(e.target.value)}
                      className="w-12 h-6 rounded cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Color 2:</label>
                    <input
                      type="color"
                      value={duotoneColor2}
                      onChange={(e) => setDuotoneColor2(e.target.value)}
                      className="w-12 h-6 rounded cursor-pointer"
                    />
                  </div>
                </>
              )}
              {activeEffects.includes('dust-scratches') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Dust</div>
                  )}
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Dust:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={dustIntensity}
                        onChange={(e) => setDustIntensity(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.05"
                        value={dustIntensity}
                        onChange={(e) => setDustIntensity(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Crackle:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={dustCrackleIntensity}
                        onChange={(e) => setDustCrackleIntensity(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.05"
                        value={dustCrackleIntensity}
                        onChange={(e) => setDustCrackleIntensity(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                </>
              )}
              {activeEffects.includes('fabric-weave') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Fabric Weave</div>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs text-white whitespace-nowrap">Scale:</label>
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="range"
                      min="5"
                      max="30"
                      value={fabricScale}
                      onChange={(e) => setFabricScale(Number(e.target.value))}
                      className="flex-1"
                    />
                      <input
                        type="number"
                        min="5"
                        max="30"
                        value={fabricScale}
                        onChange={(e) => setFabricScale(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                  </div>
                </div>
                </>
              )}
              {activeEffects.includes('gradient-map') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Gradient Map</div>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs text-white whitespace-nowrap">Intensity:</label>
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={gradientMapIntensity}
                      onChange={(e) => setGradientMapIntensity(Number(e.target.value))}
                      className="flex-1"
                    />
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.05"
                        value={gradientMapIntensity}
                        onChange={(e) => setGradientMapIntensity(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                  </div>
                </div>
                </>
              )}
              {activeEffects.includes('grid-overlay') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Grid Overlay</div>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs text-white whitespace-nowrap">Size:</label>
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={gridSize}
                      onChange={(e) => setGridSize(Number(e.target.value))}
                      className="flex-1"
                    />
                      <input
                        type="number"
                        min="10"
                        max="100"
                        value={gridSize}
                        onChange={(e) => setGridSize(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                  </div>
                </div>
                </>
              )}
              {activeEffects.includes('grid') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Grid</div>
                  )}
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Sides:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={gridSides}
                        onChange={(e) => setGridSides(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={gridSides}
                        onChange={(e) => setGridSides(Number(e.target.value))}
                        className="text-xs text-white w-8 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Rows:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="1"
                        max="50"
                        value={gridRows}
                        onChange={(e) => setGridRows(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={gridRows}
                        onChange={(e) => setGridRows(Number(e.target.value))}
                        className="text-xs text-white w-8 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Columns:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="1"
                        max="50"
                        value={gridColumns}
                        onChange={(e) => setGridColumns(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={gridColumns}
                        onChange={(e) => setGridColumns(Number(e.target.value))}
                        className="text-xs text-white w-8 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                  {/* Grid Effect Shape Size Control */}
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white/80 whitespace-nowrap">Size:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min={1}
                        max={100}
                        step={1}
                        value={gridShapeSize}
                        onChange={(e) => setGridShapeSize(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={gridShapeSize}
                        onChange={(e) => setGridShapeSize(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Variation:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={gridVariation}
                        onChange={(e) => setGridVariation(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        value={gridVariation}
                        onChange={(e) => setGridVariation(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Rotate:</label>
                    <div className="flex gap-0.5 flex-1">
                      <button
                        onClick={() => setGridRotationDirection('none')}
                        className={`flex-1 px-1 py-0.5 rounded text-[10px] transition-all ${
                          gridRotationDirection === 'none'
                            ? 'bg-white text-black'
                            : 'bg-black/30 text-white hover:bg-black/40'
                        }`}
                      >
                        OFF
                      </button>
                      <button
                        onClick={() => setGridRotationDirection('clockwise')}
                        className={`flex-1 px-1 py-0.5 rounded text-[10px] transition-all ${
                          gridRotationDirection === 'clockwise'
                            ? 'bg-white text-black'
                            : 'bg-black/30 text-white hover:bg-black/40'
                        }`}
                      >
                        ⟳
                      </button>
                      <button
                        onClick={() => setGridRotationDirection('counterclockwise')}
                        className={`flex-1 px-1 py-0.5 rounded text-[10px] transition-all ${
                          gridRotationDirection === 'counterclockwise'
                            ? 'bg-white text-black'
                            : 'bg-black/30 text-white hover:bg-black/40'
                        }`}
                      >
                        ⟲
                      </button>
                    </div>
                  </div>
                </>
              )}
              {activeEffects.includes('impressionist') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Impressionist</div>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs text-white whitespace-nowrap">Brush Size:</label>
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="range"
                      min="2"
                      max="15"
                      value={impressionistBrushSize}
                      onChange={(e) => setImpressionistBrushSize(Number(e.target.value))}
                      className="flex-1"
                    />
                      <input
                        type="number"
                        min="2"
                        max="15"
                        value={impressionistBrushSize}
                        onChange={(e) => setImpressionistBrushSize(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                  </div>
                </div>
                </>
              )}
              {activeEffects.includes('ink-wash') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Ink Wash</div>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs text-white whitespace-nowrap">Intensity:</label>
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={inkWashIntensity}
                      onChange={(e) => setInkWashIntensity(Number(e.target.value))}
                      className="flex-1"
                    />
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.05"
                        value={inkWashIntensity}
                        onChange={(e) => setInkWashIntensity(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                  </div>
                </div>
                </>
              )}
              {activeEffects.includes('lens-flare') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Lens Flare</div>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs text-white whitespace-nowrap">Intensity:</label>
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={lensFlareIntensity}
                        onChange={(e) => setLensFlareIntensity(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.05"
                        value={lensFlareIntensity}
                        onChange={(e) => setLensFlareIntensity(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs text-white whitespace-nowrap">Size:</label>
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="range"
                        min="50"
                        max="800"
                        step="10"
                        value={lensFlareSize}
                        onChange={(e) => setLensFlareSize(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="50"
                        max="800"
                        step="10"
                        value={lensFlareSize}
                        onChange={(e) => setLensFlareSize(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs text-white whitespace-nowrap">Position:</label>
                    <button
                      onClick={() => {
                        // Click to reposition the lens flare - similar to freeform pins
                        const canvas = canvasRef.current;
                        if (!canvas) return;
                        
                        const handleClick = (e: MouseEvent) => {
                          e.stopPropagation();
                          const rect = canvas.getBoundingClientRect();
                          const x = (e.clientX - rect.left) / rect.width;
                          const y = (e.clientY - rect.top) / rect.height;
                          setLensFlareX(Math.max(0, Math.min(1, x)));
                          setLensFlareY(Math.max(0, Math.min(1, y)));
                          canvas.removeEventListener('click', handleClick);
                          canvas.style.cursor = 'grab';
                        };
                        
                        canvas.style.cursor = 'crosshair';
                        canvas.addEventListener('click', handleClick, { once: true });
                      }}
                      className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs text-white flex-1"
                    >
                      Click to Position
                    </button>
                  </div>
                </>
              )}

              {activeEffects.includes('mandala') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Mandala</div>
                  )}
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Segments:</label>
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      type="range"
                      min="4"
                      max="16"
                      value={mandalaSegments}
                      onChange={(e) => setMandalaSegments(Number(e.target.value))}
                      className="flex-1"
                    />
                      <input
                        type="number"
                        min="4"
                        max="16"
                        value={mandalaSegments}
                        onChange={(e) => setMandalaSegments(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                  </div>
                </div>
                </>
              )}
              {activeEffects.includes('mosaic') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Mosaic</div>
                  )}
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Size:</label>
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      type="range"
                      min="5"
                      max="40"
                      value={mosaicSize}
                      onChange={(e) => setMosaicSize(Number(e.target.value))}
                      className="flex-1"
                    />
                      <input
                        type="number"
                        min="5"
                        max="40"
                        value={mosaicSize}
                        onChange={(e) => setMosaicSize(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                  </div>
                </div>
                </>
              )}
              {activeEffects.includes('oil-paint') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Oil Paint</div>
                  )}
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Radius:</label>
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={oilPaintRadius}
                      onChange={(e) => setOilPaintRadius(Number(e.target.value))}
                      className="flex-1"
                    />
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={oilPaintRadius}
                        onChange={(e) => setOilPaintRadius(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                  </div>
                </div>
                </>
              )}
              {activeEffects.includes('palette-knife') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Palette Knife</div>
                  )}
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Size:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="2"
                        max="15"
                        value={paletteKnifeSize}
                        onChange={(e) => setPaletteKnifeSize(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="2"
                        max="15"
                        value={paletteKnifeSize}
                        onChange={(e) => setPaletteKnifeSize(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                </>
              )}
              {activeEffects.includes('paper-texture') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Paper Texture</div>
                  )}
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Intensity:</label>
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={paperTextureIntensity}
                      onChange={(e) => setPaperTextureIntensity(Number(e.target.value))}
                      className="flex-1"
                    />
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.05"
                        value={paperTextureIntensity}
                        onChange={(e) => setPaperTextureIntensity(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                  </div>
                </div>
                </>
              )}
              {activeEffects.includes('pastel') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Pastel</div>
                  )}
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Intensity:</label>
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={pastelIntensity}
                      onChange={(e) => setPastelIntensity(Number(e.target.value))}
                      className="flex-1"
                    />
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.05"
                        value={pastelIntensity}
                        onChange={(e) => setPastelIntensity(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                  </div>
                </div>
                </>
              )}
              
              
              
              {activeEffects.includes('shatter') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Shatter</div>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs text-white whitespace-nowrap">Size:</label>
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={shatterSize}
                        onChange={(e) => setShatterSize(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="10"
                        max="100"
                        value={shatterSize}
                        onChange={(e) => setShatterSize(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                </>
              )}
              
              {activeEffects.includes('stipple') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Stipple</div>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs text-white whitespace-nowrap">Size:</label>
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={stippleSize}
                        onChange={(e) => setStippleSize(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={stippleSize}
                        onChange={(e) => setStippleSize(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                </>
              )}
              {activeEffects.includes('swirl') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Swirl</div>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs text-white whitespace-nowrap">Strength:</label>
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="range"
                        min="0"
                        max="3"
                        step="0.1"
                        value={swirlStrength}
                        onChange={(e) => setSwirlStrength(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="0"
                        max="3"
                        step="0.1"
                        value={swirlStrength}
                        onChange={(e) => setSwirlStrength(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                </>
              )}
              {activeEffects.includes('triangular-grid') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Triangular Grid</div>
                  )}
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Size:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="10"
                        max="80"
                        value={triGridSize}
                        onChange={(e) => setTriGridSize(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="10"
                        max="80"
                        value={triGridSize}
                        onChange={(e) => setTriGridSize(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                </>
              )}
              {activeEffects.includes('tritone') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Tritone</div>
                  )}
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Intensity:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={tritoneIntensity}
                        onChange={(e) => setTritoneIntensity(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.05"
                        value={tritoneIntensity}
                        onChange={(e) => setTritoneIntensity(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={tritoneColor1}
                      onChange={(e) => setTritoneColor1(e.target.value)}
                      className="flex-1 h-8 rounded cursor-pointer"
                    />
                    <input
                      type="color"
                      value={tritoneColor2}
                      onChange={(e) => setTritoneColor2(e.target.value)}
                      className="flex-1 h-8 rounded cursor-pointer"
                    />
                    <input
                      type="color"
                      value={tritoneColor3}
                      onChange={(e) => setTritoneColor3(e.target.value)}
                      className="flex-1 h-8 rounded cursor-pointer"
                    />
                  </div>
                </>
              )}
              {activeEffects.includes('vhs-glitch') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">VHS</div>
                  )}
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Intensity:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={vhsGlitchIntensity}
                        onChange={(e) => setVhsGlitchIntensity(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.05"
                        value={vhsGlitchIntensity}
                        onChange={(e) => setVhsGlitchIntensity(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                </>
              )}
              {activeEffects.includes('tape-hiss') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Tape Hiss</div>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs text-white whitespace-nowrap">Tape Hiss:</label>
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={tapeHissIntensity}
                        onChange={(e) => setTapeHissIntensity(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.05"
                        value={tapeHissIntensity}
                        onChange={(e) => setTapeHissIntensity(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                </>
              )}
              {activeEffects.includes('wave-distortion') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Wave</div>
                  )}
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Strength:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="5"
                        max="100"
                        value={waveDistortionStrength}
                        onChange={(e) => setWaveDistortionStrength(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="5"
                        max="100"
                        value={waveDistortionStrength}
                        onChange={(e) => setWaveDistortionStrength(Number(e.target.value))}
                        className="text-xs text-white w-8 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Rotation:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <div className="relative w-16 h-16 mx-auto">
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                          <circle cx="50" cy="50" r="40" fill="rgba(0,0,0,0.3)" />
                          <line
                            x1="50"
                            y1="50"
                            x2={50 + 35 * Math.cos((waveDistortionRotation - 90) * Math.PI / 180)}
                            y2={50 + 35 * Math.sin((waveDistortionRotation - 90) * Math.PI / 180)}
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                        <input
                          type="range"
                          min="0"
                          max="360"
                          value={waveDistortionRotation}
                          onChange={(e) => setWaveDistortionRotation(Number(e.target.value))}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          style={{ WebkitAppearance: 'none' }}
                        />
                      </div>
                      <input
                        type="number"
                        min="0"
                        max="360"
                        value={waveDistortionRotation}
                        onChange={(e) => setWaveDistortionRotation(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                </>
              )}
              {activeEffects.includes('bokeh') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Bokeh</div>
                  )}
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Blur Size:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="5"
                        max="50"
                        value={bokehSize}
                        onChange={(e) => setBokehSize(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="5"
                        max="50"
                        value={bokehSize}
                        onChange={(e) => setBokehSize(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Intensity:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={bokehIntensity}
                        onChange={(e) => setBokehIntensity(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.05"
                        value={bokehIntensity}
                        onChange={(e) => setBokehIntensity(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Colorize:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={bokehColorize}
                        onChange={(e) => setBokehColorize(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.05"
                        value={bokehColorize}
                        onChange={(e) => setBokehColorize(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                </>
              )}
              {activeEffects.includes('brightness') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Brightness</div>
                  )}
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Amount:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="-1"
                        max="1"
                        step="0.05"
                        value={brightnessAmount}
                        onChange={(e) => setBrightnessAmount(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="-1"
                        max="1"
                        step="0.05"
                        value={brightnessAmount}
                        onChange={(e) => setBrightnessAmount(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                </>
              )}
              {activeEffects.includes('slit-scan') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Slit-Scan</div>
                  )}
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Direction:</label>
                    <div className="flex gap-1 flex-1">
                      <button
                        onClick={() => setSlitScanDirection('horizontal')}
                        className={`px-2 py-0.5 rounded text-xs transition-all ${
                          slitScanDirection === 'horizontal'
                            ? 'bg-purple-500 text-white'
                            : 'bg-black/30 text-white hover:bg-black/40'
                        }`}
                      >
                        Horiz
                      </button>
                      <button
                        onClick={() => setSlitScanDirection('vertical')}
                        className={`px-2 py-0.5 rounded text-xs transition-all ${
                          slitScanDirection === 'vertical'
                            ? 'bg-purple-500 text-white'
                            : 'bg-black/30 text-white hover:bg-black/40'
                        }`}
                      >
                        Vert
                      </button>
                      <button
                        onClick={() => setSlitScanDirection('radial')}
                        className={`px-2 py-0.5 rounded text-xs transition-all ${
                          slitScanDirection === 'radial'
                            ? 'bg-purple-500 text-white'
                            : 'bg-black/30 text-white hover:bg-black/40'
                        }`}
                      >
                        Radial
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Intensity:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={slitScanIntensity}
                        onChange={(e) => setSlitScanIntensity(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={slitScanIntensity}
                        onChange={(e) => setSlitScanIntensity(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                </>
              )}
              {activeEffects.includes('dither') && (
                <>
                  {isMultiFxMode && activeEffects.length > 1 && (
                    <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Dither</div>
                  )}
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Type:</label>
                    <div className="flex gap-1 flex-1">
                      <button
                        onClick={() => setDitherType('bayer')}
                        className={`px-2 py-0.5 rounded text-xs transition-all ${
                          ditherType === 'bayer'
                            ? 'bg-purple-500 text-white'
                            : 'bg-black/30 text-white hover:bg-black/40'
                        }`}
                      >
                        Bayer
                      </button>
                      <button
                        onClick={() => setDitherType('floyd-steinberg')}
                        className={`px-2 py-0.5 rounded text-xs transition-all ${
                          ditherType === 'floyd-steinberg'
                            ? 'bg-purple-500 text-white'
                            : 'bg-black/30 text-white hover:bg-black/40'
                        }`}
                      >
                        Floyd-Steinberg
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-xs text-white whitespace-nowrap">Levels:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="2"
                        max="16"
                        step="1"
                        value={ditherLevels}
                        onChange={(e) => setDitherLevels(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="2"
                        max="16"
                        step="1"
                        value={ditherLevels}
                        onChange={(e) => setDitherLevels(Number(e.target.value))}
                        className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        
        </>
        )}
        
        {/* Audiovisuals Section */}
        <div className="w-full mb-0.5 flex gap-[3.5px]">
          {/* Mic button + device chevron */}
          <div className={`flex flex-1 items-center px-1.5 py-1.5 rounded-lg text-xs font-semibold shadow-lg gap-1 transition-all ${isMicActive ? 'bg-purple-500 text-white' : 'bg-[#2a2a4e] text-white hover:bg-[#3a3a5e]'}`}>
            <button
              onClick={() => isMicActive ? stopMicVisualization() : startMicVisualization(selectedAudioDeviceId)}
              className="flex items-center justify-center flex-1"
              title={isMicActive ? 'Microphone ON' : 'Microphone OFF'}
            >
              {isMicActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>
            {audioInputDevices.length > 0 && (
              <div className="relative flex items-center">
                <select
                  value={selectedAudioDeviceId}
                  onChange={(e) => {
                    setSelectedAudioDeviceId(e.target.value);
                    if (isMicActive) {
                      stopMicVisualization();
                      setTimeout(() => startMicVisualization(e.target.value), 100);
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full"
                >
                  {audioInputDevices.map(d => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Microphone ${d.deviceId.slice(0, 6)}`}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 pointer-events-none" />
              </div>
            )}
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-1.5 py-1.5 rounded-lg text-xs transition-all bg-[#2a2a4e] text-white hover:bg-[#3a3a5e] font-semibold shadow-lg flex items-center gap-1"
            title="Load Audio File"
          >
            <span>Audio</span>
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsAudioControlsOpen(!isAudioControlsOpen)}
            className="px-1.5 py-1.5 rounded-lg text-xs transition-all bg-[#2a2a4e] text-white hover:bg-[#3a3a5e] font-semibold shadow-lg flex items-center gap-1"
            title="Audio Controls"
          >
            <SlidersHorizontal className="w-6 h-4" />
            <ChevronDown className={`w-4 h-4 transition-transform ${isAudioControlsOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {isAudioControlsOpen && (
          <div className="w-full bg-black/40 backdrop-blur-sm px-3 py-2 rounded-lg mb-0.5 overflow-hidden">
              <div className="flex flex-col gap-3">

                {/* Vibe Presets */}
                <div className="flex gap-1">
                  {[
                    { label: `Subtle`, bass: 0.4, mids: 0.3, treble: 0.3, smooth: 0.92, thresh: 0.1, master: 0.6 },
                    { label: `Balanced`, bass: 1, mids: 1, treble: 1, smooth: 0.8, thresh: 0.05, master: 1 },
                    { label: `Energetic`, bass: 1.6, mids: 1.4, treble: 1.2, smooth: 0.5, thresh: 0.02, master: 1.5 },
                    { label: `Extreme`, bass: 2, mids: 2, treble: 2, smooth: 0.2, thresh: 0, master: 2.5 },
                  ].map(v => (
                    <button key={v.label} onClick={() => {
                      setBassMultiplier(v.bass); setMidsMultiplier(v.mids); setTrebleMultiplier(v.treble);
                      setBassSmoothing(v.smooth); setMidsSmoothing(v.smooth); setTrebleSmoothing(v.smooth);
                      setBassThreshold(v.thresh); setMidsThreshold(v.thresh); setTrebleThreshold(v.thresh);
                      setMasterSensitivity(v.master);
                    }} className="flex-1 py-1 rounded text-[10px] font-semibold bg-[#2a2a4e] text-white/70 hover:bg-[#3a3a6e] hover:text-white transition-colors">
                      {v.label}
                    </button>
                  ))}
                </div>

                {/* Intensity */}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-white/70 whitespace-nowrap flex-shrink-0">Intensity</label>
                  <input type="range" min="0.1" max="3" step="0.05" value={masterSensitivity} onChange={(e) => setMasterSensitivity(Number(e.target.value))} className="flex-1 min-w-0" />
                  <span className="text-xs text-white/50 w-6 text-right flex-shrink-0">{masterSensitivity.toFixed(1)}</span>
                  <span className={`text-[10px] font-mono w-16 text-right flex-shrink-0 transition-colors ${bpmFlash ? 'text-yellow-300' : 'text-white/40'}`}>{bpm > 0 ? `${bpm} BPM` : '– BPM'}</span>
                </div>

                {/* 3-column band cards */}
                <div className="flex gap-2 items-start overflow-hidden">

                  {/* Shape = Bass */}
                  <div className={`flex flex-col items-center gap-1.5 w-0 flex-1 min-w-0 rounded-lg p-2 transition-all ${bassBeatSync && bassFlash ? 'ring-2 ring-yellow-400 bg-yellow-400/10' : 'bg-[#1a1a3e]'}`}>
                    <div className="w-full relative">
                      <div className="w-full bg-black/40 rounded overflow-hidden" style={{height: '40px'}}>
                        <div className="w-full rounded transition-none absolute bottom-0" style={{height: `${Math.min(100, liveBassLevel * 100)}%`, background: `hsl(${220 - liveBassLevel * 180}, 90%, ${45 + liveBassLevel * 25}%)`}} />
                      </div>
                      <span className="absolute top-0.5 right-1 text-[9px] font-mono text-white/60">{liveBassLevel.toFixed(2)}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-white/80">Shape</span>
                    <input type="range" min="0" max="2" step="0.1" value={bassMultiplier} onChange={(e) => setBassMultiplier(Number(e.target.value))} className="w-full" />
                    <button onClick={() => setBassBeatSync(!bassBeatSync)} className={`w-full py-0.5 rounded text-[9px] font-bold transition-all ${bassBeatSync ? 'bg-yellow-500 text-black' : 'bg-[#2a2a4e] text-white/40 hover:text-white/70'}`}>BEAT</button>
                  </div>

                  {/* Motion = Mids */}
                  <div className={`flex flex-col items-center gap-1.5 w-0 flex-1 min-w-0 rounded-lg p-2 transition-all ${midsBeatSync && midsFlash ? 'ring-2 ring-yellow-400 bg-yellow-400/10' : 'bg-[#1a1a3e]'}`}>
                    <div className="w-full relative">
                      <div className="w-full bg-black/40 rounded overflow-hidden" style={{height: '40px'}}>
                        <div className="w-full rounded transition-none absolute bottom-0" style={{height: `${Math.min(100, liveMidsLevel * 100)}%`, background: `hsl(${280 - liveMidsLevel * 100}, 80%, ${45 + liveMidsLevel * 25}%)`}} />
                      </div>
                      <span className="absolute top-0.5 right-1 text-[9px] font-mono text-white/60">{liveMidsLevel.toFixed(2)}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-white/80">Motion</span>
                    <input type="range" min="0" max="2" step="0.1" value={midsMultiplier} onChange={(e) => setMidsMultiplier(Number(e.target.value))} className="w-full" />
                    <button onClick={() => setMidsBeatSync(!midsBeatSync)} className={`w-full py-0.5 rounded text-[9px] font-bold transition-all ${midsBeatSync ? 'bg-yellow-500 text-black' : 'bg-[#2a2a4e] text-white/40 hover:text-white/70'}`}>BEAT</button>
                  </div>

                  {/* Color = Treble */}
                  <div className={`flex flex-col items-center gap-1.5 w-0 flex-1 min-w-0 rounded-lg p-2 transition-all ${trebleBeatSync && trebleFlash ? 'ring-2 ring-yellow-400 bg-yellow-400/10' : 'bg-[#1a1a3e]'}`}>
                    <div className="w-full relative">
                      <div className="w-full bg-black/40 rounded overflow-hidden" style={{height: '40px'}}>
                        <div className="w-full rounded transition-none absolute bottom-0" style={{height: `${Math.min(100, liveTrebleLevel * 100)}%`, background: `hsl(${340 - liveTrebleLevel * 60}, 85%, ${45 + liveTrebleLevel * 25}%)`}} />
                      </div>
                      <span className="absolute top-0.5 right-1 text-[9px] font-mono text-white/60">{liveTrebleLevel.toFixed(2)}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-white/80">Color</span>
                    <input type="range" min="0" max="2" step="0.1" value={trebleMultiplier} onChange={(e) => { const v = Number(e.target.value); setTrebleMultiplier(v); setColorShiftHue(Math.round(v * 127.5)); }} className="w-full" />
                    <button onClick={() => setTrebleBeatSync(!trebleBeatSync)} className={`w-full py-0.5 rounded text-[9px] font-bold transition-all ${trebleBeatSync ? 'bg-yellow-500 text-black' : 'bg-[#2a2a4e] text-white/40 hover:text-white/70'}`}>BEAT</button>
                  </div>
                </div>
              </div>
            </div>
        )}
        
        {/* Presets Controls */}
        <div className="flex gap-[3.5px] w-full mb-0.5">
          <button
            onClick={() => setIsPresetsDropdownOpen(!isPresetsDropdownOpen)}
            className="flex-1 px-1.5 py-1.5 rounded-lg text-xs transition-all bg-[#2a2a4e] text-white hover:bg-[#3a3a5e] flex items-center justify-between font-semibold"
          >
            <span>Presets</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isPresetsDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          <button
            onClick={() => setIsPresetModalOpen(true)}
            className="w-[32px] px-1 py-1.5 rounded-lg text-xs transition-all bg-[#2a2a4e] text-white hover:bg-[#3a3a5e] font-semibold shadow-lg flex items-center justify-center"
            title="Add Preset"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Presets Dropdown Content */}
        {isPresetsDropdownOpen && (
          <div className="w-full bg-[#2a2a4e] rounded-lg overflow-hidden mb-0.5 max-h-[300px] overflow-y-auto">
            {savedPresets.length === 0 ? (
              <div className="px-4 py-2 text-xs text-white/50 italic">
                No saved presets
              </div>
            ) : (
              savedPresets.map((preset, index) => (
                <div key={index} className="flex items-center w-full group">
                  {renamingPresetIndex === index ? (
                    <input
                      autoFocus
                      value={renamingPresetValue}
                      onChange={(e) => setRenamingPresetValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { renamePreset(index, renamingPresetValue); setRenamingPresetIndex(null); }
                        if (e.key === 'Escape') setRenamingPresetIndex(null);
                      }}
                      onBlur={() => { renamePreset(index, renamingPresetValue); setRenamingPresetIndex(null); }}
                      className="flex-1 px-4 py-2 text-xs bg-[#1a1a3e] text-white focus:outline-none border-b border-purple-500"
                    />
                  ) : (
                    <button
                      onClick={() => { loadPreset(preset); setIsPresetsDropdownOpen(false); }}
                      className="flex-1 px-4 py-2 text-xs text-white hover:bg-[#3a3a5e] text-left transition-colors font-semibold truncate"
                    >
                      {preset.name}
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenamingPresetIndex(index);
                      setRenamingPresetValue(preset.name);
                    }}
                    className="px-2 py-2 text-white/30 hover:text-white/80 hover:bg-[#3a3a5e] transition-colors text-xs flex-shrink-0"
                    title="Rename preset"
                  >
                    ✎
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deletePreset(index); }}
                    className="px-2 py-2 text-white/50 hover:text-red-400 hover:bg-[#3a3a5e] transition-colors text-sm font-bold flex-shrink-0"
                    title="Delete preset"
                  >
                    −
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Audio Waveform Display - shown when audio file is loaded */}
        {audioFileName && waveformData.length > 0 && (
          <div className="w-full mb-0.5 bg-black/40 backdrop-blur-sm rounded-lg px-1.5 py-3">
            {/* Waveform Visualization */}
            <div className="w-full h-5 mb-0.5 flex items-center justify-between gap-0.5 relative">
              {/* Center line */}
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-white/20"></div>
              </div>
              {waveformData.map((amplitude, index) => {
                const height = Math.max(1, amplitude * 17.5); // Scale to fit with room at top
                const hue = (index / waveformData.length) * 360; // Rainbow gradient
                return (
                  <div
                    key={index}
                    className="flex-1 relative flex items-center justify-center"
                  >
                    <div
                      className="w-full rounded-sm"
                      style={{
                        height: `${height}px`,
                        background: `linear-gradient(to top, hsl(${hue}, 80%, 60%), hsl(${hue}, 90%, 70%))`,
                        opacity: 0.8
                      }}
                    />
                  </div>
                );
              })}
            </div>
            
            {/* Audio File Info */}
            <div className="flex items-center justify-between gap-1">
              <div className="flex-1 min-w-0">
                <div className="text-white text-[9px] font-semibold truncate leading-tight">
                  {audioFileName}
                </div>
                {audioFileMetadata && (
                  <div className="text-white/60 text-[8px] leading-tight">
                    {(audioFileMetadata.sampleRate / 1000).toFixed(1)} kHz • {Math.floor(audioFileMetadata.duration / 60)}:{String(Math.floor(audioFileMetadata.duration % 60)).padStart(2, '0')}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
      </div>
      {audioFile && (
        <audio
          ref={audioRef}
          src={audioFile}
          loop
        />
      )}
      
    </div>
  );
}
