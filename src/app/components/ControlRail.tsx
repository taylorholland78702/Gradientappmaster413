import React, { forwardRef } from 'react';
import {
  Shuffle, Infinity as InfinityIcon, Camera, Gif, Circle,
  Gradient, MagicWand, SpeakerHigh, Palette, FloppyDisk,
} from '@phosphor-icons/react';

type TabId = 'gradients' | 'effects' | 'audio' | 'color' | 'presets';

export interface ControlRailProps {
  isMobile: boolean;

  // Wordmark — click opens About. No drag handle any more: the rail is a
  // fixed docked sidebar (left edge on desktop, bottom edge on mobile),
  // not a repositionable floating panel.
  onWordmarkClick?: () => void;

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

  // Video recording
  isRecording: boolean;
  isEncoding: boolean;
  encodingProgress: number;
  toggleVCRRecording: () => void;
}

// Short centered hairline between rail groups — a vertical pipe on mobile's
// horizontal wrapped bar, a horizontal line on desktop's vertical column
// (each orthogonal to the axis the buttons are stacked along).
const RailSep: React.FC<{ isMobile?: boolean }> = ({ isMobile }) => (
  <div className={isMobile ? 'w-px h-5 bg-white mx-0.5 flex-shrink-0' : 'w-5 h-px bg-white my-0.5 flex-shrink-0'} />
);

const railBtnBase = 'w-[30px] h-[30px] rounded-[8px] flex items-center justify-center flex-shrink-0 transition-all';

// Desktop rail is rendered at its normal (mobile-matching) size, then
// visually scaled up 30% as a whole via CSS transform — a single knob
// that enlarges every button/icon/gap uniformly without needing to hand-
// tune a second set of size classes throughout this file. The transform
// doesn't affect layout sizing on its own
// (a scaled element keeps contributing its original box to its parent's
// layout), so the outer <nav> gets an explicit width equal to the scaled
// footprint instead of relying on auto-sizing — that's what makes the
// canvas area actually reflow to the enlarged rail's real visual size.
const DESKTOP_RAIL_SCALE = 1.3;
const DESKTOP_RAIL_CONTENT_W = 38; // px-1 (8px) + one 30px button
const DESKTOP_RAIL_SCALED_W = Math.round(DESKTOP_RAIL_CONTENT_W * DESKTOP_RAIL_SCALE);
// Desktop wordmark box height (pre-scale px) — also used by ControlDrawer's
// header row so the two share this exact number and their vertical centers
// land at the same Y (see the wordmark button's own comment for why).
export const WORDMARK_BOX_H = 91;

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
    handleWavClick, isWavPressed, isAutoShuffleOn, isNewPresetPending,
    autoShuffleIntervalSec, formatAutoShuffleInterval, autoShufflePopoverAnchor, setAutoShufflePopoverAnchor, openAutoShufflePopover,
    exportAsPNG, toggleGifRecording, isFinalizingGif, isRecordingGif,
    activeTab, setActiveTab, isMicActive, liveSubBassLevel, liveBassLevel, liveMidsLevel, liveTrebleLevel, audioEnergy,
    isRecording, isEncoding, encodingProgress, toggleVCRRecording,
  } = props;

  const tabBtnClass = (tab: TabId) =>
    `${railBtnBase} ${activeTab === tab ? 'bg-white/20 text-white' : 'text-white/90 hover:bg-white/10 hover:text-white'}`;

  // Mobile icons are 20% larger than desktop's (23px vs 19px) — set
  // independently rather than scaling together, since desktop already
  // gets its own separate 1.3x whole-rail transform.
  const iconCls = isMobile ? 'w-[18px] h-[18px]' : 'w-[19px] h-[19px]';

  // Audio-reactive pulse on the wordmark button — same live levels already
  // driving the mic icon's color above, reused here as a scale multiplier
  // instead. Only active while a mic is actually feeding in; sits at rest
  // (1) otherwise so the mark doesn't idle-jitter with no audio driving it.
  // Read through a CSS custom property rather than an inline `transform`
  // directly — see the .wav-wordmark comment in index.css for why that
  // split is what makes the separate :active press-bounce visible at all.
  const wordmarkAudioLevel = isMicActive
    ? Math.max(liveSubBassLevel, liveBassLevel, liveMidsLevel, liveTrebleLevel, audioEnergy)
    : 0;
  const wordmarkAudioScale = 1 + Math.min(1, wordmarkAudioLevel) * 0.12;

  // No collapsed state any more — InteractiveGradient.tsx doesn't mount
  // ControlRail/ControlDrawer at all while isControlsVisible is false, so
  // pressing H hides the entire dock (rail + drawer) outright, handing
  // that full width/height back to the canvas. No in-rail button for this
  // any more either (H is the only way, both to hide and to bring it
  // back) — see the InteractiveGradient.tsx keydown handler.
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
          : 'flex flex-col items-center gap-2 px-1 pt-0.5 pb-2 origin-top-left'
      }
      style={!isMobile ? { transform: `scale(${DESKTOP_RAIL_SCALE})`, width: DESKTOP_RAIL_CONTENT_W } : undefined}
    >
      {/* Wordmark — click opens About. Stacked w/ā/v (rather than the
          single "w" this used to show) since the rail is a slim strip with
          more room to spare vertically than horizontally — the SVG
          wordmark still appears once, inside the About panel itself.
          Fixed height (WORDMARK_BOX_H, matching ControlDrawer's header)
          so its vertical center lines up with the drawer's own tab-label
          text next to it — both sit under the same top inset (this
          button under the rail's own py-2, the header under its own
          matching pt-2) and share this same box height, so their centers
          land at the same Y without needing to measure anything at
          runtime. */}
      <button
        onClick={onWordmarkClick}
        className={`wav-wordmark rounded-[8px] flex flex-col items-center justify-center flex-shrink-0 text-white font-black select-none leading-none ${isMobile ? 'h-[30px] px-2' : 'w-[30px] mb-0.5'}`}
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: isMobile ? 24 : 30,
          height: isMobile ? undefined : WORDMARK_BOX_H,
          // Audio pulse scale, read by the .wav-wordmark rule in index.css
          // (which also layers the :active press-bounce on top via calc()
          // — see that rule's comment for why it has to be a custom
          // property instead of a plain inline `transform`).
          '--wav-audio-scale': wordmarkAudioScale,
        } as React.CSSProperties}
        title="About wāv"
        aria-label="About wāv"
      >
        {isMobile ? (
          // Wrapped so the a-macron/v pair can be pulled a little closer
          // together, same idea as the desktop stack's per-character
          // spacing control, just horizontal instead of vertical. Each
          // letter also gets its own staggered drop-in on mount (see
          // .wav-letter-reveal in index.css).
          <span style={{ whiteSpace: 'nowrap' }}>
            <span className="wav-letter-reveal" style={{ animationDelay: '0ms' }}>w</span>
            <span className="wav-letter-reveal" style={{ marginLeft: -1, animationDelay: '80ms' }}>ā</span>
            <span className="wav-letter-reveal" style={{ marginLeft: -1, animationDelay: '160ms' }}>v</span>
          </span>
        ) : (
          // Explicit lineHeight on each line (rather than relying on the
          // font's own metrics) — "ā"'s macron gives it a taller natural
          // glyph box than the plain "w"/"v", which without this made the
          // 3-line stack's spacing visibly uneven between rows. Leading is
          // deliberately asymmetric: looser between w/ā, tighter between
          // ā/v, rather than one uniform gap throughout. Same staggered
          // drop-in as mobile, top to bottom.
          <>
            <span className="wav-letter-reveal" style={{ display: 'block', lineHeight: '29px', animationDelay: '0ms' }}>w</span>
            <span className="wav-letter-reveal" style={{ display: 'block', lineHeight: '29px', marginTop: -5, animationDelay: '80ms' }}>ā</span>
            <span className="wav-letter-reveal" style={{ display: 'block', lineHeight: '29px', marginTop: -11, animationDelay: '160ms' }}>v</span>
          </>
        )}
        </button>

      {isMobile && <RailSep isMobile={isMobile} />}

      <button
        onClick={handleWavClick}
        className={`${railBtnBase} ${isWavPressed ? 'bg-white/20 text-white' : 'text-white hover:bg-white/15'}`}
        title="Shuffle (Shift+W)"
        aria-label="Shuffle to a new look"
      >
        <Shuffle weight="regular" className={iconCls} />
      </button>
      <button
        onClick={(e) => autoShufflePopoverAnchor ? setAutoShufflePopoverAnchor(null) : openAutoShufflePopover(e.currentTarget)}
        className={`${railBtnBase} ${isAutoShuffleOn ? 'bg-white/20 text-white' : 'text-white hover:bg-white/15'} ${isNewPresetPending ? 'opacity-40 pointer-events-none' : ''}`}
        title={`Auto Shuffle — remix every ${formatAutoShuffleInterval(autoShuffleIntervalSec)} (⌥⇧W)`}
        aria-label="Auto Shuffle settings"
        aria-pressed={isAutoShuffleOn}
        disabled={isNewPresetPending}
      >
        <InfinityIcon weight="regular" className={iconCls} />
      </button>

      <RailSep isMobile={isMobile} />

      <button onClick={() => setActiveTab(activeTab === 'gradients' ? null : 'gradients')} title="Gradient (G)" aria-label="Gradient tab" className={tabBtnClass('gradients')}>
        <Gradient weight="regular" className={iconCls} />
      </button>
      <button onClick={() => setActiveTab(activeTab === 'effects' ? null : 'effects')} title="Effects (F)" aria-label="Effects tab" className={tabBtnClass('effects')}>
        <MagicWand weight="regular" className={iconCls} />
      </button>
      <button onClick={() => setActiveTab(activeTab === 'audio' ? null : 'audio')} title="Audio (A)" aria-label="Audio tab" className={tabBtnClass('audio')}>
        <SpeakerHigh
          weight="regular"
          // Was `wav-audio-signal-ok`/`-none` — those classes only ever
          // applied color via a `.control-panel` ancestor selector, and no
          // element in the tree carries that class any more (dropped along
          // with the old light-theme panel this component replaced), so
          // this silently did nothing. Plain Tailwind classes here instead.
          className={`${iconCls} transition-colors ${isMicActive
            ? (Math.max(liveSubBassLevel, liveBassLevel, liveMidsLevel, liveTrebleLevel, audioEnergy) > 0.04 ? 'text-green-500' : 'text-red-500')
            : ''}`}
        />
      </button>
      <button onClick={() => setActiveTab(activeTab === 'color' ? null : 'color')} title="Color (C)" aria-label="Color tab" className={tabBtnClass('color')}>
        <Palette weight="regular" className={iconCls} />
      </button>
      <button onClick={() => setActiveTab(activeTab === 'presets' ? null : 'presets')} title="Presets (P)" aria-label="Presets tab" className={tabBtnClass('presets')}>
        <FloppyDisk weight="regular" className={iconCls} />
      </button>

      {/* Mobile: force a row break here instead of a divider — the icon
          bar splits into two rows between Presets and Record on mobile
          only; desktop keeps its usual vertical-column hairline. */}
      {isMobile ? <div className="basis-full h-0" /> : <RailSep isMobile={isMobile} />}

      {/* Record Video — moved ahead of Save PNG/Record GIF (was in a
          separate VCRControls sub-component alongside the now-removed
          Play/Stop and Playback Speed buttons; with just this one button
          left there, it's simpler inlined here directly). */}
      <button
        onClick={toggleVCRRecording}
        disabled={isEncoding}
        className={`${railBtnBase} text-white hover:bg-white/15 relative`}
        title={isEncoding ? `Encoding… ${encodingProgress}%` : 'Record Video (V)'}
        aria-label={isEncoding ? `Encoding, ${encodingProgress} percent` : 'Record Video'}
      >
        {isEncoding ? (
          <svg width="19" height="19" viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="6" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
            <circle
              cx="8" cy="8" r="6"
              fill="none"
              stroke="#facc15"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray={`${(encodingProgress / 100) * 37.7} 37.7`}
              transform="rotate(-90 8 8)"
            />
          </svg>
        ) : (
          <Circle weight={isRecording ? 'fill' : 'regular'} className={`${iconCls} ${isRecording ? 'text-red-500' : ''}`} />
        )}
      </button>
      <button
        onClick={exportAsPNG}
        className={`${railBtnBase} text-white hover:bg-white/15`}
        title="Save PNG (S)"
        aria-label="Save PNG"
      >
        <Camera weight="regular" className={iconCls} />
      </button>
      <button
        onClick={toggleGifRecording}
        disabled={isFinalizingGif}
        className={`${railBtnBase} text-white hover:bg-white/15 relative`}
        title={isFinalizingGif ? 'Finalizing GIF…' : isRecordingGif ? 'Stop GIF recording (click to finish)' : 'Record GIF (Shift+S)'}
        aria-label={isFinalizingGif ? 'Finalizing GIF' : isRecordingGif ? 'Stop GIF recording' : 'Record GIF'}
      >
        {isFinalizingGif ? (
          <svg width="19" height="19" viewBox="0 0 16 16" className="animate-spin">
            <circle cx="8" cy="8" r="6" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
            <path d="M8 2 A6 6 0 0 1 14 8" fill="none" stroke="#facc15" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ) : isRecordingGif ? (
          <Circle weight="fill" className={`${iconCls} text-red-500 animate-pulse`} />
        ) : (
          <Gif weight="regular" className={iconCls} />
        )}
      </button>
    </div>
    </nav>
  );
});
