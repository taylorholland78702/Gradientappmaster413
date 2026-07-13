import { useState, useRef } from 'react';

export function usePolygon2State() {
  const [polygon2Sides, setPolygon2Sides] = useState(5); // For polar-grid gradient

  return {
    polygon2Sides,
    setPolygon2Sides,
  };
}
