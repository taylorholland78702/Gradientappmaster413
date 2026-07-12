import React from 'react';
import { Circle, Play, Pause, FastForward, Rewind, ArrowClockwise, ArrowCounterClockwise } from '@phosphor-icons/react';
import { Divider } from './Divider';

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
  // Column width shared by all 3 groups below: N/5 of the row, minus the 2
  // dividers' combined 2px, mirroring the reference rows' own 5-equal-column
  // + fixed-1px-divider math exactly (so every vertical line lines up)
  // instead of an eyeballed flex-grow ratio. Uses an inline style rather than
  // a Tailwind arbitrary-value class built via string interpolation —
  // Tailwind's JIT scanner only picks up class names it can find literally
  // in the source, so a dynamically-constructed `basis-[calc(...)]` string
  // silently produces no CSS at all (bit us once already building this).
  const colStyle = (n: number): React.CSSProperties => ({
    flexBasis: `calc((100% - 2px) / 5 * ${n})`,
    flexGrow: 0,
    flexShrink: 0,
  });

  return (
    <div className="flex items-stretch w-full">
      {/* Cols 1-2 — under Gradient + FX. No divider between Record and
          Play/Pause; they're one group. */}
      <div style={colStyle(2)} className="flex items-center justify-between">
        <button
          onClick={toggleVCRRecording}
          disabled={isEncoding}
          className="flex-1 p-1.5 rounded hover:bg-white/15 text-white transition-all relative flex items-center justify-center"
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
          className="flex-1 p-1.5 rounded hover:bg-white/15 text-white transition-all flex items-center justify-center"
          title={(isVCRPlaying || isAutoMode ? "Pause" : (vcrRecordedFrames.length > 0 ? "Play Recording" : "Auto Play")) + " (Space)"}
          aria-label={isVCRPlaying || isAutoMode ? "Pause" : (vcrRecordedFrames.length > 0 ? "Play Recording" : "Auto Play")}
        >
          {(isVCRPlaying || isAutoMode) ? <Pause weight="regular" className="w-4 h-4" /> : <Play weight="regular" className="w-4 h-4" />}
        </button>
      </div>

      <Divider />

      {/* Cols 3-4 — under Audio + Color. The three items (<< 1x >>) cluster
          together compactly at justify-center rather than spreading
          edge-to-edge, so the whole playhead control reads as one centered
          unit spanning exactly this 2-column width. */}
      <div style={colStyle(2)} className="flex items-center justify-center gap-0.5 overflow-hidden">
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
          className="p-0.5 rounded hover:bg-white/15 text-white transition-all flex items-center justify-center"
          title="Slower ([)"
          aria-label="Slower"
        >
          <Rewind weight="regular" className="w-4 h-4" />
        </button>

        <span className="text-[10px] text-white text-center w-5">{vcrPlaybackSpeed}x</span>

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
          className="p-0.5 rounded hover:bg-white/15 text-white transition-all flex items-center justify-center"
          title="Faster (])"
          aria-label="Faster"
        >
          <FastForward weight="regular" className="w-4 h-4" />
        </button>
      </div>

      <Divider />

      {/* Col 5 — under Presets, far right */}
      <div style={colStyle(1)} className="flex items-center justify-center">
        <button
          onClick={() => setRotationDirection(rotationDirection === 'clockwise' ? 'counter' : 'clockwise')}
          className="p-1.5 rounded hover:bg-white/15 text-white transition-all flex items-center justify-center"
          title={(rotationDirection === 'clockwise' ? 'Clockwise' : 'Counter-Clockwise') + " (D)"}
          aria-label={rotationDirection === 'clockwise' ? 'Clockwise' : 'Counter-Clockwise'}
        >
          {rotationDirection === 'clockwise' ? <ArrowClockwise weight="regular" className="w-4 h-4" /> : <ArrowCounterClockwise weight="regular" className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

export const VCRControls = React.memo(VCRControlsInner);
