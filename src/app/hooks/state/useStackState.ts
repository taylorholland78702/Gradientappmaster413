import { useState } from 'react';

// Donald Judd — identical units at precise, regular intervals. Bar count,
// gap fraction, and audio Response are the only params; orientation reuses
// the shared gradientAngle control like Color Field does.
export function useStackState() {
  const [stackCount, setStackCount] = useState(16);
  const [stackGap, setStackGap] = useState(0.3);
  const [stackResponse, setStackResponse] = useState(0.6);

  return {
    stackCount,
    setStackCount,
    stackGap,
    setStackGap,
    stackResponse,
    setStackResponse,
  };
}
