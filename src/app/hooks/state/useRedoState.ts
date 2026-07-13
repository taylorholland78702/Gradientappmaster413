import { useState, useRef } from 'react';

export function useRedoState() {
  const redoStackRef = useRef<any[]>([]);
  const [redoDepth, setRedoDepth] = useState(0);

  return {
    redoStackRef,
    redoDepth,
    setRedoDepth,
  };
}
