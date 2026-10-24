// What Shuffle learns from what you do. A shuffle you undo straight away was not wanted; one you leave alone for a
// while, save or export was. Those signals nudge the odds of the gradient, effects, palette and mood that look was
// made of, so over time Shuffle leans toward what you keep. It is stored in this browser only and forgets slowly.

export type LearnedKind = 'gradient' | 'effect' | 'palette' | 'mood';
export interface ShuffleMeta { gradient: string; effects: readonly string[]; mood: string; palette?: string }

const KEY = 'wavShuffleTaste';
const UNDO_WINDOW_MS = 15_000;
const DWELL_MS = 25_000;
const MIN_SIGNALS = 6;       // Below this the odds are left alone.
const MAX_KEYS = 400;
const DECAY = 0.985;          // Every signal makes older ones count slightly less.

interface Stored { v: 1; up: Record<string, number>; down: Record<string, number>; total: number }

const idsOf = (m: ShuffleMeta): string[] => [
  `gradient:${m.gradient}`, ...m.effects.map(e => `effect:${e}`), `mood:${m.mood}`, ...(m.palette ? [`palette:${m.palette}`] : []),
];

export class ShuffleLearning {
  private data: Stored = { v: 1, up: {}, down: {}, total: 0 };
  private attempts: ShuffleMeta[] = [];
  private current: { meta: ShuffleMeta; at: number; judged: boolean } | null = null;
  private dwellTimer: ReturnType<typeof setTimeout> | null = null;
  // While Auto Shuffle runs the looks change on a timer, so leaving one alone says nothing about it.
  paused = false;

  constructor(private storage: Pick<Storage, 'getItem' | 'setItem'> | null = null, private now: () => number = Date.now) {
    this.load();
  }

  private load() {
    try {
      const raw = this.storage?.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) as Stored : null;
      if (parsed && parsed.v === 1 && typeof parsed.total === 'number' && parsed.up && parsed.down) this.data = parsed;
    } catch { /* start fresh */ }
  }
  private save() { try { this.storage?.setItem(KEY, JSON.stringify(this.data)); } catch { /* not persisted */ } }

  // The odds multiplier for something, 1 until there is enough to go on, then between 0.5 and 2.
  weight(kind: LearnedKind, id: string): number {
    if (this.data.total < MIN_SIGNALS) return 1;
    const k = `${kind}:${id}`;
    const up = this.data.up[k] ?? 0, down = this.data.down[k] ?? 0;
    return Math.min(2, Math.max(0.5, Math.sqrt((up + 1) / (down + 1))));
  }

  // Adds one signal for everything the look was made of.
  note(direction: 'up' | 'down', meta: ShuffleMeta, amount = 1) {
    const d = this.data;
    for (const table of [d.up, d.down]) for (const k of Object.keys(table)) { table[k] *= DECAY; if (table[k] < 0.02) delete table[k]; }
    const table = direction === 'up' ? d.up : d.down;
    for (const id of idsOf(meta)) table[id] = (table[id] ?? 0) + amount;
    d.total = Math.min(1000, d.total + 1);
    const keys = new Set([...Object.keys(d.up), ...Object.keys(d.down)]);
    if (keys.size > MAX_KEYS) {
      const strength = (k: string) => (d.up[k] ?? 0) + (d.down[k] ?? 0);
      for (const k of [...keys].sort((a, b) => strength(a) - strength(b)).slice(0, keys.size - MAX_KEYS)) { delete d.up[k]; delete d.down[k]; }
    }
    this.save();
  }

  // A shuffle was rolled (it may be one of several the quality gate tries).
  begin(meta: ShuffleMeta) { this.attempts.push(meta); this.current = null; this.clearTimer(); }

  // The shuffle that stayed on screen, `index` of those rolled since the last commit (the last one when omitted).
  commit(index?: number) {
    const meta = this.attempts[index ?? this.attempts.length - 1];
    this.attempts = [];
    if (!meta) return;
    this.current = { meta, at: this.now(), judged: false };
    this.clearTimer();
    this.dwellTimer = setTimeout(() => this.like(0.5), DWELL_MS);
  }

  // Forget the rolls so far (the gate asks for a clean start).
  reset() { this.attempts = []; }

  // You undid it. Counts only soon after the shuffle.
  reject() {
    const c = this.current;
    if (!c || c.judged || this.now() - c.at > UNDO_WINDOW_MS) return;
    c.judged = true; this.clearTimer();
    this.note('down', c.meta);
  }

  // You kept it: left it alone, saved it or exported it. `amount` is how strong the signal is.
  like(amount = 1) {
    const c = this.current;
    if (!c || c.judged || (this.paused && amount < 1)) return;
    c.judged = true; this.clearTimer();
    this.note('up', c.meta, amount);
  }

  private clearTimer() { if (this.dwellTimer) { clearTimeout(this.dwellTimer); this.dwellTimer = null; } }
  clear() { this.data = { v: 1, up: {}, down: {}, total: 0 }; this.attempts = []; this.current = null; this.clearTimer(); this.save(); }
  // For tests and the settings panel.
  get signals() { return this.data.total; }
}

export const shuffleLearning = new ShuffleLearning(typeof localStorage !== 'undefined' ? localStorage : null);
