import { useState, useRef } from 'react';

export function useLiquidState() {
  const [liquidAnimTime, setLiquidAnimTime] = useState(0);
  const [liquidStrength, setLiquidStrength] = useState(30);
  const [liquidScale, setLiquidScale] = useState(3);
  const [liquidSpeed, setLiquidSpeed] = useState(1);

  return {
    liquidAnimTime,
    setLiquidAnimTime,
    liquidStrength,
    setLiquidStrength,
    liquidScale,
    setLiquidScale,
    liquidSpeed,
    setLiquidSpeed,
  };
}
