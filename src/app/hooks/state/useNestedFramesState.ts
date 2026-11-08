import { useState } from 'react';

export function useNestedFramesState() {
  const [nestedFramesCount, setNestedFramesCount] = useState(10);
  const [nestedFramesShrink, setNestedFramesShrink] = useState(0.8);
  const [nestedFramesX, setNestedFramesX] = useState(50);
  const [nestedFramesY, setNestedFramesY] = useState(50);
  const [nestedFramesSpeed, setNestedFramesSpeed] = useState(1);

  const [nestedFramesTwist, setNestedFramesTwist] = useState(8);

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
    nestedFramesTwist,
    setNestedFramesTwist,
  };
}
