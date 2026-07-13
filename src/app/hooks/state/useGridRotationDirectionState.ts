import { useState, useRef } from 'react';

export function useGridRotationDirectionState() {
  const [gridRotationDirection, setGridRotationDirection] = useState<'none' | 'clockwise' | 'counterclockwise'>('none');
  const gridRotationDirectionRef = useRef(gridRotationDirection);

  return {
    gridRotationDirection,
    setGridRotationDirection,
    gridRotationDirectionRef,
  };
}
