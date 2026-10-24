import { STYLE_FIELD_GRADIENT_TYPES } from './gradientEffects';

// Maps a gradient/effect id to the MODULATABLE_PARAMS `category` string(s)
// that hold its sliders, so shuffleAudiovisuals can restrict random
// Modulation bindings to whatever is actually on screen instead of any of
// the ~130 params across every gradient/effect. An array because a few ids
// share sliders with another category (Polar Grid reuses Shapes' Ring
// Count/Width; the Grid effect reuses the Grid gradient's Rows/Columns).
// Not every id has an entry — freeform/linear/mesh no longer exist, and
// photo has a modulatable category but is excluded elsewhere from random
// pools since it's a no-op with no uploaded image.
export const GRADIENT_MOD_CATEGORY: Record<string, string[]> = {
  angle: ['Angle'], attractor: ['Attractor'], caustics: ['Caustics'],
  fireworks: ['Fireworks'], flower: ['Flower'], grid: ['Grid'],
  julia: ['Julia Set'], 'lava-lamp': ['Lava Lamp'], lightning: ['Lightning'], marble: ['Marble'],
  metaballs: ['Metaballs'],
  noise: ['Noise'], particles: ['Particles', 'Flow Field', 'Marks'], radial: ['Radial'], 'radial-burst': ['Radial Burst'],
  'reaction-diffusion': ['Reaction-Diffusion'], shapes: ['Shapes', 'Polar Grid'], tiling: ['Tiling'], topographic: ['Topographic'], truchet: ['Truchet'],
  voronoi: ['Voronoi'], windmill: ['Windmill', 'Helix'],
  stack: ['Stack'], hatch: ['Hatch'],
  // Styled-field gradients (drawStyleFieldGL.ts): each has its own Scale/Speed
  // entries in MODULATABLE_PARAMS under its display name ('Halftone (Gradient)'
  // is disambiguated from the Halftone effect's category).
  contour: ['Contour'], glass: ['Glass'], holographic: ['Holographic'],
  mercury: ['Mercury'], mesh: ['Mesh'], prism: ['Prism'], raindrops: ['Raindrops'], smoke: ['Smoke'],
  tunnel: ['Tunnel'], waves: ['Waves'], 'light-beam': ['Light Beam'], 'edge-glow': ['Edge Glow'], curtains: ['Curtains'],
  eclipse: ['Eclipse'], rays: ['Rays'], bokeh: ['Bokeh'], vortex: ['Vortex'], spectral: ['Spectral'], drape: ['Drape'],
  'flow-mesh': ['Flow Mesh'], ribbon: ['Ribbon'], iridescent: ['Iridescent'],
  embers: ['Embers'], bands: ['Bands'],
};

// Every styled gradient also has the shared Swirl slider, filed under its own category.
export const STYLED_GRADIENTS_CATEGORY = 'Styled gradients';

// The modulation categories a look uses: its gradient's, the styled gradients' shared one, and its effects'.
// Shuffle draws its random audio bindings from these, and share links carry only these settings.
export function modCategoriesFor(
  gradientType: string | null | undefined,
  effects: readonly string[],
  effectCategories: Record<string, string[]>,
): Set<string> {
  const out = new Set<string>(GRADIENT_MOD_CATEGORY[gradientType ?? ''] ?? []);
  if (gradientType && (STYLE_FIELD_GRADIENT_TYPES as readonly string[]).includes(gradientType)) out.add(STYLED_GRADIENTS_CATEGORY);
  for (const e of effects) for (const c of effectCategories[e] ?? []) out.add(c);
  return out;
}
