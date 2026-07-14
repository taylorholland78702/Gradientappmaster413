import { useState, useRef } from 'react';

export function useStirState() {
  const [stirBrushSize, setStirBrushSize] = useState(60);
  const [stirDecay, setStirDecay] = useState(0.08);
  const [stirIntensity, setStirIntensity] = useState(0.7);
  // Persistent trail canvas, same buffer/fade pattern as Attractor/Flow
  // Field/Chromatic Trails — accumulates strokes and fades them each frame
  // rather than being redrawn from scratch.
  const stirBufferRef = useRef<HTMLCanvasElement | null>(null);
  // Live cursor/touch position in window-client pixel coordinates (same
  // space as displayWidth/displayHeight), updated by a pointermove listener
  // that's only attached while 'stir' is an active effect. `active` is
  // false once the pointer leaves the window/lifts off touch, so the trail
  // stops accumulating new strokes but keeps fading out on its own.
  const stirPointerRef = useRef<{ x: number; y: number; active: boolean } | null>(null);
  // Previous frame's pointer position, so each frame draws a filled stroke
  // from the last point to the current one instead of just a dot — without
  // this, fast cursor movement leaves gaps in the trail.
  const stirLastPointRef = useRef<{ x: number; y: number } | null>(null);

  return {
    stirBrushSize, setStirBrushSize,
    stirDecay, setStirDecay,
    stirIntensity, setStirIntensity,
    stirBufferRef, stirPointerRef, stirLastPointRef,
  };
}
