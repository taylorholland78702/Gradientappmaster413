import { useState, useRef } from 'react';

export function useTwistState() {
  const [twistAmount, setTwistAmount] = useState(2);

  return {
    twistAmount,
    setTwistAmount,
  };
}
