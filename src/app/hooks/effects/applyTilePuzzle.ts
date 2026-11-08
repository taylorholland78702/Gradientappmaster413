import { getScratchCanvas } from '../../utils/scratchCanvas';
import type { EffectCtx } from '../canvasDrawTypes';
import { makeClock } from './warpCommon';

const clock = makeClock();

const hash = (n: number): number => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// Where each tile sits, and how far it is turned, for one step of the puzzle. Every step is its own arrangement
// built from the step number, so the order is repeatable and the tiles slide from one step's arrangement to the next.
function arrangement(step: number, count: number, shuffle: number, rotate: number): { slot: number[]; turns: number[] } {
  const total = count * count;
  const slot = Array.from({ length: total }, (_, i) => i);
  const swaps = Math.round(shuffle * total * 0.6);
  for (let k = 0; k < swaps; k++) {
    const a = Math.floor(hash(step * 91.3 + k * 7.1) * total), b = Math.floor(hash(step * 53.7 + k * 3.9 + 1) * total);
    [slot[a], slot[b]] = [slot[b], slot[a]];
  }
  const turns = Array.from({ length: total }, (_, i) => (hash(step * 17.9 + i * 5.3 + 2) < rotate ? 2 : 0));
  return { slot, turns };
}

const ease = (t: number): number => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

// Sliding-tile puzzle: the frame is cut into a grid and the tiles slide to new places, some turning a half turn on
// the way, then settle for a moment before the next shuffle. With Empty slot on, the last tile is missing and its gap
// shows black, like the empty square in a real sliding puzzle.
export function applyTilePuzzle(P: EffectCtx): void {
  const { ctx, canvas, displayWidth: W, displayHeight: H, tilePuzzleCount, tilePuzzleShuffle, tilePuzzleRotate, tilePuzzleGap, tilePuzzleSpeed, tilePuzzleEmpty } = P;
  if (canvas.width === 0 || canvas.height === 0 || W < 2 || H < 2) return;
  const count = Math.max(2, Math.min(10, Math.round(tilePuzzleCount ?? 4)));
  const shuffle = Math.max(0, Math.min(1, tilePuzzleShuffle ?? 0.5));
  const rotate = Math.max(0, Math.min(1, tilePuzzleRotate ?? 0.25));
  const gap = Math.max(0, tilePuzzleGap ?? 2);
  const empty = tilePuzzleEmpty === 'on';
  const t = clock(tilePuzzleSpeed ?? 1) * 0.7;
  const step = Math.floor(t);
  const slide = ease(Math.min(1, (t - step) / 0.4));

  const src = getScratchCanvas('tilePuzzleSrc', W, H);
  const sctx = src.getContext('2d')!;
  sctx.clearRect(0, 0, W, H);
  sctx.drawImage(canvas, 0, 0, W, H);

  const from = arrangement(step - 1, count, shuffle, rotate);
  const to = arrangement(step, count, shuffle, rotate);
  const tw = W / count, th = H / count;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  for (let s = 0; s < count * count; s++) {
    if (empty && s === count * count - 1) continue;
    const a = from.slot[s], b = to.slot[s];
    const px = (a % count) + ((b % count) - (a % count)) * slide;
    const py = Math.floor(a / count) + (Math.floor(b / count) - Math.floor(a / count)) * slide;
    const angle = (from.turns[s] + (to.turns[s] - from.turns[s]) * slide) * (Math.PI / 2);
    ctx.save();
    ctx.translate((px + 0.5) * tw, (py + 0.5) * th);
    ctx.rotate(angle);
    const sx = (s % count) * tw, sy = Math.floor(s / count) * th;
    ctx.beginPath();
    ctx.rect(-tw / 2 + gap / 2, -th / 2 + gap / 2, Math.max(1, tw - gap), Math.max(1, th - gap));
    ctx.clip();
    ctx.drawImage(src, sx, sy, tw, th, -tw / 2, -th / 2, tw, th);
    ctx.restore();
  }
}
