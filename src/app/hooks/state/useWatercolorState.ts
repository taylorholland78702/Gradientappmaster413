import { useState } from 'react';

export function useWatercolorState() {
  const [watercolorAnimTime, setWatercolorAnimTime] = useState(0);
  const [watercolorBlobCount, setWatercolorBlobCount] = useState(9);
  const [watercolorBleedRadius, setWatercolorBleedRadius] = useState(0.18);
  const [watercolorOpacity, setWatercolorOpacity] = useState(0.55);

  return {
    watercolorAnimTime,
    setWatercolorAnimTime,
    watercolorBlobCount,
    setWatercolorBlobCount,
    watercolorBleedRadius,
    setWatercolorBleedRadius,
    watercolorOpacity,
    setWatercolorOpacity,
  };
}
