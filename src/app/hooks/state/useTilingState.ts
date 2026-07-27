import { useState } from 'react';

export function useTilingState() {
  const [tilingSize, setTilingSize] = useState(120);
  const [tilingSymmetry, setTilingSymmetry] = useState(6);
  const [tilingComplexity, setTilingComplexity] = useState(3);
  const [tilingRotation, setTilingRotation] = useState(0);
  return {
    tilingSize, setTilingSize,
    tilingSymmetry, setTilingSymmetry,
    tilingComplexity, setTilingComplexity,
    tilingRotation, setTilingRotation,
  };
}
