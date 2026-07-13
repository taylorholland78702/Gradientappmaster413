import { useState, useRef } from 'react';

export function useLiquifyState() {
  const [liquifyStrength, setLiquifyStrength] = useState(30);

  return {
    liquifyStrength,
    setLiquifyStrength,
  };
}
