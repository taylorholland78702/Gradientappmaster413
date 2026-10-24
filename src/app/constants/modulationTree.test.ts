import { describe, it, expect } from 'vitest';
import canvasDrawTypesSource from '../hooks/canvasDrawTypes.ts?raw';
import interactiveGradientSource from '../components/InteractiveGradient.tsx?raw';
import { MODULATABLE_PARAMS, MODULATION_GAIN, resolveModulationKey } from './modulatableParams';
import { MOD_SOURCES, paramGroups, bindingLabel, groupedSources, sourcesOf, shortLabel } from './modulationTree';
import { modCategoriesFor } from './gradientModCategories';
import { EFFECT_MOD_CATEGORY } from './effectRegistry';
import { FULL_GRADIENT_TYPES } from './gradientEffects';
import { STYLE_SHAPE_CONTROLS } from './styleShapeControls';
import { LIVE_SPEED_KEYS, liveSpeed, publishLiveSpeeds } from './liveSpeeds';
import { applyAudioBindings } from '../hooks/useCanvasDraw';

// Fireworks and Lightning still have settings here, but neither gradient is in the Gradient tab's list any more.
const HIDDEN = new Set(['fireworksCount', 'fireworksParticleCount', 'fireworksTrailFade', 'lightningBoltCount', 'lightningJitter', 'lightningBranchiness']);

describe('audio modulation picker tree', () => {
  it('reaches every setting through some gradient or effect', () => {
    const reachable = new Set(MOD_SOURCES.flatMap(s => paramGroups(s).flatMap(g => g.params.map(p => p.param.key))));
    expect(MODULATABLE_PARAMS.map(p => p.key).filter(k => !reachable.has(k) && !HIDDEN.has(k))).toEqual([]);
  });

  it('lists every gradient', () => {
    const ids = new Set(sourcesOf('gradient').map(s => s.id));
    expect(FULL_GRADIENT_TYPES.filter(g => !ids.has(g))).toEqual([]);
  });

  it('groups merged gradients under their family', () => {
    const waves = groupedSources('gradient').find(g => g.group === 'Waves');
    expect(waves?.sources.map(s => s.id)).toEqual(['bands', 'ribbon', 'waves']);
    const glass = groupedSources('gradient').find(g => g.group === 'Glass');
    expect(glass?.sources.map(s => s.id).sort()).toEqual(['glass', 'mercury']);
  });

  it('gives every bound setting its own name, and tells Grid apart from the Grid effect', () => {
    const names = MODULATABLE_PARAMS.filter(p => !HIDDEN.has(p.key)).map(p => bindingLabel(p.key));
    const dupes = names.filter((n, i) => names.indexOf(n) !== i);
    expect(dupes).toEqual([]);
    expect(bindingLabel('gridSides')).toBe('Grid (effect) · Sides');
    expect(bindingLabel('gridColumns')).toBe('Grid (gradient + effect) · Columns');
    expect(bindingLabel('waveDistortionStrength')).toBe('Wave · Distortion Strength');
    expect(bindingLabel('wavesSpeed')).toBe('Waves · Speed');
    expect(bindingLabel('fieldSwirl')).toBe('All styled gradients · Swirl');
    expect(bindingLabel('marksCount')).toBe('Particles · Marks mode: Count');
    expect(bindingLabel('helixTightness')).toBe('Windmill · Helix mode: Tightness');
  });

  it('shortens a name by the parent already shown above it', () => {
    const p = (label: string) => ({ key: 'x', label, category: 'c', min: 0, max: 1 });
    expect(shortLabel(p('Grid Effect Sides'), 'Grid Effect')).toBe('Sides');
    expect(shortLabel(p('Reaction Diffusion Feed'), 'Reaction-Diffusion')).toBe('Feed');
    expect(shortLabel(p('Julia Zoom'), 'Julia Set')).toBe('Zoom');
    expect(shortLabel(p('Scale'), 'Scale')).toBe('Scale');
  });
});

describe('shuffle can bind every advanced audio setting', () => {
  it('has a gradient or effect whose shuffle pool contains each one', () => {
    const covered = new Set<string>();
    const cats: Set<string>[] = [
      ...FULL_GRADIENT_TYPES.map(g => modCategoriesFor(g, [], EFFECT_MOD_CATEGORY)),
      ...Object.keys(EFFECT_MOD_CATEGORY).map(e => modCategoriesFor(null, [e], EFFECT_MOD_CATEGORY)),
    ];
    for (const p of MODULATABLE_PARAMS) if (cats.some(c => c.has(p.category))) covered.add(p.key);
    expect(MODULATABLE_PARAMS.map(p => p.key).filter(k => !covered.has(k) && !HIDDEN.has(k))).toEqual([]);
  });
});

describe('clock-driven speeds follow audio bindings', () => {
  it('lists only settings that can be bound and that the draw context carries', () => {
    const bindable = new Set(MODULATABLE_PARAMS.map(p => resolveModulationKey(p.key)));
    for (const key of LIVE_SPEED_KEYS) {
      expect(bindable.has(key), `${key} is not a bindable setting`).toBe(true);
      expect(canvasDrawTypesSource, `${key} missing from CanvasDrawParams`).toMatch(new RegExp(`^ {2}${key}: number;`, 'm'));
    }
  });

  it('an audio binding on a clocked Speed reaches the clock, and without one the saved slider is used', () => {
    const live: Record<string, number> = {};
    const ctx = { noiseSpeed: 1, marbleSpeed: 1 };
    applyAudioBindings(ctx, [{ param: 'noiseSpeed', band: 'mids', amount: 2 }], { sub: 0, mids: 0.5, treble: 0, energy: 0 });
    publishLiveSpeeds(live, ctx);
    expect(liveSpeed(live, 'noiseSpeed', 1)).toBe(2);
    expect(liveSpeed(live, 'marbleSpeed', 1)).toBe(1);
  });

  it('uses the live value when there is one, never goes negative, and falls back to the saved slider', () => {
    expect(liveSpeed({ noiseSpeed: 2.5 }, 'noiseSpeed', 1)).toBe(2.5);
    expect(liveSpeed({ noiseSpeed: -3 }, 'noiseSpeed', 1)).toBe(0);
    expect(liveSpeed({}, 'noiseSpeed', 1.5)).toBe(1.5);
    expect(liveSpeed(undefined, 'noiseSpeed', 0.4)).toBe(0.4);
  });
});

describe('every bindable setting reaches the draw', () => {
  // A binding only changes a setting the draw context already carries, so each one has to be handed to useCanvasDraw.
  const handedToDraw = (() => {
    const start = interactiveGradientSource.indexOf('useCanvasDraw({');
    let depth = 0, end = start;
    for (let i = interactiveGradientSource.indexOf('(', start); i < interactiveGradientSource.length; i++) {
      if (interactiveGradientSource[i] === '(') depth++;
      else if (interactiveGradientSource[i] === ')' && --depth === 0) { end = i; break; }
    }
    const memoStart = interactiveGradientSource.indexOf('const drawParams = useMemo(');
    const text = interactiveGradientSource.slice(start, end) + interactiveGradientSource.slice(memoStart, interactiveGradientSource.indexOf('}), [', memoStart));
    return new Set(text.match(/\b\w+\b/g));
  })();
  // Put together inside useCanvasDraw from a larger object.
  const VIRTUAL = new Set(['fieldGradeBrightness', 'fieldGradeContrast', 'fieldGradeSaturation']);

  it('is passed to useCanvasDraw', () => {
    const missing = MODULATABLE_PARAMS.map(p => resolveModulationKey(p.key)).filter(k => !handedToDraw.has(k) && !VIRTUAL.has(k));
    expect(missing).toEqual([]);
  });

  it('scales wide-range settings so one Amount feels alike across them', () => {
    expect(MODULATION_GAIN.paletteHue).toBeGreaterThan(1);
    expect(MODULATION_GAIN.noiseScale).toBeUndefined();
  });

  it('names the two shape sliders of a styled gradient after that gradient', () => {
    const smoke = MOD_SOURCES.find(s => s.id === 'smoke')!;
    const labels = paramGroups(smoke).flatMap(g => g.params.map(p => p.label));
    expect(labels).toEqual(expect.arrayContaining([STYLE_SHAPE_CONTROLS.smoke[0].label, STYLE_SHAPE_CONTROLS.smoke[1].label, 'Swirl']));
  });

  it('offers the palette, palette mapping and finishing settings under Global', () => {
    expect(sourcesOf('global').map(s => s.label).sort()).toEqual(['Finishing', 'Palette', 'Palette Mapping']);
    expect(bindingLabel('paletteHue')).toBe('Palette · Hue');
    expect(bindingLabel('fieldExposure')).toBe('Finishing · Exposure');
  });
});
