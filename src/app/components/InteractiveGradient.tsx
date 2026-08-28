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
import { useSnapshot } from '../hooks/useSnapshot';
import { useCanvasDraw } from '../hooks/useCanvasDraw';
import {
  type ColorRGB, type GradientType, type EffectType,
  DEFAULT_COLORS, DEG_TO_RAD, TWO_PI,
  ID_MIGRATIONS, migrateId, migrateIds,
  WAV_MOODS, GRADIENT_DISPLAY_NAMES, FULL_GRADIENT_TYPES, FEELING_LUCKY_GRADIENT_TYPES,
  ALL_EFFECTS, AUDIO_GRADIENTS, AUDIO_EFFECTS, NO_DRAG_TYPES,
} from '../constants/gradientEffects';
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
import { useAuraGlowState } from '../hooks/state/useAuraGlowState';
import { useStarfieldState } from '../hooks/state/useStarfieldState';
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
import { useMoireState } from '../hooks/state/useMoireState';
import { useNoiseState } from '../hooks/state/useNoiseState';
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
import { useSepiaState } from '../hooks/state/useSepiaState';
import { useShapesState } from '../hooks/state/useShapesState';
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
      {expanded && <div className="flex flex-col gap-2 pb-1">{children}</div>}
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
// Standalone playback: a ?display=1&preset=<encoded> link carries its own
// frozen preset instead of depending on a live controller tab to broadcast
// state (the mirror behavior IS_DISPLAY_MODE was originally built for).
// Read once at module load, same as IS_DISPLAY_MODE — the preset-loader
// effect below strips the `preset` param from the URL after applying it,
// so re-checking window.location.search later in the session would miss it.
const IS_STANDALONE_DISPLAY = IS_DISPLAY_MODE && typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('preset');
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
  const { particlesCount, setParticlesCount, particlesSpeed, setParticlesSpeed, particlesSize, setParticlesSize, particlesTrail, setParticlesTrail, particlesGravity, setParticlesGravity, particlesSides, setParticlesSides, particlesBufferRef, particlesPointsRef } = useParticlesState();
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
  const { duotoneIntensity, setDuotoneIntensity, duotoneColor1, setDuotoneColor1, duotoneColor2, setDuotoneColor2, duotoneColor3, setDuotoneColor3, duotoneThreeColor, setDuotoneThreeColor } = useDuotoneState();
  const { dustCrackleIntensity, setDustCrackleIntensity, dustSize, setDustSize, dustCrackleLength, setDustCrackleLength, dustCrackleColor, setDustCrackleColor } = useDustState();
  const { emojiSize, setEmojiSize, emojiChars, setEmojiChars, emojiRotateSpeed, setEmojiRotateSpeed, emojiAnimTime, setEmojiAnimTime, emojiOffsetX, setEmojiOffsetX, emojiSizeVariation, setEmojiSizeVariation, emojiPickerSearch, setEmojiPickerSearch } = useEmojiState();
  const { fadeDirection, setFadeDirection } = useFadeState();
  const { feedbackDecay, setFeedbackDecay, feedbackZoom, setFeedbackZoom, feedbackRotation, setFeedbackRotation, feedbackBufferRef } = useFeedbackState();
  const { fieldContrast, setFieldContrast, paletteMode, setPaletteMode, paletteBands, setPaletteBands } = useFieldMappingState();
  const { fisheyeStrength, setFisheyeStrength, fisheyeCenterX, setFisheyeCenterX, fisheyeCenterY, setFisheyeCenterY } = useFisheyeState();
  const { flowerCircles, setFlowerCircles, flowerScale, setFlowerScale, flowerSpread, setFlowerSpread, flowerRotation, setFlowerRotation, flowerSymmetry, setFlowerSymmetry, flowerOpacity, setFlowerOpacity, flowerAnimTime, setFlowerAnimTime, flowAnimTime, setFlowAnimTime, flowParticleCount, setFlowParticleCount, flowSpeed, setFlowSpeed, flowScale, setFlowScale, flowThickness, setFlowThickness } = useFlowState();
  const { flowBufferRef } = useFlowBufferState();
  const { flowParticlesRef } = useFlowParticlesState();
  const { glitchIntensity, setGlitchIntensity, glitchBlockSize, setGlitchBlockSize, glitchChromaSplit, setGlitchChromaSplit } = useGlitchState();
  const { auraGlowCount, setAuraGlowCount, auraGlowSpeed, setAuraGlowSpeed, auraGlowOpacity, setAuraGlowOpacity } = useAuraGlowState();
  const { starfieldCount, setStarfieldCount, starfieldSpeed, setStarfieldSpeed, starfieldOpacity, setStarfieldOpacity, starfieldSize, setStarfieldSize, starfieldParticlesRef } = useStarfieldState();
  const { grainIntensity, setGrainIntensity, grainType, setGrainType, grainSize, setGrainSize } = useGrainState();
  const { gridSides, setGridSides, gridRows, setGridRows, gridColumns, setGridColumns, gridRotation, setGridRotation, gridVariation, setGridVariation, gridShapeSize, setGridShapeSize, gridCellAngleStep, setGridCellAngleStep } = useGridState();
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
  const { moireAnimTime, setMoireAnimTime, moireScale, setMoireScale, moireOffset, setMoireOffset, moireSpeed, setMoireSpeed } = useMoireState();
  const { noiseScale, setNoiseScale, noiseOctaves, setNoiseOctaves, noiseDirection, setNoiseDirection, noiseWarp, setNoiseWarp, noiseType, setNoiseType } = useNoiseState();
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
  // below); this only adds the open-time focus move.
  const aboutCloseButtonRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (isAboutOpen) aboutCloseButtonRef.current?.focus();
  }, [isAboutOpen]);
  const { photoBlendMode, setPhotoBlendMode, photoOpacity, setPhotoOpacity, photoFileName, setPhotoFileName, photoVersion, setPhotoVersion, photoImageRef, photoInputRef } = usePhotoState();
  const { pinchStrength, setPinchStrength } = usePinchState();
  const { pixelSize, setPixelSize, pixelateScaleDirection, setPixelateScaleDirection } = usePixelState();
  const { plasmaSpeed, setPlasmaSpeed, plasmaComplexity, setPlasmaComplexity, plasmaZoomScale, setPlasmaZoomScale } = usePlasmaState();
  const { polygon2Sides, setPolygon2Sides } = usePolygon2State();
  const { posterizeLevels, setPosterizeLevels, posterizeSolarize, setPosterizeSolarize } = usePosterizeState();
  const { radarSweepAngle, setRadarSweepAngle, radarFadeLength, setRadarFadeLength, radarBeamWidth, setRadarBeamWidth } = useRadarState();
  const { radialSizeScale, setRadialSizeScale } = useRadialState();
  const { radialBurstCount, setRadialBurstCount, radialBurstSpread, setRadialBurstSpread, radialBurstSize, setRadialBurstSize, radialBurstMode, setRadialBurstMode } = useRadialBurstState();
  const radialBurstModeRef = useRef(radialBurstMode);
  radialBurstModeRef.current = radialBurstMode;
  const { reactionDiffusionFeed, setReactionDiffusionFeed, reactionDiffusionKill, setReactionDiffusionKill, reactionDiffusionSpeed, setReactionDiffusionSpeed } = useReactionDiffusionState();
  const { reactionDiffusionGridRef } = useReactionDiffusionGridState();
  const { redoStackRef, redoDepth, setRedoDepth } = useRedoState();
  const { sepiaIntensity, setSepiaIntensity } = useSepiaState();
  const { shapesSides, setShapesSides, shapesCount, setShapesCount } = useShapesState();
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
  const handlePhotoFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
        if (gradientTypeRef.current === 'fade') {
          rotationAmountPerFrame = rotationDirectionRef.current === 'clockwise' ? 0.0167 : -0.0167;
        } else {
          rotationAmountPerFrame = rotationDirectionRef.current === 'clockwise' ? 0.03125 : -0.03125;
        }
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

      // Wave Interference source drift — same PLAY/Auto-only gating as
      // Tiling/Flower above.
      if ((!IS_DISPLAY_MODE || IS_STANDALONE_DISPLAY) && gradientTypeRef.current === 'wave-interference' && (isAutoModeRef.current || isVCRPlayingRef.current)) {
        animValuesRef.current.waveInterferenceAnimTime += 0.5 * spd * dtScale;
      }

      // Mesh Wireframe point-jitter drift — same gating.
      if ((!IS_DISPLAY_MODE || IS_STANDALONE_DISPLAY) && gradientTypeRef.current === 'mesh-wireframe' && (isAutoModeRef.current || isVCRPlayingRef.current)) {
        animValuesRef.current.meshWireframeAnimTime += 0.5 * spd * dtScale;
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
    if (IS_DISPLAY_MODE && !IS_STANDALONE_DISPLAY) return;
    if (gradientType !== 'aurora' || (!isAutoMode && !isVCRPlaying && !isMicActive)) return;
    const id = setInterval(() => setAuroraAnimTime(t => t + 0.016 * vcrPlaybackSpeed), 16);
    return () => clearInterval(id);
  }, [gradientType, vcrPlaybackSpeed, isAutoMode, isVCRPlaying, isMicActive]);

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
    if (gradientType !== 'moire' || (!isAutoMode && !isVCRPlaying && !isMicActive)) return;
    const id = setInterval(() => setMoireAnimTime(t => t + 0.015 * vcrPlaybackSpeed * moireSpeed), 16);
    return () => clearInterval(id);
  }, [gradientType, vcrPlaybackSpeed, isAutoMode, isVCRPlaying, isMicActive, moireSpeed]);

  useEffect(() => {
    if (IS_DISPLAY_MODE && !IS_STANDALONE_DISPLAY) return;
    if (gradientType !== 'flow-field' || (!isAutoMode && !isVCRPlaying && !isMicActive)) return;
    const id = setInterval(() => setFlowAnimTime(t => t + 0.02 * vcrPlaybackSpeed * flowSpeed), 16);
    return () => clearInterval(id);
  }, [gradientType, vcrPlaybackSpeed, isAutoMode, isVCRPlaying, isMicActive, flowSpeed]);

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
    av.causticsAnimTime = causticsAnimTime;
    av.lavaAnimTime = lavaAnimTime;
    av.marbleAnimTime = marbleAnimTime;
    av.metaballAnimTime = metaballAnimTime;
    av.moireAnimTime = moireAnimTime;
    av.flowAnimTime = flowAnimTime;
    av.liquidAnimTime = liquidAnimTime;
    av.emojiAnimTime = emojiAnimTime;
    av.attractorAnimTime = attractorAnimTime;
    av.audioSubBassLevel = audioSubBassLevel;
    av.audioMidsLevel = audioMidsLevel;
    av.audioTrebleLevel = audioTrebleLevel;
    av.audioEnergy = audioEnergy;
  }, [auroraAnimTime, causticsAnimTime, lavaAnimTime, marbleAnimTime, metaballAnimTime, moireAnimTime, flowAnimTime, liquidAnimTime, emojiAnimTime, attractorAnimTime, audioSubBassLevel, audioMidsLevel, audioTrebleLevel, audioEnergy]);

  // buildSnapshot/applySnapshot extracted to useSnapshot.ts (splitting-plan
  // step 3). The single source of truth for undo/redo AND presets, so it
  // touches nearly every piece of state (~380 values/setters).
  const { buildSnapshot, applySnapshot } = useSnapshot({
    activeEffects, angleCenterX, angleCenterY, angleStartOffset, asciiChars, asciiColor,
    asciiSize, auroraBandCount, auroraBandHeight, auroraWaveSpeed, autoGainEnabled, baseAIColors,
    depthLayerEnabled, depthLayerStrength, setDepthLayerEnabled, setDepthLayerStrength,
    glitchIntensity, glitchBlockSize, glitchChromaSplit, setGlitchIntensity, setGlitchBlockSize, setGlitchChromaSplit,
    auraGlowCount, setAuraGlowCount, auraGlowSpeed, setAuraGlowSpeed, auraGlowOpacity, setAuraGlowOpacity,
    starfieldCount, setStarfieldCount, starfieldSpeed, setStarfieldSpeed, starfieldOpacity, setStarfieldOpacity, starfieldSize, setStarfieldSize,
    juliaReal, juliaImaginary, juliaZoom, juliaIterations, setJuliaReal, setJuliaImaginary, setJuliaZoom, setJuliaIterations,
    fieldContrast, paletteMode, paletteBands, setFieldContrast, setPaletteMode, setPaletteBands,
    invertAmount, setInvertAmount,
    voronoiAnimTime, setVoronoiAnimTime, flowerAnimTime, setFlowerAnimTime, auroraAnimTime, setAuroraAnimTime,
    causticsAnimTime, setCausticsAnimTime, lavaAnimTime, setLavaAnimTime, marbleAnimTime, setMarbleAnimTime,
    metaballAnimTime, setMetaballAnimTime, moireAnimTime, setMoireAnimTime, flowAnimTime, setFlowAnimTime,
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
    duotoneColor1, duotoneColor2, duotoneColor3, duotoneIntensity, duotoneThreeColor, dustCrackleColor, dustCrackleIntensity, dustCrackleLength,
    emojiChars, emojiOffsetX, emojiRotateSpeed, emojiSize, emojiSizeVariation, fadeDirection,
    feedbackDecay, feedbackRotation, feedbackZoom, fisheyeCenterX, fisheyeCenterY, fisheyeStrength,
    flowParticleCount, flowScale, flowSpeed, flowThickness,
    attractorPointCount, attractorScale, attractorSpeed, attractorDotSize, setAttractorPointCount, setAttractorScale, setAttractorSpeed, setAttractorDotSize,
    attractorTrailFade, setAttractorTrailFade,
    particlesCount, particlesSpeed, particlesSize, particlesTrail, particlesGravity, particlesSides,
    setParticlesCount, setParticlesSpeed, setParticlesSize, setParticlesTrail, setParticlesGravity, setParticlesSides,
    tilingSize, tilingSymmetry, tilingComplexity, tilingRotation, tilingRowOffset,
    setTilingSize, setTilingSymmetry, setTilingComplexity, setTilingRotation, setTilingRowOffset,
    reactionDiffusionFeed, reactionDiffusionKill, reactionDiffusionSpeed,
    setReactionDiffusionFeed, setReactionDiffusionKill, setReactionDiffusionSpeed,
    topographicScale, topographicBands, topographicLineWidth,
    setTopographicScale, setTopographicBands, setTopographicLineWidth,
    flowerCircles, flowerRotation, flowerSymmetry, flowerOpacity,
    flowerScale, flowerSpread, gradientAngle, gradientColors, gradientType, grainIntensity, grainSize,
    grainType, gridCellAngleStep, gridColumns, gridRotation, gridRows, gridShapeSize, gridSides,
    gridVariation, halftoneCMYK, halftoneMove, halftoneMoveSpeed, halftoneSize, halftoneVariation,
    hexGridSize, isAudioEnabled, isAudioReactive,
    kaleidoscopeRotateSpeed, kaleidoscopeSegments, lavaBlobCount, lavaBlobSize, lavaSpeed, lightLeakIntensity,
    linesAngle, linesCount, linesThickness, liquidScale, liquidStrength, liquifyStrength, crtIntensity, crtScanlineSpacing,
    marbleOctaves, marbleTurbulence, marbleVeinFreq, masterSensitivity,
    metaballCount, metaballSize, metaballSpeed, midsBeatSync, midsMax, midsMin,
    midsMultiplier, midsSmoothing, midsThreshold, mirrorMode, mirrorTileCount, moireOffset,
    moireScale, moireSpeed, noiseDirection, noiseOctaves, noiseScale, noiseType,
    noiseWarp, paletteBeatEnabled, photoBlendMode, photoImageRef, photoOpacity, pinchStrength,
    pixelSize, plasmaComplexity, plasmaSpeed, plasmaZoomScale, polygon2Sides,
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
    setGradientAngle, setGradientColors, setGradientType, setGrainIntensity, setGrainType, setGrainSize, setGridCellAngleStep, setGridColumns,
    setGridRotation, setGridRows, setGridShapeSize, setGridSides, setGridVariation, setHalftoneCMYK,
    setHalftoneMove, setHalftoneMoveSpeed, setHalftoneSize, setHalftoneVariation, setHexGridSize,
    setIsAudioEnabled, setIsAudioReactive, setKaleidoscopeRotateSpeed, setKaleidoscopeSegments,
    setLavaBlobCount, setLavaBlobSize, setLavaSpeed, setLightLeakIntensity, setLinesAngle, setLinesCount,
    setLinesThickness, setLiquidScale, setLiquidStrength, setLiquifyStrength, setCrtIntensity, setCrtScanlineSpacing, setMarbleOctaves, setMarbleTurbulence,
    setMarbleVeinFreq, setMasterSensitivity, setMetaballCount, setMetaballSize,
    setMetaballSpeed, setMidsBeatSync, setMidsMax, setMidsMin, setMidsMultiplier, setMidsSmoothing,
    setMidsThreshold, setMirrorMode, setMirrorTileCount, setMoireOffset, setMoireScale, setMoireSpeed,
    setNoiseDirection, setNoiseOctaves, setNoiseScale, setNoiseType, setNoiseWarp, setPaletteBeatEnabled,
    setPhotoBlendMode, setPhotoOpacity, setPinchStrength, setPixelSize, setPlasmaComplexity, setPlasmaSpeed,
    setPlasmaZoomScale, setPolygon2Sides, setPosterizeLevels, setRadarBeamWidth, setRadarFadeLength,
    setRadarSweepAngle, setRadialBurstCount, setRadialBurstMode, setRadialBurstSize, setRadialBurstSpread, setRadialSizeScale, setResolutionMultiplier,
    setSepiaIntensity,
    setShakeBeatEnabled, setShapesCount, setShapesSides, setSlitScanDirection, setSlitScanIntensity, setSlitScanHistory, setSolarizeThreshold,
    setWindmillRotations, setWindmillThickness, setWindmillTightness, setWindmillZoom, setWindmillZoomResponse, setWindmillMode, setSubBassBeatSync, setSubBassMultiplier,
    setSubmittedAIPrompt, setTargetAngle, setTargetColors, setTargetZoom, setTrebleBeatSync, setTrebleMax,
    setTrebleMin, setTrebleMultiplier, setTrebleSmoothing, setTrebleThreshold, setTriangleSize, setTriangulateVariation, setTruchetSize,
    setTruchetThickness, setTruchetVariation, setTwistAmount, setVhsGlitchIntensity, setVhsJitterAmount, setVignetteSoftness, setVignetteStrength,
    setVoronoiCellCount, setVoronoiDistortion, setWaveDistortionRotation, setWaveDistortionStrength,
    setZoom, setZoomBeatEnabled, shakeBeatEnabled,
    shapesCount, shapesSides, slitScanDirection, slitScanIntensity, slitScanHistory, solarizeThreshold, windmillRotations,
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
    activeEffects, adjustColorArrayLength, gradientAngle, gradientColors, gradientType, isAudioEnabled, isAudioReactive, isMobile,
    kaleidoscopeSegments, pixelSize, resolutionMultiplier, setResolutionMultiplier,
    plasmaSpeed, randomColor, randomHexColor, ratedResults, saveCurrentState, setActiveEffects,
    setAngleCenterX, setAngleCenterY, setAngleStartOffset, setAsciiSize, setAsciiColor, setAuroraBandCount, setAuroraBandHeight,
    setAuroraWaveSpeed, setBaseAIColors, setBassBeatSync, setBassMultiplier, setBloomIntensity, setBloomRadius, setBlurGaussianAmount, setBlurMotionAmount,
    setBlurMotionDirection, setBlurRadialAmount, setBlurType, setCausticsBrightness, setCausticsScale, setChromaticAngle, setChromaticOffset,
    setChromaticTrailsDecay, setChromaticTrailsOffset, setColorShiftHue, setConcentricRingCount, setConcentricRingWidth,
    setHelixTightness, setHelixTurns, setContrastBeatEnabled, setDigitalNoiseIntensity, setDitherLevels, setDitherType, setDitherScale,
    setDuotoneColor1, setDuotoneColor2, setDuotoneColor3, setDuotoneIntensity, setDuotoneThreeColor, setDustCrackleColor, setDustCrackleIntensity, setDustCrackleLength, setEmojiChars,
    setEmojiRotateSpeed, setEmojiSize, setEmojiSizeVariation, setFadeDirection, setFeedbackDecay, setFeedbackRotation, setFeedbackZoom,
    setFisheyeCenterX, setFisheyeCenterY, setFisheyeStrength, setFlowParticleCount, setFlowScale, setFlowSpeed, setFlowThickness, setFlowerCircles,
    setAsciiChars, setGrainType, setGridRotationDirection, setKaleidoscopeRotateSpeed, setLiquidScale, setLiquidStrength, setCrtIntensity, setCrtScanlineSpacing,
    setNoiseType, setNoiseWarp, setPlasmaZoomScale, setRadialSizeScale, setVignetteSoftness, setWaveDistortionRotation,
    setJuliaReal, setJuliaImaginary, setJuliaZoom, setJuliaIterations,
    setReactionDiffusionFeed, setReactionDiffusionKill, setReactionDiffusionSpeed,
    setAttractorPointCount, setAttractorScale, setAttractorSpeed, setAttractorDotSize, setAttractorTrailFade,
    setParticlesCount, setParticlesSpeed, setParticlesSize, setParticlesTrail, setParticlesGravity, setParticlesSides,
    setTilingSize, setTilingSymmetry, setTilingComplexity, setTilingRotation, setTilingRowOffset,
    setFireworksCount, setFireworksParticleCount, setFireworksTrailFade,
    setLightningBoltCount, setLightningJitter, setLightningBranchiness,
    setMeshWireframeGridSize, setMeshWireframeJitter, setMeshWireframeLineWidth,
    setWaveInterferenceSourceCount, setWaveInterferenceFrequency, setWaveInterferenceSpeed,
    setTopographicScale, setTopographicBands, setTopographicLineWidth,
    setFieldContrast, setPaletteMode, setPaletteBands, setInvertAmount,
    setGlitchIntensity, setGlitchBlockSize, setGlitchChromaSplit,
    setSlitScanIntensity, setSlitScanDirection, setSlitScanHistory,
    setFlowerScale, setFlowerSpread, setGradientColors, setGradientType, setGrainIntensity, setGrainSize, setGridCellAngleStep, setGridColumns,
    setGridRotation, setGridRows, setGridShapeSize, setGridSides, setGridVariation, setHalftoneMove, setHalftoneCMYK,
    setHalftoneMoveSpeed, setHalftoneSize, setHalftoneVariation, setHexGridSize,
    setIsMultiFxMode, setKaleidoscopeSegments, setLavaBlobCount, setLavaBlobSize, setLightLeakIntensity,
    setMidsBeatSync, setMidsMultiplier,
    setLinesAngle, setLinesCount, setLinesThickness, setLiquifyStrength, setMarbleOctaves, setMarbleTurbulence,
    setMarbleVeinFreq, setMasterSensitivity, setMetaballCount, setMetaballSize, setMetaballSpeed, setMirrorMode,
    setMirrorTileCount, setMoireOffset, setMoireScale, setMoireSpeed, setNoiseDirection, setNoiseOctaves,
    setNoiseScale, setPaletteBeatEnabled, setPinchStrength, setPixelSize, setPlasmaComplexity, setPlasmaSpeed,
    setPolygon2Sides, setPosterizeLevels, setRadarBeamWidth, setRadarFadeLength, setRadialBurstCount,
    setRadialBurstSize, setRadialBurstSpread, setRotationDirection,
    setSepiaIntensity, setShakeBeatEnabled, setShapesCount,
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
    setStarfieldCount, setStarfieldSpeed, setStarfieldOpacity, setStarfieldSize,
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
  const [autoShufflePopoverAnchor, setAutoShufflePopoverAnchor] = useState<{ top: number; left: number; width: number; height?: number } | null>(null);
  const autoShufflePopoverRef = useRef<HTMLDivElement>(null);
  // The button that opened the popover — excluded from the outside-click
  // dismiss check below (see that handler for why).
  const autoShuffleTriggerElRef = useRef<HTMLElement | null>(null);
  // Anchored to the trigger button (the rail's Auto Shuffle icon), falling
  // back to the rail's own rect for the keyboard-triggered open (⌥⇧W, no
  // click event to read a trigger element from). No height cap anymore —
  // the rail is a slim strip, not a wide card with tab content stacked
  // below it that the popover needs to avoid covering, so it just floats
  // near the trigger and sizes to its own content.
  const openAutoShufflePopover = (triggerEl?: HTMLElement | null) => {
    autoShuffleTriggerElRef.current = triggerEl ?? null;
    const anchorEl = triggerEl || panelRef.current;
    const rect = anchorEl ? anchorEl.getBoundingClientRect() : { top: 60, left: 16, bottom: 60, width: 240 } as DOMRect;
    const width = Math.max(200, 240);
    const left = Math.min(rect.left, window.innerWidth - width - 8);
    const top = rect.bottom + 6;
    setAutoShufflePopoverAnchor({ top, left: Math.max(8, left), width });
  };
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
    // Styled to match the panel's other popouts (solid black, white text —
    // same bg-black the rail/drawer use) — this popover is portaled to
    // document.body, outside the dock's own DOM subtree, so it doesn't get
    // that theme CSS applied automatically; the colors below are written
    // out directly instead.
    return createPortal(
      <div
        ref={autoShufflePopoverRef}
        // Always fully rounded now — it floats freely near the rail's Auto
        // Shuffle button rather than mounting flush under a wide card's top
        // edge, so there's no adjacent edge to square a corner against.
        className="fixed z-50 shadow-sm p-3 flex flex-col gap-2 rounded-lg bg-black"
        style={{
          top: autoShufflePopoverAnchor.top,
          left: autoShufflePopoverAnchor.left,
          width: autoShufflePopoverAnchor.width,
          height: autoShufflePopoverAnchor.height,
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
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
        <p className="text-[10px] text-white/50">Remix every {formatAutoShuffleInterval(autoShuffleIntervalSec)}</p>
      </div>,
      document.body,
    );
  };
  // Speed popover — same anchor/portal/outside-click pattern as Auto
  // Shuffle above, replacing the always-visible ‹ 1x › step buttons that
  // used to live inline in VCRControls.
  const [speedPopoverAnchor, setSpeedPopoverAnchor] = useState<{ top: number; left: number; width: number } | null>(null);
  const speedPopoverRef = useRef<HTMLDivElement>(null);
  const speedTriggerElRef = useRef<HTMLElement | null>(null);
  const openSpeedPopover = (triggerEl?: HTMLElement | null) => {
    speedTriggerElRef.current = triggerEl ?? null;
    const anchorEl = triggerEl || panelRef.current;
    const rect = anchorEl ? anchorEl.getBoundingClientRect() : { top: 60, left: 16, bottom: 60, width: 240 } as DOMRect;
    const width = 160;
    const left = Math.min(rect.left, window.innerWidth - width - 8);
    const top = rect.bottom + 6;
    setSpeedPopoverAnchor({ top, left: Math.max(8, left), width });
  };
  const toggleSpeedPopover = (triggerEl: HTMLElement) => {
    if (speedPopoverAnchor) {
      setSpeedPopoverAnchor(null);
    } else {
      openSpeedPopover(triggerEl);
    }
  };
  useEffect(() => {
    if (!speedPopoverAnchor) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (speedPopoverRef.current && !speedPopoverRef.current.contains(target)
        && !(speedTriggerElRef.current && speedTriggerElRef.current.contains(target))) {
        setSpeedPopoverAnchor(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [speedPopoverAnchor]);
  const SPEED_STEPS = [0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const renderSpeedPopover = () => {
    if (!speedPopoverAnchor) return null;
    return createPortal(
      <div
        ref={speedPopoverRef}
        className="fixed z-50 shadow-sm p-2 flex flex-col gap-1 rounded-lg bg-black"
        style={{
          top: speedPopoverAnchor.top,
          left: speedPopoverAnchor.left,
          width: speedPopoverAnchor.width,
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <span className="text-xs text-white px-1">Playback Speed</span>
        <div className="grid grid-cols-4 gap-1">
          {SPEED_STEPS.map((speed) => (
            <button
              key={speed}
              onClick={() => setVcrPlaybackSpeed(speed)}
              className="text-[10px] font-mono tabular-nums rounded px-1 py-1 text-white transition-colors"
              style={{ backgroundColor: vcrPlaybackSpeed === speed ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)' }}
            >
              {speed}x
            </button>
          ))}
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
  useEffect(() => {
    if (!isAutoShuffleOn || isNewPresetPending) return;
    evolveWithFactorRef.current(1);
    const id = setInterval(() => evolveWithFactorRef.current(1), autoShuffleIntervalSec * 1000);
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
      if (typeof v.causticsAnimTime === 'number') av.causticsAnimTime = v.causticsAnimTime;
      if (typeof v.lavaAnimTime === 'number') av.lavaAnimTime = v.lavaAnimTime;
      if (typeof v.marbleAnimTime === 'number') av.marbleAnimTime = v.marbleAnimTime;
      if (typeof v.metaballAnimTime === 'number') av.metaballAnimTime = v.metaballAnimTime;
      if (typeof v.moireAnimTime === 'number') av.moireAnimTime = v.moireAnimTime;
      if (typeof v.flowAnimTime === 'number') av.flowAnimTime = v.flowAnimTime;
      if (typeof v.liquidAnimTime === 'number') av.liquidAnimTime = v.liquidAnimTime;
      if (typeof v.emojiAnimTime === 'number') av.emojiAnimTime = v.emojiAnimTime;
      if (typeof v.attractorAnimTime === 'number') av.attractorAnimTime = v.attractorAnimTime;
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
      if (gradientType === 'fade') {
        setTargetColors(prev => prev.map((color, index) => applyColorShift(color, baseAIColors?.[index] || null, 8)));
      } else if (gradientType === 'voronoi' || gradientType === 'radial-burst' || gradientType === 'flower' || gradientType === 'noise') {
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
    kaleidoscopeSegments, kaleidoscopeRotateSpeed, twistAmount, pixelSize, triangleSize, triangulateVariation, chromaticOffset, fisheyeStrength,
    grainIntensity, grainType, grainSize, blurMotionAmount, blurGaussianAmount, blurRadialAmount,
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
    gridVariation, angleStartOffset, angleCenterX, angleCenterY, windmillTightness, windmillRotations,
    windmillThickness, windmillZoom, windmillZoomResponse, windmillMode, shapesSides, shapesCount, concentricRingWidth, concentricRingCount,
    radialSizeScale, noiseScale, noiseOctaves, noiseWarp, noiseType, plasmaSpeed,
    plasmaComplexity, plasmaZoomScale, radialBurstCount, radialBurstMode, radialBurstSpread, radialBurstSize, voronoiCellCount, voronoiDistortion,
    voronoiAnimTime, helixTurns, helixTightness,
    radarSweepAngle, radarFadeLength,
    flowerCircles, flowerScale, flowerSpread, flowerRotation, flowerSymmetry, flowerOpacity, flowerAnimTime,
    auroraAnimTime, auroraBandCount, auroraWaveSpeed, auroraBandHeight,
    causticsAnimTime, causticsBrightness, causticsScale,
    lavaAnimTime, lavaBlobCount, lavaBlobSize, lavaSpeed,
    marbleAnimTime, marbleVeinFreq, marbleTurbulence, marbleOctaves,
    noiseDirection,
    ditherType, ditherLevels, ditherScale, slitScanIntensity, slitScanDirection, slitScanHistory,
    glitchIntensity, glitchBlockSize, glitchChromaSplit,
    auraGlowCount, auraGlowSpeed, auraGlowOpacity,
    starfieldCount, starfieldSpeed, starfieldOpacity, starfieldSize,
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
    fieldContrast, paletteMode, paletteBands, invertAmount, attractorTrailFade, structuralSeed,
    depthLayerEnabled, depthLayerStrength,
    waveInterferenceAnimTime, waveInterferenceSourceCount, waveInterferenceFrequency, waveInterferenceSpeed,
    meshWireframeAnimTime, meshWireframeGridSize, meshWireframeJitter, meshWireframeLineWidth,
  }), [resolutionMultiplier, gradientType, activeEffects, kaleidoscopeSegments, kaleidoscopeRotateSpeed, twistAmount, pixelSize, triangleSize, triangulateVariation, chromaticOffset, fisheyeStrength, grainIntensity, grainType, grainSize, blurMotionAmount, blurGaussianAmount, blurRadialAmount, blurMotionDirection, blurType, posterizeLevels, halftoneSize, halftoneVariation, halftoneMove, halftoneMoveSpeed, halftoneCMYK, bloomIntensity, bloomRadius, feedbackDecay, feedbackZoom, feedbackRotation, vignetteStrength, colorShiftHue, paletteHue, paletteSaturation, paletteBrightness, paletteContrast, pinchStrength, hexGridSize, linesCount, linesAngle, linesThickness, dustCrackleColor, dustCrackleIntensity, dustCrackleLength, vhsGlitchIntensity, vhsJitterAmount, crtIntensity, crtScanlineSpacing, waveDistortionStrength, waveDistortionRotation, liquifyStrength, sepiaIntensity, solarizeThreshold, lightLeakIntensity, duotoneIntensity, duotoneColor1, duotoneColor2, duotoneColor3, duotoneThreeColor, digitalNoiseIntensity, gridRotation, gridRows, gridColumns, gridShapeSize, gridCellAngleStep, gridVariation, angleStartOffset, angleCenterX, angleCenterY, windmillTightness, windmillRotations, windmillThickness, windmillZoom, windmillZoomResponse, windmillMode, shapesSides, shapesCount, concentricRingWidth, concentricRingCount, polygon2Sides, radialSizeScale, noiseScale, noiseOctaves, noiseWarp, noiseType, plasmaSpeed, plasmaComplexity, plasmaZoomScale, radialBurstCount, radialBurstMode, radialBurstSpread, radialBurstSize, voronoiCellCount, voronoiDistortion, helixTurns, helixTightness, radarSweepAngle, radarFadeLength, flowerCircles, flowerScale, flowerSpread, flowerRotation, flowerSymmetry, flowerOpacity, auroraBandCount, auroraWaveSpeed, auroraBandHeight, causticsBrightness, causticsScale, lavaBlobCount, lavaBlobSize, lavaSpeed, marbleVeinFreq, marbleTurbulence, marbleOctaves, noiseDirection, ditherType, ditherLevels, ditherScale, slitScanIntensity, slitScanDirection, slitScanHistory, addGradientStops, isAudioEnabled, isAudioReactive, fadeDirection, radarBeamWidth, chromaticAngle, vignetteSoftness, fisheyeCenterX, fisheyeCenterY, mirrorMode, mirrorTileCount, metaballCount, metaballSize, metaballSpeed, truchetSize, truchetVariation, truchetThickness, moireScale, moireOffset, moireSpeed, flowParticleCount, flowSpeed, flowScale, flowThickness, attractorPointCount, attractorSpeed, attractorScale, attractorDotSize, particlesCount, particlesSpeed, particlesSize, particlesTrail, particlesGravity, particlesSides, tilingSize, tilingSymmetry, tilingComplexity, tilingRotation, tilingAnimTime, tilingRowOffset, waveInterferenceAnimTime, waveInterferenceSourceCount, waveInterferenceFrequency, waveInterferenceSpeed, meshWireframeAnimTime, meshWireframeGridSize, meshWireframeJitter, meshWireframeLineWidth, fireworksCount, fireworksParticleCount, fireworksTrailFade, lightningBoltCount, lightningJitter, lightningBranchiness, reactionDiffusionFeed, reactionDiffusionKill, reactionDiffusionSpeed, topographicScale, topographicBands, topographicLineWidth, juliaReal, juliaImaginary, juliaZoom, juliaIterations, glitchIntensity, glitchBlockSize, glitchChromaSplit, auraGlowCount, auraGlowSpeed, auraGlowOpacity, starfieldCount, starfieldSpeed, starfieldOpacity, starfieldSize, asciiSize, asciiColor, asciiChars, emojiSize, emojiChars, emojiRotateSpeed, liquidStrength, liquidScale, chromaticTrailsDecay, chromaticTrailsOffset, fieldContrast, paletteMode, paletteBands, invertAmount, attractorTrailFade, structuralSeed, audioBindings, photoVersion, photoBlendMode, photoOpacity, depthLayerEnabled, depthLayerStrength]);

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
    activeEffects, addGradientStops, angleCenterX, angleCenterY, angleStartOffset, asciiChars,
    asciiColor, asciiSize, attractorBufferRef, attractorPointCount, attractorPointsRef,
    particlesBufferRef, particlesPointsRef, particlesCount, particlesSpeed, particlesSize, particlesTrail, particlesGravity, particlesSides,
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
    concentricRingWidth, helixTightness, helixTurns, ditherLevels, ditherType, ditherScale, drawParams,
    glitchIntensity, glitchBlockSize, glitchChromaSplit,
    auraGlowCount, auraGlowSpeed, auraGlowOpacity,
    starfieldCount, starfieldSpeed, starfieldOpacity, starfieldSize, starfieldParticlesRef,
    fieldContrast, paletteMode, paletteBands, invertAmount, attractorTrailFade, structuralSeed,
    depthLayerEnabled, depthLayerStrength,
    drawParamsDirtyRef, drawRef, duotoneColor1, duotoneColor2, duotoneColor3, duotoneIntensity,
    duotoneThreeColor, dustCrackleColor, dustCrackleIntensity, dustCrackleLength, emojiChars, emojiOffsetX, emojiSize,
    emojiSizeVariation, fadeDirection, feedbackBufferRef, feedbackDecay, feedbackRotation, feedbackZoom,
    fisheyeCenterX, fisheyeCenterY, fisheyeStrength, flowBufferRef, flowParticleCount,
    flowParticlesRef, flowScale, flowThickness, flowerCircles, flowerRotation, flowerSymmetry, flowerOpacity,
    flowerScale, flowerSpread,
    gradientAngle, gradientAngleRef, gradientColors, gradientColorsRef,
    gradientType, grainIntensity, grainType, grainSize, gridCellAngleStep, gridColumns, gridRotation, gridRows,
    gridShapeSize, gridSides, gridVariation, halftoneCMYK, halftoneMove, halftoneSize,
    halftoneTimeRef, halftoneVariation, isAudioEnabled,
    isAudioReactive, isAutoModeRef, isVCRPlayingRef, kaleidoAngleRef, kaleidoscopeRotateSpeed, kaleidoscopeSegments,
    lavaBlobCount, lavaBlobSize, lavaSpeed,
    liquidScale,
    liquidStrength, crtIntensity, crtScanlineSpacing, marbleOctaves, marbleTurbulence, marbleVeinFreq,
    metaballCount, metaballSize, mirrorMode, mirrorTileCount,
    moireOffset, moireScale, noiseDirection, noiseOctaves, noiseScale,
    noiseType, noiseWarp, photoBlendMode, photoImageRef, photoOpacity, pixelSize,
    plasmaComplexity, plasmaZoomScale, polygon2Sides, posterizeLevels,
    radarBeamWidth, radarFadeLength, radarSweepAngle, radialBurstCount, radialBurstMode, radialBurstSize, radialBurstSpread,
    radialSizeScale, reactionDiffusionFeed, reactionDiffusionGridRef, reactionDiffusionKill, reactionDiffusionSpeed,
    resolutionMultiplier,
    shapesCount, shapesSides, slitScanBufferRef, slitScanDirection,
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
        case '?':
          e.preventDefault();
          setIsAboutOpen(prev => !prev);
          break;
        case 'Escape':
          if (isAboutOpen) { e.preventDefault(); setIsAboutOpen(false); }
          else if (autoShufflePopoverAnchor) { e.preventDefault(); setAutoShufflePopoverAnchor(null); }
          else if (speedPopoverAnchor) { e.preventDefault(); setSpeedPopoverAnchor(null); }
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
    autoShufflePopoverAnchor, setAutoShufflePopoverAnchor,
    speedPopoverAnchor, setSpeedPopoverAnchor,
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
    isAutoColor, setIsAutoColor, saveCurrentState, setTargetColors, gradientColors, randomColor,
    submittedAIPrompt, setSubmittedAIPrompt, setBaseAIColors, setGradientColors, aiPrompt, setAIPrompt,
    isKeywordHelpOpen, setIsKeywordHelpOpen, handleAIPromptSubmit, setIsAIColorPickerOpen,
    paletteHue, setPaletteHue, paletteSaturation, setPaletteSaturation, paletteBrightness, setPaletteBrightness,
    paletteContrast, setPaletteContrast,
    // Gradients
    gradientType, setGradientType, getGradientDisplayName, gridRows, setGridRows, gridColumns, setGridColumns,
    gridCellAngleStep, setGridCellAngleStep, polygon2Sides, setPolygon2Sides, concentricRingCount, setConcentricRingCount,
    auroraBandCount, setAuroraBandCount, auroraBandHeight, setAuroraBandHeight, auroraWaveSpeed, setAuroraWaveSpeed,
    causticsBrightness, setCausticsBrightness, causticsScale, setCausticsScale, lavaBlobCount, setLavaBlobCount,
    lavaBlobSize, setLavaBlobSize, marbleVeinFreq, setMarbleVeinFreq, marbleTurbulence, setMarbleTurbulence,
    marbleOctaves, setMarbleOctaves, metaballCount, setMetaballCount, metaballSize, setMetaballSize,
    metaballSpeed, setMetaballSpeed, truchetSize, setTruchetSize, truchetVariation, setTruchetVariation,
    truchetThickness, setTruchetThickness, moireScale, setMoireScale, moireOffset, setMoireOffset,
    moireSpeed, setMoireSpeed, flowParticleCount, setFlowParticleCount, flowSpeed, setFlowSpeed,
    flowScale, setFlowScale, flowThickness, setFlowThickness, attractorPointCount, setAttractorPointCount,
    attractorSpeed, setAttractorSpeed, attractorScale, setAttractorScale, attractorDotSize, setAttractorDotSize,
    attractorTrailFade, setAttractorTrailFade, particlesCount, setParticlesCount, particlesSpeed, setParticlesSpeed,
    particlesSize, setParticlesSize, particlesTrail, setParticlesTrail, particlesGravity, setParticlesGravity,
    particlesSides, setParticlesSides, tilingSize, setTilingSize, tilingSymmetry, setTilingSymmetry,
    tilingComplexity, setTilingComplexity, tilingRotation, setTilingRotation, tilingRowOffset, setTilingRowOffset,
    fireworksCount, setFireworksCount, fireworksParticleCount, setFireworksParticleCount, fireworksTrailFade, setFireworksTrailFade,
    lightningBoltCount, setLightningBoltCount, lightningJitter, setLightningJitter, lightningBranchiness, setLightningBranchiness,
    reactionDiffusionFeed, setReactionDiffusionFeed, reactionDiffusionKill, setReactionDiffusionKill, reactionDiffusionSpeed, setReactionDiffusionSpeed,
    fieldContrast, setFieldContrast, paletteMode, setPaletteMode, paletteBands, setPaletteBands,
    topographicScale, setTopographicScale, topographicBands, setTopographicBands, topographicLineWidth, setTopographicLineWidth,
    waveInterferenceSourceCount, setWaveInterferenceSourceCount, waveInterferenceFrequency, setWaveInterferenceFrequency, waveInterferenceSpeed, setWaveInterferenceSpeed,
    meshWireframeGridSize, setMeshWireframeGridSize, meshWireframeJitter, setMeshWireframeJitter, meshWireframeLineWidth, setMeshWireframeLineWidth,
    juliaReal, setJuliaReal, juliaImaginary, setJuliaImaginary, juliaZoom, setJuliaZoom, juliaIterations, setJuliaIterations,
    angleStartOffset, setAngleStartOffset, angleCenterX, setAngleCenterX, angleCenterY, setAngleCenterY,
    radialSizeScale, setRadialSizeScale, concentricRingWidth, setConcentricRingWidth, shapesSides, setShapesSides,
    shapesCount, setShapesCount, windmillTightness, setWindmillTightness, windmillRotations, setWindmillRotations,
    windmillThickness, setWindmillThickness, windmillZoomResponse, windmillMode, setWindmillMode, setWindmillZoomResponse,
    drawParamsDirtyRef, noiseScale, setNoiseScale, noiseOctaves, setNoiseOctaves, noiseDirection, setNoiseDirection,
    noiseWarp, setNoiseWarp, noiseType, setNoiseType, plasmaComplexity, setPlasmaComplexity, plasmaZoomScale, setPlasmaZoomScale,
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
    glitchIntensity, setGlitchIntensity, glitchBlockSize, setGlitchBlockSize, glitchChromaSplit, setGlitchChromaSplit,
    auraGlowCount, setAuraGlowCount, auraGlowSpeed, setAuraGlowSpeed, auraGlowOpacity, setAuraGlowOpacity,
    starfieldCount, setStarfieldCount, starfieldSpeed, setStarfieldSpeed, starfieldOpacity, setStarfieldOpacity,
    starfieldSize, setStarfieldSize,
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
          onWordmarkClick={() => setIsAboutOpen(true)}
          handleWavClick={handleWavClick}
          isWavPressed={isWavPressed}
          isAutoShuffleOn={isAutoShuffleOn}
          isNewPresetPending={isNewPresetPending}
          autoShuffleIntervalSec={autoShuffleIntervalSec}
          formatAutoShuffleInterval={formatAutoShuffleInterval}
          autoShufflePopoverAnchor={autoShufflePopoverAnchor}
          setAutoShufflePopoverAnchor={setAutoShufflePopoverAnchor}
          openAutoShufflePopover={openAutoShufflePopover}
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
          isVCRPlaying={isVCRPlaying}
          isAutoMode={isAutoMode}
          vcrRecordedFrames={vcrRecordedFrames}
          vcrPlaybackSpeed={vcrPlaybackSpeed}
          isEncoding={isEncoding}
          encodingProgress={encodingProgress}
          toggleVCRRecording={toggleVCRRecording}
          handleStop={handleStop}
          toggleVCRPlayback={toggleVCRPlayback}
          isSpeedPopoverOpen={!!speedPopoverAnchor}
          onToggleSpeedPopover={toggleSpeedPopover}
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
          onWordmarkClick={() => setIsAboutOpen(true)}
          handleWavClick={handleWavClick}
          isWavPressed={isWavPressed}
          isAutoShuffleOn={isAutoShuffleOn}
          isNewPresetPending={isNewPresetPending}
          autoShuffleIntervalSec={autoShuffleIntervalSec}
          formatAutoShuffleInterval={formatAutoShuffleInterval}
          autoShufflePopoverAnchor={autoShufflePopoverAnchor}
          setAutoShufflePopoverAnchor={setAutoShufflePopoverAnchor}
          openAutoShufflePopover={openAutoShufflePopover}
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
          isVCRPlaying={isVCRPlaying}
          isAutoMode={isAutoMode}
          vcrRecordedFrames={vcrRecordedFrames}
          vcrPlaybackSpeed={vcrPlaybackSpeed}
          isEncoding={isEncoding}
          encodingProgress={encodingProgress}
          toggleVCRRecording={toggleVCRRecording}
          handleStop={handleStop}
          toggleVCRPlayback={toggleVCRPlayback}
          isSpeedPopoverOpen={!!speedPopoverAnchor}
          onToggleSpeedPopover={toggleSpeedPopover}
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
      {!isMobile && isControlsVisible && dock}
      <div className="relative flex-1 min-w-0 min-h-0 overflow-hidden">
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
          style={{ touchAction: 'none', opacity: hasRevealed ? 1 : 0, transition: 'opacity 900ms ease-out' }}
        />
      </div>
      </div>
      {isMobile && isControlsVisible && dock}

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
      {showWavHint && !activeTab && railRect && (
        <div
          className="fixed z-40 pointer-events-auto flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/25 border border-white/10 text-white/80 max-w-[220px]"
          style={isMobile
            ? { left: railRect.left, bottom: window.innerHeight - railRect.top + 8 }
            : { left: railRect.right + 12, top: railRect.top }}
        >
          <span className="text-[10px] leading-snug flex-1">
            Tap <span className="text-white font-medium">wāv</span> for help · tap <Shuffle weight="regular" className="w-2.5 h-2.5 inline -translate-y-px" /> to shuffle a new look
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
      {renderSpeedPopover()}

      {/* Display-link-copied toast — brief confirmation for Shift+P */}
      {isDisplayLinkCopied && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none bg-black/70 backdrop-blur-sm text-white text-xs px-4 py-2 rounded-full shadow-lg z-50">
          Display link copied — open it in a new tab/window for live output
        </div>
      )}

      {/* About panel — attached to the control panel's upper-left, flush
          against the rail (same railRect-anchored positioning the first-run
          hint above uses), rather than centered over the canvas. The
          click-catcher behind it stays unblurred so the gradient result
          underneath isn't blurred out; only the card itself keeps its own
          surface. */}
      {isAboutOpen && (
        <div className="absolute inset-0 pointer-events-auto z-50">
          <div className="absolute inset-0" onClick={() => setIsAboutOpen(false)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="About wāv"
            className={`absolute bg-black rounded-2xl p-8 max-w-sm max-h-[80vh] overflow-y-auto text-white shadow-2xl ${isMobile ? 'w-[calc(100%-3rem)]' : ''}`}
            style={railRect
              ? (isMobile
                  ? { left: railRect.left, bottom: window.innerHeight - railRect.top + 8 }
                  : { left: railRect.right + 12, top: railRect.top })
              : { top: 16, left: 16 }}
          >
            <button
              ref={aboutCloseButtonRef}
              onClick={() => setIsAboutOpen(false)}
              aria-label="Close about panel"
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 transition-all"
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
