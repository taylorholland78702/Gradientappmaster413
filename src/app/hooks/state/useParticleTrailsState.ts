import { useState, useRef } from 'react';

interface TrailParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  colorIndex: number;
  size: number;
}

export function useParticleTrailsState() {
  const [particleTrailsCount, setParticleTrailsCount] = useState(40);
  const [particleTrailsSpeed, setParticleTrailsSpeed] = useState(1);
  const [particleTrailsOpacity, setParticleTrailsOpacity] = useState(0.6);
  const particleTrailsBufferRef = useRef<HTMLCanvasElement | null>(null);
  const particleTrailsParticlesRef = useRef<TrailParticle[]>([]);

  return {
    particleTrailsCount, setParticleTrailsCount,
    particleTrailsSpeed, setParticleTrailsSpeed,
    particleTrailsOpacity, setParticleTrailsOpacity,
    particleTrailsBufferRef,
    particleTrailsParticlesRef,
  };
}
