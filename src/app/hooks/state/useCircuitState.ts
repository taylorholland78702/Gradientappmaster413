import { useState } from 'react';

export function useCircuitState() {
  const [circuitAnimTime, setCircuitAnimTime] = useState(0);
  const [circuitBranchCount, setCircuitBranchCount] = useState(6);
  const [circuitMaxDepth, setCircuitMaxDepth] = useState(4);
  const [circuitGlowIntensity, setCircuitGlowIntensity] = useState(1);

  return {
    circuitAnimTime,
    setCircuitAnimTime,
    circuitBranchCount,
    setCircuitBranchCount,
    circuitMaxDepth,
    setCircuitMaxDepth,
    circuitGlowIntensity,
    setCircuitGlowIntensity,
  };
}
