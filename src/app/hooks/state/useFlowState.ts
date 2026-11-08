import { useState, useRef } from 'react';

export function useFlowState() {
  // Circles-per-layer multiplier — was hardcoded to 6 (hexagonal symmetry).
  // 4/8/12 give square/octagonal/dodecagonal lattices instead.
  // Multiplies all three alpha stops (fill center/edge, outline) — was no
  // control at all, always the same fixed opacity.
  const [flowAnimTime, setFlowAnimTime] = useState(0);
  const [flowParticleCount, setFlowParticleCount] = useState(250);
  const [flowSpeed, setFlowSpeed] = useState(1);
  const [flowScale, setFlowScale] = useState(3);
  const [flowThickness, setFlowThickness] = useState(1.5);

  return {
    flowAnimTime,
    setFlowAnimTime,
    flowParticleCount,
    setFlowParticleCount,
    flowSpeed,
    setFlowSpeed,
    flowScale,
    setFlowScale,
    flowThickness,
    setFlowThickness,
  };
}
