import { useState, useRef } from 'react';

export function useJuliaState() {
  const [juliaReal, setJuliaReal] = useState(-0.7);
  const [juliaImaginary, setJuliaImaginary] = useState(0.27);
  const [juliaZoom, setJuliaZoom] = useState(1);
  const [juliaIterations, setJuliaIterations] = useState(60);
  const juliaCanvasRef = useRef<HTMLCanvasElement | null>(null);

  return {
    juliaReal,
    setJuliaReal,
    juliaImaginary,
    setJuliaImaginary,
    juliaZoom,
    setJuliaZoom,
    juliaIterations,
    setJuliaIterations,
    juliaCanvasRef,
  };
}
