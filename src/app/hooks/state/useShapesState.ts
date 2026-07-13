import { useState, useRef } from 'react';

export function useShapesState() {
  const [shapesSides, setShapesSides] = useState(4);
  const [shapesCount, setShapesCount] = useState(8);

  return {
    shapesSides,
    setShapesSides,
    shapesCount,
    setShapesCount,
  };
}
