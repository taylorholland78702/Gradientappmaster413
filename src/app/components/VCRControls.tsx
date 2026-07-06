import React from 'react';
import { Circle, Play, Pause, FastForward, Rewind, ArrowClockwise, ArrowCounterClockwise } from '@phosphor-icons/react';

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
}) => {
  return (
    <div className="flex items-stretch bg-black/25 rounded-lg w-full shadow-sm">
      {/* Group 1 — widened slightly so the divider after it lines up with the
          dividers in the rows above/below (Group 2's <<1x>> cluster had extra
          breathing room, pushing this boundary too far left). */}
      <div className="flex-[2.12] flex items-center justify-between">
        <button
          onClick={toggleVCRRecording}
          disabled={isEncoding}
          className="flex-1 p-2 rounded hover:bg-white/15 text-white transition-all relative flex items-center justify-center"
          title={isEncoding ? `Encoding… ${encodingProgress}%` : 'Record Video'}
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
          className="flex-1 p-2 rounded hover:bg-white/15 text-white transition-all flex items-center justify-center"
          title={isVCRPlaying || isAutoMode ? "Pause" : (vcrRecordedFrames.length > 0 ? "Play Recording" : "Auto Play")}
        >
          {(isVCRPlaying || isAutoMode) ? <Pause weight="regular" className="w-4 h-4" /> : <Play weight="regular" className="w-4 h-4" />}
        </button>
      </div>

      <div className="w-px self-stretch bg-white/20 flex-shrink-0"></div>

      {/* Group 2 — narrowed to give that space to Group 1 above, tightening
          the <<1x>> cluster's internal breathing room. */}
      <div className="flex-[1.88] flex items-center justify-between px-0.5">
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
          className="p-1.5 rounded hover:bg-white/15 text-white transition-all flex items-center justify-center"
          title="Slower"
        >
          <Rewind weight="regular" className="w-4 h-4" />
        </button>

        <span className="text-[10px] text-white text-center w-6">{vcrPlaybackSpeed}x</span>

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
          className="p-1.5 rounded hover:bg-white/15 text-white transition-all flex items-center justify-center"
          title="Faster"
        >
          <FastForward weight="regular" className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px self-stretch bg-white/20 flex-shrink-0"></div>

      {/* Group 3 (1/5 width) */}
      <div className="flex-1 flex items-center justify-center">
        <button
          onClick={() => setRotationDirection(rotationDirection === 'clockwise' ? 'counter' : 'clockwise')}
          className="p-2 rounded hover:bg-white/15 text-white transition-all flex items-center justify-center"
          title={rotationDirection === 'clockwise' ? 'Clockwise' : 'Counter-Clockwise'}
        >
          {rotationDirection === 'clockwise' ? <ArrowClockwise weight="regular" className="w-4 h-4" /> : <ArrowCounterClockwise weight="regular" className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

export const VCRControls = React.memo(VCRControlsInner);
