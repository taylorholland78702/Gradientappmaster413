import { useState, useRef } from 'react';

export function useLightLeakState() {
  const [lightLeakIntensity, setLightLeakIntensity] = useState(0.5);

  return {
    lightLeakIntensity,
    setLightLeakIntensity,
  };
}
