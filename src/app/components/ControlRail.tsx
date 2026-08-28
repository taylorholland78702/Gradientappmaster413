import React, { forwardRef } from 'react';
import {
  Eye, Shuffle, Infinity as InfinityIcon, Camera, Gif, Circle,
  ArrowUUpLeft, ArrowUUpRight, Gradient, MagicWand, SpeakerHigh, Palette, FloppyDisk,
} from '@phosphor-icons/react';
import { VCRControls } from './VCRControls';

type TabId = 'gradients' | 'effects' | 'audio' | 'color' | 'presets';

export interface ControlRailProps {
  isMobile: boolean;
  // Desktop position (from panelPos, same mechanism the old draggable
  // panel used) — undefined on mobile, where the rail is fixed via
  // className instead (inset-x-3 bottom-3).
  style?: React.CSSProperties;

  // Wordmark / drag handle — press-and-hold drags the rail (desktop only,
  // reusing the same panelPos/localStorage mechanism the old draggable
  // panel used), a plain click opens About. Drag logic itself stays in
  // InteractiveGradient.tsx (onWordmarkMouseDown) since it needs panelPos/
  // setPanelPos from scope; this component just wires the handler up.
  onWordmarkMouseDown?: (e: React.MouseEvent) => void;
  onWordmarkClick?: () => void;

  // Visibility
  isControlsVisible: boolean;
  setIsControlsVisible: (v: boolean) => void;

  // Shuffle / Auto Shuffle
  handleWavClick: () => void;
  isWavPressed: boolean;
  isAutoShuffleOn: boolean;
  isNewPresetPending: boolean;
  autoShuffleIntervalSec: number;
  formatAutoShuffleInterval: (sec: number) => string;
  autoShufflePopoverAnchor: unknown;
  setAutoShufflePopoverAnchor: (v: null) => void;
  openAutoShufflePopover: (triggerEl?: HTMLElement | null) => void;

  // Export
  exportAsPNG: () => void;
  toggleGifRecording: () => void;
  isFinalizingGif: boolean;
  isRecordingGif: boolean;

  // Undo / Redo — previously only reachable via the collapsed pill (now
  // removed) or the ⌘Z/⌘⇧Z shortcuts; kept as rail buttons so that
  // discoverable affordance isn't lost in the pill→rail merge.
  undoLastChange: () => void;
  redoLastChange: () => void;
  undoDepth: number;
  redoDepth: number;

  // Panel tabs
  activeTab: TabId | null;
  setActiveTab: (tab: TabId | null) => void;
  isMicActive: boolean;
  liveSubBassLevel: number;
  liveBassLevel: number;
  liveMidsLevel: number;
  liveTrebleLevel: number;
  audioEnergy: number;

  // VCR controls (passed straight through to VCRControls)
  isRecording: boolean;
  isVCRPlaying: boolean;
  isAutoMode: boolean;
  vcrRecordedFrames: unknown[];
  vcrPlaybackSpeed: number;
  rotationDirection: 'clockwise' | 'counter';
  isEncoding: boolean;
  encodingProgress: number;
  setVcrPlaybackSpeed: (speed: number) => void;
  setRotationDirection: (dir: 'clockwise' | 'counter') => void;
  toggleVCRRecording: () => void;
  handleStop: () => void;
  toggleVCRPlayback: () => void;
}

// Short centered hairline between rail groups — a compact line rather than
// the full-stretch <Divider>, which was sized for the old full-width rows.
const RailSep: React.FC = () => (
  <div className="w-6 h-px bg-white/15 my-0.5 flex-shrink-0" />
);

const railBtnBase = 'w-[34px] h-[34px] rounded-[10px] flex items-center justify-center flex-shrink-0 transition-all';

/**
 * The left-edge icon rail replacing the old draggable 3-row card. Every
 * control the card used to have is here — visibility, shuffle, export,
 * transport, then the 5 panel tabs — just regrouped into one strip.
 * Vertical on desktop, wraps into a horizontal bottom bar on mobile (see
 * the isMobile-driven classes below) rather than needing two components,
 * since it's the same set of buttons either way.
 */
export const ControlRail = forwardRef<HTMLDivElement, ControlRailProps>(function ControlRail(props, ref) {
  const {
    isMobile, style, onWordmarkMouseDown, onWordmarkClick,
    isControlsVisible, setIsControlsVisible,
    handleWavClick, isWavPressed, isAutoShuffleOn, isNewPresetPending,
    autoShuffleIntervalSec, formatAutoShuffleInterval, autoShufflePopoverAnchor, setAutoShufflePopoverAnchor, openAutoShufflePopover,
    exportAsPNG, toggleGifRecording, isFinalizingGif, isRecordingGif,
    undoLastChange, redoLastChange, undoDepth, redoDepth,
    activeTab, setActiveTab, isMicActive, liveSubBassLevel, liveBassLevel, liveMidsLevel, liveTrebleLevel, audioEnergy,
  } = props;

  const tabBtnClass = (tab: TabId) =>
    `${railBtnBase} ${activeTab === tab ? 'bg-white/20 text-white' : 'text-white/90 hover:bg-white/10 hover:text-white'}`;

  return (
    <nav
      ref={ref}
      data-role="panel"
      aria-label="wāv controls"
      style={{ touchAction: 'none', ...style }}
      className={
        isMobile
          ? `fixed inset-x-3 bottom-3 z-50 pointer-events-auto flex flex-row flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 bg-black/25 rounded-2xl shadow-sm px-2.5 py-2 transition-transform duration-300 ${isControlsVisible ? '' : 'translate-y-[calc(100%+24px)]'}`
          // max-h-[calc(100vh-32px)] + overflow-y-auto: the rail is
          // draggable, so unlike a fixed-position bar it can end up
          // anchored somewhere that doesn't leave room for its full
          // height below it (dragged low, or a short viewport) — without
          // a scroll fallback, whatever falls past the bottom edge (e.g.
          // Undo/Redo) becomes permanently unreachable rather than just
          // needing a scroll. Hidden scrollbar (scrollbar-none isn't a
          // default Tailwind utility here, so this relies on the same
          // thin-scrollbar treatment already used elsewhere) keeps the
          // slim rail look when it does need to scroll.
          : `absolute pointer-events-auto flex flex-col items-center gap-1 bg-black/25 rounded-2xl shadow-sm px-1.5 py-2.5 transition-opacity duration-300 max-h-[calc(100vh-32px)] overflow-y-auto ${isControlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`
      }
    >
      {/* Wordmark — click opens About; hold-and-drag also repositions the
          rail on desktop (mobile has no drag capability, same as the old
          panel — the bottom bar is pinned, not freely positioned, so this
          is just a plain About button there). Kept a plain mark here (not
          the full liquid-glass wordmark SVG) since the rail is a slim
          strip, not a card with room for a full lockup — the SVG wordmark
          still appears once, inside the About panel itself. Always
          rendered (not desktop-only) — it's the only way to reach About on
          mobile, where there's no separate trigger for it. */}
      <button
        onMouseDown={isMobile ? undefined : onWordmarkMouseDown}
        onClick={onWordmarkClick}
        className={`w-[34px] h-[34px] rounded-[10px] flex items-center justify-center flex-shrink-0 text-white font-black select-none ${isMobile ? '' : 'cursor-grab active:cursor-grabbing mb-0.5'}`}
        style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15 }}
        title={isMobile ? 'About wāv' : 'Click: About · Hold: drag rail'}
        aria-label={isMobile ? 'About wāv' : 'Click for About, hold to drag the rail'}
      >
          w
        </button>

      <button
        onClick={() => setIsControlsVisible(false)}
        className={`${railBtnBase} text-white hover:bg-white/15`}
        title="Hide Controls (H)"
        aria-label="Hide Controls"
      >
        <Eye weight="regular" className="w-4 h-4" />
      </button>

      <RailSep />

      <button
        onClick={handleWavClick}
        className={`${railBtnBase} ${isWavPressed ? 'bg-white/20 text-white' : 'text-white hover:bg-white/15'}`}
        title="Shuffle (Shift+W)"
        aria-label="Shuffle to a new look"
      >
        <Shuffle weight="regular" className="w-4 h-4" />
      </button>
      <button
        onClick={(e) => autoShufflePopoverAnchor ? setAutoShufflePopoverAnchor(null) : openAutoShufflePopover(e.currentTarget)}
        className={`${railBtnBase} ${isAutoShuffleOn ? 'bg-white/20 text-white' : 'text-white hover:bg-white/15'} ${isNewPresetPending ? 'opacity-40 pointer-events-none' : ''}`}
        title={`Auto Shuffle — remix every ${formatAutoShuffleInterval(autoShuffleIntervalSec)} (⌥⇧W)`}
        aria-label="Auto Shuffle settings"
        aria-pressed={isAutoShuffleOn}
        disabled={isNewPresetPending}
      >
        <InfinityIcon weight="regular" className="w-4 h-4" />
      </button>

      <RailSep />

      <button onClick={() => setActiveTab(activeTab === 'gradients' ? null : 'gradients')} title="Gradient (G)" aria-label="Gradient tab" className={tabBtnClass('gradients')}>
        <Gradient weight="regular" className="w-4 h-4" />
      </button>
      <button onClick={() => setActiveTab(activeTab === 'effects' ? null : 'effects')} title="Effects (F)" aria-label="Effects tab" className={tabBtnClass('effects')}>
        <MagicWand weight="regular" className="w-4 h-4" />
      </button>
      <button onClick={() => setActiveTab(activeTab === 'audio' ? null : 'audio')} title="Audio (A)" aria-label="Audio tab" className={tabBtnClass('audio')}>
        <SpeakerHigh
          weight="regular"
          className={`w-4 h-4 transition-colors ${isMicActive
            ? (Math.max(liveSubBassLevel, liveBassLevel, liveMidsLevel, liveTrebleLevel, audioEnergy) > 0.04 ? 'wav-audio-signal-ok' : 'wav-audio-signal-none')
            : ''}`}
        />
      </button>
      <button onClick={() => setActiveTab(activeTab === 'color' ? null : 'color')} title="Color (C)" aria-label="Color tab" className={tabBtnClass('color')}>
        <Palette weight="regular" className="w-4 h-4" />
      </button>
      <button onClick={() => setActiveTab(activeTab === 'presets' ? null : 'presets')} title="Presets (P)" aria-label="Presets tab" className={tabBtnClass('presets')}>
        <FloppyDisk weight="regular" className="w-4 h-4" />
      </button>

      <RailSep />

      <button
        onClick={exportAsPNG}
        className={`${railBtnBase} text-white hover:bg-white/15`}
        title="Save PNG (S)"
        aria-label="Save PNG"
      >
        <Camera weight="regular" className="w-4 h-4" />
      </button>
      <button
        onClick={toggleGifRecording}
        disabled={isFinalizingGif}
        className={`${railBtnBase} text-white hover:bg-white/15 relative`}
        title={isFinalizingGif ? 'Finalizing GIF…' : isRecordingGif ? 'Stop GIF recording (click to finish)' : 'Record GIF (Shift+S)'}
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

      <VCRControls
        isRecording={props.isRecording}
        isVCRPlaying={props.isVCRPlaying}
        isAutoMode={props.isAutoMode}
        vcrRecordedFrames={props.vcrRecordedFrames}
        vcrPlaybackSpeed={props.vcrPlaybackSpeed}
        rotationDirection={props.rotationDirection}
        isEncoding={props.isEncoding}
        encodingProgress={props.encodingProgress}
        setVcrPlaybackSpeed={props.setVcrPlaybackSpeed}
        setRotationDirection={props.setRotationDirection}
        toggleVCRRecording={props.toggleVCRRecording}
        handleStop={props.handleStop}
        toggleVCRPlayback={props.toggleVCRPlayback}
        isMobile={isMobile}
      />

      <RailSep />

      <button
        onClick={undoLastChange}
        disabled={undoDepth < 0}
        className={`${railBtnBase} text-white hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-transparent`}
        title="Undo (⌘Z)"
        aria-label="Undo"
      >
        <ArrowUUpLeft weight="regular" className="w-4 h-4" />
      </button>
      <button
        onClick={redoLastChange}
        disabled={redoDepth <= 0}
        className={`${railBtnBase} text-white hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-transparent`}
        title="Redo (⌘⇧Z)"
        aria-label="Redo"
      >
        <ArrowUUpRight weight="regular" className="w-4 h-4" />
      </button>

      {!isMobile && <div className="flex-1 min-h-1" />}
    </nav>
  );
});
