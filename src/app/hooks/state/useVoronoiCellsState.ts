import { useState, useRef } from 'react';

interface CellSeed {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function useVoronoiCellsState() {
  const [voronoiCellsCount, setVoronoiCellsCount] = useState(7);
  const [voronoiCellsSpeed, setVoronoiCellsSpeed] = useState(1);
  const [voronoiCellsOpacity, setVoronoiCellsOpacity] = useState(0.7);
  const voronoiCellsSeedsRef = useRef<CellSeed[]>([]);

  return {
    voronoiCellsCount, setVoronoiCellsCount,
    voronoiCellsSpeed, setVoronoiCellsSpeed,
    voronoiCellsOpacity, setVoronoiCellsOpacity,
    voronoiCellsSeedsRef,
  };
}
