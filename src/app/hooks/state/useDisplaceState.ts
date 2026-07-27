import { useState } from 'react';

export function useDisplaceState() {
  const [displaceStrength, setDisplaceStrength] = useState(30);
  const [displaceScale, setDisplaceScale] = useState(3);

  return {
    displaceStrength,
    setDisplaceStrength,
    displaceScale,
    setDisplaceScale,
  };
}
