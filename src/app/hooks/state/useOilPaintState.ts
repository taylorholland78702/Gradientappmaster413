import { useState } from 'react';

export function useOilPaintState() {
  const [oilPaintStrength, setOilPaintStrength] = useState(5);

  return {
    oilPaintStrength,
    setOilPaintStrength,
  };
}
