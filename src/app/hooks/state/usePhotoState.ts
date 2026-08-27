import { useState, useRef } from 'react';

export function usePhotoState() {
  const [photoBlendMode, setPhotoBlendMode] = useState<'source-over' | 'multiply' | 'screen' | 'overlay'>('overlay');
  const [photoOpacity, setPhotoOpacity] = useState(80);
  const [photoFileName, setPhotoFileName] = useState('');
  const [photoVersion, setPhotoVersion] = useState(0);
  // Holds either the raw uploaded image, or — for anything larger than the
  // downscale cap applied in InteractiveGradient.tsx's handlePhotoFileChange
  // — an already-downscaled offscreen canvas instead. applyPhoto.ts only
  // ever reads .width/.height and passes this straight to ctx.drawImage(),
  // both of which HTMLCanvasElement supports identically to
  // HTMLImageElement, so no downstream code needs to care which it got.
  const photoImageRef = useRef<HTMLImageElement | HTMLCanvasElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  return {
    photoBlendMode,
    setPhotoBlendMode,
    photoOpacity,
    setPhotoOpacity,
    photoFileName,
    setPhotoFileName,
    photoVersion,
    setPhotoVersion,
    photoImageRef,
    photoInputRef,
  };
}
