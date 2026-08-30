// Runs oilPaintPixels (see oilPaintPixels.ts) inside a Worker — no
// OffscreenCanvas needed, same as ditherWorker.ts, since Oil Paint is pure
// array math with no Canvas 2D drawing calls. The neighborhood mode-filter
// scan (O(width * height * radius^2)) is the heaviest per-pixel effect in
// the registry, so this always runs off the main thread.
import { oilPaintPixels } from './oilPaintPixels';

export interface OilPaintWorkerRequest {
  buffer: ArrayBuffer;
  displayWidth: number;
  displayHeight: number;
  oilPaintRadius: number;
  oilPaintLevels: number;
}

export interface OilPaintWorkerResponse {
  buffer: ArrayBuffer;
  displayWidth: number;
  displayHeight: number;
}

self.onmessage = (e: MessageEvent<OilPaintWorkerRequest>) => {
  const { buffer, displayWidth, displayHeight, oilPaintRadius, oilPaintLevels } = e.data;
  const data = new Uint8ClampedArray(buffer);
  oilPaintPixels(data, displayWidth, displayHeight, oilPaintRadius, oilPaintLevels);
  const response: OilPaintWorkerResponse = { buffer: data.buffer, displayWidth, displayHeight };
  (self as unknown as Worker).postMessage(response, [response.buffer]);
};
