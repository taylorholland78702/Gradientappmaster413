// Shared min/max bounds for parameters that more than one randomization
// entry point (feelingLucky, evolveWithFactor) sets directly. Previously
// each function had its own independently-tuned magic numbers for the same
// slider (e.g. kaleidoscope segments was 4-19 in one place and 3-20 in
// another), so "shuffle," "feeling lucky," and "hold to evolve" could
// visibly disagree about how wide a given effect's range should be.
export const RANGES = {
  kaleidoscopeSegments: [3, 20] as const,
  vignetteStrength: [0.1, 0.9] as const,
  chromaticOffset: [10, 180] as const,
  colorShiftHue: [5, 180] as const,
  pixelSize: [5, 50] as const,
  triangleSize: [10, 200] as const,
  twistAmount: [0, 5] as const,
  blurGaussianAmount: [2, 18] as const,
  waveDistortionStrength: [10, 100] as const,
};

export const randInRange = ([min, max]: readonly [number, number]): number => min + Math.random() * (max - min);
export const randIntInRange = (range: readonly [number, number]): number => Math.round(randInRange(range));
