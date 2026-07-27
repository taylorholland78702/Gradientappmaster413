import { useState, useRef } from 'react';

export function useSlitScanState() {
  const [slitScanIntensity, setSlitScanIntensity] = useState(7);
  const [slitScanDirection, setSlitScanDirection] = useState<'horizontal' | 'vertical' | 'radial' | 'circular'>('radial');
  const [slitScanAnimTrigger, setSlitScanAnimTrigger] = useState(0); // Animation trigger for continuous updates
  const slitScanBufferRef = useRef<ImageData[]>([]);

  return {
    slitScanIntensity,
    setSlitScanIntensity,
    slitScanDirection,
    setSlitScanDirection,
    slitScanAnimTrigger,
    setSlitScanAnimTrigger,
    slitScanBufferRef,
  };
}
