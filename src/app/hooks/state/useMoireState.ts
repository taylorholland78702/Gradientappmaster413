import { useState, useRef } from 'react';

export function useMoireState() {
  const [moireAnimTime, setMoireAnimTime] = useState(0);
  const [moireScale, setMoireScale] = useState(10);
  const [moireOffset, setMoireOffset] = useState(30);
  const [moireSpeed, setMoireSpeed] = useState(1);

  return {
    moireAnimTime,
    setMoireAnimTime,
    moireScale,
    setMoireScale,
    moireOffset,
    setMoireOffset,
    moireSpeed,
    setMoireSpeed,
  };
}
