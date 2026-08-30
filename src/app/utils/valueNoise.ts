// Deterministic pseudo-random in [0,1) from two integers — shared by every
// effect that needs a stable (non-time-animated) hash field: applyPhoto.ts's
// shatter tiles, applyWatercolor.ts's warp/paper texture, applyDada.ts's
// panel assignment, applySurrealism.ts's melt columns.
export function hash2(a: number, b: number): number {
  let h = a * 374761393 + b * 668265263;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967295;
}

// Bilinear-interpolated value noise — unlike a raw per-pixel hash (which
// jumps randomly from one pixel to its neighbor and reads as static/grain),
// this varies smoothly across space, so regions tens of pixels wide drift
// together.
export function valueNoise(x: number, y: number): number {
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const fx = x - x0, fy = y - y0;
  const v00 = hash2(x0, y0), v10 = hash2(x0 + 1, y0);
  const v01 = hash2(x0, y0 + 1), v11 = hash2(x0 + 1, y0 + 1);
  const vx0 = v00 + (v10 - v00) * fx;
  const vx1 = v01 + (v11 - v01) * fx;
  return vx0 + (vx1 - vx0) * fy;
}
