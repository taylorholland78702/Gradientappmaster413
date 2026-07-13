import { useState, useRef } from 'react';

export function useHelixState() {
  const [helixTurns, setHelixTurns] = useState(3);
  const [helixTightness, setHelixTightness] = useState(2);

  return {
    helixTurns,
    setHelixTurns,
    helixTightness,
    setHelixTightness,
  };
}
