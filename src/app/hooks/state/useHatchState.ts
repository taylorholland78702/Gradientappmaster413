import { useState } from 'react';

// Sol LeWitt — Layers (1-4 line directions), Spacing (px between lines),
// and audio Response are the only params; orientation reuses the shared
// gradientAngle control like Color Field/Stack did.
export function useHatchState() {
  const [hatchLayers, setHatchLayers] = useState(3);
  const [hatchSpacing, setHatchSpacing] = useState(14);
  const [hatchResponse, setHatchResponse] = useState(0.5);

  return {
    hatchLayers,
    setHatchLayers,
    hatchSpacing,
    setHatchSpacing,
    hatchResponse,
    setHatchResponse,
  };
}
