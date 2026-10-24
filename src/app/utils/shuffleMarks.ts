import type { FrameFeatures } from './frameScore';
import { contrastBucket, lightnessBucket, saturationBucket, speedBucket, type PaletteStats } from './paletteStats';
import { shuffleLearning, type ShuffleMeta } from './shuffleLearning';

// The marking tool's data: a session where you shuffle, mark each look Keep or Skip, and Shuffle gets calibrated
// against your taste. Each mark stores what the look was made of and what the frame score thought of it. The marks also
// teach the shuffle's learner straight away. Stored in this browser; "Copy results" gives the numbers.

// 'love' is a keep that you would pick out of the others: it counts as a keep everywhere and as a stronger vote for the learner.
export type Verdict = 'keep' | 'skip' | 'love';
const isKept = (m: { verdict: Verdict }) => m.verdict !== 'skip';
const LOVE_WEIGHT = 2;
// `speed` (playback speed) and `palette` (how the colours read) were added later, so older marks do not have them.
export interface PendingLook { meta: ShuffleMeta; score: number; dull: boolean; features: FrameFeatures; speed?: number; palette?: PaletteStats }
// A look disliked with the dislike button, outside a marking session. The frame measurements are there when the
// quality gate measured the look.
export interface Dislike { meta: ShuffleMeta; score?: number; dull?: boolean; features?: FrameFeatures; speed?: number; palette?: PaletteStats; at: number }
export interface Mark extends PendingLook { verdict: Verdict; at: number }

const KEY = 'wavShuffleMarks';
const DISLIKE_KEY = 'wavShuffleDislikes';
const MAX_MARKS = 300;
const MAX_DISLIKES = 200;
export const DEFAULT_TARGET = 30;

// Probability that a randomly chosen kept look scored higher than a randomly chosen skipped one: 0.5 is no
// better than chance, 1 is a perfect ranking. Null until both kinds have at least three marks.
export function auc(marks: readonly Mark[]): number | null {
  return aucOf(marks.filter(isKept), marks.filter(m => !isKept(m)));
}

function aucOf(better: readonly Mark[], worse: readonly Mark[]): number | null {
  if (better.length < 3 || worse.length < 3) return null;
  let wins = 0;
  for (const k of better) for (const s of worse) wins += k.score > s.score ? 1 : k.score === s.score ? 0.5 : 0;
  return wins / (better.length * worse.length);
}

export interface RateRow { id: string; kept: number; loved: number; total: number; rate: number }

function rates(marks: readonly Mark[], idsOf: (m: Mark) => readonly string[], minTotal: number): RateRow[] {
  const table = new Map<string, { kept: number; loved: number; total: number }>();
  for (const m of marks) for (const id of new Set(idsOf(m))) {
    const row = table.get(id) ?? { kept: 0, loved: 0, total: 0 };
    row.total++; if (isKept(m)) row.kept++; if (m.verdict === 'love') row.loved++;
    table.set(id, row);
  }
  return [...table].filter(([, r]) => r.total >= minTotal).map(([id, r]) => ({ id, ...r, rate: r.kept / r.total }));
}

const FEATURE_KEYS: (keyof FrameFeatures)[] = ['mean', 'sd', 'colourfulness', 'detail', 'entropy', 'lit'];

export interface MarkSummary {
  total: number; kept: number; skipped: number;
  keepRate: number;
  scoreAuc: number | null;
  // The score threshold that would have sorted these marks most accurately, with how many it would get right.
  bestThreshold: { threshold: number; accuracy: number } | null;
  gradients: RateRow[]; effects: RateRow[]; moods: RateRow[];
  // How often looks were kept by playback speed and by how the palette read (only marks that recorded them).
  speeds: RateRow[]; palettes: RateRow[];
  // Which frame measurements differ most between kept and skipped looks (difference of means over the pooled spread).
  features: { name: string; keptMean: number; skippedMean: number; effect: number }[];
  // The looks marked Love against all the rest: how many, whether the score put them on top, and what set them apart.
  loved: number;
  lovedAuc: number | null;
  lovedFeatures: { name: string; lovedMean: number; restMean: number; effect: number }[];
}

export function summarize(marks: readonly Mark[]): MarkSummary {
  const kept = marks.filter(isKept), skipped = marks.filter(m => !isKept(m));
  let bestThreshold: MarkSummary['bestThreshold'] = null;
  if (kept.length >= 3 && skipped.length >= 3) {
    for (const t of [...new Set(marks.map(m => m.score))].sort((a, b) => a - b)) {
      const right = marks.filter(m => (m.score >= t) === isKept(m)).length / marks.length;
      if (!bestThreshold || right > bestThreshold.accuracy) bestThreshold = { threshold: +t.toFixed(3), accuracy: +right.toFixed(3) };
    }
  }
  const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const sd = (xs: number[]) => { const m = mean(xs); return Math.sqrt(mean(xs.map(x => (x - m) ** 2))); };
  // How far apart the two groups' means are on each frame measurement, in pooled spreads, biggest first.
  const differences = (a: readonly Mark[], b: readonly Mark[]) => (a.length >= 3 && b.length >= 3 ? FEATURE_KEYS.map(name => {
    const x = a.map(m => m.features[name]), y = b.map(m => m.features[name]);
    const pooled = Math.sqrt((sd(x) ** 2 + sd(y) ** 2) / 2) || 1;
    return { name, aMean: +mean(x).toFixed(3), bMean: +mean(y).toFixed(3), effect: +((mean(x) - mean(y)) / pooled).toFixed(2) };
  }).sort((p, q) => Math.abs(q.effect) - Math.abs(p.effect)) : []);
  const features = differences(kept, skipped).map(d => ({ name: d.name, keptMean: d.aMean, skippedMean: d.bMean, effect: d.effect }));
  const lovedMarks = marks.filter(m => m.verdict === 'love'), rest = marks.filter(m => m.verdict !== 'love');
  const lovedFeatures = differences(lovedMarks, rest).map(d => ({ name: d.name, lovedMean: d.aMean, restMean: d.bMean, effect: d.effect }));
  const byRate = (rows: RateRow[]) => rows.sort((a, b) => b.total - a.total || a.rate - b.rate);
  return {
    total: marks.length, kept: kept.length, skipped: skipped.length, keepRate: marks.length ? kept.length / marks.length : 0,
    scoreAuc: auc(marks), bestThreshold, features,
    loved: lovedMarks.length, lovedAuc: aucOf(lovedMarks, rest), lovedFeatures,
    gradients: byRate(rates(marks, m => [m.meta.gradient], 2)),
    effects: byRate(rates(marks, m => m.meta.effects, 3)),
    moods: byRate(rates(marks, m => [m.meta.mood], 2)),
    speeds: byRate(rates(marks, m => (m.speed === undefined ? [] : [speedBucket(m.speed)]), 2)),
    palettes: byRate(rates(marks, m => (m.palette ? [lightnessBucket(m.palette.lightness), saturationBucket(m.palette.saturation), contrastBucket(m.palette.contrast)] : []), 3)),
  };
}

type Listener = () => void;

export class ShuffleMarks {
  private marks: Mark[] = [];
  private pending: PendingLook | null = null;
  private latest: PendingLook | null = null;
  private dislikes: Dislike[] = [];
  private listeners = new Set<Listener>();
  private state = { active: false, target: DEFAULT_TARGET, sessionStart: 0, version: 0 };

  constructor(private storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null = null, private now: () => number = Date.now) {
    try {
      const raw = this.storage?.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed)) this.marks = parsed.filter(m => m && (m.verdict === 'keep' || m.verdict === 'skip' || m.verdict === 'love') && m.meta && m.features);
    } catch { /* start fresh */ }
    try {
      const raw = this.storage?.getItem(DISLIKE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed)) this.dislikes = parsed.filter(d => d && d.meta && typeof d.at === 'number');
    } catch { /* start fresh */ }
  }

  private emit() { this.state = { ...this.state, version: this.state.version + 1 }; this.listeners.forEach(l => l()); }
  subscribe = (l: Listener) => { this.listeners.add(l); return () => { this.listeners.delete(l); }; };
  getVersion = () => this.state.version;

  get active() { return this.state.active; }
  get target() { return this.state.target; }
  get current() { return this.pending; }
  // The marks made since the session started (the summary is about these), and all stored marks.
  get sessionMarks() { return this.marks.filter(m => m.at >= this.state.sessionStart); }
  get allMarks() { return this.marks; }
  get allDislikes() { return this.dislikes; }

  start(target = DEFAULT_TARGET) { this.pending = null; this.state = { ...this.state, active: true, target, sessionStart: this.now() }; this.emit(); }
  // Carry on past the target: more marks in the same session, so the summary still counts the earlier ones.
  extend(by = 15) { this.pending = null; this.state = { ...this.state, active: true, target: this.state.target + by }; this.emit(); }
  stop() { this.pending = null; this.state = { ...this.state, active: false }; this.emit(); }

  // The look now on screen has been judged by the quality gate and is ready to be marked.
  setCurrent(look: PendingLook | null) { this.pending = look; this.emit(); }

  // The look the quality gate last settled on, marking session or not, so the dislike button can record its measurements.
  setLatest(look: PendingLook | null) { this.latest = look; }

  // The dislike button was pressed on the look now on screen (`meta`). The learner has already been told.
  recordDislike(meta: ShuffleMeta) {
    const l = this.latest && this.latest.meta === meta ? this.latest : null;
    const entry: Dislike = l ? { meta, score: l.score, dull: l.dull, features: l.features, speed: l.speed, palette: l.palette, at: this.now() } : { meta, at: this.now() };
    this.dislikes = [...this.dislikes, entry].slice(-MAX_DISLIKES);
    try { this.storage?.setItem(DISLIKE_KEY, JSON.stringify(this.dislikes)); } catch { /* not persisted */ }
    this.emit();
  }

  mark(verdict: Verdict): Mark | null {
    const look = this.pending;
    if (!look) return null;
    const mark: Mark = { ...look, verdict, at: this.now() };
    this.marks = [...this.marks, mark].slice(-MAX_MARKS);
    this.pending = null;
    // The marks teach the learner too, as clear votes.
    shuffleLearning.vote(verdict === 'skip' ? 'down' : 'up', verdict === 'love' ? LOVE_WEIGHT : 1);
    try { this.storage?.setItem(KEY, JSON.stringify(this.marks)); } catch { /* not persisted */ }
    this.emit();
    return mark;
  }

  clear() { this.marks = []; this.dislikes = []; this.pending = null; this.latest = null; try { this.storage?.removeItem(KEY); this.storage?.removeItem(DISLIKE_KEY); } catch { /* ignore */ } this.emit(); }

  // The results as text to paste back: the session's summary and every mark, with the frame measurements.
  export(): string {
    const marks = this.sessionMarks.length ? this.sessionMarks : this.marks;
    // Every stored dislike, not just this session's: most are pressed while shuffling around, outside a session.
    return JSON.stringify({ app: 'wav-shuffle-marks', version: 1, summary: summarize(marks), marks, dislikes: this.dislikes }, null, 1);
  }
}

export const shuffleMarks = new ShuffleMarks(typeof localStorage !== 'undefined' ? localStorage : null);
