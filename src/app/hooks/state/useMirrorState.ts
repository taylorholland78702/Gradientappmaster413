import { useState, useRef } from 'react';

export function useMirrorState() {
  const [mirrorMode, setMirrorMode] = useState<'horizontal' | 'vertical' | 'grid'>('horizontal');
  const [mirrorTileCount, setMirrorTileCount] = useState(2);

  return {
    mirrorMode,
    setMirrorMode,
    mirrorTileCount,
    setMirrorTileCount,
  };
}
