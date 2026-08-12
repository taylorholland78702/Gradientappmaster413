import { useState } from 'react';

export function useAuraGlowState() {
  const [auraGlowCount, setAuraGlowCount] = useState(3);
  const [auraGlowSpeed, setAuraGlowSpeed] = useState(1);
  const [auraGlowOpacity, setAuraGlowOpacity] = useState(0.8);

  return {
    auraGlowCount, setAuraGlowCount,
    auraGlowSpeed, setAuraGlowSpeed,
    auraGlowOpacity, setAuraGlowOpacity,
  };
}
