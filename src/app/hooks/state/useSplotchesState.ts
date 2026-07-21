import { useState } from 'react';

export function useSplotchesState() {
  const [splotchesAnimTime, setSplotchesAnimTime] = useState(0);
  const [splotchCount, setSplotchCount] = useState(8);
  const [splotchSize, setSplotchSize] = useState(0.16);
  const [splotchEdgeRoughness, setSplotchEdgeRoughness] = useState(0.4);

  return {
    splotchesAnimTime,
    setSplotchesAnimTime,
    splotchCount,
    setSplotchCount,
    splotchSize,
    setSplotchSize,
    splotchEdgeRoughness,
    setSplotchEdgeRoughness,
  };
}
