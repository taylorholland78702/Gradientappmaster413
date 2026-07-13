import { useState, useRef } from 'react';

export function useUndoState() {
  const undoStackRef = useRef<any[]>([]);
  const undoIndexRef = useRef(-1);
  const [undoDepth, setUndoDepth] = useState(-1);

  return {
    undoStackRef,
    undoIndexRef,
    undoDepth,
    setUndoDepth,
  };
}
