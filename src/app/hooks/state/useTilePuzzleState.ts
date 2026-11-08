import { useState } from 'react';

export function useTilePuzzleState() {
  const [tilePuzzleEmpty, setTilePuzzleEmpty] = useState<'off' | 'on'>('off');
  const [tilePuzzleCount, setTilePuzzleCount] = useState(4);
  const [tilePuzzleShuffle, setTilePuzzleShuffle] = useState(0.5);
  const [tilePuzzleRotate, setTilePuzzleRotate] = useState(0.25);
  const [tilePuzzleGap, setTilePuzzleGap] = useState(2);
  const [tilePuzzleSpeed, setTilePuzzleSpeed] = useState(1);

  return {
    tilePuzzleEmpty,
    setTilePuzzleEmpty,
    tilePuzzleCount,
    setTilePuzzleCount,
    tilePuzzleShuffle,
    setTilePuzzleShuffle,
    tilePuzzleRotate,
    setTilePuzzleRotate,
    tilePuzzleGap,
    setTilePuzzleGap,
    tilePuzzleSpeed,
    setTilePuzzleSpeed,
  };
}
