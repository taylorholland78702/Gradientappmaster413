import { useState, useRef } from 'react';
import type { ColorPin } from '../../components/InteractiveGradient';

export function useColorPinState() {
  const [colorPins, setColorPins] = useState<ColorPin[]>([
    { id: '1', x: 0.3, y: 0.3, color: { r: 255, g: 100, b: 100 }, radius: 300 },
    { id: '2', x: 0.7, y: 0.7, color: { r: 100, g: 100, b: 255 }, radius: 300 },
    { id: '3', x: 0.5, y: 0.5, color: { r: 100, g: 255, b: 100 }, radius: 300 },
  ]);

  return {
    colorPins,
    setColorPins,
  };
}
