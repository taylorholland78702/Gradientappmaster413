import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

// Renders a seamless loop to an MP4, one frame at a time. Not real-time: every frame is drawn,
// grabbed and encoded before the next, so large sizes never drop frames. `drawFrame(phase)` must
// leave the canvas showing the picture at that point (0..1) through the loop.
export interface LoopExportOptions {
  canvas: HTMLCanvasElement;
  seconds: number;
  fps: number;
  drawFrame: (phase: number) => Promise<void>;
  onProgress?: (fraction: number) => void;
  isCancelled?: () => boolean;
}

export const webCodecsAvailable = () => typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined';

// Scale that gives `longEdge` pixels on the long side with an even width and height (H.264 needs both).
export function evenMultiplier(cssW: number, cssH: number, longEdge: number, maxEdge = 8192): number {
  let mult = Math.min(longEdge / Math.max(cssW, cssH), maxEdge / Math.max(cssW, cssH));
  for (let k = 0; k < 60; k++, mult += 0.0007) {
    if (Math.floor(cssW * mult) % 2 === 0 && Math.floor(cssH * mult) % 2 === 0) break;
  }
  return mult;
}

export async function renderLoopToMp4(o: LoopExportOptions): Promise<Blob | null> {
  const { canvas, seconds, fps } = o;
  const width = canvas.width, height = canvas.height;
  const candidates = [
    { codec: 'avc1.640034', width, height, bitrate: Math.min(40_000_000, Math.round(width * height * fps * 0.12)), framerate: fps, hardwareAcceleration: 'prefer-hardware' as const },
    { codec: 'avc1.4d0034', width, height, bitrate: Math.min(25_000_000, Math.round(width * height * fps * 0.08)), framerate: fps, hardwareAcceleration: 'no-preference' as const },
    { codec: 'avc1.4d0028', width, height, bitrate: 8_000_000, framerate: fps, hardwareAcceleration: 'no-preference' as const },
  ];
  let config: (typeof candidates)[number] | null = null;
  for (const c of candidates) {
    try { if ((await VideoEncoder.isConfigSupported(c)).supported) { config = c; break; } } catch { /* try the next */ }
  }
  if (!config) throw new Error('This browser can’t encode H.264 video at this size.');

  const target = new ArrayBufferTarget();
  const muxer = new Muxer({ target, video: { codec: 'avc', width, height }, fastStart: 'in-memory' });
  let encodeError: unknown = null;
  const encoder = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: (e) => { encodeError = e; } });
  encoder.configure(config);

  const frames = Math.max(2, Math.round(seconds * fps));
  for (let i = 0; i < frames; i++) {
    if (o.isCancelled?.()) { encoder.close(); return null; }
    if (encodeError) throw encodeError;
    await o.drawFrame(i / frames);
    const frame = new VideoFrame(canvas, { timestamp: Math.round((i * 1_000_000) / fps), duration: Math.round(1_000_000 / fps) });
    encoder.encode(frame, { keyFrame: i % (fps * 2) === 0 });
    frame.close();
    // Don't let the encoder's queue grow without bound at large sizes.
    while (encoder.encodeQueueSize > 8) await new Promise(r => setTimeout(r, 4));
    o.onProgress?.((i + 1) / frames);
  }
  await encoder.flush();
  encoder.close();
  if (encodeError) throw encodeError;
  muxer.finalize();
  return new Blob([target.buffer], { type: 'video/mp4' });
}
