import { useState, useRef } from 'react';

// James Turrell — a full-bleed field with no visible gradient stop, crossing
// slowly through the palette over minutes rather than seconds, with a soft
// glow that breathes on a multi-second lag rather than reacting instantly.
// turrellSmoothRef holds the heavily-smoothed sub-bass level (an EMA) that
// the glow reads instead of the raw audio level, so it never flickers.
export function useTurrellState() {
  const [turrellAnimTime, setTurrellAnimTime] = useState(0);
  const [turrellSpeed, setTurrellSpeed] = useState(1);
  const [turrellGlow, setTurrellGlow] = useState(0.4);
  const turrellSmoothRef = useRef(0);

  return {
    turrellAnimTime,
    setTurrellAnimTime,
    turrellSpeed,
    setTurrellSpeed,
    turrellGlow,
    setTurrellGlow,
    turrellSmoothRef,
  };
}
