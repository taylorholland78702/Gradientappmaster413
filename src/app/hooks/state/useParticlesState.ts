import { useState, useRef } from 'react';

export function useParticlesState() {
  const [particlesCount, setParticlesCount] = useState(120);
  const [particlesSpeed, setParticlesSpeed] = useState(1);
  const [particlesSize, setParticlesSize] = useState(3);
  const [particlesTrail, setParticlesTrail] = useState(0.08);
  const [particlesGravity, setParticlesGravity] = useState(0);
  // 1 = short line, 2 = circle, 3-8 = regular polygon (triangle..octagon)
  const [particlesSides, setParticlesSides] = useState(2);
  const particlesBufferRef = useRef<HTMLCanvasElement | null>(null);
  const particlesPointsRef = useRef<{ x: number; y: number; vx: number; vy: number }[]>([]);
  // 'drift' is the classic spawn/velocity/gravity particle system above;
  // 'flow-field' folds in the former standalone Flow Field gradient —
  // particles instead follow a smoothly-varying noise direction field and
  // draw as stroked line trails rather than filled shapes. 'marks' is a
  // Lee Ufan-inspired treatment: a handful of fixed, deliberately-placed
  // marks that sit dormant in mostly-empty space and only bloom on an
  // audio onset, then decay — restraint and the mark/void relationship
  // instead of continuous motion. Same mode-toggle pattern as Windmill's
  // 'blades'/'helix'.
  const [particlesMode, setParticlesMode] = useState<'drift' | 'flow-field' | 'marks'>('drift');
  const [marksCount, setMarksCount] = useState(8);
  const [marksSize, setMarksSize] = useState(40);
  const [marksDecay, setMarksDecay] = useState(0.94);
  const marksStateRef = useRef<{
    marks: { nx: number; ny: number; level: number }[];
    baseline: number;
    cooldown: number;
    index: number;
    time: number;
  }>({ marks: [], baseline: 0, cooldown: 0, index: 0, time: 0 });

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
    particlesSides,
    setParticlesSides,
    particlesBufferRef,
    particlesPointsRef,
    particlesMode,
    setParticlesMode,
    marksCount,
    setMarksCount,
    marksSize,
    setMarksSize,
    marksDecay,
    setMarksDecay,
    marksStateRef,
  };
}
