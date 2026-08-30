import { useState, useRef } from 'react';

export function useRadialState() {
  const [radialSizeScale, setRadialSizeScale] = useState(1.0);
  // Hard Edge — replaces the smooth ring-to-ring blend with flat solid
  // bands (a duplicate stop at each color boundary instead of one
  // crossfading stop), for a posterized/Op-Art target look instead of a
  // soft glow.
  const [radialHardEdge, setRadialHardEdge] = useState(false);

  return {
    radialSizeScale,
    setRadialSizeScale,
    radialHardEdge,
    setRadialHardEdge,
  };
}
