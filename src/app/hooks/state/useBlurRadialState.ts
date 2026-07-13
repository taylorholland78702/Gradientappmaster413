import { useState, useRef } from 'react';

export function useBlurRadialState() {
  const [blurRadialAmount, setBlurRadialAmount] = useState(5);

  return {
    blurRadialAmount,
    setBlurRadialAmount,
  };
}
