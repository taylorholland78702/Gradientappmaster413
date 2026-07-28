import { useState, useRef } from 'react';

export function useLightningState() {
  const [lightningAnimTime, setLightningAnimTime] = useState(0);
  const [lightningBoltCount, setLightningBoltCount] = useState(3);
  const [lightningJitter, setLightningJitter] = useState(0.5);
  const [lightningBranchiness, setLightningBranchiness] = useState(0.35);
  const lightningBufferRef = useRef<HTMLCanvasElement | null>(null);
  const lightningBoltsRef = useRef<{ life: number; maxLife: number; x1: number; y1: number; x2: number; y2: number; seed: number }[]>([]);

  return {
    lightningAnimTime,
    setLightningAnimTime,
    lightningBoltCount,
    setLightningBoltCount,
    lightningJitter,
    setLightningJitter,
    lightningBranchiness,
    setLightningBranchiness,
    lightningBufferRef,
    lightningBoltsRef,
  };
}
