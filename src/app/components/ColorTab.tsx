import React from 'react';
import { Shuffle, Play, Pause, MagicWand } from '@phosphor-icons/react';
import { type ColorRGB, DEFAULT_COLORS } from '../constants/gradientEffects';

const THEME_KEYWORDS = ['aurora','autumn','candy','cherry','cosmic','cyberpunk','desert','dusk','earth','ember','fire','forest','frost','galaxy','ice','jungle','lagoon','lava','midnight','monochrome','nebula','neon','ocean','pastel','rainbow','retro','spring','sunrise','sunset','tropical','vaporwave','winter'];

// Hex values here are decorative only (the little swatch dot next to each
// chip) — the actual generated palettes come from the colorMap in
// InteractiveGradient.tsx's generateAIColors, kept in sync by hand since
// that map isn't exported.
const COLOR_KEYWORDS: Array<[name: string, hex: string]> = [
  ['amber', '#ffbf00'], ['aqua', '#00dcd2'], ['beige', '#decaad'], ['black', '#1e1e1e'],
  ['blue', '#3278ff'], ['bronze', '#b0723b'], ['brown', '#966432'], ['burgundy', '#801428'],
  ['charcoal', '#464a50'], ['coral', '#ff7f50'], ['crimson', '#dc143c'], ['cyan', '#32e6e6'],
  ['emerald', '#3cbe78'], ['fuchsia', '#ff00c8'], ['gold', '#ffd700'], ['gray', '#808080'],
  ['green', '#32c850'], ['indigo', '#6432c8'], ['jade', '#00a878'], ['lavender', '#c8b4ff'],
  ['lime', '#96ff32'], ['magenta', '#ff32c8'], ['maroon', '#801e32'], ['mint', '#96ffc8'],
  ['mustard', '#e6b428'], ['navy', '#1e3278'], ['olive', '#808032'], ['orange', '#ff9632'],
  ['peach', '#ffb478'], ['pink', '#ff64c8'], ['plum', '#a0468c'], ['purple', '#b432ff'],
  ['red', '#ff3232'], ['rose', '#ff6496'], ['rust', '#b7410e'], ['salmon', '#fa8072'],
  ['silver', '#c0c0c0'], ['sky', '#64c8ff'], ['teal', '#32c8b4'], ['turquoise', '#40e0d0'],
  ['violet', '#c864ff'], ['white', '#f0f0f0'], ['yellow', '#ffe632'],
];

export interface ColorTabProps {
  isAutoColor: boolean;
  setIsAutoColor: (updater: (prev: boolean) => boolean) => void;
  saveCurrentState: () => void;
  setTargetColors: (colors: ColorRGB[]) => void;
  gradientColors: ColorRGB[];
  randomColor: () => ColorRGB;
  submittedAIPrompt: string;
  setSubmittedAIPrompt: (v: string) => void;
  setBaseAIColors: (v: ColorRGB[] | null) => void;
  setGradientColors: (colors: ColorRGB[]) => void;
  aiPrompt: string;
  setAIPrompt: (updater: string | ((prev: string) => string)) => void;
  isKeywordHelpOpen: boolean;
  setIsKeywordHelpOpen: (v: boolean) => void;
  handleAIPromptSubmit: () => void;
  setIsAIColorPickerOpen: (v: boolean) => void;
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
  submittedAIPrompt, setSubmittedAIPrompt, setBaseAIColors, setGradientColors,
  aiPrompt, setAIPrompt, isKeywordHelpOpen, setIsKeywordHelpOpen, handleAIPromptSubmit, setIsAIColorPickerOpen,
  paletteHue, setPaletteHue, paletteSaturation, setPaletteSaturation,
  paletteBrightness, setPaletteBrightness, paletteContrast, setPaletteContrast,
}) => {
  const selectedKeywords = aiPrompt.split(' ').filter(Boolean);
  const isPaletteAdjusted = paletteHue !== 0 || paletteSaturation !== 100 || paletteBrightness !== 0 || paletteContrast !== 0;

  return (
    <>
      <div className="flex gap-2 w-full">
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
    {submittedAIPrompt && (
      <div className="flex items-center gap-1.5">
        <div className="flex-1 px-2.5 py-1.5 text-xs text-white/70 bg-black/20 rounded-lg text-center truncate">
          "{submittedAIPrompt}"
        </div>
        <button
          onClick={() => {
            setSubmittedAIPrompt('');
            setBaseAIColors(null);
            setGradientColors(DEFAULT_COLORS);
            setTargetColors(DEFAULT_COLORS);
            setAIPrompt('');
          }}
          className="w-7 h-7 flex-shrink-0 rounded-lg bg-black/20 hover:bg-red-500/40 text-white/50 hover:text-white text-xs flex items-center justify-center transition-all"
          title="Clear keywords"
        >×</button>
      </div>
    )}

    {/* AI Color Picker */}
      <div className="w-full pt-2 border-t border-white/10 wav-palette-picker">
        {/* Selected keyword chips */}
        {selectedKeywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {selectedKeywords.map((kw, i) => (
              <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 text-white shadow-sm">
                {kw}
                <button onClick={() => setAIPrompt(prev => prev.split(' ').filter(Boolean).filter((_, j) => j !== i).join(' '))} className="text-white/60 hover:text-white leading-none">×</button>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1.5 mb-2">
          <div className="relative flex-1">
            <MagicWand weight="regular" className="w-3.5 h-3.5 text-white/40 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value=""
              readOnly
              placeholder={selectedKeywords.length >= 8 ? 'Max 8 keywords selected' : 'Pick themes and colors below…'}
              onFocus={() => setIsKeywordHelpOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAIPromptSubmit();
                if (e.key === 'Escape') { setIsAIColorPickerOpen(false); setAIPrompt(''); }
              }}
              className="w-full pl-7 pr-2 py-1.5 rounded-lg text-[10px] bg-black/25 border border-white/20 focus:border-white/50 focus:outline-none text-white placeholder-white/50 cursor-pointer"
            />
          </div>
          <button
            onClick={handleAIPromptSubmit}
            className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-black text-white hover:bg-white/15 border border-white/20 transition-all flex-shrink-0"
          >
            Generate
          </button>
        </div>

        {isKeywordHelpOpen && (
          <div className="mb-2 rounded-lg bg-black/20 border border-white/8 overflow-hidden">
            <div className="p-2.5 max-h-64 overflow-y-auto">
              <div className="text-[10px] text-white/80 font-medium mb-1.5">Themes</div>
              <div className="grid grid-cols-2 gap-1 mb-3">
                {THEME_KEYWORDS.map(t => {
                  const selected = selectedKeywords.includes(t);
                  const full = selectedKeywords.length >= 8;
                  return (
                    <button key={t} title={t} onClick={() => {
                      if (selected) setAIPrompt(selectedKeywords.filter(k => k !== t).join(' '));
                      else if (!full) setAIPrompt(selectedKeywords.concat(t).join(' '));
                    }} className={`px-1.5 py-1 rounded-md text-[10px] capitalize truncate transition-all ${selected ? 'bg-white text-black font-semibold' : full ? 'opacity-30 cursor-not-allowed text-white/60' : 'bg-white/10 hover:bg-white/20 text-white/80'}`}>{t}</button>
                  );
                })}
              </div>

              <div className="text-[10px] text-white/80 font-medium mb-1.5">Colors</div>
              <div className="grid grid-cols-2 gap-1">
                {COLOR_KEYWORDS.map(([c, hex]) => {
                  const selected = selectedKeywords.includes(c);
                  const full = selectedKeywords.length >= 8;
                  return (
                    <button key={c} title={c} onClick={() => {
                      if (selected) setAIPrompt(selectedKeywords.filter(k => k !== c).join(' '));
                      else if (!full) setAIPrompt(selectedKeywords.concat(c).join(' '));
                    }} className={`flex items-center gap-1.5 px-1.5 py-1 rounded-md text-[10px] capitalize truncate transition-all ${selected ? 'bg-white text-black font-semibold' : full ? 'opacity-30 cursor-not-allowed text-white/60' : 'bg-white/10 hover:bg-white/20 text-white/80'}`}>
                      <span className="w-2.5 h-2.5 flex-shrink-0 ring-1 ring-white/30" style={{ backgroundColor: hex }} />
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-between px-2.5 py-1.5 bg-black/15 border-t border-white/8">
              <span className="text-[9px] text-white/40">Up to 8 keywords</span>
              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${selectedKeywords.length >= 8 ? 'bg-white/20 text-white' : 'text-white/50'}`}>{selectedKeywords.length}/8</span>
            </div>
          </div>
        )}
      </div>

      {/* Palette-wide adjustments — applied to the whole gradientColors
          array at a single point (see adjustPalette in utils/color.ts),
          so these work the same regardless of whether the palette came
          from a theme/color keyword, shuffle, or manual pin edits. */}
      <div className="w-full pt-2 border-t border-white/10">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-white/80 font-medium">Adjustments</span>
          {isPaletteAdjusted && (
            <button
              onClick={() => { setPaletteHue(0); setPaletteSaturation(100); setPaletteBrightness(0); setPaletteContrast(0); }}
              className="text-[10px] text-white/50 hover:text-white transition-all"
            >Reset</button>
          )}
        </div>

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
