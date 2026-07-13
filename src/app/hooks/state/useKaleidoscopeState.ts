import { useState, useRef } from 'react';

export function useKaleidoscopeState() {
  const [kaleidoscopeSegments, setKaleidoscopeSegments] = useState(10);
  const [kaleidoscopeReflections, setKaleidoscopeReflections] = useState(1);
  const [kaleidoscopeRotateSpeed, setKaleidoscopeRotateSpeed] = useState(0.5);

  return {
    kaleidoscopeSegments,
    setKaleidoscopeSegments,
    kaleidoscopeReflections,
    setKaleidoscopeReflections,
    kaleidoscopeRotateSpeed,
    setKaleidoscopeRotateSpeed,
  };
}
