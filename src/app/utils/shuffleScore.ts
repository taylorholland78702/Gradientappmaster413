import type { EffectType, GradientType } from '../constants/gradientEffects';
import { EFFECT_AFFINITY, EFFECT_PAIRS, MOODS, gradientKind, type Mood } from '../constants/shuffleTaste';
import { ShuffleHistory, pickWeighted } from './shuffleHistory';

// Rolling and judging a shuffled look before it is drawn. Shuffle rolls several candidate looks (a gradient and an
// effect stack) in memory, scores each against the taste table and the recent history, and keeps one, so the look
// that gets drawn is usually a good one and not the first thing the dice gave.

export interface Candidate { gradient: GradientType; effects: EffectType[]; spentCost: number }

const affinity = (gradient: string, effect: EffectType, mood: Mood): number =>
  (EFFECT_AFFINITY[gradientKind(gradient)][effect] ?? 0) + (mood.effectBias[effect] ?? 0);

// How good a look should be, before any frame is drawn. About -6 (clashing, off-mood) to +8 (well matched, fresh).
export function scoreLook(gradient: GradientType, effects: readonly EffectType[], mood: Mood, history: ShuffleHistory): number {
  let score = 0;
  for (const fx of effects) score += affinity(gradient, fx, mood);
  for (const [a, b, delta] of EFFECT_PAIRS) if (effects.includes(a) && effects.includes(b)) score += delta;
  // Fresh gradients and effects are worth a little; ones just shown cost a little.
  score += (history.weight('gradient', gradient) - 0.55) * 3;
  for (const fx of effects) score += (history.weight('effect', fx) - 0.55) * 0.5;
  return score;
}

export interface RollOptions {
  gradientPool: readonly GradientType[];
  lightEffects: readonly EffectType[];
  shapeChangers: readonly EffectType[];
  costOf: (effect: EffectType) => number;
  costBudget: number;
  minEffects: number;
  // Hard cap from the caller (sparse gradients take fewer); the mood's own cap applies as well.
  maxEffects: (gradient: GradientType) => number;
  // Effects a gradient should not get (content erasers on sparse gradients, say).
  excluded: (gradient: GradientType) => readonly EffectType[];
  // Odds multiplier learned from what you keep and undo (1 when nothing is known).
  learned?: (kind: 'gradient' | 'effect', id: string) => number;
}

// One candidate: a gradient, then a stack of effects chosen by taste, mood and what was shown lately.
export function rollCandidate(opts: RollOptions, mood: Mood, history: ShuffleHistory, rng: () => number = Math.random): Candidate {
  const learned = opts.learned ?? (() => 1);
  const gradient = pickWeighted(opts.gradientPool, g => history.weight('gradient', g) * learned('gradient', g), rng);
  const excluded = opts.excluded(gradient);
  const cap = Math.min(opts.maxEffects(gradient), mood.maxEffects);
  const stack: EffectType[] = [];
  let spent = 0;
  const weightOf = (fx: EffectType) => history.weight('effect', fx) * learned('effect', fx) * Math.pow(2, 0.6 * affinity(gradient, fx, mood));
  const take = (fx: EffectType) => { stack.push(fx); spent += opts.costOf(fx); };

  const shapePool = opts.shapeChangers.filter(fx => !excluded.includes(fx));
  if (shapePool.length && rng() < mood.shapeChangerChance) take(pickWeighted(shapePool, weightOf, rng));

  const light = opts.lightEffects.filter(fx => !excluded.includes(fx) && !stack.includes(fx));
  // Fill by weighted draws without replacement, within the cost budget and the cap.
  const remaining = [...light];
  // The floor never exceeds the cap, so a gradient limited to two effects still gets a valid stack.
  const floor = Math.min(opts.minEffects, cap);
  const target = Math.max(floor, Math.min(cap, 2 + Math.floor(rng() * (cap - 1))));
  while (stack.length < target && remaining.length) {
    const fx = pickWeighted(remaining, weightOf, rng);
    remaining.splice(remaining.indexOf(fx), 1);
    if (stack.length >= floor && spent + opts.costOf(fx) > opts.costBudget) continue;
    take(fx);
  }
  return { gradient, effects: stack, spentCost: spent };
}

// Rolls `count` candidates and picks among them, favouring the best-scoring one without always taking it, so
// shuffles stay varied. Lower temperature is stricter.
export function chooseLook(opts: RollOptions, mood: Mood, history: ShuffleHistory, rng: () => number = Math.random, count = 6, temperature = 2.2): Candidate & { score: number } {
  const candidates = Array.from({ length: count }, () => {
    const c = rollCandidate(opts, mood, history, rng);
    return { ...c, score: scoreLook(c.gradient, c.effects, mood, history) };
  });
  return pickWeighted(candidates, c => Math.exp(c.score / temperature), rng);
}

// A mood for this shuffle, steering away from the one just used (and toward the ones you tend to keep).
export function chooseMood(history: ShuffleHistory, rng: () => number = Math.random, learnedMood?: (id: string) => number): Mood {
  return pickWeighted(MOODS, m => history.weight('mood', m.id) * (learnedMood?.(m.id) ?? 1), rng);
}

// Scales a [min, max] range by a mood's strength: a gentle mood keeps the low end, a strong one uses all of it.
export function scaleRange([min, max]: readonly [number, number], strength: number): [number, number] {
  return [min, min + (max - min) * (0.25 + 0.75 * strength)];
}
