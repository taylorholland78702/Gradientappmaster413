import { useState, useRef } from 'react';

export function useBlurMotionState() {
  const [blurMotionAmount, setBlurMotionAmount] = useState(40);
  const [blurMotionDirection, setBlurMotionDirection] = useState(250);

  return {
    blurMotionAmount,
    setBlurMotionAmount,
    blurMotionDirection,
    setBlurMotionDirection,
  };
}
