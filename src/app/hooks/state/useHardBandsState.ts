import { useState } from 'react';

export function useHardBandsState() {
  const [hardBandsSteps, setHardBandsSteps] = useState(5);
  const [hardBandsBlend, setHardBandsBlend] = useState(0);

  return {
    hardBandsSteps,
    setHardBandsSteps,
    hardBandsBlend,
    setHardBandsBlend,
  };
}
