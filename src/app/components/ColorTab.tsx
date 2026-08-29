import React from 'react';
import { Shuffle, Play, Pause } from '@phosphor-icons/react';
import { type ColorRGB } from '../constants/gradientEffects';

export interface ColorTabProps {
  isAutoColor: boolean;
  setIsAutoColor: (updater: (prev: boolean) => boolean) => void;
  saveCurrentState: () => void;
  setTargetColors: (colors: ColorRGB[]) => void;
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
  isAutoColor, setIsAutoColor, saveCurrentState, setTargetColors, gradientColors, randomColor,
  paletteHue, setPaletteHue, paletteSaturation, setPaletteSaturation,
  paletteBrightness, setPaletteBrightness, paletteContrast, setPaletteContrast,
}) => {
  const isPaletteAdjusted = paletteHue !== 0 || paletteSaturation !== 100 || paletteBrightness !== 0 || paletteContrast !== 0;

  return (
    <>
      <div className="flex gap-2 w-full mt-2.5">
        <button
          onClick={() => setIsAutoColor(prev => !prev)}
          // Always black/white regardless of on/off state (was inverting to
          // a white pill when active) — the icon itself (Pause vs Play)
          // already communicates state, so the button doesn't need its own
          // color swap too.
          className="flex-1 px-1.5 py-1 rounded-lg text-xs transition-all font-semibold flex items-center justify-center shadow-sm bg-black text-white hover:bg-white/15"
          title={isAutoColor ? 'Pause auto color change' : 'Play auto color change'}
          aria-label={isAutoColor ? 'Pause auto color change' : 'Play auto color change'}
        >{isAutoColor ? <Pause weight="regular" className="w-4 h-4" /> : <Play weight="regular" className="w-4 h-4" />}</button>
        <button
          onClick={() => { saveCurrentState(); setTargetColors(gradientColors.map(() => randomColor())); }}
          className="flex-1 px-1.5 py-1 rounded-lg text-xs transition-all bg-black/25 text-white hover:bg-white/15 font-semibold shadow-sm flex items-center justify-center"
          title="Shuffle Colors"
        ><Shuffle weight="regular" className="w-4 h-4" /></button>
      </div>

      {/* Palette-wide adjustments — applied to the whole gradientColors
          array at a single point (see adjustPalette in utils/color.ts),
          so these work the same regardless of whether the palette came
          from a theme/color keyword, shuffle, or manual pin edits. */}
      <div className="w-full pt-2 border-t border-white/10">
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
