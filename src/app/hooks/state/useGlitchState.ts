import { useState } from 'react';

export function useGlitchState() {
  const [glitchMode, setGlitchMode] = useState<'blocks' | 'rows'>('blocks');

  return {
    glitchMode,
    setGlitchMode,
  };
}
