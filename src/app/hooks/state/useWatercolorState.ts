import { useState } from 'react';

export type WatercolorStyle = 'watercolor' | 'gouache' | 'ink-wash';

export function useWatercolorState() {
  // Bleed — max displacement (px) pigment spreads away from a color edge;
  // flat washes barely move regardless of this value.
  const [watercolorBleed, setWatercolorBleed] = useState(3);
  // Grain — paper-texture strength, 0 (smooth) to 1 (heavily fibrous).
  const [watercolorGrain, setWatercolorGrain] = useState(0.4);
  // Style — Watercolor/Gouache/Ink Wash all share the same warp+smear+
  // pooling+grain pipeline (applyWatercolor.ts); this only selects which
  // multipliers and finishing pass (posterize/desaturate) it uses.
  const [watercolorStyle, setWatercolorStyle] = useState<WatercolorStyle>('gouache');

  return {
    watercolorBleed,
    setWatercolorBleed,
    watercolorGrain,
    setWatercolorGrain,
    watercolorStyle,
    setWatercolorStyle,
  };
}
