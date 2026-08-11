import { useState, useRef } from 'react';

export function useLightTrailsState() {
  const [lightTrailsDecay, setLightTrailsDecay] = useState(0.92);
  const [lightTrailsThreshold, setLightTrailsThreshold] = useState(0.6);
  const [lightTrailsIntensity, setLightTrailsIntensity] = useState(0.8);
  const lightTrailsBufferRef = useRef<HTMLCanvasElement | null>(null);

  return {
    lightTrailsDecay, setLightTrailsDecay,
    lightTrailsThreshold, setLightTrailsThreshold,
    lightTrailsIntensity, setLightTrailsIntensity,
    lightTrailsBufferRef,
  };
}
