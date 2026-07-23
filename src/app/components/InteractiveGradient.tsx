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
import { useEffect, useRef, useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { CaretDown, Eye, EyeSlash, ArrowUUpLeft, ArrowUUpRight, Shuffle, Plus, ArrowsClockwise, Palette, Gradient, MagicWand, SpeakerHigh, SpeakerSlash, Bookmark, Camera, Gif, FloppyDisk, X, Circle, Play, Pause, Rewind, FastForward, ArrowClockwise } from '@phosphor-icons/react';
import { useAudioReactivity } from '../hooks/useAudioReactivity';
import { useVCRPlayback } from '../hooks/useVCRPlayback';
import { useGifExport } from '../hooks/useGifExport';
import { usePresets } from '../hooks/usePresets';
import { useAuth } from '../hooks/useAuth';
import { VCRControls } from './VCRControls';
import { ColorTab } from './ColorTab';
import { GradientsTab } from './GradientsTab';
import { EffectsTab } from './EffectsTab';
import { useRandomization } from '../hooks/useRandomization';
import { useWavGesture } from '../hooks/useWavGesture';
import { Divider } from './Divider';
import { decodePresetData } from '../utils/presetShare';
import { useSnapshot } from '../hooks/useSnapshot';
import { useCanvasDraw } from '../hooks/useCanvasDraw';
const AudioPanel = lazy(() => import('./AudioPanel').then((m) => ({ default: m.AudioPanel })));
const PresetsPanel = lazy(() => import('./PresetsPanel').then((m) => ({ default: m.PresetsPanel })));
import {
  type ColorRGB, type GradientType, type EffectType,
  DEFAULT_COLORS, DEG_TO_RAD, TWO_PI,
  ID_MIGRATIONS, migrateId, migrateIds,
  WAV_MOODS, GRADIENT_DISPLAY_NAMES, FULL_GRADIENT_TYPES, FEELING_LUCKY_GRADIENT_TYPES,
  ALL_EFFECTS, AUDIO_GRADIENTS, AUDIO_EFFECTS, NO_DRAG_TYPES,
} from '../constants/gradientEffects';
import { useAngleState } from '../hooks/state/useAngleState';
import { useAsciiState } from '../hooks/state/useAsciiState';
import { useAttractorState } from '../hooks/state/useAttractorState';
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
import { useGlitchState } from '../hooks/state/useGlitchState';
import { useGrainState } from '../hooks/state/useGrainState';
import { useGridState } from '../hooks/state/useGridState';
import { useGridRotationDirectionState } from '../hooks/state/useGridRotationDirectionState';
import { useHalftoneState } from '../hooks/state/useHalftoneState';
import { useHelixState } from '../hooks/state/useHelixState';
import { useHexGridState } from '../hooks/state/useHexGridState';
import { useInvertState } from '../hooks/state/useInvertState';
import { useIridescentState } from '../hooks/state/useIridescentState';
import { useJuliaState } from '../hooks/state/useJuliaState';
import { useKaleidoscopeState } from '../hooks/state/useKaleidoscopeState';
import { useLavaState } from '../hooks/state/useLavaState';
import { useLightLeakState } from '../hooks/state/useLightLeakState';
import { useLinesState } from '../hooks/state/useLinesState';
import { useLiquidState } from '../hooks/state/useLiquidState';
import { useLiquifyState } from '../hooks/state/useLiquifyState';
import { useMarbleState } from '../hooks/state/useMarbleState';
import { useMetaballState } from '../hooks/state/useMetaballState';
import { useMirrorState } from '../hooks/state/useMirrorState';
import { useMiscState } from '../hooks/state/useMiscState';
import { useMoireState } from '../hooks/state/useMoireState';
import { useNoiseState } from '../hooks/state/useNoiseState';
import { usePanelDragState } from '../hooks/state/usePanelDragState';
import { usePanelPosState } from '../hooks/state/usePanelPosState';
import { useIsMobile } from '../hooks/useIsMobile';
import { usePhotoState } from '../hooks/state/usePhotoState';
import { usePinchState } from '../hooks/state/usePinchState';
import { usePixelState } from '../hooks/state/usePixelState';
import { usePlasmaState } from '../hooks/state/usePlasmaState';
import { usePolygon2State } from '../hooks/state/usePolygon2State';
import { usePosterizeState } from '../hooks/state/usePosterizeState';
import { useRadarState } from '../hooks/state/useRadarState';
import { useRadialState } from '../hooks/state/useRadialState';
import { useRadialBurstState } from '../hooks/state/useRadialBurstState';
import { useReactionDiffusionState } from '../hooks/state/useReactionDiffusionState';
import { useReactionDiffusionGridState } from '../hooks/state/useReactionDiffusionGridState';
import { useRedoState } from '../hooks/state/useRedoState';
import { useRippleState } from '../hooks/state/useRippleState';
import { useScanLineState } from '../hooks/state/useScanLineState';
import { useSepiaState } from '../hooks/state/useSepiaState';
import { useShapesState } from '../hooks/state/useShapesState';
import { useSlitScanState } from '../hooks/state/useSlitScanState';
import { useSolarizeState } from '../hooks/state/useSolarizeState';
import { useStructuralSeedState } from '../hooks/state/useStructuralSeedState';
import { useTopographicState } from '../hooks/state/useTopographicState';
import { useTriangleState } from '../hooks/state/useTriangleState';
import { useTruchetState } from '../hooks/state/useTruchetState';
import { useTwistState } from '../hooks/state/useTwistState';
import { useUndoState } from '../hooks/state/useUndoState';
import { useVhsState } from '../hooks/state/useVhsState';
import { useVignetteState } from '../hooks/state/useVignetteState';
import { useVoronoiState } from '../hooks/state/useVoronoiState';
import { useWaveState } from '../hooks/state/useWaveState';
import { useWindmillState } from '../hooks/state/useWindmillState';

type BlendMode = 'none' | 'double-exposure' | 'screen' | 'multiply' | 'overlay' | 'soft-light' | 'hard-light' | 'difference' | 'exclusion';

// Recording frame interface
interface RecordingFrame {
  colors: ColorRGB[];
  angle: number;
  zoom: number;
  timestamp: number;
}

// Curated emoji set for the Emoji-effect picker, grouped by category. Not the
// full ~3,700-emoji Unicode registry (that'd need a dedicated data package)
// but a substantially expanded, close-to-iOS-keyboard-parity selection
// across every category — the "Chars"-style text field can still be freely
// hand-edited to extend with any other emoji via keyboard/OS picker. Each
// entry pairs the glyph with a short searchable name rather than being a
// bare string, so the picker's search box has something to match against.
type EmojiEntry = { char: string; name: string };
export const EMOJI_PICKER_CATEGORIES: { label: string; emojis: EmojiEntry[] }[] = [
  { label: 'Smileys', emojis: [
    { char: '😀', name: 'grinning' }, { char: '😃', name: 'smiley' }, { char: '😄', name: 'happy' }, { char: '😁', name: 'grin' }, { char: '😆', name: 'laughing' }, { char: '😅', name: 'sweat smile' }, { char: '🤣', name: 'rofl' }, { char: '😂', name: 'joy tears' }, { char: '🙂', name: 'slight smile' }, { char: '🙃', name: 'upside down' }, { char: '🫠', name: 'melting' }, { char: '😉', name: 'wink' }, { char: '😊', name: 'blush' }, { char: '😇', name: 'angel innocent' }, { char: '🥰', name: 'smiling hearts' }, { char: '😍', name: 'heart eyes' }, { char: '🤩', name: 'star struck' }, { char: '😘', name: 'kiss' }, { char: '😗', name: 'kissing' }, { char: '☺️', name: 'smiling' }, { char: '😚', name: 'kissing closed eyes' }, { char: '😙', name: 'kissing smiling' }, { char: '🥲', name: 'smiling tear' }, { char: '😋', name: 'yum' }, { char: '😛', name: 'tongue' }, { char: '😜', name: 'winking tongue' }, { char: '🤪', name: 'zany crazy' }, { char: '😝', name: 'squint tongue' }, { char: '🤑', name: 'money mouth' }, { char: '🤗', name: 'hug' }, { char: '🤭', name: 'hand over mouth' }, { char: '🫢', name: 'gasp' }, { char: '🫣', name: 'peeking' }, { char: '🤫', name: 'shush quiet' }, { char: '🤔', name: 'thinking' }, { char: '🫡', name: 'saluting' }, { char: '🤐', name: 'zipper mouth' }, { char: '🤨', name: 'raised eyebrow' }, { char: '😐', name: 'neutral' }, { char: '😑', name: 'expressionless' }, { char: '😶', name: 'no mouth' }, { char: '🫥', name: 'dotted line' }, { char: '😏', name: 'smirk' }, { char: '😒', name: 'unamused' }, { char: '🙄', name: 'eye roll' }, { char: '😬', name: 'grimace' }, { char: '🤥', name: 'lying pinocchio' }, { char: '😌', name: 'relieved' }, { char: '😔', name: 'pensive' }, { char: '😪', name: 'sleepy' }, { char: '🤤', name: 'drooling' }, { char: '😴', name: 'sleeping' }, { char: '😷', name: 'mask sick' }, { char: '🤒', name: 'thermometer fever' }, { char: '🤕', name: 'head bandage hurt' }, { char: '🤢', name: 'nauseated' }, { char: '🤮', name: 'vomiting' }, { char: '🤧', name: 'sneezing' }, { char: '🥵', name: 'hot' }, { char: '🥶', name: 'cold freezing' }, { char: '🥴', name: 'woozy dizzy' }, { char: '😵', name: 'dizzy face' }, { char: '😵‍💫', name: 'spiral eyes' }, { char: '🤯', name: 'mind blown' }, { char: '🤠', name: 'cowboy' }, { char: '🥳', name: 'party celebrate' }, { char: '🥸', name: 'disguise' }, { char: '😎', name: 'sunglasses cool' }, { char: '🤓', name: 'nerd' }, { char: '🧐', name: 'monocle' }, { char: '😕', name: 'confused' }, { char: '🫤', name: 'diagonal mouth' }, { char: '😟', name: 'worried' }, { char: '🙁', name: 'frown' }, { char: '☹️', name: 'sad frowning' }, { char: '😮', name: 'open mouth wow' }, { char: '😯', name: 'hushed' }, { char: '😲', name: 'astonished' }, { char: '😳', name: 'flushed' }, { char: '🥺', name: 'pleading puppy eyes' }, { char: '🥹', name: 'holding back tears' }, { char: '😦', name: 'frowning open mouth' }, { char: '😧', name: 'anguished' }, { char: '😨', name: 'fearful' }, { char: '😰', name: 'anxious sweat' }, { char: '😥', name: 'sad relieved' }, { char: '😢', name: 'crying' }, { char: '😭', name: 'sobbing' }, { char: '😱', name: 'scream shocked' }, { char: '😖', name: 'confounded' }, { char: '😣', name: 'persevere' }, { char: '😞', name: 'disappointed' }, { char: '😓', name: 'downcast sweat' }, { char: '😩', name: 'weary' }, { char: '😫', name: 'tired' }, { char: '🥱', name: 'yawning' }, { char: '😤', name: 'triumph huff' }, { char: '😡', name: 'pouting angry' }, { char: '😠', name: 'angry mad' }, { char: '🤬', name: 'cursing' }, { char: '😈', name: 'smiling devil' }, { char: '👿', name: 'angry devil' }, { char: '💀', name: 'skull' }, { char: '☠️', name: 'skull crossbones' }, { char: '💩', name: 'poop' }, { char: '🤡', name: 'clown' }, { char: '👹', name: 'ogre' }, { char: '👺', name: 'goblin' }, { char: '👻', name: 'ghost' }, { char: '👽', name: 'alien' }, { char: '👾', name: 'space invader' }, { char: '🤖', name: 'robot' },
  ] },
  { label: 'Gestures & Body', emojis: [
    { char: '👋', name: 'wave hello bye' }, { char: '🤚', name: 'raised back hand' }, { char: '🖐️', name: 'hand fingers splayed' }, { char: '✋', name: 'raised hand stop' }, { char: '🖖', name: 'vulcan spock' }, { char: '🫱', name: 'rightwards hand' }, { char: '🫲', name: 'leftwards hand' }, { char: '🫳', name: 'palm down' }, { char: '🫴', name: 'palm up' }, { char: '👌', name: 'ok hand' }, { char: '🤌', name: 'pinched fingers' }, { char: '🤏', name: 'pinching small' }, { char: '✌️', name: 'peace victory' }, { char: '🤞', name: 'crossed fingers luck' }, { char: '🫰', name: 'finger heart' }, { char: '🤟', name: 'love you gesture' }, { char: '🤘', name: 'rock on horns' }, { char: '🤙', name: 'call me shaka' }, { char: '👈', name: 'point left' }, { char: '👉', name: 'point right' }, { char: '👆', name: 'point up' }, { char: '🖕', name: 'middle finger' }, { char: '👇', name: 'point down' }, { char: '☝️', name: 'index up' }, { char: '🫵', name: 'point at viewer' }, { char: '👍', name: 'thumbs up' }, { char: '👎', name: 'thumbs down' }, { char: '✊', name: 'fist raised' }, { char: '👊', name: 'punch fist bump' }, { char: '🤛', name: 'fist bump left' }, { char: '🤜', name: 'fist bump right' }, { char: '👏', name: 'clap applause' }, { char: '🙌', name: 'raised hands celebrate' }, { char: '🫶', name: 'heart hands' }, { char: '👐', name: 'open hands' }, { char: '🤲', name: 'palms together' }, { char: '🤝', name: 'handshake deal' }, { char: '🙏', name: 'pray thanks' }, { char: '✍️', name: 'writing hand' }, { char: '💅', name: 'nail polish' }, { char: '🤳', name: 'selfie' }, { char: '💪', name: 'flex muscle strong' }, { char: '🦾', name: 'mechanical arm' }, { char: '🦿', name: 'mechanical leg' }, { char: '🦵', name: 'leg' }, { char: '🦶', name: 'foot' }, { char: '👂', name: 'ear' }, { char: '🦻', name: 'ear hearing aid' }, { char: '👃', name: 'nose' }, { char: '🧠', name: 'brain' }, { char: '🫀', name: 'heart organ' }, { char: '🫁', name: 'lungs' }, { char: '🦷', name: 'tooth' }, { char: '🦴', name: 'bone' }, { char: '👀', name: 'eyes' }, { char: '👁️', name: 'eye' }, { char: '👅', name: 'tongue' }, { char: '👄', name: 'mouth lips' }, { char: '🫦', name: 'biting lip' }, { char: '👶', name: 'baby' }, { char: '🧒', name: 'child' }, { char: '👦', name: 'boy' }, { char: '👧', name: 'girl' }, { char: '🧑', name: 'person' }, { char: '👱', name: 'blond person' }, { char: '👨', name: 'man' }, { char: '🧔', name: 'beard person' }, { char: '👩', name: 'woman' }, { char: '🧓', name: 'older person' }, { char: '👴', name: 'old man' }, { char: '👵', name: 'old woman' }, { char: '🙍', name: 'frowning person' }, { char: '🙎', name: 'pouting person' }, { char: '🙅', name: 'no gesture' }, { char: '🙆', name: 'ok gesture' }, { char: '💁', name: 'tipping hand' }, { char: '🙋', name: 'raising hand' }, { char: '🧏', name: 'deaf person' }, { char: '🙇', name: 'bowing' }, { char: '🤦', name: 'facepalm' }, { char: '🤷', name: 'shrug' }, { char: '👮', name: 'police officer' }, { char: '🕵️', name: 'detective spy' }, { char: '💂', name: 'guard' }, { char: '🥷', name: 'ninja' }, { char: '👷', name: 'construction worker' }, { char: '🫅', name: 'royalty person' }, { char: '🤴', name: 'prince' }, { char: '👸', name: 'princess' }, { char: '👳', name: 'turban person' }, { char: '👲', name: 'skullcap person' }, { char: '🧕', name: 'headscarf person' }, { char: '🤵', name: 'tuxedo person' }, { char: '👰', name: 'bride veil' }, { char: '🤰', name: 'pregnant' }, { char: '🤱', name: 'breastfeeding' }, { char: '👼', name: 'baby angel' }, { char: '🎅', name: 'santa' }, { char: '🤶', name: 'mrs claus' }, { char: '🦸', name: 'superhero' }, { char: '🦹', name: 'supervillain' }, { char: '🧙', name: 'wizard mage' }, { char: '🧚', name: 'fairy' }, { char: '🧛', name: 'vampire' }, { char: '🧜', name: 'mermaid merman' }, { char: '🧝', name: 'elf' }, { char: '🧞', name: 'genie' }, { char: '🧟', name: 'zombie' }, { char: '💆', name: 'massage relax' }, { char: '💇', name: 'haircut' }, { char: '🚶', name: 'walking' }, { char: '🧍', name: 'standing' }, { char: '🧎', name: 'kneeling' }, { char: '🏃', name: 'running' }, { char: '💃', name: 'dancer woman' }, { char: '🕺', name: 'dancer man' }, { char: '🧖', name: 'sauna steam' }, { char: '👯', name: 'bunny ears dancers' }, { char: '👭', name: 'women holding hands' }, { char: '👫', name: 'couple holding hands' }, { char: '👬', name: 'men holding hands' }, { char: '💏', name: 'kiss couple' }, { char: '💑', name: 'couple with heart' }, { char: '👪', name: 'family' },
  ] },
  { label: 'Hearts', emojis: [
    { char: '❤️', name: 'red heart love' }, { char: '🧡', name: 'orange heart' }, { char: '💛', name: 'yellow heart' }, { char: '💚', name: 'green heart' }, { char: '💙', name: 'blue heart' }, { char: '💜', name: 'purple heart' }, { char: '🖤', name: 'black heart' }, { char: '🤍', name: 'white heart' }, { char: '🤎', name: 'brown heart' }, { char: '💔', name: 'broken heart' }, { char: '❣️', name: 'heart exclamation' }, { char: '💕', name: 'two hearts' }, { char: '💞', name: 'revolving hearts' }, { char: '💓', name: 'beating heart' }, { char: '💗', name: 'growing heart' }, { char: '💖', name: 'sparkling heart' }, { char: '💘', name: 'cupid arrow heart' }, { char: '💝', name: 'gift heart' }, { char: '💟', name: 'heart decoration' }, { char: '♥️', name: 'heart suit' }, { char: '💌', name: 'love letter' }, { char: '💋', name: 'kiss mark lipstick' }, { char: '❤️‍🔥', name: 'heart on fire' }, { char: '❤️‍🩹', name: 'mending heart' },
  ] },
  { label: 'Animals', emojis: [
    { char: '🐶', name: 'dog' }, { char: '🐱', name: 'cat' }, { char: '🐭', name: 'mouse' }, { char: '🐹', name: 'hamster' }, { char: '🐰', name: 'rabbit bunny' }, { char: '🦊', name: 'fox' }, { char: '🐻', name: 'bear' }, { char: '🐼', name: 'panda' }, { char: '🐨', name: 'koala' }, { char: '🐯', name: 'tiger' }, { char: '🦁', name: 'lion' }, { char: '🐮', name: 'cow' }, { char: '🐷', name: 'pig' }, { char: '🐽', name: 'pig nose' }, { char: '🐸', name: 'frog' }, { char: '🐵', name: 'monkey' }, { char: '🙈', name: 'see no evil' }, { char: '🙉', name: 'hear no evil' }, { char: '🙊', name: 'speak no evil' }, { char: '🐒', name: 'monkey face' }, { char: '🐔', name: 'chicken' }, { char: '🐧', name: 'penguin' }, { char: '🐦', name: 'bird' }, { char: '🐤', name: 'baby chick' }, { char: '🐣', name: 'hatching chick' }, { char: '🐥', name: 'front facing chick' }, { char: '🦆', name: 'duck' }, { char: '🦅', name: 'eagle' }, { char: '🦉', name: 'owl' }, { char: '🦇', name: 'bat' }, { char: '🐺', name: 'wolf' }, { char: '🐗', name: 'boar' }, { char: '🐴', name: 'horse face' }, { char: '🦄', name: 'unicorn' }, { char: '🫎', name: 'moose' }, { char: '🫏', name: 'donkey' }, { char: '🐝', name: 'bee' }, { char: '🪱', name: 'worm' }, { char: '🐛', name: 'caterpillar bug' }, { char: '🦋', name: 'butterfly' }, { char: '🐌', name: 'snail' }, { char: '🐞', name: 'ladybug' }, { char: '🐜', name: 'ant' }, { char: '🪰', name: 'fly' }, { char: '🪲', name: 'beetle' }, { char: '🪳', name: 'cockroach' }, { char: '🦟', name: 'mosquito' }, { char: '🦗', name: 'cricket' }, { char: '🕷️', name: 'spider' }, { char: '🕸️', name: 'spider web' }, { char: '🦂', name: 'scorpion' }, { char: '🐢', name: 'turtle' }, { char: '🐍', name: 'snake' }, { char: '🦎', name: 'lizard' }, { char: '🦖', name: 'trex dinosaur' }, { char: '🦕', name: 'sauropod dinosaur' }, { char: '🐙', name: 'octopus' }, { char: '🦑', name: 'squid' }, { char: '🦐', name: 'shrimp' }, { char: '🦞', name: 'lobster' }, { char: '🦀', name: 'crab' }, { char: '🐡', name: 'pufferfish' }, { char: '🐠', name: 'tropical fish' }, { char: '🐟', name: 'fish' }, { char: '🐬', name: 'dolphin' }, { char: '🐳', name: 'whale spouting' }, { char: '🐋', name: 'whale' }, { char: '🦈', name: 'shark' }, { char: '🐊', name: 'crocodile' }, { char: '🐅', name: 'tiger face' }, { char: '🐆', name: 'leopard' }, { char: '🦓', name: 'zebra' }, { char: '🦍', name: 'gorilla' }, { char: '🦧', name: 'orangutan' }, { char: '🦣', name: 'mammoth' }, { char: '🐘', name: 'elephant' }, { char: '🦛', name: 'hippo' }, { char: '🦏', name: 'rhino' }, { char: '🐪', name: 'camel' }, { char: '🐫', name: 'two hump camel' }, { char: '🦒', name: 'giraffe' }, { char: '🦘', name: 'kangaroo' }, { char: '🦬', name: 'bison' }, { char: '🐃', name: 'water buffalo' }, { char: '🐂', name: 'ox' }, { char: '🐄', name: 'cow face' }, { char: '🐎', name: 'horse' }, { char: '🐖', name: 'pig face' }, { char: '🐏', name: 'ram' }, { char: '🐑', name: 'sheep' }, { char: '🦙', name: 'llama' }, { char: '🐐', name: 'goat' }, { char: '🦌', name: 'deer' }, { char: '🐕', name: 'dog face' }, { char: '🐩', name: 'poodle' }, { char: '🦮', name: 'guide dog' }, { char: '🐈', name: 'cat face' }, { char: '🐈‍⬛', name: 'black cat' }, { char: '🪶', name: 'feather' }, { char: '🐓', name: 'rooster' }, { char: '🦃', name: 'turkey' }, { char: '🦤', name: 'dodo' }, { char: '🦚', name: 'peacock' }, { char: '🦜', name: 'parrot' }, { char: '🦢', name: 'swan' }, { char: '🦩', name: 'flamingo' }, { char: '🕊️', name: 'dove peace' }, { char: '🐇', name: 'rabbit' }, { char: '🦝', name: 'raccoon' }, { char: '🦨', name: 'skunk' }, { char: '🦡', name: 'badger' }, { char: '🦫', name: 'beaver' }, { char: '🦦', name: 'otter' }, { char: '🐁', name: 'mouse face' }, { char: '🐀', name: 'rat' }, { char: '🐿️', name: 'chipmunk squirrel' }, { char: '🦔', name: 'hedgehog' },
  ] },
  { label: 'Nature & Plants', emojis: [
    { char: '💐', name: 'bouquet flowers' }, { char: '🌸', name: 'cherry blossom' }, { char: '💮', name: 'white flower' }, { char: '🪷', name: 'lotus' }, { char: '🏵️', name: 'rosette' }, { char: '🌹', name: 'rose' }, { char: '🥀', name: 'wilted flower' }, { char: '🌺', name: 'hibiscus' }, { char: '🌻', name: 'sunflower' }, { char: '🌼', name: 'blossom daisy' }, { char: '🌷', name: 'tulip' }, { char: '🪻', name: 'hyacinth' }, { char: '🌱', name: 'seedling sprout' }, { char: '🪴', name: 'potted plant' }, { char: '🌲', name: 'evergreen tree' }, { char: '🌳', name: 'deciduous tree' }, { char: '🌴', name: 'palm tree' }, { char: '🌵', name: 'cactus' }, { char: '🌾', name: 'sheaf rice' }, { char: '🌿', name: 'herb' }, { char: '☘️', name: 'shamrock' }, { char: '🍀', name: 'four leaf clover lucky' }, { char: '🍁', name: 'maple leaf' }, { char: '🍂', name: 'fallen leaf autumn' }, { char: '🍃', name: 'leaves wind' }, { char: '🪹', name: 'empty nest' }, { char: '🪺', name: 'nest with eggs' }, { char: '🍄', name: 'mushroom' }, { char: '🌰', name: 'chestnut' }, { char: '🪸', name: 'coral' }, { char: '🪨', name: 'rock' }, { char: '🌍', name: 'earth globe' }, { char: '🌎', name: 'earth americas' }, { char: '🌏', name: 'earth asia' }, { char: '🌐', name: 'globe meridians' }, { char: '🪐', name: 'ringed planet' }, { char: '🌑', name: 'new moon' }, { char: '🌒', name: 'waxing crescent moon' }, { char: '🌓', name: 'first quarter moon' }, { char: '🌔', name: 'waxing gibbous moon' }, { char: '🌕', name: 'full moon' }, { char: '🌖', name: 'waning gibbous moon' }, { char: '🌗', name: 'last quarter moon' }, { char: '🌘', name: 'waning crescent moon' }, { char: '🌙', name: 'crescent moon' }, { char: '🌛', name: 'first quarter face moon' }, { char: '🌜', name: 'last quarter face moon' }, { char: '🌚', name: 'new moon face' }, { char: '🌝', name: 'full moon face' }, { char: '☀️', name: 'sun' }, { char: '🌞', name: 'sun face' }, { char: '⭐', name: 'star' }, { char: '🌟', name: 'glowing star' }, { char: '💫', name: 'dizzy stars' }, { char: '✨', name: 'sparkles' }, { char: '☄️', name: 'comet' }, { char: '☁️', name: 'cloud' }, { char: '⛅', name: 'sun behind cloud' }, { char: '⛈️', name: 'thunderstorm' }, { char: '🌤️', name: 'sun small cloud' }, { char: '🌥️', name: 'sun behind large cloud' }, { char: '🌦️', name: 'sun behind rain cloud' }, { char: '🌧️', name: 'rain cloud' }, { char: '🌨️', name: 'snow cloud' }, { char: '🌩️', name: 'lightning cloud' }, { char: '🌪️', name: 'tornado' }, { char: '🌫️', name: 'fog' }, { char: '🌬️', name: 'wind face' }, { char: '🌀', name: 'cyclone' }, { char: '🌈', name: 'rainbow' }, { char: '🌂', name: 'closed umbrella' }, { char: '☂️', name: 'umbrella' }, { char: '☔', name: 'umbrella rain' }, { char: '⛱️', name: 'umbrella beach' }, { char: '⚡', name: 'lightning bolt' }, { char: '❄️', name: 'snowflake' }, { char: '☃️', name: 'snowman' }, { char: '⛄', name: 'snowman no snow' }, { char: '☄️', name: 'comet' }, { char: '🔥', name: 'fire flame' }, { char: '💧', name: 'droplet water' }, { char: '🌊', name: 'wave ocean' },
  ] },
  { label: 'Food & Drink', emojis: [
    { char: '🍏', name: 'green apple' }, { char: '🍎', name: 'red apple' }, { char: '🍐', name: 'pear' }, { char: '🍊', name: 'tangerine orange' }, { char: '🍋', name: 'lemon' }, { char: '🍌', name: 'banana' }, { char: '🍉', name: 'watermelon' }, { char: '🍇', name: 'grapes' }, { char: '🍓', name: 'strawberry' }, { char: '🫐', name: 'blueberries' }, { char: '🍈', name: 'melon' }, { char: '🍒', name: 'cherries' }, { char: '🍑', name: 'peach' }, { char: '🥭', name: 'mango' }, { char: '🍍', name: 'pineapple' }, { char: '🥥', name: 'coconut' }, { char: '🥝', name: 'kiwi' }, { char: '🍅', name: 'tomato' }, { char: '🍆', name: 'eggplant' }, { char: '🥑', name: 'avocado' }, { char: '🥦', name: 'broccoli' }, { char: '🥬', name: 'leafy greens lettuce' }, { char: '🥒', name: 'cucumber' }, { char: '🌶️', name: 'hot pepper chili' }, { char: '🫑', name: 'bell pepper' }, { char: '🌽', name: 'corn' }, { char: '🥕', name: 'carrot' }, { char: '🫒', name: 'olive' }, { char: '🧄', name: 'garlic' }, { char: '🧅', name: 'onion' }, { char: '🥔', name: 'potato' }, { char: '🍠', name: 'sweet potato' }, { char: '🥐', name: 'croissant' }, { char: '🥯', name: 'bagel' }, { char: '🍞', name: 'bread' }, { char: '🥖', name: 'baguette' }, { char: '🥨', name: 'pretzel' }, { char: '🧀', name: 'cheese' }, { char: '🥚', name: 'egg' }, { char: '🍳', name: 'fried egg cooking' }, { char: '🧈', name: 'butter' }, { char: '🥞', name: 'pancakes' }, { char: '🧇', name: 'waffle' }, { char: '🥓', name: 'bacon' }, { char: '🥩', name: 'steak meat' }, { char: '🍗', name: 'poultry leg' }, { char: '🍖', name: 'meat bone' }, { char: '🌭', name: 'hot dog' }, { char: '🍔', name: 'hamburger burger' }, { char: '🍟', name: 'fries' }, { char: '🍕', name: 'pizza' }, { char: '🫓', name: 'flatbread' }, { char: '🥪', name: 'sandwich' }, { char: '🌮', name: 'taco' }, { char: '🌯', name: 'burrito' }, { char: '🫔', name: 'tamale' }, { char: '🥙', name: 'stuffed flatbread' }, { char: '🧆', name: 'falafel' }, { char: '🥗', name: 'salad' }, { char: '🍿', name: 'popcorn' }, { char: '🧈', name: 'butter' }, { char: '🧂', name: 'salt' }, { char: '🥫', name: 'canned food' }, { char: '🍱', name: 'bento box' }, { char: '🍘', name: 'rice cracker' }, { char: '🍙', name: 'rice ball' }, { char: '🍚', name: 'cooked rice' }, { char: '🍛', name: 'curry rice' }, { char: '🍜', name: 'ramen noodles' }, { char: '🍝', name: 'spaghetti pasta' }, { char: '🍠', name: 'sweet potato' }, { char: '🍢', name: 'oden skewer' }, { char: '🍣', name: 'sushi' }, { char: '🍤', name: 'fried shrimp tempura' }, { char: '🍥', name: 'fish cake' }, { char: '🥮', name: 'mooncake' }, { char: '🍡', name: 'dango' }, { char: '🥟', name: 'dumpling' }, { char: '🥠', name: 'fortune cookie' }, { char: '🥡', name: 'takeout box' }, { char: '🦀', name: 'crab' }, { char: '🦞', name: 'lobster' }, { char: '🦐', name: 'shrimp' }, { char: '🦑', name: 'squid' }, { char: '🍦', name: 'soft ice cream' }, { char: '🍧', name: 'shaved ice' }, { char: '🍨', name: 'ice cream' }, { char: '🍩', name: 'donut' }, { char: '🍪', name: 'cookie' }, { char: '🎂', name: 'birthday cake' }, { char: '🍰', name: 'cake slice' }, { char: '🧁', name: 'cupcake' }, { char: '🥧', name: 'pie' }, { char: '🍫', name: 'chocolate bar' }, { char: '🍬', name: 'candy' }, { char: '🍭', name: 'lollipop' }, { char: '🍮', name: 'custard flan' }, { char: '🍯', name: 'honey' }, { char: '🍼', name: 'baby bottle' }, { char: '🥛', name: 'milk glass' }, { char: '☕', name: 'coffee' }, { char: '🫖', name: 'teapot' }, { char: '🍵', name: 'tea' }, { char: '🧃', name: 'juice box' }, { char: '🥤', name: 'cup with straw soda' }, { char: '🧋', name: 'bubble tea' }, { char: '🍶', name: 'sake' }, { char: '🍺', name: 'beer' }, { char: '🍻', name: 'beers cheers' }, { char: '🥂', name: 'clinking glasses champagne' }, { char: '🍷', name: 'wine' }, { char: '🥃', name: 'whiskey' }, { char: '🍸', name: 'cocktail martini' }, { char: '🍹', name: 'tropical drink' }, { char: '🧉', name: 'mate drink' }, { char: '🍾', name: 'champagne bottle' }, { char: '🧊', name: 'ice cube' }, { char: '🥄', name: 'spoon' }, { char: '🍴', name: 'fork knife' }, { char: '🍽️', name: 'plate fork knife' }, { char: '🥢', name: 'chopsticks' },
  ] },
  { label: 'Activities & Sports', emojis: [
    { char: '⚽', name: 'soccer ball' }, { char: '🏀', name: 'basketball' }, { char: '🏈', name: 'football' }, { char: '⚾', name: 'baseball' }, { char: '🥎', name: 'softball' }, { char: '🎾', name: 'tennis' }, { char: '🏐', name: 'volleyball' }, { char: '🏉', name: 'rugby' }, { char: '🎱', name: 'pool 8 ball' }, { char: '🏓', name: 'ping pong table tennis' }, { char: '🏸', name: 'badminton' }, { char: '🥅', name: 'goal net' }, { char: '⛳', name: 'golf flag' }, { char: '🏹', name: 'bow arrow archery' }, { char: '🎣', name: 'fishing rod' }, { char: '🤿', name: 'diving mask' }, { char: '🥊', name: 'boxing glove' }, { char: '🥋', name: 'martial arts' }, { char: '🎽', name: 'running shirt' }, { char: '🛹', name: 'skateboard' }, { char: '🛼', name: 'roller skate' }, { char: '🎿', name: 'ski' }, { char: '⛷️', name: 'skier' }, { char: '🏂', name: 'snowboarder' }, { char: '🪂', name: 'parachute' }, { char: '🏋️', name: 'weightlifting' }, { char: '🤸', name: 'cartwheel gymnastics' }, { char: '⛹️', name: 'bouncing ball' }, { char: '🤺', name: 'fencing' }, { char: '🤾', name: 'handball' }, { char: '🏌️', name: 'golfing' }, { char: '🏇', name: 'horse racing' }, { char: '🧘', name: 'yoga meditation' }, { char: '🏄', name: 'surfing' }, { char: '🏊', name: 'swimming' }, { char: '🤽', name: 'water polo' }, { char: '🚣', name: 'rowing boat' }, { char: '🧗', name: 'climbing' }, { char: '🚵', name: 'mountain biking' }, { char: '🚴', name: 'cycling' }, { char: '🏆', name: 'trophy' }, { char: '🥇', name: 'gold medal first' }, { char: '🥈', name: 'silver medal second' }, { char: '🥉', name: 'bronze medal third' }, { char: '🏅', name: 'medal sports' }, { char: '🎖️', name: 'military medal' }, { char: '🏵️', name: 'rosette' }, { char: '🎗️', name: 'ribbon awareness' }, { char: '🎫', name: 'ticket' }, { char: '🎟️', name: 'admission tickets' }, { char: '🎪', name: 'circus tent' }, { char: '🤹', name: 'juggling' }, { char: '🎭', name: 'theater masks' }, { char: '🩰', name: 'ballet shoes' }, { char: '🎨', name: 'palette art' }, { char: '🎬', name: 'clapper film' }, { char: '🎤', name: 'microphone sing' }, { char: '🎧', name: 'headphones music' }, { char: '🎼', name: 'musical score' }, { char: '🎹', name: 'piano keyboard' }, { char: '🥁', name: 'drum' }, { char: '🪘', name: 'long drum' }, { char: '🎷', name: 'saxophone' }, { char: '🎺', name: 'trumpet' }, { char: '🎸', name: 'guitar' }, { char: '🪕', name: 'banjo' }, { char: '🎻', name: 'violin' }, { char: '🪗', name: 'accordion' }, { char: '🪈', name: 'flute' }, { char: '🎲', name: 'dice game' }, { char: '♟️', name: 'chess pawn' }, { char: '🎯', name: 'dart target' }, { char: '🎳', name: 'bowling' }, { char: '🎮', name: 'video game controller' }, { char: '🎰', name: 'slot machine' }, { char: '🧩', name: 'puzzle piece' }, { char: '🪀', name: 'yo-yo' }, { char: '🪁', name: 'kite' },
  ] },
  { label: 'Travel & Places', emojis: [
    { char: '🚗', name: 'car automobile' }, { char: '🚕', name: 'taxi' }, { char: '🚙', name: 'suv' }, { char: '🚌', name: 'bus' }, { char: '🚎', name: 'trolleybus' }, { char: '🏎️', name: 'race car' }, { char: '🚓', name: 'police car' }, { char: '🚑', name: 'ambulance' }, { char: '🚒', name: 'fire truck' }, { char: '🚐', name: 'minibus van' }, { char: '🛻', name: 'pickup truck' }, { char: '🚚', name: 'delivery truck' }, { char: '🚛', name: 'articulated truck' }, { char: '🚜', name: 'tractor' }, { char: '🛵', name: 'scooter moped' }, { char: '🏍️', name: 'motorcycle' }, { char: '🛺', name: 'auto rickshaw' }, { char: '🚲', name: 'bicycle bike' }, { char: '🛴', name: 'kick scooter' }, { char: '🚨', name: 'police light siren' }, { char: '🚔', name: 'oncoming police car' }, { char: '🚍', name: 'oncoming bus' }, { char: '🚘', name: 'oncoming automobile' }, { char: '🚖', name: 'oncoming taxi' }, { char: '🚡', name: 'aerial tramway' }, { char: '🚠', name: 'mountain cableway' }, { char: '🚟', name: 'suspension railway' }, { char: '🚃', name: 'railway carriage' }, { char: '🚋', name: 'tram car' }, { char: '🚞', name: 'mountain railway' }, { char: '🚝', name: 'monorail' }, { char: '🚄', name: 'high speed train' }, { char: '🚅', name: 'bullet train' }, { char: '🚈', name: 'light rail' }, { char: '🚂', name: 'locomotive train' }, { char: '🚆', name: 'train' }, { char: '🚇', name: 'metro subway' }, { char: '🚊', name: 'tram' }, { char: '✈️', name: 'airplane' }, { char: '🛫', name: 'airplane departure' }, { char: '🛬', name: 'airplane arrival' }, { char: '🛩️', name: 'small airplane' }, { char: '💺', name: 'seat' }, { char: '🚀', name: 'rocket' }, { char: '🛸', name: 'ufo flying saucer' }, { char: '🚁', name: 'helicopter' }, { char: '🛶', name: 'canoe' }, { char: '⛵', name: 'sailboat' }, { char: '🚤', name: 'speedboat' }, { char: '🛥️', name: 'motor boat' }, { char: '🛳️', name: 'cruise ship' }, { char: '⛴️', name: 'ferry' }, { char: '🚢', name: 'ship' }, { char: '⚓', name: 'anchor' }, { char: '🛟', name: 'ring buoy' }, { char: '⛽', name: 'fuel pump gas' }, { char: '🚧', name: 'construction barrier' }, { char: '🚦', name: 'traffic light' }, { char: '🚥', name: 'horizontal traffic light' }, { char: '🗺️', name: 'world map' }, { char: '🗿', name: 'moai statue' }, { char: '🗽', name: 'statue of liberty' }, { char: '🗼', name: 'tokyo tower' }, { char: '🏰', name: 'castle' }, { char: '🏯', name: 'japanese castle' }, { char: '🏟️', name: 'stadium' }, { char: '🎡', name: 'ferris wheel' }, { char: '🎢', name: 'roller coaster' }, { char: '🎠', name: 'carousel horse' }, { char: '⛱️', name: 'beach umbrella' }, { char: '🏖️', name: 'beach' }, { char: '🏝️', name: 'desert island' }, { char: '🏔️', name: 'snow mountain' }, { char: '⛰️', name: 'mountain' }, { char: '🌋', name: 'volcano' }, { char: '🗻', name: 'mount fuji' }, { char: '🏕️', name: 'camping tent' }, { char: '🏜️', name: 'desert' }, { char: '🏛️', name: 'classical building' }, { char: '🏗️', name: 'building construction' }, { char: '🏘️', name: 'houses' }, { char: '🏚️', name: 'derelict house' }, { char: '🏠', name: 'house' }, { char: '🏡', name: 'house garden' }, { char: '🏢', name: 'office building' }, { char: '🏣', name: 'post office' }, { char: '🏤', name: 'post office europe' }, { char: '🏥', name: 'hospital' }, { char: '🏦', name: 'bank' }, { char: '🏨', name: 'hotel' }, { char: '🏩', name: 'love hotel' }, { char: '🏪', name: 'convenience store' }, { char: '🏫', name: 'school' }, { char: '🏬', name: 'department store' }, { char: '🏭', name: 'factory' }, { char: '💒', name: 'wedding chapel' }, { char: '🕌', name: 'mosque' }, { char: '🕍', name: 'synagogue' }, { char: '⛩️', name: 'shinto shrine' }, { char: '🕋', name: 'kaaba' }, { char: '⛪', name: 'church' }, { char: '🌅', name: 'sunrise' }, { char: '🌄', name: 'sunrise mountains' }, { char: '🌆', name: 'cityscape dusk' }, { char: '🌇', name: 'sunset' }, { char: '🌉', name: 'bridge night' }, { char: '🌃', name: 'night city stars' }, { char: '🌌', name: 'milky way' },
  ] },
  { label: 'Objects', emojis: [
    { char: '⌚', name: 'watch' }, { char: '📱', name: 'phone mobile' }, { char: '💻', name: 'laptop computer' }, { char: '⌨️', name: 'keyboard' }, { char: '🖥️', name: 'desktop computer' }, { char: '🖨️', name: 'printer' }, { char: '🖱️', name: 'computer mouse' }, { char: '💽', name: 'minidisc' }, { char: '💾', name: 'floppy disk save' }, { char: '💿', name: 'cd disk' }, { char: '📀', name: 'dvd' }, { char: '📷', name: 'camera' }, { char: '📸', name: 'camera flash' }, { char: '📹', name: 'video camera' }, { char: '🎥', name: 'movie camera' }, { char: '📞', name: 'telephone receiver' }, { char: '☎️', name: 'telephone' }, { char: '📟', name: 'pager' }, { char: '📠', name: 'fax machine' }, { char: '📺', name: 'television tv' }, { char: '📻', name: 'radio' }, { char: '🎙️', name: 'studio microphone' }, { char: '🎚️', name: 'level slider' }, { char: '🎛️', name: 'control knobs' }, { char: '⏰', name: 'alarm clock' }, { char: '⏱️', name: 'stopwatch' }, { char: '⏲️', name: 'timer clock' }, { char: '🕰️', name: 'mantelpiece clock' }, { char: '⌛', name: 'hourglass done' }, { char: '⏳', name: 'hourglass flowing' }, { char: '💡', name: 'light bulb idea' }, { char: '🔦', name: 'flashlight' }, { char: '🏮', name: 'lantern' }, { char: '🪔', name: 'diya lamp' }, { char: '📔', name: 'notebook decorative' }, { char: '📕', name: 'closed book' }, { char: '📗', name: 'green book' }, { char: '📘', name: 'blue book' }, { char: '📙', name: 'orange book' }, { char: '📓', name: 'notebook' }, { char: '📒', name: 'ledger' }, { char: '📃', name: 'page curl' }, { char: '📜', name: 'scroll' }, { char: '📄', name: 'page document' }, { char: '📰', name: 'newspaper' }, { char: '🗞️', name: 'rolled newspaper' }, { char: '📑', name: 'bookmark tabs' }, { char: '🔖', name: 'bookmark' }, { char: '🏷️', name: 'label tag' }, { char: '💰', name: 'money bag' }, { char: '🪙', name: 'coin' }, { char: '💴', name: 'yen banknote' }, { char: '💵', name: 'dollar banknote' }, { char: '💶', name: 'euro banknote' }, { char: '💷', name: 'pound banknote' }, { char: '💸', name: 'money wings' }, { char: '💳', name: 'credit card' }, { char: '🧾', name: 'receipt' }, { char: '💎', name: 'gem diamond' }, { char: '⚖️', name: 'balance scale' }, { char: '🪜', name: 'ladder' }, { char: '🧰', name: 'toolbox' }, { char: '🔧', name: 'wrench' }, { char: '🔨', name: 'hammer' }, { char: '⚒️', name: 'hammer and pick' }, { char: '🛠️', name: 'hammer and wrench' }, { char: '⛏️', name: 'pick' }, { char: '🔩', name: 'nut and bolt' }, { char: '⚙️', name: 'gear settings' }, { char: '🧲', name: 'magnet' }, { char: '🔫', name: 'water gun' }, { char: '💣', name: 'bomb' }, { char: '🧨', name: 'firecracker' }, { char: '🔪', name: 'kitchen knife' }, { char: '🗡️', name: 'dagger' }, { char: '⚔️', name: 'crossed swords' }, { char: '🛡️', name: 'shield' }, { char: '🚬', name: 'cigarette' }, { char: '⚰️', name: 'coffin' }, { char: '🪦', name: 'headstone' }, { char: '⚱️', name: 'funeral urn' }, { char: '🏺', name: 'amphora vase' }, { char: '🔮', name: 'crystal ball' }, { char: '📿', name: 'prayer beads' }, { char: '🧿', name: 'nazar amulet' }, { char: '🪬', name: 'hamsa' }, { char: '💈', name: 'barber pole' }, { char: '⚗️', name: 'alembic' }, { char: '🔭', name: 'telescope' }, { char: '🔬', name: 'microscope' }, { char: '🕳️', name: 'hole' }, { char: '🩻', name: 'x-ray' }, { char: '💊', name: 'pill medicine' }, { char: '💉', name: 'syringe' }, { char: '🩸', name: 'blood drop' }, { char: '🌡️', name: 'thermometer' }, { char: '🧬', name: 'dna' }, { char: '🔑', name: 'key' }, { char: '🗝️', name: 'old key' }, { char: '🚪', name: 'door' }, { char: '🪑', name: 'chair' }, { char: '🛏️', name: 'bed' }, { char: '🛋️', name: 'couch sofa' }, { char: '🚽', name: 'toilet' }, { char: '🚿', name: 'shower' }, { char: '🛁', name: 'bathtub' }, { char: '🪒', name: 'razor' }, { char: '🧴', name: 'lotion bottle' }, { char: '🧷', name: 'safety pin' }, { char: '🧹', name: 'broom' }, { char: '🧺', name: 'basket' }, { char: '🧻', name: 'toilet paper' }, { char: '🪣', name: 'bucket' }, { char: '🧼', name: 'soap' }, { char: '🪥', name: 'toothbrush' }, { char: '🧽', name: 'sponge' }, { char: '🧯', name: 'fire extinguisher' }, { char: '🛒', name: 'shopping cart' }, { char: '🎁', name: 'gift present' },
  ] },
  { label: 'Clothing', emojis: [
    { char: '👑', name: 'crown' }, { char: '👒', name: 'sun hat' }, { char: '🎩', name: 'top hat' }, { char: '🎓', name: 'graduation cap' }, { char: '🧢', name: 'baseball cap' }, { char: '🪖', name: 'military helmet' }, { char: '⛑️', name: 'rescue helmet' }, { char: '📿', name: 'prayer beads' }, { char: '👓', name: 'glasses' }, { char: '🕶️', name: 'sunglasses' }, { char: '🥽', name: 'goggles' }, { char: '👔', name: 'necktie' }, { char: '👕', name: 'tshirt shirt' }, { char: '👖', name: 'jeans pants' }, { char: '🧣', name: 'scarf' }, { char: '🧤', name: 'gloves' }, { char: '🧥', name: 'coat' }, { char: '🧦', name: 'socks' }, { char: '👗', name: 'dress' }, { char: '👘', name: 'kimono' }, { char: '🥻', name: 'sari' }, { char: '🩱', name: 'swimsuit' }, { char: '🩲', name: 'briefs' }, { char: '🩳', name: 'shorts' }, { char: '👙', name: 'bikini' }, { char: '👚', name: 'blouse' }, { char: '🪭', name: 'folding hand fan' }, { char: '👛', name: 'purse' }, { char: '👜', name: 'handbag' }, { char: '👝', name: 'clutch bag' }, { char: '🛍️', name: 'shopping bags' }, { char: '🎒', name: 'backpack' }, { char: '🩴', name: 'thong sandal' }, { char: '👞', name: 'shoe mens' }, { char: '👟', name: 'sneaker' }, { char: '🥾', name: 'hiking boot' }, { char: '🥿', name: 'flat shoe' }, { char: '👠', name: 'high heel' }, { char: '👡', name: 'sandal womens' }, { char: '🩰', name: 'ballet shoes' }, { char: '👢', name: 'boot' }, { char: '👑', name: 'crown' }, { char: '💄', name: 'lipstick' }, { char: '💍', name: 'ring' }, { char: '💎', name: 'gem' },
  ] },
  { label: 'Symbols & Weather', emojis: [
    { char: '✨', name: 'sparkles' }, { char: '🎉', name: 'party popper celebrate' }, { char: '🎊', name: 'confetti ball' }, { char: '🎈', name: 'balloon' }, { char: '🎁', name: 'gift' }, { char: '🏆', name: 'trophy' }, { char: '⭐', name: 'star' }, { char: '🌟', name: 'glowing star' }, { char: '💫', name: 'dizzy' }, { char: '⚡', name: 'lightning' }, { char: '🔥', name: 'fire' }, { char: '💥', name: 'explosion boom' }, { char: '💢', name: 'anger symbol' }, { char: '💦', name: 'sweat splash' }, { char: '💨', name: 'dashing wind' }, { char: '🕳️', name: 'hole' }, { char: '💬', name: 'speech bubble' }, { char: '💭', name: 'thought bubble' }, { char: '🗯️', name: 'anger bubble' }, { char: '♻️', name: 'recycle' }, { char: '⚠️', name: 'warning' }, { char: '🚫', name: 'no entry prohibited' }, { char: '✅', name: 'check mark' }, { char: '☑️', name: 'checkbox' }, { char: '✔️', name: 'check' }, { char: '❌', name: 'cross mark x' }, { char: '❎', name: 'cross mark button' }, { char: '❓', name: 'question mark' }, { char: '❔', name: 'white question mark' }, { char: '❗', name: 'exclamation mark' }, { char: '❕', name: 'white exclamation' }, { char: '‼️', name: 'double exclamation' }, { char: '⁉️', name: 'question exclamation' }, { char: '💯', name: 'hundred points' }, { char: '🔆', name: 'bright' }, { char: '🔅', name: 'dim' }, { char: '🔴', name: 'red circle' }, { char: '🟠', name: 'orange circle' }, { char: '🟡', name: 'yellow circle' }, { char: '🟢', name: 'green circle' }, { char: '🔵', name: 'blue circle' }, { char: '🟣', name: 'purple circle' }, { char: '⚫', name: 'black circle' }, { char: '⚪', name: 'white circle' }, { char: '🟥', name: 'red square' }, { char: '🟧', name: 'orange square' }, { char: '🟨', name: 'yellow square' }, { char: '🟩', name: 'green square' }, { char: '🟦', name: 'blue square' }, { char: '🟪', name: 'purple square' }, { char: '⬛', name: 'black square' }, { char: '⬜', name: 'white square' }, { char: '🔺', name: 'red triangle up' }, { char: '🔻', name: 'red triangle down' }, { char: '💠', name: 'diamond dot' }, { char: '🔶', name: 'orange diamond' }, { char: '🔷', name: 'blue diamond' }, { char: '🔔', name: 'bell' }, { char: '🔕', name: 'bell mute' }, { char: '📢', name: 'loudspeaker' }, { char: '📣', name: 'megaphone' }, { char: '📯', name: 'postal horn' }, { char: '🔊', name: 'speaker loud' }, { char: '🔇', name: 'speaker muted' }, { char: '🎵', name: 'musical note' }, { char: '🎶', name: 'musical notes' }, { char: '🌈', name: 'rainbow' }, { char: '☀️', name: 'sun' }, { char: '🌤️', name: 'sun cloud' }, { char: '⛅', name: 'partly cloudy' }, { char: '🌥️', name: 'cloudy sun' }, { char: '☁️', name: 'cloud' }, { char: '🌦️', name: 'sun rain' }, { char: '🌧️', name: 'rain' }, { char: '⛈️', name: 'thunderstorm' }, { char: '🌩️', name: 'lightning cloud' }, { char: '🌨️', name: 'snow' }, { char: '❄️', name: 'snowflake' }, { char: '☃️', name: 'snowman' }, { char: '⛄', name: 'snowman' }, { char: '🌊', name: 'wave' }, { char: '💧', name: 'droplet' },
  ] },
  { label: 'Flags', emojis: [
    { char: '🏳️', name: 'white flag' }, { char: '🏴', name: 'black flag' }, { char: '🏁', name: 'checkered flag racing' }, { char: '🚩', name: 'triangular flag' }, { char: '🏳️‍🌈', name: 'rainbow pride flag' }, { char: '🏳️‍⚧️', name: 'transgender flag' }, { char: '🏴‍☠️', name: 'pirate flag' }, { char: '🇺🇸', name: 'united states usa flag' }, { char: '🇬🇧', name: 'united kingdom uk flag' }, { char: '🇨🇦', name: 'canada flag' }, { char: '🇲🇽', name: 'mexico flag' }, { char: '🇧🇷', name: 'brazil flag' }, { char: '🇦🇷', name: 'argentina flag' }, { char: '🇫🇷', name: 'france flag' }, { char: '🇩🇪', name: 'germany flag' }, { char: '🇮🇹', name: 'italy flag' }, { char: '🇪🇸', name: 'spain flag' }, { char: '🇵🇹', name: 'portugal flag' }, { char: '🇳🇱', name: 'netherlands flag' }, { char: '🇧🇪', name: 'belgium flag' }, { char: '🇸🇪', name: 'sweden flag' }, { char: '🇳🇴', name: 'norway flag' }, { char: '🇩🇰', name: 'denmark flag' }, { char: '🇫🇮', name: 'finland flag' }, { char: '🇮🇸', name: 'iceland flag' }, { char: '🇮🇪', name: 'ireland flag' }, { char: '🇨🇭', name: 'switzerland flag' }, { char: '🇦🇹', name: 'austria flag' }, { char: '🇬🇷', name: 'greece flag' }, { char: '🇵🇱', name: 'poland flag' }, { char: '🇺🇦', name: 'ukraine flag' }, { char: '🇷🇺', name: 'russia flag' }, { char: '🇹🇷', name: 'turkey flag' }, { char: '🇮🇱', name: 'israel flag' }, { char: '🇸🇦', name: 'saudi arabia flag' }, { char: '🇦🇪', name: 'uae flag' }, { char: '🇮🇳', name: 'india flag' }, { char: '🇨🇳', name: 'china flag' }, { char: '🇯🇵', name: 'japan flag' }, { char: '🇰🇷', name: 'south korea flag' }, { char: '🇹🇭', name: 'thailand flag' }, { char: '🇻🇳', name: 'vietnam flag' }, { char: '🇵🇭', name: 'philippines flag' }, { char: '🇮🇩', name: 'indonesia flag' }, { char: '🇲🇾', name: 'malaysia flag' }, { char: '🇸🇬', name: 'singapore flag' }, { char: '🇦🇺', name: 'australia flag' }, { char: '🇳🇿', name: 'new zealand flag' }, { char: '🇿🇦', name: 'south africa flag' }, { char: '🇪🇬', name: 'egypt flag' }, { char: '🇳🇬', name: 'nigeria flag' }, { char: '🇰🇪', name: 'kenya flag' }, { char: '🇲🇦', name: 'morocco flag' }, { char: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', name: 'england flag' }, { char: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', name: 'scotland flag' }, { char: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', name: 'wales flag' },
  ] },
];

// Flat pool used to draw a fresh random emoji set for the Emoji effect
// whenever a shuffle (Effects-tab or WAV button) lands on it.
const EMOJI_POOL: string[] = EMOJI_PICKER_CATEGORIES.flatMap(cat => cat.emojis.map(e => e.char));
export function pickRandomEmojiSet(count: number): string {
  const pool = EMOJI_POOL;
  const usedIdx = new Set<number>();
  const picked: string[] = [];
  while (picked.length < count && picked.length < pool.length) {
    const idx = Math.floor(Math.random() * pool.length);
    if (usedIdx.has(idx)) continue;
    usedIdx.add(idx);
    picked.push(pool[idx]);
  }
  return picked.join('');
}

// Splits a string into visual emoji units instead of raw codepoints. Flags
// (regional-indicator pairs like 🇮🇹) and ZWJ sequences (🏳️‍🌈, 🏴‍☠️, skin-tone
// modifiers) are made of 2+ codepoints each — Array.from(str) splits those
// apart, and an isolated regional-indicator letter has no visible glyph on
// most systems, so a flag in the Emoji effect's character ramp silently
// rendered nothing every cell it was picked for (black canvas, no error).
// Intl.Segmenter's grapheme granularity groups these correctly; it's been
// supported in every major browser since 2021+ so no fallback is needed.
export function splitGraphemes(str: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    return Array.from(segmenter.segment(str), (s) => s.segment);
  }
  return Array.from(str);
}

// Small pill showing a hotkey label, used in the About/Info panel's shortcut list
function Kbd({ label }: { label: string }) {
  return (
    <span className="shrink-0 text-[10px] text-white/70 bg-white/10 border border-white/15 rounded px-1.5 py-0.5 font-mono">
      {label}
    </span>
  );
}

export function EffectSection({ id, label, isMulti, expanded, onToggle, children }: {
  id: string; label: string; isMulti: boolean;
  expanded: boolean; onToggle: (id: string) => void;
  children: React.ReactNode;
}) {
  if (!isMulti) return <>{children}</>;
  return (
    <div className="border-b border-white/10 last:border-0">
      <button
        onClick={() => onToggle(id)}
        className="flex items-center justify-between w-full py-1 text-left bg-transparent outline-none hover:bg-transparent active:bg-transparent focus:outline-none appearance-none"
      >
        <span className="text-[10px] text-white/80 font-medium">{label}</span>
        <CaretDown weight="regular" className={`w-4 h-4 text-white/40 transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && <div className="flex flex-col gap-1 pb-1">{children}</div>}
    </div>
  );
}

// Live-performance "Display" window: a second, UI-less tab that mirrors the
// controller's canvas so the operator can drive the app from one screen
// while a clean, hotkey-only-hidden output projects on another. Synced via
// localStorage + the 'storage' event rather than BroadcastChannel — popups
// opened via window.open can land in a different agent cluster (browsers
// vary on this, especially under COOP), which silently breaks
// BroadcastChannel between opener and popup even same-origin; localStorage
// is origin-scoped and doesn't have that failure mode. The 'storage' event
// conveniently never fires in the tab that made the write, so no echo
// filtering is needed. Read once at module load — the URL flag never
// changes mid-session.
const IS_DISPLAY_MODE = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('display') === '1';
const DISPLAY_SYNC_KEY = 'wav-display-sync';
// Separate, higher-frequency channel just for the handful of continuously-
// ticking "AnimTime" fields (marble swirl, moire, aurora bands, etc.) that
// live outside buildSnapshot. Kept off the main config channel/localStorage
// on purpose — these tick every 16ms while playing, far too often for
// localStorage writes, and mixing them into buildSnapshot would make ITS
// identity (and therefore every undo/preset snapshot) change every frame.
const DISPLAY_ANIM_SYNC_KEY = 'wav-display-sync-anim';

export function InteractiveGradient() {
  const { angleStartOffset, setAngleStartOffset, angleCenterX, setAngleCenterX, angleCenterY, setAngleCenterY } = useAngleState();
  const { asciiSize, setAsciiSize, asciiColor, setAsciiColor, asciiChars, setAsciiChars } = useAsciiState();
  const { audioBindings, setAudioBindings } = useAudioBindingsState();
  const { attractorAnimTime, setAttractorAnimTime, attractorPointCount, setAttractorPointCount, attractorSpeed, setAttractorSpeed, attractorScale, setAttractorScale, attractorDotSize, setAttractorDotSize, attractorTrailFade, setAttractorTrailFade, attractorBufferRef, attractorPointsRef } = useAttractorState();
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
  const { colorShiftHue, setColorShiftHue } = useColorState();
  const { diffusionSpeed, setDiffusionSpeed, diffusionFeed, setDiffusionFeed, diffusionKill, setDiffusionKill, diffusionAnimTrigger, setDiffusionAnimTrigger } = useDiffusionState();
  const { diffusionGridRef } = useDiffusionGridState();
  const { digitalNoiseIntensity, setDigitalNoiseIntensity } = useDigitalNoiseState();
  const { ditherType, setDitherType, ditherLevels, setDitherLevels } = useDitherState();
  const { duotoneIntensity, setDuotoneIntensity, duotoneColor1, setDuotoneColor1, duotoneColor2, setDuotoneColor2, duotoneColor3, setDuotoneColor3, duotoneThreeColor, setDuotoneThreeColor } = useDuotoneState();
  const { dustCrackleIntensity, setDustCrackleIntensity, dustSize, setDustSize } = useDustState();
  const { emojiSize, setEmojiSize, emojiChars, setEmojiChars, emojiRotateSpeed, setEmojiRotateSpeed, emojiAnimTime, setEmojiAnimTime, emojiOffsetX, setEmojiOffsetX, emojiSizeVariation, setEmojiSizeVariation, emojiPickerSearch, setEmojiPickerSearch } = useEmojiState();
  const { fadeDirection, setFadeDirection } = useFadeState();
  const { feedbackDecay, setFeedbackDecay, feedbackZoom, setFeedbackZoom, feedbackRotation, setFeedbackRotation, feedbackBufferRef } = useFeedbackState();
  const { fieldContrast, setFieldContrast, paletteMode, setPaletteMode, paletteBands, setPaletteBands } = useFieldMappingState();
  const { fisheyeStrength, setFisheyeStrength, fisheyeCenterX, setFisheyeCenterX, fisheyeCenterY, setFisheyeCenterY } = useFisheyeState();
  const { flowerCircles, setFlowerCircles, flowerScale, setFlowerScale, flowerSpread, setFlowerSpread, flowerRotation, setFlowerRotation, flowerAnimTime, setFlowerAnimTime, flowAnimTime, setFlowAnimTime, flowParticleCount, setFlowParticleCount, flowSpeed, setFlowSpeed, flowScale, setFlowScale, flowThickness, setFlowThickness } = useFlowState();
  const { flowBufferRef } = useFlowBufferState();
  const { flowParticlesRef } = useFlowParticlesState();
  const { glitchIntensity, setGlitchIntensity, glitchBlockSize, setGlitchBlockSize, glitchChromaSplit, setGlitchChromaSplit } = useGlitchState();
  const { grainIntensity, setGrainIntensity, grainType, setGrainType } = useGrainState();
  const { gridSides, setGridSides, gridRows, setGridRows, gridColumns, setGridColumns, gridRotation, setGridRotation, gridVariation, setGridVariation, gridShapeSize, setGridShapeSize } = useGridState();
  const { gridRotationDirection, setGridRotationDirection, gridRotationDirectionRef } = useGridRotationDirectionState();
  const { halftoneSize, setHalftoneSize, halftoneVariation, setHalftoneVariation, halftoneMove, setHalftoneMove, halftoneMoveSpeed, setHalftoneMoveSpeed, halftoneCMYK, setHalftoneCMYK, halftoneTimeRef, halftoneMoveRef, halftoneAnimTrigger, setHalftoneAnimTrigger } = useHalftoneState();
  const { helixTurns, setHelixTurns, helixTightness, setHelixTightness } = useHelixState();
  const { hexGridSize, setHexGridSize } = useHexGridState();
  const { invertAmount, setInvertAmount } = useInvertState();
  const { iridescentAngle, setIridescentAngle, iridescentIntensity, setIridescentIntensity, iridescentScale, setIridescentScale } = useIridescentState();
  const { juliaReal, setJuliaReal, juliaImaginary, setJuliaImaginary, juliaZoom, setJuliaZoom, juliaIterations, setJuliaIterations, juliaCanvasRef } = useJuliaState();
  const { kaleidoscopeSegments, setKaleidoscopeSegments, kaleidoscopeReflections, setKaleidoscopeReflections, kaleidoscopeRotateSpeed, setKaleidoscopeRotateSpeed } = useKaleidoscopeState();
  const { lavaAnimTime, setLavaAnimTime, lavaBlobCount, setLavaBlobCount, lavaBlobSize, setLavaBlobSize, lavaSpeed, setLavaSpeed } = useLavaState();
  const { lightLeakIntensity, setLightLeakIntensity } = useLightLeakState();
  const { linesCount, setLinesCount, linesAngle, setLinesAngle, linesThickness, setLinesThickness } = useLinesState();
  const { liquidAnimTime, setLiquidAnimTime, liquidStrength, setLiquidStrength, liquidScale, setLiquidScale } = useLiquidState();
  const { liquifyStrength, setLiquifyStrength } = useLiquifyState();
  const { marbleAnimTime, setMarbleAnimTime, marbleVeinFreq, setMarbleVeinFreq, marbleTurbulence, setMarbleTurbulence, marbleOctaves, setMarbleOctaves } = useMarbleState();
  const { metaballAnimTime, setMetaballAnimTime, metaballCount, setMetaballCount, metaballSize, setMetaballSize, metaballSpeed, setMetaballSpeed } = useMetaballState();
  const { mirrorMode, setMirrorMode, mirrorTileCount, setMirrorTileCount } = useMirrorState();
  const { lastBroadcastSnapshotRef, syncChannelRef, animSyncChannelRef, animValuesRef, isDragging, setIsDragging, lastChangeTime, previousPosition, gradientType, setGradientType, resolutionMultiplier, setResolutionMultiplier, zoomBeatEnabled, setZoomBeatEnabled, shakeBeatEnabled, setShakeBeatEnabled, contrastBeatEnabled, setContrastBeatEnabled, paletteBeatEnabled, setPaletteBeatEnabled, isRecording, setIsRecording, isAutoMode, setIsAutoMode, isAutoColor, setIsAutoColor, gradientColors, setGradientColors, targetColors, setTargetColors, gradientAngle, setGradientAngle, targetAngle, setTargetAngle, zoom, setZoom, targetZoom, setTargetZoom, gradientColorsRef, gradientAngleRef, zoomRef, targetColorsRef, targetAngleRef, targetZoomRef, vcrPlaybackSpeedRef, isAutoModeRef, rotationDirectionRef, isVCRPlayingRef, isAudioActiveRef, drawParamsDirtyRef, lerpSyncFrameRef, isControlsVisible, setIsControlsVisible, isFullyHidden, setIsFullyHidden, isAboutOpen, setIsAboutOpen, isDisplayLinkCopied, setIsDisplayLinkCopied, rotationDirection, setRotationDirection, isDropdownOpen, setIsDropdownOpen, isMultiFxMode, setIsMultiFxMode, expandedEffects, setExpandedEffects, wavRandomGradient, setWavRandomGradient, isAIPromptOpen, setIsAIPromptOpen, isUploadDropdownOpen, setIsUploadDropdownOpen, aiPrompt, setAIPrompt, submittedAIPrompt, setSubmittedAIPrompt, containerRef, activeEffects, setActiveEffects, isExportDropdownOpen, setIsExportDropdownOpen, showWavHint, setShowWavHint, isGradientsOpen, setIsGradientsOpen, isEffectsOpen, setIsEffectsOpen, activeTab, setActiveTab, isAIColorPickerOpen, setIsAIColorPickerOpen, isKeywordHelpOpen, setIsKeywordHelpOpen, concentricRingWidth, setConcentricRingWidth, concentricRingCount, setConcentricRingCount, scanType, setScanType, isEmojiPickerOpen, setIsEmojiPickerOpen, baseAIColors, setBaseAIColors, showRatingUI, setShowRatingUI, ratedResults, setRatedResults, pendingRatingState, setPendingRatingState, fileInputRef, videoInputRef, isFullscreen, setIsFullscreen, lastManualZoomTime, kaleidoAngleRef, prevBassForRippleRef, isAutoColorRef, contrastPulseRef, saturationPulseRef, shakeRef, shakeWrapperRef, activeEffectsRef, gradientTypeRef } = useMiscState();
  const { moireAnimTime, setMoireAnimTime, moireScale, setMoireScale, moireOffset, setMoireOffset, moireSpeed, setMoireSpeed } = useMoireState();
  const { noiseScale, setNoiseScale, noiseOctaves, setNoiseOctaves, noiseDirection, setNoiseDirection, noiseWarp, setNoiseWarp, noiseType, setNoiseType } = useNoiseState();
  const { panelDragRef } = usePanelDragState();
  const { panelPos, setPanelPos } = usePanelPosState();
  // 1024 rather than the hook's 768 default -- covers tablets too, not
  // just phones, per explicit request ("only on mobile/tablet"). One
  // breakpoint drives the bottom-sheet panel, the collapsed cluster, and
  // the About button's position together so none of them can disagree
  // about which layout mode is active at a given width.
  const isMobile = useIsMobile(1024);
  const panelRef = useRef<HTMLDivElement>(null);
  // Closing (or switching) a tab shrinks the panel's content height, but
  // the browser doesn't reset scroll position on its own -- on the mobile
  // sheet (capped at 70dvh with its own overflow-y-auto) this could leave
  // the sheet scrolled to where the now-collapsed tab content used to be,
  // showing empty space with the tab bar scrolled out of reach and no
  // obvious way back. Reset to the top on every activeTab change so
  // toggling a tab open or closed always lands on a sensible view.
  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0 });
  }, [activeTab]);
  const { photoBlendMode, setPhotoBlendMode, photoOpacity, setPhotoOpacity, photoFileName, setPhotoFileName, photoVersion, setPhotoVersion, photoImageRef, photoInputRef } = usePhotoState();
  const { pinchStrength, setPinchStrength } = usePinchState();
  const { pixelSize, setPixelSize, pixelateScaleDirection, setPixelateScaleDirection } = usePixelState();
  const { plasmaSpeed, setPlasmaSpeed, plasmaComplexity, setPlasmaComplexity, plasmaZoomScale, setPlasmaZoomScale } = usePlasmaState();
  const { polygon2Sides, setPolygon2Sides } = usePolygon2State();
  const { posterizeLevels, setPosterizeLevels, posterizeSolarize, setPosterizeSolarize } = usePosterizeState();
  const { radarSweepAngle, setRadarSweepAngle, radarFadeLength, setRadarFadeLength, radarBeamWidth, setRadarBeamWidth } = useRadarState();
  const { radialSizeScale, setRadialSizeScale } = useRadialState();
  const { radialBurstCount, setRadialBurstCount, radialBurstSpread, setRadialBurstSpread, radialBurstSize, setRadialBurstSize } = useRadialBurstState();
  const { reactionDiffusionFeed, setReactionDiffusionFeed, reactionDiffusionKill, setReactionDiffusionKill, reactionDiffusionSpeed, setReactionDiffusionSpeed } = useReactionDiffusionState();
  const { reactionDiffusionGridRef } = useReactionDiffusionGridState();
  const { redoStackRef, redoDepth, setRedoDepth } = useRedoState();
  const { rippleAmplitude, setRippleAmplitude, rippleFrequency, setRippleFrequency, rippleRingsRef, rippleAutoFrameRef } = useRippleState();
  const { scanlineIntensity, setScanlineIntensity, scanlineSpacing, setScanlineSpacing, scanlineSpeed, setScanlineSpeed, scanLineSize, setScanLineSize } = useScanLineState();
  const { sepiaIntensity, setSepiaIntensity } = useSepiaState();
  const { shapesSides, setShapesSides, shapesCount, setShapesCount } = useShapesState();
  const { slitScanIntensity, setSlitScanIntensity, slitScanDirection, setSlitScanDirection, slitScanAnimTrigger, setSlitScanAnimTrigger, slitScanBufferRef } = useSlitScanState();
  const { solarizeThreshold, setSolarizeThreshold } = useSolarizeState();
  const { structuralSeed, setStructuralSeed } = useStructuralSeedState();
  const { topographicScale, setTopographicScale, topographicBands, setTopographicBands, topographicLineWidth, setTopographicLineWidth } = useTopographicState();
  const { triangleSize, setTriangleSize } = useTriangleState();
  const { truchetSize, setTruchetSize, truchetVariation, setTruchetVariation, truchetThickness, setTruchetThickness } = useTruchetState();
  const { twistAmount, setTwistAmount } = useTwistState();
  const { undoStackRef, undoIndexRef, undoDepth, setUndoDepth } = useUndoState();
  const { vhsGlitchIntensity, setVhsGlitchIntensity } = useVhsState();
  const { vignetteStrength, setVignetteStrength, vignetteSoftness, setVignetteSoftness } = useVignetteState();
  const { voronoiCellCount, setVoronoiCellCount, voronoiDistortion, setVoronoiDistortion, voronoiMorphSpeed, setVoronoiMorphSpeed, voronoiAnimTime, setVoronoiAnimTime } = useVoronoiState();
  const { waveNumberRef, waveRotationRef, waveScale, setWaveScale, waveAmplitude, setWaveAmplitude, waveFrequency, setWaveFrequency, waveNumber, setWaveNumber, waveRotation, setWaveRotation, waveDistortionStrength, setWaveDistortionStrength, waveDistortionRotation, setWaveDistortionRotation } = useWaveState();
  const { windmillTightness, setWindmillTightness, windmillRotations, setWindmillRotations, windmillThickness, setWindmillThickness, windmillZoom, setWindmillZoom } = useWindmillState();

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
  const randomizeWavGradient = () => {
    const hue = () => Math.floor(Math.random() * 360);
    const h1 = hue(), h2 = (h1 + 60 + Math.random() * 120) % 360, h3 = (h2 + 60 + Math.random() * 120) % 360;
    setWavRandomGradient(`linear-gradient(to top, hsl(${h1}, 85%, 60%), hsl(${h2}, 85%, 60%), hsl(${h3}, 85%, 60%))`);
  };
  // Single-open accordion: expanding one effect's controls collapses whichever
  // other one was open, instead of letting all active effects stack their
  // sliders open simultaneously — with 4-7 effects active that wall of
  // controls was the main driver of the control panel's excessive height.
  const toggleEffectExpanded = (id: string) => setExpandedEffects(prev => prev.has(id) ? new Set() : new Set([id]));
  
  // First-run hint explaining the tap/hold/double-tap gesture vocabulary —
  // tooltips (title attrs) never surface on touch devices, which is this
  // app's primary target, so without this the gestures are undiscoverable.
  const dismissWavHint = () => {
    setShowWavHint(false);
    try { localStorage.setItem('wavGestureHintSeen', '1'); } catch (err) {
      if (import.meta.env.DEV) console.warn('Failed to persist wavGestureHintSeen:', err);
    }
  };
  
  // Effect parameters
  // Dust-scratches was merged into film-grain — only its crackle-lines slider
  // survives as an add-on (the noise portion was identical to grain's own).
  // Tritone was merged into Duotone — this just adds a 3rd color stop.
  
  // New effect parameters
  // Bloom
  // Feedback / Trails
  // Ripple on beat
  // audioReactiveColors is now in useAudioReactivity hook
  
  // New dither, slit-scan, and diffusion effect parameters
  // Glitch — block-shuffle/datamosh: torn row shifts + displaced blocks + occasional RGB ghosting
  // Complexity and Scale were redundant — both just scale the same sine-wave
  // frequency terms, so Complexity was removed and its value folded into Scale.
  // Metaballs
  // Truchet tiles
  // Moire
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
  const handlePhotoFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      photoImageRef.current = img;
      setPhotoVersion(v => v + 1);
      URL.revokeObjectURL(url);
    };
    img.src = url;
    setPhotoFileName(file.name);
  }, []);
  
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
    audioContextRef,
    streamRef,
    handleFileUpload,
    startMicVisualization,
    stopMicVisualization,
    toggleAudio,
    initAudioContext,
  } = audio;

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
    vcrLoop, setVcrLoop,
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
  // PresetsPanel's "Copy shareable link" button). The full snapshot is
  // embedded directly in the URL rather than looked up from Firestore —
  // this app doesn't control its own Firestore security rules from the
  // client, so a new public collection can't be assumed readable by other
  // users. Runs once on mount; strips the param afterward so a reload
  // doesn't keep re-applying it (and so undo/redo/edits aren't fighting a
  // giant URL sitting in the address bar).
  useEffect(() => {
    if (IS_DISPLAY_MODE) return;
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

    // Watch for new sliders added to the DOM (conditional renders / dropdowns opening)
    const observer = new MutationObserver(() => initAll());
    observer.observe(document.body, { childList: true, subtree: true });

    initAll();
    return () => {
      document.removeEventListener('input', onInput);
      observer.disconnect();
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
  const innerPanelScrollRef = useRef<HTMLDivElement>(null);
  // TEMPORARY diagnostic overlay for the mobile-scroll investigation — shows
  // live touch-handler state on-screen so real-device behavior can be seen
  // directly instead of guessed at from this sandbox. Remove once the real
  // cause is found.
  const [scrollDebug, setScrollDebug] = useState<Record<string, any>>({});
  // Real bug found via the debug overlay above: the mobile panel's height
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
  const [visualViewportOffsetTop, setVisualViewportOffsetTop] = useState(0);
  useEffect(() => {
    if (!isMobile || typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;
    const onResize = () => {
      setVisualViewportHeight(vv.height);
      setVisualViewportOffsetTop(vv.offsetTop);
    };
    vv.addEventListener('resize', onResize);
    vv.addEventListener('scroll', onResize);
    onResize();
    return () => {
      vv.removeEventListener('resize', onResize);
      vv.removeEventListener('scroll', onResize);
    };
  }, [isMobile]);
  // The outer panel div scales this inner div by 1.15x (scale-[1.15]/
  // scale(1.15) below) — the layout-box max-height has to target the
  // CURRENTLY visible height divided by that same 1.15x, so the resulting
  // on-screen (scaled) size is what actually fits. Dropped from 0.7 to 0.55
  // of visible height for a much bigger safety margin — on-device testing
  // kept showing content visually crowding the bottom edge even when
  // scrollHeight didn't (yet) exceed clientHeight, so this trades some
  // panel size for headroom rather than continuing to chase the exact
  // pixel-perfect budget on a device this can't directly inspect.
  const mobilePanelMaxHeight = Math.floor((visualViewportHeight * 0.55) / 1.15);

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
    const loop = () => {
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
      if (!IS_DISPLAY_MODE) {
        const colorSpd = 0.025 * spd;
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
      gradientAngleRef.current += (targetAngleRef.current - gradientAngleRef.current) * (0.1 * spd);

      const zoomSpd = (isAutoModeRef.current ? 0.1 : 0.3) * spd;
      const zoomDiff = Math.abs(targetZoomRef.current - zoomRef.current);
      zoomRef.current += (targetZoomRef.current - zoomRef.current) * zoomSpd;

      // Skip draw when idle: nothing is actively animating and all values have settled.
      // Reaction-Diffusion is a standing exception — it's a live simulation that keeps
      // evolving on its own (feed/kill drift, perpetual sprinkling; see
      // drawReactionDiffusion.ts) rather than easing toward a fixed target, so without
      // this it would only ever get the handful of draw calls needed for colors/angle/
      // zoom to converge and then freeze solid, which is exactly the "diffuses and then
      // becomes static" bug this is fixing — the sim being alive under the hood is
      // meaningless if this loop stops calling draw() at all.
      const isAnimating = isAutoModeRef.current || isVCRPlayingRef.current || isAudioActiveRef.current
        || gradientTypeRef.current === 'reaction-diffusion';
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
      }

      // Halftone Move animation. The trigger still fires on both windows (it's
      // just a redraw nudge), but the actual halftoneTimeRef VALUE is only
      // ever advanced on the controller — Display's copy is overwritten by
      // the anim-sync receiver below instead, so both windows show the same
      // dot phase instead of two independently-advancing clocks.
      if (activeEffectsRef.current.includes('halftone') && halftoneMoveRef.current) {
        if (!IS_DISPLAY_MODE) halftoneTimeRef.current += 0.5 * spd;
        setHalftoneAnimTrigger(prev => prev + 1);
      }

      // Grid rotation animation. Skipped in Display mode; see the Voronoi
      // comment above — that value is pushed from the controller instead.
      if (!IS_DISPLAY_MODE && activeEffectsRef.current.includes('grid-effect') && gridRotationDirectionRef.current !== 'none') {
        setGridRotation(prev => {
          const increment = gridRotationDirectionRef.current === 'clockwise' ? 2 : -2;
          return (prev + increment) % 360;
        });
      }

      // Slit-scan animation
      if (activeEffectsRef.current.includes('slit-scan')) {
        setSlitScanAnimTrigger(prev => prev + 1);
      }

      const isPlayActive = isAutoModeRef.current || isVCRPlayingRef.current || isMicActiveRef.current;

      // Voronoi morphing — PLAY or mic active. Skipped in Display mode:
      // that clock is pushed from the controller instead, so both windows
      // stay frame-locked rather than drifting apart over time.
      if (!IS_DISPLAY_MODE && gradientTypeRef.current === 'voronoi' && isPlayActive) {
        setVoronoiAnimTime(prev => prev + 0.01 * (isAutoModeRef.current || isVCRPlayingRef.current ? spd : 1));
      }

      // Auto-rotate the gradient angle — PLAY active. Ticks every frame (like the radar
      // sweep below) instead of jumping once per 800ms: a big jump followed by the lerp
      // catching up in ~100ms meant the gradient sat still for most of every 800ms window,
      // which reads as stepped/incremental motion no matter how fast the draw call is.
      // Skipped in Display mode; see the Voronoi comment above — targetAngle is pushed
      // from the controller instead, so both windows converge on the same rotation
      // instead of each advancing their own independently and drifting apart (this was
      // the actual cause of the Display tab's angle/pattern slowly falling out of sync).
      if (!IS_DISPLAY_MODE && isAutoModeRef.current) {
        let rotationAmountPerFrame;
        if (gradientTypeRef.current === 'fade') {
          rotationAmountPerFrame = rotationDirectionRef.current === 'clockwise' ? 0.0167 : -0.0167;
        } else if (gradientTypeRef.current === 'waves') {
          rotationAmountPerFrame = rotationDirectionRef.current === 'clockwise' ? 0.00833 : -0.00833;
        } else {
          rotationAmountPerFrame = rotationDirectionRef.current === 'clockwise' ? 0.03125 : -0.03125;
        }
        // audioMidsLevel's natural range depends on the Mids multiplier
        // slider (0-5) and master sensitivity, not a fixed 0-1 — clamping
        // to 1 here keeps the speed boost within its documented "up to 5x"
        // intent regardless of how those are set, instead of autonomous
        // rotation occasionally spinning up to 20x+ on loud mids content.
        const midsBoost = isAudioActiveRef.current ? 1 + Math.min(1, audioMidsLevelRef.current) * 4 : 1;
        // These types rotate at 2x across every speed step. (Noise and Radial are
        // intentionally excluded — neither uses the rotation angle at all, so there's
        // no existing motion for them to speed up; see conversation for details.)
        const doubleSpeedTypes = ['angle', 'fade', 'helix', 'iridescent', 'radial-burst'];
        const angleSpeedBoost = doubleSpeedTypes.includes(gradientTypeRef.current) ? 2 : 1;
        setTargetAngle(prev => prev + (rotationAmountPerFrame * spd * angleSpeedBoost * midsBoost));
      }

      // Radar sweep — PLAY or mic active. Skipped in Display mode; see the
      // Voronoi comment above — that value is pushed from the controller instead.
      if (!IS_DISPLAY_MODE && gradientTypeRef.current === 'radar' && isPlayActive) {
        setRadarSweepAngle(prev => {
          const baseSpeed = isAutoModeRef.current || isVCRPlayingRef.current ? 2 * spd : 1.2;
          const audioBoost = isAudioActiveRef.current ? audioSubBassLevelRef.current * 6 : 0;
          return (prev + baseSpeed + audioBoost) % 360;
        });
      }

      // Flower rotation — only when PLAY is active. Skipped in Display
      // mode; see the Voronoi comment above.
      if (!IS_DISPLAY_MODE && gradientTypeRef.current === 'flower' && (isAutoModeRef.current || isVCRPlayingRef.current)) {
        setFlowerAnimTime(prev => prev + 0.5 * spd);
      }

      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Generate random color (memoized as it doesn't depend on state)
  const randomColor = useCallback((): ColorRGB => ({
    r: Math.floor(Math.random() * 256),
    g: Math.floor(Math.random() * 256),
    b: Math.floor(Math.random() * 256),
  }), []);


  // Each of these local clocks is skipped entirely in Display mode — that
  // tab's copies are pushed from the controller instead (see the animation
  // sync effect below), so the two windows stay frame-locked instead of
  // drifting apart.
  useEffect(() => {
    if (IS_DISPLAY_MODE) return;
    if (gradientType !== 'aurora' || (!isAutoMode && !isVCRPlaying && !isMicActive)) return;
    const id = setInterval(() => setAuroraAnimTime(t => t + 0.016 * vcrPlaybackSpeed), 16);
    return () => clearInterval(id);
  }, [gradientType, vcrPlaybackSpeed, isAutoMode, isVCRPlaying, isMicActive]);

  useEffect(() => {
    if (IS_DISPLAY_MODE) return;
    if (gradientType !== 'caustics' || (!isAutoMode && !isVCRPlaying && !isMicActive)) return;
    const id = setInterval(() => setCausticsAnimTime(t => t + 0.02 * vcrPlaybackSpeed), 16);
    return () => clearInterval(id);
  }, [gradientType, vcrPlaybackSpeed, isAutoMode, isVCRPlaying, isMicActive]);

  useEffect(() => {
    if (IS_DISPLAY_MODE) return;
    if (gradientType !== 'lava-lamp' || (!isAutoMode && !isVCRPlaying && !isMicActive)) return;
    const id = setInterval(() => setLavaAnimTime(t => t + 0.008 * vcrPlaybackSpeed), 16);
    return () => clearInterval(id);
  }, [gradientType, vcrPlaybackSpeed, isAutoMode, isVCRPlaying, isMicActive]);

  useEffect(() => {
    if (IS_DISPLAY_MODE) return;
    if (gradientType !== 'marble' || (!isAutoMode && !isVCRPlaying && !isMicActive)) return;
    const id = setInterval(() => setMarbleAnimTime(t => t + 0.02 * vcrPlaybackSpeed), 16);
    return () => clearInterval(id);
  }, [gradientType, vcrPlaybackSpeed, isAutoMode, isVCRPlaying, isMicActive]);

  useEffect(() => {
    if (IS_DISPLAY_MODE) return;
    if (gradientType !== 'metaballs' || (!isAutoMode && !isVCRPlaying && !isMicActive)) return;
    const id = setInterval(() => setMetaballAnimTime(t => t + 0.02 * vcrPlaybackSpeed * metaballSpeed), 16);
    return () => clearInterval(id);
  }, [gradientType, vcrPlaybackSpeed, isAutoMode, isVCRPlaying, isMicActive, metaballSpeed]);

  useEffect(() => {
    if (IS_DISPLAY_MODE) return;
    if (gradientType !== 'moire' || (!isAutoMode && !isVCRPlaying && !isMicActive)) return;
    const id = setInterval(() => setMoireAnimTime(t => t + 0.015 * vcrPlaybackSpeed * moireSpeed), 16);
    return () => clearInterval(id);
  }, [gradientType, vcrPlaybackSpeed, isAutoMode, isVCRPlaying, isMicActive, moireSpeed]);

  useEffect(() => {
    if (IS_DISPLAY_MODE) return;
    if (gradientType !== 'flow-field' || (!isAutoMode && !isVCRPlaying && !isMicActive)) return;
    const id = setInterval(() => setFlowAnimTime(t => t + 0.02 * vcrPlaybackSpeed * flowSpeed), 16);
    return () => clearInterval(id);
  }, [gradientType, vcrPlaybackSpeed, isAutoMode, isVCRPlaying, isMicActive, flowSpeed]);

  useEffect(() => {
    if (IS_DISPLAY_MODE) return;
    if (gradientType !== 'attractor' || (!isAutoMode && !isVCRPlaying && !isMicActive)) return;
    const id = setInterval(() => setAttractorAnimTime(t => t + 0.01 * vcrPlaybackSpeed * attractorSpeed), 16);
    return () => clearInterval(id);
  }, [gradientType, vcrPlaybackSpeed, isAutoMode, isVCRPlaying, isMicActive, attractorSpeed]);

  useEffect(() => {
    if (IS_DISPLAY_MODE) return;
    if (!activeEffects.includes('liquid') || (!isAutoMode && !isVCRPlaying && !isMicActive)) return;
    const id = setInterval(() => setLiquidAnimTime(t => t + 0.02 * vcrPlaybackSpeed), 16);
    return () => clearInterval(id);
  }, [activeEffects, vcrPlaybackSpeed, isAutoMode, isVCRPlaying, isMicActive]);

  // Emoji cells only spin while Play is active — frozen in place otherwise
  useEffect(() => {
    if (IS_DISPLAY_MODE) return;
    if (!activeEffects.includes('emoji') || (!isAutoMode && !isVCRPlaying && !isMicActive)) return;
    const id = setInterval(() => setEmojiAnimTime(t => t + (emojiRotateSpeed / 60) * vcrPlaybackSpeed), 16);
    return () => clearInterval(id);
  }, [activeEffects, vcrPlaybackSpeed, isAutoMode, isVCRPlaying, isMicActive, emojiRotateSpeed]);

  // Keep a ref mirror of the anim-time fields so the rAF broadcast loop
  // below can read fresh values every frame without itself needing to be
  // torn down and recreated on every tick (which a dependency array would
  // force, since these change ~60x/sec while playing).
  useEffect(() => {
    animValuesRef.current = {
      voronoiAnimTime, flowerAnimTime, auroraAnimTime, causticsAnimTime,
      lavaAnimTime, marbleAnimTime, metaballAnimTime, moireAnimTime,
      flowAnimTime, liquidAnimTime, emojiAnimTime, attractorAnimTime,
      audioSubBassLevel, audioMidsLevel, audioTrebleLevel, audioEnergy,
    };
  }, [voronoiAnimTime, flowerAnimTime, auroraAnimTime, causticsAnimTime, lavaAnimTime, marbleAnimTime, metaballAnimTime, moireAnimTime, flowAnimTime, liquidAnimTime, emojiAnimTime, attractorAnimTime, audioSubBassLevel, audioMidsLevel, audioTrebleLevel, audioEnergy]);

  // buildSnapshot/applySnapshot extracted to useSnapshot.ts (splitting-plan
  // step 3). The single source of truth for undo/redo AND presets, so it
  // touches nearly every piece of state (~380 values/setters).
  const { buildSnapshot, applySnapshot } = useSnapshot({
    activeEffects, angleCenterX, angleCenterY, angleStartOffset, asciiChars, asciiColor,
    asciiSize, auroraBandCount, auroraBandHeight, auroraWaveSpeed, autoGainEnabled, baseAIColors,
    depthLayerEnabled, depthLayerStrength, setDepthLayerEnabled, setDepthLayerStrength,
    glitchIntensity, glitchBlockSize, glitchChromaSplit, setGlitchIntensity, setGlitchBlockSize, setGlitchChromaSplit,
    juliaReal, juliaImaginary, juliaZoom, juliaIterations, setJuliaReal, setJuliaImaginary, setJuliaZoom, setJuliaIterations,
    fieldContrast, paletteMode, paletteBands, setFieldContrast, setPaletteMode, setPaletteBands,
    invertAmount, setInvertAmount,
    voronoiAnimTime, setVoronoiAnimTime, flowerAnimTime, setFlowerAnimTime, auroraAnimTime, setAuroraAnimTime,
    causticsAnimTime, setCausticsAnimTime, lavaAnimTime, setLavaAnimTime, marbleAnimTime, setMarbleAnimTime,
    metaballAnimTime, setMetaballAnimTime, moireAnimTime, setMoireAnimTime, flowAnimTime, setFlowAnimTime,
    liquidAnimTime, setLiquidAnimTime, emojiAnimTime, setEmojiAnimTime, attractorAnimTime, setAttractorAnimTime,
    structuralSeed, setStructuralSeed,
    audioBindings, setAudioBindings,
    bassBeatSync, bassMax, bassMin, bassMultiplier, bassSmoothing, bassThreshold,
    bloomIntensity, bloomRadius, blurGaussianAmount, blurMotionAmount, blurMotionDirection, blurRadialAmount,
    blurType, causticsBrightness, causticsScale, chromaticAngle, chromaticOffset,
    chromaticTrailsDecay, chromaticTrailsOffset, colorShiftHue, concentricRingCount, concentricRingWidth,
    helixTightness, helixTurns, contrastBeatEnabled, digitalNoiseIntensity, ditherLevels, ditherType,
    duotoneColor1, duotoneColor2, duotoneColor3, duotoneIntensity, duotoneThreeColor, dustCrackleIntensity,
    emojiChars, emojiOffsetX, emojiRotateSpeed, emojiSize, emojiSizeVariation, fadeDirection,
    feedbackDecay, feedbackRotation, feedbackZoom, fisheyeCenterX, fisheyeCenterY, fisheyeStrength,
    flowParticleCount, flowScale, flowSpeed, flowThickness,
    attractorPointCount, attractorScale, attractorSpeed, attractorDotSize, setAttractorPointCount, setAttractorScale, setAttractorSpeed, setAttractorDotSize,
    attractorTrailFade, setAttractorTrailFade,
    reactionDiffusionFeed, reactionDiffusionKill, reactionDiffusionSpeed,
    setReactionDiffusionFeed, setReactionDiffusionKill, setReactionDiffusionSpeed,
    topographicScale, topographicBands, topographicLineWidth,
    setTopographicScale, setTopographicBands, setTopographicLineWidth,
    flowerCircles, flowerRotation,
    flowerScale, flowerSpread, gradientAngle, gradientColors, gradientType, grainIntensity,
    grainType, gridColumns, gridRotation, gridRows, gridShapeSize, gridSides,
    gridVariation, halftoneCMYK, halftoneMove, halftoneMoveSpeed, halftoneSize, halftoneVariation,
    hexGridSize, iridescentAngle, iridescentIntensity, iridescentScale, isAudioEnabled, isAudioReactive,
    kaleidoscopeRotateSpeed, kaleidoscopeSegments, lavaBlobCount, lavaBlobSize, lavaSpeed, lightLeakIntensity,
    linesAngle, linesCount, linesThickness, liquidScale, liquidStrength, liquifyStrength,
    marbleOctaves, marbleTurbulence, marbleVeinFreq, masterSensitivity,
    metaballCount, metaballSize, metaballSpeed, midsBeatSync, midsMax, midsMin,
    midsMultiplier, midsSmoothing, midsThreshold, mirrorMode, mirrorTileCount, moireOffset,
    moireScale, moireSpeed, noiseDirection, noiseOctaves, noiseScale, noiseType,
    noiseWarp, paletteBeatEnabled, photoBlendMode, photoImageRef, photoOpacity, pinchStrength,
    pixelSize, plasmaComplexity, plasmaSpeed, plasmaZoomScale, polygon2Sides,
    posterizeLevels, radarBeamWidth, radarFadeLength, radarSweepAngle, radialBurstCount, radialBurstSize,
    radialBurstSpread, radialSizeScale, resolutionMultiplier, rippleAmplitude, rippleFrequency, scanLineSize,
    scanlineIntensity, scanlineSpacing, scanlineSpeed, sepiaIntensity, setActiveEffects, setAngleCenterX,
    setAngleCenterY, setAngleStartOffset, setAsciiChars, setAsciiColor, setAsciiSize, setAuroraBandCount,
    setAuroraBandHeight, setAuroraWaveSpeed, setAutoGainEnabled, setBaseAIColors, setBassBeatSync, setBassMax,
    setBassMin, setBassMultiplier, setBassSmoothing, setBassThreshold, setBloomIntensity, setBloomRadius,
    setBlurGaussianAmount, setBlurMotionAmount, setBlurMotionDirection, setBlurRadialAmount, setBlurType, setCausticsBrightness,
    setCausticsScale, setChromaticAngle, setChromaticOffset, setChromaticTrailsDecay, setChromaticTrailsOffset,
    setColorShiftHue, setConcentricRingCount, setConcentricRingWidth, setHelixTightness, setHelixTurns,
    setContrastBeatEnabled, setDigitalNoiseIntensity, setDitherLevels, setDitherType, setDuotoneColor1, setDuotoneColor2,
    setDuotoneColor3, setDuotoneIntensity, setDuotoneThreeColor, setDustCrackleIntensity, setEmojiChars, setEmojiOffsetX,
    setEmojiRotateSpeed, setEmojiSize, setEmojiSizeVariation, setFadeDirection, setFeedbackDecay, setFeedbackRotation,
    setFeedbackZoom, setFisheyeCenterX, setFisheyeCenterY, setFisheyeStrength, setFlowParticleCount, setFlowScale,
    setFlowSpeed, setFlowThickness, setFlowerCircles, setFlowerRotation, setFlowerScale, setFlowerSpread,
    setGradientAngle, setGradientColors, setGradientType, setGrainIntensity, setGrainType, setGridColumns,
    setGridRotation, setGridRows, setGridShapeSize, setGridSides, setGridVariation, setHalftoneCMYK,
    setHalftoneMove, setHalftoneMoveSpeed, setHalftoneSize, setHalftoneVariation, setHexGridSize, setIridescentAngle,
    setIridescentIntensity, setIridescentScale, setIsAudioEnabled, setIsAudioReactive, setKaleidoscopeRotateSpeed, setKaleidoscopeSegments,
    setLavaBlobCount, setLavaBlobSize, setLavaSpeed, setLightLeakIntensity, setLinesAngle, setLinesCount,
    setLinesThickness, setLiquidScale, setLiquidStrength, setLiquifyStrength, setMarbleOctaves, setMarbleTurbulence,
    setMarbleVeinFreq, setMasterSensitivity, setMetaballCount, setMetaballSize,
    setMetaballSpeed, setMidsBeatSync, setMidsMax, setMidsMin, setMidsMultiplier, setMidsSmoothing,
    setMidsThreshold, setMirrorMode, setMirrorTileCount, setMoireOffset, setMoireScale, setMoireSpeed,
    setNoiseDirection, setNoiseOctaves, setNoiseScale, setNoiseType, setNoiseWarp, setPaletteBeatEnabled,
    setPhotoBlendMode, setPhotoOpacity, setPinchStrength, setPixelSize, setPlasmaComplexity, setPlasmaSpeed,
    setPlasmaZoomScale, setPolygon2Sides, setPosterizeLevels, setRadarBeamWidth, setRadarFadeLength,
    setRadarSweepAngle, setRadialBurstCount, setRadialBurstSpread, setRadialSizeScale, setResolutionMultiplier, setRippleAmplitude,
    setRippleFrequency, setScanLineSize, setScanlineIntensity, setScanlineSpacing, setScanlineSpeed, setSepiaIntensity,
    setShakeBeatEnabled, setShapesCount, setShapesSides, setSlitScanDirection, setSlitScanIntensity, setSolarizeThreshold,
    setWindmillRotations, setWindmillThickness, setWindmillTightness, setWindmillZoom, setSubBassBeatSync, setSubBassMultiplier,
    setSubmittedAIPrompt, setTargetAngle, setTargetColors, setTargetZoom, setTrebleBeatSync, setTrebleMax,
    setTrebleMin, setTrebleMultiplier, setTrebleSmoothing, setTrebleThreshold, setTriangleSize, setTruchetSize,
    setTruchetThickness, setTruchetVariation, setTwistAmount, setVhsGlitchIntensity, setVignetteSoftness, setVignetteStrength,
    setVoronoiCellCount, setVoronoiDistortion, setWaveAmplitude, setWaveDistortionRotation, setWaveDistortionStrength, setWaveFrequency,
    setWaveNumber, setWaveRotation, setWaveScale, setZoom, setZoomBeatEnabled, shakeBeatEnabled,
    shapesCount, shapesSides, slitScanDirection, slitScanIntensity, solarizeThreshold, windmillRotations,
    windmillThickness, windmillTightness, windmillZoom, subBassBeatSync, subBassMultiplier, submittedAIPrompt,
    targetAngle, targetColors, targetZoom, trebleBeatSync, trebleMax, trebleMin,
    trebleMultiplier, trebleSmoothing, trebleThreshold, triangleSize, truchetSize, truchetThickness,
    truchetVariation, twistAmount, vhsGlitchIntensity, vignetteSoftness, vignetteStrength, voronoiCellCount,
    voronoiDistortion, waveAmplitude, waveDistortionRotation, waveDistortionStrength, waveFrequency, waveNumber,
    waveRotation, waveScale, zoom, zoomBeatEnabled,
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
    activeEffects, adjustColorArrayLength, gradientAngle, gradientColors, gradientType, isAudioEnabled, isAudioReactive,
    kaleidoscopeSegments, pixelSize,
    plasmaSpeed, randomColor, randomHexColor, ratedResults, saveCurrentState, setActiveEffects,
    setAngleCenterX, setAngleCenterY, setAngleStartOffset, setAsciiSize, setAsciiColor, setAuroraBandCount, setAuroraBandHeight,
    setAuroraWaveSpeed, setBaseAIColors, setBassBeatSync, setBassMultiplier, setBloomIntensity, setBloomRadius, setBlurGaussianAmount, setBlurMotionAmount,
    setBlurMotionDirection, setBlurRadialAmount, setBlurType, setCausticsBrightness, setCausticsScale, setChromaticAngle, setChromaticOffset,
    setChromaticTrailsDecay, setChromaticTrailsOffset, setColorShiftHue, setConcentricRingCount, setConcentricRingWidth,
    setHelixTightness, setHelixTurns, setContrastBeatEnabled, setDigitalNoiseIntensity, setDitherLevels, setDitherType,
    setDuotoneColor1, setDuotoneColor2, setDuotoneColor3, setDuotoneIntensity, setDuotoneThreeColor, setDustCrackleIntensity, setEmojiChars,
    setEmojiRotateSpeed, setEmojiSize, setEmojiSizeVariation, setFadeDirection, setFeedbackDecay, setFeedbackRotation, setFeedbackZoom,
    setFisheyeCenterX, setFisheyeCenterY, setFisheyeStrength, setFlowParticleCount, setFlowScale, setFlowSpeed, setFlowThickness, setFlowerCircles,
    setAsciiChars, setGrainType, setGridRotationDirection, setKaleidoscopeRotateSpeed, setLiquidScale, setLiquidStrength,
    setNoiseType, setNoiseWarp, setPlasmaZoomScale, setRadialSizeScale, setRippleFrequency, setVignetteSoftness, setWaveDistortionRotation,
    setJuliaReal, setJuliaImaginary, setJuliaZoom, setJuliaIterations,
    setReactionDiffusionFeed, setReactionDiffusionKill, setReactionDiffusionSpeed,
    setAttractorPointCount, setAttractorScale, setAttractorSpeed, setAttractorDotSize, setAttractorTrailFade,
    setTopographicScale, setTopographicBands, setTopographicLineWidth,
    setFieldContrast, setPaletteMode, setPaletteBands, setInvertAmount,
    setGlitchIntensity, setGlitchBlockSize, setGlitchChromaSplit,
    setSlitScanIntensity, setSlitScanDirection,
    setFlowerScale, setFlowerSpread, setGradientColors, setGradientType, setGrainIntensity, setGridColumns,
    setGridRotation, setGridRows, setGridShapeSize, setGridSides, setGridVariation, setHalftoneMove, setHalftoneCMYK,
    setHalftoneMoveSpeed, setHalftoneSize, setHalftoneVariation, setHexGridSize, setIridescentAngle, setIridescentIntensity,
    setIridescentScale, setIsMultiFxMode, setKaleidoscopeSegments, setLavaBlobCount, setLavaBlobSize, setLightLeakIntensity,
    setMidsBeatSync, setMidsMultiplier,
    setLinesAngle, setLinesCount, setLinesThickness, setLiquifyStrength, setMarbleOctaves, setMarbleTurbulence,
    setMarbleVeinFreq, setMasterSensitivity, setMetaballCount, setMetaballSize, setMetaballSpeed, setMirrorMode,
    setMirrorTileCount, setMoireOffset, setMoireScale, setMoireSpeed, setNoiseDirection, setNoiseOctaves,
    setNoiseScale, setPaletteBeatEnabled, setPinchStrength, setPixelSize, setPlasmaComplexity, setPlasmaSpeed,
    setPolygon2Sides, setPosterizeLevels, setRadarBeamWidth, setRadarFadeLength, setRadialBurstCount,
    setRadialBurstSize, setRadialBurstSpread, setRippleAmplitude, setRotationDirection, setScanLineSize, setScanlineIntensity,
    setScanlineSpacing, setScanlineSpeed, setSepiaIntensity, setShakeBeatEnabled, setShapesCount,
    setShapesSides, setShowRatingUI, setSolarizeThreshold, setWindmillRotations, setWindmillThickness, setWindmillTightness,
    setWindmillZoom, setSubBassBeatSync, setSubBassMultiplier, setSubmittedAIPrompt, setTargetAngle, setTargetColors, setTargetZoom, setTriangleSize,
    setAudioBindings,
    setTrebleBeatSync, setTrebleMultiplier,
    setTruchetSize, setTruchetThickness, setTruchetVariation, setTwistAmount, setVcrPlaybackSpeed, setVhsGlitchIntensity, setVignetteStrength,
    setVoronoiCellCount, setVoronoiDistortion, setWaveAmplitude, setWaveDistortionStrength, setWaveFrequency, setWaveNumber,
    setWaveRotation, setZoom, setZoomBeatEnabled, windmillTightness, twistAmount, vignetteStrength,
    zoom,
  });

  // Shared tap/hold/double-tap gesture handling for the WĀV button — one
  // instance, spread onto both the collapsed-cluster button and the
  // main-panel wordmark below (they're mutually exclusive: only one is ever
  // interactive at a time since the other is opacity-0/pointer-events-none).
  const wavGesture = useWavGesture(evolveWithFactor, () => {
    dismissWavHint();
    randomizeWavGradient();
  });
  const { isWavHolding } = wavGesture;

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
    if (!IS_DISPLAY_MODE) return;
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

  // Receive the anim-time fields (Display mode only) — applied directly via
  // their setters since these aren't part of buildSnapshot/applySnapshot.
  useEffect(() => {
    if (!IS_DISPLAY_MODE || typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel(DISPLAY_ANIM_SYNC_KEY);
    channel.onmessage = (e) => {
      const v = e.data;
      if (!v) return;
      setVoronoiAnimTime(v.voronoiAnimTime);
      setFlowerAnimTime(v.flowerAnimTime);
      setAuroraAnimTime(v.auroraAnimTime);
      setCausticsAnimTime(v.causticsAnimTime);
      setLavaAnimTime(v.lavaAnimTime);
      setMarbleAnimTime(v.marbleAnimTime);
      setMetaballAnimTime(v.metaballAnimTime);
      setMoireAnimTime(v.moireAnimTime);
      setFlowAnimTime(v.flowAnimTime);
      setLiquidAnimTime(v.liquidAnimTime);
      setEmojiAnimTime(v.emojiAnimTime);
      setAttractorAnimTime(v.attractorAnimTime);
      setAudioSubBassLevel(v.audioSubBassLevel ?? 0);
      setAudioMidsLevel(v.audioMidsLevel ?? 0);
      setAudioTrebleLevel(v.audioTrebleLevel ?? 0);
      setAudioEnergy(v.audioEnergy ?? 0);
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

  // Jump all the way back to the oldest snapshot in the stack
  const undoAll = useCallback(() => {
    if (undoIndexRef.current < 0) return;
    undoIndexRef.current = 0;
    undoLastChange();
  }, [undoLastChange]);

  // Reset everything to defaults — shared by the Reset button and the "R" hotkey
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

  // Capture current state for rating
  const captureCurrentStateForRating = useCallback(() => {
    setPendingRatingState({
      gradientColors,
      gradientType,
      activeEffects,
      audioWasActive: isAudioEnabled && isAudioReactive,
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
      digitalNoiseIntensity,
      duotoneIntensity,
      duotoneColor1,
      duotoneColor2,
      dustCrackleIntensity,
      hexGridSize,
      lightLeakIntensity,
      linesCount,
      linesAngle,
      linesThickness,
      liquifyStrength,
      pinchStrength,
      scanLineSize,
      sepiaIntensity,
      solarizeThreshold,
      gridSides,
      duotoneColor3,
      duotoneThreeColor,
      vhsGlitchIntensity,
      gridRows,
      gridColumns,
      polygon2Sides,
      waveDistortionStrength,
      windmillTightness,
      windmillRotations,
      windmillThickness,
      windmillZoom,
      shapesSides,
      shapesCount,
      concentricRingWidth,
      concentricRingCount,
      waveAmplitude,
      waveFrequency,
      waveNumber,
      waveRotation,
      noiseScale,
      noiseOctaves,
      noiseDirection,
      plasmaSpeed,
      plasmaComplexity,
      radialBurstCount,
      radialBurstSpread,
      radialBurstSize,
      voronoiCellCount,
      voronoiDistortion,
      helixTurns,
      helixTightness,
            gridRotation,
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
    grainIntensity, blurMotionAmount, blurMotionDirection, blurGaussianAmount, blurRadialAmount,
    posterizeLevels, halftoneSize, halftoneVariation, halftoneMove, halftoneMoveSpeed, vignetteStrength,
    colorShiftHue, digitalNoiseIntensity, duotoneIntensity, duotoneColor1, duotoneColor2, dustCrackleIntensity,
    hexGridSize, lightLeakIntensity, linesCount, linesAngle, linesThickness, liquifyStrength, pinchStrength,
    scanLineSize, sepiaIntensity, solarizeThreshold,
    gridSides, duotoneColor3, duotoneThreeColor,
    vhsGlitchIntensity, gridRows, gridColumns, polygon2Sides, waveDistortionStrength,
    windmillTightness, windmillRotations, windmillThickness, windmillZoom, shapesSides, shapesCount,
    concentricRingWidth, concentricRingCount, waveAmplitude, waveFrequency,
    noiseScale, noiseOctaves, plasmaSpeed, plasmaComplexity, plasmaZoomScale, radialBurstCount, radialBurstSpread,
    voronoiCellCount, voronoiDistortion, helixTurns, helixTightness, gridRotation, angleStartOffset, angleCenterX, angleCenterY,
    iridescentAngle, iridescentIntensity, iridescentScale,
    isAudioEnabled, isAudioReactive,
  ]);
  
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
    if (selectedEffects.includes('emoji')) setEmojiChars(pickRandomEmojiSet(5));

    // Randomize all FX slider variables
    setKaleidoscopeSegments(Math.floor(Math.random() * 20) + 3); // 3-22
    setTwistAmount(Math.random() * 5); // 0-5
    setPixelSize(Math.floor(Math.random() * 50) + 5); // 5-54
    setTriangleSize(Math.floor(Math.random() * 80) + 20); // 20-99
    setChromaticOffset(Math.floor(Math.random() * 20) + 1); // 1-20
    setFisheyeStrength(Math.random()); // 0-1
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
    setDigitalNoiseIntensity(Math.random()); // 0-1
    setDuotoneIntensity(Math.random()); // 0-1
    setDustCrackleIntensity(Math.random()); // 0-1
    setHexGridSize(Math.floor(Math.random() * 190) + 10); // 10-200
    setLightLeakIntensity(Math.random()); // 0-1
    setLinesCount(Math.floor(Math.random() * 150) + 10); // 10-159
    setLinesAngle(Math.floor(Math.random() * 360)); // 0-360
    setLinesThickness(Math.floor(Math.random() * 49) + 1); // 1-50
    setLiquifyStrength(Math.floor(Math.random() * 80) + 10); // 10-89
    setPinchStrength(Math.random()); // 0-1
    setScanLineSize(Math.floor(Math.random() * 15) + 2); // 2-16
    setSepiaIntensity(Math.random()); // 0-1
    setSolarizeThreshold(Math.floor(Math.random() * 255)); // 0-255
    setGridSides(Math.floor(Math.random() * 10) + 1); // 1-10 sides
    setVhsGlitchIntensity(Math.random()); // 0-1
    setGridRows(Math.floor(Math.random() * 50) + 1); // 1-50
    setGridColumns(Math.floor(Math.random() * 50) + 1); // 1-50
    setPolygon2Sides(Math.floor(Math.random() * 10) + 1); // 1-10
    setWaveDistortionStrength(Math.floor(Math.random() * 80) + 10); // 10-89

    // Randomize duotone colors
    setDuotoneColor1(randomHexColor());
    setDuotoneColor2(randomHexColor());
    setDuotoneColor3(randomHexColor());
  }, [ALL_EFFECTS, randomHexColor]);

  // Shuffle Audiovisuals - randomize the Audio Controls panel (sliders +
  // BEAT/FX-on-Beat toggles), matching each control's actual slider range.
  // Leaves Auto Gain untouched — it's a mode switch, not a randomizable range.

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
    const shouldApplyHueShift = isAudioEnabled && isAudioReactive && audioTrebleLevel > 0;
    
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
      h = (h + audioTrebleLevel / 360) % 1;
      
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
  // structuralSeed, which Caustics/Voronoi/Marble/Plasma/Metaballs/
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
      if (gradientType === 'fade') {
        setTargetColors(prev => prev.map((color, index) => applyColorShift(color, baseAIColors?.[index] || null, 8)));
      } else if (gradientType === 'waves' || gradientType === 'voronoi' || gradientType === 'radial-burst' || gradientType === 'flower' || gradientType === 'noise') {
        setTargetColors(prev => prev.map((color, index) => applyColorShift(color, baseAIColors?.[index] || null, 60)));
      } else {
        const numColorsToChange = Math.floor(Math.random() * 2) + 2;
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
    kaleidoscopeSegments, kaleidoscopeRotateSpeed, twistAmount, pixelSize, triangleSize, chromaticOffset, fisheyeStrength,
    grainIntensity, grainType, blurMotionAmount, blurGaussianAmount, blurRadialAmount,
    blurMotionDirection, blurType, posterizeLevels, halftoneSize, halftoneVariation, halftoneMove,
    halftoneMoveSpeed, halftoneAnimTrigger, halftoneCMYK, bloomIntensity, bloomRadius, feedbackDecay, feedbackZoom, feedbackRotation, rippleAmplitude, rippleFrequency, vignetteStrength, scanlineIntensity, scanlineSpacing, scanlineSpeed, colorShiftHue, pinchStrength, scanLineSize, hexGridSize, linesCount, linesAngle, linesThickness,
    dustCrackleIntensity, vhsGlitchIntensity, waveDistortionStrength,
    waveDistortionRotation, liquifyStrength, sepiaIntensity, solarizeThreshold,
    lightLeakIntensity, duotoneIntensity, duotoneColor1, duotoneColor2, duotoneColor3, duotoneThreeColor,
    digitalNoiseIntensity, gridRotation, gridRows, gridColumns, gridShapeSize,
    gridVariation, angleStartOffset, angleCenterX, angleCenterY, windmillTightness, windmillRotations,
    windmillThickness, windmillZoom, shapesSides, shapesCount, concentricRingWidth, concentricRingCount,
    waveAmplitude, waveFrequency, waveNumber, waveRotation, waveScale, radialSizeScale, noiseScale, noiseOctaves, noiseWarp, noiseType, plasmaSpeed,
    plasmaComplexity, plasmaZoomScale, radialBurstCount, radialBurstSpread, radialBurstSize, voronoiCellCount, voronoiDistortion,
    voronoiAnimTime, helixTurns, helixTightness,
    iridescentAngle, iridescentIntensity, iridescentScale, radarSweepAngle, radarFadeLength,
    flowerCircles, flowerScale, flowerSpread, flowerRotation, flowerAnimTime,
    auroraAnimTime, auroraBandCount, auroraWaveSpeed, auroraBandHeight,
    causticsAnimTime, causticsBrightness, causticsScale,
    lavaAnimTime, lavaBlobCount, lavaBlobSize, lavaSpeed,
    marbleAnimTime, marbleVeinFreq, marbleTurbulence, marbleOctaves,
    noiseDirection,
    ditherType, ditherLevels, slitScanIntensity, slitScanDirection,
    slitScanAnimTrigger, glitchIntensity, glitchBlockSize, glitchChromaSplit, addGradientStops, isAudioEnabled, isAudioReactive, audioSubBassLevel,
    audioMidsLevel, audioTrebleLevel, audioEnergy, audioBindings,
    fieldContrast, paletteMode, paletteBands, invertAmount, attractorTrailFade, structuralSeed,
    depthLayerEnabled, depthLayerStrength,
  }), [resolutionMultiplier, gradientType, activeEffects, kaleidoscopeSegments, kaleidoscopeRotateSpeed, twistAmount, pixelSize, triangleSize, chromaticOffset, fisheyeStrength, grainIntensity, grainType, blurMotionAmount, blurGaussianAmount, blurRadialAmount, blurMotionDirection, blurType, posterizeLevels, halftoneSize, halftoneVariation, halftoneMove, halftoneMoveSpeed, halftoneAnimTrigger, halftoneCMYK, bloomIntensity, bloomRadius, feedbackDecay, feedbackZoom, feedbackRotation, rippleAmplitude, rippleFrequency, vignetteStrength, scanlineIntensity, scanlineSpacing, scanlineSpeed, colorShiftHue, pinchStrength, scanLineSize, hexGridSize, linesCount, linesAngle, linesThickness, dustCrackleIntensity, vhsGlitchIntensity, waveDistortionStrength, waveDistortionRotation, liquifyStrength, sepiaIntensity, solarizeThreshold, lightLeakIntensity, duotoneIntensity, duotoneColor1, duotoneColor2, duotoneColor3, duotoneThreeColor, digitalNoiseIntensity, gridRotation, gridRows, gridColumns, gridShapeSize, gridVariation, angleStartOffset, angleCenterX, angleCenterY, windmillTightness, windmillRotations, windmillThickness, windmillZoom, shapesSides, shapesCount, concentricRingWidth, concentricRingCount, polygon2Sides, waveAmplitude, waveFrequency, waveNumber, waveRotation, waveScale, radialSizeScale, noiseScale, noiseOctaves, noiseWarp, noiseType, plasmaSpeed, plasmaComplexity, plasmaZoomScale, radialBurstCount, radialBurstSpread, radialBurstSize, voronoiCellCount, voronoiDistortion, voronoiAnimTime, helixTurns, helixTightness, iridescentAngle, iridescentIntensity, iridescentScale, radarSweepAngle, radarFadeLength, flowerCircles, flowerScale, flowerSpread, flowerRotation, flowerAnimTime, auroraAnimTime, auroraBandCount, auroraWaveSpeed, auroraBandHeight, causticsAnimTime, causticsBrightness, causticsScale, lavaAnimTime, lavaBlobCount, lavaBlobSize, lavaSpeed, marbleAnimTime, marbleVeinFreq, marbleTurbulence, marbleOctaves, noiseDirection, ditherType, ditherLevels, slitScanIntensity, slitScanDirection, slitScanAnimTrigger, addGradientStops, isAudioEnabled, isAudioReactive, audioSubBassLevel, audioMidsLevel, audioTrebleLevel, audioEnergy, fadeDirection, radarBeamWidth, chromaticAngle, vignetteSoftness, fisheyeCenterX, fisheyeCenterY, mirrorMode, mirrorTileCount, metaballAnimTime, metaballCount, metaballSize, metaballSpeed, truchetSize, truchetVariation, truchetThickness, moireAnimTime, moireScale, moireOffset, moireSpeed, flowAnimTime, flowParticleCount, flowSpeed, flowScale, flowThickness, attractorAnimTime, attractorPointCount, attractorSpeed, attractorScale, attractorDotSize, reactionDiffusionFeed, reactionDiffusionKill, reactionDiffusionSpeed, topographicScale, topographicBands, topographicLineWidth, juliaReal, juliaImaginary, juliaZoom, juliaIterations, glitchIntensity, glitchBlockSize, glitchChromaSplit, asciiSize, asciiColor, asciiChars, emojiSize, emojiChars, emojiRotateSpeed, emojiAnimTime, liquidAnimTime, liquidStrength, liquidScale, chromaticTrailsDecay, chromaticTrailsOffset, fieldContrast, paletteMode, paletteBands, invertAmount, attractorTrailFade, structuralSeed, audioBindings, photoVersion, photoBlendMode, photoOpacity, depthLayerEnabled, depthLayerStrength]);

  // Keep wave refs in sync so the draw function always reads current values without stale closure.
  useEffect(() => { waveNumberRef.current = waveNumber; drawParamsDirtyRef.current = true; }, [waveNumber]);
  useEffect(() => { waveRotationRef.current = waveRotation; drawParamsDirtyRef.current = true; }, [waveRotation]);

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
    activeEffects, addGradientStops, angleCenterX, angleCenterY, angleStartOffset, asciiChars,
    asciiColor, asciiSize, attractorAnimTime, attractorBufferRef, attractorPointCount, attractorPointsRef,
    attractorScale, attractorDotSize, audioMidsLevel, audioSubBassLevel, audioTrebleLevel, audioEnergy, audioBindings, musicIntensityRef, auroraAnimTime,
    auroraBandCount, auroraBandHeight, auroraWaveSpeed, bassThreshold, bloomIntensity, bloomRadius,
    blurGaussianAmount, blurMotionAmount, blurMotionDirection, blurRadialAmount, blurType, canvasRef,
    causticsAnimTime, causticsBrightness, causticsScale, chromaticAngle, chromaticOffset,
    chromaticTrailsBufferRef, chromaticTrailsDecay, chromaticTrailsOffset, colorShiftHue, concentricRingCount,
    concentricRingWidth, helixTightness, helixTurns, ditherLevels, ditherType, drawParams,
    glitchIntensity, glitchBlockSize, glitchChromaSplit,
    fieldContrast, paletteMode, paletteBands, invertAmount, attractorTrailFade, structuralSeed,
    depthLayerEnabled, depthLayerStrength,
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
    lavaAnimTime, lavaBlobCount, lavaBlobSize, lavaSpeed,
    liquidAnimTime, liquidScale,
    liquidStrength, marbleAnimTime, marbleOctaves, marbleTurbulence, marbleVeinFreq,
    metaballAnimTime, metaballCount, metaballSize, mirrorMode, mirrorTileCount,
    moireAnimTime, moireOffset, moireScale, noiseDirection, noiseOctaves, noiseScale,
    noiseType, noiseWarp, photoBlendMode, photoImageRef, photoOpacity, pixelSize,
    plasmaComplexity, plasmaZoomScale, polygon2Sides, posterizeLevels, prevBassForRippleRef,
    radarBeamWidth, radarFadeLength, radarSweepAngle, radialBurstCount, radialBurstSize, radialBurstSpread,
    radialSizeScale, reactionDiffusionFeed, reactionDiffusionGridRef, reactionDiffusionKill, reactionDiffusionSpeed,
    resolutionMultiplier, rippleAmplitude, rippleAutoFrameRef, rippleRingsRef, scanlineIntensity,
    scanlineSpacing, scanlineSpeed, shapesCount, shapesSides, slitScanBufferRef, slitScanDirection,
    slitScanIntensity,
    windmillRotations, windmillThickness, windmillTightness, windmillZoom, triangleSize,
    topographicBands, topographicLineWidth, topographicScale,
    juliaReal, juliaImaginary, juliaZoom, juliaIterations, juliaCanvasRef,
    truchetSize, truchetThickness, truchetVariation, vhsGlitchIntensity, vignetteSoftness, vignetteStrength,
    voronoiAnimTime, voronoiCellCount, voronoiDistortion, waveAmplitude, waveDistortionRotation, waveDistortionStrength,
    waveFrequency, waveNumberRef, waveRotationRef, waveScale, zoom, zoomRef,
  });



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
    // Self-animating gradients — drag interaction conflicts with their own animation
    if (NO_DRAG_TYPES.includes(gradientType ?? '')) return;

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

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    previousPosition.current = null;
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    previousPosition.current = null;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
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
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;

      switch (e.key) {
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
          if (isFullyHidden) {
            setIsFullyHidden(false);
          } else if (isControlsVisible) {
            setIsControlsVisible(false);
          } else {
            setIsFullyHidden(true);
          }
          break;
        case 's': case 'S':
          e.preventDefault();
          exportAsPNG();
          break;
        case 'r': case 'R':
          e.preventDefault();
          resetToDefaults();
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
        case '?':
          e.preventDefault();
          setIsAboutOpen(prev => !prev);
          break;
        case 'Escape':
          if (isAboutOpen) { e.preventDefault(); setIsAboutOpen(false); }
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
    isControlsVisible, isFullyHidden, toggleDisplayWindow,
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
    const el = innerPanelScrollRef.current;
    if (!el) return;
    const DIRECTION_THRESHOLD = 6; // px of movement before committing to scroll vs. slider-drag
    let startX = 0;
    let startY = 0;
    let startScrollTop = 0;
    let scrolling = false;
    let touchStartCount = 0;
    let touchMoveCount = 0;
    const onTouchStart = (e: TouchEvent) => {
      scrolling = false;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startScrollTop = el.scrollTop;
      touchStartCount++;
      setScrollDebug(d => ({ ...d, touchStartCount, target: (e.target as HTMLElement).tagName + '.' + (e.target as HTMLElement).className.slice(0, 30) }));
    };
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      touchMoveCount++;
      if (!scrolling) {
        const absDx = Math.abs(dx), absDy = Math.abs(dy);
        if (absDx < DIRECTION_THRESHOLD && absDy < DIRECTION_THRESHOLD) {
          setScrollDebug(d => ({ ...d, touchMoveCount, dx: Math.round(dx), dy: Math.round(dy), phase: 'below-threshold' }));
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
          setScrollDebug(d => ({ ...d, touchMoveCount, dx: Math.round(dx), dy: Math.round(dy), phase: 'undecided-horizontal' }));
          return; // stays undecided — let native/slider handle this move, re-check next one
        }
        scrolling = true;
      }
      const maxScroll = el.scrollHeight - el.clientHeight;
      setScrollDebug(d => ({ ...d, touchMoveCount, dx: Math.round(dx), dy: Math.round(dy), phase: maxScroll <= 0 ? 'no-overflow' : 'scrolling', scrollHeight: el.scrollHeight, clientHeight: el.clientHeight, scrollTop: el.scrollTop }));
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
  }, [isMobile]);

  // touchAction intentionally NOT set on the root container below (was
  // 'none') — per the CSS touch-action spec, the effective touch-action for
  // a touch gesture is the INTERSECTION of the hit element's value and every
  // ancestor's, not a simple override. With 'none' on this root, no
  // descendant — no matter what touch-action it declared — could ever get
  // real touch gestures, which is why the control panel's own pan-y override
  // never actually restored scrolling. The canvas below already sets its own
  // touchAction:'none' independently, which is the one that actually needs
  // to block gestures for drag-to-rotate, so removing it here loses nothing.
  return (
    <div className="fixed inset-0 overflow-hidden bg-black" ref={containerRef}>
      {isMobile && (
        <div
          className="fixed top-2 left-2 z-[9999] pointer-events-none bg-black/90 text-lime-400 text-[9px] leading-tight font-mono px-2 py-1.5 rounded max-w-[200px] break-all"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          SCROLL DEBUG (temp)
          <br />vvHeight: {Math.round(visualViewportHeight)}
          <br />maxHeight: {mobilePanelMaxHeight}
          <br />vvOffsetTop: {visualViewportOffsetTop}
          <br />winInnerH: {typeof window !== 'undefined' ? window.innerHeight : '—'}
          <br />touchstart: {scrollDebug.touchStartCount ?? 0}
          <br />touchmove: {scrollDebug.touchMoveCount ?? 0}
          <br />phase: {scrollDebug.phase ?? '—'}
          <br />dx/dy: {scrollDebug.dx ?? '—'}/{scrollDebug.dy ?? '—'}
          <br />scrollTop: {scrollDebug.scrollTop ?? '—'}
          <br />scrollH/clientH: {scrollDebug.scrollHeight ?? '—'}/{scrollDebug.clientHeight ?? '—'}
          <br />target: {scrollDebug.target ?? '—'}
        </div>
      )}
      <div ref={shakeWrapperRef} className="w-full h-full">
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
      </div>
      
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
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          className="hidden"
        />
      </div>

      
      {/* Rating UI overlay — temporarily hidden */}
      {false && showRatingUI && (
        <div
          className="absolute pointer-events-auto z-[9999]"
          style={panelPos ? { left: panelPos.x + 215, top: panelPos.y } : { left: 231, top: 16 }}
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

      {/* Collapsed cluster — only rendered while the panel is hidden but not fully hidden */}
      {!isControlsVisible && !isFullyHidden && (
        <div
          className={`pointer-events-auto flex gap-1.5 origin-top-left ${isMobile ? 'fixed bottom-4 left-1/2 -translate-x-1/2' : 'absolute'}`}
          style={isMobile ? undefined : (panelPos ? { left: panelPos.x, top: panelPos.y + 20 } : { top: 52, left: 16 })}
        >
          <button
            onClick={() => setIsControlsVisible(true)}
            className={`w-[44px] h-[44px] p-2 rounded-lg transition-all bg-black/25 text-white border border-white/15 shadow-sm hover:bg-white/15 flex items-center justify-center`}
            title="Show Controls (H)"
            aria-label="Show Controls"
          >
            <EyeSlash weight="regular" className="w-5 h-5" />
          </button>
          <button
            onPointerDown={wavGesture.onPointerDown}
            onPointerUp={wavGesture.onPointerUp}
            onPointerLeave={wavGesture.onPointerLeave}
            className={`relative overflow-hidden w-[44px] h-[44px] p-2 rounded-lg shadow-sm flex items-center justify-center select-none bg-white border-2 border-gray-400`}
            title="Tap: Nudge (W) · Hold/Double-tap: Remix"
            aria-label="Tap to nudge the current look, hold or double-tap to remix"
          >
            <span
              aria-hidden="true"
              className={`wav-btn-fill-reveal ${isWavHolding ? 'wav-revealing' : ''}`}
              style={{ backgroundImage: wavRandomGradient, backgroundSize: '100% 220%' }}
            />
            <Shuffle weight="regular" className="relative text-black w-5 h-5" />
          </button>
          <button
            onClick={undoLastChange}
            disabled={undoDepth < 0}
            className={`w-[44px] h-[44px] p-2 rounded-lg transition-all bg-black/25 border border-white/15 shadow-sm flex items-center justify-center ${undoDepth >= 0 ? 'text-white hover:bg-white/15' : 'text-white/25 cursor-not-allowed'}`}
            title="Undo (Cmd+Z)"
            aria-label="Undo"
          >
            <ArrowUUpLeft weight="regular" className="w-5 h-5" />
          </button>
          <button
            onClick={redoLastChange}
            disabled={redoDepth === 0}
            className={`w-[44px] h-[44px] p-2 rounded-lg transition-all bg-black/25 border border-white/15 shadow-sm flex items-center justify-center ${redoDepth > 0 ? 'text-white hover:bg-white/15' : 'text-white/25 cursor-not-allowed'}`}
            title="Redo (Cmd+Shift+Z)"
            aria-label="Redo"
          >
            <ArrowUUpRight weight="regular" className="w-5 h-5" />
          </button>
          <button
            onClick={() => { setIsControlsVisible(true); setActiveTab('presets'); setIsPresetsDropdownOpen(true); setOpenNewPresetSignal(s => s + 1); }}
            className={`w-[44px] h-[44px] p-2 rounded-lg transition-all bg-black/25 text-white border border-white/15 shadow-sm hover:bg-white/15 flex items-center justify-center`}
            title="Presets (P)"
            aria-label="Presets"
          >
            <Plus weight="regular" className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Main controls */}
      <div
        ref={panelRef}
        data-role="panel"
        // transform lives on this OUTER div, overflow-y:auto lives on the
        // INNER wrapper below — never both on the same element. iOS Safari
        // has a long-standing bug where an element with both a CSS
        // transform (translate or scale) and overflow-y:auto/
        // -webkit-overflow-scrolling:touch fails to respond to touch-scroll
        // gestures at all. This panel used scale(1.15) + translateY (for
        // the mobile show/hide slide) on the very element that also needed
        // to scroll, which is exactly that bug pattern — touchAction:
        // 'pan-y' alone (added earlier, still needed to override the root
        // container's touchAction:'none' for canvas drag-to-rotate) wasn't
        // enough on a real device because the transform blocked native
        // scroll before touch-action was even consulted.
        // Reverted the `top` positioning experiment — on-device data showed
        // winInnerH === vvHeight exactly (no layout/visual viewport
        // divergence to compensate for), so that theory didn't hold, and it
        // introduced a real regression (panel floating mid-screen instead
        // of bottom-anchored). Back to plain, static bottom:12 — simpler,
        // and nothing here actually needed the dynamic top math.
        style={isMobile
          ? { transform: `scale(1.15) translateY(${isControlsVisible ? '0' : 'calc(100% + 24px)'})`, transformOrigin: 'bottom' }
          : (panelPos ? { left: panelPos.x, top: panelPos.y } : { top: 16, left: 16 })}
        className={isMobile
          ? `control-panel fixed inset-x-0 mx-auto bottom-3 z-50 pointer-events-auto transition-transform duration-300 w-[215px] max-w-full ${!isControlsVisible ? 'pointer-events-none' : ''}`
          : `control-panel absolute pointer-events-auto transition-opacity duration-300 w-[215px] scale-[1.15] origin-top-left ${isControlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
      <div
        ref={innerPanelScrollRef}
        className={isMobile
          ? 'flex flex-col gap-[6px] rounded-2xl overflow-x-hidden overflow-y-auto pb-[env(safe-area-inset-bottom)]'
          : 'flex flex-col gap-[6px] max-h-[calc(100vh-2rem)] overflow-y-auto'}
        style={isMobile ? { WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', maxHeight: mobilePanelMaxHeight } : undefined}
      >
        {/* WĀV wordmark — unboxed, doubles as the invisible drag handle */}
        <button
          onMouseDown={isMobile ? undefined : (e) => {
            const panel = e.currentTarget.closest('[data-role="panel"]') as HTMLElement;
            const rect = panel.getBoundingClientRect();
            panelDragRef.current = { startX: e.clientX, startY: e.clientY, origX: rect.left, origY: rect.top };
            // Clamp to the viewport, leaving at least this much of the panel
            // on-screen — otherwise a user can drag the panel fully off the
            // edge and lose access to every control (no way to recover short
            // of clearing localStorage).
            const MIN_VISIBLE = 40;
            const clamp = (x: number, y: number) => ({
              x: Math.min(Math.max(x, MIN_VISIBLE - rect.width), window.innerWidth - MIN_VISIBLE),
              y: Math.min(Math.max(y, 0), window.innerHeight - MIN_VISIBLE),
            });
            const onMove = (ev: MouseEvent) => {
              if (!panelDragRef.current) return;
              setPanelPos(clamp(
                panelDragRef.current.origX + (ev.clientX - panelDragRef.current.startX),
                panelDragRef.current.origY + (ev.clientY - panelDragRef.current.startY),
              ));
            };
            const onUp = (ev: MouseEvent) => {
              if (panelDragRef.current) {
                const pos = clamp(
                  panelDragRef.current.origX + (ev.clientX - panelDragRef.current.startX),
                  panelDragRef.current.origY + (ev.clientY - panelDragRef.current.startY),
                );
                try { localStorage.setItem('panelPos', JSON.stringify(pos)); } catch (err) {
                  if (import.meta.env.DEV) console.warn('Failed to persist panelPos:', err);
                }
              }
              panelDragRef.current = null;
              window.removeEventListener('mousemove', onMove);
              window.removeEventListener('mouseup', onUp);
            };
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
          }}
          onPointerDown={wavGesture.onPointerDown}
          onPointerUp={wavGesture.onPointerUp}
          onPointerLeave={wavGesture.onPointerLeave}
          className="wav-drag-handle relative w-full flex items-end justify-center select-none cursor-grab active:cursor-grabbing outline-none focus:outline-none focus-visible:outline-none"
          title="Tap: Nudge · Hold or double-tap: Remix"
          aria-label="Tap to nudge the current look, hold or double-tap to remix"
        >
          <span className="relative w-full block wav-glow-wrap">
            <span
              aria-hidden="true"
              className="absolute inset-0 text-[72px] w-full text-center tracking-tight leading-[0.9] block wav-stroke-text"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 900,
              }}
            >wāv</span>
            <span
              aria-hidden="true"
              className={`absolute inset-0 text-[72px] w-full text-center tracking-tight leading-[0.9] block wav-random-fill ${isWavHolding ? 'wav-revealing' : ''}`}
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 900,
                backgroundImage: wavRandomGradient,
                backgroundSize: '100% 220%',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >wāv</span>
            <span
              className={`relative text-[72px] w-full text-center tracking-tight leading-[0.9] block wav-base-text ${isWavHolding ? 'wav-fill-erasing' : ''}`}
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 900,
              }}
            >wāv</span>
          </span>
        </button>

        {/* First-run gesture hint — tooltips (title attrs) never surface on
            touch, which is this app's primary target device, so the
            tap/hold/double-tap vocabulary needs a visible explanation at
            least once. Dismissed permanently on first interaction. */}
        {showWavHint && (
          <div className="relative w-full -mt-1 mb-1 flex justify-center">
            <div className="flex items-center gap-1.5 bg-black/70 text-white text-[10px] leading-tight px-2.5 py-1.5 rounded-lg shadow-sm">
              <span>Tap wāv to nudge · Hold or double-tap to remix</span>
              <button
                onClick={dismissWavHint}
                className="text-white/60 hover:text-white shrink-0 w-[18px] h-[18px] flex items-center justify-center"
                aria-label="Dismiss hint"
                title="Dismiss"
              >
                <X weight="bold" className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Icon row + VCR controls + Tab bar — one rounded rectangle, thin horizontal dividers between the three rows.
            NOT sticky: ruled out via on-device diagnostic (identical
            measurements before/after removing it).
            NOT overflow-hidden: `document.elementFromPoint()` on a real
            device (iOS 17+ Safari) at the tab bar row's own reported
            center coordinates hit a BUTTON from GradientsTab's type-picker
            grid (the next sibling below this card), not this row's own
            button — while this row's own getBoundingClientRect measured
            completely normal (correct size/position/visible/opacity).
            getBoundingClientRect doesn't account for ancestor clipping, so
            a child can measure "normal" while still being invisible if an
            ancestor's `overflow: hidden` clips it — and under this card's
            `scale-[1.15]` ancestor, WebKit can round the card's own
            computed height short by about one row, silently clipping the
            last row (this tab bar) while the next sibling (GradientsTab)
            starts early enough to visually occupy the same space. Removing
            overflow-hidden here trades a purely defensive rounded-corner
            clip (no child here has its own background that could actually
            overflow the rounded box in the working case) for not silently
            eating a row when that rounding happens. */}
        <div className="flex flex-col w-full bg-black/25 rounded-lg shadow-sm">
          <div className="flex items-stretch">
          <button
            onClick={() => setIsControlsVisible(false)}
            // rounded-tl-lg matches the container's own rounded-lg corner —
            // the container lost overflow-hidden (see the comment above this
            // row) to fix a real-device clipping bug, so nothing clips this
            // button's own hover background to the container's rounded
            // corner anymore; without an explicit radius here it hovers as a
            // visible square poking past the top-left corner.
            className="flex-1 py-1.5 transition-all text-white hover:bg-white/15 flex items-center justify-center rounded-tl-lg"
            title="Hide Controls (H)"
            aria-label="Hide Controls"
          >
            <Eye weight="regular" className="w-4 h-4" />
          </button>
          <Divider />
          <button
            onClick={exportAsPNG}
            className="flex-1 py-1.5 transition-all text-white hover:bg-white/15 flex items-center justify-center"
            title="Save PNG (S)"
            aria-label="Save PNG"
          >
            <Camera weight="regular" className="w-4 h-4" />
          </button>
          <Divider />
          <button
            onClick={toggleGifRecording}
            disabled={isFinalizingGif}
            className="flex-1 py-1.5 transition-all text-white hover:bg-white/15 flex items-center justify-center relative"
            title={isFinalizingGif ? 'Finalizing GIF…' : isRecordingGif ? 'Stop GIF recording (click to finish)' : 'Record GIF'}
            aria-label={isFinalizingGif ? 'Finalizing GIF' : isRecordingGif ? 'Stop GIF recording' : 'Record GIF'}
          >
            {isFinalizingGif ? (
              <svg width="16" height="16" viewBox="0 0 16 16" className="animate-spin">
                <circle cx="8" cy="8" r="6" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                <path d="M8 2 A6 6 0 0 1 14 8" fill="none" stroke="#facc15" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            ) : isRecordingGif ? (
              <Circle weight="fill" className="w-4 h-4 text-red-500 animate-pulse" />
            ) : (
              <Gif weight="regular" className="w-4 h-4" />
            )}
          </button>
          <Divider />
          <button
            onClick={undoLastChange}
            disabled={undoDepth < 0}
            className={`flex-1 py-1.5 transition-all flex items-center justify-center ${
              undoDepth >= 0 ? 'text-white hover:bg-white/15' : 'text-white/25 cursor-not-allowed'
            }`}
            title="Undo (Cmd+Z)"
            aria-label="Undo"
          >
            <ArrowUUpLeft weight="regular" className="w-4 h-4" />
          </button>
          <Divider />
          <button
            onClick={redoLastChange}
            disabled={redoDepth === 0}
            className={`flex-1 py-1.5 transition-all flex items-center justify-center ${
              redoDepth > 0 ? 'text-white hover:bg-white/15' : 'text-white/25 cursor-not-allowed'
            }`}
            title="Redo (Cmd+Shift+Z)"
            aria-label="Redo"
          >
            <ArrowUUpRight weight="regular" className="w-4 h-4" />
          </button>
          <Divider />
          <button
            onClick={resetToDefaults}
            // rounded-tr-lg — see the matching comment on the Hide Controls
            // button above (top-left corner of the same row).
            className="flex-1 py-1.5 transition-all text-white hover:bg-white/15 flex items-center justify-center rounded-tr-lg"
            title="Reset (R)"
            aria-label="Reset to defaults"
          >
            <ArrowsClockwise weight="regular" className="w-4 h-4" />
          </button>
          </div>{/* end icon row */}

          <Divider orientation="horizontal" />

          {/* VCR Controls */}
          <VCRControls
            isRecording={isRecording}
            isVCRPlaying={isVCRPlaying}
            isAutoMode={isAutoMode}
            vcrRecordedFrames={vcrRecordedFrames}
            vcrPlaybackSpeed={vcrPlaybackSpeed}
            rotationDirection={rotationDirection}
            isEncoding={isEncoding}
            encodingProgress={encodingProgress}
            setVcrPlaybackSpeed={setVcrPlaybackSpeed}
            setRotationDirection={setRotationDirection}
            toggleVCRRecording={toggleVCRRecording}
            handleStop={handleStop}
            toggleVCRPlayback={toggleVCRPlayback}
          />

          <Divider orientation="horizontal" />

          {/* Tab Bar — 5 equal columns via the same inline flex-basis
              pattern as VCRControls' colStyle (flexBasis: calc((100% -
              Npx)/5), flexGrow/Shrink: 0) instead of plain `flex-1`.
              `translateZ(0)` forces this row onto its own GPU compositing
              layer: on a real device (iOS 17+ Safari) this row was
              confirmed via elementFromPoint to be correctly hit-tested
              (functionally clickable, isDesc=true) yet never actually
              painted to screen after removing overflow-hidden from the
              parent — a stuck-paint symptom under a `scale-[1.15]`
              ancestor that promoting this row to its own layer resolves
              in WebKit. */}
          <div style={{ transform: 'translateZ(0)' }} className="flex items-stretch w-full">
            <button onClick={() => setActiveTab(activeTab === 'gradients' ? null : 'gradients')} title="Gradient (G)" aria-label="Gradient tab" style={{ flexBasis: 'calc((100% - 4px) / 5)', flexGrow: 0, flexShrink: 0 }} className={`flex items-center justify-center py-1.5 transition-all ${activeTab === 'gradients' ? 'bg-white/20 text-white' : 'text-white/90 hover:bg-white/10 hover:text-white'}`}>
              <Gradient weight="regular" className="w-4 h-4" />
            </button>
            <Divider />
            <button onClick={() => setActiveTab(activeTab === 'effects' ? null : 'effects')} title="Effects (F)" aria-label="Effects tab" style={{ flexBasis: 'calc((100% - 4px) / 5)', flexGrow: 0, flexShrink: 0 }} className={`flex items-center justify-center py-1.5 transition-all ${activeTab === 'effects' ? 'bg-white/20 text-white' : 'text-white/90 hover:bg-white/10 hover:text-white'}`}>
              <MagicWand weight="regular" className="w-4 h-4" />
            </button>
            <Divider />
            <button
              onClick={() => {
                if (isMicActive) {
                  stopMicVisualization();
                } else {
                  // Doubles as the mic toggle now — turning the mic on also
                  // jumps straight to the Audio tab with the input/device
                  // settings already expanded, instead of requiring a
                  // separate trip into a dropdown to find "Turn Mic On".
                  startMicVisualization(selectedAudioDeviceId);
                  setActiveTab('audio');
                  setIsAudioControlsOpen(true);
                }
              }}
              title={isMicActive ? 'Turn Mic Off' : 'Turn Mic On (A)'}
              aria-label={isMicActive ? 'Turn microphone off' : 'Turn microphone on'}
              style={{ flexBasis: 'calc((100% - 4px) / 5)', flexGrow: 0, flexShrink: 0 }}
              className={`flex items-center justify-center py-1.5 transition-all ${activeTab === 'audio' ? 'bg-white/20 text-white' : 'text-white/90 hover:bg-white/10 hover:text-white'}`}
            >
              {isMicActive
                ? <SpeakerHigh weight="regular" className="w-4 h-4" />
                : <SpeakerSlash weight="regular" className="w-4 h-4" />}
            </button>
            <Divider />
            <button onClick={() => setActiveTab(activeTab === 'color' ? null : 'color')} title="Color (C)" aria-label="Color tab" style={{ flexBasis: 'calc((100% - 4px) / 5)', flexGrow: 0, flexShrink: 0 }} className={`flex items-center justify-center py-1.5 transition-all ${activeTab === 'color' ? 'bg-white/20 text-white' : 'text-white/90 hover:bg-white/10 hover:text-white'}`}>
              <Palette weight="regular" className="w-4 h-4" />
            </button>
            <Divider />
            <button onClick={() => setActiveTab(activeTab === 'presets' ? null : 'presets')} title="Presets (P)" aria-label="Presets tab" style={{ flexBasis: 'calc((100% - 4px) / 5)', flexGrow: 0, flexShrink: 0 }} className={`flex items-center justify-center py-1.5 transition-all ${activeTab === 'presets' ? 'bg-white/20 text-white' : 'text-white/90 hover:bg-white/10 hover:text-white'}`}>
              <FloppyDisk weight="regular" className="w-4 h-4" />
            </button>
          </div>
        </div>{/* end merged card */}

        {/* ── Color Tab ── */}
        {activeTab === 'color' && (
          <ColorTab
            isAutoColor={isAutoColor}
            setIsAutoColor={setIsAutoColor}
            saveCurrentState={saveCurrentState}
            setTargetColors={setTargetColors}
            gradientColors={gradientColors}
            randomColor={randomColor}
            submittedAIPrompt={submittedAIPrompt}
            setSubmittedAIPrompt={setSubmittedAIPrompt}
            setBaseAIColors={setBaseAIColors}
            setGradientColors={setGradientColors}
            aiPrompt={aiPrompt}
            setAIPrompt={setAIPrompt}
            isKeywordHelpOpen={isKeywordHelpOpen}
            setIsKeywordHelpOpen={setIsKeywordHelpOpen}
            handleAIPromptSubmit={handleAIPromptSubmit}
            setIsAIColorPickerOpen={setIsAIColorPickerOpen}
          />
        )}

        {/* ── Gradients Tab ── */}
        {activeTab === 'gradients' && (
          <GradientsTab
            gradientType={gradientType}
            setGradientType={setGradientType}
            getGradientDisplayName={getGradientDisplayName}
            gridRows={gridRows}
            setGridRows={setGridRows}
            gridColumns={gridColumns}
            setGridColumns={setGridColumns}
            polygon2Sides={polygon2Sides}
            setPolygon2Sides={setPolygon2Sides}
            concentricRingCount={concentricRingCount}
            setConcentricRingCount={setConcentricRingCount}
            iridescentIntensity={iridescentIntensity}
            setIridescentIntensity={setIridescentIntensity}
            iridescentScale={iridescentScale}
            setIridescentScale={setIridescentScale}
            auroraBandCount={auroraBandCount}
            setAuroraBandCount={setAuroraBandCount}
            auroraBandHeight={auroraBandHeight}
            setAuroraBandHeight={setAuroraBandHeight}
            auroraWaveSpeed={auroraWaveSpeed}
            setAuroraWaveSpeed={setAuroraWaveSpeed}
            causticsBrightness={causticsBrightness}
            setCausticsBrightness={setCausticsBrightness}
            causticsScale={causticsScale}
            setCausticsScale={setCausticsScale}
            lavaBlobCount={lavaBlobCount}
            setLavaBlobCount={setLavaBlobCount}
            lavaBlobSize={lavaBlobSize}
            setLavaBlobSize={setLavaBlobSize}
            marbleVeinFreq={marbleVeinFreq}
            setMarbleVeinFreq={setMarbleVeinFreq}
            marbleTurbulence={marbleTurbulence}
            setMarbleTurbulence={setMarbleTurbulence}
            marbleOctaves={marbleOctaves}
            setMarbleOctaves={setMarbleOctaves}
            metaballCount={metaballCount}
            setMetaballCount={setMetaballCount}
            metaballSize={metaballSize}
            setMetaballSize={setMetaballSize}
            metaballSpeed={metaballSpeed}
            setMetaballSpeed={setMetaballSpeed}
            truchetSize={truchetSize}
            setTruchetSize={setTruchetSize}
            truchetVariation={truchetVariation}
            setTruchetVariation={setTruchetVariation}
            truchetThickness={truchetThickness}
            setTruchetThickness={setTruchetThickness}
            moireScale={moireScale}
            setMoireScale={setMoireScale}
            moireOffset={moireOffset}
            setMoireOffset={setMoireOffset}
            moireSpeed={moireSpeed}
            setMoireSpeed={setMoireSpeed}
            flowParticleCount={flowParticleCount}
            setFlowParticleCount={setFlowParticleCount}
            flowSpeed={flowSpeed}
            setFlowSpeed={setFlowSpeed}
            flowScale={flowScale}
            setFlowScale={setFlowScale}
            flowThickness={flowThickness}
            setFlowThickness={setFlowThickness}
            attractorPointCount={attractorPointCount}
            setAttractorPointCount={setAttractorPointCount}
            attractorSpeed={attractorSpeed}
            setAttractorSpeed={setAttractorSpeed}
            attractorScale={attractorScale}
            setAttractorScale={setAttractorScale}
            attractorDotSize={attractorDotSize}
            setAttractorDotSize={setAttractorDotSize}
            attractorTrailFade={attractorTrailFade}
            setAttractorTrailFade={setAttractorTrailFade}
            reactionDiffusionFeed={reactionDiffusionFeed}
            setReactionDiffusionFeed={setReactionDiffusionFeed}
            reactionDiffusionKill={reactionDiffusionKill}
            setReactionDiffusionKill={setReactionDiffusionKill}
            reactionDiffusionSpeed={reactionDiffusionSpeed}
            setReactionDiffusionSpeed={setReactionDiffusionSpeed}
            fieldContrast={fieldContrast}
            setFieldContrast={setFieldContrast}
            paletteMode={paletteMode}
            setPaletteMode={setPaletteMode}
            paletteBands={paletteBands}
            setPaletteBands={setPaletteBands}
            topographicScale={topographicScale}
            setTopographicScale={setTopographicScale}
            topographicBands={topographicBands}
            setTopographicBands={setTopographicBands}
            topographicLineWidth={topographicLineWidth}
            setTopographicLineWidth={setTopographicLineWidth}
            juliaReal={juliaReal}
            setJuliaReal={setJuliaReal}
            juliaImaginary={juliaImaginary}
            setJuliaImaginary={setJuliaImaginary}
            juliaZoom={juliaZoom}
            setJuliaZoom={setJuliaZoom}
            juliaIterations={juliaIterations}
            setJuliaIterations={setJuliaIterations}
            angleStartOffset={angleStartOffset}
            setAngleStartOffset={setAngleStartOffset}
            angleCenterX={angleCenterX}
            setAngleCenterX={setAngleCenterX}
            angleCenterY={angleCenterY}
            setAngleCenterY={setAngleCenterY}
            radialSizeScale={radialSizeScale}
            setRadialSizeScale={setRadialSizeScale}
            concentricRingWidth={concentricRingWidth}
            setConcentricRingWidth={setConcentricRingWidth}
            shapesSides={shapesSides}
            setShapesSides={setShapesSides}
            shapesCount={shapesCount}
            setShapesCount={setShapesCount}
            windmillTightness={windmillTightness}
            setWindmillTightness={setWindmillTightness}
            windmillRotations={windmillRotations}
            setWindmillRotations={setWindmillRotations}
            windmillThickness={windmillThickness}
            setWindmillThickness={setWindmillThickness}
            waveAmplitude={waveAmplitude}
            setWaveAmplitude={setWaveAmplitude}
            waveFrequency={waveFrequency}
            setWaveFrequency={setWaveFrequency}
            waveNumber={waveNumber}
            setWaveNumber={setWaveNumber}
            waveNumberRef={waveNumberRef}
            waveRotation={waveRotation}
            setWaveRotation={setWaveRotation}
            waveRotationRef={waveRotationRef}
            drawParamsDirtyRef={drawParamsDirtyRef}
            noiseScale={noiseScale}
            setNoiseScale={setNoiseScale}
            noiseOctaves={noiseOctaves}
            setNoiseOctaves={setNoiseOctaves}
            noiseDirection={noiseDirection}
            setNoiseDirection={setNoiseDirection}
            noiseWarp={noiseWarp}
            setNoiseWarp={setNoiseWarp}
            noiseType={noiseType}
            setNoiseType={setNoiseType}
            plasmaComplexity={plasmaComplexity}
            setPlasmaComplexity={setPlasmaComplexity}
            plasmaZoomScale={plasmaZoomScale}
            setPlasmaZoomScale={setPlasmaZoomScale}
            radialBurstCount={radialBurstCount}
            setRadialBurstCount={setRadialBurstCount}
            radialBurstSpread={radialBurstSpread}
            setRadialBurstSpread={setRadialBurstSpread}
            radialBurstSize={radialBurstSize}
            setRadialBurstSize={setRadialBurstSize}
            voronoiCellCount={voronoiCellCount}
            setVoronoiCellCount={setVoronoiCellCount}
            voronoiDistortion={voronoiDistortion}
            setVoronoiDistortion={setVoronoiDistortion}
            fadeDirection={fadeDirection}
            setFadeDirection={setFadeDirection}
            radarFadeLength={radarFadeLength}
            setRadarFadeLength={setRadarFadeLength}
            radarBeamWidth={radarBeamWidth}
            setRadarBeamWidth={setRadarBeamWidth}
            flowerCircles={flowerCircles}
            setFlowerCircles={setFlowerCircles}
            flowerScale={flowerScale}
            setFlowerScale={setFlowerScale}
            flowerSpread={flowerSpread}
            setFlowerSpread={setFlowerSpread}
            helixTurns={helixTurns}
            setHelixTurns={setHelixTurns}
            helixTightness={helixTightness}
            setHelixTightness={setHelixTightness}
          />
        )}

        {/* ── Effects Tab ── */}
        {activeTab === 'effects' && (
          <EffectsTab
            isMobile={isMobile}
            activeEffects={activeEffects}
            setActiveEffects={setActiveEffects}
            isMultiFxMode={isMultiFxMode}
            setIsMultiFxMode={setIsMultiFxMode}
            expandedEffects={expandedEffects}
            toggleEffectExpanded={toggleEffectExpanded}
            randomizeEffects={randomizeEffects}
            kaleidoscopeSegments={kaleidoscopeSegments}
            setKaleidoscopeSegments={setKaleidoscopeSegments}
            kaleidoscopeRotateSpeed={kaleidoscopeRotateSpeed}
            setKaleidoscopeRotateSpeed={setKaleidoscopeRotateSpeed}
            rippleFrequency={rippleFrequency}
            setRippleFrequency={setRippleFrequency}
            rippleAmplitude={rippleAmplitude}
            setRippleAmplitude={setRippleAmplitude}
            asciiSize={asciiSize}
            setAsciiSize={setAsciiSize}
            asciiChars={asciiChars}
            setAsciiChars={setAsciiChars}
            asciiColor={asciiColor}
            setAsciiColor={setAsciiColor}
            emojiChars={emojiChars}
            setEmojiChars={setEmojiChars}
            emojiSize={emojiSize}
            setEmojiSize={setEmojiSize}
            emojiRotateSpeed={emojiRotateSpeed}
            setEmojiRotateSpeed={setEmojiRotateSpeed}
            emojiSizeVariation={emojiSizeVariation}
            setEmojiSizeVariation={setEmojiSizeVariation}
            emojiOffsetX={emojiOffsetX}
            setEmojiOffsetX={setEmojiOffsetX}
            isEmojiPickerOpen={isEmojiPickerOpen}
            setIsEmojiPickerOpen={setIsEmojiPickerOpen}
            emojiPickerSearch={emojiPickerSearch}
            setEmojiPickerSearch={setEmojiPickerSearch}
            liquidStrength={liquidStrength}
            setLiquidStrength={setLiquidStrength}
            liquidScale={liquidScale}
            setLiquidScale={setLiquidScale}
            handlePhotoFileClick={handlePhotoFileClick}
            photoFileName={photoFileName}
            photoBlendMode={photoBlendMode}
            setPhotoBlendMode={setPhotoBlendMode}
            photoOpacity={photoOpacity}
            setPhotoOpacity={setPhotoOpacity}
            chromaticTrailsDecay={chromaticTrailsDecay}
            setChromaticTrailsDecay={setChromaticTrailsDecay}
            chromaticTrailsOffset={chromaticTrailsOffset}
            setChromaticTrailsOffset={setChromaticTrailsOffset}
            pixelSize={pixelSize}
            setPixelSize={setPixelSize}
            triangleSize={triangleSize}
            setTriangleSize={setTriangleSize}
            chromaticOffset={chromaticOffset}
            setChromaticOffset={setChromaticOffset}
            chromaticAngle={chromaticAngle}
            setChromaticAngle={setChromaticAngle}
            fisheyeStrength={fisheyeStrength}
            setFisheyeStrength={setFisheyeStrength}
            fisheyeCenterX={fisheyeCenterX}
            setFisheyeCenterX={setFisheyeCenterX}
            fisheyeCenterY={fisheyeCenterY}
            setFisheyeCenterY={setFisheyeCenterY}
            bloomIntensity={bloomIntensity}
            setBloomIntensity={setBloomIntensity}
            bloomRadius={bloomRadius}
            setBloomRadius={setBloomRadius}
            feedbackDecay={feedbackDecay}
            setFeedbackDecay={setFeedbackDecay}
            feedbackZoom={feedbackZoom}
            setFeedbackZoom={setFeedbackZoom}
            feedbackRotation={feedbackRotation}
            setFeedbackRotation={setFeedbackRotation}
            mirrorMode={mirrorMode}
            setMirrorMode={setMirrorMode}
            mirrorTileCount={mirrorTileCount}
            setMirrorTileCount={setMirrorTileCount}
            vignetteStrength={vignetteStrength}
            setVignetteStrength={setVignetteStrength}
            vignetteSoftness={vignetteSoftness}
            setVignetteSoftness={setVignetteSoftness}
            scanlineIntensity={scanlineIntensity}
            setScanlineIntensity={setScanlineIntensity}
            scanlineSpacing={scanlineSpacing}
            setScanlineSpacing={setScanlineSpacing}
            scanlineSpeed={scanlineSpeed}
            setScanlineSpeed={setScanlineSpeed}
            colorShiftHue={colorShiftHue}
            setColorShiftHue={setColorShiftHue}
            grainIntensity={grainIntensity}
            setGrainIntensity={setGrainIntensity}
            grainType={grainType}
            setGrainType={setGrainType}
            blurType={blurType}
            setBlurType={setBlurType}
            blurGaussianAmount={blurGaussianAmount}
            setBlurGaussianAmount={setBlurGaussianAmount}
            blurMotionAmount={blurMotionAmount}
            setBlurMotionAmount={setBlurMotionAmount}
            blurMotionDirection={blurMotionDirection}
            setBlurMotionDirection={setBlurMotionDirection}
            blurRadialAmount={blurRadialAmount}
            setBlurRadialAmount={setBlurRadialAmount}
            posterizeLevels={posterizeLevels}
            setPosterizeLevels={setPosterizeLevels}
            halftoneSize={halftoneSize}
            setHalftoneSize={setHalftoneSize}
            halftoneCMYK={halftoneCMYK}
            setHalftoneCMYK={setHalftoneCMYK}
            halftoneMove={halftoneMove}
            setHalftoneMove={setHalftoneMove}
            halftoneVariation={halftoneVariation}
            setHalftoneVariation={setHalftoneVariation}
            invertAmount={invertAmount}
            setInvertAmount={setInvertAmount}
            duotoneColor1={duotoneColor1}
            setDuotoneColor1={setDuotoneColor1}
            duotoneColor2={duotoneColor2}
            setDuotoneColor2={setDuotoneColor2}
            duotoneColor3={duotoneColor3}
            setDuotoneColor3={setDuotoneColor3}
            duotoneThreeColor={duotoneThreeColor}
            setDuotoneThreeColor={setDuotoneThreeColor}
            duotoneIntensity={duotoneIntensity}
            setDuotoneIntensity={setDuotoneIntensity}
            gridRows={gridRows}
            setGridRows={setGridRows}
            gridColumns={gridColumns}
            setGridColumns={setGridColumns}
            gridSides={gridSides}
            setGridSides={setGridSides}
            gridShapeSize={gridShapeSize}
            setGridShapeSize={setGridShapeSize}
            gridVariation={gridVariation}
            setGridVariation={setGridVariation}
            gridRotationDirection={gridRotationDirection}
            setGridRotationDirection={setGridRotationDirection}
            vhsGlitchIntensity={vhsGlitchIntensity}
            setVhsGlitchIntensity={setVhsGlitchIntensity}
            dustCrackleIntensity={dustCrackleIntensity}
            setDustCrackleIntensity={setDustCrackleIntensity}
            waveDistortionStrength={waveDistortionStrength}
            setWaveDistortionStrength={setWaveDistortionStrength}
            waveDistortionRotation={waveDistortionRotation}
            setWaveDistortionRotation={setWaveDistortionRotation}
            slitScanIntensity={slitScanIntensity}
            setSlitScanIntensity={setSlitScanIntensity}
            slitScanDirection={slitScanDirection}
            setSlitScanDirection={setSlitScanDirection}
            ditherLevels={ditherLevels}
            setDitherLevels={setDitherLevels}
            ditherType={ditherType}
            setDitherType={setDitherType}
            glitchIntensity={glitchIntensity}
            setGlitchIntensity={setGlitchIntensity}
            glitchBlockSize={glitchBlockSize}
            setGlitchBlockSize={setGlitchBlockSize}
            glitchChromaSplit={glitchChromaSplit}
            setGlitchChromaSplit={setGlitchChromaSplit}
          />
        )}

        {/* ── Audio Tab ── */}
        {activeTab === 'audio' && (
        <Suspense fallback={null}>
        <AudioPanel
          state={{
            isMicActive, audioInputDevices, selectedAudioDeviceId, isAudioControlsOpen,
            masterSensitivity, autoGainEnabled, depthLayerEnabled, depthLayerStrength, bassMultiplier, midsMultiplier, trebleMultiplier,
            bassBeatSync, midsBeatSync, trebleBeatSync,
            liveBassLevel, liveMidsLevel, liveTrebleLevel,
            audioFileName, waveformData, audioFileMetadata,
            subBassMultiplier, subBassBeatSync, liveSubBassLevel,
            zoomBeatEnabled, shakeBeatEnabled, contrastBeatEnabled, paletteBeatEnabled,
            audioBindings,
          }}
          actions={{
            setSelectedAudioDeviceId, setIsAudioControlsOpen,
            setMasterSensitivity, setAutoGainEnabled, setDepthLayerEnabled, setDepthLayerStrength, setBassMultiplier, setMidsMultiplier, setTrebleMultiplier,
            setAudioBindings,
            setSubBassMultiplier, setSubBassBeatSync,
            setBassBeatSync, setMidsBeatSync, setTrebleBeatSync,
            startMicVisualization, stopMicVisualization,
            onAudioFileClick: handleAudioFileClick,
            setZoomBeatEnabled, setShakeBeatEnabled, setContrastBeatEnabled, setPaletteBeatEnabled,
            onShuffleAudio: shuffleAudiovisuals,
          }}
        />
        </Suspense>
        )}

        {/* ── Presets Tab ── */}
        {activeTab === 'presets' && (
        <Suspense fallback={null}>
        <PresetsPanel
          isPresetsDropdownOpen={isPresetsDropdownOpen}
          openNewPresetSignal={openNewPresetSignal}
          savedPresets={savedPresets}
          renamingPresetId={renamingPresetId}
          renamingPresetValue={renamingPresetValue}
          folderNames={folderNames}
          setIsPresetsDropdownOpen={setIsPresetsDropdownOpen}
          setRenamingPresetId={setRenamingPresetId}
          setRenamingPresetValue={setRenamingPresetValue}
          loadPreset={loadPreset}
          deletePreset={deletePreset}
          renamePreset={renamePreset}
          updatePreset={updatePreset}
          savePresetWithName={savePresetWithName}
          movePresetToFolder={movePresetToFolder}
          addFolder={addFolder}
          renameFolder={renameFolder}
          deleteFolder={deleteFolder}
          authUser={authState.user}
          isAnonymous={authState.isAnonymous}
          authBusy={authState.authBusy}
          authError={authState.authError}
          clearAuthError={authState.clearAuthError}
          signInWithEmail={authState.signInWithEmail}
          signUpWithEmail={authState.signUpWithEmail}
          signOutUser={authState.signOutUser}
        />
        </Suspense>
        )}

      </div>
      </div>
      {audioFile && (
        <audio
          ref={audioRef}
          src={audioFile}
          loop
        />
      )}

      {/* Display-link-copied toast — brief confirmation for Shift+P */}
      {isDisplayLinkCopied && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none bg-black/70 backdrop-blur-sm text-white text-xs px-4 py-2 rounded-full shadow-lg z-50">
          Display link copied — open it in a new tab/window for live output
        </div>
      )}

      {/* About button — bottom-right corner on desktop; moved to top-right
          on mobile/tablet so it doesn't sit on top of the bottom sheet.
          Hidden entirely in Display mode (?display=1) so the projected
          output has zero UI, ever. */}
      {!IS_DISPLAY_MODE && (
        <button
          onClick={() => setIsAboutOpen(true)}
          className={`pointer-events-auto w-[27px] h-[27px] rounded-full border-2 border-white flex items-center justify-center text-white ${isMobile ? 'fixed top-4 right-4' : 'absolute bottom-4 right-4'}`}
          title="About wāv (?)"
          aria-label="About wāv"
        >
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 900, fontSize: '13px', lineHeight: 1 }}>i</span>
        </button>
      )}

      {/* About panel */}
      {isAboutOpen && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAboutOpen(false)} />
          <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-sm mx-6 max-h-[80vh] overflow-y-auto text-white shadow-2xl">
            <button
              onClick={() => setIsAboutOpen(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all"
            >
              <X weight="regular" className="w-4 h-4" />
            </button>
            <div className="text-2xl font-black tracking-tight mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>wāv</div>
            <div className="flex flex-col gap-4 text-sm text-white/80 leading-relaxed">
              <p><strong>wāv</strong> is a gradient-based, user-friendly art creation environment with audio visualization capabilities.</p>
              <p><strong>wāv</strong> artwork can dynamically react, creating a mesmerizing display of colors, patterns, and shapes that synchronize with the music.</p>
              <p><strong>wāv</strong> uses advanced algorithms to analyze the audio signal and generate visuals that respond to the beat, rhythm, and character of the music.</p>
              <p>Whether performing live music or theater, planning an art installation, or simply enjoying your favorite tunes at home, <strong>wāv</strong> can transform your audio experience into a spectacle.</p>
            </div>

            <div className="flex flex-col gap-8 text-sm text-white/80 leading-relaxed mt-8">
              <div className="flex flex-col gap-3">
                <p className="font-semibold text-white">The <strong>wāv</strong> header</p>
                <p className="flex items-center justify-between gap-2">Tap the wordmark to nudge the artwork. Hold for a full beat or double-click to fully remix it.</p>
                <p className="flex items-center justify-between gap-2"><span>Nudge (tap-equivalent)</span><Kbd label="W" /></p>
                <p className="flex items-center justify-between gap-2"><span>Remix (hold-equivalent)</span><Kbd label="Shift+W" /></p>
                <p>Drag the wordmark to move the control panel anywhere on screen.</p>
              </div>

              <div className="flex flex-col gap-3">
                <p className="font-semibold text-white">Top icon row</p>
                <p className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><Eye weight="regular" className="w-4 h-4 shrink-0" /> Eye — collapse the control panel</span><Kbd label="H" /></p>
                <p className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><EyeSlash weight="regular" className="w-4 h-4 shrink-0" /> Copy Display link — fully hide all UI for live/projector output</span><Kbd label="Shift+P" /></p>
                <p className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><Camera weight="regular" className="w-4 h-4 shrink-0" /> Camera — save the current frame as a PNG</span><Kbd label="S" /></p>
                <p className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><ArrowUUpLeft weight="regular" className="w-4 h-4 shrink-0" /><ArrowUUpRight weight="regular" className="w-4 h-4 shrink-0 -ml-1" /> Undo / redo — step backward or forward</span><Kbd label="⌘Z / ⌘⇧Z" /></p>
                <p className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><ArrowsClockwise weight="regular" className="w-4 h-4 shrink-0" /> Refresh — reset to defaults</span><Kbd label="R" /></p>
              </div>

              <div className="flex flex-col gap-3">
                <p className="font-semibold text-white">Playback row</p>
                <p className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><Circle weight="regular" className="w-4 h-4 shrink-0" /> Record — capture video of the live animation</span><Kbd label="V" /></p>
                <p className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><Play weight="regular" className="w-4 h-4 shrink-0" /><Pause weight="regular" className="w-4 h-4 shrink-0 -ml-1" /> Play / pause — start or stop all motion and audio reactivity</span><Kbd label="Space" /></p>
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
                <p className="font-semibold text-white">Randomizing</p>
                <p>Five ways to randomize, from smallest to biggest change:</p>
                <p className="flex items-center justify-between gap-2"><span><span className="text-white font-semibold">Nudge</span> — tap <strong>wāv</strong> for a small drift in color, angle, and zoom. Never changes the gradient type or which effects are active.</span><Kbd label="W" /></p>
                <p className="flex items-center justify-between gap-2"><span><span className="text-white font-semibold">Shuffle Effects</span> — reshuffles which effects are active and their sliders. Gradient type and colors stay put.</span><Kbd label="Shift+F" /></p>
                <p className="flex items-center justify-between gap-2"><span><span className="text-white font-semibold">Shuffle Gradient</span> — reshuffles the gradient type and its sliders. Effects and colors stay put.</span><Kbd label="Shift+G" /></p>
                <p className="flex items-center justify-between gap-2"><span><span className="text-white font-semibold">Shuffle Audio Controls</span> — reshuffles sensitivity, band multipliers, beat-sync toggles, and Modulation bindings (scoped to the current gradient and active effects). Gradient, effects, and colors stay put.</span><Kbd label="Shift+A" /></p>
                <p className="flex items-center justify-between gap-2"><span><span className="text-white font-semibold">Remix</span> — hold or double-tap <strong>wāv</strong> to randomize everything at once: gradient, colors, and effects.</span><Kbd label="Shift+W" /></p>
              </div>

              <div className="flex flex-col gap-3">
                <p className="font-semibold text-white">More shortcuts</p>
                <p className="flex items-center justify-between gap-2"><span>Toggle Multi-FX mode</span><Kbd label="M" /></p>
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
