// Gradient-agnostic palettes for the Color tab and the Looks menu. Unlike a Look
// (constants/gradientLooks.ts) these touch nothing but the colors, so they work
// with whichever gradient is on screen. Mostly ordered dark to light, which is
// what the dark-ground gradients (Eclipse, Vortex, Light Beam...) expect of a
// palette's first color.
export interface PalettePreset {
  name: string;
  colors: string[];
}

export interface PaletteGroup {
  group: string;
  palettes: PalettePreset[];
}

export const PALETTE_GROUPS: PaletteGroup[] = [
  {
    group: 'Warm',
    palettes: [
      { name: 'Sunset', colors: ['#2b1055', '#c33764', '#ff7b54', '#ffd479'] },
      { name: 'Ember', colors: ['#120300', '#7a1b00', '#ff5a1f', '#ffd29a'] },
      { name: 'Lava', colors: ['#1a0000', '#8a0f0f', '#ff4a1c', '#ffcf5a'] },
      { name: 'Desert Dusk', colors: ['#2a1330', '#b3475a', '#f08a4b', '#f9d89c'] },
      { name: 'Saffron', colors: ['#3a1500', '#b34700', '#ffa51f', '#fff1b8'] },
      { name: 'Rosewood', colors: ['#2a0a14', '#7a1f3a', '#d6577a', '#ffc7d6'] },
      { name: 'Peach Fuzz', colors: ['#6b2d2d', '#e8836b', '#ffb88a', '#ffe8d0'] },
      { name: 'Autumn', colors: ['#2b1608', '#8a3b12', '#d9801f', '#f4d27a'] },
      { name: 'Coral Reef', colors: ['#3a0f2a', '#d6407a', '#ff8566', '#ffd9a8'] },
      { name: 'Candle', colors: ['#150a02', '#6b3a0a', '#e0912a', '#fff3c4'] },
    ],
  },
  {
    group: 'Cool',
    palettes: [
      { name: 'Ocean', colors: ['#03045e', '#0077b6', '#00b4d8', '#caf0f8'] },
      { name: 'Deep Sea', colors: ['#020b1a', '#0a3a6b', '#1b86a8', '#a8f0e0'] },
      { name: 'Glacier', colors: ['#0b1f3a', '#2a6fb0', '#8fd0ff', '#f0faff'] },
      { name: 'Midnight', colors: ['#05060f', '#1b1b4a', '#4a3f9f', '#b9a8ff'] },
      { name: 'Lagoon', colors: ['#022b3a', '#1f7a8c', '#4fd1c5', '#e0fff6'] },
      { name: 'Arctic', colors: ['#10243a', '#3a6a8f', '#a6cfe6', '#ffffff'] },
      { name: 'Twilight', colors: ['#0f0c29', '#302b63', '#6a5acd', '#c8b6ff'] },
      { name: 'Teal Ink', colors: ['#00181f', '#00505f', '#1fa3a3', '#b9f3e4'] },
      { name: 'Storm', colors: ['#0f1620', '#2f4358', '#6f8aa3', '#d4e0ea'] },
      { name: 'Sapphire', colors: ['#050a2a', '#0a2f9f', '#3a6bff', '#bcd0ff'] },
    ],
  },
  {
    group: 'Nature',
    palettes: [
      { name: 'Forest', colors: ['#0b2b1d', '#1f6f4a', '#7bc67e', '#e6f5c9'] },
      { name: 'Moss', colors: ['#10200f', '#3a5a22', '#8aa84a', '#e3e8b0'] },
      { name: 'Meadow', colors: ['#14301a', '#3f8a3a', '#a8d65a', '#fff7a8'] },
      { name: 'Jungle', colors: ['#021a10', '#0b5a3a', '#1fb36b', '#d6ff9c'] },
      { name: 'Aurora', colors: ['#021a2b', '#0b6e6e', '#37d39b', '#b6ff6b', '#a56bff'] },
      { name: 'Orchard', colors: ['#2a0a0f', '#a3243a', '#e8643a', '#f6e27a', '#9fc75a'] },
      { name: 'Lavender Field', colors: ['#1d1236', '#5a3f9f', '#a98bdc', '#e8dcff'] },
      { name: 'Sea Glass', colors: ['#12302e', '#4a9a8a', '#9fd6c4', '#eafaf2'] },
      { name: 'Canyon', colors: ['#2a1208', '#8a3a1c', '#d98a4a', '#f2d6a8', '#6fa3a8'] },
      { name: 'Spring', colors: ['#1c3a2a', '#5aa86a', '#d6e86a', '#ffd6e8'] },
    ],
  },
  {
    group: 'Neon',
    palettes: [
      { name: 'Neon', colors: ['#12002b', '#7a00ff', '#ff00c8', '#00f0ff'] },
      { name: 'Synthwave', colors: ['#14002e', '#6a0dad', '#ff2a9a', '#ffd23a', '#00e5ff'] },
      { name: 'Cyberpunk', colors: ['#050014', '#3a00a8', '#ff0080', '#00ffd0'] },
      { name: 'Acid', colors: ['#031a0f', '#12ff8a', '#d4ff3a', '#ff3ad4'] },
      { name: 'Laser', colors: ['#020014', '#1400ff', '#ff00e6', '#fff200'] },
      { name: 'Electric Blue', colors: ['#00031a', '#0033ff', '#00c8ff', '#e0ffff'] },
      { name: 'Hot Pink', colors: ['#1a0010', '#b0005a', '#ff2a8a', '#ffd0e8'] },
      { name: 'Toxic', colors: ['#0a1400', '#3aa800', '#b8ff00', '#f4ffb0'] },
    ],
  },
  {
    group: 'Pastel',
    palettes: [
      { name: 'Candy', colors: ['#ff8fd0', '#ffd6e8', '#a8e6ff', '#b8a6ff'] },
      { name: 'Cotton', colors: ['#ffd6e8', '#d6e8ff', '#fff4c9', '#d9f5e0'] },
      { name: 'Sorbet', colors: ['#ffb3c1', '#ffd8a8', '#fff3b0', '#b8f0d0'] },
      { name: 'Macaron', colors: ['#f6c1d0', '#f9d7b5', '#c9d6f5', '#e6d4f5'] },
      { name: 'Mint Cream', colors: ['#d6f5e8', '#e8fff4', '#fff0f5', '#d6e8ff'] },
      { name: 'Lilac Haze', colors: ['#cdb8ff', '#e6d4ff', '#ffd6f0', '#c9e8ff'] },
      { name: 'Buttercup', colors: ['#fff3b0', '#ffe0a8', '#ffd0c9', '#e8f5d0'] },
      { name: 'Sky Pastel', colors: ['#a8d8ff', '#d0ecff', '#fff0f5', '#e8d6ff'] },
      { name: 'Blush', colors: ['#f8c8d4', '#fde0e6', '#fff1e8', '#e6dcf5'] },
      { name: 'Seafoam', colors: ['#bfeee0', '#d6f5f0', '#eaf7ff', '#fdf0f5'] },
    ],
  },
  {
    group: 'Dark & Moody',
    palettes: [
      { name: 'Noir Violet', colors: ['#05020a', '#240a3a', '#5a1f8a', '#c08aff'] },
      { name: 'Blood Moon', colors: ['#080204', '#3a0a14', '#8a1f2a', '#ff8a6a'] },
      { name: 'Abyss', colors: ['#000208', '#06143a', '#143a7a', '#5a9aff'] },
      { name: 'Graphite', colors: ['#050505', '#1c1c24', '#3a3f55', '#8a93b5'] },
      { name: 'Ink', colors: ['#05060f', '#1b1b4a', '#4a3f9f', '#b9a8ff'] },
      { name: 'Smoke Gold', colors: ['#0a0805', '#2a2014', '#8a6a2a', '#f0d28a'] },
      { name: 'Deep Forest', colors: ['#020a06', '#0a2a1a', '#1f6a3f', '#7ad6a0'] },
      { name: 'Eclipse', colors: ['#020205', '#14142a', '#4a3a7a', '#ffb87a'] },
    ],
  },
  {
    group: 'Mono & Earth',
    palettes: [
      { name: 'Mono', colors: ['#050505', '#3a3a3a', '#a8a8a8', '#f4f4f4'] },
      { name: 'Sepia', colors: ['#1a0f08', '#5a3a22', '#b08a5a', '#f2e2c4'] },
      { name: 'Slate', colors: ['#0f1318', '#2f3a46', '#7a8a9a', '#e0e6ec'] },
      { name: 'Sand', colors: ['#3a2a1a', '#a8825a', '#dcc29a', '#f8f0e0'] },
      { name: 'Clay', colors: ['#2a1410', '#8a4a3a', '#c98a6a', '#f0d6c0'] },
      { name: 'Bone', colors: ['#2a2622', '#8a8276', '#d6cfc0', '#faf7f0'] },
      { name: 'Copper', colors: ['#120804', '#6a3418', '#c9783a', '#f5d0a0'] },
      { name: 'Chrome', colors: ['#0a0c10', '#4a5260', '#b8c2d0', '#ffffff'] },
    ],
  },
];

// Flat list, for places that just want every palette.
export const PALETTE_PRESETS: PalettePreset[] = PALETTE_GROUPS.flatMap(g => g.palettes);

// The dark-ground gradients (Eclipse, Vortex, Light Beam...) treat a palette's first
// color as the near-black backdrop, so only palettes that start dark suit them.
export const DARK_GROUND_GRADIENTS = ['eclipse', 'vortex', 'light-beam', 'edge-glow', 'curtains', 'rays', 'bokeh', 'embers'];

export function startsDark(p: PalettePreset): boolean {
  const n = parseInt(p.colors[0].slice(1), 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum < 0.16;
}
