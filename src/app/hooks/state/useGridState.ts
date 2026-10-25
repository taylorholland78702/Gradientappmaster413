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
  // Hard Edge — fills each cell with one flat color instead of blending
  // across it, turning the grid into a solid-color mosaic (Mondrian-style)
  // instead of a field of tiny gradients.
  const [gridHardEdge, setGridHardEdge] = useState(false);
  // How fast the Grid effect spins when a rotation direction is on (1 = the original pace).
  const [gridEffectSpeed, setGridEffectSpeed] = useState(1);

  return {
    gridEffectSpeed,
    setGridEffectSpeed,
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
    gridHardEdge,
    setGridHardEdge,
  };
}
