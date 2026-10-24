import React, { useEffect, useState } from 'react';
import { CaretDown, Plus, Microphone, MicrophoneSlash, X } from '@phosphor-icons/react';
import { findSource, sourcesOf, paramGroups, bindingLabel } from '../constants/modulationTree';
import { AudioParamPicker } from './AudioParamPicker';
import type { AudioBinding } from '../hooks/state/useAudioBindingsState';
import { SliderRow } from './SliderRow';
import { choice } from './choice';

const BAND_LABELS: Record<AudioBinding['band'], string> = {
  sub: 'Sub', mids: 'Mids', treble: 'Treble', energy: 'Energy',
};

// One-tap bindings for the active gradient's shared Scale / Speed.
const QUICK_BINDS: { label: string; target: 'scale' | 'speed'; band: AudioBinding['band']; amount: number }[] = [
  { label: 'Scale ← Bass', target: 'scale', band: 'sub', amount: 0.6 },
  { label: 'Scale ← Energy', target: 'scale', band: 'energy', amount: 0.5 },
  { label: 'Speed ← Mids', target: 'speed', band: 'mids', amount: 1 },
  { label: 'Speed ← Treble', target: 'speed', band: 'treble', amount: 1.2 },
];

export interface AudioPanelState {
  isMicActive: boolean;
  micError: string | null;
  audioInputDevices: MediaDeviceInfo[];
  selectedAudioDeviceId: string;
  isAudioControlsOpen: boolean;
  masterSensitivity: number;
  reactionSmoothing: number;
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
  // The active gradient's own Scale/Speed modulation keys (styled gradients), for the quick-bind chips.
  quickBindKeys: { scale: string; speed: string } | null;
  gradientType: string | null;
  activeEffects: readonly string[];
}

export interface AudioPanelActions {
  setMicError: (v: string | null) => void;
  setSelectedAudioDeviceId: (id: string) => void;
  setIsAudioControlsOpen: (open: boolean) => void;
  setMasterSensitivity: (v: number) => void;
  setReactionSmoothing: (v: number) => void;
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
  setAudioBindings: (updater: AudioBinding[] | ((prev: AudioBinding[]) => AudioBinding[])) => void;
}

interface AudioPanelProps {
  state: AudioPanelState;
  actions: AudioPanelActions;
}

const AudioPanelInner: React.FC<AudioPanelProps> = ({ state, actions }) => {
  const {
    isMicActive, micError, audioInputDevices, selectedAudioDeviceId,
    masterSensitivity, autoGainEnabled, depthLayerEnabled, depthLayerStrength, bassMultiplier, midsMultiplier, trebleMultiplier,
    bassBeatSync, midsBeatSync, trebleBeatSync,
    liveBassLevel, liveMidsLevel, liveTrebleLevel,
    audioFileName, waveformData, audioFileMetadata,
    subBassMultiplier, subBassBeatSync, liveSubBassLevel,
    audioBindings, quickBindKeys, gradientType, activeEffects,
    zoomBeatEnabled, shakeBeatEnabled, contrastBeatEnabled, paletteBeatEnabled,
  } = state;

  // The setting the next binding will drive (see AudioParamPicker); opens on the first setting of the gradient on screen.
  const [modParam, setModParam] = useState(() => {
    const src = findSource('gradient', gradientType ?? '') ?? sourcesOf('gradient')[0];
    return paramGroups(src)[0].params[0].param.key;
  });
  // The field follows the gradient on screen until a setting is picked by hand.
  useEffect(() => {
    const src = findSource('gradient', gradientType ?? '');
    if (src) setModParam(paramGroups(src)[0].params[0].param.key);
  }, [gradientType]);
  const [modBand, setModBand] = useState<AudioBinding['band']>('mids');
  const [modAmount, setModAmount] = useState(1);
  // Modulation (the only thing behind this toggle) opens by default now —
  // the toggle itself stays, just for collapsing it back once open.
  const [showAdvanced, setShowAdvanced] = useState(true);

  const {
    setSelectedAudioDeviceId, setMicError,
    setMasterSensitivity, setAutoGainEnabled, setDepthLayerEnabled, setDepthLayerStrength, setBassMultiplier, setMidsMultiplier, setTrebleMultiplier,
    setSubBassMultiplier, setSubBassBeatSync, setAudioBindings,
    setBassBeatSync, setMidsBeatSync, setTrebleBeatSync,
    startMicVisualization, stopMicVisualization, onAudioFileClick,
    setZoomBeatEnabled, setShakeBeatEnabled, setContrastBeatEnabled, setPaletteBeatEnabled,
  } = actions;

  return (
    <>
      {/* Audiovisuals Section — single pill */}
      <div className="w-full flex mt-2.5">
        <div className="flex items-center justify-between flex-1 overflow-hidden">
          {/* Mic toggle, device select, upload, parameters — a flat row of 4
              equal-width segments with matching dividers between all of
              them. Previously the mic+device pair was nested in its own
              flex-[2] wrapper (mic and its chevron splitting that wrapper's
              2 units 50/50) while Upload and Parameters each sat at the
              outer level as flex-1 — same math on paper, but the nesting
              gave the mic/chevron pair its own separate padding box, which
              read as visually tighter/closer together than the other two.
              Flattening to one level removes that discrepancy. */}
          <button
            onClick={() => isMicActive ? stopMicVisualization() : startMicVisualization(selectedAudioDeviceId)}
            className="wav-choice flex-1 px-2 py-1.5 text-xs font-semibold transition-all text-white hover:bg-wav-hover flex items-center justify-center"
            title={isMicActive ? 'Turn Mic Off' : 'Turn Mic On (A)'}
            aria-label={isMicActive ? 'Turn Mic Off' : 'Turn Mic On'}
          >
            {isMicActive
              // Green while actual signal is coming through, so the mic
              // button doubles as a live "is it working" indicator instead
              // of only showing on/off state.
              ? <Microphone weight="regular" className={`w-4 h-4 transition-colors ${Math.max(liveSubBassLevel, liveBassLevel, liveMidsLevel, liveTrebleLevel) > 0.04 ? 'text-wav-ok' : ''}`} />
              : <MicrophoneSlash weight="regular" className="w-4 h-4" />}
          </button>
          <div className="w-px h-4 bg-wav-line-strong flex-shrink-0" />
          {/* Device select — a Microphone icon alongside the caret ties this
              dropdown visually to the mic toggle next to it (previously
              just an unlabeled caret, easy to miss that it's an input-
              device picker rather than some other menu). */}
          <div className={`relative flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-white transition-all ${isMicActive ? 'hover:bg-wav-hover' : 'opacity-40'}`}>
            {isMicActive && (
              <select
                aria-label="Audio input device"
                value={selectedAudioDeviceId}
                onChange={(e) => {
                  setSelectedAudioDeviceId(e.target.value);
                  // startMicVisualization swaps devices in place (new
                  // stream acquired before the old one is torn down) — no
                  // separate stop+timeout step, which was flipping
                  // isMicActive off with no guarantee the restart landed.
                  startMicVisualization(e.target.value);
                }}
                title="Select microphone input"
                className="absolute inset-0 opacity-0 cursor-pointer w-full"
              >
                {audioInputDevices.map(d => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Microphone ${d.deviceId.slice(0, 6)}`}
                  </option>
                ))}
              </select>
            )}
            <Microphone weight="regular" className="w-3.5 h-3.5 pointer-events-none opacity-60" />
            <CaretDown weight="regular" className="w-4 h-4 pointer-events-none" />
          </div>
          <div className="w-px h-4 bg-wav-line-strong flex-shrink-0" />
          {/* Upload — labeled now (was a bare + with only a hover title),
              since a plus on its own next to a mic icon and a device
              dropdown read as another mic-related control rather than a
              separate "load a file instead" action. */}
          <button
            onClick={onAudioFileClick}
            className="wav-choice flex-1 px-2 py-1.5 text-xs font-semibold transition-all text-white hover:bg-wav-hover flex items-center justify-center gap-1"
            title="Load Audio File"
            aria-label="Load Audio File"
          >
            <Plus weight="regular" className="w-4 h-4 flex-shrink-0" />
            <span className="whitespace-nowrap">Upload</span>
          </button>
        </div>
      </div>

      {/* Mic errors (permission denied, no device, etc.) surfaced inline
          instead of a native alert() — consistent with every other error
          surface in the app (e.g. PresetsPanel's authError). */}
      {micError && (
        <div className="w-full flex items-start justify-between gap-2 bg-wav-error-fill border border-wav-error-line px-2 py-1.5">
          <p className="text-[10px] text-wav-error leading-snug">{micError}</p>
          <button
            onClick={() => setMicError(null)}
            className="relative wav-hit text-wav-error opacity-70 hover:opacity-100 transition-colors flex-shrink-0"
            title="Dismiss"
            aria-label="Dismiss"
          >
            <X weight="bold" className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Always open now — was gated behind its own dropdown toggle
          (Parameters button), which just added an extra click to reach
          the panel's main controls every time. */}
      <div className="w-full px-1.5 py-2 border-t border-wav-line-strong">
          <div className="flex flex-col gap-2">

                        {/* Auto Gain and Depth Layer have no UI controls — always on
                (see useAudioReactivity.ts's defaults and useSnapshot.ts,
                which now force both true regardless of what a saved
                snapshot/preset says). */}

            <SliderRow label="Intensity:" value={masterSensitivity} onChange={setMasterSensitivity} min="0" max="10" step="0.1" />

            {/* Band column headers — titles show the actual Hz range each band listens to */}
            <div className="flex gap-2">
              <div className="w-0 flex-1 min-w-0 text-center text-[10px] text-wav-text-2 font-medium" title="~20-60Hz — kick drum fundamental">Sub</div>
              <div className="w-0 flex-1 min-w-0 text-center text-[10px] text-wav-text-2 font-medium" title="~60-250Hz">Bass</div>
              <div className="w-0 flex-1 min-w-0 text-center text-[10px] text-wav-text-2 font-medium" title="~250Hz-2kHz">Mids</div>
              <div className="w-0 flex-1 min-w-0 text-center text-[10px] text-wav-text-2 font-medium" title="~2-8kHz — hi-hats, snare crack, presence">Treble</div>
            </div>

            {/* Band columns — Sub / Bass / Mids / Treble */}
            <div className="flex gap-2 items-start overflow-hidden">

              {/* Sub-bass */}
              <div className="flex flex-col items-center gap-1 w-0 flex-1 min-w-0 px-2 pt-1.5 pb-2 bg-wav-field">
                <div className="flex gap-1.5 w-full" style={{height: '60px'}}>
                  <div className="flex-1 relative overflow-hidden bg-wav-hover">
                    <div className="w-full absolute bottom-0 transition-none" style={{height: `${Math.min(100, liveSubBassLevel * 100)}%`, background: 'linear-gradient(to top, #eab308, #a855f7)'}} />
                  </div>
                  <div style={{width: '16px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'visible'}}>
                    <input type="range" min="0" max="5" step="0.1" value={subBassMultiplier} onChange={(e) => setSubBassMultiplier(Number(e.target.value))} aria-label="Sub multiplier" style={{width: '60px', height: '16px', transform: 'rotate(-90deg)', cursor: 'pointer'}} />
                  </div>
                </div>
                <input type="number" min="0" max="5" step="0.1" value={subBassMultiplier} onChange={(e) => setSubBassMultiplier(Number(e.target.value))} aria-label="Sub multiplier value" className="w-full text-[10px] text-white text-center bg-wav-field border border-wav-line rounded px-0.5" />
                <button onClick={() => setSubBassBeatSync(!subBassBeatSync)} aria-pressed={subBassBeatSync} className={choice(subBassBeatSync, 'w-full')}>BEAT</button>
              </div>

              {/* Bass */}
              <div className="flex flex-col items-center gap-1 w-0 flex-1 min-w-0 px-2 pt-1.5 pb-2 bg-wav-field">
                <div className="flex gap-1.5 w-full" style={{height: '60px'}}>
                  <div className="flex-1 relative overflow-hidden bg-wav-hover">
                    <div className="w-full absolute bottom-0 transition-none" style={{height: `${Math.min(100, liveBassLevel * 100)}%`, background: 'linear-gradient(to top, #eab308, #a855f7)'}} />
                  </div>
                  <div style={{width: '16px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'visible'}}>
                    <input type="range" min="0" max="5" step="0.1" value={bassMultiplier} onChange={(e) => setBassMultiplier(Number(e.target.value))} aria-label="Bass multiplier" style={{width: '60px', height: '16px', transform: 'rotate(-90deg)', cursor: 'pointer'}} />
                  </div>
                </div>
                <input type="number" min="0" max="5" step="0.1" value={bassMultiplier} onChange={(e) => setBassMultiplier(Number(e.target.value))} aria-label="Bass multiplier value" className="w-full text-[10px] text-white text-center bg-wav-field border border-wav-line rounded px-0.5" />
                <button onClick={() => setBassBeatSync(!bassBeatSync)} aria-pressed={bassBeatSync} className={choice(bassBeatSync, 'w-full')}>BEAT</button>
              </div>

              {/* Mids */}
              <div className="flex flex-col items-center gap-1 w-0 flex-1 min-w-0 px-2 pt-1.5 pb-2 bg-wav-field">
                <div className="flex gap-1.5 w-full" style={{height: '60px'}}>
                  <div className="flex-1 relative overflow-hidden bg-wav-hover">
                    <div className="w-full absolute bottom-0 transition-none" style={{height: `${Math.min(100, liveMidsLevel * 100)}%`, background: 'linear-gradient(to top, #eab308, #a855f7)'}} />
                  </div>
                  <div style={{width: '16px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'visible'}}>
                    <input type="range" min="0" max="5" step="0.1" value={midsMultiplier} onChange={(e) => setMidsMultiplier(Number(e.target.value))} aria-label="Mids multiplier" style={{width: '60px', height: '16px', transform: 'rotate(-90deg)', cursor: 'pointer'}} />
                  </div>
                </div>
                <input type="number" min="0" max="5" step="0.1" value={midsMultiplier} onChange={(e) => setMidsMultiplier(Number(e.target.value))} aria-label="Mids multiplier value" className="w-full text-[10px] text-white text-center bg-wav-field border border-wav-line rounded px-0.5" />
                <button onClick={() => setMidsBeatSync(!midsBeatSync)} aria-pressed={midsBeatSync} className={choice(midsBeatSync, 'w-full')}>BEAT</button>
              </div>

              {/* Treble */}
              <div className="flex flex-col items-center gap-1 w-0 flex-1 min-w-0 px-2 pt-1.5 pb-2 bg-wav-field">
                <div className="flex gap-1.5 w-full" style={{height: '60px'}}>
                  <div className="flex-1 relative overflow-hidden bg-wav-hover">
                    <div className="w-full absolute bottom-0 transition-none" style={{height: `${Math.min(100, liveTrebleLevel * 100)}%`, background: 'linear-gradient(to top, #eab308, #a855f7)'}} />
                  </div>
                  <div style={{width: '16px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'visible'}}>
                    <input type="range" min="0" max="5" step="0.1" value={trebleMultiplier} onChange={(e) => setTrebleMultiplier(Number(e.target.value))} aria-label="Treble multiplier" style={{width: '60px', height: '16px', transform: 'rotate(-90deg)', cursor: 'pointer'}} />
                  </div>
                </div>
                <input type="number" min="0" max="5" step="0.1" value={trebleMultiplier} onChange={(e) => setTrebleMultiplier(Number(e.target.value))} aria-label="Treble multiplier value" className="w-full text-[10px] text-white text-center bg-wav-field border border-wav-line rounded px-0.5" />
                <button onClick={() => setTrebleBeatSync(!trebleBeatSync)} aria-pressed={trebleBeatSync} className={choice(trebleBeatSync, 'w-full')}>BEAT</button>
              </div>
            </div>

            {/* FX on Beat — previously only settable via Style Presets and
                Shuffle, with no manual control. Label sits on its own line
                (same pattern as the SUB/BASS/MIDS/TREBLE column headers
                above) so all four buttons get the full row width instead of
                splitting it with an inline label — "Contrast"/"Palette"
                were getting squeezed to the point of near-illegibility. */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-wav-text-2 font-medium">FX on Beat</label>
              <div className="flex gap-1.5">
                <button onClick={() => setZoomBeatEnabled(!zoomBeatEnabled)} title="Pulse zoom on beat" aria-pressed={zoomBeatEnabled} className={choice(zoomBeatEnabled, 'flex-1')}>Zoom</button>
                <button onClick={() => setShakeBeatEnabled(!shakeBeatEnabled)} title="Shake on beat" aria-pressed={shakeBeatEnabled} className={choice(shakeBeatEnabled, 'flex-1')}>Shake</button>
                <button onClick={() => setContrastBeatEnabled(!contrastBeatEnabled)} title="Pulse contrast on beat" aria-pressed={contrastBeatEnabled} className={choice(contrastBeatEnabled, 'flex-1')}>Contrast</button>
                <button onClick={() => setPaletteBeatEnabled(!paletteBeatEnabled)} title="Shift palette on beat" aria-pressed={paletteBeatEnabled} className={choice(paletteBeatEnabled, 'flex-1')}>Palette</button>
              </div>
            </div>

            {/* Advanced — Modulation (bind any slider to an audio band) is
                the most powerful and least-needed-by-default section, so
                it's opt-in rather than always taking up space. */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full py-1 text-left bg-transparent outline-none hover:bg-transparent active:bg-transparent focus:outline-none appearance-none"
            >
              <span className="text-[10px] text-wav-text-2 font-medium">Advanced</span>
              <CaretDown weight="regular" className={`w-4 h-4 text-wav-text-3 transition-transform shrink-0 ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>

            {showAdvanced && (
              /* Modulation — bind any slider in the app to an audio band.
                 Applied generically by param key in useCanvasDraw.ts, so
                 every entry in MODULATABLE_PARAMS works without a bind-icon
                 on each individual slider row. */
              <div className="flex flex-col gap-2">
                {quickBindKeys && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-wav-text-2">Quick bind for this gradient</span>
                    <div className="flex flex-wrap gap-1">
                      {QUICK_BINDS.map(q => {
                        const param = quickBindKeys[q.target];
                        const existing = audioBindings.find(b => b.param === param && b.band === q.band);
                        return (
                          <button
                            key={q.label}
                            onClick={() => setAudioBindings(prev => existing
                              ? prev.filter(x => x.id !== existing.id)
                              : [...prev, { id: `${Date.now()}-${Math.random()}`, param, band: q.band, amount: q.amount }])}
                            aria-pressed={!!existing}
                            title={`${existing ? 'Remove' : 'Add'} a binding: ${q.label}`}
                            className={choice(!!existing)}
                          >
                            {q.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {audioBindings.length > 0 && (
                  <div className="flex flex-col gap-2 mb-1">
                    {audioBindings.map((b) => {
                      const bindingName = bindingLabel(b.param);
                      return (
                        <div key={b.id} className="flex items-center gap-1.5 bg-wav-field px-1.5 py-1">
                          <span className="text-[10px] text-white flex-1 min-w-0 break-words">{bindingName}</span>
                          <select
                            aria-label={`Audio band for ${bindingName}`}
                            value={b.band}
                            onChange={(e) => setAudioBindings(prev => prev.map(x => x.id === b.id ? { ...x, band: e.target.value as AudioBinding['band'] } : x))}
                            className="text-[10px] text-white bg-wav-field border border-wav-line rounded px-1 py-0.5 flex-shrink-0"
                          >
                            {(Object.keys(BAND_LABELS) as AudioBinding['band'][]).map(band => (
                              <option key={band} value={band}>{BAND_LABELS[band]}</option>
                            ))}
                          </select>
                          <input
                            type="number"
                            min="-10" max="10" step="0.1"
                            value={b.amount}
                            onChange={(e) => setAudioBindings(prev => prev.map(x => x.id === b.id ? { ...x, amount: Number(e.target.value) } : x))}
                            className="w-9 text-[10px] text-white text-right bg-wav-field border border-wav-line rounded px-1 py-0.5 flex-shrink-0"
                            title="Modulation amount — multiplies the band's live level before adding it to the slider's base value"
                          />
                          <button
                            onClick={() => setAudioBindings(prev => prev.filter(x => x.id !== b.id))}
                            className="relative wav-hit text-wav-text-3 hover:text-white transition-all"
                            title="Remove binding"
                            aria-label="Remove binding"
                          >
                            <X weight="bold" className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                <AudioParamPicker value={modParam} onChange={setModParam} gradientType={gradientType} activeEffects={activeEffects} />
                <div className="flex items-center gap-1">
                  <select
                    aria-label="Audio band"
                    value={modBand}
                    onChange={(e) => setModBand(e.target.value as AudioBinding['band'])}
                    className="text-[10px] text-white bg-wav-field border border-wav-line rounded px-1 py-1 flex-shrink-0"
                  >
                    {(Object.keys(BAND_LABELS) as AudioBinding['band'][]).map(band => (
                      <option key={band} value={band}>{BAND_LABELS[band]}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    aria-label="Modulation amount"
                    min="-10" max="10" step="0.1"
                    value={modAmount}
                    onChange={(e) => setModAmount(Number(e.target.value))}
                    className="w-7 text-[10px] text-white text-right bg-wav-field border border-wav-line rounded px-1 py-1 flex-shrink-0"
                    title="Modulation amount — multiplies the band's live level before adding it to the slider's base value"
                  />
                  <button
                    onClick={() => setAudioBindings(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, param: modParam, band: modBand, amount: modAmount }])}
                    className="p-1 bg-wav-field text-white hover:bg-wav-hover transition-all flex-shrink-0"
                    title="Add modulation binding"
                    aria-label="Add modulation binding"
                  >
                    <Plus weight="bold" className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

          </div>
      </div>

      {/* Audio Waveform Display */}
      {audioFileName && waveformData.length > 0 && (
        <div className="w-full px-1.5 pt-2 border-t border-wav-line-strong">
          <div className="w-full h-5 mb-0.5 flex items-center justify-between gap-0.5 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-px bg-wav-active"></div>
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
                <div className="text-wav-text-2 text-[8px] leading-tight">
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
