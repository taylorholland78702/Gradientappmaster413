import { useState, useRef } from 'react';

export function useDustState() {
  const [dustCrackleIntensity, setDustCrackleIntensity] = useState(0.3);
  const [dustSize, setDustSize] = useState(5);
  // Length multiplier on each crack's random-walk step count (was a fixed
  // 10-40 steps) and the crack line color (was hardcoded black) — only
  // intensity was previously exposed.
  const [dustCrackleLength, setDustCrackleLength] = useState(1);
  const [dustCrackleColor, setDustCrackleColor] = useState('#000000');

  return {
    dustCrackleIntensity,
    setDustCrackleIntensity,
    dustSize,
    setDustSize,
    dustCrackleLength,
    setDustCrackleLength,
    dustCrackleColor,
    setDustCrackleColor,
  };
}
