// Named "Looks" for every gradient: a few hand-tuned starting points each, a
// palette plus — where the look wants it — the shared Scale/Speed, Bias,
// Sharpness, Contrast and Blend, and (for the gradients with sliders of their
// own) a few of those sliders via `params`. A look is just a bundle of values
// pushed into the same state the controls drive; nothing about it is stored
// afterward, so tweaking any control after applying one simply moves on from it.
//
// The dark single-light gradients (Light Beam, Edge Glow, Curtains, Eclipse,
// Rays, Vortex) treat the palette's FIRST color as the near-black ground and
// climb through the rest toward a hot core, so their looks all start dark.
import type { ColorBlend } from '../utils/color';
import type { GradientType } from './gradientEffects';

// The gradient-specific sliders (and mode switches) a look may set via `params`.
// Every key must have a matching setter in applyGradientLook
// (InteractiveGradient.tsx); numeric ones are range-checked in tests against the
// same limits as the sliders themselves.
export const LOOK_PARAM_KEYS = [
  'causticsBrightness', 'causticsScale',
  'lavaBlobCount', 'lavaBlobSize', 'lavaSpeed',
  'marbleVeinFreq', 'marbleTurbulence', 'marbleOctaves',
  'metaballCount', 'metaballSize', 'metaballSpeed',
  'noiseScale', 'noiseOctaves', 'noiseWarp', 'noiseSpeed', 'noiseType',
  'topographicScale', 'topographicBands', 'topographicLineWidth',
  'juliaReal', 'juliaImaginary', 'juliaZoom', 'juliaIterations',
  'tilingSize', 'tilingSymmetry', 'tilingComplexity', 'tilingRotation',
  'reactionDiffusionFeed', 'reactionDiffusionKill', 'reactionDiffusionSpeed',
  'voronoiCellCount', 'voronoiDistortion',
  'radialSizeScale', 'radialSpeed',
  'radialBurstCount', 'radialBurstSize', 'radialBurstSpread',
  'windmillMode', 'helixTurns', 'helixTightness',
  'fadeDirection', 'angleStartOffset',
  'flowerCircles', 'flowerScale', 'flowerSpread',
  'gridRows', 'gridColumns', 'shapesCount', 'shapesSides',
  'stackCount', 'stackGap', 'stackWidth', 'stackLength', 'stackResponse',
  'hatchLayers', 'hatchSpacing', 'hatchResponse', 'hatchSpeed',
  'truchetSize', 'truchetVariation', 'truchetThickness',
  'particlesCount', 'particlesSize', 'particlesSpeed', 'particlesTrail', 'particlesGravity',
  'attractorPointCount', 'attractorSpeed', 'attractorScale',
] as const;
export type LookParamKey = (typeof LOOK_PARAM_KEYS)[number];
export type LookParams = Partial<Record<LookParamKey, number | string>>;

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
  // The gradient's own sliders/modes. Unlike the shared fields above, anything
  // not listed is left where it is (there is no single default to reset to).
  params?: LookParams;
}

// What a look resets any field it doesn't mention to, so applying one always
// yields the same result regardless of what was dialed in before.
export const LOOK_DEFAULTS = { scale: 1, speed: 1, bias: 0.5, sharp: 0, contrast: 1 } as const;

export const GRADIENT_LOOKS: Partial<Record<GradientType, GradientLook[]>> = {
  // ---- Styled-field gradients (drawStyleFieldGL.ts) ----
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
  ribbon: [
    { name: 'Satin', colors: ['#1b1030', '#6a3fd0', '#ff7ac8', '#ffe3f1'] },
    { name: 'Gold Leaf', colors: ['#2a1a06', '#9a6a12', '#f1c24a', '#fff2c4'], speed: 0.8 },
    { name: 'Glacier', colors: ['#dff3ff', '#8fd0ff', '#4a8be0', '#1a2f6a'] },
  ],
  strands: [
    { name: 'Silk Threads', colors: ['#080612', '#7a5af0', '#ff8ad8', '#ffe8f4'] },
    { name: 'Copper Wire', colors: ['#0c0603', '#8a3a12', '#e8913a', '#ffe0b0'], speed: 0.8 },
    { name: 'Neon Rain', colors: ['#02030c', '#00e5ff', '#7a5cff', '#ff4fd8'], speed: 1.2 },
  ],
  iridescent: [
    { name: 'Oil Slick', colors: ['#10102a', '#2a7a8a', '#b04ad0', '#e8c84a'] },
    { name: 'Soap Film', colors: ['#e8f0ff', '#ffd6f0', '#c9ffe8', '#d6d6ff'], scale: 0.8 },
    { name: 'Beetle', colors: ['#021a12', '#0a6a4a', '#3ad8a0', '#d0ff4a'], speed: 0.8 },
  ],
  embers: [
    { name: 'Campfire', colors: ['#120300', '#7a1b00', '#ff6a1f', '#ffe2a0'] },
    { name: 'Blue Flame', colors: ['#020614', '#0a2f8a', '#2a8aff', '#d6f0ff'], speed: 0.8 },
    { name: 'Forge', colors: ['#0a0200', '#a01800', '#ff9a1f', '#ffffff'], speed: 1.3 },
  ],
  bands: [
    { name: 'Sunset Stripes', colors: ['#2b1055', '#c33764', '#ff7b54', '#ffd479'] },
    { name: 'Retro', colors: ['#ff6b6b', '#ffd166', '#06d6a0', '#118ab2'], scale: 1.2 },
    { name: 'Dusk', colors: ['#0f0c29', '#302b63', '#6a5acd', '#c8b6ff'], speed: 0.7 },
  ],
  sheen: [
    { name: 'Satin', colors: ['#2a1b3d', '#6b4a9f', '#c9a8ff', '#fff2ff'] },
    { name: 'Champagne', colors: ['#3a2a18', '#a8864a', '#e8d29a', '#fff8e6'] },
    { name: 'Steel', colors: ['#10161c', '#3a4a5a', '#8fa3b5', '#e8f0f7'], speed: 0.8 },
  ],
  // ---- Older gradients ----
  angle: [
    { name: 'Prism', colors: ['#ff3b3b', '#ffd23b', '#3bff8a', '#3b8aff', '#b03bff'] },
    { name: 'Dusk Sweep', colors: ['#1a0b2e', '#7b2cbf', '#ff5fa8', '#ffb86b'], params: { angleStartOffset: 40 } },
    { name: 'Ocean Cone', colors: ['#031a2e', '#0b5c8a', '#37b6d9', '#e6f9ff'], params: { angleStartOffset: 200 } },
  ],
  radial: [
    { name: 'Sunburst', colors: ['#fff1b8', '#ffb347', '#ff5e62', '#6a1b9a'], params: { radialSizeScale: 1.3 } },
    { name: 'Moonlight', colors: ['#02030c', '#1b2a5a', '#7aa2ff', '#f2f6ff'], params: { radialSizeScale: 0.9 } },
    { name: 'Peach Glow', colors: ['#ffe0d0', '#ffb6a0', '#ff8fa3', '#c06c9c'], params: { radialSizeScale: 1.6 } },
  ],
  noise: [
    { name: 'Soft Clouds', colors: ['#dfeaff', '#b9d2ff', '#e8d8ff', '#fff0f6'], params: { noiseType: 'smooth', noiseScale: 120, noiseOctaves: 3, noiseWarp: 0.3 } },
    { name: 'Lava Ridge', colors: ['#1a0200', '#a1220b', '#ff7a1a', '#ffe9a8'], params: { noiseType: 'ridged', noiseScale: 70, noiseOctaves: 5, noiseWarp: 0.6 } },
    { name: 'Deep Sea', colors: ['#001428', '#044f7a', '#13a3c4', '#a8f0ff'], params: { noiseType: 'smooth', noiseScale: 160, noiseOctaves: 4, noiseWarp: 0.45 } },
  ],
  marble: [
    { name: 'Carrara', colors: ['#f4f4f2', '#cfcfd0', '#8c8c92', '#2a2a30'], params: { marbleVeinFreq: 3, marbleTurbulence: 2.5, marbleOctaves: 6 } },
    { name: 'Ink Marble', colors: ['#05050a', '#1a1a3a', '#5a5a9a', '#e0e0ff'], params: { marbleVeinFreq: 5, marbleTurbulence: 3.5, marbleOctaves: 5 } },
    { name: 'Rose Quartz', colors: ['#ffe3ec', '#f6b3c8', '#d98aa9', '#fff6f9'], params: { marbleVeinFreq: 2, marbleTurbulence: 1.5, marbleOctaves: 4 } },
  ],
  caustics: [
    { name: 'Pool', colors: ['#00253a', '#0a6a99', '#37c3e8', '#e6fcff'], params: { causticsBrightness: 2.5, causticsScale: 6 } },
    { name: 'Molten Gold', colors: ['#1a1000', '#7a4a00', '#e0a200', '#fff4c2'], params: { causticsBrightness: 3, causticsScale: 4 } },
    { name: 'Lagoon Light', colors: ['#02131a', '#0e5a66', '#2fd0b8', '#e9fff8'], params: { causticsBrightness: 2, causticsScale: 8 } },
  ],
  julia: [
    { name: 'Frost Set', colors: ['#02101f', '#0b4a7a', '#7ad7ff', '#ffffff'], params: { juliaReal: -0.7, juliaImaginary: 0.27, juliaZoom: 1 } },
    { name: 'Ember Set', colors: ['#0a0200', '#7a1a05', '#ff7a1a', '#ffe9a8'], params: { juliaReal: -0.4, juliaImaginary: 0.6, juliaIterations: 80 } },
    { name: 'Orchid Set', colors: ['#0a0214', '#4a1a73', '#c05cff', '#ffe0ff'], params: { juliaReal: 0.285, juliaImaginary: 0.01, juliaZoom: 1.2 } },
  ],
  'lava-lamp': [
    { name: 'Classic', colors: ['#2a0a3a', '#ff3d81', '#ffb347', '#fff1b8'], params: { lavaBlobCount: 6, lavaBlobSize: 0.2 } },
    { name: 'Toxic', colors: ['#001a0a', '#0b6b2a', '#7aff3d', '#e8ffd0'], params: { lavaBlobCount: 8, lavaBlobSize: 0.15 } },
    { name: 'Mono Wax', colors: ['#0a0a0a', '#4a4a4a', '#9a9a9a', '#f2f2f2'], params: { lavaBlobCount: 5, lavaBlobSize: 0.25 } },
  ],
  metaballs: [
    { name: 'Plasma Cells', colors: ['#0a0030', '#5a00d4', '#ff2bd6', '#ffe14d'], params: { metaballCount: 8, metaballSize: 0.18 } },
    { name: 'Mercury Drops', colors: ['#0a0a0f', '#6b7280', '#e5e7eb', '#ffffff'], params: { metaballCount: 6, metaballSize: 0.2 } },
    { name: 'Citrus', colors: ['#ff7a00', '#ffb300', '#ffe14d', '#a8e000'], params: { metaballCount: 10, metaballSize: 0.14 } },
  ],
  topographic: [
    { name: 'Survey', colors: ['#06121f', '#0e3a5c', '#2fa3c7', '#e6fbff'], params: { topographicBands: 14, topographicLineWidth: 0.04 } },
    { name: 'Paper', colors: ['#efe7d6', '#c9b99a', '#8a7552', '#3d3224'], params: { topographicBands: 18, topographicLineWidth: 0.03 } },
    { name: 'Neon Topo', colors: ['#08000f', '#5a00a8', '#ff2bd6', '#ffe14d'], params: { topographicBands: 10, topographicLineWidth: 0.06 } },
  ],
  voronoi: [
    { name: 'Stained Glass', colors: ['#1a2a6c', '#b21f1f', '#fdbb2d', '#22c1c3'], params: { voronoiCellCount: 14, voronoiDistortion: 10 } },
    { name: 'Honeycomb', colors: ['#ffd166', '#f4a261', '#e76f51', '#264653'], params: { voronoiCellCount: 22, voronoiDistortion: 2 } },
    { name: 'Cracked Earth', colors: ['#2b1d12', '#6b4a2e', '#b08457', '#e8d5b0'], params: { voronoiCellCount: 12, voronoiDistortion: 40 } },
  ],
  tiling: [
    { name: 'Mandala', colors: ['#0a0214', '#7a2cbf', '#ff5fa8', '#ffd27a'], params: { tilingSymmetry: 8, tilingComplexity: 5, tilingSize: 120 } },
    { name: 'Kaleido Tile', colors: ['#001a2e', '#0b5c8a', '#37d9b6', '#fff2a8'], params: { tilingSymmetry: 6, tilingComplexity: 3 } },
    { name: 'Quilt', colors: ['#ffd6e8', '#d6f0ff', '#fff3c9', '#d9ffd6'], params: { tilingSymmetry: 4, tilingComplexity: 2, tilingSize: 80 } },
  ],
  windmill: [
    { name: 'Pinwheel', colors: ['#ff3b3b', '#ffd23b', '#3b8aff', '#ffffff'], params: { windmillMode: 'blades' } },
    { name: 'Helix Neon', colors: ['#05000f', '#4b00a8', '#ff2bd6', '#2bffe4'], params: { windmillMode: 'helix', helixTurns: 8, helixTightness: 0.8 } },
    { name: 'Calm Spiral', colors: ['#e6f0ff', '#9bb8e8', '#5b7fc0', '#223a6a'], params: { windmillMode: 'helix', helixTurns: 4, helixTightness: 0.4 } },
  ],
  'radial-burst': [
    { name: 'Starburst', colors: ['#fff1b8', '#ffb347', '#ff5e62', '#6a1b9a'], params: { radialBurstCount: 10 } },
    { name: 'Neon Pinwheel', colors: ['#05000f', '#4b00a8', '#ff2bd6', '#2bffe4'], params: { radialBurstCount: 12, radialBurstSpread: 60 } },
    { name: 'Ember Bloom', colors: ['#12040a', '#7a1f3d', '#e8643c', '#ffd9a0'], params: { radialBurstCount: 7, radialBurstSize: 120, radialBurstSpread: 45 } },
  ],
  'reaction-diffusion': [
    { name: 'Coral', colors: ['#05121c', '#0b5a6b', '#ff7a6a', '#fff1e0'], params: { reactionDiffusionFeed: 0.055, reactionDiffusionKill: 0.062 } },
    { name: 'Spots', colors: ['#0a0a14', '#2a2a5a', '#8a8aff', '#f0f0ff'], params: { reactionDiffusionFeed: 0.035, reactionDiffusionKill: 0.065 } },
    { name: 'Labyrinth', colors: ['#1a0a00', '#7a3d00', '#e0a200', '#fff4c2'], params: { reactionDiffusionFeed: 0.029, reactionDiffusionKill: 0.057 } },
  ],
  grid: [
    { name: 'Pixel Candy', colors: ['#ff9ecb', '#9ed8ff', '#fff09e', '#b6f2b0'], params: { gridRows: 10, gridColumns: 14 } },
    { name: 'Midnight Cells', colors: ['#05070f', '#1a2650', '#3b52a8', '#9fb0ff'], params: { gridRows: 8, gridColumns: 12 } },
    { name: 'Warm Tiles', colors: ['#ffe3cf', '#f6b49b', '#e8907f', '#c0605a'], params: { gridRows: 6, gridColumns: 8 } },
  ],
  shapes: [
    { name: 'Confetti', colors: ['#ff3b3b', '#ffd23b', '#3bff8a', '#3b8aff', '#b03bff'], params: { shapesCount: 30, shapesSides: 3 } },
    { name: 'Midnight Rings', colors: ['#05070f', '#1a2650', '#3b52a8', '#9fb0ff'], params: { shapesCount: 12, shapesSides: 8 } },
    { name: 'Sorbet Blocks', colors: ['#ffd6e8', '#d6f0ff', '#fff3c9', '#d9ffd6'], params: { shapesCount: 18, shapesSides: 4 } },
  ],
  stack: [
    { name: 'Ribbon Stack', colors: ['#0b3d91', '#1e88e5', '#4fc3f7', '#e1f5fe'], params: { stackCount: 20 } },
    { name: 'Sunset Stack', colors: ['#2b0a3d', '#a3260b', '#ff9a3d', '#ffe3b0'], params: { stackCount: 12, stackGap: 0.2 } },
    { name: 'Mono Stack', colors: ['#0a0a0a', '#4a4a4a', '#9a9a9a', '#f2f2f2'], params: { stackCount: 30 } },
  ],
  hatch: [
    { name: 'Ink Hatch', colors: ['#f4f0e6', '#222222', '#c04a3a'], params: { hatchLayers: 3, hatchSpacing: 8 } },
    { name: 'Blueprint Hatch', colors: ['#02244a', '#6fb3ff', '#e6f2ff'], params: { hatchLayers: 2, hatchSpacing: 12 } },
    { name: 'Warm Pencil', colors: ['#fff6e0', '#c9a36b', '#7a4a2a'], params: { hatchLayers: 4, hatchSpacing: 6 } },
  ],
  truchet: [
    { name: 'Maze', colors: ['#05070f', '#e6f2ff'], params: { truchetSize: 40, truchetThickness: 4 } },
    { name: 'Candy Weave', colors: ['#ff9ecb', '#9ed8ff', '#fff09e', '#b6f2b0'], params: { truchetSize: 60, truchetThickness: 8 } },
    { name: 'Gold Lattice', colors: ['#1a1000', '#e0a200', '#fff4c2'], params: { truchetSize: 30, truchetThickness: 3 } },
  ],
  flower: [
    { name: 'Daisy', colors: ['#fff6a8', '#ffd23b', '#ffffff', '#ff9ecb'], params: { flowerCircles: 6 } },
    { name: 'Lotus', colors: ['#2b0a3d', '#a33a8f', '#ff9ecb', '#ffe3ef'], params: { flowerCircles: 8, flowerSpread: 1.2 } },
    { name: 'Sun Bloom', colors: ['#2a0a00', '#a1220b', '#ff7a1a', '#ffe9a8'], params: { flowerCircles: 10 } },
  ],
  attractor: [
    { name: 'Neon Orbit', colors: ['#05000f', '#4b00a8', '#ff2bd6', '#2bffe4'], params: { attractorPointCount: 8 } },
    { name: 'Gold Dust', colors: ['#0a0600', '#7a4a00', '#e0a200', '#fff1b8'], params: { attractorPointCount: 12, attractorScale: 1.2 } },
    { name: 'Ice Trails', colors: ['#02101f', '#0b4a7a', '#7ad7ff', '#ffffff'], params: { attractorPointCount: 6 } },
  ],
  particles: [
    { name: 'Fireflies', colors: ['#02040d', '#ffe66d', '#9bff7a', '#ffffff'], params: { particlesCount: 120, particlesSize: 2 } },
    { name: 'Embers', colors: ['#0a0200', '#ff4d1a', '#ffb347', '#fff1b8'], params: { particlesCount: 200, particlesGravity: 0.4 } },
    { name: 'Snowfall', colors: ['#0a1428', '#9fb8d9', '#e6f0ff', '#ffffff'], params: { particlesCount: 150, particlesSize: 3 } },
  ],
};
