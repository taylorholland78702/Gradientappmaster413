import { useState } from 'react';

export function useFuturismState() {
  // Echoes — how many repeated copies stack along the motion vector.
  const [futurismEchoes, setFuturismEchoes] = useState(5);
  // Spread — px distance between each echo.
  const [futurismSpread, setFuturismSpread] = useState(14);

  return {
    futurismEchoes,
    setFuturismEchoes,
    futurismSpread,
    setFuturismSpread,
  };
}
