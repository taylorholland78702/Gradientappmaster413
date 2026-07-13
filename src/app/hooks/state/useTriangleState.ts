import { useState, useRef } from 'react';

export function useTriangleState() {
  const [triangleSize, setTriangleSize] = useState(40);

  return {
    triangleSize,
    setTriangleSize,
  };
}
