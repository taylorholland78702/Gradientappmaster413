import { useState } from 'react';

export function usePolarWarpState() {
  const [polarMode, setPolarMode] = useState<'tunnel' | 'unwrap'>('tunnel');
  const [polarRepeat, setPolarRepeat] = useState(2);
  const [polarTwist, setPolarTwist] = useState(0.3);
  const [polarX, setPolarX] = useState(50);
  const [polarY, setPolarY] = useState(50);
  const [polarSpeed, setPolarSpeed] = useState(0.5);

  return {
    polarMode,
    setPolarMode,
    polarRepeat,
    setPolarRepeat,
    polarTwist,
    setPolarTwist,
    polarX,
    setPolarX,
    polarY,
    setPolarY,
    polarSpeed,
    setPolarSpeed,
  };
}
