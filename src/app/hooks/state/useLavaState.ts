import { useState, useRef } from 'react';

export function useLavaState() {
  const [lavaAnimTime, setLavaAnimTime] = useState(0);
  const [lavaBlobCount, setLavaBlobCount] = useState(10);
  const [lavaBlobSize, setLavaBlobSize] = useState(0.08);
  const [lavaSpeed, setLavaSpeed] = useState(1);

  return {
    lavaAnimTime,
    setLavaAnimTime,
    lavaBlobCount,
    setLavaBlobCount,
    lavaBlobSize,
    setLavaBlobSize,
    lavaSpeed,
    setLavaSpeed,
  };
}
