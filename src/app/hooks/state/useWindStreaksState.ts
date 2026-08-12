import { useState, useRef } from 'react';

interface Streak {
  x: number;
  y: number;
  vx: number;
  vy: number;
  colorIndex: number;
}

export function useWindStreaksState() {
  const [windStreaksCount, setWindStreaksCount] = useState(50);
  const [windStreaksSpeed, setWindStreaksSpeed] = useState(1.5);
  const [windStreaksOpacity, setWindStreaksOpacity] = useState(0.8);
  const windStreaksBufferRef = useRef<HTMLCanvasElement | null>(null);
  const windStreaksParticlesRef = useRef<Streak[]>([]);

  return {
    windStreaksCount, setWindStreaksCount,
    windStreaksSpeed, setWindStreaksSpeed,
    windStreaksOpacity, setWindStreaksOpacity,
    windStreaksBufferRef,
    windStreaksParticlesRef,
  };
}
