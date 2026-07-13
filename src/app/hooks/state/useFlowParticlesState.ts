import { useState, useRef } from 'react';

export function useFlowParticlesState() {
  const flowParticlesRef = useRef<{ x: number; y: number }[]>([]);

  return {
    flowParticlesRef,
  };
}
