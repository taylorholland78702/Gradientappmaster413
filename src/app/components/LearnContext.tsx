import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { AudioBinding } from '../hooks/state/useAudioBindingsState';

// "Learn" binding: pick a band, then touch any slider in the app and it is bound to that band. The drawer owns the
// state so it carries across tabs; sliders read it through useLearn().
export type LearnBand = AudioBinding['band'];
export const NEW_BINDING_AMOUNT = 1;
export const BAND_LABELS: Record<LearnBand, string> = { sub: 'Sub', mids: 'Mids', treble: 'Treble', energy: 'Energy' };
// One colour per band, shared by the Learn chips and the dot a bound slider shows.
export const BAND_COLORS: Record<LearnBand, string> = { sub: '#eab308', mids: '#a855f7', treble: '#22d3ee', energy: '#f472b6' };

interface LearnValue {
  band: LearnBand | null;
  setBand: (b: LearnBand | null) => void;
  bindings: AudioBinding[];
  // Binds (or, if already bound to this band, unbinds) a setting. Returns what happened.
  toggle: (param: string) => 'added' | 'removed' | null;
  notice: string | null;
  setNotice: (n: string | null) => void;
}

const LearnCtx = createContext<LearnValue | null>(null);
export const useLearn = () => useContext(LearnCtx);

// The audio categories the sliders below belong to (set by a gradient panel or an effect section).
export const ModCategoryCtx = createContext<readonly string[]>([]);

export function LearnProvider({ bindings, setBindings, children }: {
  bindings: AudioBinding[];
  setBindings: (updater: (prev: AudioBinding[]) => AudioBinding[]) => void;
  children: React.ReactNode;
}) {
  const [band, setBand] = useState<LearnBand | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const bandRef = useRef(band); bandRef.current = band;
  const bindingsRef = useRef(bindings); bindingsRef.current = bindings;

  const toggle = useCallback((param: string) => {
    const b = bandRef.current;
    if (!b) return null;
    const existing = bindingsRef.current.find(x => x.param === param && x.band === b);
    if (existing) {
      setBindings(prev => prev.filter(x => x.id !== existing.id));
      return 'removed' as const;
    }
    setBindings(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, param, band: b, amount: NEW_BINDING_AMOUNT }]);
    return 'added' as const;
  }, [setBindings]);

  // Escape ends learning.
  useEffect(() => {
    if (!band) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setBand(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [band]);

  // A notice fades after a moment.
  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(t);
  }, [notice]);

  const value = useMemo(() => ({ band, setBand, bindings, toggle, notice, setNotice }), [band, bindings, toggle, notice]);
  return <LearnCtx.Provider value={value}>{children}</LearnCtx.Provider>;
}
