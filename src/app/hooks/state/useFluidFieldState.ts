import { useState } from 'react';

export function useFluidFieldState() {
  const [fluidFieldScale, setFluidFieldScale] = useState(3);
  const [fluidFieldSpeed, setFluidFieldSpeed] = useState(1);
  const [fluidFieldOpacity, setFluidFieldOpacity] = useState(0.5);

  return {
    fluidFieldScale, setFluidFieldScale,
    fluidFieldSpeed, setFluidFieldSpeed,
    fluidFieldOpacity, setFluidFieldOpacity,
  };
}
