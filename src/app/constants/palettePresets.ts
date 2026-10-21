// Gradient-agnostic starting palettes for the Color tab's chips. Unlike a Look
// (constants/gradientLooks.ts) these touch nothing but the colors, so they work
// with whichever gradient is on screen.
export interface PalettePreset {
  name: string;
  colors: string[];
}

export const PALETTE_PRESETS: PalettePreset[] = [
  { name: 'Sunset', colors: ['#2b1055', '#c33764', '#ff7b54', '#ffd479'] },
  { name: 'Ocean', colors: ['#03045e', '#0077b6', '#00b4d8', '#caf0f8'] },
  { name: 'Forest', colors: ['#0b2b1d', '#1f6f4a', '#7bc67e', '#e6f5c9'] },
  { name: 'Neon', colors: ['#12002b', '#7a00ff', '#ff00c8', '#00f0ff'] },
  { name: 'Ember', colors: ['#120300', '#7a1b00', '#ff5a1f', '#ffd29a'] },
  { name: 'Candy', colors: ['#ff8fd0', '#ffd6e8', '#a8e6ff', '#b8a6ff'] },
  { name: 'Mono', colors: ['#050505', '#3a3a3a', '#a8a8a8', '#f4f4f4'] },
  { name: 'Aurora', colors: ['#021a2b', '#0b6e6e', '#37d39b', '#b6ff6b', '#a56bff'] },
];
