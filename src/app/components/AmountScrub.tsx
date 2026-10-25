import React, { useRef } from 'react';

const MIN = -10, MAX = 10;
const clamp = (v: number) => Math.min(MAX, Math.max(MIN, Math.round(v * 20) / 20));

// A modulation amount you scrub: drag sideways to change it (Shift for fine steps), arrow keys nudge it.
export const AmountScrub: React.FC<{ value: number; onChange: (v: number) => void; label: string; title?: string }> = ({ value, onChange, label, title }) => {
  const drag = useRef<{ x: number; start: number } | null>(null);
  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={MIN}
      aria-valuemax={MAX}
      aria-valuenow={Number(value.toFixed(2))}
      title={title ?? 'Amount — drag sideways to change (Shift for fine steps, arrow keys nudge)'}
      onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); drag.current = { x: e.clientX, start: value }; }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
        onChange(clamp(d.start + (e.clientX - d.x) * (e.shiftKey ? 0.01 : 0.05)));
      }}
      onPointerUp={() => { drag.current = null; }}
      onPointerCancel={() => { drag.current = null; }}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 0.5 : 0.1;
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); onChange(clamp(value + step)); }
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); onChange(clamp(value - step)); }
      }}
      className="w-11 shrink-0 text-center text-[10px] text-white bg-wav-field border border-wav-line rounded px-1 py-0.5 cursor-ew-resize touch-none select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >×{value.toFixed(1)}</div>
  );
};
