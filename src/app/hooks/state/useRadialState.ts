import { useState, useRef } from 'react';

export function useRadialState() {
  const [radialSizeScale, setRadialSizeScale] = useState(1.0);

  return {
    radialSizeScale,
    setRadialSizeScale,
  };
}
