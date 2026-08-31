import { useState, useRef } from 'react';

export function useFisheyeState() {
  // Was 0.5 — 5% up a 0-10 track, reading as "off" at a glance even though
  // it's a real (if mild) distortion. 2 sits at a more legible position on
  // the slider while still being a moderate, non-extreme default.
  const [fisheyeStrength, setFisheyeStrength] = useState(2);
  const [fisheyeCenterX, setFisheyeCenterX] = useState(50);
  const [fisheyeCenterY, setFisheyeCenterY] = useState(50);

  return {
    fisheyeStrength,
    setFisheyeStrength,
    fisheyeCenterX,
    setFisheyeCenterX,
    fisheyeCenterY,
    setFisheyeCenterY,
  };
}
