import { useState } from 'react';

export function useFilmState() {
  const [filmMode, setFilmMode] = useState<'stock' | 'burn'>('stock');

  return {
    filmMode,
    setFilmMode,
  };
}
