import type { ReactNode } from 'react';

// One slider row for every panel: a fixed label column, a flexible track and a fixed value box, so
// tracks start at the same x and end at the same x whichever tab the row is in.
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
  return (
    <div className={`grid ${children ? 'grid-cols-[4.75rem_minmax(0,1fr)_3rem_auto]' : 'grid-cols-[4.75rem_minmax(0,1fr)_3rem]'} items-center gap-1`} title={title}>
      <label className="text-[10px] text-white leading-[1.15]">{label}</label>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={typeof label === 'string' ? label.replace(/:$/, '') : undefined}
        className="w-full min-w-0"
      />
      <input
        type="number" min={min} max={max} step={step} value={value}
        aria-label={typeof label === 'string' ? `${label.replace(/:$/, '')} value` : undefined}
        onChange={(e) => (onNumberChange ?? onChange)(Number(e.target.value))}
        className="wav-slider-value text-[10px] text-white w-full min-w-0 text-right bg-wav-field border border-wav-line rounded px-1"
      />
      {children}
    </div>
  );
}
