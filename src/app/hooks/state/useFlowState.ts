import { useState, useRef } from 'react';

export function useFlowState() {
  const [flowerCircles, setFlowerCircles] = useState(3);
  const [flowerScale, setFlowerScale] = useState(0.8);
  const [flowerSpread, setFlowerSpread] = useState(0.6);
  const [flowerRotation, setFlowerRotation] = useState(0);
  // Circles-per-layer multiplier — was hardcoded to 6 (hexagonal symmetry).
  // 4/8/12 give square/octagonal/dodecagonal lattices instead.
  const [flowerSymmetry, setFlowerSymmetry] = useState(6);
  // Multiplies all three alpha stops (fill center/edge, outline) — was no
  // control at all, always the same fixed opacity.
  const [flowerOpacity, setFlowerOpacity] = useState(1);
  const [flowerAnimTime, setFlowerAnimTime] = useState(0);
  const [flowAnimTime, setFlowAnimTime] = useState(0);
  const [flowParticleCount, setFlowParticleCount] = useState(250);
  const [flowSpeed, setFlowSpeed] = useState(1);
  const [flowScale, setFlowScale] = useState(3);
  const [flowThickness, setFlowThickness] = useState(1.5);

  return {
    flowerCircles,
    setFlowerCircles,
    flowerScale,
    setFlowerScale,
    flowerSpread,
    setFlowerSpread,
    flowerRotation,
    setFlowerRotation,
    flowerSymmetry,
    setFlowerSymmetry,
    flowerOpacity,
    setFlowerOpacity,
    flowerAnimTime,
    setFlowerAnimTime,
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
