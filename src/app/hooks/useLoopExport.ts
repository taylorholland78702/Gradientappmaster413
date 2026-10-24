import { useCallback, useRef, useState } from 'react';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { LoopAssembler, planLoop } from '../utils/loopBlend';
import { notify } from '../utils/notify';
import type { GifWorkerRequest, GifWorkerResponse } from './gifEncodeWorker';
import type { useCanvasState } from './state/useCanvasState';

// Looping clip export: records the live canvas for a few seconds and dissolves the end into the start (see
// utils/loopBlend.ts) so it repeats with no visible jump, then saves it as a GIF (which loops by itself) or an
// MP4 (which plays once; players have a loop switch). Frames are encoded as they arrive, so memory stays small.

export type LoopFormat = 'gif' | 'mp4';
export const LOOP_SECONDS = [3, 5, 8] as const;
export type LoopSeconds = typeof LOOP_SECONDS[number];
export type LoopPhase = 'idle' | 'recording' | 'encoding';

const GIF_FPS = 15;
const MP4_FPS = 30;
const GIF_MAX_WIDTH = 560;
const MP4_MAX_WIDTH = 1080;

export const loopSupportsMp4 = () => typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined';

interface Sink {
  write(frame: Uint8ClampedArray): Promise<void>;
  finish(): Promise<Blob>;
  abort(): void;
}

function gifSink(width: number, height: number): Sink {
  const worker = new Worker(new URL('./gifEncodeWorker.ts', import.meta.url), { type: 'module' });
  worker.postMessage({ type: 'start' } as GifWorkerRequest);
  const delay = 1000 / GIF_FPS;
  return {
    write: (frame) => new Promise((resolve, reject) => {
      worker.onmessage = (e: MessageEvent<GifWorkerResponse>) => {
        if (e.data.type === 'frameDone') resolve(); else if (e.data.type === 'error') reject(new Error(e.data.message));
      };
      const buffer = frame.buffer as ArrayBuffer;
      worker.postMessage({ type: 'frame', buffer, width, height, delay } as GifWorkerRequest, [buffer]);
    }),
    finish: () => new Promise<Blob>((resolve, reject) => {
      worker.onmessage = (e: MessageEvent<GifWorkerResponse>) => {
        if (e.data.type === 'finished') { worker.terminate(); resolve(new Blob([e.data.bytes as BlobPart], { type: 'image/gif' })); }
        else if (e.data.type === 'error') { worker.terminate(); reject(new Error(e.data.message)); }
      };
      worker.postMessage({ type: 'finish' } as GifWorkerRequest);
    }),
    abort: () => worker.terminate(),
  };
}

const H264_CANDIDATES = ['avc1.640034', 'avc1.64002A', 'avc1.4d0028', 'avc1.42001f'];

async function mp4Sink(width: number, height: number): Promise<Sink> {
  let config: VideoEncoderConfig | null = null;
  for (const codec of H264_CANDIDATES) {
    const candidate: VideoEncoderConfig = { codec, width, height, bitrate: Math.round(width * height * MP4_FPS * 0.12), framerate: MP4_FPS };
    try { if ((await VideoEncoder.isConfigSupported(candidate)).supported) { config = candidate; break; } } catch { /* try the next */ }
  }
  if (!config) throw new Error('This browser cannot encode H.264 video.');
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({ target, video: { codec: 'avc', width, height }, fastStart: 'in-memory' });
  let failure: Error | null = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => { failure = e instanceof Error ? e : new Error(String(e)); },
  });
  encoder.configure(config);
  let index = 0;
  return {
    async write(frame) {
      if (failure) throw failure;
      const video = new VideoFrame(frame, { format: 'RGBA', codedWidth: width, codedHeight: height, timestamp: Math.round((index * 1e6) / MP4_FPS) });
      encoder.encode(video, { keyFrame: index % MP4_FPS === 0 });
      video.close();
      index++;
      while (encoder.encodeQueueSize > 6) await new Promise(r => setTimeout(r, 4));
    },
    async finish() {
      await encoder.flush();
      if (failure) throw failure;
      encoder.close();
      muxer.finalize();
      return new Blob([target.buffer], { type: 'video/mp4' });
    },
    abort() { try { encoder.close(); } catch { /* already closed */ } },
  };
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

export function useLoopExport({ canvasRef }: { canvasRef: ReturnType<typeof useCanvasState>['canvasRef'] }) {
  const [loopSeconds, setLoopSecondsState] = useState<LoopSeconds>(() => {
    try { const v = Number(localStorage.getItem('loopSeconds')); return (LOOP_SECONDS as readonly number[]).includes(v) ? (v as LoopSeconds) : 5; } catch { return 5; }
  });
  const [loopFormat, setLoopFormatState] = useState<LoopFormat>(() => {
    try { const v = localStorage.getItem('loopFormat'); return v === 'mp4' && loopSupportsMp4() ? 'mp4' : 'gif'; } catch { return 'gif'; }
  });
  const setLoopSeconds = (v: LoopSeconds) => { setLoopSecondsState(v); try { localStorage.setItem('loopSeconds', String(v)); } catch { /* not persisted */ } };
  const setLoopFormat = (v: LoopFormat) => { setLoopFormatState(v); try { localStorage.setItem('loopFormat', v); } catch { /* not persisted */ } };
  const [loopPhase, setLoopPhase] = useState<LoopPhase>('idle');
  const [loopProgress, setLoopProgress] = useState(0);
  const busyRef = useRef(false);
  const cancelRef = useRef(false);

  const cancelLoop = useCallback(() => { cancelRef.current = true; }, []);

  const startLoop = useCallback(async (seconds: LoopSeconds, format: LoopFormat) => {
    const canvas = canvasRef.current;
    if (!canvas || busyRef.current) return;
    busyRef.current = true; cancelRef.current = false;
    setLoopPhase('recording'); setLoopProgress(0);
    const onBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', onBeforeUnload);
    let sink: Sink | null = null;
    try {
      const fps = format === 'gif' ? GIF_FPS : MP4_FPS;
      const plan = planLoop(seconds, fps);
      const maxWidth = format === 'gif' ? GIF_MAX_WIDTH : MP4_MAX_WIDTH;
      const scale = Math.min(1, maxWidth / canvas.width);
      let width = Math.max(2, Math.round(canvas.width * scale));
      let height = Math.max(2, Math.round(canvas.height * scale));
      if (format === 'mp4') { width &= ~1; height &= ~1; }   // H.264 wants even sizes
      const scratch = document.createElement('canvas');
      scratch.width = width; scratch.height = height;
      const ctx = scratch.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('No 2D canvas available.');
      sink = format === 'gif' ? gifSink(width, height) : await mp4Sink(width, height);
      const assembler = new LoopAssembler(plan);
      const start = performance.now();
      for (let k = 0; k < plan.captureFrames; k++) {
        // frames are taken on a fixed schedule, so the loop plays at the speed it was recorded
        const wait = start + (k * 1000) / fps - performance.now();
        if (wait > 0) await sleep(wait);
        if (cancelRef.current) break;
        ctx.drawImage(canvas, 0, 0, width, height);
        const frame = assembler.push(ctx.getImageData(0, 0, width, height).data);
        if (frame) await sink.write(frame);
        setLoopProgress((k + 1) / plan.captureFrames);
      }
      if (cancelRef.current) { sink.abort(); sink = null; notify('Loop cancelled.'); return; }
      setLoopPhase('encoding');
      const blob = await sink.finish();
      sink = null;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `wav-loop-${seconds}s-${Date.now()}.${format}`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify(format === 'gif' ? 'Loop saved.' : 'Loop saved. Turn on Loop in your video player to repeat it.');
    } catch (err) {
      console.error('Loop export failed:', err);
      sink?.abort();
      notify(`Couldn't save the loop${err instanceof Error && err.message ? `: ${err.message}` : '.'}`);
    } finally {
      window.removeEventListener('beforeunload', onBeforeUnload);
      busyRef.current = false;
      setLoopPhase('idle'); setLoopProgress(0);
    }
  }, [canvasRef]);

  return { loopSeconds, setLoopSeconds, loopFormat, setLoopFormat, loopPhase, loopProgress, startLoop, cancelLoop };
}
