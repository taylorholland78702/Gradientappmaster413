// Speed sliders whose gradient is driven by an animation clock rather than read straight off the draw context.
// An audio binding changes the value the draw call sees, but a clock that only knew the saved slider would ignore
// it, so useCanvasDraw publishes the value each frame actually drew with (saved value plus any binding) and the
// clocks read it from there. (The styled gradients' shared Speed has its own, fieldSpeedLive.)
export const LIVE_SPEED_KEYS = [
  'noiseSpeed', 'attractorSpeed', 'metaballSpeed', 'hatchSpeed', 'radialSpeed', 'flowSpeed', 'causticsSpeed', 'marbleSpeed',
  'emojiRotateSpeed', 'voronoiSpeed', 'flowerSpeed', 'stackSpeed', 'truchetSpeed', 'shapesSpeed', 'juliaSpeed',
] as const;

export type LiveSpeeds = Partial<Record<string, number>>;

// The speed a clock should use: the live value when one has been published, otherwise the saved slider.
export const liveSpeed = (live: LiveSpeeds | undefined, key: string, saved: number): number =>
  Math.max(0, live?.[key] ?? saved);

// Copies the speeds this frame drew with (saved value plus any audio binding) where the clocks can read them.
export function publishLiveSpeeds(target: Record<string, number>, drawCtx: object): void {
  const ctx = drawCtx as Record<string, unknown>;
  for (const key of LIVE_SPEED_KEYS) {
    const v = ctx[key];
    if (typeof v === 'number') target[key] = v;
  }
}
