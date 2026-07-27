import { useState, useRef } from 'react';

export function useTriangleState() {
  const [triangleSize, setTriangleSize] = useState(40);
  // Fraction of cells that flip to the other diagonal split — 0 keeps the
  // uniform look, higher values give an organic/irregular woven pattern
  // similar in spirit to Halftone's halftoneVariation.
  const [triangulateVariation, setTriangulateVariation] = useState(0);

  return {
    triangleSize,
    setTriangleSize,
    triangulateVariation,
    setTriangulateVariation,
  };
}
