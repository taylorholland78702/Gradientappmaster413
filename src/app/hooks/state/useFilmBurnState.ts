import { useState } from 'react';

export function useFilmBurnState() {
  const [filmBurnAmount, setFilmBurnAmount] = useState(0.6);
  const [filmBurnDust, setFilmBurnDust] = useState(0.4);
  const [filmBurnScratches, setFilmBurnScratches] = useState(0.3);
  const [filmBurnFlicker, setFilmBurnFlicker] = useState(0.2);
  const [filmBurnFlash, setFilmBurnFlash] = useState(0);
  const [filmBurnSpeed, setFilmBurnSpeed] = useState(1);

  return {
    filmBurnAmount,
    setFilmBurnAmount,
    filmBurnDust,
    setFilmBurnDust,
    filmBurnScratches,
    setFilmBurnScratches,
    filmBurnFlicker,
    setFilmBurnFlicker,
    filmBurnFlash,
    setFilmBurnFlash,
    filmBurnSpeed,
    setFilmBurnSpeed,
  };
}
