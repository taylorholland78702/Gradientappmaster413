import React, { useState, useEffect } from 'react';
import { CaretDown, Plus, Shuffle, Microphone, MicrophoneSlash, X, FloppyDisk, Trash, Check } from '@phosphor-icons/react';
import { MODULATABLE_PARAMS, MODULATABLE_PARAMS_BY_CATEGORY } from '../constants/modulatableParams';
import type { AudioBinding } from '../hooks/state/useAudioBindingsState';
import { SliderRow } from './SliderRow';
import { choice } from './choice';

const BAND_LABELS: Record<AudioBinding['band'], string> = {
  sub: 'Sub', mids: 'Mids', treble: 'Treble', energy: 'Energy',
};

// One-click starting points for common audio/music styles — set the base
// response shape (sensitivity, per-band multipliers, beat-sync, FX on
// beat). Modulation bindings are optional: the built-ins leave them
// untouched (bindings are keyed to a specific gradient's sliders, so a
// shipped set would do nothing on most gradients), while presets the user
// saves capture their bindings and put them back when applied.
interface AudioStylePreset {
  name: string;
  bindings?: Omit<AudioBinding, 'id'>[];
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

// One-tap bindings for the active gradient's shared Scale / Speed.
const QUICK_BINDS: { label: string; target: 'scale' | 'speed'; band: AudioBinding['band']; amount: number }[] = [
  { label: 'Scale ← Bass', target: 'scale', band: 'sub', amount: 0.6 },
  { label: 'Scale ← Energy', target: 'scale', band: 'energy', amount: 0.5 },
  { label: 'Speed ← Mids', target: 'speed', band: 'mids', amount: 1 },
  { label: 'Speed ← Treble', target: 'speed', band: 'treble', amount: 1.2 },
];

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

// User-saved presets, capturing whatever the panel's current live settings
// are at save time — stored locally rather than through the app's
// Firestore-backed preset system (usePresets.ts), since these are tied to
// the user's own mic/speaker setup rather than a "look" worth syncing
// across devices. `custom: true` distinguishes them from the curated
// built-ins above so the dropdown can group them and only offer
// update/delete on the ones the user actually owns.
type CustomAudioStylePreset = AudioStylePreset & { custom: true };
const CUSTOM_PRESETS_KEY = 'wav-custom-audio-style-presets';

function loadCustomPresets(): CustomAudioStylePreset[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PRESETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCustomPresets(presets: CustomAudioStylePreset[]) {
  try {
    localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(presets));
  } catch (err) {
    // Was dev-only console.warn — unlike usePresets.ts's safeSetLocalStorage,
    // a user hitting a full localStorage quota here got no indication their
    // custom audio preset silently failed to save and would vanish on
    // reload. Same alert() pattern as that sibling save path.
    console.error('Failed to persist custom audio style presets:', err);
    alert(
      "Couldn't save — your browser's local storage is full. " +
      'Try deleting a few old presets and saving again.'
    );
  }
}

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
  onShuffleAudio: () => void;
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
    audioBindings, quickBindKeys,
    zoomBeatEnabled, shakeBeatEnabled, contrastBeatEnabled, paletteBeatEnabled,
  } = state;

  const [modParam, setModParam] = useState(MODULATABLE_PARAMS[0].key);
  const [modBand, setModBand] = useState<AudioBinding['band']>('mids');
  const [modAmount, setModAmount] = useState(1);
  // Modulation (the only thing behind this toggle) opens by default now —
  // the toggle itself stays, just for collapsing it back once open.
  const [showAdvanced, setShowAdvanced] = useState(true);

  // Custom Style Presets — user-saved snapshots of the current live
  // settings, persisted locally (see saveCustomPresets above).
  const [customPresets, setCustomPresets] = useState<CustomAudioStylePreset[]>(() => loadCustomPresets());
  // Which preset chip is lit. Empty until one is picked (or Shuffle Audio lands on one):
  // nothing is applied on load, so no chip should claim to be.
  const [selectedPresetName, setSelectedPresetName] = useState('');
  const [isNamingPreset, setIsNamingPreset] = useState(false);
  const [presetNameDraft, setPresetNameDraft] = useState('');

  useEffect(() => { saveCustomPresets(customPresets); }, [customPresets]);

  const selectedCustomPreset = customPresets.find(p => p.name === selectedPresetName) ?? null;

  const currentSettingsAsPreset = (name: string): CustomAudioStylePreset => ({
    name, title: name, custom: true,
    masterSensitivity, autoGainEnabled,
    subBassMultiplier, bassMultiplier, midsMultiplier, trebleMultiplier,
    subBassBeatSync, bassBeatSync, midsBeatSync, trebleBeatSync,
    zoomBeatEnabled, shakeBeatEnabled, contrastBeatEnabled, paletteBeatEnabled,
    bindings: audioBindings.map(({ param, band, amount }) => ({ param, band, amount })),
  });

  const confirmSaveNewPreset = () => {
    const name = presetNameDraft.trim();
    if (!name) return;
    setCustomPresets(prev => [...prev.filter(p => p.name !== name), currentSettingsAsPreset(name)]);
    setSelectedPresetName(name);
    setIsNamingPreset(false);
    setPresetNameDraft('');
  };

  const updateSelectedCustomPreset = () => {
    if (!selectedCustomPreset) return;
    setCustomPresets(prev => prev.map(p => p.name === selectedCustomPreset.name ? currentSettingsAsPreset(p.name) : p));
  };

  const deleteSelectedCustomPreset = () => {
    if (!selectedCustomPreset) return;
    setCustomPresets(prev => prev.filter(p => p.name !== selectedCustomPreset.name));
    setSelectedPresetName('');
  };

  const {
    setSelectedAudioDeviceId, setMicError,
    setMasterSensitivity, setAutoGainEnabled, setDepthLayerEnabled, setDepthLayerStrength, setBassMultiplier, setMidsMultiplier, setTrebleMultiplier,
    setSubBassMultiplier, setSubBassBeatSync, setAudioBindings,
    setBassBeatSync, setMidsBeatSync, setTrebleBeatSync,
    startMicVisualization, stopMicVisualization, onAudioFileClick,
    setZoomBeatEnabled, setShakeBeatEnabled, setContrastBeatEnabled, setPaletteBeatEnabled,
    onShuffleAudio,
  } = actions;

  const applyStylePreset = (preset: AudioStylePreset) => {
    setMasterSensitivity(preset.masterSensitivity);
    // Auto Gain is always on (no UI toggle) — presets no longer touch it.
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
    // Presets saved before bindings were captured have none stored, and keep
    // whatever is bound now; an explicit (even empty) list replaces it.
    if (preset.bindings) {
      setAudioBindings(preset.bindings.map(b => ({ ...b, id: `${Date.now()}-${Math.random()}` })));
    }
  };

  const handleStylePresetPick = (name: string) => {
    setSelectedPresetName(name);
    const preset = AUDIO_STYLE_PRESETS.find(p => p.name === name) ?? customPresets.find(p => p.name === name);
    if (preset) applyStylePreset(preset);
  };

  // Shuffle Audio Controls previously only randomized each slider/toggle
  // independently (via onShuffleAudio below), never touching the Style
  // Preset dropdown at all — so it never actually landed on one of the
  // curated combos (Bass/EDM, Vocal, Techno, etc.), just noise. Now it
  // runs the existing shuffle first (which also randomizes Modulation
  // bindings — the one piece a style preset doesn't cover), then picks a
  // random preset (built-in + any saved custom ones) and applies it
  // second, so the preset's curated sensitivity/multiplier/beat-sync
  // combo wins over onShuffleAudio's own ad-hoc random values for those
  // same fields instead of being clobbered by them.
  const handleShuffleAudio = () => {
    onShuffleAudio();
    const presetPool: AudioStylePreset[] = [...AUDIO_STYLE_PRESETS, ...customPresets];
    if (presetPool.length > 0) {
      const preset = presetPool[Math.floor(Math.random() * presetPool.length)];
      setSelectedPresetName(preset.name);
      applyStylePreset(preset);
    }
  };

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

            {/* Style presets — one-click starting points for common audio/
                music styles; sets sensitivity/band multipliers/beat-sync/FX
                on beat, leaves Modulation bindings alone. Built-ins are
                curated and read-only; anything the user saves shows up
                under Custom, with Update/Delete once selected. Shuffle
                sits inline as an icon-only button, top-right. */}
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap gap-1" role="group" aria-label="Built-in style presets">
                {[...AUDIO_STYLE_PRESETS].sort((a, b) => a.name.localeCompare(b.name)).map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handleStylePresetPick(preset.name)}
                    aria-pressed={selectedPresetName === preset.name}
                    title={preset.title}
                    className={choice(selectedPresetName === preset.name)}
                  >{preset.name}</button>
                ))}
              </div>
              {customPresets.length > 0 && (
                <div className="flex flex-wrap gap-1 items-center" role="group" aria-label="Your saved style presets">
                  <span className="text-[10px] text-wav-text-3">Yours</span>
                  {[...customPresets].sort((a, b) => a.name.localeCompare(b.name)).map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => handleStylePresetPick(preset.name)}
                      aria-pressed={selectedPresetName === preset.name}
                      className={choice(selectedPresetName === preset.name)}
                    >{preset.name}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="flex-1 text-[10px] text-wav-text-2">Style</span>
              {selectedCustomPreset ? (
                <>
                  <button
                    onClick={updateSelectedCustomPreset}
                    title={`Overwrite "${selectedCustomPreset.name}" with the current settings`}
                    aria-label={`Overwrite "${selectedCustomPreset.name}" with the current settings`}
                    className="p-1 bg-wav-field text-white hover:bg-wav-hover transition-all flex-shrink-0"
                  >
                    <FloppyDisk weight="regular" className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={deleteSelectedCustomPreset}
                    title={`Delete "${selectedCustomPreset.name}"`}
                    aria-label={`Delete "${selectedCustomPreset.name}"`}
                    className="p-1 bg-wav-field text-white hover:bg-wav-hover transition-all flex-shrink-0"
                  >
                    <Trash weight="regular" className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setIsNamingPreset(true); setPresetNameDraft(''); }}
                  title="Save current settings as a new Style Preset"
                  aria-label="Save current settings as a new Style Preset"
                  className="p-1 bg-wav-field text-white hover:bg-wav-hover transition-all flex-shrink-0"
                >
                  <Plus weight="bold" className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={handleShuffleAudio}
                title="Shuffle Audio Controls — picks a random Style Preset and reshuffles Modulation bindings (scoped to the active gradient/effects)"
                aria-label="Shuffle Audio Controls"
                className="p-1 bg-wav-field text-white hover:bg-wav-hover transition-all flex-shrink-0"
              >
                <Shuffle weight="regular" className="w-3.5 h-3.5" />
              </button>
            </div>

            {isNamingPreset && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  autoFocus
                  value={presetNameDraft}
                  onChange={(e) => setPresetNameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmSaveNewPreset();
                    if (e.key === 'Escape') setIsNamingPreset(false);
                  }}
                  placeholder="Preset name..."
                  className="flex-1 min-w-0 text-[10px] text-white bg-wav-field border border-wav-line rounded px-1.5 py-1"
                />
                <button
                  onClick={confirmSaveNewPreset}
                  disabled={!presetNameDraft.trim()}
                  title="Save"
                  aria-label="Save"
                  className="p-1 bg-wav-field text-white hover:bg-wav-hover disabled:opacity-40 transition-all flex-shrink-0"
                >
                  <Check weight="bold" className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsNamingPreset(false)}
                  title="Cancel"
                  aria-label="Cancel"
                  className="p-1 bg-wav-field text-white hover:bg-wav-hover transition-all flex-shrink-0"
                >
                  <X weight="bold" className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

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
                      const meta = MODULATABLE_PARAMS.find(p => p.key === b.param);
                      return (
                        <div key={b.id} className="flex items-center gap-1.5 bg-wav-field px-1.5 py-1">
                          <span className="text-[10px] text-white flex-1 truncate">{meta ? meta.label : b.param}</span>
                          <select
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
                <div className="flex items-center gap-1">
                  <select
                    value={modParam}
                    onChange={(e) => setModParam(e.target.value)}
                    className="flex-[4] min-w-0 text-[10px] text-white bg-wav-field border border-wav-line rounded pl-1 pr-4 py-1"
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
                    className="text-[10px] text-white bg-wav-field border border-wav-line rounded px-1 py-1 flex-shrink-0"
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
