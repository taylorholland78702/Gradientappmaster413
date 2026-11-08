import { useState, useRef } from 'react';

export function usePosterizeState() {
  const [posterizeLevels, setPosterizeLevels] = useState(10);
  const [posterizeSolarize, setPosterizeSolarize] = useState(0);

  const [posterizeMode, setPosterizeMode] = useState<'levels' | 'palette'>('levels');

  return {
    posterizeLevels,
    setPosterizeLevels,
    posterizeSolarize,
    setPosterizeSolarize,
    posterizeMode,
    setPosterizeMode,
  };
}
