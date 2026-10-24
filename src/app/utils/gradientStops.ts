import type { ColorRGB } from '../constants/gradientEffects';
import { getActivePaletteMap, shiftHueByTreble } from './color';

// Adds a palette's colors to a canvas gradient as evenly spaced stops (or flat bands with `hardEdge`).
// `trebleLevel` is the audio treble level when audio is driving the hue, else 0. Moved out of
// InteractiveGradient unchanged apart from taking that level directly.
export function addGradientStops(gradient: CanvasGradient, colors: ColorRGB[], hardEdge: boolean | undefined, trebleLevel: number): void {
  const count = colors.length;
  if (count === 0) return;
  
  // Validate colors and replace any invalid ones
  const validColors = colors.map(color => {
    if (!color || isNaN(color.r) || isNaN(color.g) || isNaN(color.b)) {
      return { r: 128, g: 128, b: 128 }; // Default gray for invalid colors
    }
    return {
      r: Math.max(0, Math.min(255, color.r)),
      g: Math.max(0, Math.min(255, color.g)),
      b: Math.max(0, Math.min(255, color.b))
    };
  });
  
  // Apply hue shift if audio is reactive
  const shouldApplyHueShift = trebleLevel > 0;

  const applyHueShift = (color: ColorRGB): ColorRGB =>
    shouldApplyHueShift ? shiftHueByTreble(color, trebleLevel) : color;
  
  if (count === 1) {
    const shifted = applyHueShift(validColors[0]);
    gradient.addColorStop(0, `rgb(${shifted.r},${shifted.g},${shifted.b})`);
    return;
  }

  if (hardEdge) {
    // A duplicate stop at each band's start AND end (rather than one
    // shared, crossfading stop between neighbors) is what makes the
    // canvas render a flat solid color per band with a hard cut at the
    // boundary instead of a blend.
    const bandStep = 1 / count;
    for (let i = 0; i < count; i++) {
      const shifted = applyHueShift(validColors[i]);
      const rgb = `rgb(${shifted.r},${shifted.g},${shifted.b})`;
      gradient.addColorStop(Math.min(1, i * bandStep), rgb);
      gradient.addColorStop(Math.min(1, (i + 1) * bandStep), rgb);
    }
    return;
  }

  // Custom stop positions apply here too (Bias and Sharpness can't be
  // expressed as native canvas stops — those only take effect on the WebGL
  // Radial fill this is the fallback for).
  const customStops = getActivePaletteMap().stops;
  const useCustomStops = !!customStops && customStops.length === count;
  const step = 1 / (count - 1);
  for (let i = 0; i < count; i++) {
    const shifted = applyHueShift(validColors[i]);
    gradient.addColorStop(useCustomStops ? customStops![i] : i * step, `rgb(${shifted.r},${shifted.g},${shifted.b})`);
  }
}
