import { useState } from 'react';
import { DEFAULT_PALETTE_BIAS, DEFAULT_PALETTE_SHARP, type ColorBlend } from '../../utils/color';

// Shared post-processing controls for scalar-field gradients (Reaction-
// Diffusion, Marble, Caustics, Topographic, Julia). A single field
// each rather than one per gradient — only one gradient type is ever active
// at a time, so there's no need for e.g. marbleFieldContrast vs
// causticsFieldContrast as separate persisted values.
export function useFieldMappingState() {
  const [fieldContrast, setFieldContrast] = useState(1);
  const [paletteMode, setPaletteMode] = useState<'linear' | 'banded' | 'cyclic'>('linear');
  const [paletteBands, setPaletteBands] = useState(5);
  // How adjacent palette colors blend (sRGB/OKLab/OKLCH) — OKLab by default,
  // so a fresh session gets even, non-muddy transitions; applies to every
  // gradient, not just the scalar-field ones this hook is otherwise for, but
  // it sits next to paletteMode since both are "how the palette is sampled."
  const [colorBlend, setColorBlend] = useState<ColorBlend>('oklab');
  // Palette mapping (see paletteSegmentFor in utils/color.ts): where each color
  // sits along the ramp (null = evenly spaced; also ignored if its length no
  // longer matches the palette), plus Bias and Sharpness. Defaults reproduce the
  // original even, linear mapping.
  const [paletteStops, setPaletteStops] = useState<number[] | null>(null);
  const [paletteBias, setPaletteBias] = useState(DEFAULT_PALETTE_BIAS);
  const [paletteSharp, setPaletteSharp] = useState(DEFAULT_PALETTE_SHARP);
  // Shared Scale/Speed for the styled-field gradients (Smoke, Glass, Mesh, ...
  // — see drawStyleFieldGL.ts), which have no per-style sliders of their own.
  const [fieldScale, setFieldScale] = useState(1);
  const [fieldSpeed, setFieldSpeed] = useState(1);
  // The two shape sliders each styled gradient has (constants/styleShapeControls.ts),
  // kept per gradient id as [A, B] so switching away and back keeps them; 1 = original look.
  // Exposure (stops) and tone curve applied by the styled-field shaders before output.
  const [fieldExposure, setFieldExposure] = useState(0);
  // Brightness / contrast / saturation of the finished image (1 = unchanged), applied with Exposure and Tone.
  const [fieldGrade, setFieldGrade] = useState<{ brightness: number; contrast: number; saturation: number }>({ brightness: 1, contrast: 1, saturation: 1 });
  const [fieldTone, setFieldTone] = useState<'off' | 'aces' | 'soft'>('off');
  const [fieldShapes, setFieldShapes] = useState<Record<string, [number, number]>>({});

  return {
    fieldContrast,
    setFieldContrast,
    paletteMode,
    setPaletteMode,
    paletteBands,
    setPaletteBands,
    colorBlend,
    setColorBlend,
    paletteStops,
    setPaletteStops,
    paletteBias,
    setPaletteBias,
    paletteSharp,
    setPaletteSharp,
    fieldScale,
    setFieldScale,
    fieldSpeed,
    setFieldSpeed,
    fieldShapes,
    setFieldShapes,
    fieldExposure,
    fieldGrade,
    setFieldGrade,
    setFieldExposure,
    fieldTone,
    setFieldTone,
  };
}
