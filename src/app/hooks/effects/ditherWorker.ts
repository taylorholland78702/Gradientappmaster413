// Runs ditherPixels (see ditherPixels.ts) inside a Worker — no
// OffscreenCanvas needed here, unlike halftoneWorker.ts/gridEffectWorker.ts,
// since Dither is pure in-place array math with no Canvas 2D drawing calls.
import { ditherPixels } from './ditherPixels';

export interface DitherWorkerRequest {
  buffer: ArrayBuffer;
  displayWidth: number;
  displayHeight: number;
  ditherType: string;
  ditherLevels: number;
  ditherScale: number;
}

export interface DitherWorkerResponse {
  buffer: ArrayBuffer;
  displayWidth: number;
  displayHeight: number;
}

self.onmessage = (e: MessageEvent<DitherWorkerRequest>) => {
  const { buffer, displayWidth, displayHeight, ditherType, ditherLevels, ditherScale } = e.data;
  const data = new Uint8ClampedArray(buffer);
  ditherPixels(data, displayWidth, displayHeight, ditherType, ditherLevels, ditherScale);
  const response: DitherWorkerResponse = { buffer: data.buffer, displayWidth, displayHeight };
  (self as unknown as Worker).postMessage(response, [response.buffer]);
};
