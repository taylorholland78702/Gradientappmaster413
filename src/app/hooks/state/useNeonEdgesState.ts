import { useState } from 'react';

export function useNeonEdgesState() {
  const [neonStrength, setNeonStrength] = useState(2);
  const [neonGlow, setNeonGlow] = useState(6);
  const [neonDim, setNeonDim] = useState(0.85);

  return {
    neonStrength,
    setNeonStrength,
    neonGlow,
    setNeonGlow,
    neonDim,
    setNeonDim,
  };
}
