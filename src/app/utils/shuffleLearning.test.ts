import { describe, it, expect, vi, afterEach } from 'vitest';
import { ShuffleLearning, type ShuffleMeta } from './shuffleLearning';
import { chooseMood, rollCandidate, type RollOptions } from './shuffleScore';
import { ShuffleHistory } from './shuffleHistory';
import { getShuffleMood, setShuffleMood } from './shuffleMood';
import { moodById } from '../constants/shuffleTaste';
import { ALL_EFFECTS } from '../constants/effectRegistry';
import { FEELING_LUCKY_GRADIENT_TYPES, type EffectType } from '../constants/gradientEffects';
import { costOf } from '../constants/effectCost';

const memory = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); } }; };
const meta = (over: Partial<ShuffleMeta> = {}): ShuffleMeta => ({ gradient: 'smoke', effects: ['bloom', 'grain'], mood: 'calm', palette: 'Ink', ...over });
const seeded = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
afterEach(() => { vi.useRealTimers(); });

describe('what Shuffle learns', () => {
  it('leaves the odds alone until there is enough to go on', () => {
    const l = new ShuffleLearning(memory());
    l.begin(meta()); l.commit(); l.reject();
    expect(l.weight('gradient', 'smoke')).toBe(1);
  });

  it('favours what is kept and avoids what is undone, within 0.5x to 2x', () => {
    const l = new ShuffleLearning(memory());
    for (let i = 0; i < 12; i++) { l.begin(meta({ gradient: 'smoke', effects: ['bloom'] })); l.commit(); l.like(1); }
    for (let i = 0; i < 12; i++) { l.begin(meta({ gradient: 'grid', effects: ['halftone'] })); l.commit(); l.reject(); }
    expect(l.weight('gradient', 'smoke')).toBeGreaterThan(1.3);
    expect(l.weight('effect', 'bloom')).toBeGreaterThan(1.3);
    expect(l.weight('gradient', 'grid')).toBeLessThan(0.75);
    expect(l.weight('effect', 'halftone')).toBeLessThan(0.75);
    for (let i = 0; i < 100; i++) { l.begin(meta({ gradient: 'smoke' })); l.commit(); l.like(1); }
    expect(l.weight('gradient', 'smoke')).toBeLessThanOrEqual(2);
    expect(l.weight('gradient', 'never-seen')).toBe(1);
  });

  it('counts an undo only soon after the shuffle, and only once', () => {
    vi.useFakeTimers();
    let t = 1_000_000;
    const l = new ShuffleLearning(memory(), () => t);
    l.begin(meta()); l.commit();
    t += 60_000;
    l.reject();
    expect(l.signals).toBe(0);
    l.begin(meta()); l.commit();
    t += 5_000;
    l.reject(); l.reject();
    expect(l.signals).toBe(1);
  });

  it('takes leaving a look alone as a mild vote for it, but not while Auto Shuffle runs', () => {
    vi.useFakeTimers();
    const l = new ShuffleLearning(memory());
    l.begin(meta()); l.commit();
    vi.advanceTimersByTime(30_000);
    expect(l.signals).toBe(1);
    l.paused = true;
    l.begin(meta()); l.commit();
    vi.advanceTimersByTime(30_000);
    expect(l.signals).toBe(1);
  });

  it('judges the look that stayed on screen, not the last one tried', () => {
    const l = new ShuffleLearning(memory());
    for (let i = 0; i < 8; i++) {
      l.begin(meta({ gradient: 'smoke' })); l.begin(meta({ gradient: 'grid' })); l.begin(meta({ gradient: 'noise' }));
      l.commit(1); l.like(1);
    }
    expect(l.weight('gradient', 'grid')).toBeGreaterThan(1.3);
    expect(l.weight('gradient', 'smoke')).toBeLessThanOrEqual(1);
    expect(l.weight('gradient', 'noise')).toBeLessThanOrEqual(1);
  });

  it('is remembered between visits, and can be cleared', () => {
    const store = memory();
    const a = new ShuffleLearning(store);
    for (let i = 0; i < 10; i++) { a.begin(meta()); a.commit(); a.like(1); }
    const b = new ShuffleLearning(store);
    expect(b.weight('gradient', 'smoke')).toBeCloseTo(a.weight('gradient', 'smoke'));
    b.clear();
    expect(new ShuffleLearning(store).weight('gradient', 'smoke')).toBe(1);
  });

  it('survives corrupt stored data', () => {
    const store = memory(); store.setItem('wavShuffleTaste', '{not json');
    expect(new ShuffleLearning(store).weight('gradient', 'smoke')).toBe(1);
  });
});

describe('using what was learned', () => {
  const opts = (learned?: RollOptions['learned']): RollOptions => ({
    gradientPool: FEELING_LUCKY_GRADIENT_TYPES,
    lightEffects: (ALL_EFFECTS as EffectType[]).filter(e => !['kaleidoscope', 'pixelate', 'triangulate', 'slit-scan', 'halftone', 'posterize', 'dither'].includes(e)),
    shapeChangers: [], costOf, costBudget: 12, minEffects: 2, maxEffects: () => 5, excluded: () => [], learned,
  });
  const share = (learned: RollOptions['learned']) => {
    const rng = seeded(11); const h = new ShuffleHistory(); let withBloom = 0;
    for (let i = 0; i < 600; i++) { const c = rollCandidate(opts(learned), moodById('cinematic'), h, rng); if (c.effects.includes('bloom')) withBloom++; }
    return withBloom / 600;
  };
  it('picks a disliked effect less and a liked one more', () => {
    const neutral = share(undefined);
    expect(share((k, id) => (k === 'effect' && id === 'bloom' ? 0.5 : 1))).toBeLessThan(neutral);
    expect(share((k, id) => (k === 'effect' && id === 'bloom' ? 2 : 1))).toBeGreaterThan(neutral);
  });
});

describe('holding a mood', () => {
  it('uses the chosen mood every time, and any mood otherwise', () => {
    const h = new ShuffleHistory();
    for (let i = 0; i < 20; i++) expect(chooseMood(h, Math.random, 'bold').id).toBe('bold');
    const seen = new Set(Array.from({ length: 60 }, () => chooseMood(h, Math.random, 'any').id));
    expect(seen.size).toBeGreaterThan(3);
  });
  it('is remembered and refuses nonsense', () => {
    expect(getShuffleMood()).toBe('any');
    setShuffleMood('glitchy');
    expect(getShuffleMood()).toBe('glitchy');
    setShuffleMood('nonsense' as never);
    expect(getShuffleMood()).toBe('glitchy');
    expect(localStorage.getItem('wavShuffleMood')).toBe('glitchy');
    setShuffleMood('any');
  });
});
