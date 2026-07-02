import React from 'react';
import { Circle, Play, Pause, FastForward, Rewind, RotateCw, RotateCcw } from 'lucide-react';

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
    <div className="flex items-center bg-white/8 backdrop-blur-sm rounded-lg px-2 py-0.5 mb-0.5 w-full">
      <div className="flex-1 flex items-center justify-between">
        <button
          onClick={toggleVCRRecording}
          disabled={isEncoding}
          className="p-1 rounded hover:bg-white/15 text-white transition-all relative"
          title={isEncoding ? `Encoding… ${encodingProgress}%` : 'Record Video'}
        >
          {isEncoding ? (
            <span className="text-[9px] font-bold text-yellow-400 leading-none">{encodingProgress}%</span>
          ) : (
            <Circle className={`w-4 h-4 ${isRecording ? 'fill-red-500 stroke-red-500' : ''}`} />
          )}
        </button>

        <button
          onClick={toggleVCRPlayback}
          className="p-1 rounded hover:bg-white/15 text-white transition-all"
          title={isVCRPlaying || isAutoMode ? "Pause" : (vcrRecordedFrames.length > 0 ? "Play Recording" : "Auto Play")}
        >
          {(isVCRPlaying || isAutoMode) ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
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
          className="p-1 rounded hover:bg-white/15 text-white transition-all"
          title="Slower"
        >
          <Rewind className="w-4 h-4" />
        </button>

        <span className="text-xs text-white text-center w-6">{vcrPlaybackSpeed}x</span>

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
          className="p-1 rounded hover:bg-white/15 text-white transition-all"
          title="Faster"
        >
          <FastForward className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-white/20 flex-shrink-0"></div>

        <button
          onClick={() => setRotationDirection(rotationDirection === 'clockwise' ? 'counter' : 'clockwise')}
          className="p-1 rounded hover:bg-white/15 text-white transition-all"
          title={rotationDirection === 'clockwise' ? 'Clockwise' : 'Counter-Clockwise'}
        >
          {rotationDirection === 'clockwise' ? <RotateCw className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

export const VCRControls = React.memo(VCRControlsInner);
