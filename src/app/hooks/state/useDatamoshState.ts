import { useState } from 'react';

export function useDatamoshState() {
  // Block Size — px dimension of each corruption block.
  const [datamoshBlockSize, setDatamoshBlockSize] = useState(16);
  // Amount — fraction of blocks affected, 0 (none) to 1 (nearly all).
  const [datamoshAmount, setDatamoshAmount] = useState(0.3);

  return {
    datamoshBlockSize,
    setDatamoshBlockSize,
    datamoshAmount,
    setDatamoshAmount,
  };
}
