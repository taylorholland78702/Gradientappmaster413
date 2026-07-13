import { useState, useRef } from 'react';

export function usePlasmaState() {
  const [plasmaSpeed, setPlasmaSpeed] = useState(1);
  const [plasmaComplexity, setPlasmaComplexity] = useState(5);
  const [plasmaZoomScale, setPlasmaZoomScale] = useState(1);

  return {
    plasmaSpeed,
    setPlasmaSpeed,
    plasmaComplexity,
    setPlasmaComplexity,
    plasmaZoomScale,
    setPlasmaZoomScale,
  };
}
