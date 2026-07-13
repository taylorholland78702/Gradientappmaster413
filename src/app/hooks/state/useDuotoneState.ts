import { useState, useRef } from 'react';

export function useDuotoneState() {
  const [duotoneIntensity, setDuotoneIntensity] = useState(1);
  const [duotoneColor1, setDuotoneColor1] = useState('#000033'); // Dark blue
  const [duotoneColor2, setDuotoneColor2] = useState('#FF6B35'); // Orange
  const [duotoneColor3, setDuotoneColor3] = useState('#F7F7FF'); // Near white
  const [duotoneThreeColor, setDuotoneThreeColor] = useState(false);

  return {
    duotoneIntensity,
    setDuotoneIntensity,
    duotoneColor1,
    setDuotoneColor1,
    duotoneColor2,
    setDuotoneColor2,
    duotoneColor3,
    setDuotoneColor3,
    duotoneThreeColor,
    setDuotoneThreeColor,
  };
}
