import { useState } from 'react';

export function useSuminagashiState() {
  const [suminagashiAnimTime, setSuminagashiAnimTime] = useState(0);
  const [suminagashiRingCount, setSuminagashiRingCount] = useState(7);
  const [suminagashiCombPasses, setSuminagashiCombPasses] = useState(3);
  const [suminagashiCombStrength, setSuminagashiCombStrength] = useState(0.6);

  return {
    suminagashiAnimTime,
    setSuminagashiAnimTime,
    suminagashiRingCount,
    setSuminagashiRingCount,
    suminagashiCombPasses,
    setSuminagashiCombPasses,
    suminagashiCombStrength,
    setSuminagashiCombStrength,
  };
}
