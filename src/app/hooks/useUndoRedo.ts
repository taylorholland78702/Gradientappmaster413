import { useCallback } from 'react';
import type { useRedoState } from './state/useRedoState';
import type { useUndoState } from './state/useUndoState';
import type { Snapshot } from './snapshotTypes';
import { shuffleLearning } from '../utils/shuffleLearning';

// A small picture of each saved look, kept beside its snapshot so the look filmstrip can show it.
const lookThumbs = new WeakMap<object, string>();
export const lookThumbOf = (snapshot: object): string | null => lookThumbs.get(snapshot) ?? null;

// Undo / redo history: a 10-deep stack of snapshots with saveCurrentState pushing a new entry.
export function useUndoRedo({
  buildSnapshot, applySnapshot, undoStackRef, undoIndexRef, setUndoDepth, redoStackRef, setRedoDepth, captureThumb, onHistoryChange,
}: {
  buildSnapshot: () => Snapshot;
  applySnapshot: (snapshot: Snapshot) => void;
  undoStackRef: ReturnType<typeof useUndoState>['undoStackRef'];
  undoIndexRef: ReturnType<typeof useUndoState>['undoIndexRef'];
  setUndoDepth: ReturnType<typeof useUndoState>['setUndoDepth'];
  redoStackRef: ReturnType<typeof useRedoState>['redoStackRef'];
  setRedoDepth: ReturnType<typeof useRedoState>['setRedoDepth'];
  // A picture of the canvas as it is now, kept with each saved snapshot (for the look filmstrip).
  captureThumb?: () => string | null;
  // Called whenever the history changes, so a view of it can refresh even when the depth numbers stay the same.
  onHistoryChange?: () => void;
}) {
  const remember = (snapshot: Snapshot) => { const t = captureThumb?.(); if (t) lookThumbs.set(snapshot, t); };
  const saveCurrentState = useCallback(() => {
    const snapshot = buildSnapshot();
    remember(snapshot);
    // Push snapshot onto a 10-item stack, discarding any forward history
    const stack = undoStackRef.current;
    const newIndex = undoIndexRef.current + 1;
    undoStackRef.current = [...stack.slice(0, newIndex), snapshot].slice(-10);
    undoIndexRef.current = undoStackRef.current.length - 1;
    setUndoDepth(undoIndexRef.current);
    // A fresh edit invalidates any redo history
    redoStackRef.current = [];
    setRedoDepth(0);
    onHistoryChange?.();
  }, [buildSnapshot, captureThumb, onHistoryChange]);

  const undoLastChange = useCallback(() => {
    if (undoIndexRef.current < 0) return;
    // Undoing a shuffle soon after it is a vote against what it was made of.
    shuffleLearning.reject();
    const snapshot = undoStackRef.current[undoIndexRef.current];
    undoIndexRef.current -= 1;
    setUndoDepth(undoIndexRef.current);
    if (!snapshot) return;

    // Capture the live state onto the redo stack before overwriting it
    const currentSnapshot = buildSnapshot();
    remember(currentSnapshot);
    redoStackRef.current = [...redoStackRef.current, currentSnapshot].slice(-10);
    setRedoDepth(redoStackRef.current.length);

    applySnapshot(snapshot);
    onHistoryChange?.();
  }, [buildSnapshot, applySnapshot, captureThumb, onHistoryChange]);

  const redoLastChange = useCallback(() => {
    const redoStack = redoStackRef.current;
    if (redoStack.length === 0) return;
    const snapshot = redoStack[redoStack.length - 1];
    redoStackRef.current = redoStack.slice(0, -1);
    setRedoDepth(redoStackRef.current.length);

    // Push the live state back onto the undo stack so it can be undone again
    const currentSnapshot = buildSnapshot();
    remember(currentSnapshot);
    const stack = undoStackRef.current;
    const newIndex = undoIndexRef.current + 1;
    undoStackRef.current = [...stack.slice(0, newIndex), currentSnapshot].slice(-10);
    undoIndexRef.current = undoStackRef.current.length - 1;
    setUndoDepth(undoIndexRef.current);

    applySnapshot(snapshot);
    onHistoryChange?.();
  }, [buildSnapshot, applySnapshot, captureThumb, onHistoryChange]);

  // Goes back to the look at `index` in the history (0 is the oldest still kept) in one step, as if undo had been pressed
  // the right number of times: the looks passed over, and the one being left, wait on the redo stack in order.
  const jumpToLook = useCallback((index: number) => {
    const last = undoIndexRef.current;
    if (index < 0 || index > last) return;
    shuffleLearning.reject();
    const stack = undoStackRef.current;
    const target = stack[index];
    if (!target) return;
    const current = buildSnapshot();
    remember(current);
    const forward = [current, ...stack.slice(index + 1, last + 1).reverse()];
    redoStackRef.current = [...redoStackRef.current, ...forward].slice(-10);
    setRedoDepth(redoStackRef.current.length);
    undoIndexRef.current = index - 1;
    setUndoDepth(undoIndexRef.current);
    applySnapshot(target);
    onHistoryChange?.();
  }, [buildSnapshot, applySnapshot, captureThumb, onHistoryChange]);

  return { saveCurrentState, undoLastChange, redoLastChange, jumpToLook };
}
