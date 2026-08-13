import { useState, useRef } from 'react';

interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotSpeed: number;
  size: number;
  shape: 0 | 1;
  colorIndex: number;
  wobblePhase: number;
  life: number;
  maxLife: number;
}

export function useConfettiState() {
  const [confettiCount, setConfettiCount] = useState(80);
  const [confettiSpeed, setConfettiSpeed] = useState(1);
  const [confettiOpacity, setConfettiOpacity] = useState(0.9);
  const confettiParticlesRef = useRef<ConfettiPiece[]>([]);

  return {
    confettiCount, setConfettiCount,
    confettiSpeed, setConfettiSpeed,
    confettiOpacity, setConfettiOpacity,
    confettiParticlesRef,
  };
}
