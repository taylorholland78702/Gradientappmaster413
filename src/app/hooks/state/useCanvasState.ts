import { useState, useRef } from 'react';

export function useCanvasState() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return {
    canvasRef,
  };
}
