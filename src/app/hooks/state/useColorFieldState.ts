import { useState } from 'react';

// Ellsworth Kelly / Blinky Palermo / Robert Mangold — flat, hard-edged color
// panels with no blend between them, unlike every other gradient in this
// app. Panel count and split orientation (reuses the shared gradientAngle
// control) are the only structural params; Drift/Pulse are the audio ties.
export function useColorFieldState() {
  const [colorFieldPanels, setColorFieldPanels] = useState(3);
  const [colorFieldDrift, setColorFieldDrift] = useState(0.3);
  const [colorFieldPulse, setColorFieldPulse] = useState(0.3);

  return {
    colorFieldPanels,
    setColorFieldPanels,
    colorFieldDrift,
    setColorFieldDrift,
    colorFieldPulse,
    setColorFieldPulse,
  };
}
