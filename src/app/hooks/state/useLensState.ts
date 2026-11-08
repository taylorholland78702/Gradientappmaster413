import { useState } from 'react';

export function useLensState() {
  const [lensMode, setLensMode] = useState<'bulge' | 'pinch' | 'twirl' | 'sphere'>('bulge');
  const [lensStrength, setLensStrength] = useState(0.6);
  const [lensRadius, setLensRadius] = useState(60);
  const [lensX, setLensX] = useState(50);
  const [lensY, setLensY] = useState(50);
  const [lensSpeed, setLensSpeed] = useState(0.3);

  return {
    lensMode,
    setLensMode,
    lensStrength,
    setLensStrength,
    lensRadius,
    setLensRadius,
    lensX,
    setLensX,
    lensY,
    setLensY,
    lensSpeed,
    setLensSpeed,
  };
}
