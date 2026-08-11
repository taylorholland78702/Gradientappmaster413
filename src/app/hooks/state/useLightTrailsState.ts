import { useState, useRef } from 'react';

export function useLightTrailsState() {
  // 0.97 gives a fade half-life of ~34 frames (~0.6s at 60fps) — long
  // enough for a moving highlight to leave a visible streak instead of
  // vanishing almost as fast as it's drawn (see applyLightTrails.ts).
  const [lightTrailsDecay, setLightTrailsDecay] = useState(0.97);
  const [lightTrailsThreshold, setLightTrailsThreshold] = useState(0.6);
  const [lightTrailsIntensity, setLightTrailsIntensity] = useState(1);
  const lightTrailsBufferRef = useRef<HTMLCanvasElement | null>(null);

  return {
    lightTrailsDecay, setLightTrailsDecay,
    lightTrailsThreshold, setLightTrailsThreshold,
    lightTrailsIntensity, setLightTrailsIntensity,
    lightTrailsBufferRef,
  };
}
