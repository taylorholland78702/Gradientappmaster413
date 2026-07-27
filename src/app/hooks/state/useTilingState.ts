import { useState } from 'react';

export function useTilingState() {
  const [tilingSize, setTilingSize] = useState(120);
  const [tilingSymmetry, setTilingSymmetry] = useState(6);
  const [tilingComplexity, setTilingComplexity] = useState(3);
  const [tilingRotation, setTilingRotation] = useState(0);
  // Auto-incrementing accumulator added on top of the user's static
  // tilingRotation slider value when PLAY is active — same split as
  // Flower's flowerRotation (base) + flowerAnimTime (auto-spin).
  const [tilingAnimTime, setTilingAnimTime] = useState(0);
  const [tilingRowOffset, setTilingRowOffset] = useState(0);
  return {
    tilingSize, setTilingSize,
    tilingSymmetry, setTilingSymmetry,
    tilingComplexity, setTilingComplexity,
    tilingRotation, setTilingRotation,
    tilingAnimTime, setTilingAnimTime,
    tilingRowOffset, setTilingRowOffset,
  };
}
