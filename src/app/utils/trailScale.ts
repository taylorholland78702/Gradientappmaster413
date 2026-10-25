// A trail's decay is a per-frame fraction kept, so how long it lasts is about 1 / (1 - decay) frames: 0.5 is 2 frames,
// 0.9 is 10, 0.99 is 100. On a linear slider almost all of the subtle range sits in the last few millimetres. These map
// decay to a 0-1 slider position that moves evenly in (1 - decay), so each step lengthens the trail by the same factor.
// Only the slider changes; the stored decay keeps its real value and range.
const SLOWEST = 0.5;   // 1 - decay at position 0 (shortest trail)
const FASTEST = 0.01;  // 1 - decay at position 1 (longest trail)
const RATIO = FASTEST / SLOWEST;

export const decayToPosition = (decay: number): number => {
  const loss = Math.min(SLOWEST, Math.max(FASTEST, 1 - decay));
  return Math.log(loss / SLOWEST) / Math.log(RATIO);
};

export const positionToDecay = (pos: number): number => {
  const p = Math.min(1, Math.max(0, pos));
  return 1 - SLOWEST * Math.pow(RATIO, p);
};
