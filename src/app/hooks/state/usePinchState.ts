import { useState, useRef } from 'react';

export function usePinchState() {
  const [pinchStrength, setPinchStrength] = useState(0.5);

  return {
    pinchStrength,
    setPinchStrength,
  };
}
