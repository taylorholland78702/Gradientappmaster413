import { describe, it, expect } from 'vitest';
import { ShuffleHistory, pickWeighted } from './shuffleHistory';
import { chooseLook, chooseMood, rollCandidate, scaleRange, scoreLook, type RollOptions } from './shuffleScore';
import { EFFECT_AFFINITY, EFFECT_PAIRS, MOODS, gradientKind, moodById } from '../constants/shuffleTaste';
import { ALL_EFFECTS } from '../constants/effectRegistry';
import { FEELING_LUCKY_GRADIENT_TYPES, type EffectType, type GradientType } from '../constants/gradientEffects';
import { costOf } from '../constants/effectCost';

// A fixed-seed random source so the numbers below are repeatable.
const seeded = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };

const SHAPE_CHANGERS: EffectType[] = ['kaleidoscope', 'pixelate', 'triangulate', 'slit-scan', 'halftone', 'posterize', 'dither'];
const SPARSE = ['particles', 'attractor', 'fireworks', 'lightning', 'eclipse', 'light-beam', 'edge-glow', 'bokeh', 'embers'];
const ERASERS: EffectType[] = ['oil-paint', 'impasto', 'duotone', 'pixelate', 'slit-scan'];
const options = (budget = 12): RollOptions => ({
  gradientPool: FEELING_LUCKY_GRADIENT_TYPES,
  lightEffects: (ALL_EFFECTS as EffectType[]).filter(e => !SHAPE_CHANGERS.includes(e)),
  shapeChangers: SHAPE_CHANGERS.filter(e => (ALL_EFFECTS as EffectType[]).includes(e)),
  costOf,
  costBudget: budget,
  minEffects: 2,
  maxEffects: g => (SPARSE.includes(g) ? 2 : 5),
  excluded: g => (SPARSE.includes(g) ? ERASERS : []),
});

// What Shuffle did before: uniform gradient, effects drawn at random with no taste or memory.
function oldRoll(rng: () => number) {
  const o = options();
  const gradient = o.gradientPool[Math.floor(rng() * o.gradientPool.length)];
  const sparse = SPARSE.includes(gradient);
  const light = o.lightEffects.filter(e => !(sparse && ERASERS.includes(e))).sort(() => rng() - 0.5);
  const stack: EffectType[] = [];
  let spent = 0;
  if (rng() < 0.5) { const s = SHAPE_CHANGERS[Math.floor(rng() * SHAPE_CHANGERS.length)]; stack.push(s); spent += costOf(s); }
  for (const fx of light) { if (stack.length >= (sparse ? 2 : 5)) break; if (spent + costOf(fx) > 12) continue; stack.push(fx); spent += costOf(fx); }
  for (const fx of light) { if (stack.length >= 2) break; if (!stack.includes(fx)) stack.push(fx); }
  return { gradient, effects: stack };
}

const clashes = (effects: readonly EffectType[]) => EFFECT_PAIRS.filter(([a, b, d]) => d <= -2 && effects.includes(a) && effects.includes(b)).length;
const poorFit = (gradient: string, effects: readonly EffectType[]) => effects.filter(fx => (EFFECT_AFFINITY[gradientKind(gradient)][fx] ?? 0) <= -2).length;

describe('shuffle taste table', () => {
  it('only mentions real effects, and pairs name two different ones', () => {
    const real = new Set(ALL_EFFECTS as string[]);
    for (const kind of Object.values(EFFECT_AFFINITY)) for (const fx of Object.keys(kind)) expect(real.has(fx), fx).toBe(true);
    for (const [a, b] of EFFECT_PAIRS) { expect(real.has(a), a).toBe(true); expect(real.has(b), b).toBe(true); expect(a).not.toBe(b); }
    for (const m of MOODS) for (const fx of Object.keys(m.effectBias)) expect(real.has(fx), `${m.id}: ${fx}`).toBe(true);
  });

  it('favours ascii and halftone on pattern and dark-ground gradients (loved in the marking sessions), and no longer marks down emoji or kaleidoscope there', () => {
    for (const kind of ['pattern', 'dark-ground'] as const) {
      expect(EFFECT_AFFINITY[kind].ascii).toBeGreaterThanOrEqual(2);
      expect(EFFECT_AFFINITY[kind].halftone).toBeGreaterThanOrEqual(2);
      expect(EFFECT_AFFINITY[kind].emoji ?? 0).toBeGreaterThanOrEqual(0);
    }
    expect(EFFECT_AFFINITY.pattern.kaleidoscope ?? 0).toBeGreaterThanOrEqual(0);
  });
  it('puts every gradient in a kind, and sorts the obvious ones', () => {
    for (const g of FEELING_LUCKY_GRADIENT_TYPES) expect(['dark-ground', 'smooth', 'pattern', 'particles']).toContain(gradientKind(g));
    expect(gradientKind('eclipse')).toBe('dark-ground');
    expect(gradientKind('truchet')).toBe('pattern');
    expect(gradientKind('smoke')).toBe('smooth');
    expect(gradientKind('particles')).toBe('particles');
  });

  it('has moods with usable values', () => {
    for (const m of MOODS) {
      expect(m.speeds.length).toBeGreaterThan(0);
      expect(m.strength).toBeGreaterThanOrEqual(0); expect(m.strength).toBeLessThanOrEqual(1);
      expect(m.shape[0]).toBeLessThan(m.shape[1]);
      expect(m.maxEffects).toBeGreaterThanOrEqual(2);
    }
    expect(moodById('calm').id).toBe('calm');
  });
});

describe('history', () => {
  it('lowers the odds of what was just picked, and recovers with age', () => {
    const h = new ShuffleHistory();
    expect(h.weight('gradient', 'smoke')).toBe(1);
    h.record('gradient', 'smoke');
    expect(h.weight('gradient', 'smoke')).toBeCloseTo(0.1);
    for (const g of ['a', 'b', 'c', 'd']) h.record('gradient', g);
    expect(h.weight('gradient', 'smoke')).toBeGreaterThan(0.1);
    for (let i = 0; i < 10; i++) h.record('gradient', `x${i}`);
    expect(h.weight('gradient', 'smoke')).toBe(1);
  });

  it('picks by weight', () => {
    const rng = seeded(7);
    const counts = { a: 0, b: 0 };
    for (let i = 0; i < 2000; i++) counts[pickWeighted(['a', 'b'] as const, x => (x === 'a' ? 1 : 3), rng)]++;
    expect(counts.b / counts.a).toBeGreaterThan(2.4);
    expect(counts.b / counts.a).toBeLessThan(3.8);
    expect(pickWeighted(['only'], () => 0)).toBe('only');
  });
});

describe('rolling a look', () => {
  it('keeps to the stack limits: 2-5 effects, at most 2 and no content erasers on sparse gradients', () => {
    const rng = seeded(3);
    const h = new ShuffleHistory();
    for (let i = 0; i < 300; i++) {
      const c = rollCandidate(options(), moodById('bold'), h, rng);
      expect(c.effects.length).toBeGreaterThanOrEqual(2);
      expect(c.effects.length).toBeLessThanOrEqual(SPARSE.includes(c.gradient) ? 2 : 5);
      expect(new Set(c.effects).size).toBe(c.effects.length);
      if (SPARSE.includes(c.gradient)) for (const fx of c.effects) expect(ERASERS).not.toContain(fx);
      h.record('gradient', c.gradient);
    }
  });

  it('with a floor of 3 gives non-sparse gradients at least 3 effects and keeps sparse ones to 2', () => {
    const rng = seeded(11);
    for (let i = 0; i < 300; i++) {
      const c = rollCandidate({ ...options(40), minEffects: 3 }, moodById(MOODS[i % MOODS.length].id), new ShuffleHistory(), rng);
      expect(c.effects.length).toBeGreaterThanOrEqual(SPARSE.includes(c.gradient) ? 2 : 3);
      expect(c.effects.length).toBeLessThanOrEqual(SPARSE.includes(c.gradient) ? 2 : 5);
    }
  });
  it('scores a matched look above a clashing one', () => {
    const h = new ShuffleHistory();
    const calm = moodById('cinematic');
    const good = scoreLook('eclipse' as GradientType, ['bloom', 'grain', 'vignette'], calm, h);
    const bad = scoreLook('eclipse' as GradientType, ['duotone', 'halftone', 'dither'], calm, h);
    expect(good).toBeGreaterThan(bad + 4);
    expect(scoreLook('smoke' as GradientType, ['kaleidoscope', 'mirror'], calm, h)).toBeLessThan(scoreLook('smoke' as GradientType, ['kaleidoscope', 'grain'], calm, h));
  });

  it('scales a range by strength', () => {
    expect(scaleRange([10, 110], 0)).toEqual([10, 35]);
    expect(scaleRange([10, 110], 1)).toEqual([10, 110]);
  });
});

describe('shuffle before and after (400 seeded shuffles each)', () => {
  const N = 400;
  const run = (next: (rng: () => number, h: ShuffleHistory) => { gradient: GradientType; effects: EffectType[] }) => {
    const rng = seeded(2024);
    const h = new ShuffleHistory();
    const out: { gradient: GradientType; effects: EffectType[] }[] = [];
    for (let i = 0; i < N; i++) {
      const r = next(rng, h);
      out.push(r);
      h.record('gradient', r.gradient); h.record('effect', r.effects);
    }
    return out;
  };
  const stats = (rolls: { gradient: GradientType; effects: EffectType[] }[]) => {
    const repeats = rolls.filter((r, i) => i > 0 && r.gradient === rolls[i - 1].gradient).length / (N - 1);
    let distinct = 0, windows = 0;
    for (let i = 0; i + 10 <= N; i += 10) { distinct += new Set(rolls.slice(i, i + 10).map(r => r.gradient)).size; windows++; }
    const clash = rolls.filter(r => clashes(r.effects) > 0).length / N;
    const poor = rolls.reduce((a, r) => a + poorFit(r.gradient, r.effects), 0) / N;
    return { repeats, distinct: distinct / windows, clash, poor };
  };
  const before = stats(run((rng) => oldRoll(rng)));
  const after = stats(run((rng, h) => chooseLook(options(), chooseMood(h, rng), h, rng)));

  it('repeats the previous gradient less often', () => { console.info('before/after', JSON.stringify({ before, after })); expect(after.repeats).toBeLessThan(before.repeats / 2); });
  it('shows more different gradients in any ten shuffles', () => expect(after.distinct).toBeGreaterThan(before.distinct));
  it('pairs clashing effects far less often', () => expect(after.clash).toBeLessThan(before.clash / 2));
  it('puts fewer poorly matched effects on a gradient', () => expect(after.poor).toBeLessThan(before.poor / 2));
  it('does not collapse onto a few favourite effects, and still uses the heavy ones', () => {
    const rolls = run((rng, h) => chooseLook(options(), chooseMood(h, rng), h, rng));
    const counts: Record<string, number> = {};
    let total = 0;
    for (const r of rolls) for (const e of r.effects) { counts[e] = (counts[e] ?? 0) + 1; total++; }
    const top3 = Object.values(counts).sort((a, b) => b - a).slice(0, 3).reduce((a, b) => a + b, 0) / total;
    expect(top3).toBeLessThan(0.3);
    const withShapeChanger = rolls.filter(r => r.effects.some(e => SHAPE_CHANGERS.includes(e))).length / rolls.length;
    expect(withShapeChanger).toBeGreaterThan(0.2);
  });

  it('still reaches every gradient and every effect', () => {
    const rolls = run((rng, h) => chooseLook(options(), chooseMood(h, rng), h, rng));
    expect(new Set(rolls.map(r => r.gradient)).size).toBeGreaterThan(FEELING_LUCKY_GRADIENT_TYPES.length * 0.9);
    const seen = new Set(rolls.flatMap(r => r.effects));
    const missing = (ALL_EFFECTS as EffectType[]).filter(e => !seen.has(e));
    expect(missing).toEqual([]);
  });
});
