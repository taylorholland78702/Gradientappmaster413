import { useCallback, useState } from 'react';
import { isFlashReduced } from './useReduceFlash';

// How calm or wild every Shuffle runs, 0 to 1. Kept per device like the Reduce flashing setting (it is how you like to
// shuffle, not part of a look). 0.5 is the middle and leaves Shuffle behaving exactly as it did before the setting existed.
const KEY = 'wavShuffleIntensity';
export const DEFAULT_SHUFFLE_INTENSITY = 0.5;
// With Reduce flashing on, the wild end is held back: fast, busy looks are what make a shuffle flash.
export const REDUCED_FLASH_MAX_INTENSITY = 0.6;

function initial(): number {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored !== null) {
      const v = Number(stored);
      if (Number.isFinite(v)) return Math.max(0, Math.min(1, v));
    }
  } catch { /* storage blocked: fall through */ }
  return DEFAULT_SHUFFLE_INTENSITY;
}

export function useShuffleIntensity(): [number, (v: number) => void] {
  const [value, setValue] = useState<number>(initial);
  const set = useCallback((next: number) => {
    const v = Math.max(0, Math.min(1, next));
    setValue(v);
    try { localStorage.setItem(KEY, String(v)); } catch { /* not saved this time */ }
  }, []);
  return [value, set];
}

// The intensity a shuffle actually uses: the setting, held back when Reduce flashing is on.
export const effectiveShuffleIntensity = (setting: number): number =>
  isFlashReduced() ? Math.min(setting, REDUCED_FLASH_MAX_INTENSITY) : setting;
