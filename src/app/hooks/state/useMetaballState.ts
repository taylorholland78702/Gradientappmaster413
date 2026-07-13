import { useState, useRef } from 'react';

export function useMetaballState() {
  const [metaballAnimTime, setMetaballAnimTime] = useState(0);
  const [metaballCount, setMetaballCount] = useState(6);
  const [metaballSize, setMetaballSize] = useState(0.16);
  const [metaballSpeed, setMetaballSpeed] = useState(1);

  return {
    metaballAnimTime,
    setMetaballAnimTime,
    metaballCount,
    setMetaballCount,
    metaballSize,
    setMetaballSize,
    metaballSpeed,
    setMetaballSpeed,
  };
}
