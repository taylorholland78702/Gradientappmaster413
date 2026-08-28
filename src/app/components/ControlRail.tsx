import React, { forwardRef } from 'react';
import {
  Eye, Shuffle, Infinity as InfinityIcon, Camera, Gif, Circle,
  Gradient, MagicWand, SpeakerHigh, Palette, FloppyDisk,
} from '@phosphor-icons/react';
import { VCRControls } from './VCRControls';

type TabId = 'gradients' | 'effects' | 'audio' | 'color' | 'presets';

export interface ControlRailProps {
  isMobile: boolean;

  // Wordmark — click opens About. No drag handle any more: the rail is a
  // fixed docked sidebar (left edge on desktop, bottom edge on mobile),
  // not a repositionable floating panel.
  onWordmarkClick?: () => void;

  // Visibility — only the setter is needed; ControlRail is never mounted
  // while controls are hidden (see the comment above its return), so it
  // has no need to read the current value.
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

  // Undo / Redo — reachable via ⌘Z/⌘⇧Z only, not a rail button.
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
  setRotationDirection: (dir: 'clockwise' | 'counter') => void;
  toggleVCRRecording: () => void;
  handleStop: () => void;
  toggleVCRPlayback: () => void;
  isSpeedPopoverOpen: boolean;
  onToggleSpeedPopover: (triggerEl: HTMLElement) => void;
}

// Short centered hairline between rail groups — a vertical pipe on mobile's
// horizontal wrapped bar, a horizontal line on desktop's vertical column
// (each orthogonal to the axis the buttons are stacked along).
const RailSep: React.FC<{ isMobile?: boolean }> = ({ isMobile }) => (
  <div className={isMobile ? 'w-px h-5 bg-white/15 mx-0.5 flex-shrink-0' : 'w-5 h-px bg-white/15 my-0.5 flex-shrink-0'} />
);

const railBtnBase = 'w-[30px] h-[30px] rounded-[8px] flex items-center justify-center flex-shrink-0 transition-all';

// Desktop rail is rendered at its normal (mobile-matching) size, then
// visually scaled up 30% as a whole via CSS transform — a single knob
// that enlarges every button/icon/gap uniformly without needing to hand-
// tune a second set of size classes throughout this file and
// VCRControls.tsx. The transform doesn't affect layout sizing on its own
// (a scaled element keeps contributing its original box to its parent's
// layout), so the outer <nav> gets an explicit width equal to the scaled
// footprint instead of relying on auto-sizing — that's what makes the
// canvas area actually reflow to the enlarged rail's real visual size.
const DESKTOP_RAIL_SCALE = 1.3;
const DESKTOP_RAIL_CONTENT_W = 38; // px-1 (8px) + one 30px button
const DESKTOP_RAIL_SCALED_W = Math.round(DESKTOP_RAIL_CONTENT_W * DESKTOP_RAIL_SCALE);

/**
 * The left-edge icon rail replacing the old draggable 3-row card. Every
 * control the card used to have is here — visibility, shuffle, export,
 * transport, then the 5 panel tabs — just regrouped into one strip.
 * Vertical on desktop, wraps into a horizontal bottom bar on mobile (see
 * the isMobile-driven classes below) rather than needing two components,
 * since it's the same set of buttons either way.
 */
export const ControlRail = forwardRef<HTMLElement, ControlRailProps>(function ControlRail(props, ref) {
  const {
    isMobile, onWordmarkClick,
    setIsControlsVisible,
    handleWavClick, isWavPressed, isAutoShuffleOn, isNewPresetPending,
    autoShuffleIntervalSec, formatAutoShuffleInterval, autoShufflePopoverAnchor, setAutoShufflePopoverAnchor, openAutoShufflePopover,
    exportAsPNG, toggleGifRecording, isFinalizingGif, isRecordingGif,
    activeTab, setActiveTab, isMicActive, liveSubBassLevel, liveBassLevel, liveMidsLevel, liveTrebleLevel, audioEnergy,
  } = props;

  const tabBtnClass = (tab: TabId) =>
    `${railBtnBase} ${activeTab === tab ? 'bg-white/20 text-white' : 'text-white/90 hover:bg-white/10 hover:text-white'}`;

  // No collapsed state any more — InteractiveGradient.tsx doesn't mount
  // ControlRail/ControlDrawer at all while isControlsVisible is false, so
  // pressing H hides the entire dock (rail + drawer) outright, handing
  // that full width/height back to the canvas. The only way back is H
  // again (or the Eye button below, while visible).
  return (
    <nav
      ref={ref}
      data-role="panel"
      aria-label="wāv controls"
      style={!isMobile ? { width: DESKTOP_RAIL_SCALED_W } : undefined}
      className={
        isMobile
          // Docked flush to the bottom edge — square corners (it's the
          // screen edge, not a floating card).
          ? 'flex-shrink-0 w-full pointer-events-auto bg-black'
          // Docked flush to the left edge — full height, scrolls
          // internally if content ever exceeds the viewport height rather
          // than overflowing off-screen with no way to reach it.
          : 'flex-shrink-0 h-full pointer-events-auto bg-black overflow-y-auto overflow-x-hidden'
      }
    >
    {/* Desktop-only 1.3x scale wrapper — see DESKTOP_RAIL_SCALE comment
        above. Rendered at natural size and blown up as a whole so every
        button/icon/gap enlarges uniformly. Mobile keeps the plain
        flex-row-wrap layout it always had, just moved down one level so
        the <nav> above stays a pure sizing/background shell either way. */}
    <div
      className={
        isMobile
          ? 'flex flex-row flex-wrap items-center justify-center gap-x-1.5 gap-y-1 px-2 py-1.5'
          : 'flex flex-col items-center gap-0.5 px-1 py-2 origin-top-left'
      }
      style={!isMobile ? { transform: `scale(${DESKTOP_RAIL_SCALE})`, width: DESKTOP_RAIL_CONTENT_W } : undefined}
    >
      {/* Wordmark — click opens About. Kept a plain mark here (not the
          full liquid-glass wordmark SVG) since the rail is a slim strip,
          not a card with room for a full lockup — the SVG wordmark still
          appears once, inside the About panel itself. */}
      <button
        onClick={onWordmarkClick}
        className={`w-[30px] h-[30px] rounded-[8px] flex items-center justify-center flex-shrink-0 text-white font-black select-none ${isMobile ? '' : 'mb-0.5'}`}
        style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14 }}
        title="About wāv"
        aria-label="About wāv"
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

      <RailSep isMobile={isMobile} />

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

      <RailSep isMobile={isMobile} />

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

      <RailSep isMobile={isMobile} />

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
        setRotationDirection={props.setRotationDirection}
        toggleVCRRecording={props.toggleVCRRecording}
        handleStop={props.handleStop}
        toggleVCRPlayback={props.toggleVCRPlayback}
        isMobile={isMobile}
        isSpeedPopoverOpen={props.isSpeedPopoverOpen}
        onToggleSpeedPopover={props.onToggleSpeedPopover}
      />
    </div>
    </nav>
  );
});
