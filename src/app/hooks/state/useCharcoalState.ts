import { useState, useRef } from 'react';

export function useCharcoalState() {
  const [charcoalIntensity, setCharcoalIntensity] = useState(0.5);

  return {
    charcoalIntensity,
    setCharcoalIntensity,
  };
}
