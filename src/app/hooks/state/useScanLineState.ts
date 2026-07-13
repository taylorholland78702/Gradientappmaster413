import { useState, useRef } from 'react';

export function useScanLineState() {
  const [scanlineIntensity, setScanlineIntensity] = useState(0.4);
  const [scanlineSpacing, setScanlineSpacing] = useState(4);
  const [scanlineSpeed, setScanlineSpeed] = useState(1);
  const [scanLineSize, setScanLineSize] = useState(4);

  return {
    scanlineIntensity,
    setScanlineIntensity,
    scanlineSpacing,
    setScanlineSpacing,
    scanlineSpeed,
    setScanlineSpeed,
    scanLineSize,
    setScanLineSize,
  };
}
