import { useState } from 'react';

export function useImpastoState() {
  // Bump exaggeration — how strongly local contrast tilts the simulated
  // surface normal; higher reads as thicker, more sculpted paint.
  const [impastoStrength, setImpastoStrength] = useState(3);
  // Light direction in degrees — rotates which side of each brush ridge
  // catches the highlight vs. falls into shadow.
  const [impastoLightAngle, setImpastoLightAngle] = useState(135);

  return {
    impastoStrength,
    setImpastoStrength,
    impastoLightAngle,
    setImpastoLightAngle,
  };
}
