import { useState, useRef } from 'react';

export function useGridState() {
  const [gridSides, setGridSides] = useState(4);
  const [gridRows, setGridRows] = useState(6);
  const [gridColumns, setGridColumns] = useState(3);
  const [gridRotation, setGridRotation] = useState(0);
  const [gridVariation, setGridVariation] = useState(0);
  const [gridShapeSize, setGridShapeSize] = useState(25);

  return {
    gridSides,
    setGridSides,
    gridRows,
    setGridRows,
    gridColumns,
    setGridColumns,
    gridRotation,
    setGridRotation,
    gridVariation,
    setGridVariation,
    gridShapeSize,
    setGridShapeSize,
  };
}
