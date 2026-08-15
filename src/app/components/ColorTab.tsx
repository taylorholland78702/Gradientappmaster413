import React, { useState } from 'react';
import { RgbColorPicker } from 'react-colorful';
import { Shuffle, Play, Pause } from '@phosphor-icons/react';
import { type ColorRGB } from '../constants/gradientEffects';
import { rgbToHex, hexToRgb } from '../utils/color';

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
        {/* Pin swatches — one per gradient color stop, click to edit */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {gradientColors.map((c, i) => (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              title={`Color ${i + 1}: ${rgbToHex(c)}`}
              className={`w-6 h-6 rounded-full border-2 transition-all ${i === clampedIndex ? 'border-white scale-110' : 'border-white/30 hover:border-white/60'}`}
              style={{ backgroundColor: rgbToHex(c) }}
            />
          ))}
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
        </div>
      </div>
    </>
  );
};

export const ColorTab = React.memo(ColorTabInner);
