import { useState } from 'react';

export function useFilmStockState() {
  const [filmStockLook, setFilmStockLook] = useState<'warm' | 'cool' | 'faded' | 'punchy'>('warm');
  const [filmStockHalation, setFilmStockHalation] = useState(0.4);
  const [filmStockGrain, setFilmStockGrain] = useState(0.3);
  const [filmStockRoll, setFilmStockRoll] = useState(0.5);

  return {
    filmStockLook,
    setFilmStockLook,
    filmStockHalation,
    setFilmStockHalation,
    filmStockGrain,
    setFilmStockGrain,
    filmStockRoll,
    setFilmStockRoll,
  };
}
