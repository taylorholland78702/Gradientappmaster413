import { useState } from 'react';

export function useOilPaintState() {
  // Brush size — the neighborhood radius each pixel scans; larger reads as
  // a bigger, chunkier brush.
  const [oilPaintRadius, setOilPaintRadius] = useState(3);
  // Detail — how many intensity bands the neighborhood scan buckets into;
  // higher gives smoother, more color-accurate daubs, lower gives a more
  // blocky, painterly result.
  const [oilPaintLevels, setOilPaintLevels] = useState(20);

  return {
    oilPaintRadius,
    setOilPaintRadius,
    oilPaintLevels,
    setOilPaintLevels,
  };
}
