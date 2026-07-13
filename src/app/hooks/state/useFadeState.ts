import { useState, useRef } from 'react';

export function useFadeState() {
  const [fadeDirection, setFadeDirection] = useState(0);

  return {
    fadeDirection,
    setFadeDirection,
  };
}
