import { useState } from 'react';

export function useCrtState() {
  const [crtIntensity, setCrtIntensity] = useState(0.6);
  // Scanline period in pixels — was hardcoded to every 2nd row (applyCrt.ts's
  // `y % 2`); 2 here reproduces that exact default.
  const [crtScanlineSpacing, setCrtScanlineSpacing] = useState(2);

  return {
    crtIntensity,
    setCrtIntensity,
    crtScanlineSpacing,
    setCrtScanlineSpacing,
  };
}
