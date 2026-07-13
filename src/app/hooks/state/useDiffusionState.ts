import { useState, useRef } from 'react';

export function useDiffusionState() {
  const [diffusionSpeed, setDiffusionSpeed] = useState(1);
  const [diffusionFeed, setDiffusionFeed] = useState(0.055);
  const [diffusionKill, setDiffusionKill] = useState(0.062);
  const [diffusionAnimTrigger, setDiffusionAnimTrigger] = useState(0); // Animation trigger for continuous updates

  return {
    diffusionSpeed,
    setDiffusionSpeed,
    diffusionFeed,
    setDiffusionFeed,
    diffusionKill,
    setDiffusionKill,
    diffusionAnimTrigger,
    setDiffusionAnimTrigger,
  };
}
