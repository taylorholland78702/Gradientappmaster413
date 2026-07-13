import { useState, useRef } from 'react';

export function useHexGridState() {
  const [hexGridSize, setHexGridSize] = useState(20);

  return {
    hexGridSize,
    setHexGridSize,
  };
}
