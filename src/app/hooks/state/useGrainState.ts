import { useState, useRef } from 'react';

export function useGrainState() {
  const [grainIntensity, setGrainIntensity] = useState(0.1);
  const [grainType, setGrainType] = useState<'fine' | 'medium' | 'coarse' | 'film'>('medium');

  return {
    grainIntensity,
    setGrainIntensity,
    grainType,
    setGrainType,
  };
}
