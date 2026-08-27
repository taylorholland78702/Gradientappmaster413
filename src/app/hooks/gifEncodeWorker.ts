// Runs GIF quantize/applyPalette/writeFrame off the main thread — same
// motivation as ditherWorker.ts/halftoneWorker.ts, but structured as a
// stateful session (start/frame/finish) instead of one-shot request/response,
// since a GIF encoder accumulates state (palette history, written frames)
// across the whole recording rather than processing each frame independently.
import { GIFEncoder, quantize, applyPalette } from 'gifenc';

export type GifWorkerRequest =
  | { type: 'start' }
  | { type: 'frame'; buffer: ArrayBuffer; width: number; height: number; delay: number }
  | { type: 'finish' };

export type GifWorkerResponse =
  | { type: 'frameDone' }
  | { type: 'finished'; bytes: Uint8Array }
  | { type: 'error'; message: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let gif: any = null;

self.onmessage = (e: MessageEvent<GifWorkerRequest>) => {
  const msg = e.data;
  try {
    if (msg.type === 'start') {
      gif = GIFEncoder();
      return;
    }
    if (msg.type === 'frame') {
      if (!gif) gif = GIFEncoder();
      const data = new Uint8ClampedArray(msg.buffer);
      const palette = quantize(data, 256);
      const index = applyPalette(data, palette);
      gif.writeFrame(index, msg.width, msg.height, { palette, delay: msg.delay });
      const response: GifWorkerResponse = { type: 'frameDone' };
      (self as unknown as Worker).postMessage(response);
      return;
    }
    if (msg.type === 'finish') {
      const bytes: Uint8Array = gif ? (gif.finish(), gif.bytes()) : new Uint8Array(0);
      gif = null;
      const response: GifWorkerResponse = { type: 'finished', bytes };
      (self as unknown as Worker).postMessage(response, [bytes.buffer]);
      return;
    }
  } catch (err) {
    const response: GifWorkerResponse = { type: 'error', message: err instanceof Error ? err.message : String(err) };
    (self as unknown as Worker).postMessage(response);
  }
};
