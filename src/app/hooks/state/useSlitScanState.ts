import { useState, useRef } from 'react';

export function useSlitScanState() {
  const [slitScanIntensity, setSlitScanIntensity] = useState(7);
  const [slitScanDirection, setSlitScanDirection] = useState<'horizontal' | 'vertical' | 'radial' | 'circular'>('radial');
  // How many past frames the effect reaches back into — was hardcoded to a
  // flat 60-frame buffer cap in applySlitScan.ts; 60 here reproduces that
  // exact prior default. A shorter history reads as a tighter, snappier
  // time-warp; longer reaches further back for a slower, more melted look.
  const [slitScanHistory, setSlitScanHistory] = useState(60);
  const slitScanBufferRef = useRef<ImageData[]>([]);

  return {
    slitScanIntensity,
    setSlitScanIntensity,
    slitScanDirection,
    setSlitScanDirection,
    slitScanHistory,
    setSlitScanHistory,
    slitScanBufferRef,
  };
}
