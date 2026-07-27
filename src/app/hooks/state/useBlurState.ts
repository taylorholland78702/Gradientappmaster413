import { useState, useRef } from 'react';

export function useBlurState() {
  const [blurType, setBlurType] = useState<'gaussian' | 'motion' | 'radial' | 'zoom'>('gaussian');

  return {
    blurType,
    setBlurType,
  };
}
