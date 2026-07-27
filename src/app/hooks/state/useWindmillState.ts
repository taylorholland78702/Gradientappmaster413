import { useState, useRef } from 'react';

export function useWindmillState() {
  const [windmillTightness, setWindmillTightness] = useState(11);
  const [windmillRotations, setWindmillRotations] = useState(3);
  const [windmillThickness, setWindmillThickness] = useState(49);
  const [windmillZoom, setWindmillZoom] = useState(3.5);
  // How strongly the global (audio-reactive) zoom control affects the
  // spiral's rotation count — was a hardcoded 0.3 dampening factor;
  // 0 = spiral ignores zoom entirely, 1 = full same-strength response as
  // other gradients.
  const [windmillZoomResponse, setWindmillZoomResponse] = useState(0.3);
  // 'helix' folds in the former standalone conical-spiral gradient (a
  // continuous per-pixel angular color field) as a second mode alongside
  // the default 'blades' (discrete rotated rectangle blades) — same
  // precedent as Radar merging into Radial Burst. Shares this gradient's
  // color/state plumbing; uses the existing helixTurns/helixTightness
  // sliders rather than new windmill-specific ones.
  const [windmillMode, setWindmillMode] = useState<'blades' | 'helix'>('blades');

  return {
    windmillTightness,
    setWindmillTightness,
    windmillRotations,
    setWindmillRotations,
    windmillThickness,
    setWindmillThickness,
    windmillZoom,
    setWindmillZoom,
    windmillZoomResponse,
    setWindmillZoomResponse,
    windmillMode,
    setWindmillMode,
  };
}
