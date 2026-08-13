import { useState, useRef } from 'react';

interface WebNode {
  x: number;
  y: number;
}

interface WebBolt {
  fromIdx: number;
  toIdx: number;
  life: number;
  maxLife: number;
}

export function useLightningWebState() {
  const [lightningWebCount, setLightningWebCount] = useState(8);
  const [lightningWebSpeed, setLightningWebSpeed] = useState(1);
  const [lightningWebOpacity, setLightningWebOpacity] = useState(0.85);
  const lightningWebNodesRef = useRef<WebNode[]>([]);
  const lightningWebBoltsRef = useRef<WebBolt[]>([]);

  return {
    lightningWebCount, setLightningWebCount,
    lightningWebSpeed, setLightningWebSpeed,
    lightningWebOpacity, setLightningWebOpacity,
    lightningWebNodesRef,
    lightningWebBoltsRef,
  };
}
