import React from 'react';
import { Circle, Play, Stop, FastForward, Rewind, ArrowClockwise, ArrowCounterClockwise } from '@phosphor-icons/react';

interface VCRControlsProps {
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
  // Orients this group to match the rail it's embedded in — a vertical
  // column of rail buttons on desktop, an inline row on mobile's wrapped
  // bottom bar. The old 3-column grid this replaced only made sense
  // aligned under the tab-bar row it sat above, which no longer exists
  // now that the tab bar lives in ControlRail instead.
  isMobile: boolean;
}

const VCRControlsInner: React.FC<VCRControlsProps> = ({
  isRecording,
  isVCRPlaying,
  isAutoMode,
  vcrRecordedFrames,
  vcrPlaybackSpeed,
  rotationDirection,
  isEncoding,
  encodingProgress,
  setVcrPlaybackSpeed,
  setRotationDirection,
  toggleVCRRecording,
  toggleVCRPlayback,
  isMobile,
}) => {
  return (
    <div className={`flex items-center gap-1 ${isMobile ? 'flex-row' : 'flex-col'}`}>
      <button
        onClick={toggleVCRRecording}
        disabled={isEncoding}
        className="w-[34px] h-[34px] rounded-[10px] hover:bg-white/15 text-white transition-all relative flex items-center justify-center flex-shrink-0"
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
        className="w-[34px] h-[34px] rounded-[10px] hover:bg-white/15 text-white transition-all flex items-center justify-center flex-shrink-0"
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

      {/* Speed pill — a stateful trio (‹ 1x ›), not a plain toggle, so it
          always renders as one fixed horizontal unit regardless of whether
          the rail around it is a vertical column or a horizontal row. */}
      <div className="flex items-center gap-0.5 bg-white/10 rounded-[9px] p-0.5 flex-shrink-0">
        <button
          onClick={() => {
            if (vcrPlaybackSpeed > 2) {
              setVcrPlaybackSpeed(vcrPlaybackSpeed - 1);
            } else if (vcrPlaybackSpeed === 2) {
              setVcrPlaybackSpeed(1);
            } else if (vcrPlaybackSpeed === 1) {
              setVcrPlaybackSpeed(0.5);
            }
          }}
          className="w-[22px] h-[26px] rounded-[7px] hover:bg-white/15 text-white transition-all flex items-center justify-center"
          title="Slower ([)"
          aria-label="Slower"
        >
          <Rewind weight="regular" className="w-3 h-3" />
        </button>

        <span className="text-[10px] text-white text-center w-6 font-mono tabular-nums">{vcrPlaybackSpeed}x</span>

        <button
          onClick={() => {
            if (vcrPlaybackSpeed >= 2) {
              setVcrPlaybackSpeed(Math.min(10, vcrPlaybackSpeed + 1));
            } else if (vcrPlaybackSpeed >= 1) {
              setVcrPlaybackSpeed(2);
            } else {
              setVcrPlaybackSpeed(1);
            }
          }}
          className="w-[22px] h-[26px] rounded-[7px] hover:bg-white/15 text-white transition-all flex items-center justify-center"
          title="Faster (])"
          aria-label="Faster"
        >
          <FastForward weight="regular" className="w-3 h-3" />
        </button>
      </div>

      <button
        onClick={() => setRotationDirection(rotationDirection === 'clockwise' ? 'counter' : 'clockwise')}
        className="w-[34px] h-[34px] rounded-[10px] hover:bg-white/15 text-white transition-all flex items-center justify-center flex-shrink-0"
        title={(rotationDirection === 'clockwise' ? 'Clockwise' : 'Counter-Clockwise') + " (D)"}
        aria-label={rotationDirection === 'clockwise' ? 'Clockwise' : 'Counter-Clockwise'}
      >
        {rotationDirection === 'clockwise' ? <ArrowClockwise weight="regular" className="w-4 h-4" /> : <ArrowCounterClockwise weight="regular" className="w-4 h-4" />}
      </button>
    </div>
  );
};

export const VCRControls = React.memo(VCRControlsInner);
