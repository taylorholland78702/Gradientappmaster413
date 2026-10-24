import { useEffect, type SetStateAction } from 'react';
import { IS_DISPLAY_MODE } from '../constants/displayMode';
import type { ColorRGB, GradientType } from '../constants/gradientEffects';

// Color Auto Play: drifts the palette on a timer. Moved out of InteractiveGradient unchanged.
export interface UseAutoColorParams {
  isAutoColor: boolean;
  gradientType: GradientType;
  gradientColors: ColorRGB[];
  setTargetColors: (value: SetStateAction<ColorRGB[]>) => void;
  baseAIColors: ColorRGB[] | null;
}

export function useAutoColor(p: UseAutoColorParams) {
  const { isAutoColor, gradientType, gradientColors, setTargetColors, baseAIColors } = p;
  // Color AUTO PLAY — cycles colors independently of gradient AUTO PLAY.
  // Skipped entirely in Display mode: this uses Math.random() every 800ms,
  // so two windows each running their own copy would diverge in color
  // immediately even with identical gradient type/shape/animation phase —
  // exactly the "shape matches, colors don't" symptom reported. The
  // resulting gradientColors/targetColors are already part of
  // buildSnapshot, so the Display tab gets the controller's actual colors
  // via the existing sync instead of rolling its own.
  useEffect(() => {
    if (IS_DISPLAY_MODE) return;
    if (!isAutoColor) return;

    const applyColorShift = (color: ColorRGB, baseColor: ColorRGB | null, shiftRange: number): ColorRGB => {
      if (baseColor) {
        const maxDrift = 30;
        const newR = Math.max(baseColor.r - maxDrift, Math.min(baseColor.r + maxDrift, color.r + (Math.random() - 0.5) * shiftRange));
        const newG = Math.max(baseColor.g - maxDrift, Math.min(baseColor.g + maxDrift, color.g + (Math.random() - 0.5) * shiftRange));
        const newB = Math.max(baseColor.b - maxDrift, Math.min(baseColor.b + maxDrift, color.b + (Math.random() - 0.5) * shiftRange));
        return { r: Math.max(0, Math.min(255, newR)), g: Math.max(0, Math.min(255, newG)), b: Math.max(0, Math.min(255, newB)) };
      }
      return {
        r: Math.max(0, Math.min(255, color.r + (Math.random() - 0.5) * shiftRange)),
        g: Math.max(0, Math.min(255, color.g + (Math.random() - 0.5) * shiftRange)),
        b: Math.max(0, Math.min(255, color.b + (Math.random() - 0.5) * shiftRange)),
      };
    };

    const interval = setInterval(() => {
      if (gradientType === 'voronoi' || gradientType === 'radial-burst' || gradientType === 'flower' || gradientType === 'noise') {
        setTargetColors(prev => prev.map((color, index) => applyColorShift(color, baseAIColors?.[index] || null, 60)));
      } else {
        // Capped at the palette size: with 2 colors, asking for 3 distinct indices never
        // finishes, and the loop below froze the whole page.
        const numColorsToChange = Math.min(gradientColors.length, Math.floor(Math.random() * 2) + 2);
        const indicesToChange = new Set<number>();
        while (indicesToChange.size < numColorsToChange) {
          indicesToChange.add(Math.floor(Math.random() * gradientColors.length));
        }
        setTargetColors(prev =>
          prev.map((color, index) =>
            applyColorShift(color, baseAIColors?.[index] || null, indicesToChange.has(index) ? 40 : 16)
          )
        );
      }
    }, 800);

    return () => clearInterval(interval);
  }, [isAutoColor, gradientColors.length, gradientType, baseAIColors]);
}
