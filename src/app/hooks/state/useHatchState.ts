import { useState } from 'react';

// Sol LeWitt — Layers (1-4 line directions), Spacing (px between lines),
// audio Response, and drift Speed are the only params; orientation reuses
// the shared gradientAngle control like Color Field/Stack did.
export function useHatchState() {
  const [hatchLayers, setHatchLayers] = useState(3);
  const [hatchSpacing, setHatchSpacing] = useState(14);
  const [hatchResponse, setHatchResponse] = useState(0.5);
  const [hatchAnimTime, setHatchAnimTime] = useState(0);
  const [hatchSpeed, setHatchSpeed] = useState(1);

  return {
    hatchLayers,
    setHatchLayers,
    hatchSpacing,
    setHatchSpacing,
    hatchResponse,
    setHatchResponse,
    hatchAnimTime,
    setHatchAnimTime,
    hatchSpeed,
    setHatchSpeed,
  };
}
