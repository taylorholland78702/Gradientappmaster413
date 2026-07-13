import { useState, useRef } from 'react';

export function useCausticsState() {
  const [causticsAnimTime, setCausticsAnimTime] = useState(0);
  const [causticsBrightness, setCausticsBrightness] = useState(1.5);
  const [causticsScale, setCausticsScale] = useState(5);

  return {
    causticsAnimTime,
    setCausticsAnimTime,
    causticsBrightness,
    setCausticsBrightness,
    causticsScale,
    setCausticsScale,
  };
}
