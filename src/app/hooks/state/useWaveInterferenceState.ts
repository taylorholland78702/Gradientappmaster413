import { useState } from 'react';

export function useWaveInterferenceState() {
  const [waveInterferenceAnimTime, setWaveInterferenceAnimTime] = useState(0);
  const [waveInterferenceSourceCount, setWaveInterferenceSourceCount] = useState(4);
  const [waveInterferenceFrequency, setWaveInterferenceFrequency] = useState(6);
  const [waveInterferenceSpeed, setWaveInterferenceSpeed] = useState(1);

  return {
    waveInterferenceAnimTime, setWaveInterferenceAnimTime,
    waveInterferenceSourceCount, setWaveInterferenceSourceCount,
    waveInterferenceFrequency, setWaveInterferenceFrequency,
    waveInterferenceSpeed, setWaveInterferenceSpeed,
  };
}
