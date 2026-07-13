import { useState, useRef } from 'react';

export function useAuroraState() {
  const [auroraAnimTime, setAuroraAnimTime] = useState(0);
  const [auroraBandCount, setAuroraBandCount] = useState(6);
  const [auroraWaveSpeed, setAuroraWaveSpeed] = useState(0.2);
  const [auroraBandHeight, setAuroraBandHeight] = useState(1);

  return {
    auroraAnimTime,
    setAuroraAnimTime,
    auroraBandCount,
    setAuroraBandCount,
    auroraWaveSpeed,
    setAuroraWaveSpeed,
    auroraBandHeight,
    setAuroraBandHeight,
  };
}
