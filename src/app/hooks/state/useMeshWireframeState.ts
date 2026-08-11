import { useState } from 'react';

export function useMeshWireframeState() {
  const [meshWireframeAnimTime, setMeshWireframeAnimTime] = useState(0);
  const [meshWireframeGridSize, setMeshWireframeGridSize] = useState(10);
  const [meshWireframeJitter, setMeshWireframeJitter] = useState(0.4);
  const [meshWireframeLineWidth, setMeshWireframeLineWidth] = useState(1);

  return {
    meshWireframeAnimTime, setMeshWireframeAnimTime,
    meshWireframeGridSize, setMeshWireframeGridSize,
    meshWireframeJitter, setMeshWireframeJitter,
    meshWireframeLineWidth, setMeshWireframeLineWidth,
  };
}
