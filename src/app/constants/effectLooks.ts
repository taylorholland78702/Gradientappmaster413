// One-click starting points for VHS and Cathode: each look is a set of slider values, applied together. After a
// look is picked every slider can still be moved. Names follow the kind of screen or tape they imitate.
export interface EffectLook {
  name: string;
  values: Record<string, number>;
}

export const VHS_LOOKS: EffectLook[] = [
  { name: 'Clean Tape', values: { vhsGlitchIntensity: 0.08, vhsBleed: 0.35, vhsNoise: 0.1, vhsTracking: 0.05, vhsDropouts: 0 } },
  { name: 'Camcorder', values: { vhsGlitchIntensity: 0.15, vhsBleed: 0.8, vhsNoise: 0.2, vhsTracking: 0.1, vhsDropouts: 0.1 } },
  { name: 'Worn Tape', values: { vhsGlitchIntensity: 0.3, vhsBleed: 0.6, vhsNoise: 0.35, vhsTracking: 0.3, vhsDropouts: 0.4 } },
  { name: 'Rewind', values: { vhsGlitchIntensity: 0.6, vhsBleed: 0.5, vhsNoise: 0.5, vhsTracking: 0.8, vhsDropouts: 0.5 } },
  { name: 'Broken Deck', values: { vhsGlitchIntensity: 0.85, vhsBleed: 0.7, vhsNoise: 0.7, vhsTracking: 0.6, vhsDropouts: 0.8 } },
];

export const CRT_LOOKS: EffectLook[] = [
  { name: 'Consumer TV', values: { crtIntensity: 0.6, crtScanlineSpacing: 3, crtCurve: 0.35, crtGlow: 0.4, crtBleed: 0.5, crtFlicker: 0.1 } },
  { name: 'Arcade', values: { crtIntensity: 0.8, crtScanlineSpacing: 2, crtCurve: 0.15, crtGlow: 0.6, crtBleed: 0.2, crtFlicker: 0 } },
  { name: 'Monitor', values: { crtIntensity: 0.5, crtScanlineSpacing: 2, crtCurve: 0.1, crtGlow: 0.2, crtBleed: 0.15, crtFlicker: 0 } },
  { name: 'Plasma', values: { crtIntensity: 0.45, crtScanlineSpacing: 1, crtCurve: 0, crtGlow: 0.3, crtBleed: 0.1, crtFlicker: 0 } },
  { name: 'LED Wall', values: { crtIntensity: 0.9, crtScanlineSpacing: 3, crtCurve: 0, crtGlow: 0.5, crtBleed: 0, crtFlicker: 0 } },
  { name: 'Rephoto', values: { crtIntensity: 0.55, crtScanlineSpacing: 2, crtCurve: 0.2, crtGlow: 0.35, crtBleed: 0.2, crtFlicker: 0.05, crtGlass: 0.6, crtMoire: 0.5, crtDrift: 0.4 } },
  { name: 'Broken Set', values: { crtIntensity: 0.7, crtScanlineSpacing: 2, crtCurve: 0.5, crtGlow: 0.8, crtBleed: 0.8, crtFlicker: 0.6 } },
];
