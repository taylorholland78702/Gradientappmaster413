import { EXPORT_MAX_EDGE } from '../constants/exportOptions';

export const VIDEO_FPS = 30;

// H.264 settings to try, best first. Desktop gets High profile at level 5.2; phones usually cannot encode that in real
// time, so the lower rungs trade bitrate (and, through pickVideoLongEdge, resolution) for something the device can do.
export function videoEncoderCandidates(width: number, height: number, framerate: number): VideoEncoderConfig[] {
  const base = [
    { codec: 'avc1.640034', bitrate: 20_000_000, hardwareAcceleration: 'prefer-hardware' as const },
    { codec: 'avc1.4d0033', bitrate: 12_000_000, hardwareAcceleration: 'no-preference' as const },
    { codec: 'avc1.4d0028', bitrate: 8_000_000, hardwareAcceleration: 'no-preference' as const },
  ];
  // Each rung is offered twice: asking for MP4-style output ('avc', which carries the stream description the muxer
  // needs) first, then without the field for encoders that reject it.
  return base.flatMap(b => [
    { ...b, width, height, framerate, avc: { format: 'avc' as const } },
    { ...b, width, height, framerate },
  ]);
}

// A phone records at about its own screen's resolution: 4K frames are more than its memory and encoder keep up with.
export const PHONE_VIDEO_MAX_EDGE = 2560;

export const VIDEO_EDGE_LADDER = [3840, 2560, 1920, 1280];

// The render multiplier that puts the canvas's long edge at `longEdge`, nudged until both sides come out even
// (H.264 needs even dimensions).
export function evenVideoScale(cssW: number, cssH: number, longEdge: number): number {
  const long = Math.max(cssW, cssH);
  let mult = Math.min(longEdge / long, EXPORT_MAX_EDGE / long);
  for (let k = 0; k < 60; k++, mult += 0.0007) {
    if (Math.floor(cssW * mult) % 2 === 0 && Math.floor(cssH * mult) % 2 === 0) break;
  }
  return mult;
}

// Picks the largest ladder size whose output the encoder supports. `supports` is asked about the real output size.
// With no way to ask (no WebCodecs: the software fallback is far slower) it stays small.
export async function pickVideoMultiplier(
  cssW: number, cssH: number,
  supports: ((w: number, h: number) => Promise<boolean>) | null,
  maxEdge = Infinity,
): Promise<number> {
  if (!supports) return evenVideoScale(cssW, cssH, VIDEO_EDGE_LADDER[VIDEO_EDGE_LADDER.length - 1]);
  for (const edge of VIDEO_EDGE_LADDER.filter(e => e <= maxEdge)) {
    const mult = evenVideoScale(cssW, cssH, edge);
    let ok = false;
    try { ok = await supports(Math.floor(cssW * mult), Math.floor(cssH * mult)); } catch { ok = false; }
    if (ok) return mult;
  }
  return evenVideoScale(cssW, cssH, VIDEO_EDGE_LADDER[VIDEO_EDGE_LADDER.length - 1]);
}
