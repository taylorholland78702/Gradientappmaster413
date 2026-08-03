import { useState, useRef } from 'react';

export function useSlitScanState() {
  const [slitScanIntensity, setSlitScanIntensity] = useState(7);
  const [slitScanDirection, setSlitScanDirection] = useState<'horizontal' | 'vertical' | 'radial' | 'circular'>('radial');
  const slitScanBufferRef = useRef<ImageData[]>([]);

  return {
    slitScanIntensity,
    setSlitScanIntensity,
    slitScanDirection,
    setSlitScanDirection,
    slitScanBufferRef,
  };
}
