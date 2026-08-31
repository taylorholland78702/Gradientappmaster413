import { useState } from 'react';

// Donald Judd — identical units at precise, regular intervals. Bar count,
// gap fraction, bar width, and audio Response are the only params;
// orientation reuses the shared gradientAngle control like Color Field
// did.
export function useStackState() {
  const [stackCount, setStackCount] = useState(16);
  const [stackGap, setStackGap] = useState(0.3);
  const [stackWidth, setStackWidth] = useState(1);
  const [stackResponse, setStackResponse] = useState(0.6);

  return {
    stackCount,
    setStackCount,
    stackGap,
    setStackGap,
    stackWidth,
    setStackWidth,
    stackResponse,
    setStackResponse,
  };
}
