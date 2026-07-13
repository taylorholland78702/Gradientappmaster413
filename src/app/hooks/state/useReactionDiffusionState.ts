import { useState, useRef } from 'react';

export function useReactionDiffusionState() {
  const [reactionDiffusionFeed, setReactionDiffusionFeed] = useState(0.037);
  const [reactionDiffusionKill, setReactionDiffusionKill] = useState(0.06);
  const [reactionDiffusionSpeed, setReactionDiffusionSpeed] = useState(1);

  return {
    reactionDiffusionFeed,
    setReactionDiffusionFeed,
    reactionDiffusionKill,
    setReactionDiffusionKill,
    reactionDiffusionSpeed,
    setReactionDiffusionSpeed,
  };
}
