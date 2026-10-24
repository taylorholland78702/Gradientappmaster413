// Sliders that move in fractions (0.05 steps over 0.3 to 3, and so on) show and take whole numbers from 0 to 100
// instead, so every one of them reads the same way. Only the display changes: the saved value keeps its real units
// and range, so nothing that uses it (the picture, Looks, share links, audio bindings) sees a difference.
// Sliders that already move in whole units (a count, a size in pixels, degrees) keep showing their own numbers.

export interface SliderRange { min: number; max: number; step: number }

// The range when the slider should show 0-100, or null when it should show its own numbers.
export function percentRange(min: unknown, max: unknown, step: unknown): SliderRange | null {
  const lo = Number(min), hi = Number(max), st = Number(step);
  if (min === undefined || max === undefined || step === undefined) return null;
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || !Number.isFinite(st) || hi <= lo || st <= 0) return null;
  return Number.isInteger(st) ? null : { min: lo, max: hi, step: st };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// A saved value as a whole number from 0 to 100.
export const toPercent = (value: number, r: SliderRange): number =>
  Math.round(clamp(((value - r.min) / (r.max - r.min)) * 100, 0, 100));

const decimals = (n: number) => { const t = String(n); const i = t.indexOf('.'); return i < 0 ? 0 : t.length - i - 1; };

// A typed or dragged 0-100 back to the real range. Where that lands within 0.4% of a value the slider used to offer
// (a multiple of its step), it takes that value, so the round numbers that mean something stay exact: 1 for "unchanged",
// 0.5 for half. Anything else keeps its full precision.
export function fromPercent(percent: number, r: SliderRange): number {
  const span = r.max - r.min;
  const raw = r.min + (clamp(percent, 0, 100) / 100) * span;
  const nearest = r.min + Math.round((raw - r.min) / r.step) * r.step;
  const clean = Number(nearest.toFixed(Math.max(decimals(r.step), decimals(r.min))));
  return Math.abs(clean - raw) <= span * 0.004 ? Math.min(r.max, Math.max(r.min, clean)) : raw;
}
