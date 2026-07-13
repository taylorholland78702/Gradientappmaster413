import { useState, useRef } from 'react';

export function useAsciiState() {
  const [asciiSize, setAsciiSize] = useState(14);
  const [asciiColor, setAsciiColor] = useState(false);
  const [asciiChars, setAsciiChars] = useState(' .:-=+*x#%@');

  return {
    asciiSize,
    setAsciiSize,
    asciiColor,
    setAsciiColor,
    asciiChars,
    setAsciiChars,
  };
}
