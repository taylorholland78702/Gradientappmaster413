import { useState } from 'react';

// Matches the three bands that are actually shaped by the user's per-band
// Multiplier/Auto Gain settings and threaded into the draw pipeline as
// audioSubBassLevel/audioMidsLevel/audioTrebleLevel — there's no separate
// shaped "bass" level (only a live meter for display), so 'energy' (overall
// loudness, also already in P) stands in as the fourth option instead.
export interface AudioBinding {
  id: string;
  param: string;
  band: 'sub' | 'mids' | 'treble' | 'energy';
  amount: number;
}

// A single array of {param, band, amount} entries, applied generically to
// the draw pipeline's P object by key name in useCanvasDraw.ts — this is
// what lets every slider in MODULATABLE_PARAMS be bound to an audio band
// without adding a bind-icon to each of the ~130 individual slider rows.
export function useAudioBindingsState() {
  const [audioBindings, setAudioBindings] = useState<AudioBinding[]>([]);

  return {
    audioBindings,
    setAudioBindings,
  };
}
