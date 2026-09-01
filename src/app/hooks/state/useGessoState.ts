import { useState } from 'react';

export function useGessoState() {
  const [gessoWhiteness, setGessoWhiteness] = useState(0.85);
  const [gessoTexture, setGessoTexture] = useState(0.4);
  const [gessoResponse, setGessoResponse] = useState(0.5);

  return {
    gessoWhiteness,
    setGessoWhiteness,
    gessoTexture,
    setGessoTexture,
    gessoResponse,
    setGessoResponse,
  };
}
