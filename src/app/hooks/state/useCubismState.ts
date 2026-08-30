import { useState } from 'react';

export function useCubismState() {
  // Facet Size — grid cell size (px) each facet is carved from; smaller
  // means more, tinier planes.
  const [cubismFacetSize, setCubismFacetSize] = useState(28);
  // Offset — how far each facet samples from its own position, as a
  // fraction of facet size. 0 leaves each facet reading its own spot
  // (just flat-shaded and seamed); higher scrambles which plane shows what.
  const [cubismOffset, setCubismOffset] = useState(0.4);

  return {
    cubismFacetSize,
    setCubismFacetSize,
    cubismOffset,
    setCubismOffset,
  };
}
