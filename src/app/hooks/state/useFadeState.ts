import { useState, useRef } from 'react';

// 'angle' is the classic two-color blend driven by gradientAngle position;
// 'light' folds in the former standalone Turrell gradient — a full-bleed
// field with no visible gradient stop, crossing the palette slowly over
// minutes via its own turrellAnimTime clock, with a soft glow that
// breathes on a heavily-smoothed sub-bass level (turrellSmoothRef) rather
// than reacting frame to frame. Same mode-toggle pattern as Windmill's
// 'blades'/'helix'. Field names keep the turrell* prefix from before the
// merge, same as helixTightness/helixTurns keeping their name after
// folding into Windmill.
export function useFadeState() {
  const [fadeDirection, setFadeDirection] = useState(0);
  const [fadeMode, setFadeMode] = useState<'angle' | 'light'>('angle');
  const [turrellAnimTime, setTurrellAnimTime] = useState(0);
  const [turrellSpeed, setTurrellSpeed] = useState(1);
  const [turrellGlow, setTurrellGlow] = useState(0.4);
  const turrellSmoothRef = useRef(0);

  return {
    fadeDirection,
    setFadeDirection,
    fadeMode,
    setFadeMode,
    turrellAnimTime,
    setTurrellAnimTime,
    turrellSpeed,
    setTurrellSpeed,
    turrellGlow,
    setTurrellGlow,
    turrellSmoothRef,
  };
}
