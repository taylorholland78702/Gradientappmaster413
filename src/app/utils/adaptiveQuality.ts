// Dynamic resolution scaling for the full-resolution field gradients.
//
// Rendering a gradient at the canvas's real pixel density costs several times
// the fragment work of rendering at CSS-pixel size, which is free headroom on
// a fast GPU and a dropped-frame problem on a slow one. Rather than guess per
// device, this watches the actual interval between frames and steps the render
// scale down when frames run long (bottoming out at scale 1 step = the old
// display-size behavior, so the worst case is exactly what shipped before),
// and back up again, slowly, when there is headroom.
//
// It is a small pure state machine (no timers, no DOM) so it can be tested by
// feeding it frame intervals.

// Fractions of the full target resolution. Index 0 is full quality; the last
// is the floor the caller clamps to display size anyway.
export const QUALITY_STEPS = [1, 0.85, 0.72, 0.61, 0.52] as const;

// Extra steps for the costliest gradients, used only when the frame is still slow at the last step above. Unlike
// QUALITY_STEPS these are fractions of the display's own CSS-pixel size (the usual floor), so the picture is rendered
// below native size and stretched. Meant as an emergency brake on weak GPUs: it steps back up as soon as frames recover.
export const EMERGENCY_FLOORS = [0.75, 0.6] as const;

// Frame intervals (ms). Above SLOW the frame missed ~45fps; below FAST there is
// comfortable headroom at 60fps. The gap between them is the dead band that
// stops it flapping on every frame.
const SLOW_MS = 22;
const FAST_MS = 17.6;
// Gaps longer than this are a paused/hidden tab or a stall, not a frame time.
const MAX_SAMPLE_MS = 250;
const EMA_ALPHA = 0.08;
const DOWN_COOLDOWN_FRAMES = 40;
const BASE_UP_DELAY_FRAMES = 120;
const MAX_UP_DELAY_FRAMES = 2400;

export interface QualityController {
  // Feed the time (ms) since the previous frame; returns the scale for this one.
  update(frameMs: number): number;
  readonly scale: number;
  // Fraction of the display's CSS-pixel size to allow as the minimum render size: 1 except in emergency steps.
  readonly floor: number;
  reset(): void;
}

// A step down within this many frames of a step up is a flap: the higher step is
// genuinely too expensive, so the wait before trying it again doubles.
const FLAP_WINDOW_FRAMES = 600;

export function createQualityController(options: { emergency?: boolean } = {}): QualityController {
  const lastStep = QUALITY_STEPS.length - 1 + (options.emergency ? EMERGENCY_FLOORS.length : 0);
  const scaleAt = (i: number) => QUALITY_STEPS[Math.min(i, QUALITY_STEPS.length - 1)];
  const floorAt = (i: number) => (i < QUALITY_STEPS.length ? 1 : EMERGENCY_FLOORS[i - QUALITY_STEPS.length]);
  let step = 0;
  let ema = 16.7;
  let cooldown = 0;
  let upDelay = BASE_UP_DELAY_FRAMES;
  let lastChange: 'up' | 'down' | null = null;
  let framesSinceChange = 0;

  return {
    update(frameMs: number): number {
      framesSinceChange++;
      if (frameMs > 0 && frameMs < MAX_SAMPLE_MS) {
        ema += (Math.min(frameMs, 100) - ema) * EMA_ALPHA;
      }
      if (cooldown > 0) {
        cooldown--;
      } else if (ema > SLOW_MS && step < lastStep) {
        if (lastChange === 'up' && framesSinceChange < FLAP_WINDOW_FRAMES) {
          upDelay = Math.min(upDelay * 2, MAX_UP_DELAY_FRAMES);
        }
        step++;
        cooldown = DOWN_COOLDOWN_FRAMES;
        lastChange = 'down';
        framesSinceChange = 0;
      } else if (ema < FAST_MS && step > 0) {
        step--;
        cooldown = upDelay;
        lastChange = 'up';
        framesSinceChange = 0;
      }
      return scaleAt(step);
    },
    get scale() { return scaleAt(step); },
    get floor() { return floorAt(step); },
    reset() {
      step = 0; ema = 16.7; cooldown = 0; upDelay = BASE_UP_DELAY_FRAMES;
      lastChange = null; framesSinceChange = 0;
    },
  };
}
