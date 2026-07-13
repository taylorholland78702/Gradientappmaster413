import { useState, useRef } from 'react';

export function useMarbleState() {
  const [marbleAnimTime, setMarbleAnimTime] = useState(0);
  const [marbleVeinFreq, setMarbleVeinFreq] = useState(2);
  const [marbleTurbulence, setMarbleTurbulence] = useState(1.5);
  const [marbleOctaves, setMarbleOctaves] = useState(5);

  return {
    marbleAnimTime,
    setMarbleAnimTime,
    marbleVeinFreq,
    setMarbleVeinFreq,
    marbleTurbulence,
    setMarbleTurbulence,
    marbleOctaves,
    setMarbleOctaves,
  };
}
