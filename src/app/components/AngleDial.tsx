import React, { useRef } from 'react';

// A direction in degrees: drag around the dial, or use the arrow keys (Shift for bigger steps). Replaces a 0-360 slider,
// where the ends meet and a slider can't show that. `max` is the value at one full turn (360 unless a row says otherwise).
export const AngleDial: React.FC<{
  label: string; value: number; onChange: (v: number) => void; max?: number;
}> = ({ label, value, onChange, max = 360 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const fromPointer = (e: React.PointerEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const deg = (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI + 90;
    onChange(Math.round((((deg % 360) + 360) % 360) * (max / 360)));
  };
  const turn = (value / max) * 360;
  const nudge = (d: number) => onChange((((Math.round(value + d) % max) + max) % max));
  return (
    <div className="grid grid-cols-[4.75rem_minmax(0,1fr)_3rem] items-center gap-1">
      <label className="text-[10px] text-white leading-[1.15]">{label}:</label>
      <div className="flex justify-center">
        <div
          ref={ref}
          role="slider"
          tabIndex={0}
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={Math.round(value)}
          title={`${label} — drag around the dial (arrow keys nudge)`}
          onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); fromPointer(e); }}
          onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) fromPointer(e); }}
          onKeyDown={(e) => {
            const step = e.shiftKey ? 15 : 1;
            if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); nudge(step); }
            else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); nudge(-step); }
          }}
          className="relative w-10 h-10 rounded-full bg-wav-field border border-wav-line cursor-pointer touch-none select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <div className="absolute inset-0 pointer-events-none" style={{ transform: `rotate(${turn}deg)` }}>
            <div className="absolute left-1/2 top-1 bottom-1/2 w-px -ml-px bg-white" />
            <div className="absolute left-1/2 top-0.5 w-2 h-2 -ml-1 rounded-full bg-white border border-black" />
          </div>
        </div>
      </div>
      <span className="text-[10px] text-white text-right">{Math.round(value)}°</span>
    </div>
  );
};
