import { useState, useRef } from 'react';

export function useDigitalNoiseState() {
  const [digitalNoiseIntensity, setDigitalNoiseIntensity] = useState(0.3);

  return {
    digitalNoiseIntensity,
    setDigitalNoiseIntensity,
  };
}
