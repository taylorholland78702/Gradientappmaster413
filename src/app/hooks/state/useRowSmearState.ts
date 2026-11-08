import { useState } from 'react';

export function useRowSmearState() {
  const [rowSmearLength, setRowSmearLength] = useState(40);
  const [rowSmearAmount, setRowSmearAmount] = useState(0.5);
  const [rowSmearDirection, setRowSmearDirection] = useState<'horizontal' | 'vertical'>('horizontal');
  const [rowSmearSpeed, setRowSmearSpeed] = useState(1);

  return {
    rowSmearLength,
    setRowSmearLength,
    rowSmearAmount,
    setRowSmearAmount,
    rowSmearDirection,
    setRowSmearDirection,
    rowSmearSpeed,
    setRowSmearSpeed,
  };
}
