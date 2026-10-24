import React from 'react';
import { Shuffle, Plus, X } from '@phosphor-icons/react';
import { type ColorRGB } from '../constants/gradientEffects';
import { rgbToHex, hexToRgb, hslToRgb, samplePalette } from '../utils/color';
import { PALETTE_GROUPS, type PalettePreset } from '../constants/palettePresets';
import { WAV_MOODS } from '../constants/gradientEffects';
import { extractPalette } from '../utils/extractPalette';
import { PaletteStopsEditor } from './PaletteStopsEditor';
import { SliderRow } from './SliderRow';
import { choice } from './choice';

// Keeps the palette a valid gradient (at least 2 stops) and keeps the
// swatch row from growing unboundedly if someone just holds down +.
const MIN_PALETTE_COLORS = 2;
const MAX_PALETTE_COLORS = 10;
const COUNT_CHOICES = [2, 3, 4, 5, 6];

export interface ColorTabProps {
  saveCurrentState: () => void;
  setTargetColors: (colors: ColorRGB[]) => void;
  setColorsInstant: (colors: ColorRGB[]) => void;
  gradientColors: ColorRGB[];
  randomColor: () => ColorRGB;
  paletteStops: number[] | null;
  setPaletteStops: (v: number[] | null) => void;
  paletteBias: number;
  setPaletteBias: (v: number) => void;
  paletteSharp: number;
  setPaletteSharp: (v: number) => void;
  keepFamily: boolean;
  setKeepFamily: (v: boolean) => void;
  shuffleColors: () => void;
}


const ColorTabInner: React.FC<ColorTabProps> = ({
  saveCurrentState, setTargetColors, setColorsInstant, gradientColors, randomColor,
  paletteStops, setPaletteStops, paletteBias, setPaletteBias, paletteSharp, setPaletteSharp,
  keepFamily, setKeepFamily, shuffleColors,
}) => {

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

  // Re-cut the current ramp into n evenly spaced colors, so changing the count
  // keeps the palette's overall look instead of adding or dropping arbitrary ones.
  const resampleTo = (n: number) => {
    if (n === gradientColors.length) return;
    saveCurrentState();
    setColorsInstant(samplePalette(gradientColors, paletteStops, paletteBias, paletteSharp, n));
    setPaletteStops(null);
  };

  // A fresh palette in a mood's hue/saturation/lightness ranges, dark to light.
  // Always newly rolled, so tapping a mood twice gives two takes on it.
  const applyMood = (mood: (typeof WAV_MOODS)[number]) => {
    saveCurrentState();
    const n = gradientColors.length;
    const next = Array.from({ length: n }, (_, i) => {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const hue = (mood.hues[i % mood.hues.length] + (Math.random() - 0.5) * 24 + 360) % 360;
      const sat = mood.sat[0] + Math.random() * (mood.sat[1] - mood.sat[0]);
      const lit = mood.lit[0] + t * (mood.lit[1] - mood.lit[0]);
      return hslToRgb(hue, sat, lit);
    });
    setTargetColors(next);
    setPaletteStops(null);
  };

  // Pulls the dominant colors out of a picked image — as many as the palette has
  // now — so a photo's mood can become the gradient. Read on a 64px copy; the
  // image never leaves the browser.
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = React.useState<string | null>(null);
  const paletteFromImage = (file: File | undefined) => {
    if (!file) return;
    setImageError(null);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const side = 64;
        const c = document.createElement('canvas');
        c.width = side; c.height = side;
        const x = c.getContext('2d', { willReadFrequently: true });
        if (!x) throw new Error('no canvas');
        x.drawImage(img, 0, 0, side, side);
        const colors = extractPalette(x.getImageData(0, 0, side, side).data, gradientColors.length);
        if (colors.length === 0) throw new Error('empty');
        saveCurrentState();
        setColorsInstant(colors);
        setPaletteStops(null);
      } catch {
        setImageError('Couldn\u2019t read colors from that image.');
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => { setImageError('That file isn\u2019t an image the browser can open.'); URL.revokeObjectURL(url); };
    img.src = url;
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

  const removeSwatch = (index: number) => {
    if (gradientColors.length <= MIN_PALETTE_COLORS) return;
    saveCurrentState();
    setColorsInstant(gradientColors.filter((_, i) => i !== index));
  };

  const [startFrom, setStartFrom] = React.useState<'palettes' | 'moods' | 'image'>('palettes');


  const chip = (active: boolean) =>
    `px-2 py-1 text-[10px] border transition-all ${active ? 'bg-white text-black font-bold border-white' : 'text-white bg-wav-field hover:bg-wav-hover border-wav-line'}`;

  return (
    <>
      {/* Icon-only, full-width, same treatment as the Gradients tab's own
          Shuffle button (border-b doubling as the divider before the first
          section below it). */}
      <button
        onClick={() => { if (keepFamily) { shuffleColors(); return; } saveCurrentState(); setTargetColors(gradientColors.map(() => randomColor())); }}
        className="wav-choice w-full px-1 py-1.5 text-[10px] font-semibold transition-all text-white hover:bg-wav-hover flex items-center justify-center gap-1.5 border-b border-wav-line-strong"
        title="Shuffle Colors"
        aria-label="Shuffle Colors"
      ><Shuffle weight="regular" className="w-4 h-4" /></button>

      <div className="w-full px-1.5 pt-2 flex items-center justify-between gap-2">
        <span className="text-[10px] text-wav-text-2 font-medium" title="What Shuffle does with the colors">Shuffle picks</span>
        <div className="flex gap-0.5" role="group" aria-label="Shuffle color range">
          {([[false, 'Any color', 'Any palette at all'], [true, 'Same family', 'Stay in the color family you have now, so a run of shuffles feels like one mood']] as const).map(([val, label, hint]) => (
            <button
              key={label}
              onClick={() => setKeepFamily(val)}
              aria-pressed={keepFamily === val}
              title={hint}
              className={choice(keepFamily === val)}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* Your palette: the swatches themselves (one native color input each,
          bound to gradientColors[i]) and how many there are. */}
      <section className="w-full px-1.5 flex flex-col gap-2" aria-label="Palette">
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
                className="w-11 h-11 lg:w-7 lg:h-7 rounded-none cursor-pointer border border-wav-line bg-transparent p-0"
              />
              {gradientColors.length > MIN_PALETTE_COLORS && (
                <button
                  onClick={() => removeSwatch(i)}
                  title={`Remove color ${i + 1}`}
                  aria-label={`Remove color ${i + 1}`}
                  className="wav-hit absolute -top-2 -right-2 w-6 h-6 rounded-full bg-black border border-wav-line text-white flex items-center justify-center hover:bg-wav-recording transition-colors"
                ><X weight="bold" className="w-3 h-3" /></button>
              )}
            </div>
          ))}
          {gradientColors.length < MAX_PALETTE_COLORS && (
            <button
              onClick={addSwatch}
              title="Add color"
              aria-label="Add color"
              className="wav-choice wav-choice-sq w-11 h-11 lg:w-6 lg:h-6 flex items-center justify-center border border-dashed border-wav-line text-wav-text-2 hover:text-white hover:border-wav-line-strong transition-colors"
            ><Plus weight="bold" className="w-3 h-3" /></button>
          )}
        </div>
      </section>

      {/* Ways to fill the palette: curated sets, a fresh take on a mood, or a
          photo's colors. One at a time so the tab isn't a wall of chips. */}
      <section className="w-full px-1.5 pt-2.5 border-t border-wav-line flex flex-col gap-2" aria-label="Start from">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] text-wav-text-2 font-medium">Start from</h3>
          <div className="flex gap-0.5" role="group" aria-label="Palette source">
            {([['palettes', 'Palettes'], ['moods', 'Moods'], ['image', 'Image']] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setStartFrom(id)}
                aria-pressed={startFrom === id}
                className={choice(startFrom === id)}
              >{label}</button>
            ))}
          </div>
        </div>
        {startFrom === 'palettes' && (
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
        )}
        {startFrom === 'moods' && (
          <div className="flex flex-wrap gap-1">
            {WAV_MOODS.map(m => (
              <button
                key={m.name}
                onClick={() => applyMood(m)}
                title={`A new ${m.name} palette — tap again for another take`}
                className="px-2 py-1 text-[10px] capitalize text-white bg-wav-field hover:bg-wav-hover border border-wav-line transition-all"
              >{m.name}</button>
            ))}
          </div>
        )}
        {startFrom === 'image' && (
          <div className="flex flex-col gap-1">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { paletteFromImage(e.target.files?.[0]); e.target.value = ''; }} />
            <button
              onClick={() => fileRef.current?.click()}
              title="Use the dominant colors of an image as the palette"
              className="px-2 py-2 text-[10px] text-white bg-wav-field hover:bg-wav-hover border border-wav-line transition-all"
            >Choose an image…</button>
            <p className="text-[10px] text-wav-text-3">Takes {gradientColors.length} dominant colors, dark to light. The image stays on your device.</p>
            {imageError && <p role="alert" className="text-[10px] text-wav-error">{imageError}</p>}
          </div>
        )}
      </section>

      {/* Where each color sits along the ramp, plus Bias/Sharpness — a global
          reshaping of how every gradient samples the palette (see
          paletteSegmentFor in utils/color.ts). */}
      <PaletteStopsEditor
        colors={gradientColors}
        stops={paletteStops}
        setStops={setPaletteStops}
        bias={paletteBias}
        setBias={setPaletteBias}
        sharp={paletteSharp}
        setSharp={setPaletteSharp}
        onBeforeChange={saveCurrentState}
      />
    </>
  );
};

export const ColorTab = React.memo(ColorTabInner);
