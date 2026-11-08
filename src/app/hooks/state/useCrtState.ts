import { useState } from 'react';

export function useCrtState() {
  const [crtIntensity, setCrtIntensity] = useState(0.6);
  // Scanline period in pixels — was hardcoded to every 2nd row (applyCrt.ts's
  // `y % 2`); 2 here reproduces that exact default.
  const [crtScanlineSpacing, setCrtScanlineSpacing] = useState(2);

  const [crtCurve, setCrtCurve] = useState(0);
  const [crtGlow, setCrtGlow] = useState(0);
  const [crtBleed, setCrtBleed] = useState(0);
  const [crtFlicker, setCrtFlicker] = useState(0);

  return {
    crtIntensity,
    setCrtIntensity,
    crtScanlineSpacing,
    setCrtScanlineSpacing,
    crtCurve,
    setCrtCurve,
    crtGlow,
    setCrtGlow,
    crtBleed,
    setCrtBleed,
    crtFlicker,
    setCrtFlicker,
  };
}
