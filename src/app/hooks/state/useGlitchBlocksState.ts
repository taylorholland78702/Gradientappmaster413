import { useState } from 'react';

export function useGlitchBlocksState() {
  const [glitchBlocksCount, setGlitchBlocksCount] = useState(12);
  const [glitchBlocksShift, setGlitchBlocksShift] = useState(20);
  const [glitchBlocksSplit, setGlitchBlocksSplit] = useState(8);
  const [glitchBlocksSpeed, setGlitchBlocksSpeed] = useState(1);

  return {
    glitchBlocksCount,
    setGlitchBlocksCount,
    glitchBlocksShift,
    setGlitchBlocksShift,
    glitchBlocksSplit,
    setGlitchBlocksSplit,
    glitchBlocksSpeed,
    setGlitchBlocksSpeed,
  };
}
