import { useState } from 'react';

export function useWaveState() {
  const [waveDistortionStrength, setWaveDistortionStrength] = useState(100);
  const [waveDistortionRotation, setWaveDistortionRotation] = useState(200);

  return {
    waveDistortionStrength,
    setWaveDistortionStrength,
    waveDistortionRotation,
    setWaveDistortionRotation,
  };
}
