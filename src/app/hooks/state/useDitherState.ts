import { useState, useRef } from 'react';

export function useDitherState() {
  const [ditherType, setDitherType] = useState<'bayer' | 'floyd-steinberg'>('bayer');
  const [ditherLevels, setDitherLevels] = useState(2); // Color depth levels
  // Bayer pattern block size — was hardcoded to sample the 4x4 ordered-
  // dither matrix at 1 screen pixel per matrix cell (ditherPixels.ts's
  // `y % 4`/`x % 4`); only affects the 'bayer' type, not Floyd-Steinberg
  // (error-diffusion has no fixed pattern to scale). 1 reproduces the
  // exact prior default.
  const [ditherScale, setDitherScale] = useState(1);

  return {
    ditherType,
    setDitherType,
    ditherLevels,
    setDitherLevels,
    ditherScale,
    setDitherScale,
  };
}
