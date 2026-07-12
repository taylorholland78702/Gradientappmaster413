import { useRef, useState } from 'react';

const LONG_PRESS_MS = 800;
const DOUBLE_TAP_MS = 350;

// Shared tap/hold/double-tap gesture handling for the WĀV button — used by
// both the collapsed-cluster button and the main-panel wordmark, which
// previously had this logic copy-pasted verbatim (a bug fix here once had
// to be applied in two places). Native `dblclick` is unreliable when mixed
// with Pointer Events on the same element, so double-tap is detected
// manually from pointerup timing: a pending single-tap evolve is delayed
// briefly so a fast second tap can upgrade it to a full remix instead of
// stacking two tiny nudges.
export function useWavGesture(
  evolveWithFactor: (factor: number) => void,
  onPressStart?: () => void,
) {
  const [isWavHolding, setIsWavHolding] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);
  const pressStartTime = useRef<number>(0);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPointerUpTime = useRef<number>(0);

  const onPointerDown = () => {
    onPressStart?.();
    setIsWavHolding(true);
    pressStartTime.current = Date.now();
    longPressFired.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      setIsWavHolding(false);
      evolveWithFactor(1);
    }, LONG_PRESS_MS);
  };

  const onPointerUp = () => {
    setIsWavHolding(false);
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (longPressFired.current) return;
    const now = Date.now();
    const isDoubleTap = now - lastPointerUpTime.current < DOUBLE_TAP_MS;
    lastPointerUpTime.current = now;
    if (isDoubleTap) {
      if (tapTimeoutRef.current) { clearTimeout(tapTimeoutRef.current); tapTimeoutRef.current = null; }
      lastPointerUpTime.current = 0;
      evolveWithFactor(1);
    } else {
      const factor = Math.min((now - pressStartTime.current) / LONG_PRESS_MS, 1);
      tapTimeoutRef.current = setTimeout(() => { evolveWithFactor(factor); tapTimeoutRef.current = null; }, DOUBLE_TAP_MS);
    }
  };

  const onPointerLeave = () => {
    setIsWavHolding(false);
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  return { isWavHolding, onPointerDown, onPointerUp, onPointerLeave };
}
