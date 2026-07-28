import { useState, useRef } from 'react';

export function useFireworksState() {
  const [fireworksAnimTime, setFireworksAnimTime] = useState(0);
  const [fireworksCount, setFireworksCount] = useState(6);
  const [fireworksParticleCount, setFireworksParticleCount] = useState(40);
  const [fireworksTrailFade, setFireworksTrailFade] = useState(0.12);
  const fireworksBufferRef = useRef<HTMLCanvasElement | null>(null);
  const fireworksParticlesRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number; r: number; g: number; b: number }[]>([]);

  return {
    fireworksAnimTime,
    setFireworksAnimTime,
    fireworksCount,
    setFireworksCount,
    fireworksParticleCount,
    setFireworksParticleCount,
    fireworksTrailFade,
    setFireworksTrailFade,
    fireworksBufferRef,
    fireworksParticlesRef,
  };
}
