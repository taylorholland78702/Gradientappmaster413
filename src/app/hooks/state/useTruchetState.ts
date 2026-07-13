import { useState, useRef } from 'react';

export function useTruchetState() {
  const [truchetSize, setTruchetSize] = useState(40);
  const [truchetVariation, setTruchetVariation] = useState(0.5);
  const [truchetThickness, setTruchetThickness] = useState(4);

  return {
    truchetSize,
    setTruchetSize,
    truchetVariation,
    setTruchetVariation,
    truchetThickness,
    setTruchetThickness,
  };
}
