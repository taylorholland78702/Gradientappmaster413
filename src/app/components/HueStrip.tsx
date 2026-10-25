import React from 'react';

// A hue shift drawn as the colors it walks through. The stored value is 0-255 (a full trip round the wheel),
// so the strip reads and writes the same units the Shift effect already uses.
export const HueStrip: React.FC<{ label: string; value: number; onChange: (v: number) => void }> = ({ label, value, onChange }) => (
  <div className="grid grid-cols-[4.75rem_minmax(0,1fr)_3rem] items-center gap-1">
    <label className="text-[10px] text-white leading-[1.15]">{label}:</label>
    <div className="relative h-3 min-w-0">
      <div
        aria-hidden="true"
        className="absolute inset-0 border border-wav-line"
        style={{ background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }}
      />
      <input
        type="range" min={0} max={255} step={1} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <div className="absolute top-0 bottom-0 w-1 -ml-0.5 bg-white border border-black pointer-events-none" style={{ left: `${(value / 255) * 100}%` }} />
    </div>
    <span className="text-[10px] text-white text-right">{Math.round((value / 255) * 360)}°</span>
  </div>
);
