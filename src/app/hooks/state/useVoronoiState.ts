import { useState, useRef } from 'react';

export function useVoronoiState() {
  const [voronoiCellCount, setVoronoiCellCount] = useState(19);
  const [voronoiDistortion, setVoronoiDistortion] = useState(100);
  const [voronoiMorphSpeed, setVoronoiMorphSpeed] = useState(1);
  const [voronoiAnimTime, setVoronoiAnimTime] = useState(0);

  return {
    voronoiCellCount,
    setVoronoiCellCount,
    voronoiDistortion,
    setVoronoiDistortion,
    voronoiMorphSpeed,
    setVoronoiMorphSpeed,
    voronoiAnimTime,
    setVoronoiAnimTime,
  };
}
