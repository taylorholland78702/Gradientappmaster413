import { useState, useRef } from 'react';

export function useAngleState() {
  const [angleStartOffset, setAngleStartOffset] = useState(0);
  const [angleCenterX, setAngleCenterX] = useState(50);
  const [angleCenterY, setAngleCenterY] = useState(50);

  return {
    angleStartOffset,
    setAngleStartOffset,
    angleCenterX,
    setAngleCenterX,
    angleCenterY,
    setAngleCenterY,
  };
}
