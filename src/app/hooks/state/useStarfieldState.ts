import { useState, useRef } from 'react';

interface Star {
  angle: number;
  dist: number;
  speed: number;
  colorIndex: number;
}

export function useStarfieldState() {
  const [starfieldCount, setStarfieldCount] = useState(100);
  const [starfieldSpeed, setStarfieldSpeed] = useState(1.2);
  const [starfieldOpacity, setStarfieldOpacity] = useState(0.85);
  const starfieldParticlesRef = useRef<Star[]>([]);

  return {
    starfieldCount, setStarfieldCount,
    starfieldSpeed, setStarfieldSpeed,
    starfieldOpacity, setStarfieldOpacity,
    starfieldParticlesRef,
  };
}
