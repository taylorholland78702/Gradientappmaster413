import { useState, useRef } from 'react';

export function useReactionDiffusionGridState() {
  const reactionDiffusionGridRef = useRef<{
    u: Float32Array; v: Float32Array; u2: Float32Array; v2: Float32Array; canvas: HTMLCanvasElement; time: number;
    // Populated lazily by drawReactionDiffusionGL.ts when the WebGL path is
    // in use (see its capability check) — left untyped here since only that
    // module needs to know its shape, same as the untyped `P: any` draw
    // context every gradient/effect function already receives.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gl?: any;
  } | null>(null);

  return {
    reactionDiffusionGridRef,
  };
}
