import { useState, useRef } from 'react';

export function useWaveState() {
  const waveNumberRef = useRef<number>(20);
  const waveRotationRef = useRef<number>(45);
  const [waveScale, setWaveScale] = useState(1.0);
  const [waveAmplitude, setWaveAmplitude] = useState(44);
  const [waveFrequency, setWaveFrequency] = useState(5);
  const [waveNumber, setWaveNumber] = useState(20);
  const [waveRotation, setWaveRotation] = useState(45);
  const [waveDistortionStrength, setWaveDistortionStrength] = useState(100);
  const [waveDistortionRotation, setWaveDistortionRotation] = useState(200);

  return {
    waveNumberRef,
    waveRotationRef,
    waveScale,
    setWaveScale,
    waveAmplitude,
    setWaveAmplitude,
    waveFrequency,
    setWaveFrequency,
    waveNumber,
    setWaveNumber,
    waveRotation,
    setWaveRotation,
    waveDistortionStrength,
    setWaveDistortionStrength,
    waveDistortionRotation,
    setWaveDistortionRotation,
  };
}
