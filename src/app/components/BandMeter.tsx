import React, { useRef, useState } from 'react';

const MIN = 0, MAX = 5, STEP = 0.1;
const clamp = (v: number) => Math.min(MAX, Math.max(MIN, Math.round(v / STEP) * STEP));

// One audio band: the live level fills the bar, and the bar itself is the gain control. Drag (or click)
// anywhere on it to set the gain; the line and its edge notches show where it sits. Arrow keys nudge it, Shift for bigger steps.
export const BandMeter: React.FC<{
  label: string; level: number; value: number; onChange: (v: number) => void; height?: number;
}> = ({ label, level, value, onChange, height = 72 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const fromPointer = (clientY: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r || r.height === 0) return value;
    return clamp(MIN + (1 - (clientY - r.top) / r.height) * (MAX - MIN));
  };
  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={0}
      aria-label={`${label} gain`}
      aria-valuemin={MIN}
      aria-valuemax={MAX}
      aria-valuenow={Number(value.toFixed(1))}
      title={`${label} gain — drag to set (arrow keys nudge)`}
      onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); setActive(true); onChange(fromPointer(e.clientY)); }}
      onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) onChange(fromPointer(e.clientY)); }}
      onPointerUp={() => setActive(false)}
      onPointerCancel={() => setActive(false)}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 0.5 : 0.1;
        if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { e.preventDefault(); onChange(clamp(value + step)); }
        else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { e.preventDefault(); onChange(clamp(value - step)); }
      }}
      className="relative w-full overflow-hidden bg-wav-hover cursor-ns-resize touch-none select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      style={{ height }}
    >
      {/* The live level, and nothing else, fills the bar. */}
      <div className="absolute bottom-0 w-full transition-none" style={{ height: `${Math.min(100, level * 100)}%`, background: 'linear-gradient(to top, #eab308, #a855f7)' }} />
      {/* A faint tick at each whole step of gain, like a mixer scale. */}
      {[1, 2, 3, 4].map(t => (
        <div key={t} aria-hidden="true" className="absolute left-0 w-1.5 h-px bg-white/40 pointer-events-none" style={{ bottom: `${(t / MAX) * 100}%` }} />
      ))}
      {/* The gain: a thin line across with a notch on each edge. Its value is shown above the bar. */}
      <div className="absolute w-full h-px bg-white/55 pointer-events-none" style={{ bottom: `${(value / MAX) * 100}%` }} />
      <div aria-hidden="true" className={`absolute left-0 w-2 h-1.5 bg-white pointer-events-none transition-transform ${active ? 'scale-y-125' : ''}`} style={{ bottom: `calc(${(value / MAX) * 100}% - 3px)` }} />
      <div aria-hidden="true" className={`absolute right-0 w-2 h-1.5 bg-white pointer-events-none transition-transform ${active ? 'scale-y-125' : ''}`} style={{ bottom: `calc(${(value / MAX) * 100}% - 3px)` }} />
    </div>
  );
};
