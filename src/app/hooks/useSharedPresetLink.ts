import { useEffect, useCallback, useMemo, useRef, useState, type MutableRefObject, type SetStateAction, type Dispatch, type ReactNode } from 'react';
import { DEFAULT_COLORS } from '../constants/gradientEffects';
import { IS_DISPLAY_MODE } from '../constants/displayMode';
import { decodePresetData } from '../utils/presetShare';
import { migrateId } from '../constants/gradientEffects';
import { migrateIds } from '../constants/gradientEffects';
import { sanitizeSnapshot } from '../utils/sanitizeSnapshot';
import type { SnapshotValues } from './snapshotTypes';
import type { ColorRGB } from '../constants/gradientEffects';
import type { EffectType } from '../constants/gradientEffects';
import type { GradientType } from '../constants/gradientEffects';
import type { PresetData } from './usePresets';

// Loads a shared look from the ?preset= link once on mount (sanitized), then strips it from the address bar. Moved out of InteractiveGradient unchanged.
export interface UseSharedPresetLinkParams {
  // A getter: applySnapshot comes from useSnapshot, which is called later in the component.
  getApplySnapshot: () => (snapshot: Partial<SnapshotValues>) => void;
  gradientAngleRef: MutableRefObject<number>;
  gradientColorsRef: MutableRefObject<ColorRGB[]>;
  setIsAutoMode: (value: SetStateAction<boolean>) => void;
  zoomRef: MutableRefObject<number>;
}

export function useSharedPresetLink(p: UseSharedPresetLinkParams) {
  const { getApplySnapshot, gradientAngleRef, gradientColorsRef, setIsAutoMode, zoomRef } = p;
  // Load a shared preset from ?preset=<encoded> if present (see
  // PresetsPanel's "Copy shareable link" button, and its "Open Standalone
  // Player" button which adds &display=1 to the same link). The full
  // snapshot is embedded directly in the URL rather than looked up from
  // Firestore — this app doesn't control its own Firestore security rules
  // from the client, so a new public collection can't be assumed readable
  // by other users. Runs once on mount; strips the param afterward so a
  // reload doesn't keep re-applying it (and so undo/redo/edits aren't
  // fighting a giant URL sitting in the address bar). Used to bail out
  // entirely in Display mode — now it's exactly how standalone playback
  // gets its frozen state, so it only skips when there's no preset to load.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('preset');
    if (!encoded) return;
    try {
      const data = sanitizeSnapshot(decodePresetData(encoded) as PresetData);
      getApplySnapshot()({
        ...data,
        gradientType: data.gradientType ? migrateId(data.gradientType) as GradientType : 'angle',
        activeEffects: migrateIds(data.activeEffects) as EffectType[],
      });
      // Same instant-snap as applyPresetData above — see that comment.
      const restoredColors = data.gradientColors || DEFAULT_COLORS;
      gradientColorsRef.current = restoredColors.map((c: ColorRGB) => ({ ...c }));
      gradientAngleRef.current = data.gradientAngle ?? 45;
      zoomRef.current = data.zoom ?? 1;
      // Standalone playback has no controller to press Play — Auto Mode
      // is what drives every self-animating gradient's clock (see the
      // IS_STANDALONE_DISPLAY checks throughout the draw loop and the
      // per-gradient anim-time effects below), so turn it on here instead.
      if (IS_DISPLAY_MODE) setIsAutoMode(true);
    } catch (err) {
      if (import.meta.env.DEV) console.warn('Failed to load shared preset from URL:', err);
    }
    params.delete('preset');
    const newSearch = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
