/**
 * Configuration Manager
 * Consolidates related state into config objects to reduce re-renders
 */

export interface GradientConfig {
  type: string;
  angle: number;
  zoom: number;
  centerX: number;
  centerY: number;
  
  // Type-specific parameters
  spiralTightness: number;
  spiralRotations: number;
  spiralThickness: number;
  spiralZoom: number;
  shapesSides: number;
  shapesCount: number;
  concentricRingWidth: number;
  concentricRingCount: number;
  waveAmplitude: number;
  waveFrequency: number;
  meshGridSize: number;
  noiseScale: number;
  noiseOctaves: number;
  plasmaSpeed: number;
  plasmaComplexity: number;
  radialBurstCount: number;
  radialBurstSpread: number;
  voronoiCellCount: number;
  voronoiDistortion: number;
  conicalSpiralTurns: number;
  conicalSpiralTightness: number;
  windmillBlades: number;
  windmillRotation: number;
  iridescentAngle: number;
  iridescentIntensity: number;
  iridescentScale: number;
  angleStartOffset: number;
}

export interface EffectParams {
  // Kaleidoscope
  kaleidoscopeSegments: number;
  
  // Twist
  twistAmount: number;
  
  // Pixelate
  pixelSize: number;
  
  // Triangle
  triangleSize: number;
  
  // Chromatic
  chromaticOffset: number;
  
  // Fisheye
  fisheyeStrength: number;
  
  // Tile
  tileCount: number;
  
  // Grain
  grainIntensity: number;
  grainType: string;
  
  // Blur
  blurType: string;
  blurGaussianAmount: number;
  blurMotionAmount: number;
  blurMotionDirection: number;
  blurRadialAmount: number;
  
  // Posterize
  posterizeLevels: number;
  
  // Halftone
  halftoneSize: number;
  halftoneVariation: number;
  halftoneMove: number;
  halftoneMoveSpeed: number;
  halftoneAnimTrigger: number;
  
  // Vignette
  vignetteStrength: number;
  
  // Color Shift
  colorShiftHue: number;
  
  // Bulge/Pinch
  bulgeStrength: number;
  pinchStrength: number;
  
  // Scanlines
  scanLineSize: number;
  
  // Grids
  triGridSize: number;
  hexGridSize: number;
  gridRotation: number;
  gridRows: number;
  gridColumns: number;
  gridShapeSize: number;
  gridVariation: number;
  gridShape: string;
  
  // Lines
  linesCount: number;
  linesAngle: number;
  linesThickness: number;
  
  // Polar
  polarAngle: number;
  polarRadius: number;
  
  // Various intensities
  dustIntensity: number;
  dustCrackleIntensity: number;
  vhsGlitchIntensity: number;
  waveDistortionStrength: number;
  waveDistortionRotation: number;
  liquifyStrength: number;
  charcoalIntensity: number;
  sepiaIntensity: number;
  solarizeThreshold: number;
  lightLeakIntensity: number;
  digitalNoiseIntensity: number;
  
  // Duotone/Tritone
  duotoneIntensity: number;
  duotoneColor1: string;
  duotoneColor2: string;
  tritoneIntensity: number;
  tritoneColor1: string;
  tritoneColor2: string;
  tritoneColor3: string;
  
  // Color Dodge/Burn
  colorDodgeIntensity: number;
  colorBurnIntensity: number;
  
  // Bokeh
  bokehSize: number;
  bokehIntensity: number;
  bokehBrightness: number;
  
  // Brightness
  brightnessAmount: number;
  
  // Dither
  ditherType: string;
  ditherLevels: number;
  
  // Slit-scan
  slitScanIntensity: number;
  slitScanDirection: string;
  slitScanAnimTrigger: number;
  
  // Diffusion
  diffusionSpeed: number;
  diffusionFeed: number;
  diffusionKill: number;
  diffusionAnimTrigger: number;
}

export interface AudioConfig {
  isEnabled: boolean;
  isReactive: boolean;
  isMicActive: boolean;
  gradientParam: number;
  effectParam: number;
  colorShift: number;
}

export const DEFAULT_GRADIENT_CONFIG: GradientConfig = {
  type: 'angle',
  angle: 45,
  zoom: 1,
  centerX: 0.5,
  centerY: 0.5,
  spiralTightness: 50,
  spiralRotations: 3,
  spiralThickness: 50,
  spiralZoom: 50,
  shapesSides: 6,
  shapesCount: 10,
  concentricRingWidth: 50,
  concentricRingCount: 5,
  waveAmplitude: 50,
  waveFrequency: 50,
  meshGridSize: 5,
  noiseScale: 50,
  noiseOctaves: 4,
  plasmaSpeed: 50,
  plasmaComplexity: 50,
  radialBurstCount: 12,
  radialBurstSpread: 50,
  voronoiCellCount: 10,
  voronoiDistortion: 0,
  conicalSpiralTurns: 5,
  conicalSpiralTightness: 50,
  windmillBlades: 6,
  windmillRotation: 0,
  iridescentAngle: 0,
  iridescentIntensity: 50,
  iridescentScale: 50,
  angleStartOffset: 0
};

export const DEFAULT_EFFECT_PARAMS: EffectParams = {
  kaleidoscopeSegments: 6,
  twistAmount: 0,
  pixelSize: 10,
  triangleSize: 20,
  chromaticOffset: 0,
  fisheyeStrength: 0,
  tileCount: 2,
  grainIntensity: 0,
  grainType: 'monochrome',
  blurType: 'gaussian',
  blurGaussianAmount: 0,
  blurMotionAmount: 0,
  blurMotionDirection: 0,
  blurRadialAmount: 0,
  posterizeLevels: 4,
  halftoneSize: 5,
  halftoneVariation: 0,
  halftoneMove: 0,
  halftoneMoveSpeed: 1,
  halftoneAnimTrigger: 0,
  vignetteStrength: 0,
  colorShiftHue: 0,
  bulgeStrength: 0,
  pinchStrength: 0,
  scanLineSize: 2,
  triGridSize: 20,
  hexGridSize: 20,
  gridRotation: 0,
  gridRows: 3,
  gridColumns: 3,
  gridShapeSize: 50,
  gridVariation: 0,
  gridShape: 'circle',
  linesCount: 10,
  linesAngle: 0,
  linesThickness: 2,
  polarAngle: 0,
  polarRadius: 50,
  dustIntensity: 50,
  dustCrackleIntensity: 50,
  vhsGlitchIntensity: 0,
  waveDistortionStrength: 0,
  waveDistortionRotation: 0,
  liquifyStrength: 0,
  charcoalIntensity: 50,
  sepiaIntensity: 50,
  solarizeThreshold: 128,
  lightLeakIntensity: 50,
  digitalNoiseIntensity: 0,
  duotoneIntensity: 100,
  duotoneColor1: '#ff0000',
  duotoneColor2: '#0000ff',
  tritoneIntensity: 100,
  tritoneColor1: '#ff0000',
  tritoneColor2: '#00ff00',
  tritoneColor3: '#0000ff',
  colorDodgeIntensity: 50,
  colorBurnIntensity: 50,
  bokehSize: 5,
  bokehIntensity: 50,
  bokehBrightness: 50,
  brightnessAmount: 50,
  ditherType: 'floyd-steinberg',
  ditherLevels: 8,
  slitScanIntensity: 0.5,
  slitScanDirection: 'horizontal',
  slitScanAnimTrigger: 0,
  diffusionSpeed: 1,
  diffusionFeed: 0.055,
  diffusionKill: 0.062,
  diffusionAnimTrigger: 0
};

export const DEFAULT_AUDIO_CONFIG: AudioConfig = {
  isEnabled: false,
  isReactive: false,
  isMicActive: false,
  gradientParam: 0,
  effectParam: 0,
  colorShift: 0
};

/**
 * Randomize gradient configuration for "Feeling Lucky"
 */
export function randomizeGradientConfig(current: GradientConfig): Partial<GradientConfig> {
  return {
    spiralTightness: Math.random() * 100,
    spiralRotations: Math.floor(Math.random() * 10) + 1,
    spiralThickness: Math.random() * 100,
    waveAmplitude: Math.random() * 100,
    waveFrequency: Math.random() * 100,
    noiseScale: Math.random() * 100,
    plasmaComplexity: Math.random() * 100,
    radialBurstCount: Math.floor(Math.random() * 20) + 4,
    voronoiCellCount: Math.floor(Math.random() * 20) + 5,
    windmillBlades: Math.floor(Math.random() * 12) + 3,
    iridescentIntensity: Math.random() * 100
  };
}

/**
 * Randomize effect parameters
 */
export function randomizeEffectParams(activeEffects: string[]): Partial<EffectParams> {
  const updates: Partial<EffectParams> = {};
  
  if (activeEffects.includes('kaleidoscope')) {
    updates.kaleidoscopeSegments = Math.floor(Math.random() * 16) + 3;
  }
  
  if (activeEffects.includes('twist')) {
    updates.twistAmount = (Math.random() - 0.5) * 360;
  }
  
  if (activeEffects.includes('pixelate')) {
    updates.pixelSize = Math.floor(Math.random() * 20) + 2;
  }
  
  // Add more effect randomizations as needed
  
  return updates;
}
