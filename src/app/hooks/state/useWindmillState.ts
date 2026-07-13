import { useState, useRef } from 'react';

export function useWindmillState() {
  const [windmillTightness, setWindmillTightness] = useState(11);
  const [windmillRotations, setWindmillRotations] = useState(3);
  const [windmillThickness, setWindmillThickness] = useState(49);
  const [windmillZoom, setWindmillZoom] = useState(3.5);

  return {
    windmillTightness,
    setWindmillTightness,
    windmillRotations,
    setWindmillRotations,
    windmillThickness,
    setWindmillThickness,
    windmillZoom,
    setWindmillZoom,
  };
}
