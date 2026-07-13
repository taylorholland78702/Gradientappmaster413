import { useState, useRef } from 'react';

export function useChromaticTrailsState() {
  const [chromaticTrailsDecay, setChromaticTrailsDecay] = useState(0.85);
  const [chromaticTrailsOffset, setChromaticTrailsOffset] = useState(8);
  const chromaticTrailsBufferRef = useRef<HTMLCanvasElement | null>(null);

  return {
    chromaticTrailsDecay,
    setChromaticTrailsDecay,
    chromaticTrailsOffset,
    setChromaticTrailsOffset,
    chromaticTrailsBufferRef,
  };
}
