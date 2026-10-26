import { describe, it, expect } from 'vitest';
import snapshotTypesSource from '../hooks/snapshotTypes.ts?raw';
import { compactLook, expandLook, readShareParam, shareParam } from './shareLink';
import { SHARE_DEFAULTS_V1 } from '../constants/shareDefaults';
import { isClassified } from '../constants/shareRelevance';
import { STYLE_FIELD_GRADIENT_TYPES } from '../constants/gradientEffects';
import { MODULATABLE_PARAMS_BY_CATEGORY } from '../constants/modulatableParams';
import { EFFECT_MOD_CATEGORY } from '../constants/effectRegistry';
import { GRADIENT_MOD_CATEGORY, GLOBAL_CATEGORIES } from '../constants/gradientModCategories';
import { encodePresetData } from './presetShare';
import { deflateSync } from 'fflate';
import sharedSnapshot from './__fixtures__/sharedSnapshot.json';

const snapshotKeys = (): string[] => {
  const src = snapshotTypesSource;
  const body = src.slice(src.indexOf('export interface SnapshotValues'), src.indexOf('\n}\n', src.indexOf('export interface SnapshotValues')));
  return [...body.matchAll(/^ {2}(\w+)\??:/gm)].map(m => m[1]);
};

describe('share link settings table', () => {
  it('knows every saved setting', () => {
    const unknown = snapshotKeys().filter(k => !(k in SHARE_DEFAULTS_V1) && !isClassified(k));
    expect(unknown).toEqual([]);
  });
});

describe('effect speeds in share links', () => {
  it('carries a speed set on an active effect, and leaves out the default or an inactive effect', () => {
    const look = { gradientType: 'angle', activeEffects: ['crt', 'dither'], crtSpeed: 2.5, ditherSpeed: 1, liquidSpeed: 3, slitScanSpeed: 2 } as never;
    const back = expandLook(readShareParam(shareParam(look)) as never) as Record<string, unknown>;
    expect(back.crtSpeed).toBe(2.5);
    expect(back.ditherSpeed ?? 1).toBe(1);
    expect(back.liquidSpeed ?? 1).toBe(1);
  });
});

const sample = sharedSnapshot as Record<string, unknown>;

describe('share link format', () => {
  it('turns the 9 KB link from a real look into one under 1,500 characters', () => {
    const old = encodePresetData(sample);
    const short = shareParam(sample);
    expect(old.length).toBeGreaterThan(9000);
    expect(short.length).toBeLessThan(1500);
    expect(short.startsWith('~')).toBe(true);
  });

  it('keeps what shows the look and drops the rest', () => {
    const c = compactLook(sample);
    expect(c.gradientType).toBe('grid');
    expect(c.activeEffects).toEqual(['mirror', 'bloom', 'shift']);
    // Julia and Halftone values cannot change a Grid look with Mirror, Bloom and Shift.
    expect('juliaReal' in c || 'halftoneCMYK' in c || 'juliaIterations' in c).toBe(false);
    expect(Object.keys(c).some(k => k.endsWith('AnimTime'))).toBe(false);
    for (const color of c.gradientColors as string[]) expect(color).toMatch(/^[0-9a-f]{6}$/);
  });

  it('round-trips: opening the short link gives the same look settings', () => {
    const back = readShareParam(shareParam(sample)) as Record<string, unknown>;
    const c = compactLook(sample);
    for (const key of Object.keys(c)) {
      if (key === 'gradientColors' || key === 'targetColors' || key === 'baseAIColors') continue;
      expect(back[key]).toEqual(c[key]);
    }
    const rgb = (list: unknown) => (list as Array<{ r: number; g: number; b: number }>).map(x => [Math.round(x.r), Math.round(x.g), Math.round(x.b)]);
    expect(rgb(back.gradientColors)).toEqual(rgb(sample.gradientColors));
  });

  it('opens a setting that was left out as its default', () => {
    const back = readShareParam(shareParam({ gradientType: 'noise', activeEffects: [], gradientColors: [{ r: 1, g: 2, b: 3 }, { r: 4, g: 5, b: 6 }] })) as Record<string, unknown>;
    expect(back.noiseSpeed).toBe(SHARE_DEFAULTS_V1.noiseSpeed);
    expect(back.gradientType).toBe('noise');
  });

  it('keeps the settings of the gradient and effects in use, even at non-default values', () => {
    const back = readShareParam(shareParam({ gradientType: 'noise', noiseSpeed: 2.5, juliaZoom: 3, activeEffects: ['grain'], grainIntensity: 0.9, gradientColors: [{ r: 1, g: 2, b: 3 }] })) as Record<string, unknown>;
    expect(back.noiseSpeed).toBe(2.5);
    expect(back.grainIntensity).toBe(0.9);
    expect(compactLook({ gradientType: 'noise', juliaZoom: 3 }).juliaZoom).toBeUndefined();
  });

  it('keeps Swirl for every styled gradient, and drops it elsewhere', () => {
    for (const id of STYLE_FIELD_GRADIENT_TYPES) {
      expect(compactLook({ gradientType: id, fieldSwirl: 1.5, gradientColors: [{ r: 1, g: 2, b: 3 }] }).fieldSwirl, id).toBe(1.5);
    }
    expect(compactLook({ gradientType: 'angle', fieldSwirl: 1.5 }).fieldSwirl).toBeUndefined();
  });

  it('every audio-modulation category belongs to a gradient or an effect, so its settings are carried when that one is in use', () => {
    const owned = new Set<string>([...Object.values(GRADIENT_MOD_CATEGORY).flat(), ...Object.values(EFFECT_MOD_CATEGORY).flat(), ...GLOBAL_CATEGORIES, 'Styled gradients']);
    expect(MODULATABLE_PARAMS_BY_CATEGORY.map(g => g.category).filter(c => !owned.has(c))).toEqual([]);
  });

  it('still opens the old long links', () => {
    const back = readShareParam(encodePresetData(sample)) as Record<string, unknown>;
    expect(back).toEqual(sample);
  });

  it('keeps unicode (emoji effect characters) intact', () => {
    const back = readShareParam(shareParam({ gradientType: 'angle', activeEffects: ['emoji'], emojiChars: '🔥✨', gradientColors: [{ r: 1, g: 2, b: 3 }] })) as Record<string, unknown>;
    expect(back.emojiChars).toBe('🔥✨');
  });

  it('refuses things that are not a look', () => {
    expect(() => readShareParam('')).toThrow();
    expect(() => readShareParam('~' + 'A'.repeat(50))).toThrow();
    expect(() => readShareParam('~' + 'x'.repeat(25000))).toThrow();
    expect(() => readShareParam(shareParam({}).replace(/.$/, '!'))).toThrow();
  });

  it('refuses a small link that would inflate to something huge', () => {
    const bomb = '~' + btoa(String.fromCharCode(...deflateSync(new Uint8Array(5_000_000).fill(32), { level: 9 }))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(bomb.length).toBeLessThan(20000);
    expect(() => readShareParam(bomb)).toThrow();
  });

  it('expandLook ignores colors that are not 6-digit hex', () => {
    const out = expandLook({ gradientColors: ['ff0000', 'nonsense', '#00ff00'] }) as { gradientColors: unknown };
    expect(out.gradientColors).toEqual([{ r: 255, g: 0, b: 0 }, { r: 0, g: 255, b: 0 }]);
  });
});
