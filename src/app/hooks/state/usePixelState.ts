import { useState, useRef } from 'react';

export function usePixelState() {
  const [pixelSize, setPixelSize] = useState(20);
  const [pixelateScaleDirection, setPixelateScaleDirection] = useState<'out' | 'in'>('out');

  return {
    pixelSize,
    setPixelSize,
    pixelateScaleDirection,
    setPixelateScaleDirection,
  };
}
