import { useState, useRef } from 'react';

export function useFlowBufferState() {
  const flowBufferRef = useRef<HTMLCanvasElement | null>(null);

  return {
    flowBufferRef,
  };
}
