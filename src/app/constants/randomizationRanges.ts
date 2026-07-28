// Shared min/max bounds for parameters that more than one randomization
// entry point (feelingLucky, evolveWithFactor) sets directly. Previously
// each function had its own independently-tuned magic numbers for the same
// slider (e.g. kaleidoscope segments was 4-19 in one place and 3-20 in
// another), so "shuffle," "feeling lucky," and "hold to evolve" could
// visibly disagree about how wide a given effect's range should be.
//
// kaleidoscopeSegments/pixelSize/colorShiftHue/blurGaussianAmount were
// previously narrower than their sliders' real min/max (EffectsTab.tsx),
// so Shuffle could never land on the strongest end of any of these looks
// (dense kaleidoscope tiling, chunky pixelation, full hue rotation, heavy
// blur) — widened to match the sliders exactly.
export const RANGES = {
  kaleidoscopeSegments: [2, 50] as const,
  vignetteStrength: [0.1, 0.9] as const,
  chromaticOffset: [10, 180] as const,
  colorShiftHue: [0, 255] as const,
  pixelSize: [5, 200] as const,
  triangleSize: [10, 200] as const,
  blurGaussianAmount: [1, 50] as const,
  waveDistortionStrength: [10, 100] as const,
};

export const randInRange = ([min, max]: readonly [number, number]): number => min + Math.random() * (max - min);
export const randIntInRange = (range: readonly [number, number]): number => Math.round(randInRange(range));
