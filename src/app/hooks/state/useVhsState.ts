import { useState, useRef } from 'react';

export function useVhsState() {
  const [vhsGlitchIntensity, setVhsGlitchIntensity] = useState(0.2);
  // Horizontal tear-offset magnitude — was hardcoded as a flat ×300
  // multiplier on intensity in applyVhs.ts, fusing "how many glitches" and
  // "how far they shift" into the one Intensity slider. 300 here
  // reproduces that exact prior default.
  const [vhsJitterAmount, setVhsJitterAmount] = useState(300);

  return {
    vhsGlitchIntensity,
    setVhsGlitchIntensity,
    vhsJitterAmount,
    setVhsJitterAmount,
  };
}
