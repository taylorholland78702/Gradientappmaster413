import React, { useState } from 'react';
import { CaretDown, Plus, SlidersHorizontal, Shuffle, Microphone, MicrophoneSlash, X } from '@phosphor-icons/react';
import { MODULATABLE_PARAMS, MODULATABLE_PARAMS_BY_CATEGORY } from '../constants/modulatableParams';
import type { AudioBinding } from '../hooks/state/useAudioBindingsState';

const BAND_LABELS: Record<AudioBinding['band'], string> = {
  sub: 'Sub', mids: 'Mids', treble: 'Treble', energy: 'Energy',
};

// One-click starting points for common audio/music styles — set the base
// response shape (sensitivity, per-band multipliers, beat-sync, FX on
// beat); deliberately leaves Modulation bindings untouched since those are
// a more advanced, user-curated layer on top of this base shape.
interface AudioStylePreset {
  name: string;
  title: string;
  masterSensitivity: number;
  autoGainEnabled: boolean;
  subBassMultiplier: number;
  bassMultiplier: number;
  midsMultiplier: number;
  trebleMultiplier: number;
  subBassBeatSync: boolean;
  bassBeatSync: boolean;
  midsBeatSync: boolean;
  trebleBeatSync: boolean;
  zoomBeatEnabled: boolean;
  shakeBeatEnabled: boolean;
  contrastBeatEnabled: boolean;
  paletteBeatEnabled: boolean;
}

const AUDIO_STYLE_PRESETS: AudioStylePreset[] = [
  {
    name: 'Bass/EDM', title: 'Bass-Heavy / EDM / Trap — punchy sub and bass, beat-synced zoom and shake',
    masterSensitivity: 1.8, autoGainEnabled: false,
    subBassMultiplier: 4, bassMultiplier: 3.5, midsMultiplier: 1, trebleMultiplier: 0.8,
    subBassBeatSync: true, bassBeatSync: true, midsBeatSync: false, trebleBeatSync: false,
    zoomBeatEnabled: true, shakeBeatEnabled: true, contrastBeatEnabled: false, paletteBeatEnabled: false,
  },
  {
    name: 'Vocal', title: 'Vocal / Acoustic — mids-forward, gentle sensitivity, no beat-sync so it doesn’t jitter on transients',
    masterSensitivity: 0.8, autoGainEnabled: true,
    subBassMultiplier: 0.5, bassMultiplier: 1, midsMultiplier: 2.5, trebleMultiplier: 1.2,
    subBassBeatSync: false, bassBeatSync: false, midsBeatSync: false, trebleBeatSync: false,
    zoomBeatEnabled: false, shakeBeatEnabled: false, contrastBeatEnabled: false, paletteBeatEnabled: false,
  },
  {
    name: 'Ambient', title: 'Ambient / Long-form — low sensitivity across all bands, slow palette cycling',
    masterSensitivity: 0.5, autoGainEnabled: true,
    subBassMultiplier: 0.8, bassMultiplier: 0.8, midsMultiplier: 0.8, trebleMultiplier: 0.8,
    subBassBeatSync: false, bassBeatSync: false, midsBeatSync: false, trebleBeatSync: false,
    zoomBeatEnabled: false, shakeBeatEnabled: false, contrastBeatEnabled: false, paletteBeatEnabled: true,
  },
  {
    name: 'Podcast', title: 'Podcast / Speech — mids-only reactivity, everything else damped so plosives don’t spike the visuals',
    masterSensitivity: 0.6, autoGainEnabled: true,
    subBassMultiplier: 0.1, bassMultiplier: 0.2, midsMultiplier: 2, trebleMultiplier: 0.5,
    subBassBeatSync: false, bassBeatSync: false, midsBeatSync: false, trebleBeatSync: false,
    zoomBeatEnabled: false, shakeBeatEnabled: false, contrastBeatEnabled: false, paletteBeatEnabled: false,
  },
  {
    name: 'Rock', title: 'High-Energy / Rock — broad-band sensitivity, punchy bass and treble',
    masterSensitivity: 2, autoGainEnabled: false,
    subBassMultiplier: 2, bassMultiplier: 3, midsMultiplier: 2, trebleMultiplier: 3,
    subBassBeatSync: false, bassBeatSync: true, midsBeatSync: false, trebleBeatSync: true,
    zoomBeatEnabled: false, shakeBeatEnabled: true, contrastBeatEnabled: true, paletteBeatEnabled: false,
  },
  {
    name: 'Hip-Hop', title: 'Hip-Hop / Trap — heavy sub/bass with sharp beat-synced hits on the low end',
    masterSensitivity: 1.6, autoGainEnabled: false,
    subBassMultiplier: 3.5, bassMultiplier: 3, midsMultiplier: 1.5, trebleMultiplier: 1,
    subBassBeatSync: true, bassBeatSync: true, midsBeatSync: false, trebleBeatSync: false,
    zoomBeatEnabled: true, shakeBeatEnabled: false, contrastBeatEnabled: false, paletteBeatEnabled: false,
  },
  {
    name: 'Techno', title: 'Techno / House — steady four-on-the-floor kick sync, mid sensitivity, cycling palette',
    masterSensitivity: 1.4, autoGainEnabled: false,
    subBassMultiplier: 3, bassMultiplier: 2.5, midsMultiplier: 1.5, trebleMultiplier: 1.5,
    subBassBeatSync: true, bassBeatSync: true, midsBeatSync: false, trebleBeatSync: false,
    zoomBeatEnabled: true, shakeBeatEnabled: false, contrastBeatEnabled: false, paletteBeatEnabled: true,
  },
  {
    name: 'Dubstep', title: 'Dubstep / DnB — massive bass drops, aggressive beat-synced zoom and shake',
    masterSensitivity: 2.2, autoGainEnabled: false,
    subBassMultiplier: 5, bassMultiplier: 4, midsMultiplier: 1.5, trebleMultiplier: 2,
    subBassBeatSync: true, bassBeatSync: true, midsBeatSync: false, trebleBeatSync: true,
    zoomBeatEnabled: true, shakeBeatEnabled: true, contrastBeatEnabled: false, paletteBeatEnabled: false,
  },
  {
    name: 'Metal', title: 'Metal — extreme energy across every band, aggressive beat-sync everywhere',
    masterSensitivity: 2.5, autoGainEnabled: false,
    subBassMultiplier: 3, bassMultiplier: 4, midsMultiplier: 3, trebleMultiplier: 4,
    subBassBeatSync: true, bassBeatSync: true, midsBeatSync: true, trebleBeatSync: true,
    zoomBeatEnabled: true, shakeBeatEnabled: true, contrastBeatEnabled: true, paletteBeatEnabled: false,
  },
  {
    name: 'Jazz', title: 'Jazz — mids/treble emphasis for horns and cymbals, moderate sensitivity, no harsh beat-sync',
    masterSensitivity: 1, autoGainEnabled: true,
    subBassMultiplier: 0.6, bassMultiplier: 1.2, midsMultiplier: 2, trebleMultiplier: 1.8,
    subBassBeatSync: false, bassBeatSync: false, midsBeatSync: false, trebleBeatSync: false,
    zoomBeatEnabled: false, shakeBeatEnabled: false, contrastBeatEnabled: false, paletteBeatEnabled: false,
  },
  {
    name: 'Classical', title: 'Classical / Orchestral — wide dynamic range, low sensitivity, gentle response, no beat-sync so legato passages stay smooth',
    masterSensitivity: 0.6, autoGainEnabled: true,
    subBassMultiplier: 0.4, bassMultiplier: 0.8, midsMultiplier: 1.5, trebleMultiplier: 1.3,
    subBassBeatSync: false, bassBeatSync: false, midsBeatSync: false, trebleBeatSync: false,
    zoomBeatEnabled: false, shakeBeatEnabled: false, contrastBeatEnabled: false, paletteBeatEnabled: false,
  },
  {
    name: 'Lo-fi', title: 'Lo-fi / Chillhop — soft, low sensitivity, gentle bass, slow palette cycling',
    masterSensitivity: 0.7, autoGainEnabled: true,
    subBassMultiplier: 1.2, bassMultiplier: 1, midsMultiplier: 0.9, trebleMultiplier: 0.6,
    subBassBeatSync: false, bassBeatSync: false, midsBeatSync: false, trebleBeatSync: false,
    zoomBeatEnabled: false, shakeBeatEnabled: false, contrastBeatEnabled: false, paletteBeatEnabled: true,
  },
];

export interface AudioPanelState {
  isMicActive: boolean;
  audioInputDevices: MediaDeviceInfo[];
  selectedAudioDeviceId: string;
  isAudioControlsOpen: boolean;
  masterSensitivity: number;
  autoGainEnabled: boolean;
  depthLayerEnabled: boolean;
  depthLayerStrength: number;
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
  audioBindings: AudioBinding[];
}

export interface AudioPanelActions {
  setSelectedAudioDeviceId: (id: string) => void;
  setIsAudioControlsOpen: (open: boolean) => void;
  setMasterSensitivity: (v: number) => void;
  setAutoGainEnabled: (v: boolean) => void;
  setDepthLayerEnabled: (v: boolean) => void;
  setDepthLayerStrength: (v: number) => void;
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
  setAudioBindings: (updater: AudioBinding[] | ((prev: AudioBinding[]) => AudioBinding[])) => void;
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
    masterSensitivity, autoGainEnabled, depthLayerEnabled, depthLayerStrength, bassMultiplier, midsMultiplier, trebleMultiplier,
    bassBeatSync, midsBeatSync, trebleBeatSync,
    liveBassLevel, liveMidsLevel, liveTrebleLevel,
    audioFileName, waveformData, audioFileMetadata,
    subBassMultiplier, subBassBeatSync, liveSubBassLevel,
    zoomBeatEnabled, shakeBeatEnabled, contrastBeatEnabled, paletteBeatEnabled,
    audioBindings,
  } = state;

  const [modParam, setModParam] = useState(MODULATABLE_PARAMS[0].key);
  const [modBand, setModBand] = useState<AudioBinding['band']>('mids');
  const [modAmount, setModAmount] = useState(1);

  const {
    setSelectedAudioDeviceId, setIsAudioControlsOpen,
    setMasterSensitivity, setAutoGainEnabled, setDepthLayerEnabled, setDepthLayerStrength, setBassMultiplier, setMidsMultiplier, setTrebleMultiplier,
    setSubBassMultiplier, setSubBassBeatSync, setAudioBindings,
    setBassBeatSync, setMidsBeatSync, setTrebleBeatSync,
    startMicVisualization, stopMicVisualization, onAudioFileClick,
    setZoomBeatEnabled, setShakeBeatEnabled, setContrastBeatEnabled, setPaletteBeatEnabled,
    onShuffleAudio,
  } = actions;

  const applyStylePreset = (preset: AudioStylePreset) => {
    setMasterSensitivity(preset.masterSensitivity);
    setAutoGainEnabled(preset.autoGainEnabled);
    setSubBassMultiplier(preset.subBassMultiplier);
    setBassMultiplier(preset.bassMultiplier);
    setMidsMultiplier(preset.midsMultiplier);
    setTrebleMultiplier(preset.trebleMultiplier);
    setSubBassBeatSync(preset.subBassBeatSync);
    setBassBeatSync(preset.bassBeatSync);
    setMidsBeatSync(preset.midsBeatSync);
    setTrebleBeatSync(preset.trebleBeatSync);
    setZoomBeatEnabled(preset.zoomBeatEnabled);
    setShakeBeatEnabled(preset.shakeBeatEnabled);
    setContrastBeatEnabled(preset.contrastBeatEnabled);
    setPaletteBeatEnabled(preset.paletteBeatEnabled);
  };

  const handleStylePresetSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const preset = AUDIO_STYLE_PRESETS.find(p => p.name === e.target.value);
    if (preset) applyStylePreset(preset);
  };

  return (
    <>
      {/* Audiovisuals Section — single pill */}
      <div className="w-full flex">
        <div className="flex items-center justify-between flex-1 bg-black/25 rounded-lg shadow-sm overflow-hidden">
          {/* Mic toggle */}
          <button
            onClick={() => isMicActive ? stopMicVisualization() : startMicVisualization(selectedAudioDeviceId)}
            className="flex-1 px-2 py-1 text-xs font-semibold transition-all text-white hover:bg-white/15 flex items-center justify-center"
            title={isMicActive ? 'Turn Mic Off' : 'Turn Mic On (A)'}
          >
            {isMicActive
              ? <Microphone weight="regular" className="w-4 h-4" />
              : <MicrophoneSlash weight="regular" className="w-4 h-4" />}
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

            {/* Style presets — one-click starting points for common audio/
                music styles; sets sensitivity/band multipliers/beat-sync/FX
                on beat, leaves Modulation bindings alone. */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-white whitespace-nowrap flex-shrink-0">Style Preset</label>
              <select
                defaultValue=""
                onChange={handleStylePresetSelect}
                title="Apply a curated starting point for a kind of audio/music"
                className="flex-1 min-w-0 text-[10px] text-white bg-black/25 border border-white/20 rounded px-1.5 py-1"
              >
                <option value="" disabled>Choose a style...</option>
                {[...AUDIO_STYLE_PRESETS].sort((a, b) => a.name.localeCompare(b.name)).map((preset) => (
                  <option key={preset.name} value={preset.name} title={preset.title}>{preset.name}</option>
                ))}
              </select>
            </div>

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
                className="ml-auto flex-1 py-0.5 rounded bg-black/25 text-white hover:bg-white/15 transition-all flex items-center justify-center gap-1.5 text-[9px] font-bold"
                title="Shuffle Audio Controls — randomizes Intensity, band sliders, BEAT, FX on Beat, and Modulation bindings (scoped to the active gradient/effects)"
              >
                <Shuffle weight="regular" className="w-3.5 h-3.5" />
                SHUFFLE
              </button>
            </div>
            {/* Depth Layer — a second, softer light source behind the main
                gradient for atmosphere/parallax. Toggle to disable outright;
                slider scales its opacity (0 = invisible, 2 = double default). */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-white whitespace-nowrap flex-shrink-0" title="A second, softer light source blended behind the main gradient for atmosphere/depth. Only visible while audio reactivity is on.">Depth Layer</label>
              <button
                onClick={() => setDepthLayerEnabled(!depthLayerEnabled)}
                className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${depthLayerEnabled ? 'bg-white/30 text-white' : 'bg-black/25 text-white hover:bg-white/15'}`}
              >{depthLayerEnabled ? 'ON' : 'OFF'}</button>
              <input
                type="range" min="0" max="2" step="0.05" value={depthLayerStrength}
                disabled={!depthLayerEnabled}
                onChange={(e) => setDepthLayerStrength(Number(e.target.value))}
                className="flex-1 min-w-0 disabled:opacity-40"
              />
              <span className="text-[10px] text-white w-6 text-right flex-shrink-0">{depthLayerStrength.toFixed(1)}</span>
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

            {/* Modulation — bind any slider in the app to an audio band.
                Applied generically by param key in useCanvasDraw.ts, so
                every entry in MODULATABLE_PARAMS works without a bind-icon
                on each individual slider row. */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-white/50 font-bold uppercase tracking-wider">Modulation</span>
              {audioBindings.length > 0 && (
                <div className="flex flex-col gap-1 mb-1">
                  {audioBindings.map((b) => {
                    const meta = MODULATABLE_PARAMS.find(p => p.key === b.param);
                    return (
                      <div key={b.id} className="flex items-center gap-1.5 bg-black/25 rounded px-1.5 py-1">
                        <span className="text-[9px] text-white flex-1 truncate">{meta ? meta.label : b.param}</span>
                        <span className="text-[9px] text-white/50 uppercase">{BAND_LABELS[b.band]}</span>
                        <span className="text-[9px] text-white/50 w-8 text-right">{b.amount.toFixed(1)}x</span>
                        <button
                          onClick={() => setAudioBindings(prev => prev.filter(x => x.id !== b.id))}
                          className="text-white/50 hover:text-white transition-all"
                          title="Remove binding"
                        >
                          <X weight="bold" className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex items-center gap-1">
                <select
                  value={modParam}
                  onChange={(e) => setModParam(e.target.value)}
                  className="flex-[4] min-w-0 text-[11px] text-white bg-black/25 border border-white/20 rounded pl-1 pr-4 py-1"
                >
                  {MODULATABLE_PARAMS_BY_CATEGORY.map(group => (
                    <optgroup key={group.category} label={group.category}>
                      {group.params.map(p => (
                        <option key={p.key} value={p.key}>{p.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <select
                  value={modBand}
                  onChange={(e) => setModBand(e.target.value as AudioBinding['band'])}
                  className="text-[9px] text-white bg-black/25 border border-white/20 rounded px-1 py-1 flex-shrink-0"
                >
                  {(Object.keys(BAND_LABELS) as AudioBinding['band'][]).map(band => (
                    <option key={band} value={band}>{BAND_LABELS[band]}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="-10" max="10" step="0.1"
                  value={modAmount}
                  onChange={(e) => setModAmount(Number(e.target.value))}
                  className="w-7 text-[9px] text-white text-right bg-black/25 border border-white/20 rounded px-1 py-1 flex-shrink-0"
                  title="Modulation amount — multiplies the band's live level before adding it to the slider's base value"
                />
                <button
                  onClick={() => setAudioBindings(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, param: modParam, band: modBand, amount: modAmount }])}
                  className="p-1 rounded bg-black/25 text-white hover:bg-white/15 transition-all flex-shrink-0"
                  title="Add modulation binding"
                >
                  <Plus weight="bold" className="w-3 h-3" />
                </button>
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
