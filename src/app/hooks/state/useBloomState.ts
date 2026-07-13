import { useState, useRef } from 'react';

export function useBloomState() {
  const [bloomIntensity, setBloomIntensity] = useState(0.7);
  const [bloomRadius, setBloomRadius] = useState(12);

  return {
    bloomIntensity,
    setBloomIntensity,
    bloomRadius,
    setBloomRadius,
  };
}
