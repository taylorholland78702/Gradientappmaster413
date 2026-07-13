import { useState, useRef } from 'react';

export function useLinesState() {
  const [linesCount, setLinesCount] = useState(50);
  const [linesAngle, setLinesAngle] = useState(0); // 0-360 degrees
  const [linesThickness, setLinesThickness] = useState(1);

  return {
    linesCount,
    setLinesCount,
    linesAngle,
    setLinesAngle,
    linesThickness,
    setLinesThickness,
  };
}
