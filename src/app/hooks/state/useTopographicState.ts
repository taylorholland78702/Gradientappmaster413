import { useState, useRef } from 'react';

export function useTopographicState() {
  const [topographicScale, setTopographicScale] = useState(40);
  const [topographicBands, setTopographicBands] = useState(10);
  const [topographicLineWidth, setTopographicLineWidth] = useState(0.04);

  return {
    topographicScale,
    setTopographicScale,
    topographicBands,
    setTopographicBands,
    topographicLineWidth,
    setTopographicLineWidth,
  };
}
