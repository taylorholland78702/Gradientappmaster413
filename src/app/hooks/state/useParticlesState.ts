import { useState, useRef } from 'react';

export function useParticlesState() {
  const [particlesCount, setParticlesCount] = useState(120);
  const [particlesSpeed, setParticlesSpeed] = useState(1);
  const [particlesSize, setParticlesSize] = useState(3);
  const [particlesTrail, setParticlesTrail] = useState(0.08);
  const [particlesGravity, setParticlesGravity] = useState(0);
  const particlesBufferRef = useRef<HTMLCanvasElement | null>(null);
  const particlesPointsRef = useRef<{ x: number; y: number; vx: number; vy: number }[]>([]);

  return {
    particlesCount,
    setParticlesCount,
    particlesSpeed,
    setParticlesSpeed,
    particlesSize,
    setParticlesSize,
    particlesTrail,
    setParticlesTrail,
    particlesGravity,
    setParticlesGravity,
    particlesBufferRef,
    particlesPointsRef,
  };
}
