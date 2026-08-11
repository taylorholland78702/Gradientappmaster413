import { useState } from 'react';

export function usePixelSortState() {
  const [pixelSortThreshold, setPixelSortThreshold] = useState(0.5);
  const [pixelSortIntensity, setPixelSortIntensity] = useState(0.6);
  const [pixelSortDirection, setPixelSortDirection] = useState<'horizontal' | 'vertical'>('horizontal');

  return {
    pixelSortThreshold, setPixelSortThreshold,
    pixelSortIntensity, setPixelSortIntensity,
    pixelSortDirection, setPixelSortDirection,
  };
}
