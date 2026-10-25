import React, { useRef } from 'react';

const clamp = (v: number) => Math.min(100, Math.max(0, v));

// A 2D position (both values 0-100): drag the dot, or use the arrow keys (Shift for bigger steps). One control in place
// of a pair of X and Y sliders; the whole pad is the picture of where the point sits.
export const PointPad: React.FC<{
  label: string; x: number; y: number; onChange: (x: number, y: number) => void; height?: number;
}> = ({ label, x, y, onChange, height = 96 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const fromPointer = (e: React.PointerEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r || r.width === 0 || r.height === 0) return;
    onChange(Math.round(clamp(((e.clientX - r.left) / r.width) * 100)), Math.round(clamp(((e.clientY - r.top) / r.height) * 100)));
  };
  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(x)}
      aria-valuetext={`${Math.round(x)} across, ${Math.round(y)} down`}
      title={`${label} — drag to place (arrow keys nudge)`}
      onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); fromPointer(e); }}
      onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) fromPointer(e); }}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 10 : 1;
        if (e.key === 'ArrowLeft') { e.preventDefault(); onChange(clamp(x - step), y); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); onChange(clamp(x + step), y); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); onChange(x, clamp(y - step)); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); onChange(x, clamp(y + step)); }
      }}
      className="relative w-full bg-wav-field border border-wav-line cursor-crosshair touch-none select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      style={{ height }}
    >
      {/* Crosshair through the dot */}
      <div className="absolute top-0 bottom-0 w-px bg-wav-line-strong pointer-events-none" style={{ left: `${x}%` }} />
      <div className="absolute left-0 right-0 h-px bg-wav-line-strong pointer-events-none" style={{ top: `${y}%` }} />
      <div className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full bg-white border border-black pointer-events-none" style={{ left: `${x}%`, top: `${y}%` }} />
      <span className="absolute bottom-0.5 right-1 text-[9px] text-wav-text-2 pointer-events-none">{Math.round(x)}, {Math.round(y)}</span>
    </div>
  );
};
