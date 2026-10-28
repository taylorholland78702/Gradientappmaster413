import { useCallback, useState } from 'react';

// "Reduce flashing": an accessibility setting, kept per device (not in a look). When on, the beat reactions that can
// strobe (contrast pulse, shake, palette snap, treble colour flips) are muted or slowed. It starts on for anyone whose
// system asks for reduced motion, and otherwise off until chosen.
const KEY = 'wavReduceFlash';

function initial(): boolean {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored === '1') return true;
    if (stored === '0') return false;
  } catch { /* storage blocked: fall through */ }
  try { return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false; } catch { return false; }
}

export function useReduceFlash(): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState<boolean>(initial);
  const set = useCallback((next: boolean) => {
    setOn(next);
    try { localStorage.setItem(KEY, next ? '1' : '0'); } catch { /* not saved this time */ }
  }, []);
  return [on, set];
}

// A beat reaction may run at most this often when flashing is reduced (about three a second, the usual safe limit).
export const REDUCED_FLASH_MIN_INTERVAL_MS = 340;
