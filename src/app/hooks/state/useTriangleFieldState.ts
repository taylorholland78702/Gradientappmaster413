import { useState } from 'react';

export function useTriangleFieldState() {
  const [triangleFieldGridSize, setTriangleFieldGridSize] = useState(10);
  const [triangleFieldSpeed, setTriangleFieldSpeed] = useState(1);
  const [triangleFieldOpacity, setTriangleFieldOpacity] = useState(0.5);
  // Degrees/frame the whole mesh spins around its center — 0 by default
  // (no rotation), separate from Speed (which only drives the per-vertex
  // jitter phase, not any whole-mesh transform).
  const [triangleFieldRotation, setTriangleFieldRotation] = useState(0);

  return {
    triangleFieldGridSize, setTriangleFieldGridSize,
    triangleFieldSpeed, setTriangleFieldSpeed,
    triangleFieldOpacity, setTriangleFieldOpacity,
    triangleFieldRotation, setTriangleFieldRotation,
  };
}
