import { useState } from 'react';

export function useCrtState() {
  const [crtIntensity, setCrtIntensity] = useState(0.6);

  return {
    crtIntensity,
    setCrtIntensity,
  };
}
