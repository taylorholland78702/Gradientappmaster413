import { useState, useRef } from 'react';

export function useNoiseState() {
  const [noiseScale, setNoiseScale] = useState(25);
  const [noiseOctaves, setNoiseOctaves] = useState(2);
  const [noiseDirection, setNoiseDirection] = useState(0);
  const [noiseWarp, setNoiseWarp] = useState(0);
  const [noiseType, setNoiseType] = useState<'smooth' | 'ridged' | 'turbulence'>('smooth');

  return {
    noiseScale,
    setNoiseScale,
    noiseOctaves,
    setNoiseOctaves,
    noiseDirection,
    setNoiseDirection,
    noiseWarp,
    setNoiseWarp,
    noiseType,
    setNoiseType,
  };
}
