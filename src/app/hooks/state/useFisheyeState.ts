import { useState, useRef } from 'react';

export function useFisheyeState() {
  const [fisheyeStrength, setFisheyeStrength] = useState(0.5);
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
