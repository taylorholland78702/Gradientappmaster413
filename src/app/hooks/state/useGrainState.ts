import { useState, useRef } from 'react';

export function useGrainState() {
  const [grainIntensity, setGrainIntensity] = useState(0.1);
  const [grainType, setGrainType] = useState<'fine' | 'medium' | 'coarse' | 'film'>('medium');
  // Noise block size in screen pixels — was always exactly 1 (a fresh
  // Math.random() sample per pixel, every frame); 1 here reproduces that
  // exact prior default. Larger values clump neighboring pixels into the
  // same noise sample for a chunkier, lower-fidelity grain.
  const [grainSize, setGrainSize] = useState(1);

  return {
    grainIntensity,
    setGrainIntensity,
    grainType,
    setGrainType,
    grainSize,
    setGrainSize,
  };
}
