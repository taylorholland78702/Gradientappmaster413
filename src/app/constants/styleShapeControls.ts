import type { GradientType } from './gradientEffects';

// Each styled-field gradient exposes two extra sliders, "A" and "B", on top of
// the shared Scale / Speed. Both are multipliers on a value inside the shader,
// so 1 is always the gradient's original look. What they steer is specific to
// the gradient, which is why they're described here and the shaders in
// drawStyleFieldGL.ts read them as plain uA / uB.
export interface ShapeControl {
  label: string;
  hint: string;
}

export const SHAPE_MIN = 0.4;
export const SHAPE_MAX = 2.0;

export const STYLE_SHAPE_CONTROLS: Partial<Record<GradientType, [ShapeControl, ShapeControl]>> = {
  smoke: [{ label: 'Warp', hint: 'How hard the smoke folds over itself' }, { label: 'Density', hint: 'Thicker or thinner smoke' }],
  glass: [{ label: 'Bump', hint: 'Height of the glass surface — deeper refraction' }, { label: 'Shine', hint: 'Strength of the highlights' }],
  mesh: [{ label: 'Softness', hint: 'How far each color blob bleeds into its neighbors' }, { label: 'Drift', hint: 'How far the blobs wander' }],
  mercury: [{ label: 'Relief', hint: 'How steep the liquid surface is' }, { label: 'Shine', hint: 'Strength of the specular glint' }],
  contour: [{ label: 'Levels', hint: 'Number of contour lines' }, { label: 'Line', hint: 'Thickness of the lines' }],
  tunnel: [{ label: 'Twist', hint: 'How much the tunnel corkscrews' }, { label: 'Depth', hint: 'Ring spacing — more rings, deeper tunnel' }],
  nebula: [{ label: 'Cloud', hint: 'How much of the frame the gas fills' }, { label: 'Stars', hint: 'Star density' }],
  prism: [{ label: 'Facets', hint: 'Number of crystal facets' }, { label: 'Dispersion', hint: 'How far the colors split at the edges' }],
  raindrops: [{ label: 'Rate', hint: 'How fast new drops land' }, { label: 'Density', hint: 'How many drops at once' }],
  holographic: [{ label: 'Film', hint: 'How many times the foil cycles through the palette' }, { label: 'Sparkle', hint: 'Strength of the glitter' }],
  waves: [{ label: 'Amplitude', hint: 'Height of the swells' }, { label: 'Thickness', hint: 'Thickness of each ribbon' }],
  'light-beam': [{ label: 'Width', hint: 'Width of the beam' }, { label: 'Angle', hint: 'Direction the beam points' }],
  'edge-glow': [{ label: 'Reach', hint: 'How far the glow climbs' }, { label: 'Ripple', hint: 'How wavy the glow’s crest is' }],
  curtains: [{ label: 'Folds', hint: 'Number of folds across the frame' }, { label: 'Height', hint: 'How high the light rises' }],
  eclipse: [{ label: 'Ring size', hint: 'Radius of the dark disc' }, { label: 'Corona', hint: 'Thickness of the glowing ring' }],
  rays: [{ label: 'Ray count', hint: 'Number of rays' }, { label: 'Reach', hint: 'How far the light spreads' }],
  bokeh: [{ label: 'Disc size', hint: 'Size of the soft discs' }, { label: 'Density', hint: 'How many discs' }],
  vortex: [{ label: 'Radius', hint: 'Size of the ring' }, { label: 'Tilt', hint: 'How edge-on the ring is seen' }],
  spectral: [{ label: 'Distance', hint: 'How far the arc sits from the corner' }, { label: 'Spread', hint: 'Width of the rainbow band' }],
  drape: [{ label: 'Depth', hint: 'How deep the folds are' }, { label: 'Sheen', hint: 'Strength of the satin highlight' }],
  'flow-mesh': [{ label: 'Flow', hint: 'How strongly the flow bends the colors' }, { label: 'Silk', hint: 'Strength of the satin folds' }],
  ribbon: [{ label: 'Width', hint: 'Width of the ribbon' }, { label: 'Twist', hint: 'How much the color twists along it' }],
  strands: [{ label: 'Spacing', hint: 'Gap between strands' }, { label: 'Thickness', hint: 'Thickness of each strand' }],
  iridescent: [{ label: 'Swirl size', hint: 'Scale of the oil-slick swirls' }, { label: 'Film', hint: 'How many color cycles the film runs through' }],
  embers: [{ label: 'Ember size', hint: 'Size of the glowing sparks' }, { label: 'Density', hint: 'How many sparks' }],
  bands: [{ label: 'Waviness', hint: 'How much the bands undulate' }, { label: 'Softness', hint: 'How soft the edges between bands are' }],
  sheen: [{ label: 'Streak', hint: 'How long and brushed the streaks are' }, { label: 'Gloss', hint: 'Strength of the highlight bands' }],
};
