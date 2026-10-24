import { describe, it, expect } from 'vitest';
import { createQualityController, EMERGENCY_FLOORS, QUALITY_STEPS } from './adaptiveQuality';

const run = (c: ReturnType<typeof createQualityController>, ms: number, frames: number) => {
  let s = c.scale;
  for (let i = 0; i < frames; i++) s = c.update(ms);
  return s;
};

describe('adaptive quality controller', () => {
  it('starts at full quality and stays there at a steady 60fps', () => {
    const c = createQualityController();
    expect(run(c, 16.7, 600)).toBe(QUALITY_STEPS[0]);
  });

  it('steps down when frames run slow, down to the floor', () => {
    const c = createQualityController();
    const s = run(c, 40, 2000);
    expect(s).toBe(QUALITY_STEPS[QUALITY_STEPS.length - 1]);
  });

  it('steps down gradually rather than dropping straight to the floor', () => {
    const c = createQualityController();
    run(c, 30, 20);
    expect(c.scale).toBeLessThan(1);
    expect(c.scale).toBeGreaterThan(QUALITY_STEPS[QUALITY_STEPS.length - 1]);
  });

  it('recovers toward full quality once frames are fast again', () => {
    const c = createQualityController();
    run(c, 40, 400);
    const low = c.scale;
    run(c, 8, 4000);
    expect(c.scale).toBeGreaterThan(low);
    expect(c.scale).toBe(QUALITY_STEPS[0]);
  });

  it('ignores stalls and paused-tab gaps instead of treating them as slow frames', () => {
    const c = createQualityController();
    for (let i = 0; i < 300; i++) c.update(i % 20 === 0 ? 5000 : 16.7);
    expect(c.scale).toBe(QUALITY_STEPS[0]);
  });

  it('does not flap in the dead band between slow and fast', () => {
    const c = createQualityController();
    run(c, 40, 60);
    const settled = c.scale;
    run(c, 19.5, 2000);
    expect(c.scale).toBe(settled);
  });

  it('waits longer to retry a step that keeps proving too expensive', () => {
    // Fast enough to climb, but the step above is slow: it should flap a few
    // times and then stop trying as often (fewer changes in the second half).
    const c = createQualityController();
    let lastScale = c.scale;
    const changesIn = (frames: number, msFor: (s: number) => number) => {
      let n = 0;
      for (let i = 0; i < frames; i++) {
        const s = c.update(msFor(c.scale));
        if (s !== lastScale) { n++; lastScale = s; }
      }
      return n;
    };
    // Cost scales inversely with resolution: full quality = 30ms frames, any
    // lower step = 12ms frames.
    const cost = (s: number) => (s >= 1 ? 30 : 12);
    const first = changesIn(3000, cost);
    const second = changesIn(3000, cost);
    expect(second).toBeLessThanOrEqual(first);
    expect(c.scale).toBeLessThan(1);
  });

  it('reset returns to full quality', () => {
    const c = createQualityController();
    run(c, 40, 300);
    c.reset();
    expect(c.scale).toBe(QUALITY_STEPS[0]);
  });
});

describe('emergency steps for the costliest gradients', () => {
  it('a normal controller never goes below the usual floor', () => {
    const c = createQualityController();
    run(c, 60, 4000);
    expect(c.floor).toBe(1);
    expect(c.scale).toBe(QUALITY_STEPS[QUALITY_STEPS.length - 1]);
  });

  it('an emergency controller keeps stepping down when frames stay slow, below the display size', () => {
    const c = createQualityController({ emergency: true });
    run(c, 60, 4000);
    expect(c.scale).toBe(QUALITY_STEPS[QUALITY_STEPS.length - 1]);
    expect(c.floor).toBe(EMERGENCY_FLOORS[EMERGENCY_FLOORS.length - 1]);
  });

  it('uses the emergency steps one at a time, only after the normal steps', () => {
    const c = createQualityController({ emergency: true });
    let sawNormalFloorBeforeEmergency = true;
    for (let i = 0; i < 4000; i++) {
      c.update(60);
      if (c.floor < 1 && c.scale !== QUALITY_STEPS[QUALITY_STEPS.length - 1]) sawNormalFloorBeforeEmergency = false;
    }
    expect(sawNormalFloorBeforeEmergency).toBe(true);
  });

  it('recovers all the way back to full quality when frames are fast again', () => {
    const c = createQualityController({ emergency: true });
    run(c, 60, 3000);
    run(c, 8, 20000);
    expect(c.scale).toBe(QUALITY_STEPS[0]);
    expect(c.floor).toBe(1);
  });

  it('a steady 60fps never uses an emergency step', () => {
    const c = createQualityController({ emergency: true });
    run(c, 16.7, 3000);
    expect(c.floor).toBe(1);
    expect(c.scale).toBe(1);
  });
});
