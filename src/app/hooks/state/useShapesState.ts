import { useState, useRef } from 'react';

export function useShapesState() {
  const [shapesSides, setShapesSides] = useState(4);
  const [shapesCount, setShapesCount] = useState(8);
  // 'polygon' is the classic concentric-shapes look (shapesSides/shapesCount/
  // concentricRingWidth); 'polar-grid' folds in the former standalone Polar
  // Grid gradient — circular rings each subdivided into angular sectors
  // (polygon2Sides/concentricRingCount), same mode-toggle pattern as
  // Windmill's 'blades'/'helix' and Radial Burst's 'burst'/'sweep'.
  const [shapesMode, setShapesMode] = useState<'polygon' | 'polar-grid'>('polygon');

  return {
    shapesSides,
    setShapesSides,
    shapesCount,
    setShapesCount,
    shapesMode,
    setShapesMode,
  };
}
