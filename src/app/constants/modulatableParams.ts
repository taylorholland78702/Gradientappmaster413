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
}

export const MODULATABLE_PARAMS: ModulatableParam[] = [
  { key: 'asciiSize', label: 'Ascii Size', category: 'ASCII', min: 6.0, max: 40.0 },
  { key: 'angleCenterX', label: 'Angle Center X', category: 'Angle', min: 0.0, max: 100.0 },
  { key: 'angleCenterY', label: 'Angle Center Y', category: 'Angle', min: 0.0, max: 100.0 },
  { key: 'angleStartOffset', label: 'Angle Start Offset', category: 'Angle', min: 0.0, max: 360.0 },
  { key: 'attractorDotSize', label: 'Attractor Dot Size', category: 'Attractor', min: 0.5, max: 6.0 },
  { key: 'attractorPointCount', label: 'Attractor Point Count', category: 'Attractor', min: 1.0, max: 20.0 },
  { key: 'attractorScale', label: 'Attractor Scale', category: 'Attractor', min: 0.3, max: 3.0 },
  { key: 'attractorSpeed', label: 'Attractor Speed', category: 'Attractor', min: 0.1, max: 5.0 },
  { key: 'attractorTrailFade', label: 'Attractor Trail Fade', category: 'Attractor', min: 0.01, max: 0.3 },
  { key: 'auroraBandCount', label: 'Aurora Band Count', category: 'Aurora', min: 2.0, max: 12.0 },
  { key: 'auroraBandHeight', label: 'Aurora Band Height', category: 'Aurora', min: 0.5, max: 4.0 },
  { key: 'auroraWaveSpeed', label: 'Aurora Wave Speed', category: 'Aurora', min: 0.1, max: 3.0 },
  { key: 'bloomIntensity', label: 'Bloom Intensity', category: 'Bloom', min: 0.0, max: 2.0 },
  { key: 'bloomRadius', label: 'Bloom Radius', category: 'Bloom', min: 2.0, max: 40.0 },
  { key: 'blurGaussianAmount', label: 'Blur Gaussian Amount', category: 'Blur', min: 1.0, max: 50.0 },
  { key: 'blurMotionAmount', label: 'Blur Motion Amount', category: 'Blur', min: 1.0, max: 50.0 },
  { key: 'blurMotionDirection', label: 'Blur Motion Direction', category: 'Blur', min: 0.0, max: 360.0 },
  { key: 'blurRadialAmount', label: 'Blur Radial Amount', category: 'Blur', min: 1.0, max: 50.0 },
  { key: 'causticsBrightness', label: 'Caustics Brightness', category: 'Caustics', min: 0.5, max: 5.0 },
  { key: 'causticsScale', label: 'Caustics Scale', category: 'Caustics', min: 1.0, max: 12.0 },
  { key: 'chromaticTrailsDecay', label: 'Chromatic Trails Decay', category: 'Chroma Trails', min: 0.5, max: 0.99 },
  { key: 'chromaticTrailsOffset', label: 'Chromatic Trails Offset', category: 'Chroma Trails', min: 1.0, max: 30.0 },
  { key: 'chromaticAngle', label: 'Chromatic Angle', category: 'Chromatic', min: 0.0, max: 360.0 },
  { key: 'chromaticOffset', label: 'Chromatic Offset', category: 'Chromatic', min: 1.0, max: 200.0 },
  { key: 'ditherLevels', label: 'Dither Levels', category: 'Dither', min: 2.0, max: 16.0 },
  { key: 'duotoneIntensity', label: 'Duotone Intensity', category: 'Duotone', min: 0.0, max: 1.0 },
  { key: 'emojiRotateSpeed', label: 'Emoji Rotate Speed', category: 'Emoji', min: 0.0, max: 180.0 },
  { key: 'emojiSize', label: 'Emoji Size', category: 'Emoji', min: 10.0, max: 60.0 },
  { key: 'emojiSizeVariation', label: 'Emoji Size Variation', category: 'Emoji', min: 0.0, max: 100.0 },
  { key: 'fadeDirection', label: 'Fade Direction', category: 'Fade', min: 0.0, max: 360.0 },
  { key: 'feedbackDecay', label: 'Feedback Decay', category: 'Feedback', min: 0.5, max: 0.97 },
  { key: 'feedbackZoom', label: 'Feedback Zoom', category: 'Feedback', min: 0.0, max: 5.0 },
  { key: 'fisheyeCenterX', label: 'Fisheye Center X', category: 'Fisheye', min: 0.0, max: 100.0 },
  { key: 'fisheyeCenterY', label: 'Fisheye Center Y', category: 'Fisheye', min: 0.0, max: 100.0 },
  { key: 'fisheyeStrength', label: 'Fisheye Strength', category: 'Fisheye', min: 0.0, max: 10.0 },
  { key: 'flowParticleCount', label: 'Flow Particle Count', category: 'Flow Field', min: 20.0, max: 800.0 },
  { key: 'flowScale', label: 'Flow Scale', category: 'Flow Field', min: 0.5, max: 10.0 },
  { key: 'flowSpeed', label: 'Flow Speed', category: 'Flow Field', min: 0.1, max: 5.0 },
  { key: 'flowThickness', label: 'Flow Thickness', category: 'Flow Field', min: 0.5, max: 6.0 },
  { key: 'flowerCircles', label: 'Flower Circles', category: 'Flower', min: 1.0, max: 12.0 },
  { key: 'flowerScale', label: 'Flower Scale', category: 'Flower', min: 0.1, max: 3.0 },
  { key: 'flowerSpread', label: 'Flower Spread', category: 'Flower', min: 0.3, max: 2.5 },
  { key: 'iridescentIntensity', label: 'Iridescent Intensity', category: 'General', min: 0.1, max: 2.0 },
  { key: 'iridescentScale', label: 'Iridescent Scale', category: 'General', min: 0.1, max: 10.0 },
  { key: 'glitchBlockSize', label: 'Glitch Block Size', category: 'Glitch', min: 4.0, max: 80.0 },
  { key: 'glitchChromaSplit', label: 'Glitch Chroma Split', category: 'Glitch', min: 0.0, max: 20.0 },
  { key: 'glitchIntensity', label: 'Glitch Intensity', category: 'Glitch', min: 0.05, max: 1.0 },
  { key: 'dustCrackleIntensity', label: 'Dust Crackle Intensity', category: 'Grain', min: 0.0, max: 1.0 },
  { key: 'grainIntensity', label: 'Grain Intensity', category: 'Grain', min: 0.0, max: 1.0 },
  { key: 'gridColumns', label: 'Grid Columns', category: 'Grid', min: 2.0, max: 50.0 },
  { key: 'gridRows', label: 'Grid Rows', category: 'Grid', min: 2.0, max: 50.0 },
  // Sides/Variation/Shape Size only affect the Grid *effect*, not the Grid
  // *gradient* (drawGrid.ts only reads gridRows/gridColumns) — a separate
  // category so Modulation shuffle doesn't bind to a slider that does
  // nothing when the Grid gradient (not the effect) is what's active.
  { key: 'gridSides', label: 'Grid Sides', category: 'Grid Effect', min: 1.0, max: 10.0 },
  { key: 'gridVariation', label: 'Grid Variation', category: 'Grid Effect', min: 0.0, max: 1.0 },
  { key: 'gridShapeSize', label: 'Grid Shape Size', category: 'Grid Effect', min: 1.0, max: 100.0 },
  { key: 'polygon2Sides', label: 'Radials', category: 'Polar Grid', min: 1.0, max: 24.0 },
  { key: 'halftoneSize', label: 'Halftone Size', category: 'Halftone', min: 2.0, max: 200.0 },
  { key: 'halftoneVariation', label: 'Halftone Variation', category: 'Halftone', min: 0.0, max: 1.0 },
  { key: 'helixTightness', label: 'Helix Tightness', category: 'Helix', min: 0.1, max: 2.0 },
  { key: 'helixTurns', label: 'Helix Turns', category: 'Helix', min: 1.0, max: 20.0 },
  { key: 'invertAmount', label: 'Invert Amount', category: 'Invert', min: 0.0, max: 1.0 },
  { key: 'juliaIterations', label: 'Julia Iterations', category: 'Julia Set', min: 20.0, max: 120.0 },
  { key: 'juliaZoom', label: 'Julia Zoom', category: 'Julia Set', min: 0.3, max: 3.0 },
  { key: 'kaleidoscopeRotateSpeed', label: 'Kaleidoscope Rotate Speed', category: 'Kaleidoscope', min: 0.0, max: 5.0 },
  { key: 'kaleidoscopeSegments', label: 'Kaleidoscope Segments', category: 'Kaleidoscope', min: 2.0, max: 50.0 },
  { key: 'lavaBlobCount', label: 'Lava Blob Count', category: 'Lava Lamp', min: 2.0, max: 12.0 },
  { key: 'lavaBlobSize', label: 'Lava Blob Size', category: 'Lava Lamp', min: 0.05, max: 0.4 },
  { key: 'splotchCount', label: 'Splotch Count', category: 'Splotches', min: 3.0, max: 15.0 },
  { key: 'splotchSize', label: 'Splotch Size', category: 'Splotches', min: 0.08, max: 0.28 },
  { key: 'splotchEdgeRoughness', label: 'Splotch Edge Roughness', category: 'Splotches', min: 0.1, max: 0.9 },
  { key: 'watercolorBlobCount', label: 'Watercolor Blob Count', category: 'Watercolor', min: 3.0, max: 15.0 },
  { key: 'watercolorBleedRadius', label: 'Watercolor Bleed', category: 'Watercolor', min: 0.05, max: 0.3 },
  { key: 'watercolorOpacity', label: 'Watercolor Opacity', category: 'Watercolor', min: 0.15, max: 0.5 },
  { key: 'suminagashiRingCount', label: 'Suminagashi Ring Count', category: 'Suminagashi', min: 3.0, max: 12.0 },
  { key: 'suminagashiCombPasses', label: 'Suminagashi Comb Passes', category: 'Suminagashi', min: 1.0, max: 6.0 },
  { key: 'suminagashiCombStrength', label: 'Suminagashi Comb Strength', category: 'Suminagashi', min: 0.2, max: 1.5 },
  { key: 'circuitBranchCount', label: 'Circuit Branch Count', category: 'Circuit', min: 3.0, max: 10.0 },
  { key: 'circuitMaxDepth', label: 'Circuit Max Depth', category: 'Circuit', min: 2.0, max: 7.0 },
  { key: 'circuitGlowIntensity', label: 'Circuit Glow Intensity', category: 'Circuit', min: 0.3, max: 2.0 },
  { key: 'liquidScale', label: 'Liquid Scale', category: 'Liquid', min: 0.5, max: 10.0 },
  { key: 'liquidStrength', label: 'Liquid Strength', category: 'Liquid', min: 0.0, max: 100.0 },
  { key: 'marbleOctaves', label: 'Marble Octaves', category: 'Marble', min: 1.0, max: 8.0 },
  { key: 'marbleTurbulence', label: 'Marble Turbulence', category: 'Marble', min: 0.0, max: 5.0 },
  { key: 'marbleVeinFreq', label: 'Marble Vein Freq', category: 'Marble', min: 0.5, max: 10.0 },
  { key: 'metaballCount', label: 'Metaball Count', category: 'Metaballs', min: 2.0, max: 14.0 },
  { key: 'metaballSize', label: 'Metaball Size', category: 'Metaballs', min: 0.05, max: 0.4 },
  { key: 'metaballSpeed', label: 'Metaball Speed', category: 'Metaballs', min: 0.1, max: 5.0 },
  { key: 'mirrorTileCount', label: 'Mirror Tile Count', category: 'Mirror', min: 2.0, max: 16.0 },
  { key: 'moireOffset', label: 'Moire Offset', category: 'Moire', min: 0.0, max: 100.0 },
  { key: 'moireScale', label: 'Moire Scale', category: 'Moire', min: 3.0, max: 40.0 },
  { key: 'moireSpeed', label: 'Moire Speed', category: 'Moire', min: 0.1, max: 5.0 },
  { key: 'noiseDirection', label: 'Noise Direction', category: 'Noise', min: 0.0, max: 360.0 },
  { key: 'noiseOctaves', label: 'Noise Octaves', category: 'Noise', min: 1.0, max: 8.0 },
  { key: 'noiseScale', label: 'Noise Scale', category: 'Noise', min: 10.0, max: 200.0 },
  { key: 'noiseWarp', label: 'Noise Warp', category: 'Noise', min: 0.0, max: 1.0 },
  { key: 'photoOpacity', label: 'Photo Opacity', category: 'Photo', min: 0.0, max: 100.0 },
  { key: 'pixelSize', label: 'Pixel Size', category: 'Pixelate', min: 5.0, max: 200.0 },
  { key: 'plasmaComplexity', label: 'Plasma Complexity', category: 'Plasma', min: 1.0, max: 10.0 },
  { key: 'plasmaZoomScale', label: 'Plasma Zoom Scale', category: 'Plasma', min: 0.1, max: 5.0 },
  { key: 'posterizeLevels', label: 'Posterize Levels', category: 'Posterize', min: 2.0, max: 16.0 },
  { key: 'radarBeamWidth', label: 'Radar Beam Width', category: 'Radar', min: 1.0, max: 90.0 },
  { key: 'radarFadeLength', label: 'Radar Fade Length', category: 'Radar', min: 10.0, max: 180.0 },
  { key: 'radialSizeScale', label: 'Radial Size Scale', category: 'Radial', min: 0.25, max: 4.0 },
  { key: 'radialBurstCount', label: 'Radial Burst Count', category: 'Radial Burst', min: 3.0, max: 16.0 },
  { key: 'radialBurstSize', label: 'Radial Burst Size', category: 'Radial Burst', min: 10.0, max: 200.0 },
  { key: 'radialBurstSpread', label: 'Radial Burst Spread', category: 'Radial Burst', min: 10.0, max: 100.0 },
  { key: 'reactionDiffusionFeed', label: 'Reaction Diffusion Feed', category: 'Reaction-Diffusion', min: 0.02, max: 0.08 },
  { key: 'reactionDiffusionKill', label: 'Reaction Diffusion Kill', category: 'Reaction-Diffusion', min: 0.04, max: 0.07 },
  { key: 'reactionDiffusionSpeed', label: 'Reaction Diffusion Speed', category: 'Reaction-Diffusion', min: 0.2, max: 3.0 },
  { key: 'rippleAmplitude', label: 'Ripple Amplitude', category: 'Ripple', min: 5.0, max: 50.0 },
  { key: 'scanlineIntensity', label: 'Scanline Intensity', category: 'Scanlines', min: 0.0, max: 1.0 },
  { key: 'scanlineSpacing', label: 'Scanline Spacing', category: 'Scanlines', min: 2.0, max: 20.0 },
  { key: 'scanlineSpeed', label: 'Scanline Speed', category: 'Scanlines', min: 0.0, max: 5.0 },
  { key: 'concentricRingCount', label: 'Concentric Ring Count', category: 'Shapes', min: 1.0, max: 30.0 },
  { key: 'concentricRingWidth', label: 'Concentric Ring Width', category: 'Shapes', min: 10.0, max: 300.0 },
  { key: 'shapesCount', label: 'Shapes Count', category: 'Shapes', min: 1.0, max: 50.0 },
  { key: 'shapesSides', label: 'Shapes Sides', category: 'Shapes', min: 1.0, max: 10.0 },
  { key: 'colorShiftHue', label: 'Color Shift Hue', category: 'Shift', min: 0.0, max: 255.0 },
  { key: 'slitScanIntensity', label: 'Slit Scan Intensity', category: 'Slit-Scan', min: 0.1, max: 10.0 },
  { key: 'topographicBands', label: 'Topographic Bands', category: 'Topographic', min: 3.0, max: 30.0 },
  { key: 'topographicLineWidth', label: 'Topographic Line Width', category: 'Topographic', min: 0.01, max: 0.15 },
  { key: 'topographicScale', label: 'Topographic Scale', category: 'Topographic', min: 10.0, max: 100.0 },
  { key: 'triangleSize', label: 'Triangle Size', category: 'Triangulate', min: 10.0, max: 200.0 },
  { key: 'truchetSize', label: 'Truchet Size', category: 'Truchet', min: 15.0, max: 100.0 },
  { key: 'truchetThickness', label: 'Truchet Thickness', category: 'Truchet', min: 1.0, max: 15.0 },
  { key: 'truchetVariation', label: 'Truchet Variation', category: 'Truchet', min: 0.0, max: 1.0 },
  { key: 'vhsGlitchIntensity', label: 'VHS Glitch Intensity', category: 'VHS', min: 0.0, max: 1.0 },
  { key: 'vignetteSoftness', label: 'Vignette Softness', category: 'Vignette', min: 0.0, max: 100.0 },
  { key: 'vignetteStrength', label: 'Vignette Strength', category: 'Vignette', min: 0.0, max: 1.0 },
  { key: 'voronoiCellCount', label: 'Voronoi Cell Count', category: 'Voronoi', min: 3.0, max: 30.0 },
  { key: 'voronoiDistortion', label: 'Voronoi Distortion', category: 'Voronoi', min: 0.0, max: 100.0 },
  { key: 'waveDistortionRotation', label: 'Wave Distortion Rotation', category: 'Wave', min: 0.0, max: 360.0 },
  { key: 'waveDistortionStrength', label: 'Wave Distortion Strength', category: 'Wave', min: 5.0, max: 100.0 },
  { key: 'waveAmplitude', label: 'Wave Amplitude', category: 'Waves', min: 10.0, max: 200.0 },
  { key: 'waveFrequency', label: 'Wave Frequency', category: 'Waves', min: 1.0, max: 10.0 },
  { key: 'waveNumber', label: 'Wave Number', category: 'Waves', min: 1.0, max: 20.0 },
  { key: 'waveRotation', label: 'Wave Rotation', category: 'Waves', min: 0.0, max: 360.0 },
  { key: 'windmillRotations', label: 'Windmill Rotations', category: 'Windmill', min: 1.0, max: 10.0 },
  { key: 'windmillThickness', label: 'Windmill Thickness', category: 'Windmill', min: 5.0, max: 100.0 },
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

