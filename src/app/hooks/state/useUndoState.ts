import { useState, useRef } from 'react';
import type { Snapshot } from '../snapshotTypes';

export function useUndoState() {
  const undoStackRef = useRef<Snapshot[]>([]);
  const undoIndexRef = useRef(-1);
  const [undoDepth, setUndoDepth] = useState(-1);

  return {
    undoStackRef,
    undoIndexRef,
    undoDepth,
    setUndoDepth,
  };
}
