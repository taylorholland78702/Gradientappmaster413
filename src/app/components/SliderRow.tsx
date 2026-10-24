import type { ReactNode } from 'react';
import { percentRange, toPercent, fromPercent } from '../utils/sliderScale';

// One slider row for every panel: a fixed label column, a flexible track and a fixed value box, so
// tracks start at the same x and end at the same x whichever tab the row is in.
// A slider that moves in fractions shows 0-100 (see utils/sliderScale.ts); the value it reads and writes keeps its real units.
// Sizes: label 4.75rem (a long label wraps to two lines), value 3rem. Mobile sizing comes from .wav-mobile rules in index.css.
export function SliderRow({ label, title, value, onChange, onNumberChange, min, max, step, children }: {
  label: ReactNode;
  title?: string;
  value: number;
  onChange: (value: number) => void;
  // For rows whose typed value is handled differently from a drag (clamped, or falling back to a default).
  onNumberChange?: (value: number) => void;
  // Extra control that sits after the value box (Duotone's randomise button).
  children?: ReactNode;
  min?: number | string;
  max?: number | string;
  step?: number | string;
}) {
  const pct = percentRange(min, max, step);
  const shown = pct ? toPercent(value, pct) : value;
  const bounds = pct ? { min: 0, max: 100, step: 1 } : { min, max, step };
  const fromShown = (n: number) => (pct ? fromPercent(n, pct) : n);
  return (
    <div className={`grid ${children ? 'grid-cols-[4.75rem_minmax(0,1fr)_3rem_auto]' : 'grid-cols-[4.75rem_minmax(0,1fr)_3rem]'} items-center gap-1`} title={title}>
      <label className="text-[10px] text-white leading-[1.15]">{label}</label>
      <input
        type="range" min={bounds.min} max={bounds.max} step={bounds.step} value={shown}
        onChange={(e) => onChange(fromShown(Number(e.target.value)))}
        aria-label={typeof label === 'string' ? label.replace(/:$/, '') : undefined}
        className="w-full min-w-0"
      />
      <input
        type="number" min={bounds.min} max={bounds.max} step={bounds.step} value={shown}
        title={pct ? `Actual value ${Number(value.toFixed(4))}` : undefined}
        aria-label={typeof label === 'string' ? `${label.replace(/:$/, '')} value` : undefined}
        onChange={(e) => (onNumberChange ?? onChange)(fromShown(Number(e.target.value)))}
        className="wav-slider-value text-[10px] text-white w-full min-w-0 text-right bg-wav-field border border-wav-line rounded px-1"
      />
      {children}
    </div>
  );
}
