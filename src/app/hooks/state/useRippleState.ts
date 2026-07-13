import { useState, useRef } from 'react';

export function useRippleState() {
  const [rippleAmplitude, setRippleAmplitude] = useState(20);
  const [rippleFrequency, setRippleFrequency] = useState(0.015);
  const rippleRingsRef = useRef<{ phase: number; strength: number }[]>([]);
  const rippleAutoFrameRef = useRef(0);

  return {
    rippleAmplitude,
    setRippleAmplitude,
    rippleFrequency,
    setRippleFrequency,
    rippleRingsRef,
    rippleAutoFrameRef,
  };
}
