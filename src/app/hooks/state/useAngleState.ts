import { useState, useRef } from 'react';

export function useAngleState() {
  const [angleStartOffset, setAngleStartOffset] = useState(0);
  const [angleCenterX, setAngleCenterX] = useState(50);
  const [angleCenterY, setAngleCenterY] = useState(50);
  // Hard Edge — snaps each pixel to its nearest color stop instead of
  // blending toward the next one, turning the smooth conic sweep into flat
  // pie-slice wedges (pinwheel/Op-Art look).
  const [angleHardEdge, setAngleHardEdge] = useState(false);

  return {
    angleStartOffset,
    setAngleStartOffset,
    angleCenterX,
    setAngleCenterX,
    angleCenterY,
    setAngleCenterY,
    angleHardEdge,
    setAngleHardEdge,
  };
}
