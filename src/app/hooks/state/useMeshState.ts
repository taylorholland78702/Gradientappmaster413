import { useState, useRef } from 'react';

export function useMeshState() {
  const [meshGridSize, setMeshGridSize] = useState(4);
  const [meshJitter, setMeshJitter] = useState(0);

  return {
    meshGridSize,
    setMeshGridSize,
    meshJitter,
    setMeshJitter,
  };
}
