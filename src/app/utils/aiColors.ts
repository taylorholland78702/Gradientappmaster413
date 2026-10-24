import type { ColorRGB } from '../constants/gradientEffects';

// Turns a free-text color prompt ("warm sunset", "deep ocean", ...) into a palette of `targetLength` colors.
// Pure apart from the injected helpers; moved out of InteractiveGradient unchanged.
export function generateAIColors(
  prompt: string,
  targetLength: number,
  adjustColorArrayLength: (colors: ColorRGB[], length: number) => ColorRGB[],
  randomColor: () => ColorRGB,
): ColorRGB[] {
  const lowerPrompt = prompt.toLowerCase();
  const words = lowerPrompt.split(/\s+/);
  
  
  // Color keyword mappings
  const colorMap: Record<string, ColorRGB> = {
    red: { r: 255, g: 50, b: 50 },
    orange: { r: 255, g: 150, b: 50 },
    yellow: { r: 255, g: 230, b: 50 },
    green: { r: 50, g: 200, b: 80 },
    blue: { r: 50, g: 120, b: 255 },
    purple: { r: 180, g: 50, b: 255 },
    pink: { r: 255, g: 100, b: 200 },
    cyan: { r: 50, g: 230, b: 230 },
    magenta: { r: 255, g: 50, b: 200 },
    lime: { r: 150, g: 255, b: 50 },
    teal: { r: 50, g: 200, b: 180 },
    indigo: { r: 100, g: 50, b: 200 },
    violet: { r: 200, g: 100, b: 255 },
    brown: { r: 150, g: 100, b: 50 },
    black: { r: 30, g: 30, b: 30 },
    white: { r: 240, g: 240, b: 240 },
    gray: { r: 128, g: 128, b: 128 },
    gold: { r: 255, g: 215, b: 0 },
    silver: { r: 192, g: 192, b: 192 },
    coral: { r: 255, g: 127, b: 80 },
    peach: { r: 255, g: 180, b: 120 },
    lavender: { r: 200, g: 180, b: 255 },
    mint: { r: 150, g: 255, b: 200 },
    rose: { r: 255, g: 100, b: 150 },
    sky: { r: 100, g: 200, b: 255 },
    navy: { r: 30, g: 50, b: 120 },
    maroon: { r: 128, g: 30, b: 50 },
    olive: { r: 128, g: 128, b: 50 },
    turquoise: { r: 64, g: 224, b: 208 },
    salmon: { r: 250, g: 128, b: 114 },
    amber: { r: 255, g: 191, b: 0 },
    aqua: { r: 0, g: 220, b: 210 },
    beige: { r: 222, g: 202, b: 173 },
    bronze: { r: 176, g: 114, b: 59 },
    burgundy: { r: 128, g: 20, b: 40 },
    charcoal: { r: 70, g: 74, b: 80 },
    crimson: { r: 220, g: 20, b: 60 },
    emerald: { r: 60, g: 190, b: 120 },
    fuchsia: { r: 255, g: 0, b: 200 },
    jade: { r: 0, g: 168, b: 120 },
    mustard: { r: 230, g: 180, b: 40 },
    plum: { r: 160, g: 70, b: 140 },
    rust: { r: 183, g: 65, b: 14 },
  };
  
  // Mood/theme mappings
  const themeMap: Record<string, ColorRGB[]> = {
    sunset: [
      { r: 255, g: 100, b: 50 },
      { r: 255, g: 150, b: 100 },
      { r: 255, g: 180, b: 150 },
      { r: 200, g: 100, b: 180 },
      { r: 150, g: 80, b: 200 },
      { r: 100, g: 50, b: 150 },
    ],
    sunrise: [
      { r: 255, g: 200, b: 150 },
      { r: 255, g: 180, b: 120 },
      { r: 255, g: 150, b: 80 },
      { r: 255, g: 230, b: 180 },
      { r: 200, g: 180, b: 255 },
      { r: 150, g: 150, b: 255 },
    ],
    ocean: [
      { r: 20, g: 100, b: 180 },
      { r: 30, g: 150, b: 220 },
      { r: 50, g: 180, b: 230 },
      { r: 100, g: 200, b: 230 },
      { r: 150, g: 220, b: 240 },
      { r: 200, g: 240, b: 250 },
    ],
    forest: [
      { r: 20, g: 80, b: 40 },
      { r: 40, g: 120, b: 60 },
      { r: 60, g: 150, b: 80 },
      { r: 100, g: 180, b: 100 },
      { r: 150, g: 200, b: 120 },
      { r: 180, g: 220, b: 150 },
    ],
    fire: [
      { r: 255, g: 50, b: 0 },
      { r: 255, g: 100, b: 0 },
      { r: 255, g: 150, b: 0 },
      { r: 255, g: 200, b: 50 },
      { r: 255, g: 230, b: 100 },
      { r: 255, g: 255, b: 150 },
    ],
    ice: [
      { r: 180, g: 230, b: 255 },
      { r: 200, g: 240, b: 255 },
      { r: 220, g: 245, b: 255 },
      { r: 240, g: 250, b: 255 },
      { r: 200, g: 230, b: 250 },
      { r: 180, g: 220, b: 245 },
    ],
    tropical: [
      { r: 255, g: 100, b: 150 },
      { r: 255, g: 180, b: 100 },
      { r: 100, g: 220, b: 180 },
      { r: 80, g: 200, b: 220 },
      { r: 150, g: 100, b: 255 },
      { r: 255, g: 150, b: 200 },
    ],
    neon: [
      { r: 255, g: 0, b: 255 },
      { r: 0, g: 255, b: 255 },
      { r: 255, g: 255, b: 0 },
      { r: 0, g: 255, b: 100 },
      { r: 255, g: 100, b: 0 },
      { r: 150, g: 0, b: 255 },
    ],
    pastel: [
      { r: 255, g: 200, b: 220 },
      { r: 220, g: 200, b: 255 },
      { r: 200, g: 230, b: 255 },
      { r: 200, g: 255, b: 230 },
      { r: 255, g: 255, b: 200 },
      { r: 255, g: 220, b: 200 },
    ],
    autumn: [
      { r: 200, g: 80, b: 50 },
      { r: 220, g: 120, b: 50 },
      { r: 240, g: 150, b: 50 },
      { r: 200, g: 150, b: 80 },
      { r: 150, g: 100, b: 60 },
      { r: 180, g: 80, b: 40 },
    ],
    spring: [
      { r: 255, g: 200, b: 220 },
      { r: 200, g: 255, b: 200 },
      { r: 255, g: 255, b: 180 },
      { r: 180, g: 220, b: 255 },
      { r: 255, g: 220, b: 255 },
      { r: 220, g: 255, b: 220 },
    ],
    winter: [
      { r: 200, g: 220, b: 240 },
      { r: 180, g: 200, b: 230 },
      { r: 220, g: 230, b: 250 },
      { r: 150, g: 180, b: 220 },
      { r: 190, g: 210, b: 240 },
      { r: 210, g: 225, b: 245 },
    ],
    galaxy: [
      { r: 100, g: 50, b: 150 },
      { r: 150, g: 50, b: 200 },
      { r: 80, g: 100, b: 180 },
      { r: 200, g: 100, b: 255 },
      { r: 50, g: 150, b: 255 },
      { r: 150, g: 100, b: 220 },
    ],
    desert: [
      { r: 240, g: 200, b: 150 },
      { r: 230, g: 180, b: 120 },
      { r: 220, g: 160, b: 100 },
      { r: 200, g: 150, b: 90 },
      { r: 210, g: 170, b: 110 },
      { r: 190, g: 140, b: 80 },
    ],
    candy: [
      { r: 255, g: 100, b: 200 },
      { r: 255, g: 150, b: 255 },
      { r: 150, g: 200, b: 255 },
      { r: 255, g: 200, b: 150 },
      { r: 200, g: 255, b: 200 },
      { r: 255, g: 255, b: 150 },
    ],
    earth: [
      { r: 100, g: 80, b: 50 },
      { r: 120, g: 100, b: 60 },
      { r: 80, g: 120, b: 80 },
      { r: 140, g: 120, b: 80 },
      { r: 100, g: 140, b: 100 },
      { r: 160, g: 140, b: 100 },
    ],
    rainbow: [
      { r: 255, g: 0, b: 0 },
      { r: 255, g: 150, b: 0 },
      { r: 255, g: 255, b: 0 },
      { r: 0, g: 255, b: 0 },
      { r: 0, g: 150, b: 255 },
      { r: 150, g: 0, b: 255 },
    ],
    monochrome: [
      { r: 50, g: 50, b: 50 },
      { r: 100, g: 100, b: 100 },
      { r: 150, g: 150, b: 150 },
      { r: 180, g: 180, b: 180 },
      { r: 210, g: 210, b: 210 },
      { r: 230, g: 230, b: 230 },
    ],
    midnight: [
      { r: 20, g: 20, b: 50 },
      { r: 30, g: 30, b: 80 },
      { r: 40, g: 40, b: 100 },
      { r: 50, g: 50, b: 120 },
      { r: 80, g: 60, b: 140 },
      { r: 100, g: 80, b: 160 },
    ],
    cherry: [
      { r: 255, g: 50, b: 100 },
      { r: 255, g: 80, b: 120 },
      { r: 255, g: 100, b: 140 },
      { r: 220, g: 50, b: 100 },
      { r: 200, g: 40, b: 80 },
      { r: 180, g: 30, b: 60 },
    ],
    aurora: [
      { r: 30, g: 200, b: 150 },
      { r: 80, g: 220, b: 180 },
      { r: 100, g: 180, b: 255 },
      { r: 150, g: 100, b: 255 },
      { r: 200, g: 80, b: 220 },
      { r: 80, g: 255, b: 200 },
    ],
    cosmic: [
      { r: 20, g: 10, b: 60 },
      { r: 60, g: 20, b: 120 },
      { r: 120, g: 40, b: 180 },
      { r: 200, g: 60, b: 200 },
      { r: 80, g: 100, b: 220 },
      { r: 255, g: 100, b: 180 },
    ],
    cyberpunk: [
      { r: 255, g: 0, b: 150 },
      { r: 0, g: 255, b: 255 },
      { r: 150, g: 0, b: 255 },
      { r: 255, g: 200, b: 0 },
      { r: 0, g: 200, b: 255 },
      { r: 255, g: 0, b: 100 },
    ],
    dusk: [
      { r: 255, g: 150, b: 100 },
      { r: 220, g: 120, b: 130 },
      { r: 180, g: 100, b: 160 },
      { r: 120, g: 80, b: 180 },
      { r: 70, g: 60, b: 150 },
      { r: 40, g: 40, b: 100 },
    ],
    ember: [
      { r: 80, g: 20, b: 10 },
      { r: 150, g: 40, b: 10 },
      { r: 200, g: 70, b: 20 },
      { r: 255, g: 120, b: 30 },
      { r: 255, g: 170, b: 60 },
      { r: 255, g: 210, b: 120 },
    ],
    frost: [
      { r: 210, g: 230, b: 240 },
      { r: 180, g: 210, b: 230 },
      { r: 150, g: 190, b: 220 },
      { r: 120, g: 170, b: 210 },
      { r: 200, g: 220, b: 235 },
      { r: 230, g: 240, b: 245 },
    ],
    jungle: [
      { r: 10, g: 60, b: 30 },
      { r: 30, g: 100, b: 50 },
      { r: 60, g: 140, b: 60 },
      { r: 100, g: 170, b: 70 },
      { r: 150, g: 200, b: 90 },
      { r: 200, g: 220, b: 120 },
    ],
    lagoon: [
      { r: 10, g: 90, b: 100 },
      { r: 20, g: 130, b: 140 },
      { r: 40, g: 170, b: 170 },
      { r: 80, g: 200, b: 190 },
      { r: 130, g: 220, b: 210 },
      { r: 180, g: 240, b: 230 },
    ],
    lava: [
      { r: 20, g: 10, b: 10 },
      { r: 80, g: 20, b: 10 },
      { r: 180, g: 40, b: 10 },
      { r: 255, g: 80, b: 10 },
      { r: 255, g: 150, b: 30 },
      { r: 255, g: 210, b: 80 },
    ],
    nebula: [
      { r: 60, g: 20, b: 100 },
      { r: 120, g: 40, b: 160 },
      { r: 180, g: 60, b: 200 },
      { r: 220, g: 100, b: 220 },
      { r: 100, g: 80, b: 220 },
      { r: 60, g: 150, b: 220 },
    ],
    retro: [
      { r: 210, g: 100, b: 60 },
      { r: 230, g: 150, b: 60 },
      { r: 220, g: 180, b: 80 },
      { r: 160, g: 110, b: 70 },
      { r: 120, g: 80, b: 60 },
      { r: 200, g: 60, b: 70 },
    ],
    vaporwave: [
      { r: 255, g: 110, b: 200 },
      { r: 180, g: 110, b: 255 },
      { r: 110, g: 200, b: 255 },
      { r: 255, g: 180, b: 230 },
      { r: 200, g: 150, b: 255 },
      { r: 130, g: 230, b: 255 },
    ],
  };
  
  // Check for theme matches first
  for (const [theme, colors] of Object.entries(themeMap)) {
    if (lowerPrompt.includes(theme)) {
      // Adjust theme colors to match target length
      return adjustColorArrayLength(colors, targetLength);
    }
  }
  
  // Check for individual color keywords
  const foundColors: ColorRGB[] = [];
  for (const word of words) {
    if (colorMap[word]) {
      foundColors.push(colorMap[word]);
    }
  }
  
  // If we found colors, create variations to fill targetLength slots
  if (foundColors.length > 0) {
    const colors: ColorRGB[] = [];
    while (colors.length < targetLength) {
      for (const color of foundColors) {
        if (colors.length >= targetLength) break;
        
        // Create variations by adjusting brightness
        const variation = colors.length / targetLength;
        const factor = 0.7 + variation * 0.6; // Range from 0.7 to 1.3
        
        colors.push({
          r: Math.min(255, Math.max(0, Math.floor(color.r * factor))),
          g: Math.min(255, Math.max(0, Math.floor(color.g * factor))),
          b: Math.min(255, Math.max(0, Math.floor(color.b * factor))),
        });
      }
    }
    return colors;
  }
  
  // Mood-based color generation
  if (words.some(w => ['happy', 'joy', 'cheerful', 'bright', 'sunny'].includes(w))) {
    return adjustColorArrayLength([
      { r: 255, g: 230, b: 100 },
      { r: 255, g: 200, b: 150 },
      { r: 255, g: 150, b: 100 },
      { r: 255, g: 180, b: 200 },
      { r: 200, g: 150, b: 255 },
      { r: 150, g: 200, b: 255 },
    ], targetLength);
  }
  
  if (words.some(w => ['sad', 'melancholy', 'dark', 'moody', 'gloomy'].includes(w))) {
    return adjustColorArrayLength([
      { r: 50, g: 60, b: 80 },
      { r: 60, g: 70, b: 100 },
      { r: 70, g: 80, b: 120 },
      { r: 80, g: 90, b: 130 },
      { r: 100, g: 110, b: 150 },
      { r: 120, g: 130, b: 170 },
    ], targetLength);
  }
  
  if (words.some(w => ['calm', 'peaceful', 'serene', 'relaxing', 'zen'].includes(w))) {
    return adjustColorArrayLength([
      { r: 180, g: 220, b: 230 },
      { r: 200, g: 230, b: 235 },
      { r: 180, g: 230, b: 220 },
      { r: 200, g: 235, b: 225 },
      { r: 190, g: 225, b: 235 },
      { r: 210, g: 235, b: 230 },
    ], targetLength);
  }
  
  if (words.some(w => ['energetic', 'vibrant', 'bold', 'intense', 'powerful'].includes(w))) {
    return adjustColorArrayLength([
      { r: 255, g: 0, b: 100 },
      { r: 255, g: 100, b: 0 },
      { r: 255, g: 200, b: 0 },
      { r: 0, g: 255, b: 150 },
      { r: 0, g: 150, b: 255 },
      { r: 200, g: 0, b: 255 },
    ], targetLength);
  }
  
  // Default: Generate random vibrant colors
  return Array.from({ length: targetLength }, () => randomColor());
}
