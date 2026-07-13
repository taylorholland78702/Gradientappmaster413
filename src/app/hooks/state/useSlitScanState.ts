import { useState, useRef } from 'react';

export function useSlitScanState() {
  const [slitScanIntensity, setSlitScanIntensity] = useState(0.5);
  const [slitScanDirection, setSlitScanDirection] = useState<'horizontal' | 'vertical' | 'radial' | 'circular'>('horizontal');
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
