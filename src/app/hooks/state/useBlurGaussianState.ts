import { useState, useRef } from 'react';

export function useBlurGaussianState() {
  const [blurGaussianAmount, setBlurGaussianAmount] = useState(7);

  return {
    blurGaussianAmount,
    setBlurGaussianAmount,
  };
}
