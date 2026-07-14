import { useState } from 'react';

export function useInvertState() {
  const [invertAmount, setInvertAmount] = useState(1);

  return {
    invertAmount,
    setInvertAmount,
  };
}
