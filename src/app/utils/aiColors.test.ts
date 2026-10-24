import { describe, it, expect } from 'vitest';
import { generateAIColors } from './aiColors';
import type { ColorRGB } from '../constants/gradientEffects';

const fit = (colors: ColorRGB[], n: number) => Array.from({ length: n }, (_, i) => colors[i % colors.length]);
const random = () => ({ r: 1, g: 2, b: 3 });

describe('generateAIColors', () => {
  it('returns exactly targetLength colors', () => {
    for (const prompt of ['red', 'warm sunset', 'energetic', 'zzzz nothing']) {
      expect(generateAIColors(prompt, 5, fit, random)).toHaveLength(5);
    }
  });
  it('falls back to random colors for an unrecognised prompt', () => {
    expect(generateAIColors('qwxzy', 3, fit, random)).toEqual([random(), random(), random()]);
  });
  it('is case-insensitive', () => {
    expect(generateAIColors('RED', 4, fit, random)).toEqual(generateAIColors('red', 4, fit, random));
  });
});
