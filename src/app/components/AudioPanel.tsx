import React from 'react';
import { CaretDown, Plus, SlidersHorizontal, Microphone, MicrophoneSlash, Shuffle } from '@phosphor-icons/react';

export interface AudioPanelState {
  isMicActive: boolean;
  audioInputDevices: MediaDeviceInfo[];
  selectedAudioDeviceId: string;
  isAudioControlsOpen: boolean;
  masterSensitivity: number;
  autoGainEnabled: boolean;
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
  subBassMultiplier: number;
  subBassBeatSync: boolean;
  liveSubBassLevel: number;
  zoomBeatEnabled: boolean;
  shakeBeatEnabled: boolean;
  contrastBeatEnabled: boolean;
  paletteBeatEnabled: boolean;
}

export interface AudioPanelActions {
  setSelectedAudioDeviceId: (id: string) => void;
  setIsAudioControlsOpen: (open: boolean) => void;
  setMasterSensitivity: (v: number) => void;
  setAutoGainEnabled: (v: boolean) => void;
  setBassMultiplier: (v: number) => void;
  setMidsMultiplier: (v: number) => void;
  setTrebleMultiplier: (v: number) => void;
  setSubBassMultiplier: (v: number) => void;
  setSubBassBeatSync: (v: boolean) => void;
  setBassBeatSync: (v: boolean) => void;
  setMidsBeatSync: (v: boolean) => void;
  setTrebleBeatSync: (v: boolean) => void;
  startMicVisualization: (deviceId?: string) => void;
  stopMicVisualization: () => void;
  onAudioFileClick: () => void;
  setZoomBeatEnabled: (v: boolean) => void;
  setShakeBeatEnabled: (v: boolean) => void;
  setContrastBeatEnabled: (v: boolean) => void;
  setPaletteBeatEnabled: (v: boolean) => void;
  onShuffleAudio: () => void;
}

interface AudioPanelProps {
  state: AudioPanelState;
  actions: AudioPanelActions;
}

const BEAT_BTN = (active: boolean) =>
  `flex-1 py-0.5 rounded text-[9px] font-bold transition-all ${active ? 'bg-white/30 text-white beat-active' : 'bg-black/25 text-white hover:bg-white/15'}`;

const AudioPanelInner: React.FC<AudioPanelProps> = ({ state, actions }) => {
  const {
    isMicActive, audioInputDevices, selectedAudioDeviceId, isAudioControlsOpen,
    masterSensitivity, autoGainEnabled, bassMultiplier, midsMultiplier, trebleMultiplier,
    bassBeatSync, midsBeatSync, trebleBeatSync,
    liveBassLevel, liveMidsLevel, liveTrebleLevel,
    audioFileName, waveformData, audioFileMetadata,
    subBassMultiplier, subBassBeatSync, liveSubBassLevel,
    zoomBeatEnabled, shakeBeatEnabled, contrastBeatEnabled, paletteBeatEnabled,
  } = state;

  const {
    setSelectedAudioDeviceId, setIsAudioControlsOpen,
    setMasterSensitivity, setAutoGainEnabled, setBassMultiplier, setMidsMultiplier, setTrebleMultiplier,
    setSubBassMultiplier, setSubBassBeatSync,
    setBassBeatSync, setMidsBeatSync, setTrebleBeatSync,
    startMicVisualization, stopMicVisualization, onAudioFileClick,
    setZoomBeatEnabled, setShakeBeatEnabled, setContrastBeatEnabled, setPaletteBeatEnabled,
    onShuffleAudio,
  } = actions;

  return (
    <>
      {/* Audiovisuals Section — single pill */}
      <div className="w-full flex">
        <div className="flex items-center justify-between flex-1 bg-black/25 rounded-lg shadow-sm overflow-hidden">
          {/* Mic on/off */}
          <button
            onClick={() => {
              if (isMicActive) stopMicVisualization();
              else startMicVisualization(selectedAudioDeviceId);
            }}
            className={`flex-1 px-2 py-1 text-xs font-semibold transition-all flex items-center justify-center ${isMicActive ? 'bg-white/30 text-white' : 'text-white hover:bg-white/15'}`}
            title={isMicActive ? 'Turn Mic Off' : 'Turn Mic On'}
          >
            {isMicActive ? <Microphone weight="regular" className="w-4 h-4" /> : <MicrophoneSlash weight="regular" className="w-4 h-4" />}
          </button>
          <div className="w-px h-4 bg-white/20 flex-shrink-0" />
          {/* Device dropdown */}
          <div className="relative flex items-center px-2 py-1 text-white hover:bg-white/15 transition-all flex-1 justify-center">
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
            <CaretDown weight="regular" className="w-4 h-4 pointer-events-none" />
          </div>
          <div className="w-px h-4 bg-white/20 flex-shrink-0" />
          {/* Upload */}
          <button
            onClick={onAudioFileClick}
            className="flex-1 px-2 py-1 text-xs font-semibold transition-all text-white hover:bg-white/15 flex items-center justify-center"
            title="Load Audio File"
          >
            <Plus weight="regular" className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-white/20 flex-shrink-0" />
          {/* Parameters toggle */}
          <button
            onClick={() => setIsAudioControlsOpen(!isAudioControlsOpen)}
            className="flex-1 px-2 py-1 text-xs font-semibold transition-all text-white hover:bg-white/15 flex items-center justify-center gap-1"
            title="Audio Parameters"
          >
            <SlidersHorizontal weight="regular" className="w-4 h-4 flex-shrink-0" />
            <CaretDown weight="regular" className={`w-4 h-4 transition-transform flex-shrink-0 ${isAudioControlsOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {isAudioControlsOpen && (
        <div className="w-full bg-black/20 border border-white/8 px-3 py-2 rounded-lg overflow-hidden">
          <div className="flex flex-col gap-1.5">

            {/* Intensity + Auto Gain */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-white whitespace-nowrap flex-shrink-0">Intensity</label>
              <input type="range" min="0.1" max="3" step="0.05" value={masterSensitivity} onChange={(e) => setMasterSensitivity(Number(e.target.value))} className="flex-1 min-w-0" />
              <span className="text-[10px] text-white w-6 text-right flex-shrink-0">{masterSensitivity.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-white whitespace-nowrap flex-shrink-0" title="Normalizes each band against its own recent loudness instead of a fixed scale, so quiet passages still register and loud ones don't just max out">Auto Gain</label>
              <button
                onClick={() => setAutoGainEnabled(!autoGainEnabled)}
                className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${autoGainEnabled ? 'bg-white/30 text-white' : 'bg-black/25 text-white hover:bg-white/15'}`}
              >{autoGainEnabled ? 'ON' : 'OFF'}</button>
              <button
                onClick={onShuffleAudio}
                className="ml-auto p-1 rounded bg-black/25 text-white hover:bg-white/15 transition-all flex items-center justify-center"
                title="Shuffle Audio Controls — randomizes Intensity, band sliders, BEAT, and FX on Beat"
              >
                <Shuffle weight="regular" className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Band column headers — titles show the actual Hz range each band listens to */}
            <div className="flex gap-2">
              <div className="w-0 flex-1 min-w-0 text-center text-[9px] font-bold uppercase tracking-wider text-white/50" title="~20-60Hz — kick drum fundamental">Sub</div>
              <div className="w-0 flex-1 min-w-0 text-center text-[9px] font-bold uppercase tracking-wider text-white/50" title="~60-250Hz">Bass</div>
              <div className="w-0 flex-1 min-w-0 text-center text-[9px] font-bold uppercase tracking-wider text-white/50" title="~250Hz-2kHz">Mids</div>
              <div className="w-0 flex-1 min-w-0 text-center text-[9px] font-bold uppercase tracking-wider text-white/50" title="~2-8kHz — hi-hats, snare crack, presence">Treble</div>
            </div>

            {/* Band columns — Sub / Bass / Mids / Treble */}
            <div className="flex gap-2 items-start overflow-hidden">

              {/* Sub-bass */}
              <div className="flex flex-col items-center gap-1 w-0 flex-1 min-w-0 rounded-lg px-2 pt-1.5 pb-2 bg-black/20">
                <div className="flex gap-1.5 w-full" style={{height: '60px'}}>
                  <div className="flex-1 relative rounded overflow-hidden bg-white/8">
                    <div className="w-full absolute bottom-0 rounded transition-none" style={{height: `${Math.min(100, liveSubBassLevel * 100)}%`, background: 'linear-gradient(to top, #eab308, #a855f7)'}} />
                  </div>
                  <div style={{width: '16px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'visible'}}>
                    <input type="range" min="0" max="5" step="0.1" value={subBassMultiplier} onChange={(e) => setSubBassMultiplier(Number(e.target.value))} style={{width: '60px', height: '16px', transform: 'rotate(-90deg)', cursor: 'pointer'}} />
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-white/60">Shape</span>
                <button onClick={() => setSubBassBeatSync(!subBassBeatSync)} className={`w-full py-0.5 rounded text-[9px] font-bold transition-all ${subBassBeatSync ? 'bg-white/30 text-white beat-active' : 'bg-black/25 text-white hover:bg-white/15'}`}>BEAT</button>
              </div>

              {/* Bass */}
              <div className="flex flex-col items-center gap-1 w-0 flex-1 min-w-0 rounded-lg px-2 pt-1.5 pb-2 bg-black/20">
                <div className="flex gap-1.5 w-full" style={{height: '60px'}}>
                  <div className="flex-1 relative rounded overflow-hidden bg-white/8">
                    <div className="w-full absolute bottom-0 rounded transition-none" style={{height: `${Math.min(100, liveBassLevel * 100)}%`, background: 'linear-gradient(to top, #eab308, #a855f7)'}} />
                  </div>
                  <div style={{width: '16px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'visible'}}>
                    <input type="range" min="0" max="5" step="0.1" value={bassMultiplier} onChange={(e) => setBassMultiplier(Number(e.target.value))} style={{width: '60px', height: '16px', transform: 'rotate(-90deg)', cursor: 'pointer'}} />
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-white/60">Pulse</span>
                <button onClick={() => setBassBeatSync(!bassBeatSync)} className={`w-full py-0.5 rounded text-[9px] font-bold transition-all ${bassBeatSync ? 'bg-white/30 text-white beat-active' : 'bg-black/25 text-white hover:bg-white/15'}`}>BEAT</button>
              </div>

              {/* Mids */}
              <div className="flex flex-col items-center gap-1 w-0 flex-1 min-w-0 rounded-lg px-2 pt-1.5 pb-2 bg-black/20">
                <div className="flex gap-1.5 w-full" style={{height: '60px'}}>
                  <div className="flex-1 relative rounded overflow-hidden bg-white/8">
                    <div className="w-full absolute bottom-0 rounded transition-none" style={{height: `${Math.min(100, liveMidsLevel * 100)}%`, background: 'linear-gradient(to top, #eab308, #a855f7)'}} />
                  </div>
                  <div style={{width: '16px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'visible'}}>
                    <input type="range" min="0" max="5" step="0.1" value={midsMultiplier} onChange={(e) => setMidsMultiplier(Number(e.target.value))} style={{width: '60px', height: '16px', transform: 'rotate(-90deg)', cursor: 'pointer'}} />
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-white/60">Motion</span>
                <button onClick={() => setMidsBeatSync(!midsBeatSync)} className={`w-full py-0.5 rounded text-[9px] font-bold transition-all ${midsBeatSync ? 'bg-white/30 text-white beat-active' : 'bg-black/25 text-white hover:bg-white/15'}`}>BEAT</button>
              </div>

              {/* Treble */}
              <div className="flex flex-col items-center gap-1 w-0 flex-1 min-w-0 rounded-lg px-2 pt-1.5 pb-2 bg-black/20">
                <div className="flex gap-1.5 w-full" style={{height: '60px'}}>
                  <div className="flex-1 relative rounded overflow-hidden bg-white/8">
                    <div className="w-full absolute bottom-0 rounded transition-none" style={{height: `${Math.min(100, liveTrebleLevel * 100)}%`, background: 'linear-gradient(to top, #eab308, #a855f7)'}} />
                  </div>
                  <div style={{width: '16px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'visible'}}>
                    <input type="range" min="0" max="5" step="0.1" value={trebleMultiplier} onChange={(e) => setTrebleMultiplier(Number(e.target.value))} style={{width: '60px', height: '16px', transform: 'rotate(-90deg)', cursor: 'pointer'}} />
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-white/60">Color</span>
                <button onClick={() => setTrebleBeatSync(!trebleBeatSync)} className={`w-full py-0.5 rounded text-[9px] font-bold transition-all ${trebleBeatSync ? 'bg-white/30 text-white beat-active' : 'bg-black/25 text-white hover:bg-white/15'}`}>BEAT</button>
              </div>
            </div>

            {/* FX on Beat row */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-white/50 font-bold uppercase tracking-wider">FX on Beat</span>
              <div className="flex gap-1.5">
                <button onClick={() => setZoomBeatEnabled(!zoomBeatEnabled)} className={BEAT_BTN(zoomBeatEnabled)}>ZOOM</button>
                <button onClick={() => setShakeBeatEnabled(!shakeBeatEnabled)} className={BEAT_BTN(shakeBeatEnabled)}>SHAKE</button>
                <button onClick={() => setContrastBeatEnabled(!contrastBeatEnabled)} className={BEAT_BTN(contrastBeatEnabled)}>CONTRAST</button>
                <button onClick={() => setPaletteBeatEnabled(!paletteBeatEnabled)} className={BEAT_BTN(paletteBeatEnabled)}>PALETTE</button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Audio Waveform Display */}
      {audioFileName && waveformData.length > 0 && (
        <div className="w-full bg-black/20 rounded-lg px-1.5 py-3">
          <div className="w-full h-5 mb-0.5 flex items-center justify-between gap-0.5 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-px bg-white/20"></div>
            </div>
            {waveformData.map((amplitude, index) => {
              const height = Math.max(1, amplitude * 17.5);
              const hue = (index / waveformData.length) * 360;
              return (
                <div key={index} className="flex-1 relative flex items-center justify-center">
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
          <div className="flex items-center justify-between gap-1">
            <div className="flex-1 min-w-0">
              <div className="text-white text-[9px] font-semibold truncate leading-tight">{audioFileName}</div>
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
