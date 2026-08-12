import { useState } from 'react';

export function useTriangleFieldState() {
  const [triangleFieldGridSize, setTriangleFieldGridSize] = useState(10);
  const [triangleFieldSpeed, setTriangleFieldSpeed] = useState(1);
  const [triangleFieldOpacity, setTriangleFieldOpacity] = useState(0.5);

  return {
    triangleFieldGridSize, setTriangleFieldGridSize,
    triangleFieldSpeed, setTriangleFieldSpeed,
    triangleFieldOpacity, setTriangleFieldOpacity,
  };
}
