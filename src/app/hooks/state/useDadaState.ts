import { useState } from 'react';

export function useDadaState() {
  // Panels — grid density the canvas is cut into (per the longer axis).
  const [dadaPanels, setDadaPanels] = useState(4);
  // Chaos — how far each panel's source sampling jumps from its own
  // position, as a fraction of canvas size. 0 leaves panels reading their
  // own (flipped/rotated) spot; higher values pull from anywhere.
  const [dadaChaos, setDadaChaos] = useState(0.3);

  return {
    dadaPanels,
    setDadaPanels,
    dadaChaos,
    setDadaChaos,
  };
}
