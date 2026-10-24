import { useSyncExternalStore } from 'react';
import { MOODS, type MoodId } from '../constants/shuffleTaste';

// Which mood Shuffle uses: 'any' lets each shuffle pick its own (and avoid repeating), or you can hold one.
export type MoodChoice = MoodId | 'any';
const KEY = 'wavShuffleMood';

const valid = (v: unknown): v is MoodChoice => v === 'any' || MOODS.some(m => m.id === v);
let current: MoodChoice = 'any';
try { const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null; if (valid(saved)) current = saved; } catch { /* default */ }
const listeners = new Set<() => void>();

export const getShuffleMood = (): MoodChoice => current;
export function setShuffleMood(choice: MoodChoice) {
  if (!valid(choice) || choice === current) return;
  current = choice;
  try { localStorage.setItem(KEY, choice); } catch { /* not persisted */ }
  listeners.forEach(l => l());
}
export const useShuffleMood = (): MoodChoice => useSyncExternalStore(
  (cb) => { listeners.add(cb); return () => { listeners.delete(cb); }; },
  getShuffleMood,
  () => 'any' as MoodChoice,
);
