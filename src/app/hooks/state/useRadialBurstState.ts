import { useState, useRef } from 'react';

export function useRadialBurstState() {
  const [radialBurstCount, setRadialBurstCount] = useState(12);
  const [radialBurstSpread, setRadialBurstSpread] = useState(70);
  const [radialBurstSize, setRadialBurstSize] = useState(70);

  return {
    radialBurstCount,
    setRadialBurstCount,
    radialBurstSpread,
    setRadialBurstSpread,
    radialBurstSize,
    setRadialBurstSize,
  };
}
