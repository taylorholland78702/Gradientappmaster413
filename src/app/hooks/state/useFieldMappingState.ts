import { useState } from 'react';

// Shared post-processing controls for scalar-field gradients (Reaction-
// Diffusion, Marble, Caustics, Topographic, Julia). A single field
// each rather than one per gradient — only one gradient type is ever active
// at a time, so there's no need for e.g. marbleFieldContrast vs
// causticsFieldContrast as separate persisted values.
export function useFieldMappingState() {
  const [fieldContrast, setFieldContrast] = useState(1);
  const [paletteMode, setPaletteMode] = useState<'linear' | 'banded' | 'cyclic'>('linear');
  const [paletteBands, setPaletteBands] = useState(5);

  return {
    fieldContrast,
    setFieldContrast,
    paletteMode,
    setPaletteMode,
    paletteBands,
    setPaletteBands,
  };
}
