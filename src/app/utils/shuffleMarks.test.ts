import { describe, it, expect } from 'vitest';
import { ShuffleMarks, auc, summarize, type Mark, type PendingLook } from './shuffleMarks';
import { shuffleLearning } from './shuffleLearning';

const memory = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); }, removeItem: (k: string) => { m.delete(k); } }; };
const features = (over = {}) => ({ mean: 120, sd: 40, colourfulness: 0.4, detail: 0.03, entropy: 0.7, lit: 0.9, ...over });
const look = (score: number, over: Partial<PendingLook> = {}): PendingLook => ({ meta: { gradient: 'smoke', effects: ['bloom', 'grain'], mood: 'calm', palette: 'Ink' }, score, dull: false, features: features(), ...over });
const mark = (verdict: 'keep' | 'skip', score: number, over: Partial<PendingLook> = {}, at = 1): Mark => ({ ...look(score, over), verdict, at });

describe('score agreement', () => {
  it('is 1 when every keep scored above every skip, 0.5 for no signal, 0 when reversed', () => {
    const marks = [mark('keep', 0.9), mark('keep', 0.8), mark('keep', 0.7), mark('skip', 0.3), mark('skip', 0.2), mark('skip', 0.1)];
    expect(auc(marks)).toBe(1);
    expect(auc(marks.map(m => ({ ...m, verdict: m.verdict === 'keep' ? 'skip' as const : 'keep' as const })))).toBe(0);
    expect(auc(marks.map(m => ({ ...m, score: 0.5 })))).toBe(0.5);
  });
  it('is null until there are three of each', () => {
    expect(auc([mark('keep', 0.9), mark('skip', 0.1)])).toBeNull();
  });
});

describe('summary', () => {
  const marks: Mark[] = [
    ...Array.from({ length: 4 }, (_, i) => mark('keep', 0.7 + i * 0.05, { meta: { gradient: 'smoke', effects: ['bloom'], mood: 'calm' }, features: features({ sd: 60 }) })),
    ...Array.from({ length: 4 }, (_, i) => mark('skip', 0.3 + i * 0.05, { meta: { gradient: 'grid', effects: ['halftone'], mood: 'glitchy' }, features: features({ sd: 20 }) })),
  ];
  const s = summarize(marks);
  it('counts and rates', () => { expect(s.total).toBe(8); expect(s.kept).toBe(4); expect(s.keepRate).toBe(0.5); });
  it('finds the threshold that sorts them', () => { expect(s.bestThreshold?.accuracy).toBe(1); expect(s.bestThreshold!.threshold).toBeGreaterThan(0.45); expect(s.bestThreshold!.threshold).toBeLessThanOrEqual(0.7); });
  it('rates gradients, effects and moods by how often they were kept', () => {
    expect(s.gradients.find(r => r.id === 'smoke')?.rate).toBe(1);
    expect(s.gradients.find(r => r.id === 'grid')?.rate).toBe(0);
    expect(s.effects.find(r => r.id === 'halftone')?.rate).toBe(0);
    expect(s.moods.find(r => r.id === 'glitchy')?.kept).toBe(0);
  });
  it('names the measurement that separates keeps from skips', () => { expect(s.features[0].name).toBe('sd'); expect(s.features[0].effect).toBeGreaterThan(1); });
  it('copes with nothing', () => { expect(summarize([]).total).toBe(0); expect(summarize([]).scoreAuc).toBeNull(); });
});

describe('a marking session', () => {
  it('starts, takes marks only for a look that is ready, and stores them', () => {
    const store = memory();
    const t = { now: 1000 };
    const m = new ShuffleMarks(store, () => t.now);
    expect(m.active).toBe(false);
    m.start(3);
    expect(m.active).toBe(true);
    expect(m.mark('keep')).toBeNull();                   // nothing ready yet
    m.setCurrent(look(0.8)); t.now += 10;
    expect(m.mark('keep')?.verdict).toBe('keep');
    expect(m.mark('skip')).toBeNull();                   // already marked
    m.setCurrent(look(0.2)); t.now += 10; m.mark('skip');
    expect(m.sessionMarks).toHaveLength(2);
    expect(new ShuffleMarks(store).allMarks).toHaveLength(2);
  });

  it('keeps marks from earlier sessions out of this one', () => {
    const store = memory();
    const t = { now: 1000 };
    const a = new ShuffleMarks(store, () => t.now);
    a.start(); a.setCurrent(look(0.5)); a.mark('keep'); a.stop();
    t.now += 5000;
    a.start();
    expect(a.sessionMarks).toHaveLength(0);
    expect(a.allMarks).toHaveLength(1);
  });

  it('teaches the learner with each mark', () => {
    const before = shuffleLearning.signals;
    const m = new ShuffleMarks(memory());
    shuffleLearning.begin({ gradient: 'smoke', effects: ['bloom'], mood: 'calm' }); shuffleLearning.commit();
    m.start(); m.setCurrent(look(0.5)); m.mark('skip');
    expect(shuffleLearning.signals).toBe(before + 1);
    shuffleLearning.clear();
  });

  it('exports the summary and every mark as JSON', () => {
    const m = new ShuffleMarks(memory());
    m.start(); m.setCurrent(look(0.6)); m.mark('keep');
    const out = JSON.parse(m.export());
    expect(out.app).toBe('wav-shuffle-marks');
    expect(out.marks).toHaveLength(1);
    expect(out.marks[0].features.sd).toBe(40);
    expect(out.summary.kept).toBe(1);
  });

  it('can be cleared, and survives corrupt storage', () => {
    const store = memory();
    const m = new ShuffleMarks(store);
    m.start(); m.setCurrent(look(0.6)); m.mark('keep'); m.clear();
    expect(new ShuffleMarks(store).allMarks).toHaveLength(0);
    store.setItem('wavShuffleMarks', '{broken');
    expect(new ShuffleMarks(store).allMarks).toHaveLength(0);
    store.setItem('wavShuffleMarks', JSON.stringify([{ verdict: 'maybe' }, null, 3]));
    expect(new ShuffleMarks(store).allMarks).toHaveLength(0);
  });
});

describe('dislikes', () => {
  const l = look(0.4);
  it('are recorded with the frame measurements, kept, exported and cleared', () => {
    const store = memory();
    const marks = new ShuffleMarks(store, () => 5);
    marks.setLatest(l);
    marks.recordDislike(l.meta);
    marks.recordDislike({ gradient: 'grid', effects: [], mood: 'bold' });
    expect(marks.allDislikes.map(d => d.score)).toEqual([0.4, undefined]);
    expect(new ShuffleMarks(store).allDislikes).toHaveLength(2);
    expect(JSON.parse(marks.export()).dislikes).toHaveLength(2);
    marks.clear();
    expect(marks.allDislikes).toHaveLength(0);
    expect(new ShuffleMarks(store).allDislikes).toHaveLength(0);
  });
  it('are all exported, including ones from before the marking session', () => {
    let t = 1;
    const marks = new ShuffleMarks(memory(), () => t);
    marks.recordDislike(l.meta);
    t = 100; marks.start(); marks.setCurrent(l); marks.mark('keep');
    t = 200; marks.recordDislike(l.meta);
    const out = JSON.parse(marks.export());
    expect(out.marks).toHaveLength(1);
    expect(out.dislikes.map((d: { at: number }) => d.at)).toEqual([1, 200]);
  });
  it('leave the keep/skip summary alone', () => {
    const marks = new ShuffleMarks(memory());
    marks.recordDislike(l.meta);
    expect(JSON.parse(marks.export()).summary.total).toBe(0);
  });
});
