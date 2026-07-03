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
    <div className="flex items-center bg-black/25 rounded-lg px-1 w-full shadow-sm">
      <div className="flex-1 flex items-center justify-between">
        <button
          onClick={toggleVCRRecording}
          disabled={isEncoding}
          className="p-2 rounded hover:bg-white/15 text-white transition-all relative"
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
          className="p-2 rounded hover:bg-white/15 text-white transition-all"
          title={isVCRPlaying || isAutoMode ? "Pause" : (vcrRecordedFrames.length > 0 ? "Play Recording" : "Auto Play")}
        >
          {(isVCRPlaying || isAutoMode) ? <Pause weight="regular" className="w-4 h-4" /> : <Play weight="regular" className="w-4 h-4" />}
        </button>

        <div className="w-px h-5 bg-white/20 flex-shrink-0"></div>

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
          className="p-2 rounded hover:bg-white/15 text-white transition-all"
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
          className="p-2 rounded hover:bg-white/15 text-white transition-all"
          title="Faster"
        >
          <FastForward weight="regular" className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-white/20 flex-shrink-0"></div>

        <button
          onClick={() => setRotationDirection(rotationDirection === 'clockwise' ? 'counter' : 'clockwise')}
          className="p-2 rounded hover:bg-white/15 text-white transition-all"
          title={rotationDirection === 'clockwise' ? 'Clockwise' : 'Counter-Clockwise'}
        >
          {rotationDirection === 'clockwise' ? <ArrowClockwise weight="regular" className="w-4 h-4" /> : <ArrowCounterClockwise weight="regular" className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

export const VCRControls = React.memo(VCRControlsInner);
