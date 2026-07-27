import { useState, useRef } from 'react';

export function useGridState() {
  const [gridSides, setGridSides] = useState(7);
  const [gridRows, setGridRows] = useState(25);
  const [gridColumns, setGridColumns] = useState(25);
  const [gridRotation, setGridRotation] = useState(0);
  const [gridVariation, setGridVariation] = useState(0);
  const [gridShapeSize, setGridShapeSize] = useState(52);
  // Per-cell rotation stagger — was hardcoded to 30deg in drawGrid.ts
  // (herringbone look); 0deg gives uniform bands, 90deg gives a
  // checkerboard-like alternation.
  const [gridCellAngleStep, setGridCellAngleStep] = useState(30);

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
    gridCellAngleStep,
    setGridCellAngleStep,
  };
}
