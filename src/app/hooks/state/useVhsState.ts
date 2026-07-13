import { useState, useRef } from 'react';

export function useVhsState() {
  const [vhsGlitchIntensity, setVhsGlitchIntensity] = useState(0.2);

  return {
    vhsGlitchIntensity,
    setVhsGlitchIntensity,
  };
}
