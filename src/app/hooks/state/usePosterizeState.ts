import { useState, useRef } from 'react';

export function usePosterizeState() {
  const [posterizeLevels, setPosterizeLevels] = useState(10);
  const [posterizeSolarize, setPosterizeSolarize] = useState(0);

  return {
    posterizeLevels,
    setPosterizeLevels,
    posterizeSolarize,
    setPosterizeSolarize,
  };
}
