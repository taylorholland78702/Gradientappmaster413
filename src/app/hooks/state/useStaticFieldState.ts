import { useState } from 'react';

export function useStaticFieldState() {
  const [staticFieldIntensity, setStaticFieldIntensity] = useState(0.4);
  const [staticFieldBarSpeed, setStaticFieldBarSpeed] = useState(1);
  const [staticFieldOpacity, setStaticFieldOpacity] = useState(0.5);

  return {
    staticFieldIntensity, setStaticFieldIntensity,
    staticFieldBarSpeed, setStaticFieldBarSpeed,
    staticFieldOpacity, setStaticFieldOpacity,
  };
}
