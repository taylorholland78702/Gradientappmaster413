import { useCallback } from 'react';
import type { useRedoState } from './state/useRedoState';
import type { useUndoState } from './state/useUndoState';
import type { Snapshot } from './snapshotTypes';
import { shuffleLearning } from '../utils/shuffleLearning';

// Undo / redo history: a 10-deep stack of snapshots with saveCurrentState pushing a new entry.
export function useUndoRedo({
  buildSnapshot, applySnapshot, undoStackRef, undoIndexRef, setUndoDepth, redoStackRef, setRedoDepth,
}: {
  buildSnapshot: () => Snapshot;
  applySnapshot: (snapshot: Snapshot) => void;
  undoStackRef: ReturnType<typeof useUndoState>['undoStackRef'];
  undoIndexRef: ReturnType<typeof useUndoState>['undoIndexRef'];
  setUndoDepth: ReturnType<typeof useUndoState>['setUndoDepth'];
  redoStackRef: ReturnType<typeof useRedoState>['redoStackRef'];
  setRedoDepth: ReturnType<typeof useRedoState>['setRedoDepth'];
}) {
  const saveCurrentState = useCallback(() => {
    const snapshot = buildSnapshot();
    // Push snapshot onto a 10-item stack, discarding any forward history
    const stack = undoStackRef.current;
    const newIndex = undoIndexRef.current + 1;
    undoStackRef.current = [...stack.slice(0, newIndex), snapshot].slice(-10);
    undoIndexRef.current = undoStackRef.current.length - 1;
    setUndoDepth(undoIndexRef.current);
    // A fresh edit invalidates any redo history
    redoStackRef.current = [];
    setRedoDepth(0);
  }, [buildSnapshot]);

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
    redoStackRef.current = [...redoStackRef.current, currentSnapshot].slice(-10);
    setRedoDepth(redoStackRef.current.length);

    applySnapshot(snapshot);
  }, [buildSnapshot, applySnapshot]);

  const redoLastChange = useCallback(() => {
    const redoStack = redoStackRef.current;
    if (redoStack.length === 0) return;
    const snapshot = redoStack[redoStack.length - 1];
    redoStackRef.current = redoStack.slice(0, -1);
    setRedoDepth(redoStackRef.current.length);

    // Push the live state back onto the undo stack so it can be undone again
    const currentSnapshot = buildSnapshot();
    const stack = undoStackRef.current;
    const newIndex = undoIndexRef.current + 1;
    undoStackRef.current = [...stack.slice(0, newIndex), currentSnapshot].slice(-10);
    undoIndexRef.current = undoStackRef.current.length - 1;
    setUndoDepth(undoIndexRef.current);

    applySnapshot(snapshot);
  }, [buildSnapshot, applySnapshot]);

  return { saveCurrentState, undoLastChange, redoLastChange };
}
