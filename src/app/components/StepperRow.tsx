import React from 'react';

// A small whole number (a count of levels, tiles or sides): minus and plus buttons beside the value, steadier than
// dragging a slider across a handful of positions.
export const StepperRow: React.FC<{
  label: string; value: number; onChange: (v: number) => void; min: number; max: number;
}> = ({ label, value, onChange, min, max }) => (
  <div className="grid grid-cols-[4.75rem_minmax(0,1fr)] items-center gap-1">
    <label className="text-[10px] text-white leading-[1.15]">{label}:</label>
    <div className="flex items-center justify-end gap-1" role="group" aria-label={label}>
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={`Fewer ${label}`}
        className="wav-choice-sq text-[12px] text-white bg-wav-field hover:bg-wav-hover border border-wav-line disabled:opacity-40"
      >−</button>
      <span className="text-[10px] text-white w-8 text-center tabular-nums" aria-live="polite">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`More ${label}`}
        className="wav-choice-sq text-[12px] text-white bg-wav-field hover:bg-wav-hover border border-wav-line disabled:opacity-40"
      >+</button>
    </div>
  </div>
);
