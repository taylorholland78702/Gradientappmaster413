import { useState } from 'react';

export function useDatamoshState() {
  const [moshBlock, setMoshBlock] = useState(24);
  const [moshSmear, setMoshSmear] = useState(0.7);
  const [moshDrift, setMoshDrift] = useState(0.4);
  const [moshRefresh, setMoshRefresh] = useState(3);

  return {
    moshBlock,
    setMoshBlock,
    moshSmear,
    setMoshSmear,
    moshDrift,
    setMoshDrift,
    moshRefresh,
    setMoshRefresh,
  };
}
