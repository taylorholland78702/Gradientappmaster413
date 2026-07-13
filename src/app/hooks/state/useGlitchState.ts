import { useState, useRef } from 'react';

export function useGlitchState() {
  const [glitchIntensity, setGlitchIntensity] = useState(0.4);
  const [glitchBlockSize, setGlitchBlockSize] = useState(24);
  const [glitchChromaSplit, setGlitchChromaSplit] = useState(4);

  return {
    glitchIntensity,
    setGlitchIntensity,
    glitchBlockSize,
    setGlitchBlockSize,
    glitchChromaSplit,
    setGlitchChromaSplit,
  };
}
