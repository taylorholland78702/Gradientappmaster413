import { useState } from 'react';

// Shared structural-variation seed for the gradients that are otherwise fully
// deterministic functions of their sliders and time (Marble, Caustics,
// Topographic, Voronoi, Plasma, Metaballs) — these have no built-in
// randomization to reroll, unlike Attractor/Flow Field/Reaction-Diffusion
// which already seed themselves with Math.random() on mount. A single
// shared field, same reasoning as useFieldMappingState: only one gradient
// type is ever active at a time.
export function useStructuralSeedState() {
  const [structuralSeed, setStructuralSeed] = useState(0);

  return {
    structuralSeed,
    setStructuralSeed,
  };
}
