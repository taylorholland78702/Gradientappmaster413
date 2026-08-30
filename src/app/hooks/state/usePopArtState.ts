import { useState } from 'react';

export function usePopArtState() {
  // Tiles — grid density (per axis) the whole image repeats into.
  const [popTiles, setPopTiles] = useState(3);
  // Hue Shift — max degrees each tile's hue can rotate from the next,
  // hashed per tile so it's stable frame to frame. 0 leaves every tile
  // the same color, just posterized.
  const [popHueShift, setPopHueShift] = useState(120);

  return {
    popTiles,
    setPopTiles,
    popHueShift,
    setPopHueShift,
  };
}
