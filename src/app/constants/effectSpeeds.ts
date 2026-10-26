// Speed for the effects that drift or flicker on a clock of their own (a rolling CRT bar, a crawling dither, the
// Impasto light that turns). 1 is the pace each had before it got a slider; 0 holds it still. The sliders write the
// state in InteractiveGradient; each frame it copies the values into `effectSpeedsLive`, which the effect functions
// read when they advance their clocks.
export const EFFECT_SPEED_KEYS = ['crt', 'dither', 'dada', 'ascii', 'watercolor', 'impasto'] as const;
export type EffectSpeedKey = typeof EFFECT_SPEED_KEYS[number];
export type EffectSpeeds = Record<EffectSpeedKey, number>;

export const DEFAULT_EFFECT_SPEEDS: EffectSpeeds = { crt: 1, dither: 1, dada: 1, ascii: 1, watercolor: 1, impasto: 1 };
export const effectSpeedsLive: EffectSpeeds = { ...DEFAULT_EFFECT_SPEEDS };
