import { EXPORT_MAX_EDGE } from '../constants/exportOptions';

export const VIDEO_FPS = 30;

// The encoder settings to try, best first. Up to 4K it is H.264: High profile at level 5.2 on desktop, and phones usually
// cannot encode that in real time, so the lower rungs trade bitrate (and, through pickVideoMultiplier, resolution) for
// something the device can do. Above 4K H.264 stops (its levels top out around 4096 wide), so 8K asks for HEVC.
// Bitrate follows the frame size (bits per pixel per frame) instead of one flat number, with the old flat rates as a floor,
// so a 4K take gets about 60 Mbps and an 8K one about 120. Gradients and grain are what compress worst, so the budget
// is generous; the 8K frame size itself is the encoder's ceiling (HEVC level 6.2 stops at about 35.6 million pixels).
const MAX_BITRATE = 150_000_000;
const bitrateFor = (width: number, height: number, framerate: number, bitsPerPixel: number, floor = 0) =>
  Math.min(MAX_BITRATE, Math.max(floor, Math.round(width * height * framerate * bitsPerPixel)));

export function videoEncoderCandidates(width: number, height: number, framerate: number): VideoEncoderConfig[] {
  const big = Math.max(width, height) > 4096;
  const base = big
    ? [
        { codec: 'hvc1.1.6.L186.B0', bitrate: bitrateFor(width, height, framerate, 0.12), hardwareAcceleration: 'prefer-hardware' as const },
        { codec: 'hvc1.1.6.L183.B0', bitrate: bitrateFor(width, height, framerate, 0.09), hardwareAcceleration: 'no-preference' as const },
      ]
    : [
        { codec: 'avc1.640034', bitrate: bitrateFor(width, height, framerate, 0.24, 20_000_000), hardwareAcceleration: 'prefer-hardware' as const },
        { codec: 'avc1.4d0033', bitrate: bitrateFor(width, height, framerate, 0.14, 12_000_000), hardwareAcceleration: 'no-preference' as const },
        { codec: 'avc1.4d0028', bitrate: bitrateFor(width, height, framerate, 0.08, 8_000_000), hardwareAcceleration: 'no-preference' as const },
      ];
  // Each rung is offered twice: asking for MP4-style output (which carries the stream description the muxer needs)
  // first, then without the field for encoders that reject it.
  const format = big ? { hevc: { format: 'hevc' as const } } : { avc: { format: 'avc' as const } };
  return base.flatMap(b => [
    { ...b, width, height, framerate, ...format } as VideoEncoderConfig,
    { ...b, width, height, framerate } as VideoEncoderConfig,
  ]);
}

// Which codec family a config produced, for the muxer's video track.
export const videoCodecKind = (codec: string): 'avc' | 'hevc' => (/^(hvc1|hev1)/.test(codec) ? 'hevc' : 'avc');

// A phone goes up to 4K and steps down from there to what its encoder really takes (8K is desktop only).
export const PHONE_VIDEO_MAX_EDGE = 3840;
// What a take asks for unless 8K is chosen.
export const VIDEO_STANDARD_EDGE = 3840;
export const VIDEO_MAX_EDGE = 7680;

export const VIDEO_EDGE_LADDER = [7680, 3840, 2560, 1920, 1280];

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
  maxEdge = VIDEO_STANDARD_EDGE,
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
