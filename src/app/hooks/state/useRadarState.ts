import { useState, useRef } from 'react';

export function useRadarState() {
  const [radarSweepAngle, setRadarSweepAngle] = useState(0);
  const [radarFadeLength, setRadarFadeLength] = useState(90);
  const [radarBeamWidth, setRadarBeamWidth] = useState(30);

  return {
    radarSweepAngle,
    setRadarSweepAngle,
    radarFadeLength,
    setRadarFadeLength,
    radarBeamWidth,
    setRadarBeamWidth,
  };
}
