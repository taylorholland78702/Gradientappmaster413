import { useState, useRef } from 'react';

export function usePanelPosState() {
  const [panelPos, setPanelPos] = useState<{x: number, y: number} | null>(() => {
    try {
      const s = localStorage.getItem('panelPos');
      if (s) return JSON.parse(s);
    } catch (err) {
      if (import.meta.env.DEV) console.warn('Failed to parse stored panelPos:', err);
    }
    // First load, no saved position: center the panel horizontally on
    // narrow (mobile) viewports instead of defaulting to the top-left
    // corner. Desktop keeps the old null -> {top:16, left:16} fallback.
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      const panelWidth = 215 * 1.15; // matches the panel's w-[215px] scale-[1.15]
      return { x: Math.max(8, (window.innerWidth - panelWidth) / 2), y: 16 };
    }
    return null;
  });

  return {
    panelPos,
    setPanelPos,
  };
}
