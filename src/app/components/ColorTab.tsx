import React, { useState } from 'react';
import { RgbColorPicker } from 'react-colorful';
import { Shuffle, Play, Pause, CaretLeft, CaretRight, Eyedropper } from '@phosphor-icons/react';
import { type ColorRGB } from '../constants/gradientEffects';
import { rgbToHex, hexToRgb } from '../utils/color';

// EyeDropper is a browser API (Chrome/Edge only as of writing), not yet in
// TS lib.dom — declared minimally here rather than pulling in a types pkg.
interface EyeDropperResult { sRGBHex: string }
declare class EyeDropperAPI { open(): Promise<EyeDropperResult> }

export interface ColorTabProps {
  isAutoColor: boolean;
  setIsAutoColor: (updater: (prev: boolean) => boolean) => void;
  saveCurrentState: () => void;
  setTargetColors: (colors: ColorRGB[]) => void;
  gradientColors: ColorRGB[];
  randomColor: () => ColorRGB;
  setGradientColors: (colors: ColorRGB[]) => void;
}

const ColorTabInner: React.FC<ColorTabProps> = ({
  isAutoColor, setIsAutoColor, saveCurrentState, setTargetColors, gradientColors, randomColor,
  setGradientColors,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const clampedIndex = Math.min(selectedIndex, Math.max(0, gradientColors.length - 1));
  const activeColor = gradientColors[clampedIndex] ?? { r: 255, g: 255, b: 255 };
  const [hexInput, setHexInput] = useState(rgbToHex(activeColor));

  // Keep the hex field in sync when the active pin changes (either by
  // clicking a different swatch, or when this pin's color changes from
  // elsewhere — shuffle, canvas drag, auto-color-cycle).
  const activeHex = rgbToHex(activeColor);
  if (hexInput.toLowerCase() !== activeHex.toLowerCase() && document.activeElement?.id !== 'color-hex-input') {
    setHexInput(activeHex);
  }

  const applyColorAt = (index: number, color: ColorRGB) => {
    const next = gradientColors.map((c, i) => (i === index ? color : c));
    setGradientColors(next);
    setTargetColors(next);
  };

  const isEyedropperSupported = typeof window !== 'undefined' && 'EyeDropper' in window;
  const handleEyedropper = async () => {
    if (!isEyedropperSupported) return;
    try {
      const dropper = new (window as unknown as { EyeDropper: typeof EyeDropperAPI }).EyeDropper();
      const result = await dropper.open();
      const parsed = hexToRgb(result.sRGBHex);
      if (parsed) applyColorAt(clampedIndex, parsed);
    } catch {
      // User cancelled the eyedropper (Escape) — nothing to do.
    }
  };

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
    {/* Color Picker */}
      <div className="w-full bg-black/25 rounded-lg border border-white/10 p-2 wav-color-picker">
        {/* Pin stepper — cycles which gradient color stop the picker edits */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setSelectedIndex((clampedIndex - 1 + gradientColors.length) % gradientColors.length)}
            title="Previous color"
            className="w-6 h-6 rounded flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
          ><CaretLeft weight="bold" className="w-3.5 h-3.5" /></button>
          <span className="text-[10px] text-white/60 font-semibold">Color {clampedIndex + 1} of {gradientColors.length}</span>
          <button
            onClick={() => setSelectedIndex((clampedIndex + 1) % gradientColors.length)}
            title="Next color"
            className="w-6 h-6 rounded flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
          ><CaretRight weight="bold" className="w-3.5 h-3.5" /></button>
        </div>

        <RgbColorPicker
          color={activeColor}
          onChange={(color) => applyColorAt(clampedIndex, color)}
        />

        <div className="flex items-center gap-1.5 mt-2">
          <span className="text-[10px] text-white/50 font-semibold">HEX</span>
          <input
            id="color-hex-input"
            type="text"
            value={hexInput}
            onChange={(e) => {
              const v = e.target.value;
              setHexInput(v);
              const parsed = hexToRgb(v);
              if (parsed) applyColorAt(clampedIndex, parsed);
            }}
            onBlur={() => setHexInput(rgbToHex(activeColor))}
            className="flex-1 px-2 py-1 rounded text-[10px] bg-black/25 border border-white/20 focus:border-white/50 focus:outline-none text-white font-mono"
          />
          {isEyedropperSupported && (
            <button
              onClick={handleEyedropper}
              title="Pick color from screen"
              className="w-6 h-6 flex-shrink-0 rounded bg-black/25 border border-white/20 hover:bg-white/15 text-white flex items-center justify-center transition-all"
            ><Eyedropper weight="regular" className="w-3.5 h-3.5" /></button>
          )}
        </div>
      </div>
    </>
  );
};

export const ColorTab = React.memo(ColorTabInner);
