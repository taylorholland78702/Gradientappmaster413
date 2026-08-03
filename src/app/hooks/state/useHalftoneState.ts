import { useState, useRef } from 'react';

export function useHalftoneState() {
  const [halftoneSize, setHalftoneSize] = useState(10);
  const [halftoneVariation, setHalftoneVariation] = useState(0);
  const [halftoneMove, setHalftoneMove] = useState(false);
  const [halftoneMoveSpeed, setHalftoneMoveSpeed] = useState(1);
  const [halftoneCMYK, setHalftoneCMYK] = useState(false);
  const halftoneTimeRef = useRef<number>(0);
  const halftoneMoveRef = useRef(halftoneMove);

  return {
    halftoneSize,
    setHalftoneSize,
    halftoneVariation,
    setHalftoneVariation,
    halftoneMove,
    setHalftoneMove,
    halftoneMoveSpeed,
    setHalftoneMoveSpeed,
    halftoneCMYK,
    setHalftoneCMYK,
    halftoneTimeRef,
    halftoneMoveRef,
  };
}
