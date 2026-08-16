import { useState, useRef } from 'react';

export function useColorState() {
  const [colorShiftHue, setColorShiftHue] = useState(5);

  // Global palette adjustments — applied to the whole gradientColors array
  // at a single point in useCanvasDraw (see adjustPalette in utils/color.ts),
  // not per-gradient. Defaults match "no adjustment": 0 hue, 100% saturation,
  // 0 brightness, 0 contrast.
  const [paletteHue, setPaletteHue] = useState(0);
  const [paletteSaturation, setPaletteSaturation] = useState(100);
  const [paletteBrightness, setPaletteBrightness] = useState(0);
  const [paletteContrast, setPaletteContrast] = useState(0);

  return {
    colorShiftHue,
    setColorShiftHue,
    paletteHue,
    setPaletteHue,
    paletteSaturation,
    setPaletteSaturation,
    paletteBrightness,
    setPaletteBrightness,
    paletteContrast,
    setPaletteContrast,
  };
}
