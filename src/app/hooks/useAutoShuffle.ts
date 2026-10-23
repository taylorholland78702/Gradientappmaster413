import { useEffect, useRef, useState } from 'react';
import type { ColorRGB } from '../constants/gradientEffects';
import { type AutoShuffleScope, AUTO_SHUFFLE_SCOPES, AUTO_SHUFFLE_MIN_SEC, AUTO_SHUFFLE_MAX_SEC } from '../constants/autoShuffle';
import type { useMiscState } from './state/useMiscState';

type MiscState = ReturnType<typeof useMiscState>;

// Auto Shuffle: the on/off flag, its persisted interval and scope, and the timer that remixes.
export function useAutoShuffle({
  shuffleGradientType, randomizeEffects, randomColor, saveCurrentState, setTargetColors,
  gradientColorsRef, evolveWithFactor,
}: {
  shuffleGradientType: () => void;
  randomizeEffects: () => void;
  randomColor: () => ColorRGB;
  saveCurrentState: () => void;
  setTargetColors: MiscState['setTargetColors'];
  gradientColorsRef: MiscState['gradientColorsRef'];
  evolveWithFactor: (factor: number) => void;
}) {
  // Auto-shuffle: repeatedly triggers a full wāv remix (same as clicking the
  // wordmark) on a timer, so the artwork keeps evolving
  // hands-free. evolveWithFactor(1) sets new target values that the master
  // RAF loop lerps toward over time — that lerp IS the fade between one
  // result and the next, so no separate opacity/crossfade code is needed.
  const [isAutoShuffleOn, setIsAutoShuffleOn] = useState(false);
  // True while the "name this new preset" field is open (see PresetsPanel's
  // onAddingPresetChange) — pauses Auto Shuffle for that window so it can't
  // randomize the very state the user is trying to save out from under them.
  const [isNewPresetPending, setIsNewPresetPending] = useState(false);
  // Auto Shuffle's remix interval, adjustable from 1s up to an hour via the
  // slider in the Info panel. Persisted so it survives a reload.
  const [autoShuffleIntervalSec, setAutoShuffleIntervalSecState] = useState(() => {
    try {
      const saved = localStorage.getItem('autoShuffleIntervalSec');
      const n = saved ? Number(saved) : NaN;
      if (Number.isFinite(n) && n >= AUTO_SHUFFLE_MIN_SEC) return Math.min(AUTO_SHUFFLE_MAX_SEC, n);
    } catch (err) {
      if (import.meta.env.DEV) console.warn('Failed to read autoShuffleIntervalSec:', err);
    }
    return 7;
  });
  const setAutoShuffleIntervalSec = (sec: number) => {
    const clamped = Math.min(AUTO_SHUFFLE_MAX_SEC, Math.max(AUTO_SHUFFLE_MIN_SEC, Math.round(sec)));
    setAutoShuffleIntervalSecState(clamped);
    try { localStorage.setItem('autoShuffleIntervalSec', String(clamped)); } catch (err) {
      if (import.meta.env.DEV) console.warn('Failed to persist autoShuffleIntervalSec:', err);
    }
  };
  const [autoShuffleScope, setAutoShuffleScopeState] = useState<AutoShuffleScope>(() => {
    try {
      const saved = localStorage.getItem('autoShuffleScope');
      return AUTO_SHUFFLE_SCOPES.some(o => o.id === saved) ? (saved as AutoShuffleScope) : 'all';
    } catch { return 'all'; }
  });
  const setAutoShuffleScope = (scope: AutoShuffleScope) => {
    setAutoShuffleScopeState(scope);
    try { localStorage.setItem('autoShuffleScope', scope); } catch { /* storage unavailable: the choice just won't persist */ }
  };
  // Read through a ref rather than depending on evolveWithFactor directly —
  // it's recreated ~4x/sec (gradientColors syncs back from refs every 15
  // frames, and that's one of its deps), which was tearing down and
  // restarting this interval on every recreation, so it never survived long
  // enough to actually fire at 5s.
  const evolveWithFactorRef = useRef(evolveWithFactor);
  evolveWithFactorRef.current = evolveWithFactor;
  // Slows the master RAF loop's color/angle/zoom lerp while auto-shuffle is
  // running, so each result has a longer, more overlapping cross-fade into
  // the next instead of the ~2s ease used for a manual nudge/remix.
  const isAutoShuffleOnRef = useRef(false);
  useEffect(() => { isAutoShuffleOnRef.current = isAutoShuffleOn; }, [isAutoShuffleOn]);
  // What each Auto Shuffle tick changes: everything (a full remix), or just the
  // gradient, the effects or the colors. Read through a ref so changing the scope
  // doesn't restart the timer.
  const autoShuffleScopeRef = useRef(autoShuffleScope);
  autoShuffleScopeRef.current = autoShuffleScope;
  const autoShuffleActionsRef = useRef({ shuffleGradientType, randomizeEffects, randomColor, saveCurrentState, setTargetColors });
  autoShuffleActionsRef.current = { shuffleGradientType, randomizeEffects, randomColor, saveCurrentState, setTargetColors };
  const runAutoShuffleTick = () => {
    const a = autoShuffleActionsRef.current;
    switch (autoShuffleScopeRef.current) {
      case 'gradient': a.shuffleGradientType(); break;
      case 'effects': a.randomizeEffects(); break;
      case 'colors': a.saveCurrentState(); a.setTargetColors(gradientColorsRef.current.map(() => a.randomColor())); break;
      default: evolveWithFactorRef.current(1);
    }
  };
  const runAutoShuffleTickRef = useRef(runAutoShuffleTick);
  runAutoShuffleTickRef.current = runAutoShuffleTick;
  useEffect(() => {
    if (!isAutoShuffleOn || isNewPresetPending) return;
    runAutoShuffleTickRef.current();
    const id = setInterval(() => runAutoShuffleTickRef.current(), autoShuffleIntervalSec * 1000);
    return () => clearInterval(id);
  }, [isAutoShuffleOn, autoShuffleIntervalSec, isNewPresetPending]);

  return {
    isAutoShuffleOn, setIsAutoShuffleOn, isNewPresetPending, setIsNewPresetPending,
    autoShuffleIntervalSec, setAutoShuffleIntervalSec, autoShuffleScope, setAutoShuffleScope,
    isAutoShuffleOnRef,
  };
}
