import React from 'react';
import { Circle, Play, Stop } from '@phosphor-icons/react';

interface VCRControlsProps {
  isRecording: boolean;
  isVCRPlaying: boolean;
  isAutoMode: boolean;
  vcrRecordedFrames: unknown[];
  vcrPlaybackSpeed: number;
  isEncoding: boolean;
  encodingProgress: number;
  toggleVCRRecording: () => void;
  handleStop: () => void;
  toggleVCRPlayback: () => void;
  // Opens the speed popover (mirrors Auto Shuffle's popover pattern) —
  // the actual popover UI lives in InteractiveGradient.tsx, this just
  // reports the trigger button element to anchor it against.
  isSpeedPopoverOpen: boolean;
  onToggleSpeedPopover: (triggerEl: HTMLElement) => void;
  // Orients this group to match the rail it's embedded in — a vertical
  // column of rail buttons on desktop, an inline row on mobile's wrapped
  // bottom bar. The old 3-column grid this replaced only made sense
  // aligned under the tab-bar row it sat above, which no longer exists
  // now that the tab bar lives in ControlRail instead.
  isMobile: boolean;
}

const railBtnBase = 'w-[30px] h-[30px] rounded-[8px] flex items-center justify-center flex-shrink-0 transition-all';

const VCRControlsInner: React.FC<VCRControlsProps> = ({
  isRecording,
  isVCRPlaying,
  isAutoMode,
  vcrRecordedFrames,
  vcrPlaybackSpeed,
  isEncoding,
  encodingProgress,
  toggleVCRRecording,
  toggleVCRPlayback,
  isMobile,
  isSpeedPopoverOpen,
  onToggleSpeedPopover,
}) => {
  return (
    <div className={`flex items-center gap-1 ${isMobile ? 'flex-row' : 'flex-col'}`}>
      <button
        onClick={toggleVCRRecording}
        disabled={isEncoding}
        className={`${railBtnBase} hover:bg-white/15 text-white relative`}
        title={isEncoding ? `Encoding… ${encodingProgress}%` : 'Record Video (V)'}
        aria-label={isEncoding ? `Encoding, ${encodingProgress} percent` : 'Record Video'}
      >
        {isEncoding ? (
          <svg width="16" height="16" viewBox="0 0 16 16">
            {/* Track */}
            <circle cx="8" cy="8" r="6" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
            {/* Progress arc — starts at 12 o'clock, sweeps clockwise */}
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
          <Circle weight={isRecording ? 'fill' : 'regular'} className={`w-4 h-4 ${isRecording ? 'text-red-500' : ''}`} />
        )}
      </button>

      <button
        onClick={toggleVCRPlayback}
        className={`${railBtnBase} hover:bg-white/15 text-white`}
        // Was labeled "Pause" — this actually resets playback position to 0
        // and zoom to 1 (see toggleVCRPlayback in useVCRPlayback.ts), with
        // no resume-from-position, i.e. it's a Stop, not a Pause. Labeled
        // to match what it actually does rather than implying resumability
        // that doesn't exist.
        title={(isVCRPlaying || isAutoMode ? "Stop" : (vcrRecordedFrames.length > 0 ? "Play Recording" : "Auto Play")) + " (Space)"}
        aria-label={isVCRPlaying || isAutoMode ? "Stop" : (vcrRecordedFrames.length > 0 ? "Play Recording" : "Auto Play")}
      >
        {(isVCRPlaying || isAutoMode) ? <Stop weight="regular" className="w-4 h-4" /> : <Play weight="regular" className="w-4 h-4" />}
      </button>

      {/* Single trigger — opens a popover (same pattern as Auto Shuffle)
          instead of always-visible ‹/› step buttons. Text-only now (no
          Gauge icon) — the speed value itself is the whole button label. */}
      <button
        onClick={(e) => onToggleSpeedPopover(e.currentTarget)}
        className={`${railBtnBase} ${isSpeedPopoverOpen ? 'bg-white/20 text-white' : 'text-white hover:bg-white/15'} text-[10px] font-mono tabular-nums font-semibold`}
        title="Playback Speed"
        aria-label="Playback Speed settings"
        aria-pressed={isSpeedPopoverOpen}
      >
        {vcrPlaybackSpeed}x
      </button>
    </div>
  );
};

export const VCRControls = React.memo(VCRControlsInner);
