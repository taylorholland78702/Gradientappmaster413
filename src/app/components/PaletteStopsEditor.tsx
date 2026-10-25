import React, { useRef } from 'react';
import { type ColorRGB } from '../constants/gradientEffects';
import {
  DEFAULT_PALETTE_BIAS, DEFAULT_PALETTE_SHARP, evenStops, rgbToHex, samplePalette,
} from '../utils/color';

// How close two neighboring stops may get — stops must stay in order (the
// shader and CPU lookups walk them left to right), and a sliver of space keeps
// every handle individually grabbable.
const MIN_GAP = 0.01;
const PREVIEW_STEPS = 48;

export interface PaletteStopsEditorProps {
  colors: ColorRGB[];
  stops: number[] | null;
  setStops: (stops: number[] | null) => void;
  onBeforeChange?: () => void;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const PaletteStopsEditorInner: React.FC<PaletteStopsEditorProps> = ({
  colors, stops, setStops, onBeforeChange,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const n = colors.length;
  // Saved positions only apply while there is one per color; add/remove a
  // swatch and the palette quietly goes back to even spacing.
  const custom = !!stops && stops.length === n;
  const current = custom ? stops! : evenStops(n);
  const isDefault = !custom;

  const preview = samplePalette(colors, custom ? stops : null, DEFAULT_PALETTE_BIAS, DEFAULT_PALETTE_SHARP, PREVIEW_STEPS);
  const background = `linear-gradient(to right, ${preview
    .map((c, i) => `rgb(${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)}) ${((i / (PREVIEW_STEPS - 1)) * 100).toFixed(2)}%`)
    .join(', ')})`;

  const move = (index: number, value: number) => {
    const lo = index === 0 ? 0 : current[index - 1] + MIN_GAP;
    const hi = index === n - 1 ? 1 : current[index + 1] - MIN_GAP;
    const next = current.slice();
    next[index] = clamp(value, lo, Math.max(lo, hi));
    setStops(next);
  };

  const positionFromPointer = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;
    return (clientX - rect.left) / rect.width;
  };

  const onPointerDown = (index: number) => (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    onBeforeChange?.();
  };
  const onPointerMove = (index: number) => (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    move(index, positionFromPointer(e.clientX));
  };
  const onKeyDown = (index: number) => (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 0.05 : 0.01;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); onBeforeChange?.(); move(index, current[index] - step); }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); onBeforeChange?.(); move(index, current[index] + step); }
  };

  const reset = () => {
    onBeforeChange?.();
    setStops(null);
  };

  return (
    <div className="w-full" aria-label="Ramp">
      {!isDefault && (
        <div className="flex justify-end mb-1">
          <button onClick={reset} className="text-[10px] text-wav-text-3 hover:text-white transition-all">Reset spacing</button>
        </div>
      )}

      {/* Live preview of the exact ramp with one draggable handle per palette color underneath. */}
      <div className="px-[7px]">
        <div className="h-4 w-full border border-wav-line" style={{ background }} aria-hidden="true" />
        <div ref={trackRef} className="relative h-5 w-full touch-none select-none">
          {current.map((pos, i) => (
            <div
              key={i}
              role="slider"
              tabIndex={0}
              aria-label={`Color ${i + 1} position`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(pos * 100)}
              onPointerDown={onPointerDown(i)}
              onPointerMove={onPointerMove(i)}
              onKeyDown={onKeyDown(i)}
              className="absolute top-0.5 w-3.5 h-3.5 -ml-[7px] cursor-ew-resize border border-wav-line-strong shadow-[0_0_0_1px_rgba(0,0,0,0.5)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              style={{ left: `${pos * 100}%`, background: rgbToHex(colors[i]) }}
              title={`Color ${i + 1} — drag to reposition (arrow keys nudge)`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export const PaletteStopsEditor = React.memo(PaletteStopsEditorInner);
