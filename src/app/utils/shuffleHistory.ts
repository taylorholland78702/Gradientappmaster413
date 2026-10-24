// What Shuffle has shown recently, so it can steer away from repeats. A shuffle that picks everything uniformly
// at random will, by chance alone, hand back the same gradient or the same effect two or three times in a row; this
// remembers the last few picks of each kind and lowers their odds, most strongly for the most recent.

export type HistoryKind = 'gradient' | 'effect' | 'palette' | 'mood';

const DEFAULT_DEPTH: Record<HistoryKind, number> = { gradient: 8, effect: 12, palette: 10, mood: 2 };

export class ShuffleHistory {
  private recent: Record<HistoryKind, string[]> = { gradient: [], effect: [], palette: [], mood: [] };
  constructor(private depth: Record<HistoryKind, number> = DEFAULT_DEPTH) {}

  record(kind: HistoryKind, ids: string | readonly string[]): void {
    const list = this.recent[kind];
    for (const id of Array.isArray(ids) ? ids : [ids as string]) list.push(id);
    const over = list.length - this.depth[kind];
    if (over > 0) list.splice(0, over);
  }

  // 1 for something not seen lately, down to 0.1 for what was picked last. Linear in how long ago it was.
  weight(kind: HistoryKind, id: string): number {
    const list = this.recent[kind];
    const at = list.lastIndexOf(id);
    if (at < 0) return 1;
    const age = list.length - 1 - at;          // 0 = the most recent pick
    return 0.1 + 0.9 * Math.min(1, age / this.depth[kind]);
  }

  clear(): void { for (const k of Object.keys(this.recent) as HistoryKind[]) this.recent[k] = []; }
}

// One for the whole session, shared by every way of shuffling.
export const shuffleHistory = new ShuffleHistory();

// Picks one item with probability proportional to its weight.
export function pickWeighted<T>(items: readonly T[], weight: (item: T) => number, rng: () => number = Math.random): T {
  const weights = items.map(i => Math.max(0, weight(i)));
  const total = weights.reduce((a, b) => a + b, 0);
  if (!(total > 0)) return items[Math.floor(rng() * items.length)];
  let roll = rng() * total;
  for (let i = 0; i < items.length; i++) { roll -= weights[i]; if (roll < 0) return items[i]; }
  return items[items.length - 1];
}
