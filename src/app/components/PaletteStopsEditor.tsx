import React, { useRef } from 'react';
import { type ColorRGB } from '../constants/gradientEffects';
import {
  type ColorBlend, DEFAULT_PALETTE_BIAS, DEFAULT_PALETTE_SHARP, evenStops, rgbToHex, samplePalette,
} from '../utils/color';
import { SliderRow } from './SliderRow';
import { choice } from './choice';

// How close two neighboring stops may get — stops must stay in order (the
// shader and CPU lookups walk them left to right), and a sliver of space keeps
// every handle individually grabbable.
const MIN_GAP = 0.01;
const PREVIEW_STEPS = 48;

export interface PaletteStopsEditorProps {
  colors: ColorRGB[];
  stops: number[] | null;
  setStops: (stops: number[] | null) => void;
  bias: number;
  setBias: (v: number) => void;
  sharp: number;
  setSharp: (v: number) => void;
  blend: ColorBlend;
  onBeforeChange?: () => void;
}

// One-tap shapes for where the stops sit and how hard the blends are. Easing
// curves bunch the colors toward one end; the blend chips set Sharpness.
const STOP_EASES: { label: string; hint: string; f: (t: number) => number }[] = [
  { label: 'Even', hint: 'Evenly spaced', f: t => t },
  { label: 'In', hint: 'Ease in — colors bunch toward the start', f: t => t * t },
  { label: 'Out', hint: 'Ease out — colors bunch toward the end', f: t => 1 - (1 - t) * (1 - t) },
  { label: 'In-out', hint: 'Ease in-out — colors bunch toward both ends', f: t => t * t * (3 - 2 * t) },
];
const BLEND_SHAPES: { label: string; hint: string; sharp: number }[] = [
  { label: 'Soft', hint: 'Smooth blends (Sharpness 0)', sharp: 0 },
  { label: 'Crisp', hint: 'Tighter transitions (Sharpness 0.6)', sharp: 0.6 },
  { label: 'Banded', hint: 'Hard bands (Sharpness 1)', sharp: 1 },
];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const PaletteStopsEditorInner: React.FC<PaletteStopsEditorProps> = ({
  colors, stops, setStops, bias, setBias, sharp, setSharp, blend, onBeforeChange,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const n = colors.length;
  // Saved positions only apply while there is one per color; add/remove a
  // swatch and the palette quietly goes back to even spacing.
  const custom = !!stops && stops.length === n;
  const current = custom ? stops! : evenStops(n);
  const isDefault = !custom && bias === DEFAULT_PALETTE_BIAS && sharp === DEFAULT_PALETTE_SHARP;

  const preview = samplePalette(colors, custom ? stops : null, bias, sharp, blend, PREVIEW_STEPS);
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
    setBias(DEFAULT_PALETTE_BIAS);
    setSharp(DEFAULT_PALETTE_SHARP);
  };

  const easeStops = (f: (t: number) => number) => {
    onBeforeChange?.();
    setStops(n < 2 ? null : Array.from({ length: n }, (_, i) => f(i / (n - 1))));
  };
  const matchesEase = (f: (t: number) => number) =>
    n >= 2 && current.every((v, i) => Math.abs(v - f(i / (n - 1))) < 0.005);

  const chip = (active: boolean) => choice(active);

  const sliderRow = (label: string, value: number, set: (v: number) => void, hint: string) => (
    <SliderRow
      label={`${label}:`} title={hint} value={value} onChange={set}
      onNumberChange={(v) => set(clamp(v || 0, 0, 1))}
      min="0" max="1" step="0.01"
    />
  );

  return (
    <section className="w-full px-1.5 pt-2.5 border-t border-white/15" aria-label="Ramp">
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="text-[10px] text-white/80 font-medium">Ramp</h3>
        {!isDefault && (
          <button onClick={reset} className="text-[10px] text-white/50 hover:text-white transition-all">Reset</button>
        )}
      </div>

      {/* Live preview of the exact ramp (Blend, Bias and Sharpness included),
          with one draggable handle per palette color underneath. */}
      <div className="px-[7px]">
        <div className="h-4 w-full border border-white/20" style={{ background }} aria-hidden="true" />
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
              className="absolute top-0.5 w-3.5 h-3.5 -ml-[7px] cursor-ew-resize border border-white/70 shadow-[0_0_0_1px_rgba(0,0,0,0.5)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              style={{ left: `${pos * 100}%`, background: rgbToHex(colors[i]) }}
              title={`Color ${i + 1} — drag to reposition (arrow keys nudge)`}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mt-1.5" role="group" aria-label="Stop spacing">
        {STOP_EASES.map(e => (
          <button key={e.label} onClick={() => easeStops(e.f)} aria-pressed={matchesEase(e.f)} title={e.hint} className={chip(matchesEase(e.f))}>{e.label}</button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1 mt-1" role="group" aria-label="Blend hardness">
        {BLEND_SHAPES.map(b => (
          <button
            key={b.label}
            onClick={() => { onBeforeChange?.(); setSharp(b.sharp); }}
            aria-pressed={Math.abs(sharp - b.sharp) < 0.02}
            title={b.hint}
            className={chip(Math.abs(sharp - b.sharp) < 0.02)}
          >{b.label}</button>
        ))}
      </div>

      <div className="flex flex-col gap-2 mt-1">
        {sliderRow('Bias', bias, setBias, 'Slides the midpoint — higher gives more of the later colors, lower more of the earlier ones')}
        {sliderRow('Sharpness', sharp, setSharp, 'Tightens the blend between neighboring colors toward hard bands')}
      </div>
    </section>
  );
};

export const PaletteStopsEditor = React.memo(PaletteStopsEditorInner);
