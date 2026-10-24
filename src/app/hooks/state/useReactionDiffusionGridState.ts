import { useState, useRef } from 'react';
import type { RDGLState } from '../gradients/drawReactionDiffusionGL';

export function useReactionDiffusionGridState() {
  const reactionDiffusionGridRef = useRef<{
    u: Float32Array; v: Float32Array; u2: Float32Array; v2: Float32Array; canvas: HTMLCanvasElement; time: number;
    // Populated lazily by drawReactionDiffusionGL.ts when the WebGL path is in use.
    gl?: RDGLState;
  } | null>(null);

  return {
    reactionDiffusionGridRef,
  };
}
