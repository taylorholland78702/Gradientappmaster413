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
  };
}
