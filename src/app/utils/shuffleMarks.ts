import type { FrameFeatures } from './frameScore';
import { shuffleLearning, type ShuffleMeta } from './shuffleLearning';

// The marking tool's data: a session where you shuffle, mark each look Keep or Skip, and Shuffle gets calibrated
// against your taste. Each mark stores what the look was made of and what the frame score thought of it. The marks also
// teach the shuffle's learner straight away. Stored in this browser; "Copy results" gives the numbers.

export type Verdict = 'keep' | 'skip';
export interface PendingLook { meta: ShuffleMeta; score: number; dull: boolean; features: FrameFeatures }
export interface Mark extends PendingLook { verdict: Verdict; at: number }

const KEY = 'wavShuffleMarks';
const MAX_MARKS = 300;
export const DEFAULT_TARGET = 30;

// Probability that a randomly chosen kept look scored higher than a randomly chosen skipped one: 0.5 is no
// better than chance, 1 is a perfect ranking. Null until both kinds have at least three marks.
export function auc(marks: readonly Mark[]): number | null {
  const kept = marks.filter(m => m.verdict === 'keep'), skipped = marks.filter(m => m.verdict === 'skip');
  if (kept.length < 3 || skipped.length < 3) return null;
  let wins = 0;
  for (const k of kept) for (const s of skipped) wins += k.score > s.score ? 1 : k.score === s.score ? 0.5 : 0;
  return wins / (kept.length * skipped.length);
}

export interface RateRow { id: string; kept: number; total: number; rate: number }

function rates(marks: readonly Mark[], idsOf: (m: Mark) => readonly string[], minTotal: number): RateRow[] {
  const table = new Map<string, { kept: number; total: number }>();
  for (const m of marks) for (const id of new Set(idsOf(m))) {
    const row = table.get(id) ?? { kept: 0, total: 0 };
    row.total++; if (m.verdict === 'keep') row.kept++;
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
  // Which frame measurements differ most between kept and skipped looks (difference of means over the pooled spread).
  features: { name: string; keptMean: number; skippedMean: number; effect: number }[];
}

export function summarize(marks: readonly Mark[]): MarkSummary {
  const kept = marks.filter(m => m.verdict === 'keep'), skipped = marks.filter(m => m.verdict === 'skip');
  let bestThreshold: MarkSummary['bestThreshold'] = null;
  if (kept.length >= 3 && skipped.length >= 3) {
    for (const t of [...new Set(marks.map(m => m.score))].sort((a, b) => a - b)) {
      const right = marks.filter(m => (m.score >= t) === (m.verdict === 'keep')).length / marks.length;
      if (!bestThreshold || right > bestThreshold.accuracy) bestThreshold = { threshold: +t.toFixed(3), accuracy: +right.toFixed(3) };
    }
  }
  const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const sd = (xs: number[]) => { const m = mean(xs); return Math.sqrt(mean(xs.map(x => (x - m) ** 2))); };
  const features = kept.length >= 3 && skipped.length >= 3 ? FEATURE_KEYS.map(name => {
    const a = kept.map(m => m.features[name]), b = skipped.map(m => m.features[name]);
    const pooled = Math.sqrt((sd(a) ** 2 + sd(b) ** 2) / 2) || 1;
    return { name, keptMean: +mean(a).toFixed(3), skippedMean: +mean(b).toFixed(3), effect: +((mean(a) - mean(b)) / pooled).toFixed(2) };
  }).sort((x, y) => Math.abs(y.effect) - Math.abs(x.effect)) : [];
  const byRate = (rows: RateRow[]) => rows.sort((a, b) => b.total - a.total || a.rate - b.rate);
  return {
    total: marks.length, kept: kept.length, skipped: skipped.length, keepRate: marks.length ? kept.length / marks.length : 0,
    scoreAuc: auc(marks), bestThreshold, features,
    gradients: byRate(rates(marks, m => [m.meta.gradient], 2)),
    effects: byRate(rates(marks, m => m.meta.effects, 3)),
    moods: byRate(rates(marks, m => [m.meta.mood], 2)),
  };
}

type Listener = () => void;

export class ShuffleMarks {
  private marks: Mark[] = [];
  private pending: PendingLook | null = null;
  private listeners = new Set<Listener>();
  private state = { active: false, target: DEFAULT_TARGET, sessionStart: 0, version: 0 };

  constructor(private storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null = null, private now: () => number = Date.now) {
    try {
      const raw = this.storage?.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed)) this.marks = parsed.filter(m => m && (m.verdict === 'keep' || m.verdict === 'skip') && m.meta && m.features);
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

  start(target = DEFAULT_TARGET) { this.pending = null; this.state = { ...this.state, active: true, target, sessionStart: this.now() }; this.emit(); }
  stop() { this.pending = null; this.state = { ...this.state, active: false }; this.emit(); }

  // The look now on screen has been judged by the quality gate and is ready to be marked.
  setCurrent(look: PendingLook | null) { this.pending = look; this.emit(); }

  mark(verdict: Verdict): Mark | null {
    const look = this.pending;
    if (!look) return null;
    const mark: Mark = { ...look, verdict, at: this.now() };
    this.marks = [...this.marks, mark].slice(-MAX_MARKS);
    this.pending = null;
    // The marks teach the learner too, as clear votes.
    shuffleLearning.vote(verdict === 'keep' ? 'up' : 'down');
    try { this.storage?.setItem(KEY, JSON.stringify(this.marks)); } catch { /* not persisted */ }
    this.emit();
    return mark;
  }

  clear() { this.marks = []; this.pending = null; try { this.storage?.removeItem(KEY); } catch { /* ignore */ } this.emit(); }

  // The results as text to paste back: the session's summary and every mark, with the frame measurements.
  export(): string {
    const marks = this.sessionMarks.length ? this.sessionMarks : this.marks;
    return JSON.stringify({ app: 'wav-shuffle-marks', version: 1, summary: summarize(marks), marks }, null, 1);
  }
}

export const shuffleMarks = new ShuffleMarks(typeof localStorage !== 'undefined' ? localStorage : null);
