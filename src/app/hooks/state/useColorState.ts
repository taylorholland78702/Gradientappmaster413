import { useState, useRef } from 'react';

export function useColorState() {
  const [colorShiftHue, setColorShiftHue] = useState(5);

  return {
    colorShiftHue,
    setColorShiftHue,
  };
}
