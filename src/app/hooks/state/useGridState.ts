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
  // 'classic' is the existing per-cell gradient mosaic; 'martin' folds in
  // an Agnes Martin-style treatment — a pale wash blended toward white,
  // overlaid with a fine hairline grid whose opacity breathes gently with
  // mids. Reuses gridRows/gridColumns for hairline density rather than
  // adding new sliders. Same mode-toggle pattern as Windmill's
  // 'blades'/'helix'.
  const [gridMode, setGridMode] = useState<'classic' | 'martin'>('classic');

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
    gridHardEdge,
    setGridHardEdge,
    gridMode,
    setGridMode,
  };
}
