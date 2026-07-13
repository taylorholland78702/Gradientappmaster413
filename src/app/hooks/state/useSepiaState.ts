import { useState, useRef } from 'react';

export function useSepiaState() {
  const [sepiaIntensity, setSepiaIntensity] = useState(1);

  return {
    sepiaIntensity,
    setSepiaIntensity,
  };
}
