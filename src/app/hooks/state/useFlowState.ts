import { useState, useRef } from 'react';

export function useFlowState() {
  const [flowerCircles, setFlowerCircles] = useState(3);
  const [flowerScale, setFlowerScale] = useState(0.8);
  const [flowerSpread, setFlowerSpread] = useState(0.6);
  const [flowerRotation, setFlowerRotation] = useState(0);
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
