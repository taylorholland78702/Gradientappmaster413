import React from 'react';
import { Shuffle, Play, Pause } from '@phosphor-icons/react';
import { type ColorRGB, DEFAULT_COLORS } from '../constants/gradientEffects';

const THEME_KEYWORDS = ['autumn','candy','cherry','desert','earth','fire','forest','galaxy','ice','midnight','monochrome','neon','ocean','pastel','rainbow','spring','sunrise','sunset','tropical','winter'];
const COLOR_KEYWORDS = ['black','blue','brown','coral','cyan','gold','gray','green','indigo','lavender','lime','magenta','maroon','mint','navy','olive','orange','peach','pink','purple','red','rose','salmon','silver','sky','teal','turquoise','violet','white','yellow'];

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
}

const ColorTabInner: React.FC<ColorTabProps> = ({
  isAutoColor, setIsAutoColor, saveCurrentState, setTargetColors, gradientColors, randomColor,
  submittedAIPrompt, setSubmittedAIPrompt, setBaseAIColors, setGradientColors,
  aiPrompt, setAIPrompt, isKeywordHelpOpen, setIsKeywordHelpOpen, handleAIPromptSubmit, setIsAIColorPickerOpen,
}) => {
  const selectedKeywords = aiPrompt.split(' ').filter(Boolean);

  return (
    <>
      <div className="flex gap-2 w-full">
        <button
          onClick={() => setIsAutoColor(prev => !prev)}
          className={`flex-1 px-1.5 py-1 rounded-lg text-xs transition-all font-semibold flex items-center justify-center shadow-sm ${isAutoColor ? 'bg-white text-black' : 'bg-black/25 text-white/50 hover:bg-white/15 hover:text-white'}`}
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
      <div className="flex items-center gap-1">
        <div className="flex-1 px-2 py-1 text-xs text-white/70 bg-black/20 rounded text-center truncate">
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
          className="w-6 h-6 flex-shrink-0 rounded bg-black/20 hover:bg-red-500/40 text-white/50 hover:text-white text-xs flex items-center justify-center transition-all"
          title="Clear keywords"
        >×</button>
      </div>
    )}

    {/* AI Color Picker */}
      <div className="w-full bg-black/25 rounded-lg p-2">
        {/* Selected keyword chips */}
        {selectedKeywords.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {selectedKeywords.map((kw, i) => (
              <span key={i} className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 text-white">
                {kw}
                <button onClick={() => setAIPrompt(prev => prev.split(' ').filter(Boolean).filter((_, j) => j !== i).join(' '))} className="ml-0.5 text-white/60 hover:text-white leading-none">×</button>
              </span>
            ))}
          </div>
        )}

        <div className="mb-2">
          <input
            type="text"
            value=""
            readOnly
            placeholder={selectedKeywords.length >= 8 ? 'Max 8 keywords selected' : 'Palette Picker: Select up to 8'}
            onFocus={() => setIsKeywordHelpOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAIPromptSubmit();
              if (e.key === 'Escape') { setIsAIColorPickerOpen(false); setAIPrompt(''); }
            }}
            className="w-full px-2 py-1.5 rounded text-[10px] bg-black/25 border border-white/20 focus:border-white/50 focus:outline-none text-white placeholder-white cursor-pointer"
          />
        </div>

        {isKeywordHelpOpen && (
          <div className="mb-2 p-2 rounded bg-black/20 border border-white/8 text-[10px] text-white/70 leading-relaxed max-h-52 overflow-y-auto">
            <div className="font-bold text-white/90 mb-1">Themes</div>
            <div className="mb-0.5 flex flex-wrap gap-x-1 gap-y-0.5 leading-none">
              {THEME_KEYWORDS.map(t => {
                const selected = selectedKeywords.includes(t);
                const full = selectedKeywords.length >= 8;
                return (
                  <span key={t} onClick={() => {
                    if (selected) setAIPrompt(selectedKeywords.filter(k => k !== t).join(' '));
                    else if (!full) setAIPrompt(selectedKeywords.concat(t).join(' '));
                  }} className={`px-1.5 py-0.5 rounded-full cursor-pointer transition-all ${selected ? 'bg-white text-black' : full ? 'opacity-30 cursor-not-allowed' : 'bg-white/10 hover:bg-white/20 text-white/80'}`}>{t}</span>
                );
              })}
            </div>
            <div className="font-bold text-white/90 mb-1">Colors</div>
            <div className="flex flex-wrap gap-x-1 gap-y-0.5 leading-none">
              {COLOR_KEYWORDS.map(c => {
                const selected = selectedKeywords.includes(c);
                const full = selectedKeywords.length >= 8;
                return (
                  <span key={c} onClick={() => {
                    if (selected) setAIPrompt(selectedKeywords.filter(k => k !== c).join(' '));
                    else if (!full) setAIPrompt(selectedKeywords.concat(c).join(' '));
                  }} className={`px-1.5 py-0.5 rounded-full cursor-pointer transition-all ${selected ? 'bg-white text-black' : full ? 'opacity-30 cursor-not-allowed' : 'bg-white/10 hover:bg-white/20 text-white/80'}`}>{c}</span>
                );
              })}
            </div>
            <div className="mt-1.5 text-white/40 text-right">{selectedKeywords.length}/8 selected</div>
          </div>
        )}

        <div className="flex gap-1.5 justify-end">
          <button
            onClick={() => {
              setIsAIColorPickerOpen(false);
              setAIPrompt('');
              setIsKeywordHelpOpen(false);
            }}
            className="px-2 py-0.5 rounded text-xs bg-black/25 text-white hover:bg-white/15 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleAIPromptSubmit}
            className="px-2 py-0.5 rounded text-xs bg-white/30 text-white font-semibold shadow-sm hover:bg-white/40 transition-all"
          >
            Generate
          </button>
        </div>
      </div>
    </>
  );
};

export const ColorTab = React.memo(ColorTabInner);
