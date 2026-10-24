import type { ColorRGB } from '../constants/gradientEffects';
import { LOOK_DEFAULTS, type GradientLook, type LookParamKey, type LookParams } from '../constants/gradientLooks';
import { MODULATABLE_PARAMS } from '../constants/modulatableParams';
import { hslToRgb, rgbToHsl } from './color';

// Curated Looks as the starting point for a shuffle. A Look is a palette plus settings that someone tuned to read
// well; setting every slider at random instead mostly produces looks that are technically fine and forgettable. So
// a shuffle can start from a Look and then vary it a little: its numbers move by a few percent and its palette
// turns a few degrees, enough that no two shuffles are the same, not enough to leave what makes it work.

// The slider range for each look setting (what the control allows), from the audio-setting table where there is one.
const RANGE_BY_KEY: Record<string, readonly [number, number]> = Object.fromEntries(
  MODULATABLE_PARAMS.map(p => [p.key, [p.min, p.max] as const]),
);

// The shared fields every look can set, with their slider ranges.
const FIELD_RANGES = { scale: [0.3, 3], speed: [0, 3], bias: [0, 1], sharp: [0, 1], contrast: [0.3, 3] } as const;

const clamp = (v: number, [lo, hi]: readonly [number, number]) => Math.min(hi, Math.max(lo, v));

// Moves `value` by up to +-amount (a fraction of the value), staying inside the slider; whole numbers stay whole.
function vary(value: number, amount: number, range: readonly [number, number], rng: () => number): number {
  const span = range[1] - range[0];
  // A fraction of the value; a value at or near zero would never move that way, so it moves by a slice of the range.
  const step = Math.abs(value) >= span * 0.05 ? Math.abs(value) * amount : span * amount * 0.35;
  const moved = clamp(value + (rng() * 2 - 1) * step, range);
  // A count (a whole number on a slider with whole-number ends) stays whole; anything else keeps three decimals.
  const isCount = Number.isInteger(value) && Number.isInteger(range[0]) && Number.isInteger(range[1]);
  return isCount ? Math.round(moved) : Math.round(moved * 1000) / 1000;
}

export function varyLook(look: GradientLook, amount: number, rng: () => number = Math.random): GradientLook {
  if (amount <= 0) return look;
  const out: GradientLook = { ...look };
  for (const key of ['scale', 'speed', 'bias', 'sharp', 'contrast'] as const) {
    const base = look[key] ?? LOOK_DEFAULTS[key];
    // bias and sharpness are left alone unless the look sets them: a look that does not mention them means "plain".
    if (look[key] === undefined && (key === 'bias' || key === 'sharp')) continue;
    out[key] = vary(base, amount, FIELD_RANGES[key], rng);
  }
  if (look.params) {
    const params: LookParams = {};
    for (const [key, value] of Object.entries(look.params) as [LookParamKey, number | string][]) {
      const range = RANGE_BY_KEY[key];
      params[key] = typeof value === 'number' && range ? vary(value, amount, range, rng) : value;
    }
    out.params = params;
  }
  return out;
}

// Turns every colour's hue by `degrees`, keeping its saturation and lightness.
export function nudgeHue(colours: readonly ColorRGB[], degrees: number): ColorRGB[] {
  if (degrees === 0) return colours.map(c => ({ ...c }));
  return colours.map(c => {
    const [h, s, l] = rgbToHsl(c.r, c.g, c.b);
    return hslToRgb((h + degrees + 360) % 360, s, l);
  });
}

// How far a shuffle varies a Look: a calm mood stays close, a bold one wanders further.
export const lookVariation = (strength: number) => 0.08 + 0.12 * strength;
