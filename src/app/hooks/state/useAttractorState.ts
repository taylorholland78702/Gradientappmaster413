import { useState, useRef } from 'react';

export function useAttractorState() {
  const [attractorAnimTime, setAttractorAnimTime] = useState(0);
  const [attractorPointCount, setAttractorPointCount] = useState(6);
  const [attractorSpeed, setAttractorSpeed] = useState(1);
  const [attractorScale, setAttractorScale] = useState(1);
  const [attractorDotSize, setAttractorDotSize] = useState(1);
  const [attractorTrailFade, setAttractorTrailFade] = useState(0.04);
  const attractorBufferRef = useRef<HTMLCanvasElement | null>(null);
  const attractorPointsRef = useRef<{ x: number; y: number }[]>([]);

  return {
    attractorAnimTime,
    setAttractorAnimTime,
    attractorPointCount,
    setAttractorPointCount,
    attractorSpeed,
    setAttractorSpeed,
    attractorScale,
    setAttractorScale,
    attractorDotSize,
    setAttractorDotSize,
    attractorTrailFade,
    setAttractorTrailFade,
    attractorBufferRef,
    attractorPointsRef,
  };
}
