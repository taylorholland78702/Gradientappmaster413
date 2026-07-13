import { useState, useRef } from 'react';

export function usePanelDragState() {
  const panelDragRef = useRef<{startX: number, startY: number, origX: number, origY: number} | null>(null);

  return {
    panelDragRef,
  };
}
