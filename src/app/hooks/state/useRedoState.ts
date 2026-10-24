import { useState, useRef } from 'react';
import type { Snapshot } from '../snapshotTypes';

export function useRedoState() {
  const redoStackRef = useRef<Snapshot[]>([]);
  const [redoDepth, setRedoDepth] = useState(0);

  return {
    redoStackRef,
    redoDepth,
    setRedoDepth,
  };
}
