import React from 'react';
import { type ColorRGB } from '../constants/gradientEffects';
import { BRUSHES, type BrushKind } from '../utils/drawStrokes';

export interface DrawTabProps {
  gradientColors: ColorRGB[];
  drawEnabled: boolean; setDrawEnabled: (v: boolean) => void;
  drawBrush: BrushKind; setDrawBrush: (v: BrushKind) => void;
  drawSize: number; setDrawSize: (v: number) => void;
  drawSoftness: number; setDrawSoftness: (v: number) => void;
  drawFadeSec: number; setDrawFadeSec: (v: number) => void;
  drawColorIndex: number; setDrawColorIndex: (v: number) => void;
  clearDabs: () => void;
}

// Paint on the canvas with the pointer (mouse, finger or pen). Strokes use the
// palette, sit on the gradient under the effects, and fade away
// (utils/drawStrokes.ts). The pointer handling itself lives on the canvas in
// InteractiveGradient; this is just the controls.
const DrawTabInner: React.FC<DrawTabProps> = ({
  gradientColors, drawEnabled, setDrawEnabled, drawBrush, setDrawBrush, drawSize, setDrawSize,
  drawSoftness, setDrawSoftness, drawFadeSec, setDrawFadeSec, drawColorIndex, setDrawColorIndex, clearDabs,
}) => (
  <>
  {/* Draw — paint on the canvas with the pointer (mouse, finger or pen). Strokes use
      the palette, sit on the gradient under the effects, and fade away. */}
  <div className="w-full flex flex-col gap-2 px-1.5 py-1">
    <div className="flex items-center justify-between">
      <label className="text-[10px] text-white" title="Paint on the canvas. While on, dragging paints instead of moving the gradient.">Draw:</label>
      <div className="flex items-center gap-1">
        {drawEnabled && (
          <button onClick={clearDabs} title="Wipe every stroke now" className="px-2 py-0.5 rounded text-[10px] bg-black/25 text-white hover:bg-white/15 transition-all">Clear</button>
        )}
        <button
          onClick={() => setDrawEnabled(!drawEnabled)}
          aria-pressed={drawEnabled}
          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${drawEnabled ? 'bg-white text-black' : 'bg-black/25 text-white hover:bg-white/15'}`}
        >{drawEnabled ? 'On' : 'Off'}</button>
      </div>
    </div>
    {drawEnabled && (
      <>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Brush">
          {BRUSHES.map(b => (
            <button
              key={b.id}
              onClick={() => setDrawBrush(b.id)}
              aria-pressed={drawBrush === b.id}
              title={b.hint}
              className={`px-2 py-1 text-[10px] border transition-all ${drawBrush === b.id ? 'bg-white text-black font-bold border-white' : 'text-white bg-black/25 hover:bg-white/15 border-white/15'}`}
            >{b.label}</button>
          ))}
        </div>
        {([
          { label: 'Size', value: drawSize, set: setDrawSize, min: 10, max: 200, step: 5, hint: 'Brush radius in pixels (a pen\u2019s pressure scales it)' },
          { label: 'Softness', value: drawSoftness, set: setDrawSoftness, min: 0, max: 1, step: 0.05, hint: 'Hard-edged disc to soft glow' },
          { label: 'Fade', value: drawFadeSec, set: setDrawFadeSec, min: 0.5, max: 20, step: 0.5, hint: 'Seconds for a stroke to dissolve' },
        ] as const).filter(r => r.label !== 'Softness' || BRUSHES.find(b => b.id === drawBrush)?.usesSoftness).map(r => (
          <div key={r.label} className="flex items-center justify-between" title={r.hint}>
            <label className="text-[10px] text-white w-20 shrink-0">{r.label}:</label>
            <div className="flex items-center gap-1 flex-1 ml-2">
              <input type="range" min={r.min} max={r.max} step={r.step} value={r.value} onChange={e => r.set(Number(e.target.value))} className="flex-1" />
              <input type="number" min={r.min} max={r.max} step={r.step} value={r.value} onChange={e => r.set(Number(e.target.value) || r.min)} className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1" />
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between">
          <label className="text-[10px] text-white w-20 shrink-0">Color:</label>
          <div className="flex flex-wrap items-center gap-1 flex-1 ml-2" role="group" aria-label="Brush color">
            <button
              onClick={() => setDrawColorIndex(-1)}
              aria-pressed={drawColorIndex < 0}
              title="Walk along the palette as you paint"
              className={`px-2 h-6 text-[10px] transition-all ${drawColorIndex < 0 ? 'bg-white text-black font-bold' : 'bg-black/25 text-white hover:bg-white/15'}`}
            >Cycle</button>
            {gradientColors.map((c, i) => (
              <button
                key={i}
                onClick={() => setDrawColorIndex(i)}
                aria-pressed={drawColorIndex === i}
                aria-label={`Paint with palette color ${i + 1}`}
                className={`w-6 h-6 border transition-all ${drawColorIndex === i ? 'border-white ring-1 ring-white' : 'border-white/20'}`}
                style={{ background: `rgb(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)})` }}
              />
            ))}
          </div>
        </div>
      </>
    )}
  </div>
    {!drawEnabled && <p className="px-1.5 text-[10px] text-white/50">Turn Draw on, close this panel, and drag on the canvas.</p>}
  </>
);

export const DrawTab = React.memo(DrawTabInner);
