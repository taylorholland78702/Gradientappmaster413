import { useState } from 'react';

export function useBrushStrokesState() {
  // Stroke thickness / grid spacing — larger reads as a bigger, chunkier
  // brush with fewer, more visible daubs.
  const [brushStrokesSize, setBrushStrokesSize] = useState(14);
  // Elongation multiplier — how many times longer than thick each stroke
  // is; higher reads as longer, more sweeping strokes.
  const [brushStrokesLength, setBrushStrokesLength] = useState(2.2);

  return {
    brushStrokesSize,
    setBrushStrokesSize,
    brushStrokesLength,
    setBrushStrokesLength,
  };
}
