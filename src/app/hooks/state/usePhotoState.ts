import { useState, useRef } from 'react';

export function usePhotoState() {
  const [photoBlendMode, setPhotoBlendMode] = useState<'source-over' | 'multiply' | 'screen' | 'overlay'>('overlay');
  const [photoOpacity, setPhotoOpacity] = useState(80);
  const [photoFileName, setPhotoFileName] = useState('');
  const [photoVersion, setPhotoVersion] = useState(0);
  const photoImageRef = useRef<HTMLImageElement | null>(null);
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
