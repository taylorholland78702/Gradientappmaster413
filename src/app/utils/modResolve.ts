import { MODULATABLE_PARAMS } from '../constants/modulatableParams';

// Finds the audio-bindable setting behind a slider, from the slider's label and the categories on screen (the active
// gradient's, or the effect section the slider sits in). 'Scale:' inside the Noise gradient is 'Noise Scale'; 'Speed:'
// inside Cathode is 'Cathode Speed'. Returns null when the slider has no bindable setting.
const norm = (s: string) => s.toLowerCase().replace(/:$/, '').replace(/\s+/g, ' ').trim();

// Slider labels that differ from the setting's name once the category is taken off.
const ALIASES: Record<string, string[]> = {
  'cell size': ['size'], 'dot size': ['size'], 'brush size': ['radius'], 'detail': ['levels', 'octaves', 'iterations'],
  'strength': ['amount', 'intensity'], 'intensity': ['opacity', 'strength'], 'lights': ['count'], 'crackle': ['crackle intensity'],
  'points': ['point count'], 'tile size': ['size'], 'offset': ['offset'], 'rotate': ['rotate speed', 'rotation'], 'light angle': ['light angle'],
  'move speed': ['move speed'], 'texture': ['texture'],
};

export function resolveParam(label: unknown, categories: readonly string[]): string | null {
  if (typeof label !== 'string' || categories.length === 0) return null;
  const sl = norm(label);
  if (!sl) return null;
  const wanted = [sl, ...(ALIASES[sl] ?? [])];
  // An exact name beats an alias, whatever order the settings are listed in.
  for (const w of wanted) {
    for (const cat of categories) {
      const c = cat.toLowerCase();
      for (const p of MODULATABLE_PARAMS) {
        if (p.category !== cat) continue;
        const pl = norm(p.label);
        if (pl === `${c} ${w}` || pl.endsWith(` ${w}`) || pl === w) return p.key;
      }
    }
  }
  return null;
}
