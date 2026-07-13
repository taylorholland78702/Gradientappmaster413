import { useState, useRef } from 'react';

export function useDustState() {
  const [dustCrackleIntensity, setDustCrackleIntensity] = useState(0.3);
  const [dustSize, setDustSize] = useState(5);

  return {
    dustCrackleIntensity,
    setDustCrackleIntensity,
    dustSize,
    setDustSize,
  };
}
