// One-tap audio "feels": a starting point for the Audio tab's intensity, the four band gains, which bands
// pulse on a hit, and which effects fire on the beat. Every value stays adjustable by hand afterwards.
export interface AudioFeel {
  id: 'chill' | 'punchy' | 'hyper';
  label: string;
  hint: string;
  intensity: number;
  gains: { sub: number; bass: number; mids: number; treble: number };
  beatSync: { sub: boolean; bass: boolean; mids: boolean; treble: boolean };
  beatFx: { zoom: boolean; shake: boolean; contrast: boolean; palette: boolean };
}

export const AUDIO_FEELS: readonly AudioFeel[] = [
  {
    id: 'chill', label: 'Chill', hint: 'Soft, slow reactions with a gentle zoom',
    intensity: 0.25, gains: { sub: 1, bass: 1, mids: 0.8, treble: 0.6 },
    beatSync: { sub: false, bass: false, mids: false, treble: false },
    beatFx: { zoom: true, shake: false, contrast: false, palette: false },
  },
  {
    id: 'punchy', label: 'Punchy', hint: 'Clear kicks and snares: bass-led, with zoom and contrast on the beat',
    intensity: 0.8, gains: { sub: 2, bass: 2, mids: 1.4, treble: 1.2 },
    beatSync: { sub: true, bass: true, mids: false, treble: false },
    beatFx: { zoom: true, shake: false, contrast: true, palette: false },
  },
  {
    id: 'hyper', label: 'Hyper', hint: 'Everything reacts, and every beat effect fires',
    intensity: 2, gains: { sub: 3, bass: 3, mids: 2, treble: 2 },
    beatSync: { sub: true, bass: true, mids: true, treble: true },
    beatFx: { zoom: true, shake: true, contrast: true, palette: true },
  },
];

type Current = {
  intensity: number;
  gains: AudioFeel['gains'];
  beatSync: AudioFeel['beatSync'];
  beatFx: AudioFeel['beatFx'];
};

// The feel whose settings are exactly what is set now, if any (so its chip can show as picked).
export function matchingFeel(cur: Current): AudioFeel['id'] | null {
  const near = (a: number, b: number) => Math.abs(a - b) < 0.05;
  for (const f of AUDIO_FEELS) {
    if (!near(cur.intensity, f.intensity)) continue;
    if (!(Object.keys(f.gains) as (keyof AudioFeel['gains'])[]).every(k => near(cur.gains[k], f.gains[k]))) continue;
    if (!(Object.keys(f.beatSync) as (keyof AudioFeel['beatSync'])[]).every(k => cur.beatSync[k] === f.beatSync[k])) continue;
    if (!(Object.keys(f.beatFx) as (keyof AudioFeel['beatFx'])[]).every(k => cur.beatFx[k] === f.beatFx[k])) continue;
    return f.id;
  }
  return null;
}
