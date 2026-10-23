import { useCallback, useRef } from 'react';
import type { TouchEvent as ReactTouchEvent } from 'react';
import type { ColorRGB } from '../constants/gradientEffects';
import { haptic } from '../utils/haptics';
import type { useMiscState } from './state/useMiscState';

type MiscState = ReturnType<typeof useMiscState>;

// ---- Touch gestures on the canvas -------------------------------------------------
//   flick left / right     forward (redo, else Shuffle) / back (Undo)
//   pinch                  zoom
//   twist with two fingers rotate
//   double-tap             pause / play
//   press and hold         hide / show the controls
//   drag in a circle       spin the gradient and re-roll the color under the finger (as before)
// Once a touch is clearly horizontal it stops driving that drag and puts back whatever the
// first few pixels changed, so a flick doesn't leave stray color changes. Slow horizontal
// drags therefore do nothing; vertical and circular drags work as before.
interface TouchGesture {
  x: number; y: number; t: number;
  horizontal: boolean; moved: boolean; longFired: boolean; wasPinch: boolean; threeFinger: boolean; threeMoved?: boolean;
  longTimer: ReturnType<typeof setTimeout> | null;
  colors: ColorRGB[]; angle: number;
  pinch: { d0: number; a0: number; zoom0: number; angle0: number } | null;
}

const SWIPE_MIN_PX = 70;
const SWIPE_MAX_MS = 700;
const LONG_PRESS_MS = 550;
const MOVE_SLOP_PX = 10;
const DOUBLE_TAP_MS = 320;

const clearLongTimer = (g: TouchGesture | null) => {
  if (g?.longTimer) { clearTimeout(g.longTimer); g.longTimer = null; }
};
const pinchMetrics = (e: ReactTouchEvent<HTMLCanvasElement>) => {
  const a = e.touches[0], b = e.touches[1];
  const dx = b.clientX - a.clientX, dy = b.clientY - a.clientY;
  return { d: Math.max(1, Math.hypot(dx, dy)), a: (Math.atan2(dy, dx) * 180) / Math.PI };
};

export function useTouchGestures({
  activeTab, setActiveTab, setIsDragging, previousPosition, targetZoomRef, targetAngleRef, targetColorsRef,
  gestureActionsRef, exportAsPNG, lastManualZoomTime, setTargetZoom, setTargetAngle, setTargetColors,
  handleInteraction, isAutoMode,
}: {
  activeTab: MiscState['activeTab'];
  setActiveTab: MiscState['setActiveTab'];
  setIsDragging: MiscState['setIsDragging'];
  previousPosition: MiscState['previousPosition'];
  targetZoomRef: MiscState['targetZoomRef'];
  targetAngleRef: MiscState['targetAngleRef'];
  targetColorsRef: MiscState['targetColorsRef'];
  gestureActionsRef: { current: { toggleControls: () => void; goForward: () => void; goBack: () => void; togglePause: () => void } };
  exportAsPNG: (mode?: 'download' | 'preview') => Promise<void>;
  lastManualZoomTime: MiscState['lastManualZoomTime'];
  setTargetZoom: MiscState['setTargetZoom'];
  setTargetAngle: MiscState['setTargetAngle'];
  setTargetColors: MiscState['setTargetColors'];
  handleInteraction: (clientX: number, clientY: number) => void;
  isAutoMode: boolean;
}) {
  const gestureRef = useRef<TouchGesture | null>(null);
  const lastTapRef = useRef<{ t: number; x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: ReactTouchEvent<HTMLCanvasElement>) => {
    if (activeTab) setActiveTab(null);
    setIsDragging(true);
    previousPosition.current = null;
    const prev = gestureRef.current;
    if (e.touches.length >= 2 && prev) {
      // A second finger: this is a pinch/twist, not a tap, swipe or hold. A third makes it a
      // three-finger tap instead (see touchend), so the pinch is dropped.
      clearLongTimer(prev);
      prev.moved = true; prev.horizontal = false; prev.wasPinch = true;
      if (e.touches.length >= 3) { prev.threeFinger = true; prev.pinch = null; return; }
      const m = pinchMetrics(e);
      prev.pinch = { d0: m.d, a0: m.a, zoom0: targetZoomRef.current, angle0: targetAngleRef.current };
      return;
    }
    clearLongTimer(prev);
    const t = e.touches[0];
    if (!t) { gestureRef.current = null; return; }
    const g: TouchGesture = {
      x: t.clientX, y: t.clientY, t: performance.now(),
      horizontal: false, moved: false, longFired: false, wasPinch: false, threeFinger: false, longTimer: null,
      colors: targetColorsRef.current.map(c => ({ ...c })), angle: targetAngleRef.current, pinch: null,
    };
    g.longTimer = setTimeout(() => {
      g.longTimer = null;
      if (g.moved || g.longFired) return;
      g.longFired = true;
      gestureActionsRef.current.toggleControls();
    }, LONG_PRESS_MS);
    gestureRef.current = g;
  }, [activeTab, setActiveTab]);

  const handleTouchEnd = useCallback((e: ReactTouchEvent<HTMLCanvasElement>) => {
    setIsDragging(false);
    previousPosition.current = null;
    const g = gestureRef.current;
    if (!g) return;
    clearLongTimer(g);
    if (e.touches.length > 0) return; // fingers still down: the gesture isn't over
    gestureRef.current = null;
    // Three fingers down and up together, without sliding: Save PNG (the S key's job).
    if (g.threeFinger && !g.threeMoved && performance.now() - g.t < 600) {
      haptic('success');
      exportAsPNG('preview');
      return;
    }
    if (g.wasPinch || g.longFired) return;
    const t = e.changedTouches[0];
    if (!t) return;
    const elapsed = performance.now() - g.t;
    const dx = t.clientX - g.x;
    // Flick: forward / back.
    if (g.horizontal && Math.abs(dx) >= SWIPE_MIN_PX && elapsed <= SWIPE_MAX_MS) {
      if (dx < 0) gestureActionsRef.current.goForward();
      else gestureActionsRef.current.goBack();
      return;
    }
    // Tap: a second one close behind the first is a double-tap (pause / play).
    if (!g.moved && elapsed < 260) {
      const now = performance.now();
      const last = lastTapRef.current;
      if (last && now - last.t < DOUBLE_TAP_MS && Math.hypot(t.clientX - last.x, t.clientY - last.y) < 40) {
        lastTapRef.current = null;
        gestureActionsRef.current.togglePause();
      } else {
        lastTapRef.current = { t: now, x: t.clientX, y: t.clientY };
      }
    }
  }, []);

  const handleTouchCancel = useCallback(() => {
    setIsDragging(false);
    previousPosition.current = null;
    clearLongTimer(gestureRef.current);
    gestureRef.current = null;
  }, []);

  const handleTouchMove = useCallback((e: ReactTouchEvent<HTMLCanvasElement>) => {
    const g = gestureRef.current;
    if (e.touches.length >= 2) {
      if (!g) return;
      clearLongTimer(g);
      g.moved = true; g.horizontal = false; g.wasPinch = true;
      if (g.threeFinger || e.touches.length >= 3) {
        g.threeFinger = true;
        // Any real slide turns the three-finger touch into nothing (not a tap).
        if (Math.hypot(e.touches[0].clientX - g.x, e.touches[0].clientY - g.y) > 24) g.threeMoved = true;
        return;
      }
      const m = pinchMetrics(e);
      if (!g.pinch) g.pinch = { d0: m.d, a0: m.a, zoom0: targetZoomRef.current, angle0: targetAngleRef.current };
      // Pinch scales zoom by how far the fingers have spread; twisting adds the change in
      // the angle between them to the gradient's angle.
      lastManualZoomTime.current = Date.now();
      setTargetZoom(Math.max(0.05, Math.min(20, g.pinch.zoom0 * (m.d / g.pinch.d0))));
      let dA = m.a - g.pinch.a0;
      if (dA > 180) dA -= 360; else if (dA < -180) dA += 360;
      setTargetAngle(g.pinch.angle0 + dA);
      return;
    }
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      if (g) {
        const dx = touch.clientX - g.x, dy = touch.clientY - g.y;
        if (!g.moved && Math.hypot(dx, dy) > MOVE_SLOP_PX) { g.moved = true; clearLongTimer(g); }
        if (!g.horizontal && Math.abs(dx) > 24 && Math.abs(dx) > Math.abs(dy) * 1.8) {
          g.horizontal = true;
          // Undo what the first pixels of this flick already did to the colors and angle.
          setTargetColors(g.colors.map(c => ({ ...c })));
          setTargetAngle(g.angle);
        }
        if (g.horizontal) return;
      }
      handleInteraction(touch.clientX, touch.clientY);
    }
  }, [handleInteraction, isAutoMode]);

  return { handleTouchStart, handleTouchEnd, handleTouchCancel, handleTouchMove };
}
