import { useCallback, useEffect, useRef, useState } from 'react';
import { GIFEncoder } from 'gifenc';
import { quantizeFrame } from '../utils/gifDither';
import { centerCrop } from '../constants/exportOptions';
import { isTouchPlatform } from '../utils/touchPlatform';
import type { VideoResult } from '../components/VideoResultDialog';
import type { GifWorkerRequest, GifWorkerResponse } from './gifEncodeWorker';

// Downscale target for the encoded GIF — full-canvas-resolution GIFs (this
// app's canvas is often 1000px+ wide) would make quantize()/applyPalette()
// slow enough per frame to stall the capture loop, and produce multi-tens-
// of-MB files for something meant to be a quick shareable clip. 720px wide
// keeps phone-screen clips sharp. The clip is shaped like this device's screen (the same shape as Save PNG).
const MAX_GIF_WIDTH = 720;
const GIF_FPS = 15;
const FRAME_DELAY = 1000 / GIF_FPS;
// No duration cap existed at all — a long recording just kept quantizing
// and appending frames to the in-memory GIF encoder indefinitely. Shorter
// than video's 10-minute cap (useVCRPlayback.ts): a GIF is meant to be a
// quick shareable clip, and at GIF_FPS/MAX_GIF_WIDTH this still bounds the
// file to a size that's actually shareable.
const MAX_GIF_RECORDING_MS = 2 * 60 * 1000;

export interface UseGifExportParams {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

// Toggle-style recording, matching Record Video's press-to-start /
// press-to-stop model rather than a fixed short duration — a fixed 3-6s
// auto-capture finished (and reverted the button to its idle state) fast
// enough that pressing it looked like it silently did nothing. Frames are
// quantized and written to the GIF incrementally as they're captured, so
// stopping just closes out the encoder rather than kicking off a separate
// heavy encoding pass.
export function useGifExport({ canvasRef }: UseGifExportParams) {
  const [isRecordingGif, setIsRecordingGif] = useState(false);
  const [isFinalizingGif, setIsFinalizingGif] = useState(false);
  const [gifResult, setGifResult] = useState<VideoResult | null>(null);
  // Read inside the capture loop instead of isRecordingGif directly — state
  // updates aren't synchronous with the click that requests a stop, so the
  // loop would otherwise capture at least one extra frame (or more, if
  // several frames land in the same render tick) after the user stopped it.
  const isRecordingRef = useRef(false);
  const workerRef = useRef<Worker | null>(null);
  const workerFailedRef = useRef(false);

  // quantize()/applyPalette() (gifenc) previously ran synchronously in the
  // capture loop below, on the main thread — CPU-heavy enough per frame
  // (full downscaled-canvas color quantization) to visibly stutter the
  // live render, which shares that same thread, for the whole recording.
  // Moved into gifEncodeWorker.ts; this only falls back to the old
  // synchronous path if a Worker genuinely isn't available (very old
  // browser, or the worker script itself failed to load).
  const getWorker = useCallback((): Worker | null => {
    if (workerFailedRef.current) return null;
    if (!workerRef.current) {
      try {
        workerRef.current = new Worker(new URL('./gifEncodeWorker.ts', import.meta.url), { type: 'module' });
      } catch (err) {
        console.error('GIF encode worker unavailable, falling back to main thread:', err);
        workerFailedRef.current = true;
        return null;
      }
    }
    return workerRef.current;
  }, []);

  // The worker was created lazily on first use but never torn down — it
  // stayed alive as a dedicated thread for the component's entire lifetime
  // even if GIF export was only ever used once. Terminate it on unmount.
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const toggleGifRecording = useCallback(async () => {
    if (isRecordingRef.current) {
      isRecordingRef.current = false;
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    isRecordingRef.current = true;
    setIsRecordingGif(true);

    // No warning existed before closing/reloading the tab mid-recording —
    // every captured frame was silently discarded. Browsers ignore custom
    // returnValue text and show their own generic prompt, but the
    // tab-close IS interceptable now.
    const onBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', onBeforeUnload);

    try {
      const recordingStart = performance.now();
      // The centered region of the canvas shaped like the device's screen, scaled down to the width cap.
      const crop = centerCrop(canvas.width, canvas.height, window.screen.width / Math.max(1, window.screen.height));
      const scale = Math.min(1, MAX_GIF_WIDTH / crop.w);
      const width = Math.max(1, Math.round(crop.w * scale));
      const height = Math.max(1, Math.round(crop.h * scale));

      const scratch = document.createElement('canvas');
      scratch.width = width;
      scratch.height = height;
      const scratchCtx = scratch.getContext('2d', { willReadFrequently: true })!;

      const worker = getWorker();
      // Fallback encoder — only ever touched when `worker` is null.
      const fallbackGif = worker ? null : GIFEncoder();
      let frameCount = 0;

      if (worker) worker.postMessage({ type: 'start' } as GifWorkerRequest);

      // Sends one frame's raw pixels off to the worker and waits for its
      // ack before returning — the capture loop below always awaits this,
      // so at most one frame is ever in flight, the same one-at-a-time
      // ordering the old synchronous loop had for free. Messages are
      // strictly request-then-response per call (never overlapping), so a
      // plain onmessage reassignment per call is enough — no need to
      // correlate multiple in-flight requests.
      const encodeFrame = (data: Uint8ClampedArray): Promise<void> => {
        if (!worker) {
          const { palette, index } = quantizeFrame(data, width, height);
          fallbackGif!.writeFrame(index, width, height, { palette, delay: FRAME_DELAY });
          return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
          worker.onmessage = (e: MessageEvent<GifWorkerResponse>) => {
            if (e.data.type === 'frameDone') resolve();
            else if (e.data.type === 'error') reject(new Error(e.data.message));
          };
          const buffer = data.buffer as ArrayBuffer;
          worker.postMessage({ type: 'frame', buffer, width, height, delay: FRAME_DELAY } as GifWorkerRequest, [buffer]);
        });
      };

      while (isRecordingRef.current) {
        if (performance.now() - recordingStart >= MAX_GIF_RECORDING_MS) {
          console.warn(`GIF recording auto-stopped after reaching the ${MAX_GIF_RECORDING_MS / 60000}-minute cap.`);
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, FRAME_DELAY));
        if (!isRecordingRef.current) break;
        scratchCtx.drawImage(canvas, crop.x, crop.y, crop.w, crop.h, 0, 0, width, height);
        const { data } = scratchCtx.getImageData(0, 0, width, height);
        await encodeFrame(data);
        frameCount++;
      }

      setIsRecordingGif(false);
      setIsFinalizingGif(true);

      if (frameCount > 0) {
        let bytes: Uint8Array;
        if (worker) {
          bytes = await new Promise<Uint8Array>((resolve, reject) => {
            worker.onmessage = (e: MessageEvent<GifWorkerResponse>) => {
              if (e.data.type === 'finished') resolve(e.data.bytes);
              else if (e.data.type === 'error') reject(new Error(e.data.message));
            };
            worker.postMessage({ type: 'finish' } as GifWorkerRequest);
          });
        } else {
          fallbackGif!.finish();
          bytes = fallbackGif!.bytes();
        }
        const blob = new Blob([bytes as BlobPart], { type: 'image/gif' });
        const url = URL.createObjectURL(blob);
        const name = `wav-${Date.now()}.gif`;
        if (isTouchPlatform()) {
          // Phones drop a download started by script after a long encode; a dialog gives a tap to save or share.
          setGifResult({ kind: 'ready', media: 'gif', url, blob, name });
        } else {
          const link = document.createElement('a');
          link.href = url;
          link.download = name;
          link.click();
          URL.revokeObjectURL(url);
        }
      }
    } catch (err) {
      console.error('GIF export failed:', err);
      setGifResult({ kind: 'error', message: 'The GIF could not be saved on this device.' });
    } finally {
      window.removeEventListener('beforeunload', onBeforeUnload);
      isRecordingRef.current = false;
      setIsRecordingGif(false);
      setIsFinalizingGif(false);
    }
  }, [canvasRef, getWorker]);

  const clearGifResult = useCallback(() => {
    setGifResult(prev => { if (prev?.kind === 'ready') URL.revokeObjectURL(prev.url); return null; });
  }, []);

  return { isRecordingGif, isFinalizingGif, toggleGifRecording, gifResult, clearGifResult };
}
