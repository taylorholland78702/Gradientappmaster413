import { useState, useRef } from 'react';

export function useDitherState() {
  const [ditherType, setDitherType] = useState<'bayer' | 'floyd-steinberg'>('bayer');
  const [ditherLevels, setDitherLevels] = useState(2); // Color depth levels

  return {
    ditherType,
    setDitherType,
    ditherLevels,
    setDitherLevels,
  };
}
