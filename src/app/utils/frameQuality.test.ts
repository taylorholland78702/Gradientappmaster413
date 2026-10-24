import { describe, it, expect } from 'vitest';
import { isDullFrame, isDullPalette } from './frameQuality';

describe('isDullFrame', () => {
  it('rejects a flat field', () => {
    expect(isDullFrame({ mean: 130, sd: 3 }, 'noise')).toBe(true);
  });
  it('rejects near-black and near-white with no contrast', () => {
    expect(isDullFrame({ mean: 2, sd: 5 }, 'mesh')).toBe(true);
    expect(isDullFrame({ mean: 250, sd: 9 }, 'mesh')).toBe(true);
  });
  it('keeps a normal frame', () => {
    expect(isDullFrame({ mean: 130, sd: 40 }, 'mesh')).toBe(false);
  });
  it('keeps a mostly dark frame that has detail (an ASCII or halftone look)', () => {
    expect(isDullFrame({ mean: 5, sd: 18 }, 'mesh')).toBe(false);
  });
  it('lets dark-ground gradients be dark', () => {
    expect(isDullFrame({ mean: 4, sd: 10 }, 'embers')).toBe(false);
    expect(isDullFrame({ mean: 4, sd: 10 }, 'mesh')).toBe(true);
  });
  it('never judges sparse gradients', () => {
    expect(isDullFrame({ mean: 0.4, sd: 2 }, 'particles')).toBe(false);
    expect(isDullFrame({ mean: 0, sd: 0 }, 'attractor')).toBe(false);
  });
});

describe('isDullPalette', () => {
  const c = (v: number) => ({ r: v, g: v, b: v });
  it('rejects colors that are all the same brightness', () => {
    expect(isDullPalette([c(120), c(122), c(121)], 'mesh')).toBe(true);
  });
  it('rejects an all-black or all-white palette', () => {
    expect(isDullPalette([c(0), c(8)], 'mesh')).toBe(true);
    expect(isDullPalette([c(250), c(255)], 'mesh')).toBe(true);
  });
  it('keeps a palette with light and dark in it', () => {
    expect(isDullPalette([c(20), c(220)], 'mesh')).toBe(false);
  });
  it('allows a dark palette on dark-ground gradients, and ignores sparse ones', () => {
    expect(isDullPalette([c(0), c(30)], 'eclipse')).toBe(false);
    expect(isDullPalette([c(0), c(1)], 'particles')).toBe(false);
  });
});

describe('isDullPalette: pale palettes', () => {
  const rgb = (r: number, g: number, b: number) => ({ r, g, b });
  it('flags pastel palettes with almost no light-to-dark range', () => {
    expect(isDullPalette([rgb(250, 215, 235), rgb(240, 225, 250), rgb(245, 220, 225)], 'mesh')).toBe(true);
  });
  it('keeps pale palettes that still have contrast', () => {
    expect(isDullPalette([rgb(250, 235, 240), rgb(150, 110, 130)], 'mesh')).toBe(false);
  });
});
