import { useState, useRef } from 'react';

export function useChromaticState() {
  const [chromaticOffset, setChromaticOffset] = useState(100);
  const [chromaticAngle, setChromaticAngle] = useState(0);

  return {
    chromaticOffset,
    setChromaticOffset,
    chromaticAngle,
    setChromaticAngle,
  };
}
