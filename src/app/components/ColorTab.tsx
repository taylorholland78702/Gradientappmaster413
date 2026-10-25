import React from 'react';
import { Shuffle } from '@phosphor-icons/react';
import { type ColorRGB } from '../constants/gradientEffects';
import { hexToRgb, samplePalette, DEFAULT_PALETTE_BIAS, DEFAULT_PALETTE_SHARP } from '../utils/color';
import { PALETTE_GROUPS, type PalettePreset } from '../constants/palettePresets';
import { PaletteStopsEditor } from './PaletteStopsEditor';
import { choice } from './choice';

const COUNT_CHOICES = [2, 3, 4, 5, 6];

export interface ColorTabProps {
  saveCurrentState: () => void;
  setTargetColors: (colors: ColorRGB[]) => void;
  setColorsInstant: (colors: ColorRGB[]) => void;
  gradientColors: ColorRGB[];
  randomColor: () => ColorRGB;
  paletteStops: number[] | null;
  setPaletteStops: (v: number[] | null) => void;
}


const ColorTabInner: React.FC<ColorTabProps> = ({
  saveCurrentState, setTargetColors, setColorsInstant, gradientColors, randomColor,
  paletteStops, setPaletteStops,
}) => {

  // Re-cut the current ramp into n evenly spaced colors, so changing the count
  // keeps the palette's overall look instead of adding or dropping arbitrary ones.
  const resampleTo = (n: number) => {
    if (n === gradientColors.length) return;
    saveCurrentState();
    setColorsInstant(samplePalette(gradientColors, paletteStops, DEFAULT_PALETTE_BIAS, DEFAULT_PALETTE_SHARP, n));
    setPaletteStops(null);
  };

  const applyPalettePreset = (preset: PalettePreset) => {
    saveCurrentState();
    const colors = preset.colors.map(hexToRgb);
    const n = gradientColors.length;
    // Same length eases in; a different length is re-cut to fit and snaps (see setSwatch).
    if (n === colors.length) setTargetColors(colors);
    else setColorsInstant(samplePalette(colors, null, 0.5, 0, n));
    setPaletteStops(null);
  };

  return (
    <>
      {/* Icon-only, full-width, same treatment as the Gradients tab's own
          Shuffle button (border-b doubling as the divider before the first
          section below it). Rolls a new random color for every stop. */}
      <button
        onClick={() => { saveCurrentState(); setTargetColors(gradientColors.map(() => randomColor())); }}
        className="wav-choice w-full px-1 py-1.5 text-[10px] font-semibold transition-all text-white hover:bg-wav-hover flex items-center justify-center gap-1.5 border-b border-wav-line-strong"
        title="Shuffle Colors"
        aria-label="Shuffle Colors"
      ><Shuffle weight="regular" className="w-4 h-4" /></button>

      {/* The palette: how many colors, and the ramp itself with one handle per color. */}
      <section className="w-full px-1.5 pt-2 flex flex-col gap-2" aria-label="Palette">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] text-wav-text-2 font-medium">Palette</h3>
          <div className="flex gap-1" role="group" aria-label="Number of palette colors">
            {COUNT_CHOICES.map(n => (
              <button
                key={n}
                onClick={() => resampleTo(n)}
                aria-pressed={gradientColors.length === n}
                title={`Re-cut the palette to ${n} colors`}
                className={choice(gradientColors.length === n, 'wav-choice-sq')}
              >{n}</button>
            ))}
          </div>
        </div>
        <PaletteStopsEditor
          colors={gradientColors}
          stops={paletteStops}
          setStops={setPaletteStops}
          onBeforeChange={saveCurrentState}
        />
      </section>

      {/* Curated palettes to start from. */}
      <section className="w-full px-1.5 pt-2.5 border-t border-wav-line flex flex-col gap-2" aria-label="Palettes">
        <h3 className="text-[10px] text-wav-text-2 font-medium">Palettes</h3>
        <div className="max-h-72 overflow-y-auto flex flex-col gap-2 pr-0.5">
          {PALETTE_GROUPS.map(g => (
            <div key={g.group} className="flex flex-col gap-1">
              <span className="text-[10px] text-wav-text-3">{g.group}</span>
              <div className="grid grid-cols-2 gap-1">
                {g.palettes.map(p => (
                  <button
                    key={p.name}
                    onClick={() => applyPalettePreset(p)}
                    title={`Use the ${p.name} palette`}
                    className="flex flex-col gap-1 p-1 text-[10px] text-white bg-wav-field hover:bg-wav-hover border border-wav-line transition-all text-left"
                  >
                    <span aria-hidden="true" className="block w-full h-3" style={{ background: `linear-gradient(to right, ${p.colors.join(', ')})` }} />
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export const ColorTab = React.memo(ColorTabInner);
