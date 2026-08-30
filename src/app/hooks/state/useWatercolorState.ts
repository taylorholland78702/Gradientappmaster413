import { useState } from 'react';

export function useWatercolorState() {
  // Bleed — max displacement (px) pigment spreads away from a color edge;
  // flat washes barely move regardless of this value.
  const [watercolorBleed, setWatercolorBleed] = useState(3);
  // Grain — paper-texture strength, 0 (smooth) to 1 (heavily fibrous).
  const [watercolorGrain, setWatercolorGrain] = useState(0.4);

  return {
    watercolorBleed,
    setWatercolorBleed,
    watercolorGrain,
    setWatercolorGrain,
  };
}
