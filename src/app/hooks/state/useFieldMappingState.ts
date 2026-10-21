import { useState } from 'react';
import type { ColorBlend } from '../../utils/color';

// Shared post-processing controls for scalar-field gradients (Reaction-
// Diffusion, Marble, Caustics, Topographic, Julia). A single field
// each rather than one per gradient — only one gradient type is ever active
// at a time, so there's no need for e.g. marbleFieldContrast vs
// causticsFieldContrast as separate persisted values.
export function useFieldMappingState() {
  const [fieldContrast, setFieldContrast] = useState(1);
  const [paletteMode, setPaletteMode] = useState<'linear' | 'banded' | 'cyclic'>('linear');
  const [paletteBands, setPaletteBands] = useState(5);
  // How adjacent palette colors blend (sRGB/OKLab/OKLCH) — applies to every
  // gradient, not just the scalar-field ones this hook is otherwise for, but
  // it sits next to paletteMode since both are "how the palette is sampled."
  const [colorBlend, setColorBlend] = useState<ColorBlend>('srgb');

  return {
    fieldContrast,
    setFieldContrast,
    paletteMode,
    setPaletteMode,
    paletteBands,
    setPaletteBands,
    colorBlend,
    setColorBlend,
  };
}
