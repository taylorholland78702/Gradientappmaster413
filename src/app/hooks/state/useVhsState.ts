import { useState, useRef } from 'react';

export function useVhsState() {
  const [vhsGlitchIntensity, setVhsGlitchIntensity] = useState(0.2);
  // Horizontal tear-offset magnitude — was hardcoded as a flat ×300
  // multiplier on intensity in applyVhs.ts, fusing "how many glitches" and
  // "how far they shift" into the one Intensity slider. 300 here
  // reproduces that exact prior default.
  const [vhsJitterAmount, setVhsJitterAmount] = useState(300);

  const [vhsBleed, setVhsBleed] = useState(0);
  const [vhsNoise, setVhsNoise] = useState(0);
  const [vhsTracking, setVhsTracking] = useState(0);
  const [vhsDropouts, setVhsDropouts] = useState(0);

  return {
    vhsGlitchIntensity,
    setVhsGlitchIntensity,
    vhsJitterAmount,
    setVhsJitterAmount,
    vhsBleed,
    setVhsBleed,
    vhsNoise,
    setVhsNoise,
    vhsTracking,
    setVhsTracking,
    vhsDropouts,
    setVhsDropouts,
  };
}
