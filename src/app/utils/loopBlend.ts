// Seamless loops from a live animation. The animation never repeats on its own, so the clip is made to by
// dissolving its tail into its head: capture N + M frames, then
//
//   output = f[M] .. f[N-1]                     (as captured)
//            blend(f[N+i], f[i], i / M)  i = 0..M-1   (the extra M frames fade into the first M)
//
// Played in a cycle, f[N-1] is followed by f[N] (alpha 0) and the last blend is followed by f[M]: both are real
// consecutive frames, so there is no jump. Frames are emitted as they are captured, so only the first M frames
// are held in memory.

export interface LoopPlan {
  fps: number;
  frames: number;      // frames in the finished loop (N)
  overlap: number;     // frames dissolved at the seam (M)
  captureFrames: number; // N + M
}

export function planLoop(seconds: number, fps: number, maxOverlapFrames = 45): LoopPlan {
  const frames = Math.max(2, Math.round(seconds * fps));
  const overlap = Math.max(1, Math.min(Math.round(frames * 0.25), maxOverlapFrames, frames - 1));
  return { fps, frames, overlap, captureFrames: frames + overlap };
}

// Mixes two frames: `alpha` of `from` and the rest of `to`, written into `out`.
export function mixFrames(out: Uint8ClampedArray, to: Uint8ClampedArray, from: Uint8ClampedArray, alpha: number): Uint8ClampedArray {
  const keep = 1 - alpha;
  for (let i = 0; i < out.length; i++) out[i] = to[i] * keep + from[i] * alpha;
  return out;
}

export class LoopAssembler {
  private head: Uint8ClampedArray[] = [];
  private seen = 0;
  constructor(private readonly plan: LoopPlan) {}

  // Feed frames in capture order. Returns the frame to write to the output, or null when this one is only being kept.
  // The returned array may be the one passed in (do not reuse it) or a new one.
  push(frame: Uint8ClampedArray): Uint8ClampedArray | null {
    const { frames: N, overlap: M } = this.plan;
    const k = this.seen++;
    if (k >= N + M) return null;
    if (k < M) { this.head.push(new Uint8ClampedArray(frame)); return null; }
    if (k < N) return frame;
    const i = k - N;
    return mixFrames(frame, frame, this.head[i], i / M);
  }

  get done() { return this.seen >= this.plan.captureFrames; }
}
