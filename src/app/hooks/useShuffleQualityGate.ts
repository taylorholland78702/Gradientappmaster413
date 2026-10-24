import { useCallback, useEffect, useRef, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import { IS_DISPLAY_MODE } from '../constants/displayMode';
import type { ColorRGB, GradientType } from '../constants/gradientEffects';
import { isDullFrame, isDullPalette, measureFrame } from '../utils/frameQuality';
import { scoreFrame, bestCandidate, GOOD_ENOUGH, type FrameCandidate } from '../utils/frameScore';
import { shuffleLearning } from '../utils/shuffleLearning';
import { shuffleMarks, type PendingLook } from '../utils/shuffleMarks';
import type { FrameFeatures } from '../utils/frameScore';
import { paletteStats, type PaletteStats } from '../utils/paletteStats';
import type { Snapshot } from './snapshotTypes';

// A full shuffle rolls a look at random. This wraps it: it rolls, waits a few frames, scores what was drawn, and keeps the
// first look that is good enough. Otherwise it tries again, up to three looks (four when every one so far was dull:
// flat, near-black or near-white), then goes back to the best of them. While it works the previous frame stays on
// screen, so you never see the rejected looks, and the undo history keeps only the state from before your shuffle.
const MAX_CANDIDATES = 3;
const MAX_ATTEMPTS = 4;
const SETTLE_FRAMES = 3;
const SETTLE_MS = 70;
const SAFETY_MS = 3500;

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
  // The live state as a snapshot, and a way to put one back exactly (no easing), for returning to the best look tried.
  getSnapshot: () => Snapshot;
  applyCandidate: (snapshot: Snapshot) => void;
  undoStackRef: MutableRefObject<Snapshot[]>;
  undoIndexRef: MutableRefObject<number>;
  setUndoDepth: Dispatch<SetStateAction<number>>;
  // The playback speed now in force, for the marking tool.
  getSpeed?: () => number;
}

export function useShuffleQualityGate({ evolve, canvasRef, gradientTypeRef, targetColorsRef, getSnapshot, applyCandidate, undoStackRef, undoIndexRef, setUndoDepth, getSpeed }: ShuffleQualityGateParams) {
  const evolveRef = useRef(evolve);
  evolveRef.current = evolve;
  const getSnapshotRef = useRef(getSnapshot);
  getSnapshotRef.current = getSnapshot;
  const applyCandidateRef = useRef(applyCandidate);
  applyCandidateRef.current = applyCandidate;
  const getSpeedRef = useRef(getSpeed);
  getSpeedRef.current = getSpeed;
  const busyRef = useRef(false);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => () => { overlayRef.current?.remove(); }, []);

  return useCallback((factor: number) => {
    const canvas = canvasRef.current;
    // Small nudges, the standalone player, a hidden tab, or a shuffle already being judged: just run it.
    if (factor < 1 || IS_DISPLAY_MODE || document.hidden || busyRef.current || !canvas) {
      evolveRef.current(factor);
      if (factor >= 1) shuffleLearning.commit();
      return;
    }

    busyRef.current = true;
    const overlay = freezeFrame(canvas);
    overlayRef.current = overlay;
    const safety = window.setTimeout(() => overlay?.remove(), SAFETY_MS);
    (async () => {
      let pushed = 0;
      let ready: PendingLook | null = null;
      try {
        const candidates: FrameCandidate<Snapshot>[] = [];
        const frames: (FrameFeatures | null)[] = [];
        const rolls: { speed?: number; palette?: PaletteStats }[] = [];
        shuffleLearning.reset();
        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
          const topBefore = undoStackRef.current[undoStackRef.current.length - 1];
          evolveRef.current(factor);
          if (undoStackRef.current[undoStackRef.current.length - 1] !== topBefore) pushed++;
          await waitForFrames();
          const type = gradientTypeRef.current;
          const measured = measureFrame(canvas);
          const dull = (measured !== null && isDullFrame(measured.stats, type)) || isDullPalette(targetColorsRef.current, type);
          const score = measured ? scoreFrame(measured.features, type) : 0.5;
          candidates.push({ score, dull, value: getSnapshotRef.current() });
          frames.push(measured ? measured.features : null);
          rolls.push({ speed: getSpeedRef.current?.(), palette: paletteStats(targetColorsRef.current) ?? undefined });
          if (!dull && score >= GOOD_ENOUGH) break;
          if (candidates.length >= MAX_CANDIDATES && candidates.some(c => !c.dull)) break;
        }
        // Back to the best look tried, if it was not the last one drawn.
        const best = bestCandidate(candidates);
        if (best && best !== candidates[candidates.length - 1]) applyCandidateRef.current(best.value);
        // The look that stayed on screen is the one to learn from.
        const keptIndex = best ? candidates.indexOf(best) : candidates.length - 1;
        shuffleLearning.commit(keptIndex);
        // For the marking tool: what was kept, with what the frame score made of it.
        const meta = shuffleLearning.currentMeta, features = frames[keptIndex];
        if (meta && features) ready = { meta, features, score: candidates[keptIndex].score, dull: candidates[keptIndex].dull, ...rolls[keptIndex] };
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
      // Ready to be marked only once the gate is free again, so marking can start the next shuffle straight away.
      shuffleMarks.setLatest(ready);
      if (shuffleMarks.active) shuffleMarks.setCurrent(ready);
    })();
  }, [canvasRef, gradientTypeRef, targetColorsRef, undoStackRef, undoIndexRef, setUndoDepth]);
}
