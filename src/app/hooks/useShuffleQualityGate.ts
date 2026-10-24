import { useCallback, useEffect, useRef, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import { IS_DISPLAY_MODE } from '../constants/displayMode';
import type { ColorRGB, GradientType } from '../constants/gradientEffects';
import { isDullFrame, isDullPalette, measureCanvas } from '../utils/frameQuality';
import type { Snapshot } from './snapshotTypes';

// A full shuffle rolls a gradient, palette and effect stack at random, and about a quarter of the rolls wash out
// (flat, near-black or near-white). This wraps the shuffle: it rolls, waits a few frames, looks at what was
// drawn, and re-rolls (up to 3 times) when the result is dull. While it works the previous frame stays on screen,
// so you never see the rejected looks, and the undo history keeps only the state from before your shuffle.
const MAX_ATTEMPTS = 4;
const SETTLE_FRAMES = 3;
const SETTLE_MS = 70;
const SAFETY_MS = 2000;

const waitForFrames = () => new Promise<void>(resolve => {
  const t0 = performance.now();
  let n = 0;
  const tick = () => { if (++n >= SETTLE_FRAMES && performance.now() - t0 >= SETTLE_MS) resolve(); else requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
});

// A still copy of the canvas laid over it while the shuffle is judged.
function freezeFrame(canvas: HTMLCanvasElement): HTMLCanvasElement | null {
  const host = canvas.parentElement;
  if (!host) return null;
  const copy = document.createElement('canvas');
  copy.width = canvas.width; copy.height = canvas.height;
  copy.getContext('2d')?.drawImage(canvas, 0, 0);
  copy.className = canvas.className;
  Object.assign(copy.style, { position: 'absolute', inset: '0', pointerEvents: 'none' });
  copy.setAttribute('aria-hidden', 'true');
  host.appendChild(copy);
  return copy;
}

export interface ShuffleQualityGateParams {
  evolve: (factor: number) => void;
  canvasRef: MutableRefObject<HTMLCanvasElement>;
  gradientTypeRef: MutableRefObject<GradientType>;
  targetColorsRef: MutableRefObject<ColorRGB[]>;
  undoStackRef: MutableRefObject<Snapshot[]>;
  undoIndexRef: MutableRefObject<number>;
  setUndoDepth: Dispatch<SetStateAction<number>>;
}

export function useShuffleQualityGate({ evolve, canvasRef, gradientTypeRef, targetColorsRef, undoStackRef, undoIndexRef, setUndoDepth }: ShuffleQualityGateParams) {
  const evolveRef = useRef(evolve);
  evolveRef.current = evolve;
  const busyRef = useRef(false);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => () => { overlayRef.current?.remove(); }, []);

  return useCallback((factor: number) => {
    const canvas = canvasRef.current;
    // Small nudges, the standalone player, a hidden tab, or a shuffle already being judged: just run it.
    if (factor < 1 || IS_DISPLAY_MODE || document.hidden || busyRef.current || !canvas) { evolveRef.current(factor); return; }

    busyRef.current = true;
    const overlay = freezeFrame(canvas);
    overlayRef.current = overlay;
    const safety = window.setTimeout(() => overlay?.remove(), SAFETY_MS);
    (async () => {
      let pushed = 0;
      try {
        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
          const topBefore = undoStackRef.current[undoStackRef.current.length - 1];
          evolveRef.current(factor);
          if (undoStackRef.current[undoStackRef.current.length - 1] !== topBefore) pushed++;
          await waitForFrames();
          const type = gradientTypeRef.current;
          const stats = measureCanvas(canvas);
          const dull = (stats !== null && isDullFrame(stats, type)) || isDullPalette(targetColorsRef.current, type);
          if (!dull) break;
        }
        // Each attempt saved the look before it. Keep only the first (what you had before shuffling).
        if (pushed > 1) {
          const drop = pushed - 1;
          undoStackRef.current = undoStackRef.current.slice(0, undoStackRef.current.length - drop);
          undoIndexRef.current = undoStackRef.current.length - 1;
          setUndoDepth(undoIndexRef.current);
        }
      } finally {
        window.clearTimeout(safety);
        overlay?.remove();
        overlayRef.current = null;
        busyRef.current = false;
      }
    })();
  }, [canvasRef, gradientTypeRef, targetColorsRef, undoStackRef, undoIndexRef, setUndoDepth]);
}
