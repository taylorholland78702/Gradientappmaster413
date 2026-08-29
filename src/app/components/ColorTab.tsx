import React from 'react';
import { Shuffle, Plus, X } from '@phosphor-icons/react';
import { type ColorRGB } from '../constants/gradientEffects';
import { rgbToHex, hexToRgb } from '../utils/color';

// Keeps the palette a valid gradient (at least 2 stops) and keeps the
// swatch row from growing unboundedly if someone just holds down +.
const MIN_PALETTE_COLORS = 2;
const MAX_PALETTE_COLORS = 10;

export interface ColorTabProps {
  saveCurrentState: () => void;
  setTargetColors: (colors: ColorRGB[]) => void;
  setColorsInstant: (colors: ColorRGB[]) => void;
  gradientColors: ColorRGB[];
  randomColor: () => ColorRGB;
  paletteHue: number;
  setPaletteHue: (v: number) => void;
  paletteSaturation: number;
  setPaletteSaturation: (v: number) => void;
  paletteBrightness: number;
  setPaletteBrightness: (v: number) => void;
  paletteContrast: number;
  setPaletteContrast: (v: number) => void;
}

const ColorTabInner: React.FC<ColorTabProps> = ({
  saveCurrentState, setTargetColors, setColorsInstant, gradientColors, randomColor,
  paletteHue, setPaletteHue, paletteSaturation, setPaletteSaturation,
  paletteBrightness, setPaletteBrightness, paletteContrast, setPaletteContrast,
}) => {
  const isPaletteAdjusted = paletteHue !== 0 || paletteSaturation !== 100 || paletteBrightness !== 0 || paletteContrast !== 0;

  // setColorsInstant (not setGradientColors/setTargetColors called
  // separately) — the render loop lerps gradientColorsRef.current toward
  // targetColorsRef.current every frame, by index, using colors.length off
  // the REF, and periodically writes that ref straight back over React
  // state. Setting only React state left the ref stale (old length, old
  // values), so a moment later that sync wrote the stale ref back over
  // whatever Add/Remove/a manual pick had just done — edits were silently
  // reverting almost immediately. setColorsInstant updates both refs and
  // both states together so there's nothing left for that sync to stomp.
  const setSwatch = (index: number, hex: string) => {
    setColorsInstant(gradientColors.map((c, i) => (i === index ? hexToRgb(hex) : c)));
  };

  const addSwatch = () => {
    if (gradientColors.length >= MAX_PALETTE_COLORS) return;
    saveCurrentState();
    setColorsInstant([...gradientColors, randomColor()]);
  };

  const removeSwatch = (index: number) => {
    if (gradientColors.length <= MIN_PALETTE_COLORS) return;
    saveCurrentState();
    setColorsInstant(gradientColors.filter((_, i) => i !== index));
  };

  return (
    <>
      {/* Icon-only, full-width, same treatment as the Gradients tab's own
          Shuffle button (border-b doubling as the divider before Palette
          below it). No separate Play/Pause auto-color toggle any more. */}
      <button
        onClick={() => { saveCurrentState(); setTargetColors(gradientColors.map(() => randomColor())); }}
        className="w-full px-1 py-1.5 text-[10px] font-semibold transition-all text-white hover:bg-white/10 flex items-center justify-center gap-1.5 border-b border-white/50"
        title="Shuffle Colors"
        aria-label="Shuffle Colors"
      ><Shuffle weight="regular" className="w-4 h-4" /></button>

      {/* Manual swatch picker — one native color input per palette stop,
          bound directly to gradientColors[i] (rgbToHex/hexToRgb in
          utils/color.ts). The only way to set an exact color before this;
          Shuffle only randomizes and Adjustments only shifts the whole
          palette uniformly. Square (not rounded) and small so a full
          palette fits inside the drawer without wrapping awkwardly. */}
      <div className="w-full pt-2.5">
        <label className="text-[10px] text-white/80 font-medium block mb-1.5">Palette</label>
        <div className="flex flex-wrap gap-1">
          {gradientColors.map((c, i) => (
            <div key={i} className="relative">
              <input
                type="color"
                value={rgbToHex(c)}
                onFocus={saveCurrentState}
                onChange={(e) => setSwatch(i, e.target.value)}
                title={`Color ${i + 1}`}
                aria-label={`Palette color ${i + 1}`}
                className="w-6 h-6 rounded-none cursor-pointer border border-white/20 bg-transparent p-0"
              />
              {gradientColors.length > MIN_PALETTE_COLORS && (
                <button
                  onClick={() => removeSwatch(i)}
                  title={`Remove color ${i + 1}`}
                  aria-label={`Remove color ${i + 1}`}
                  className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-black border border-white/30 text-white flex items-center justify-center hover:bg-red-500/70 transition-colors"
                ><X weight="bold" className="w-2 h-2" /></button>
              )}
            </div>
          ))}
          {gradientColors.length < MAX_PALETTE_COLORS && (
            <button
              onClick={addSwatch}
              title="Add color"
              aria-label="Add color"
              className="w-6 h-6 flex items-center justify-center border border-dashed border-white/30 text-white/60 hover:text-white hover:border-white/50 transition-colors"
            ><Plus weight="bold" className="w-3 h-3" /></button>
          )}
        </div>
      </div>

      {/* Palette-wide adjustments — applied to the whole gradientColors
          array at a single point (see adjustPalette in utils/color.ts),
          so these work the same regardless of whether the palette came
          from a theme/color keyword, shuffle, or manual pin edits. */}
      <div className="w-full pt-2">
        {isPaletteAdjusted && (
          <div className="flex items-center justify-end mb-1.5">
            <button
              onClick={() => { setPaletteHue(0); setPaletteSaturation(100); setPaletteBrightness(0); setPaletteContrast(0); }}
              className="text-[10px] text-white/50 hover:text-white transition-all"
            >Reset</button>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-white w-20 shrink-0">Hue:</label>
            <div className="flex items-center gap-1 flex-1 ml-2">
              <input type="range" min="-180" max="180" value={paletteHue} onChange={(e) => setPaletteHue(Number(e.target.value))} className="flex-1" />
              <input type="number" min="-180" max="180" value={paletteHue} onChange={(e) => setPaletteHue(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-white w-20 shrink-0">Saturation:</label>
            <div className="flex items-center gap-1 flex-1 ml-2">
              <input type="range" min="30" max="200" value={paletteSaturation} onChange={(e) => setPaletteSaturation(Number(e.target.value))} className="flex-1" />
              <input type="number" min="30" max="200" value={paletteSaturation} onChange={(e) => setPaletteSaturation(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
            </div>
          </div>
          {/* Brightness/Contrast ranges narrowed from ±100 — adjustPalette's
              math compounds the two (contrast scales the brightness offset
              too), so pushing both toward the same sign near ±100 blew the
              whole palette out to solid black/white well before either
              slider hit its own end. ±25 keeps real range of motion while
              staying inside the region where a varied palette never fully
              clips (see adjustPalette's own defensive clamp for the hard
              floor/ceiling regardless of how a value got set). */}
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-white w-20 shrink-0">Brightness:</label>
            <div className="flex items-center gap-1 flex-1 ml-2">
              <input type="range" min="-25" max="25" value={paletteBrightness} onChange={(e) => setPaletteBrightness(Number(e.target.value))} className="flex-1" />
              <input type="number" min="-25" max="25" value={paletteBrightness} onChange={(e) => setPaletteBrightness(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-white w-20 shrink-0">Contrast:</label>
            <div className="flex items-center gap-1 flex-1 ml-2">
              <input type="range" min="-25" max="25" value={paletteContrast} onChange={(e) => setPaletteContrast(Number(e.target.value))} className="flex-1" />
              <input type="number" min="-25" max="25" value={paletteContrast} onChange={(e) => setPaletteContrast(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const ColorTab = React.memo(ColorTabInner);
