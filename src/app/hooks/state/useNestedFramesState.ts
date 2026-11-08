import { useState } from 'react';

export function useNestedFramesState() {
  const [nestedFramesCount, setNestedFramesCount] = useState(7);
  const [nestedFramesShrink, setNestedFramesShrink] = useState(0.82);
  const [nestedFramesX, setNestedFramesX] = useState(50);
  const [nestedFramesY, setNestedFramesY] = useState(50);
  const [nestedFramesSpeed, setNestedFramesSpeed] = useState(0.5);

  return {
    nestedFramesCount,
    setNestedFramesCount,
    nestedFramesShrink,
    setNestedFramesShrink,
    nestedFramesX,
    setNestedFramesX,
    nestedFramesY,
    setNestedFramesY,
    nestedFramesSpeed,
    setNestedFramesSpeed,
  };
}
