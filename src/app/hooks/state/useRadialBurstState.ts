import { useState, useRef } from 'react';

export function useRadialBurstState() {
  const [radialBurstCount, setRadialBurstCount] = useState(12);
  const [radialBurstSpread, setRadialBurstSpread] = useState(70);
  const [radialBurstSize, setRadialBurstSize] = useState(70);
  // 'sweep' folds in the former standalone Radar gradient (rotating scan
  // line with a fade trail) as a second mode alongside the default static
  // 'burst' (overlapping radial-gradient blobs) — same precedent as Zoom
  // Blur merging into Blur as a mode. Shares this gradient's color/state
  // plumbing instead of a separate gradient type.
  const [radialBurstMode, setRadialBurstMode] = useState<'burst' | 'sweep'>('burst');

  return {
    radialBurstCount,
    setRadialBurstCount,
    radialBurstSpread,
    setRadialBurstSpread,
    radialBurstSize,
    setRadialBurstSize,
    radialBurstMode,
    setRadialBurstMode,
  };
}
