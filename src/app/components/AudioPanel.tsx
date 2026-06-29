import React from 'react';
import { ChevronDown, Mic, MicOff, Plus, SlidersHorizontal } from 'lucide-react';

interface AudioPanelProps {
  isMicActive: boolean;
  audioInputDevices: MediaDeviceInfo[];
  selectedAudioDeviceId: string;
  isAudioControlsOpen: boolean;
  masterSensitivity: number;
  bassMultiplier: number;
  midsMultiplier: number;
  trebleMultiplier: number;
  bassBeatSync: boolean;
  midsBeatSync: boolean;
  trebleBeatSync: boolean;
  liveBassLevel: number;
  liveMidsLevel: number;
  liveTrebleLevel: number;
  audioFileName: string | null;
  waveformData: number[];
  audioFileMetadata: { sampleRate: number; duration: number } | null;
  setSelectedAudioDeviceId: (id: string) => void;
  setIsAudioControlsOpen: (open: boolean) => void;
  setMasterSensitivity: (v: number) => void;
  setBassMultiplier: (v: number) => void;
  setMidsMultiplier: (v: number) => void;
  setTrebleMultiplier: (v: number) => void;
  subBassMultiplier: number;
  setSubBassMultiplier: (v: number) => void;
  subBassBeatSync: boolean;
  setSubBassBeatSync: (v: boolean) => void;
  liveSubBassLevel: number;
  setBassBeatSync: (v: boolean) => void;
  setMidsBeatSync: (v: boolean) => void;
  setTrebleBeatSync: (v: boolean) => void;
  setColorShiftHue: (v: number) => void;
  startMicVisualization: (deviceId?: string) => void;
  stopMicVisualization: () => void;
  onAudioFileClick: () => void;
}

const AudioPanelInner: React.FC<AudioPanelProps> = ({
  isMicActive,
  audioInputDevices,
  selectedAudioDeviceId,
  isAudioControlsOpen,
  masterSensitivity,
  bassMultiplier,
  midsMultiplier,
  trebleMultiplier,
  bassBeatSync,
  midsBeatSync,
  trebleBeatSync,
  liveBassLevel,
  liveMidsLevel,
  liveTrebleLevel,
  audioFileName,
  waveformData,
  audioFileMetadata,
  setSelectedAudioDeviceId,
  setIsAudioControlsOpen,
  setMasterSensitivity,
  setBassMultiplier,
  setMidsMultiplier,
  setTrebleMultiplier,
  subBassMultiplier,
  setSubBassMultiplier,
  subBassBeatSync,
  setSubBassBeatSync,
  liveSubBassLevel,
  setBassBeatSync,
  setMidsBeatSync,
  setTrebleBeatSync,
  setColorShiftHue,
  startMicVisualization,
  stopMicVisualization,
  onAudioFileClick,
}) => {
  return (
    <>
      {/* Audiovisuals Section */}
      <div className="w-full mb-0.5 flex gap-[3.5px]">
        {/* Mic button + device chevron */}
        <div className={`flex flex-1 items-center px-1.5 py-1.5 rounded-lg text-xs font-semibold shadow-lg gap-1 transition-all ${isMicActive ? 'bg-purple-500 text-white' : 'bg-white/8 backdrop-blur-sm text-white hover:bg-white/15'}`}>
          <button
            onClick={() => isMicActive ? stopMicVisualization() : startMicVisualization(selectedAudioDeviceId)}
            className="flex items-center justify-center flex-1"
            title={isMicActive ? 'Microphone ON' : 'Microphone OFF'}
          >
            {isMicActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>
          {audioInputDevices.length > 0 && (
            <div className="relative flex items-center">
              <select
                value={selectedAudioDeviceId}
                onChange={(e) => {
                  setSelectedAudioDeviceId(e.target.value);
                  if (isMicActive) {
                    stopMicVisualization();
                    setTimeout(() => startMicVisualization(e.target.value), 100);
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full"
              >
                {audioInputDevices.map(d => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Microphone ${d.deviceId.slice(0, 6)}`}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 pointer-events-none" />
            </div>
          )}
        </div>

        <button
          onClick={onAudioFileClick}
          className="px-1.5 py-1.5 rounded-lg text-xs transition-all bg-white/8 backdrop-blur-sm text-white hover:bg-white/15 font-semibold shadow-lg flex items-center gap-1"
          title="Load Audio File"
        >
          <span>Audio</span>
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => setIsAudioControlsOpen(!isAudioControlsOpen)}
          className="px-1.5 py-1.5 rounded-lg text-xs transition-all bg-white/8 backdrop-blur-sm text-white hover:bg-white/15 font-semibold shadow-lg flex items-center gap-1"
          title="Audio Controls"
        >
          <SlidersHorizontal className="w-6 h-4" />
          <ChevronDown className={`w-4 h-4 transition-transform ${isAudioControlsOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isAudioControlsOpen && (
        <div className="w-full bg-white/5 backdrop-blur-sm border border-white/8 px-3 py-2 rounded-lg mb-0.5 overflow-hidden">
          <div className="flex flex-col gap-3">

            {/* Intensity — always visible */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-white/70 whitespace-nowrap flex-shrink-0">Intensity</label>
              <input type="range" min="0.1" max="3" step="0.05" value={masterSensitivity} onChange={(e) => setMasterSensitivity(Number(e.target.value))} className="flex-1 min-w-0" />
              <span className="text-xs text-white/50 w-6 text-right flex-shrink-0">{masterSensitivity.toFixed(1)}</span>
            </div>

            <div className="flex gap-2 items-start overflow-hidden">

                {/* Shape = Bass */}
                <div className="flex flex-col items-center gap-1.5 w-0 flex-1 min-w-0 rounded-lg p-2 bg-white/5">
                  <div className="w-full relative">
                    <div className="w-full bg-white/8 rounded overflow-hidden" style={{height: '40px'}}>
                      <div className="w-full rounded transition-none absolute bottom-0" style={{height: `${Math.min(100, liveBassLevel * 100)}%`, background: `linear-gradient(to top, #eab308, #a855f7)`}} />
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-white/80">Shape</span>
                  <input type="range" min="0" max="2" step="0.1" value={bassMultiplier} onChange={(e) => setBassMultiplier(Number(e.target.value))} className="w-full" />
                  <button onClick={() => setBassBeatSync(!bassBeatSync)} className={`w-full py-0.5 rounded text-[9px] font-bold transition-all ${bassBeatSync ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white/40 hover:bg-white/20 hover:text-white/60'}`}>BEAT</button>
                </div>

                {/* Motion = Mids */}
                <div className="flex flex-col items-center gap-1.5 w-0 flex-1 min-w-0 rounded-lg p-2 bg-white/5">
                  <div className="w-full relative">
                    <div className="w-full bg-white/8 rounded overflow-hidden" style={{height: '40px'}}>
                      <div className="w-full rounded transition-none absolute bottom-0" style={{height: `${Math.min(100, liveMidsLevel * 100)}%`, background: `linear-gradient(to top, #eab308, #a855f7)`}} />
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-white/80">Motion</span>
                  <input type="range" min="0" max="2" step="0.1" value={midsMultiplier} onChange={(e) => setMidsMultiplier(Number(e.target.value))} className="w-full" />
                  <button onClick={() => setMidsBeatSync(!midsBeatSync)} className={`w-full py-0.5 rounded text-[9px] font-bold transition-all ${midsBeatSync ? 'bg-yellow-500 text-black' : 'bg-white/8 backdrop-blur-sm text-white/40 hover:text-white/70'}`}>BEAT</button>
                </div>

                {/* Color = Treble */}
                <div className="flex flex-col items-center gap-1.5 w-0 flex-1 min-w-0 rounded-lg p-2 bg-white/5">
                  <div className="w-full relative">
                    <div className="w-full bg-white/8 rounded overflow-hidden" style={{height: '40px'}}>
                      <div className="w-full rounded transition-none absolute bottom-0" style={{height: `${Math.min(100, liveTrebleLevel * 100)}%`, background: `linear-gradient(to top, #eab308, #a855f7)`}} />
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-white/80">Color</span>
                  <input type="range" min="0" max="2" step="0.1" value={trebleMultiplier} onChange={(e) => { const v = Number(e.target.value); setTrebleMultiplier(v); setColorShiftHue(Math.round(v * 127.5)); }} className="w-full" />
                  <button onClick={() => setTrebleBeatSync(!trebleBeatSync)} className={`w-full py-0.5 rounded text-[9px] font-bold transition-all ${trebleBeatSync ? 'bg-yellow-500 text-black' : 'bg-white/8 backdrop-blur-sm text-white/40 hover:text-white/70'}`}>BEAT</button>
                </div>

                {/* Pulse = Sub-bass */}
                <div className="flex flex-col items-center gap-1.5 w-0 flex-1 min-w-0 rounded-lg p-2 bg-white/5">
                  <div className="w-full relative">
                    <div className="w-full bg-white/8 rounded overflow-hidden" style={{height: '40px'}}>
                      <div className="w-full rounded transition-none absolute bottom-0" style={{height: `${Math.min(100, liveSubBassLevel * 100)}%`, background: `linear-gradient(to top, #eab308, #a855f7)`}} />
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-white/80">Pulse</span>
                  <input type="range" min="0" max="2" step="0.1" value={subBassMultiplier} onChange={(e) => setSubBassMultiplier(Number(e.target.value))} className="w-full" />
                  <button onClick={() => setSubBassBeatSync(!subBassBeatSync)} className={`w-full py-0.5 rounded text-[9px] font-bold transition-all ${subBassBeatSync ? 'bg-yellow-500 text-black' : 'bg-white/8 backdrop-blur-sm text-white/40 hover:text-white/70'}`}>BEAT</button>
                </div>
              </div>
          </div>
        </div>
      )}

      {/* Audio Waveform Display - shown when audio file is loaded */}
      {audioFileName && waveformData.length > 0 && (
        <div className="w-full mb-0.5 bg-white/5 backdrop-blur-sm rounded-lg px-1.5 py-3">
          {/* Waveform Visualization */}
          <div className="w-full h-5 mb-0.5 flex items-center justify-between gap-0.5 relative">
            {/* Center line */}
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-px bg-white/20"></div>
            </div>
            {waveformData.map((amplitude, index) => {
              const height = Math.max(1, amplitude * 17.5);
              const hue = (index / waveformData.length) * 360;
              return (
                <div
                  key={index}
                  className="flex-1 relative flex items-center justify-center"
                >
                  <div
                    className="w-full rounded-sm"
                    style={{
                      height: `${height}px`,
                      background: `linear-gradient(to top, hsl(${hue}, 80%, 60%), hsl(${hue}, 90%, 70%))`,
                      opacity: 0.8
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Audio File Info */}
          <div className="flex items-center justify-between gap-1">
            <div className="flex-1 min-w-0">
              <div className="text-white text-[9px] font-semibold truncate leading-tight">
                {audioFileName}
              </div>
              {audioFileMetadata && (
                <div className="text-white/60 text-[8px] leading-tight">
                  {(audioFileMetadata.sampleRate / 1000).toFixed(1)} kHz • {Math.floor(audioFileMetadata.duration / 60)}:{String(Math.floor(audioFileMetadata.duration % 60)).padStart(2, '0')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const AudioPanel = React.memo(AudioPanelInner);
