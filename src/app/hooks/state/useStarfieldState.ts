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
  // Multiplies the existing distance-based streak-width formula in
  // applyStarfield.ts (thin near center, thicker near the edge) rather
  // than replacing it — 1 reproduces the prior fixed look exactly.
  const [starfieldSize, setStarfieldSize] = useState(1);
  const starfieldParticlesRef = useRef<Star[]>([]);

  return {
    starfieldCount, setStarfieldCount,
    starfieldSpeed, setStarfieldSpeed,
    starfieldOpacity, setStarfieldOpacity,
    starfieldSize, setStarfieldSize,
    starfieldParticlesRef,
  };
}
