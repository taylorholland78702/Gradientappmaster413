import { useState } from 'react';

export function useSurrealismState() {
  // Melt — vertical drip/sag strength, 0 (untouched) to 1 (heavy streaking).
  const [surrealMelt, setSurrealMelt] = useState(0.4);
  // Mirror — horizontal mirror-symmetry ghosting strength, 0 (none) to 1
  // (fully mirrored, capped in-effect at a 50/50 blend so it never fully
  // erases the original asymmetry).
  const [surrealMirror, setSurrealMirror] = useState(0.3);

  return {
    surrealMelt,
    setSurrealMelt,
    surrealMirror,
    setSurrealMirror,
  };
}
