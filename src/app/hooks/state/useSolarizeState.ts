import { useState, useRef } from 'react';

export function useSolarizeState() {
  const [solarizeThreshold, setSolarizeThreshold] = useState(128);

  return {
    solarizeThreshold,
    setSolarizeThreshold,
  };
}
