import { useState, useRef } from 'react';

export function useDiffusionGridState() {
  const diffusionGridRef = useRef<{a: number[][], b: number[][], width: number, height: number} | null>(null);

  return {
    diffusionGridRef,
  };
}
