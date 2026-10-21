// Named "Looks" for the styled-field gradients (drawStyleFieldGL.ts): a few
// hand-tuned starting points per gradient, each a palette plus the shared
// Scale/Speed and — where the look wants it — Bias, Sharpness, Contrast and
// Blend. A look is just a bundle of values pushed into the same state the
// sliders drive; nothing about it is stored afterward, so tweaking any control
// after applying one simply moves on from it.
//
// The dark single-light gradients (Light Beam, Edge Glow, Curtains, Eclipse,
// Rays, Vortex) treat the palette's FIRST color as the near-black ground and
// climb through the rest toward a hot core, so their looks all start dark.
import type { ColorBlend } from '../utils/color';
import type { GradientType } from './gradientEffects';

export interface GradientLook {
  name: string;
  // 2-10 hex colors (the app's palette limits). Order matters: the ramp runs
  // first -> last.
  colors: string[];
  scale?: number;
  speed?: number;
  bias?: number;
  sharp?: number;
  contrast?: number;
  // Left alone (the user's choice) when omitted.
  blend?: ColorBlend;
}

// What a look resets any field it doesn't mention to, so applying one always
// yields the same result regardless of what was dialed in before.
export const LOOK_DEFAULTS = { scale: 1, speed: 1, bias: 0.5, sharp: 0, contrast: 1 } as const;

export const GRADIENT_LOOKS: Partial<Record<GradientType, GradientLook[]>> = {
  smoke: [
    { name: 'Ink', colors: ['#05060f', '#1b1b4a', '#4a3f9f', '#b9a8ff'] },
    { name: 'Ember Smoke', colors: ['#0a0504', '#5a1608', '#e0521c', '#ffd9a8'], speed: 0.8 },
    { name: 'Cold Fog', colors: ['#2b3440', '#6f8394', '#c8d6e0', '#f5f9fc'], scale: 0.8, speed: 0.6 },
  ],
  glass: [
    { name: 'Frost', colors: ['#dfeefa', '#a9cdea', '#e9f4ff', '#8fb8dd'] },
    { name: 'Warm Fluted', colors: ['#ffe3cf', '#f6b49b', '#ffd6a5', '#e8907f'], scale: 1.3 },
    { name: 'Aqua Slab', colors: ['#bff3ee', '#5fd0cf', '#a6e8ff', '#3aa6c9'], speed: 0.7 },
  ],
  mesh: [
    { name: 'Aurora', colors: ['#0f2a44', '#2bd6a5', '#7a5cff', '#1d9bf0'] },
    { name: 'Sunset', colors: ['#ff7a45', '#ff3d81', '#7b2cbf', '#ffb86b'] },
    { name: 'Subtle', colors: ['#e8e4f1', '#d6e4ee', '#f1e6df', '#e3ecde'], speed: 0.5 },
    { name: 'Candy', colors: ['#ff9ecb', '#9ed8ff', '#fff09e', '#b6f2b0'] },
    { name: 'Neon', colors: ['#00f0ff', '#ff2bd6', '#7c3cff', '#26ff8a'], speed: 1.4 },
  ],
  mercury: [
    { name: 'Chrome', colors: ['#0a0a0f', '#6b7280', '#e5e7eb', '#9ca3af', '#f9fafb'] },
    { name: 'Molten Gold', colors: ['#1a0f00', '#7a4a00', '#e0a200', '#fff1b8'], speed: 0.8 },
    { name: 'Quicksilver Blue', colors: ['#050b1a', '#2f4b7c', '#9fb8d9', '#f0f6ff'], scale: 1.2 },
  ],
  contour: [
    { name: 'Night Survey', colors: ['#06121f', '#0e3a5c', '#2fa3c7', '#e6fbff'] },
    { name: 'Paper Relief', colors: ['#efe7d6', '#c9b99a', '#8a7552', '#3d3224'], speed: 0.6 },
    { name: 'Neon Topo', colors: ['#08000f', '#5a00a8', '#ff2bd6', '#ffe14d'], scale: 1.2 },
  ],
  tunnel: [
    { name: 'Hyperspace', colors: ['#02030c', '#1a2cff', '#8a5cff', '#c8f3ff'], speed: 1.3 },
    { name: 'Warp', colors: ['#1a0200', '#a1220b', '#ff7a1a', '#fff3c4'], speed: 1.8 },
    { name: 'Emerald Bore', colors: ['#001a12', '#0b6b4a', '#38d996', '#eafff5'], scale: 0.9 },
  ],
  nebula: [
    { name: 'Deep Space', colors: ['#02020a', '#2a1363', '#9b4dff', '#ff7ad9'] },
    { name: 'Orion', colors: ['#030a14', '#0b3b6b', '#2fa3ff', '#ffd27a'], scale: 1.3 },
    { name: 'Crimson Cloud', colors: ['#0a0206', '#5a0f2a', '#e0386a', '#ffc2a1'], speed: 0.7 },
  ],
  prism: [
    { name: 'Light Shaft', colors: ['#0b0f1a', '#4f7cff', '#ff5fa8', '#ffe66d'] },
    { name: 'Spectrum', colors: ['#ff3b3b', '#ffd23b', '#3bff8a', '#3b8aff', '#b03bff'], sharp: 0.35 },
    { name: 'Pastel Facets', colors: ['#ffd6e8', '#d6f0ff', '#fff3c9', '#d9ffd6'], scale: 0.9 },
  ],
  raindrops: [
    { name: 'Rain', colors: ['#0a1b2a', '#1f4f73', '#4b91b8', '#bfe3f2'] },
    { name: 'Midnight Pond', colors: ['#05070f', '#1a2650', '#3b52a8', '#9fb0ff'], speed: 0.7 },
    { name: 'Spring Puddle', colors: ['#133b2b', '#2f8f63', '#8fd9a8', '#e9fff0'], scale: 1.2 },
  ],
  holographic: [
    { name: 'Foil', colors: ['#ff8bd8', '#8bd8ff', '#b8ff8b', '#ffe58b'] },
    { name: 'Oil Slick', colors: ['#1a0f2e', '#00a88f', '#d94fff', '#ffd86b'], speed: 0.8 },
    { name: 'Pearl', colors: ['#f4e9ff', '#d7f3ff', '#ffeedd', '#e6ffe9'], scale: 0.8 },
  ],
  waves: [
    { name: 'Ripple', colors: ['#0b3d91', '#1e88e5', '#4fc3f7', '#e1f5fe'] },
    { name: 'Magma', colors: ['#2b0a03', '#a3260b', '#ff6a1a', '#ffd27a'], speed: 1.3 },
    { name: 'Sakura', colors: ['#5b1a3a', '#c2477a', '#ff9ec4', '#ffe3ef'], speed: 0.7 },
  ],
  'halftone-screen': [
    { name: 'Print', colors: ['#fdf6e3', '#ff4d4d', '#2b6cff', '#ffd400'] },
    { name: 'Mono', colors: ['#0a0a0a', '#4a4a4a', '#9a9a9a', '#f2f2f2'], speed: 0.6 },
    { name: 'Riso', colors: ['#fff4e0', '#ff6b8b', '#3d5afe', '#00c9a7'], scale: 1.2 },
  ],
  'light-beam': [
    { name: 'Ember Beam', colors: ['#0a0402', '#7a2a08', '#ff7a1a', '#ffe2b0'] },
    { name: 'Cobalt Shaft', colors: ['#02060f', '#0a2a66', '#2f7bff', '#d6e8ff'] },
    { name: 'Violet Dusk', colors: ['#07030f', '#3a1a73', '#9a5cff', '#ffd1f2'], speed: 0.7 },
  ],
  'edge-glow': [
    { name: 'Night Rise', colors: ['#02040d', '#0a1f4d', '#2f6bff', '#cfe0ff'] },
    { name: 'Lagoon', colors: ['#020d10', '#06454f', '#17c3b2', '#e0fff8'] },
    { name: 'Rose Corner', colors: ['#0f0309', '#5a0f2f', '#ff4d88', '#ffd6e6'] },
    { name: 'Solar Floor', colors: ['#0f0800', '#7a3d00', '#ffb000', '#fff4c2'], speed: 1.2 },
  ],
  curtains: [
    { name: 'Aurum Rain', colors: ['#050400', '#5a4300', '#e0b000', '#fff6c4'] },
    { name: 'Glacier', colors: ['#020a10', '#0b4f6b', '#3fd0ff', '#e8fbff'], speed: 0.8 },
    { name: 'Orchid', colors: ['#0a0310', '#4a1a73', '#c05cff', '#ffe0ff'] },
  ],
  eclipse: [
    { name: 'Glass Halo', colors: ['#02030a', '#1b3a6b', '#8fc1ff', '#ffffff'] },
    { name: 'Rose Torus', colors: ['#0a0206', '#5a1235', '#ff5fa8', '#ffe6f0'] },
    { name: 'Gold Crescent', colors: ['#060400', '#6b4a00', '#ffc400', '#fff7d6'], speed: 0.8 },
  ],
  rays: [
    { name: 'God Rays', colors: ['#03060f', '#17315a', '#6aa0e0', '#fff1c9'] },
    { name: 'Neon Rays', colors: ['#05000f', '#4b00a8', '#ff2bd6', '#2bffe4'], speed: 1.4 },
    { name: 'Dusk Rays', colors: ['#0a0205', '#5a1a2a', '#ff7a45', '#ffe3b0'], scale: 0.9 },
  ],
  bokeh: [
    { name: 'City', colors: ['#05040f', '#ffb347', '#ff5e9c', '#5ec8ff', '#ffe66d'], scale: 0.9 },
    { name: 'Harbour', colors: ['#030b14', '#2fa3ff', '#1de9b6', '#ffd166', '#ff6b6b'] },
    { name: 'Fairy', colors: ['#07040f', '#c58bff', '#ff9ee6', '#9ee6ff', '#fff2a8'], speed: 0.7 },
  ],
  vortex: [
    { name: 'Halo', colors: ['#02030a', '#2a4a9f', '#8fb8ff', '#ffffff'] },
    { name: 'Torus', colors: ['#0a0205', '#6b1a4a', '#ff5fa8', '#ffe6f5'], speed: 1.3 },
    { name: 'Ion', colors: ['#00060a', '#0b5a6b', '#27e0ff', '#e6ffff'], scale: 1.2 },
  ],
  spectral: [
    { name: 'Sky Prism', colors: ['#2a5bd7', '#7ad7ff', '#ffe27a', '#ff7ac8'] },
    { name: 'Pearl Arc', colors: ['#cfd9e6', '#e6f0ff', '#ffe6f0', '#e6fff0'], speed: 0.6 },
    { name: 'Candy Arc', colors: ['#ff9ecb', '#ffd27a', '#9eff9e', '#9ed8ff'] },
  ],
  drape: [
    { name: 'Silk', colors: ['#1a1033', '#5b3fa8', '#b9a0ff', '#fff0ff'] },
    { name: 'Satin Night', colors: ['#050814', '#1a2a5a', '#4a6ad0', '#d0dcff'], speed: 0.7 },
    { name: 'Linen', colors: ['#d8cdb8', '#efe6d4', '#c4b59a', '#f8f2e6'], scale: 0.8 },
  ],
  'flow-mesh': [
    { name: 'Pastel Cloud', colors: ['#ffd1e8', '#d1e8ff', '#fff2c9', '#d9f5e0'] },
    { name: 'Ember Flow', colors: ['#ff7a45', '#ff3d6a', '#8a2cbf', '#ffb86b'] },
    { name: 'Aqua Folds', colors: ['#0aa4c9', '#2de1b5', '#7a8cff', '#c5f3ff'], speed: 0.8 },
    { name: 'Lilac Satin', colors: ['#b8a0ff', '#e0b8ff', '#ffd1f0', '#9ec5ff'], speed: 0.6 },
  ],
};
