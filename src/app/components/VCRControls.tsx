import React from 'react';
import { Circle, Square, Play, Pause, FastForward, Rewind, RotateCw, RotateCcw, Camera } from 'lucide-react';

interface VCRControlsProps {
  isRecording: boolean;
  isVCRPlaying: boolean;
  isAutoMode: boolean;
  vcrRecordedFrames: unknown[];
  vcrPlaybackSpeed: number;
  rotationDirection: 'clockwise' | 'counter';
  setVcrPlaybackSpeed: (speed: number) => void;
  setRotationDirection: (dir: 'clockwise' | 'counter') => void;
  toggleVCRRecording: () => void;
  handleStop: () => void;
  toggleVCRPlayback: () => void;
  exportAsPNG: () => void;
}

const VCRControlsInner: React.FC<VCRControlsProps> = ({
  isRecording,
  isVCRPlaying,
  isAutoMode,
  vcrRecordedFrames,
  vcrPlaybackSpeed,
  rotationDirection,
  setVcrPlaybackSpeed,
  setRotationDirection,
  toggleVCRRecording,
  handleStop,
  toggleVCRPlayback,
  exportAsPNG,
}) => {
  return (
    <div className="flex items-center bg-[#2a2a4e] rounded-lg p-0.5 mb-0.5 w-full">
      {/* Camera zone — fixed width so icon is centered between left edge and divider */}
      <div className="flex items-center justify-center w-9 flex-shrink-0">
        <button
          onClick={exportAsPNG}
          className="w-7 h-7 rounded hover:bg-[#3a3a5e] text-white transition-all flex items-center justify-center"
          title="Save PNG"
        >
          <Camera className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-5 bg-white/20 flex-shrink-0"></div>

      {/* Main controls — fill remaining space, centered */}
      <div className="flex-1 flex items-center justify-around">
        <button
          onClick={toggleVCRRecording}
          className="p-1 rounded hover:bg-[#3a3a5e] text-white transition-all"
          title="Record Video"
        >
          <Circle className={`w-4 h-4 ${isRecording ? 'fill-red-500 stroke-red-500' : ''}`} />
        </button>

        <button
          onClick={handleStop}
          className="p-1 rounded hover:bg-[#3a3a5e] text-white transition-all"
          title="Stop"
        >
          <Square className="w-4 h-4" />
        </button>

        <button
          onClick={toggleVCRPlayback}
          className="p-1 rounded hover:bg-[#3a3a5e] text-white transition-all"
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
          className="p-1 rounded hover:bg-[#3a3a5e] text-white transition-all"
          title="Slower"
        >
          <Rewind className="w-4 h-4" />
        </button>

        <span className="text-xs text-white text-center">{vcrPlaybackSpeed}x</span>

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
          className="p-1 rounded hover:bg-[#3a3a5e] text-white transition-all"
          title="Faster"
        >
          <FastForward className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-white/20 flex-shrink-0"></div>

        <button
          onClick={() => setRotationDirection(rotationDirection === 'clockwise' ? 'counter' : 'clockwise')}
          className="p-1 rounded hover:bg-[#3a3a5e] text-white transition-all"
          title={rotationDirection === 'clockwise' ? 'Clockwise' : 'Counter-Clockwise'}
        >
          {rotationDirection === 'clockwise' ? <RotateCw className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

export const VCRControls = React.memo(VCRControlsInner);
