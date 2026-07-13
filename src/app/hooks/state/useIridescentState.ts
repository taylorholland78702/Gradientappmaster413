import { useState, useRef } from 'react';

export function useIridescentState() {
  const [iridescentAngle, setIridescentAngle] = useState(45);
  const [iridescentIntensity, setIridescentIntensity] = useState(0.8);
  const [iridescentScale, setIridescentScale] = useState(2);

  return {
    iridescentAngle,
    setIridescentAngle,
    iridescentIntensity,
    setIridescentIntensity,
    iridescentScale,
    setIridescentScale,
  };
}
