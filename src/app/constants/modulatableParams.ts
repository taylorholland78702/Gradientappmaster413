// Auto-generated registry of every numeric slider that flows through the
// draw pipeline's P object, used by the audio modulation panel (Audio tab)
// to let the user bind ANY slider to an audio band by name, instead of
// retrofitting a bind-icon onto each of the ~130 individual slider rows
// across GradientsTab.tsx/EffectsTab.tsx. Applied generically in
// useCanvasDraw.ts by adding to drawCtx[param] before the draw call, so it
// works for every entry here without per-slider wiring.
//
// Labels are always the full camelCase key humanized (e.g. attractorPointCount
// -> "Attractor Point Count"), never a bare slider label like "Points" or
// "Zoom" -- in a flat list spanning every gradient/effect, a bare label like
// that is ambiguous about which one it modulates. `category` groups the
// dropdown by owning gradient/effect.
export interface ModulatableParam {
  key: string;
  label: string;
  category: string;
  min: number;
  max: number;
  // The key actually read off the draw context, when it differs from `key`.
  // The styled-field gradients (Smoke, Glass, ...) all share one Scale and one
  // Speed slider (fieldScale/fieldSpeed), but each lists its own entries here
  // so the picker shows them under the gradient's name; `key` stays unique per
  // entry (it identifies the binding and the <option>) while `target` points
  // every one of them at the shared value. See resolveModulationKey.
  target?: string;
  // Scales the binding's Amount for settings whose range is much wider than 0-1 (hue in degrees, say), so the
  // same Amount reads similarly across settings. Default 1.
  gain?: number;
}

export const MODULATABLE_PARAMS: ModulatableParam[] = [
  // Global settings: every look has them, so they are not tied to one gradient or effect.
  { key: 'fieldContrast', label: 'Palette Mapping Contrast', category: 'Palette Mapping', min: 0.3, max: 3.0 },
  { key: 'paletteBands', label: 'Palette Mapping Bands', category: 'Palette Mapping', min: 2.0, max: 16.0, gain: 3 },
  { key: 'asciiSize', label: 'Ascii Size', category: 'ASCII', min: 6.0, max: 40.0 },
  { key: 'angleCenterX', label: 'Angle Center X', category: 'Angle', min: 0.0, max: 100.0 },
  { key: 'angleCenterY', label: 'Angle Center Y', category: 'Angle', min: 0.0, max: 100.0 },
  { key: 'angleStartOffset', label: 'Angle Start Offset', category: 'Angle', min: 0.0, max: 360.0 },
  { key: 'attractorDotSize', label: 'Attractor Dot Size', category: 'Attractor', min: 0.5, max: 6.0 },
  { key: 'attractorPointCount', label: 'Attractor Point Count', category: 'Attractor', min: 1.0, max: 20.0 },
  { key: 'attractorScale', label: 'Attractor Scale', category: 'Attractor', min: 0.3, max: 3.0 },
  { key: 'attractorSpeed', label: 'Attractor Speed', category: 'Attractor', min: 0.1, max: 5.0 },
  { key: 'attractorTrailFade', label: 'Attractor Trail Fade', category: 'Attractor', min: 0.01, max: 0.3 },
  { key: 'auraGlowCount', label: 'Aura Glow Count', category: 'Aura Glow', min: 1.0, max: 6.0 },
  { key: 'auraGlowSpeed', label: 'Aura Glow Speed', category: 'Aura Glow', min: 0.1, max: 3.0 },
  { key: 'auraGlowOpacity', label: 'Aura Glow Opacity', category: 'Aura Glow', min: 0.1, max: 1.0 },
  { key: 'bandsScale', label: 'Bands Scale', category: 'Bands', min: 0.3, max: 3.0, target: 'fieldScale' },
  { key: 'bandsSpeed', label: 'Bands Speed', category: 'Bands', min: 0.0, max: 3.0, target: 'fieldSpeed' },
  { key: 'bloomIntensity', label: 'Bloom Intensity', category: 'Bloom', min: 0.0, max: 2.0 },
  { key: 'bloomRadius', label: 'Bloom Radius', category: 'Bloom', min: 2.0, max: 40.0 },
  { key: 'blurGaussianAmount', label: 'Blur Gaussian Amount', category: 'Blur', min: 1.0, max: 50.0 },
  { key: 'blurMotionAmount', label: 'Blur Motion Amount', category: 'Blur', min: 1.0, max: 50.0 },
  { key: 'blurMotionDirection', label: 'Blur Motion Direction', category: 'Blur', min: 0.0, max: 360.0 },
  { key: 'blurRadialAmount', label: 'Blur Radial Amount', category: 'Blur', min: 1.0, max: 50.0 },
  { key: 'bokehScale', label: 'Bokeh Scale', category: 'Bokeh', min: 0.3, max: 3.0, target: 'fieldScale' },
  { key: 'bokehSpeed', label: 'Bokeh Speed', category: 'Bokeh', min: 0.0, max: 3.0, target: 'fieldSpeed' },
  { key: 'crtIntensity', label: 'Cathode Intensity', category: 'Cathode', min: 0.0, max: 1.0 },
  { key: 'crtScanlineSpacing', label: 'Cathode Scanlines', category: 'Cathode', min: 1.0, max: 6.0 },
  { key: 'causticsBrightness', label: 'Caustics Brightness', category: 'Caustics', min: 0.5, max: 5.0 },
  { key: 'causticsScale', label: 'Caustics Scale', category: 'Caustics', min: 1.0, max: 12.0 },
  { key: 'causticsSpeed', label: 'Caustics Speed', category: 'Caustics', min: 0.1, max: 3.0 },
  { key: 'chromaticTrailsDecay', label: 'Chroma Trails Decay', category: 'Chroma Trails', min: 0.5, max: 0.99 },
  { key: 'chromaticTrailsOffset', label: 'Chroma Trails Offset', category: 'Chroma Trails', min: 1.0, max: 30.0 },
  { key: 'chromaticAngle', label: 'Chromatic Angle', category: 'Chromatic', min: 0.0, max: 360.0 },
  { key: 'chromaticOffset', label: 'Chromatic Offset', category: 'Chromatic', min: 1.0, max: 200.0 },
  { key: 'contourScale', label: 'Contour Scale', category: 'Contour', min: 0.3, max: 3.0, target: 'fieldScale' },
  { key: 'contourSpeed', label: 'Contour Speed', category: 'Contour', min: 0.0, max: 3.0, target: 'fieldSpeed' },
  { key: 'curtainsScale', label: 'Curtains Scale', category: 'Curtains', min: 0.3, max: 3.0, target: 'fieldScale' },
  { key: 'curtainsSpeed', label: 'Curtains Speed', category: 'Curtains', min: 0.0, max: 3.0, target: 'fieldSpeed' },
  { key: 'dadaPanels', label: 'Dada Panels', category: 'Dada', min: 2.0, max: 8.0 },
  { key: 'dadaChaos', label: 'Dada Chaos', category: 'Dada', min: 0.0, max: 1.0 },
  { key: 'ditherLevels', label: 'Dither Levels', category: 'Dither', min: 2.0, max: 16.0 },
  { key: 'ditherScale', label: 'Dither Scale', category: 'Dither', min: 1.0, max: 8.0 },
  { key: 'drapeScale', label: 'Drape Scale', category: 'Drape', min: 0.3, max: 3.0, target: 'fieldScale' },
  { key: 'drapeSpeed', label: 'Drape Speed', category: 'Drape', min: 0.0, max: 3.0, target: 'fieldSpeed' },
  { key: 'duotoneIntensity', label: 'Duotone Intensity', category: 'Duotone', min: 0.0, max: 1.0 },
  { key: 'eclipseScale', label: 'Eclipse Scale', category: 'Eclipse', min: 0.3, max: 3.0, target: 'fieldScale' },
  { key: 'eclipseSpeed', label: 'Eclipse Speed', category: 'Eclipse', min: 0.0, max: 3.0, target: 'fieldSpeed' },
  { key: 'edgeGlowScale', label: 'Edge Glow Scale', category: 'Edge Glow', min: 0.3, max: 3.0, target: 'fieldScale' },
  { key: 'edgeGlowSpeed', label: 'Edge Glow Speed', category: 'Edge Glow', min: 0.0, max: 3.0, target: 'fieldSpeed' },
  { key: 'fieldSwirl', label: 'Styled Gradients Swirl', category: 'Styled gradients', min: 0.0, max: 2.0 },
  { key: 'fieldShapeA', label: 'Styled Gradients Shape 1', category: 'Styled gradients', min: 0.4, max: 2.0 },
  { key: 'fieldShapeB', label: 'Styled Gradients Shape 2', category: 'Styled gradients', min: 0.4, max: 2.0 },
  { key: 'embersScale', label: 'Embers Scale', category: 'Embers', min: 0.3, max: 3.0, target: 'fieldScale' },
  { key: 'embersSpeed', label: 'Embers Speed', category: 'Embers', min: 0.0, max: 3.0, target: 'fieldSpeed' },
  { key: 'emojiRotateSpeed', label: 'Emoji Rotate Speed', category: 'Emoji', min: 0.0, max: 180.0 },
  { key: 'emojiSize', label: 'Emoji Size', category: 'Emoji', min: 10.0, max: 60.0 },
  { key: 'emojiSizeVariation', label: 'Emoji Size Variation', category: 'Emoji', min: 0.0, max: 100.0 },
  { key: 'emojiOffsetX', label: 'Emoji Row Offset', category: 'Emoji', min: -80.0, max: 80.0, gain: 10 },
  { key: 'feedbackDecay', label: 'Feedback Decay', category: 'Feedback', min: 0.5, max: 0.97 },
  { key: 'feedbackRotation', label: 'Feedback Spin', category: 'Feedback', min: -10.0, max: 10.0, gain: 3 },
  { key: 'feedbackZoom', label: 'Feedback Zoom', category: 'Feedback', min: 0.0, max: 5.0 },
  { key: 'flowParticleCount', label: 'Flow Particle Count', category: 'Flow Field', min: 20.0, max: 800.0 },
  { key: 'flowScale', label: 'Flow Scale', category: 'Flow Field', min: 0.5, max: 10.0 },
  { key: 'flowSpeed', label: 'Flow Speed', category: 'Flow Field', min: 0.1, max: 5.0 },
  { key: 'flowThickness', label: 'Flow Thickness', category: 'Flow Field', min: 0.5, max: 6.0 },
  { key: 'flowMeshScale', label: 'Flow Mesh Scale', category: 'Flow Mesh', min: 0.3, max: 3.0, target: 'fieldScale' },
  { key: 'flowMeshSpeed', label: 'Flow Mesh Speed', category: 'Flow Mesh', min: 0.0, max: 3.0, target: 'fieldSpeed' },
  { key: 'flowerCircles', label: 'Flower Circles', category: 'Flower', min: 1.0, max: 12.0 },
  { key: 'flowerScale', label: 'Flower Scale', category: 'Flower', min: 0.1, max: 3.0 },
  { key: 'flowerSpread', label: 'Flower Spread', category: 'Flower', min: 0.3, max: 2.5 },
  { key: 'flowerSpeed', label: 'Flower Speed', category: 'Flower', min: 0.1, max: 3.0 },
  { key: 'flowerOpacity', label: 'Flower Opacity', category: 'Flower', min: 0.2, max: 1.5 },
  { key: 'flowerSymmetry', label: 'Flower Symmetry', category: 'Flower', min: 3.0, max: 12.0, gain: 3 },
  { key: 'glassScale', label: 'Glass Scale', category: 'Glass', min: 0.3, max: 3.0, target: 'fieldScale' },
  { key: 'glassSpeed', label: 'Glass Speed', category: 'Glass', min: 0.0, max: 3.0, target: 'fieldSpeed' },
  { key: 'dustCrackleIntensity', label: 'Dust Crackle Intensity', category: 'Grain', min: 0.0, max: 1.0 },
  { key: 'gessoWhiteness', label: 'Gesso Whiteness', category: 'Gesso', min: 0.0, max: 0.94 },
  { key: 'gessoTexture', label: 'Gesso Texture', category: 'Gesso', min: 0.0, max: 1.0 },
  { key: 'gessoResponse', label: 'Gesso Response', category: 'Gesso', min: 0.0, max: 1.0 },
  { key: 'grainIntensity', label: 'Grain Intensity', category: 'Grain', min: 0.0, max: 1.0 },
  { key: 'dustCrackleLength', label: 'Dust Crackle Length', category: 'Grain', min: 0.3, max: 3.0 },
  { key: 'grainSize', label: 'Grain Size', category: 'Grain', min: 1.0, max: 6.0 },
  { key: 'gridColumns', label: 'Grid Columns', category: 'Grid', min: 2.0, max: 50.0 },
  { key: 'gridCellAngleStep', label: 'Grid Cell Angle Step', category: 'Grid', min: 0.0, max: 90.0, gain: 20 },
  { key: 'gridRows', label: 'Grid Rows', category: 'Grid', min: 2.0, max: 50.0 },
  // Sides/Variation/Shape Size only affect the Grid *effect*, not the Grid
  // *gradient* (drawGrid.ts only reads gridRows/gridColumns) — a separate
  // category so Modulation shuffle doesn't bind to a slider that does
  // nothing when the Grid gradient (not the effect) is what's active.
  { key: 'gridSides', label: 'Grid Effect Sides', category: 'Grid Effect', min: 1.0, max: 10.0 },
  { key: 'gridVariation', label: 'Grid Effect Variation', category: 'Grid Effect', min: 0.0, max: 1.0 },
  { key: 'gridShapeSize', label: 'Grid Effect Shape Size', category: 'Grid Effect', min: 1.0, max: 100.0 },
  { key: 'holographicScale', label: 'Holographic Scale', category: 'Holographic', min: 0.3, max: 3.0, target: 'fieldScale' },
  { key: 'holographicSpeed', label: 'Holographic Speed', category: 'Holographic', min: 0.0, max: 3.0, target: 'fieldSpeed' },
  { key: 'iridescentScale', label: 'Iridescent Scale', category: 'Iridescent', min: 0.3, max: 3.0, target: 'fieldScale' },
  { key: 'iridescentSpeed', label: 'Iridescent Speed', category: 'Iridescent', min: 0.0, max: 3.0, target: 'fieldSpeed' },
  { key: 'lightBeamScale', label: 'Light Beam Scale', category: 'Light Beam', min: 0.3, max: 3.0, target: 'fieldScale' },
  { key: 'lightBeamSpeed', label: 'Light Beam Speed', category: 'Light Beam', min: 0.0, max: 3.0, target: 'fieldSpeed' },
  { key: 'mercuryScale', label: 'Mercury Scale', category: 'Mercury', min: 0.3, max: 3.0, target: 'fieldScale' },
  { key: 'mercurySpeed', label: 'Mercury Speed', category: 'Mercury', min: 0.0, max: 3.0, target: 'fieldSpeed' },
  { key: 'meshScale', label: 'Mesh Scale', category: 'Mesh', min: 0.3, max: 3.0, target: 'fieldScale' },
  { key: 'meshSpeed', label: 'Mesh Speed', category: 'Mesh', min: 0.0, max: 3.0, target: 'fieldSpeed' },
  { key: 'polygon2Sides', label: 'Shapes Radials', category: 'Polar Grid', min: 1.0, max: 24.0 },
  { key: 'halftoneSize', label: 'Halftone Size', category: 'Halftone', min: 2.0, max: 200.0 },
  { key: 'halftoneVariation', label: 'Halftone Variation', category: 'Halftone', min: 0.0, max: 1.0 },
  { key: 'helixTightness', label: 'Helix Tightness', category: 'Helix', min: 0.1, max: 2.0 },
  { key: 'helixTurns', label: 'Helix Turns', category: 'Helix', min: 1.0, max: 20.0 },
  { key: 'invertAmount', label: 'Invert Amount', category: 'Invert', min: 0.0, max: 1.0 },
  { key: 'juliaIterations', label: 'Julia Iterations', category: 'Julia Set', min: 20.0, max: 120.0 },
  { key: 'juliaReal', label: 'Julia Real', category: 'Julia Set', min: -1.0, max: 1.0 },
  { key: 'juliaImaginary', label: 'Julia Imaginary', category: 'Julia Set', min: -1.0, max: 1.0 },
  { key: 'juliaSpeed', label: 'Julia Set Speed', category: 'Julia Set', min: 0.1, max: 3.0 },
  { key: 'juliaZoom', label: 'Julia Zoom', category: 'Julia Set', min: 0.3, max: 3.0 },
  { key: 'kaleidoscopeRotateSpeed', label: 'Kaleidoscope Rotate Speed', category: 'Kaleidoscope', min: 0.0, max: 5.0 },
  { key: 'kaleidoscopeSegments', label: 'Kaleidoscope Segments', category: 'Kaleidoscope', min: 2.0, max: 50.0 },
  { key: 'lavaBlobCount', label: 'Lava Blob Count', category: 'Lava Lamp', min: 2.0, max: 12.0 },
  { key: 'lavaBlobSize', label: 'Lava Blob Size', category: 'Lava Lamp', min: 0.05, max: 0.4 },
  { key: 'lavaSpeed', label: 'Lava Speed', category: 'Lava Lamp', min: 0.1, max: 5.0 },
  { key: 'liquidScale', label: 'Liquid Scale', category: 'Liquid', min: 0.5, max: 10.0 },
  { key: 'liquidStrength', label: 'Liquid Strength', category: 'Liquid', min: 0.0, max: 100.0 },
  { key: 'marbleOctaves', label: 'Marble Octaves', category: 'Marble', min: 1.0, max: 8.0 },
  { key: 'marbleSpeed', label: 'Marble Speed', category: 'Marble', min: 0.1, max: 3.0 },
  { key: 'marbleTurbulence', label: 'Marble Turbulence', category: 'Marble', min: 0.0, max: 5.0 },
  { key: 'marbleVeinFreq', label: 'Marble Vein Freq', category: 'Marble', min: 0.5, max: 10.0 },
  { key: 'metaballCount', label: 'Metaball Count', category: 'Metaballs', min: 2.0, max: 14.0 },
  { key: 'metaballSize', label: 'Metaball Size', category: 'Metaballs', min: 0.05, max: 0.4 },
  { key: 'metaballSpeed', label: 'Metaball Speed', category: 'Metaballs', min: 0.1, max: 5.0 },
  { key: 'mirrorTileCount', label: 'Mirror Tile Count', category: 'Mirror', min: 2.0, max: 16.0 },
  { key: 'noiseDirection', label: 'Noise Direction', category: 'Noise', min: 0.0, max: 360.0 },
  { key: 'noiseOctaves', label: 'Noise Octaves', category: 'Noise', min: 1.0, max: 8.0 },
  { key: 'noiseScale', label: 'Noise Scale', category: 'Noise', min: 10.0, max: 200.0 },
  { key: 'noiseWarp', label: 'Noise Warp', category: 'Noise', min: 0.0, max: 1.0 },
  { key: 'noiseSpeed', label: 'Noise Speed', category: 'Noise', min: 0.1, max: 3.0 },
  { key: 'oilPaintRadius', label: 'Oil Paint Radius', category: 'Oil Paint', min: 1.0, max: 6.0 },
  { key: 'oilPaintLevels', label: 'Oil Paint Levels', category: 'Oil Paint', min: 8.0, max: 40.0 },
  { key: 'impastoStrength', label: 'Impasto Strength', category: 'Impasto', min: 1.0, max: 7.0 },
  { key: 'impastoLightAngle', label: 'Impasto Light Angle', category: 'Impasto', min: 0.0, max: 359.0 },
  { key: 'particlesCount', label: 'Particles Count', category: 'Particles', min: 10.0, max: 500.0 },
  { key: 'particlesSize', label: 'Particles Size', category: 'Particles', min: 0.5, max: 10.0 },
  { key: 'particlesSides', label: 'Particles Sides', category: 'Particles', min: 1.0, max: 8.0 },
  { key: 'marksCount', label: 'Marks Count', category: 'Marks', min: 1.0, max: 16.0 },
  { key: 'marksSize', label: 'Marks Size', category: 'Marks', min: 10.0, max: 80.0 },
  { key: 'marksDecay', label: 'Marks Decay', category: 'Marks', min: 0.5, max: 0.99 },
  { key: 'particlesSpeed', label: 'Particles Speed', category: 'Particles', min: 0.1, max: 5.0 },
  { key: 'particlesTrail', label: 'Particles Trail', category: 'Particles', min: 0.02, max: 0.5 },
  { key: 'particlesGravity', label: 'Particles Gravity', category: 'Particles', min: 0.0, max: 3.0 },
  { key: 'photoOpacity', label: 'Photo Opacity', category: 'Photo', min: 0.0, max: 100.0 },
  { key: 'pixelSize', label: 'Pixel Size', category: 'Pixelate', min: 5.0, max: 200.0 },
  { key: 'posterizeLevels', label: 'Posterize Levels', category: 'Posterize', min: 2.0, max: 16.0 },
  { key: 'prismScale', label: 'Prism Scale', category: 'Prism', min: 0.3, max: 3.0, target: 'fieldScale' },
  { key: 'prismSpeed', label: 'Prism Speed', category: 'Prism', min: 0.0, max: 3.0, target: 'fieldSpeed' },
  { key: 'radialSizeScale', label: 'Radial Size Scale', category: 'Radial', min: 0.25, max: 4.0 },
  { key: 'radialSpeed', label: 'Radial Speed', category: 'Radial', min: 0.1, max: 3.0 },
  { key: 'radialBurstCount', label: 'Radial Burst Count', category: 'Radial Burst', min: 3.0, max: 16.0 },
  { key: 'radialBurstSize', label: 'Radial Burst Size', category: 'Radial Burst', min: 10.0, max: 200.0 },
  { key: 'radialBurstSpread', label: 'Radial Burst Spread', category: 'Radial Burst', min: 10.0, max: 100.0 },
  { key: 'raindropsScale', label: 'Raindrops Scale', category: 'Raindrops', min: 0.3, max: 3.0, target: 'fieldScale' },
  { key: 'raindropsSpeed', label: 'Raindrops Speed', category: 'Raindrops', min: 0.0, max: 3.0, target: 'fieldSpeed' },
  { key: 'raysScale', label: 'Rays Scale', category: 'Rays', min: 0.3, max: 3.0, target: 'fieldScale' },
  { key: 'raysSpeed', label: 'Rays Speed', category: 'Rays', min: 0.0, max: 3.0, target: 'fieldSpeed' },
  { key: 'reactionDiffusionFeed', label: 'Reaction Diffusion Feed', category: 'Reaction-Diffusion', min: 0.02, max: 0.08 },
  { key: 'reactionDiffusionKill', label: 'Reaction Diffusion Kill', category: 'Reaction-Diffusion', min: 0.04, max: 0.07 },
  { key: 'reactionDiffusionSpeed', label: 'Reaction Diffusion Speed', category: 'Reaction-Diffusion', min: 0.2, max: 3.0 },
  { key: 'concentricRingCount', label: 'Concentric Ring Count', category: 'Shapes', min: 1.0, max: 30.0 },
  { key: 'concentricRingWidth', label: 'Concentric Ring Width', category: 'Shapes', min: 10.0, max: 300.0 },
  { key: 'ribbonScale', label: 'Ribbon Scale', category: 'Ribbon', min: 0.3, max: 3.0, target: 'fieldScale' },
  { key: 'ribbonSpeed', label: 'Ribbon Speed', category: 'Ribbon', min: 0.0, max: 3.0, target: 'fieldSpeed' },
  { key: 'shapesCount', label: 'Shapes Count', category: 'Shapes', min: 1.0, max: 50.0 },
  { key: 'shapesSpeed', label: 'Shapes Speed', category: 'Shapes', min: 0.1, max: 3.0 },
  { key: 'shapesSides', label: 'Shapes Sides', category: 'Shapes', min: 1.0, max: 10.0 },
  { key: 'smokeScale', label: 'Smoke Scale', category: 'Smoke', min: 0.3, max: 3.0, target: 'fieldScale' },
  { key: 'smokeSpeed', label: 'Smoke Speed', category: 'Smoke', min: 0.0, max: 3.0, target: 'fieldSpeed' },
  { key: 'spectralScale', label: 'Spectral Scale', category: 'Spectral', min: 0.3, max: 3.0, target: 'fieldScale' },
  { key: 'spectralSpeed', label: 'Spectral Speed', category: 'Spectral', min: 0.0, max: 3.0, target: 'fieldSpeed' },
  { key: 'stackCount', label: 'Stack Count', category: 'Stack', min: 2.0, max: 40.0 },
  { key: 'stackGap', label: 'Stack Gap', category: 'Stack', min: 0.0, max: 0.8 },
  { key: 'stackWidth', label: 'Stack Width', category: 'Stack', min: 0.1, max: 2.0 },
  { key: 'stackLength', label: 'Stack Length', category: 'Stack', min: 0.1, max: 2.0 },
  { key: 'hatchLayers', label: 'Hatch Layers', category: 'Hatch', min: 1.0, max: 4.0 },
  { key: 'hatchSpacing', label: 'Hatch Spacing', category: 'Hatch', min: 3.0, max: 40.0 },
  { key: 'hatchResponse', label: 'Hatch Response', category: 'Hatch', min: 0.0, max: 1.0 },
  { key: 'hatchSpeed', label: 'Hatch Speed', category: 'Hatch', min: 0.1, max: 3.0 },
  { key: 'stackResponse', label: 'Stack Response', category: 'Stack', min: 0.0, max: 1.0 },
  { key: 'stackSpeed', label: 'Stack Speed', category: 'Stack', min: 0.1, max: 3.0 },
  { key: 'colorShiftHue', label: 'Color Shift Hue', category: 'Shift', min: 0.0, max: 255.0 },
  { key: 'slitScanIntensity', label: 'Slit Scan Intensity', category: 'Slit-Scan', min: 0.1, max: 10.0 },
  { key: 'slitScanHistory', label: 'Slit Scan History', category: 'Slit-Scan', min: 12.0, max: 120.0 },
  { key: 'slitScanSpeed', label: 'Slit Scan Speed', category: 'Slit-Scan', min: 0.0, max: 4.0 },
  { key: 'tilingSize', label: 'Tiling Size', category: 'Tiling', min: 30.0, max: 300.0 },
  { key: 'tilingSymmetry', label: 'Tiling Symmetry', category: 'Tiling', min: 2.0, max: 12.0 },
  { key: 'tilingComplexity', label: 'Tiling Complexity', category: 'Tiling', min: 0.5, max: 10.0 },
  { key: 'tilingRotation', label: 'Tiling Rotation', category: 'Tiling', min: 0.0, max: 360.0 },
  { key: 'tilingRowOffset', label: 'Tiling Row Offset', category: 'Tiling', min: -100.0, max: 100.0 },
  { key: 'topographicBands', label: 'Topographic Bands', category: 'Topographic', min: 3.0, max: 30.0 },
  { key: 'topographicLineWidth', label: 'Topographic Line Width', category: 'Topographic', min: 0.01, max: 0.15 },
  { key: 'topographicScale', label: 'Topographic Scale', category: 'Topographic', min: 10.0, max: 100.0 },
  { key: 'triangleSize', label: 'Triangle Size', category: 'Triangulate', min: 10.0, max: 200.0 },
  { key: 'triangulateVariation', label: 'Triangulate Variation', category: 'Triangulate', min: 0.0, max: 1.0 },
  { key: 'truchetSize', label: 'Truchet Size', category: 'Truchet', min: 15.0, max: 100.0 },
  { key: 'truchetThickness', label: 'Truchet Thickness', category: 'Truchet', min: 1.0, max: 15.0 },
  { key: 'truchetSpeed', label: 'Truchet Speed', category: 'Truchet', min: 0.1, max: 3.0 },
  { key: 'truchetVariation', label: 'Truchet Variation', category: 'Truchet', min: 0.0, max: 1.0 },
  { key: 'tunnelScale', label: 'Tunnel Scale', category: 'Tunnel', min: 0.3, max: 3.0, target: 'fieldScale' },
  { key: 'tunnelSpeed', label: 'Tunnel Speed', category: 'Tunnel', min: 0.0, max: 3.0, target: 'fieldSpeed' },
  { key: 'vhsGlitchIntensity', label: 'VHS Glitch Intensity', category: 'VHS', min: 0.0, max: 1.0 },
  { key: 'vhsJitterAmount', label: 'VHS Jitter Amount', category: 'VHS', min: 50.0, max: 400.0 },
  { key: 'vignetteSoftness', label: 'Vignette Softness', category: 'Vignette', min: 0.0, max: 100.0 },
  { key: 'vignetteStrength', label: 'Vignette Strength', category: 'Vignette', min: 0.0, max: 1.0 },
  { key: 'voronoiCellCount', label: 'Voronoi Cell Count', category: 'Voronoi', min: 3.0, max: 30.0 },
  { key: 'voronoiDistortion', label: 'Voronoi Distortion', category: 'Voronoi', min: 0.0, max: 100.0 },
  { key: 'voronoiSpeed', label: 'Voronoi Speed', category: 'Voronoi', min: 0.1, max: 3.0 },
  { key: 'vortexScale', label: 'Vortex Scale', category: 'Vortex', min: 0.3, max: 3.0, target: 'fieldScale' },
  { key: 'vortexSpeed', label: 'Vortex Speed', category: 'Vortex', min: 0.0, max: 3.0, target: 'fieldSpeed' },
  { key: 'watercolorBleed', label: 'Watercolor Bleed', category: 'Watercolor', min: 0.0, max: 10.0 },
  { key: 'watercolorGrain', label: 'Watercolor Grain', category: 'Watercolor', min: 0.0, max: 1.0 },
  { key: 'waveDistortionRotation', label: 'Wave Distortion Rotation', category: 'Wave', min: 0.0, max: 360.0 },
  { key: 'waveDistortionStrength', label: 'Wave Distortion Strength', category: 'Wave', min: 5.0, max: 100.0 },
  { key: 'wavesScale', label: 'Waves Scale', category: 'Waves', min: 0.3, max: 3.0, target: 'fieldScale' },
  { key: 'wavesSpeed', label: 'Waves Speed', category: 'Waves', min: 0.0, max: 3.0, target: 'fieldSpeed' },
  { key: 'windmillRotations', label: 'Windmill Rotations', category: 'Windmill', min: 1.0, max: 10.0 },
  { key: 'windmillThickness', label: 'Windmill Thickness', category: 'Windmill', min: 5.0, max: 100.0 },
  { key: 'windmillZoomResponse', label: 'Windmill Zoom Response', category: 'Windmill', min: 0.0, max: 1.0 },
  { key: 'windmillTightness', label: 'Windmill Tightness', category: 'Windmill', min: 1.0, max: 20.0 },
];

// Grouped by category, in the same order categories first appear in
// MODULATABLE_PARAMS above (already alphabetical) — used to render the
// modulation param picker as <optgroup>s instead of one flat 128-item list.
export const MODULATABLE_PARAMS_BY_CATEGORY: { category: string; params: ModulatableParam[] }[] = (() => {
  const groups: { category: string; params: ModulatableParam[] }[] = [];
  const byCategory = new Map<string, ModulatableParam[]>();
  for (const param of MODULATABLE_PARAMS) {
    if (!byCategory.has(param.category)) {
      byCategory.set(param.category, []);
      groups.push({ category: param.category, params: byCategory.get(param.category)! });
    }
    byCategory.get(param.category)!.push(param);
  }
  return groups;
})();


// The draw-context key a modulation param actually drives: itself, unless the
// entry declares a shared `target` (see ModulatableParam.target).
const TARGET_BY_KEY: Record<string, string> = Object.fromEntries(
  MODULATABLE_PARAMS.filter((p) => p.target).map((p) => [p.key, p.target as string]),
);
// Amount multiplier per setting (see ModulatableParam.gain).
export const MODULATION_GAIN: Record<string, number> = Object.fromEntries(
  MODULATABLE_PARAMS.filter((p) => p.gain).map((p) => [p.key, p.gain as number]),
);

export const resolveModulationKey = (key: string): string => TARGET_BY_KEY[key] ?? key;
