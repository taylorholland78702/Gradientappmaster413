import { useState, useRef } from 'react';

export function useReactionDiffusionGridState() {
  const reactionDiffusionGridRef = useRef<{
    u: Float32Array; v: Float32Array; u2: Float32Array; v2: Float32Array; canvas: HTMLCanvasElement;
  } | null>(null);

  return {
    reactionDiffusionGridRef,
  };
}
