import { useState, useRef } from 'react';

export function useVignetteState() {
  const [vignetteStrength, setVignetteStrength] = useState(0.5);
  const [vignetteSoftness, setVignetteSoftness] = useState(50);

  return {
    vignetteStrength,
    setVignetteStrength,
    vignetteSoftness,
    setVignetteSoftness,
  };
}
