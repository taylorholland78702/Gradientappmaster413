import { useEffect, useCallback, useRef, useState, type MutableRefObject, type SetStateAction } from 'react';
import { IS_DISPLAY_MODE } from '../constants/displayMode';
import { haptic } from '../utils/haptics';
import { requestMotionPermission } from '../utils/motionPermission';
import { useMotionGestures } from './useMotionGestures';
import type { SnapshotValues } from './snapshotTypes';

// The actions behind swipes, arrow keys and taps (back, forward, pause, hide controls), phone shake and tilt, and reset to defaults. Moved out of InteractiveGradient unchanged.
export interface UseGestureActionsParams {
  applySnapshot: (snapshot: Partial<SnapshotValues>) => void;
  evolveWithFactor: (factor: number) => void;
  isControlsVisible: boolean;
  redoLastChange: () => void;
  redoStackRef: MutableRefObject<Partial<SnapshotValues>[]>;
  setAIPrompt: (value: SetStateAction<string>) => void;
  setActiveTab: (value: SetStateAction<"color" | "gradients" | "effects" | "audio" | "presets">) => void;
  setIsAutoColor: (value: SetStateAction<boolean>) => void;
  setIsControlsVisible: (value: SetStateAction<boolean>) => void;
  setIsMultiFxMode: (value: SetStateAction<boolean>) => void;
  setTargetAngle: (value: SetStateAction<number>) => void;
  targetAngleRef: MutableRefObject<number>;
  toggleVCRPlayback: () => void;
  undoIndexRef: MutableRefObject<number>;
  undoLastChange: () => void;
}

export function useGestureActions(p: UseGestureActionsParams) {
  const { applySnapshot, evolveWithFactor, isControlsVisible, redoLastChange, redoStackRef, setAIPrompt, setActiveTab, setIsAutoColor, setIsControlsVisible, setIsMultiFxMode, setTargetAngle, targetAngleRef, toggleVCRPlayback, undoIndexRef, undoLastChange } = p;
  // ---- Gesture feedback and the shared actions behind swipes, arrow keys and taps ----------
  // ---- Shared actions behind swipes, arrow keys and taps (each gives a haptic tap, no on-screen message) ----
  const isControlsVisibleRef = useRef(true);
  isControlsVisibleRef.current = isControlsVisible;

  // Back is Undo. Forward is Redo when there is something to redo, otherwise a new
  // Shuffle — so after stepping back, forward walks you back up before it rolls anything new.
  const goBack = useCallback(() => {
    if (undoIndexRef.current < 0) {
      haptic('warn');
      return;
    }
    undoLastChange();
    haptic('tick');
  }, [undoLastChange]);

  const goForward = useCallback(() => {
    if (redoStackRef.current.length > 0) {
      redoLastChange();
      haptic('tick');
      return;
    }
    evolveWithFactor(1);
    haptic('success');
  }, [evolveWithFactor, redoLastChange]);

  const togglePause = useCallback(() => {
    toggleVCRPlayback();
    haptic('tick');
  }, [toggleVCRPlayback]);

  const toggleControls = useCallback(() => {
    if (IS_DISPLAY_MODE) return;
    const wasVisible = isControlsVisibleRef.current;
    setIsControlsVisible(!wasVisible);
    haptic('success');
  }, []);

  const gestureActionsRef = useRef({ goBack, goForward, togglePause, toggleControls });
  gestureActionsRef.current = { goBack, goForward, togglePause, toggleControls };

  // Motion gestures (phone only): shake to Shuffle, tilt to rotate. Off until switched on in the
  // About panel, because iOS asks permission and only from a tap; the choice is remembered.
  const readFlag = (key: string) => { try { return localStorage.getItem(key) === '1'; } catch { return false; } };
  const [shakeEnabled, setShakeEnabledState] = useState(() => readFlag('wavShake'));
  const [tiltEnabled, setTiltEnabledState] = useState(() => readFlag('wavTilt'));
  const [motionDenied, setMotionDenied] = useState(false);
  const toggleMotion = async (kind: 'shake' | 'tilt') => {
    const current = kind === 'shake' ? shakeEnabled : tiltEnabled;
    const next = !current;
    if (next) {
      const ok = await requestMotionPermission();
      if (!ok) { setMotionDenied(true); return; }
      setMotionDenied(false);
    }
    (kind === 'shake' ? setShakeEnabledState : setTiltEnabledState)(next);
    try { localStorage.setItem(kind === 'shake' ? 'wavShake' : 'wavTilt', next ? '1' : '0'); } catch { /* not persisted */ }
    if (next) haptic('tick');
  };
  // Tilt turns the phone's left-right lean into the gradient angle, measured from wherever
  // the phone was held when tilt came on (or when it was last re-centered).
  const tiltBaseRef = useRef<{ gamma: number; angle: number } | null>(null);
  useEffect(() => { if (!tiltEnabled) tiltBaseRef.current = null; }, [tiltEnabled]);
  useMotionGestures({
    shake: shakeEnabled,
    tilt: tiltEnabled,
    onShake: () => { evolveWithFactor(1); haptic('success'); },
    onTilt: (gamma) => {
      if (!tiltBaseRef.current) tiltBaseRef.current = { gamma, angle: targetAngleRef.current };
      setTargetAngle(tiltBaseRef.current.angle + (gamma - tiltBaseRef.current.gamma) * 2.2);
    },
  });

  // Reset everything to defaults — shared by the Reset button and the Shift+R hotkey
  const resetToDefaults = useCallback(() => {
    // The share-link table (SHARE_DEFAULTS_V1) must keep describing old links, so the starting looks of Shapes and
    // Windmill are stated here instead.
    applySnapshot({ shapesMode: 'polar-grid', windmillMode: 'blades', windmillRotations: 1, windmillTightness: 1, windmillThickness: 40 });
    setIsMultiFxMode(false);
    setIsAutoColor(true);
    setActiveTab(null);
    setAIPrompt('');
  }, [applySnapshot]);
  return { gestureActionsRef, goBack, goForward, motionDenied, resetToDefaults, shakeEnabled, tiltEnabled, toggleMotion };
}
