import { useState, useEffect, useCallback, useRef, type RefObject } from 'react';
import { videoEncoderCandidates, VIDEO_FPS } from '../utils/videoEncoding';
import { isTouchPlatform } from '../utils/touchPlatform';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

export interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

export interface RecordingFrame {
  colors: ColorRGB[];
  angle: number;
  zoom: number;
  timestamp: number;
}

export interface UseVCRPlaybackParams {
  isRecording: boolean;
  setIsRecording: (v: boolean) => void;
  isAutoMode: boolean;
  setIsAutoMode: (v: boolean) => void;
  setTargetColors: (updater: (prev: ColorRGB[]) => ColorRGB[]) => void;
  setTargetAngle: (updater: (prev: number) => number) => void;
  setTargetZoom: (updater: (prev: number) => number) => void;
  gradientColors: ColorRGB[];
  gradientAngle: number;
  zoom: number;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  setIsAudioEnabled: (v: boolean) => void;
  audioRef: RefObject<HTMLAudioElement | null>;
  audioContextRef: RefObject<AudioContext | null>;
  analyserRef: RefObject<AnalyserNode | null>;
  streamRef: RefObject<MediaStream | null>;
  audioFile: string | null;
}

const CAPTURE_FPS = VIDEO_FPS;
const AUDIO_SAMPLE_RATE = 48_000;
const AUDIO_CHANNELS = 2;
const FRAME_INTERVAL_MS = 1000 / CAPTURE_FPS;
// Recording had no duration cap at all — vcrRecordedFrames (metadata,
// growing 20x/sec), ffmpeg's frameDataRef (raw JPEGs, one per captured
// frame), and WebCodecs' in-memory ArrayBufferTarget all grow unbounded for
// as long as Record stays on, risking OOM/a crashed tab on a long session.
// 10 minutes is generous for what this feature is actually for (a
// shareable clip), while bounding the worst case.
const MAX_RECORDING_MS = 10 * 60 * 1000;

export function useVCRPlayback(params: UseVCRPlaybackParams) {
  const {
    isRecording,
    setIsRecording,
    isAutoMode,
    setIsAutoMode,
    setTargetColors,
    setTargetAngle,
    setTargetZoom,
    gradientColors,
    gradientAngle,
    zoom,
    canvasRef,
    setIsAudioEnabled,
    audioRef,
    audioContextRef,
    analyserRef,
    streamRef,
    audioFile,
  } = params;

  // State
  const [isVCRRecording, setIsVCRRecording] = useState(false);
  const [isVCRPlaying, setIsVCRPlaying] = useState(false);
  const [vcrRecordedFrames, setVcrRecordedFrames] = useState<RecordingFrame[]>([]);
  const [vcrPlaybackSpeed, setVcrPlaybackSpeed] = useState(1);
  const [vcrPlaybackIndex, setVcrPlaybackIndex] = useState(0);
  const [isEncoding, setIsEncoding] = useState(false);
  const [encodingProgress, setEncodingProgress] = useState(0);
  // The finished take. Desktops download it straight away; phones show it in a dialog so a tap can save or share it
  // (a script-triggered download after a long encode is dropped there). An error shows the same way, never silently.
  const [videoResult, setVideoResult] = useState<
    { kind: 'ready'; url: string; blob: Blob; name: string } | { kind: 'error'; message: string } | null
  >(null);
  const encoderErrorRef = useRef<string | null>(null);
  const hasAudioTrackRef = useRef(false);
  // What the video encoder actually produced, so a failed export can say why instead of guessing.
  const encoderStatsRef = useRef({ framesIn: 0, chunksOut: 0, sawDecoderConfig: false });

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingAnimationRef = useRef<number | null>(null);
  const recordCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const vcrRecordingStartTime = useRef<number>(0);
  const vcrPlaybackStartTime = useRef<number>(0);
  const mp4RafRef = useRef<number | null>(null);
  const isRecordingRef = useRef(false);
  // startRecording is async (it awaits VideoEncoder.isConfigSupported for
  // each candidate config before either encoder path sets isRecordingRef
  // true) — a second click on Record before that resolves saw
  // isRecordingRef.current still false and called startRecording() again,
  // potentially standing up two encoders/muxers against the same canvas.
  // This flag closes that window: set synchronously the instant a start is
  // requested, cleared once startRecording actually settles either way.
  const isStartingRecordingRef = useRef(false);

  // ffmpeg frame capture refs
  const ffmpegRef = useRef<import('@ffmpeg/ffmpeg').FFmpeg | null>(null);
  const frameDataRef = useRef<Uint8Array[]>([]);
  const isCapturingRef = useRef(false);
  const captureRafRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef(0);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);

  // WebCodecs capture refs — video is hardware-encoded live during recording
  // instead of relayed through JPEG frames + ffmpeg.wasm after the fact, so
  // the post-stop wait is just a quick flush instead of a full re-encode.
  const videoEncoderRef = useRef<VideoEncoder | null>(null);
  const muxerRef = useRef<Muxer<ArrayBufferTarget> | null>(null);
  const videoFrameIndexRef = useRef(0);
  const usingWebCodecsRef = useRef(false);
  // First rAF timestamp of the current recording — frame PTS is measured
  // from this, not from frame count, so the exported video's timeline
  // always matches real elapsed time (see startRecordingWebCodecs).
  const recordingStartTimestampRef = useRef(0);

  // VCR Recording effect
  useEffect(() => {
    if (!isVCRRecording) return;
    if (vcrRecordedFrames.length === 0) {
      vcrRecordingStartTime.current = Date.now();
    }
    const interval = setInterval(() => {
      const frame = {
        colors: [...gradientColors],
        angle: gradientAngle,
        zoom: zoom,
        timestamp: Date.now() - vcrRecordingStartTime.current
      };
      setVcrRecordedFrames(prev => [...prev, frame]);
    }, 50);
    return () => clearInterval(interval);
  }, [isVCRRecording, gradientColors, gradientAngle, zoom]);

  // VCR Playback effect
  useEffect(() => {
    if (!isVCRPlaying || vcrRecordedFrames.length === 0) return;
    vcrPlaybackStartTime.current = Date.now();
    const playbackInterval = setInterval(() => {
      const elapsed = (Date.now() - vcrPlaybackStartTime.current) * vcrPlaybackSpeed;
      let frameIndex = vcrRecordedFrames.findIndex((frame, i) => {
        const nextFrame = vcrRecordedFrames[i + 1];
        return frame.timestamp <= elapsed && (!nextFrame || nextFrame.timestamp > elapsed);
      });
      if (frameIndex === -1) {
        setIsVCRPlaying(false);
        setVcrPlaybackIndex(0);
        setTargetZoom(() => 1);
        return;
      }
      setVcrPlaybackIndex(frameIndex);
      const frame = vcrRecordedFrames[frameIndex];
      if (frame) {
        setTargetColors(() => frame.colors);
        setTargetAngle(() => frame.angle);
        setTargetZoom(() => frame.zoom);
      }
    }, 50);
    return () => clearInterval(playbackInterval);
  }, [isVCRPlaying, vcrRecordedFrames, vcrPlaybackSpeed]);

  const loadFFmpeg = useCallback(async () => {
    if (ffmpegRef.current) return ffmpegRef.current;
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const { toBlobURL } = await import('@ffmpeg/util');
    const ffmpeg = new FFmpeg();
    // The multi-threaded core runs the encode across several worker threads via
    // SharedArrayBuffer, which is several times faster than the single-threaded
    // core — but it only works when the page is cross-origin isolated (COOP/COEP
    // headers, set in vite.config.ts and vercel.json). Fall back otherwise.
    const useMultiThread = typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated;
    const base = useMultiThread
      ? 'https://unpkg.com/@ffmpeg/core-mt@0.12.10/dist/esm'
      : 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm'),
      ...(useMultiThread ? { workerURL: await toBlobURL(`${base}/ffmpeg-core.worker.js`, 'text/javascript') } : {}),
    });
    ffmpegRef.current = ffmpeg;
    return ffmpeg;
  }, []);

  const deliverVideo = useCallback((blob: Blob) => {
    const name = `wav-${Date.now()}.mp4`;
    const url = URL.createObjectURL(blob);
    if (isTouchPlatform()) {
      setVideoResult({ kind: 'ready', url, blob, name });
      return;
    }
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const clearVideoResult = useCallback(() => {
    setVideoResult(prev => { if (prev?.kind === 'ready') URL.revokeObjectURL(prev.url); return null; });
  }, []);

  const startAudioCapture = useCallback((): boolean => {
    try {
      let audioStream: MediaStream | null = null;
      if (audioFile && audioContextRef.current && analyserRef.current) {
        const dest = audioContextRef.current.createMediaStreamDestination();
        analyserRef.current.connect(dest);
        if (dest.stream.getAudioTracks().length > 0) audioStream = dest.stream;
      } else if (streamRef.current) {
        const tracks = streamRef.current.getAudioTracks();
        if (tracks.length > 0) audioStream = new MediaStream(tracks);
      }
      if (audioStream) {
        // Safari records audio/mp4, not webm.
        const audioMime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find(m => MediaRecorder.isTypeSupported(m));
        const ar = new MediaRecorder(audioStream, audioMime ? { mimeType: audioMime } : undefined);
        ar.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
        ar.start();
        audioRecorderRef.current = ar;
        return true;
      }
    } catch (err) {
      console.warn('Audio capture init failed, video only:', err);
    }
    return false;
  }, [audioFile, audioContextRef, analyserRef, streamRef]);

  // Re-encodes a recorded webm/opus audio blob into AAC AudioChunks and feeds
  // them into the given mp4 muxer. Runs after stop, but decoding+encoding audio
  // is cheap relative to video, so this doesn't meaningfully slow the export.
  const muxAudioBlob = useCallback(async (audioBlob: Blob, muxer: Muxer<ArrayBufferTarget>) => {
    const arrayBuf = await audioBlob.arrayBuffer();
    if (typeof AudioEncoder === 'undefined') throw new Error('No audio encoder on this device');
    const audioCtx = new AudioContext({ sampleRate: AUDIO_SAMPLE_RATE });
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuf);
    await audioCtx.close();

    // The muxer's audio track was declared as 48 kHz stereo before the take began; match it (mono is doubled).
    const numberOfChannels = AUDIO_CHANNELS;
    const sampleRate = AUDIO_SAMPLE_RATE;

    await new Promise<void>((resolve, reject) => {
      const encoder = new AudioEncoder({
        output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
        error: reject,
      });
      encoder.configure({
        codec: 'mp4a.40.2',
        sampleRate,
        numberOfChannels,
        bitrate: 192_000,
      });

      const CHUNK_FRAMES = 4096;
      let frameOffset = 0;
      while (frameOffset < audioBuffer.length) {
        const frames = Math.min(CHUNK_FRAMES, audioBuffer.length - frameOffset);
        const planar = new Float32Array(frames * numberOfChannels);
        for (let ch = 0; ch < numberOfChannels; ch++) {
          planar.set(audioBuffer.getChannelData(Math.min(ch, audioBuffer.numberOfChannels - 1)).subarray(frameOffset, frameOffset + frames), ch * frames);
        }
        const audioData = new AudioData({
          format: 'f32-planar',
          sampleRate,
          numberOfFrames: frames,
          numberOfChannels,
          timestamp: (frameOffset / sampleRate) * 1e6,
          data: planar,
        });
        encoder.encode(audioData);
        audioData.close();
        frameOffset += frames;
      }

      encoder.flush().then(() => { encoder.close(); resolve(); }).catch(reject);
    });
  }, []);

  const startRecordingWebCodecs = useCallback((config: VideoEncoderConfig) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Audio first: whether there is any decides if the file gets an audio track (it can't be added afterward).
    audioChunksRef.current = [];
    const hasAudioTrack = startAudioCapture() && typeof AudioEncoder !== 'undefined';
    encoderErrorRef.current = null;
    encoderStatsRef.current = { framesIn: 0, chunksOut: 0, sawDecoderConfig: false };
    hasAudioTrackRef.current = hasAudioTrack;

    const target = new ArrayBufferTarget();
    const muxer = new Muxer({
      target,
      video: {
        codec: 'avc',
        width: canvas.width,
        height: canvas.height,
      },
      ...(hasAudioTrack ? { audio: { codec: 'aac' as const, numberOfChannels: AUDIO_CHANNELS, sampleRate: AUDIO_SAMPLE_RATE } } : {}),
      fastStart: 'in-memory',
    });
    muxerRef.current = muxer;
    videoFrameIndexRef.current = 0;

    const encoder = new VideoEncoder({
      output: (chunk, meta) => {
        encoderStatsRef.current.chunksOut += 1;
        if (meta?.decoderConfig) encoderStatsRef.current.sawDecoderConfig = true;
        try {
          muxer.addVideoChunk(chunk, meta);
        } catch (err) {
          console.error('Muxer rejected a video chunk:', err);
          encoderErrorRef.current = err instanceof Error ? err.message : 'The video could not be packaged';
        }
      },
      error: (err) => { console.error('VideoEncoder error:', err); encoderErrorRef.current = err.message || 'The video encoder stopped'; },
    });
    encoder.configure(config);
    videoEncoderRef.current = encoder;

    isCapturingRef.current = true;
    lastFrameTimeRef.current = 0;
    recordingStartTimestampRef.current = 0;
    isRecordingRef.current = true;
    setIsRecording(true);

    const captureFrame = (timestamp: number) => {
      if (!isCapturingRef.current) return;
      if (timestamp - lastFrameTimeRef.current >= FRAME_INTERVAL_MS) {
        lastFrameTimeRef.current = timestamp;
        if (recordingStartTimestampRef.current === 0) recordingStartTimestampRef.current = timestamp;
        // PTS is measured from real elapsed wall-clock time, not from
        // videoFrameIndexRef * (1/CAPTURE_FPS). That assumed every capture
        // landed exactly one frame-interval apart — under heavy draw load
        // (dense effects, large emoji grids) frames land further apart than
        // that, so fewer of them cover the same real recording duration.
        // Timestamping by index alone squeezed those into a proportionally
        // shorter video timeline, which is exactly why exports played back
        // faster than the real-time preview: same content, less declared
        // duration. Real-elapsed-time timestamps keep the exported
        // duration correct regardless of how many frames actually landed.
        const frameTimestampUs = (timestamp - recordingStartTimestampRef.current) * 1000;
        // A phone's encoder can fall behind a big canvas; skip a frame rather than let the queue grow until it fails.
        if (encoder.encodeQueueSize <= 6) {
          const frame = new VideoFrame(canvas, { timestamp: frameTimestampUs });
          // Keyframe every 2 seconds so the file is seekable without being too big.
          encoder.encode(frame, { keyFrame: videoFrameIndexRef.current % (CAPTURE_FPS * 2) === 0 });
          frame.close();
          videoFrameIndexRef.current += 1;
          encoderStatsRef.current.framesIn += 1;
        }
      }
      captureRafRef.current = requestAnimationFrame(captureFrame);
    };
    captureRafRef.current = requestAnimationFrame(captureFrame);
  }, [canvasRef, setIsRecording, startAudioCapture]);

  const stopRecordingWebCodecs = useCallback(() => {
    isCapturingRef.current = false;
    isRecordingRef.current = false;
    setIsRecording(false);

    if (captureRafRef.current) {
      cancelAnimationFrame(captureRafRef.current);
      captureRafRef.current = null;
    }

    const audioRecorder = audioRecorderRef.current;
    audioRecorderRef.current = null;
    const encoder = videoEncoderRef.current;
    const muxer = muxerRef.current;
    videoEncoderRef.current = null;
    muxerRef.current = null;

    if (!encoder || !muxer) return;
    if (videoFrameIndexRef.current === 0) {
      try { encoder.close(); } catch { /* already closed */ }
      setVideoResult({ kind: 'error', message: 'Nothing was recorded. Try again, and let it run for a few seconds.' });
      return;
    }

    const finalize = async (audioBlob: Blob | null) => {
      setIsEncoding(true);
      setEncodingProgress(0);
      try {
        try {
          await encoder.flush();
        } finally {
          // close() is safe to call regardless of whether flush() succeeded
          // — leaving it out on a thrown flush() leaked the codec resource,
          // accumulating across repeated failed recordings.
          encoder.close();
        }

        if (encoderErrorRef.current) throw new Error(encoderErrorRef.current);
        const stats = encoderStatsRef.current;
        if (stats.chunksOut === 0 || !stats.sawDecoderConfig) {
          throw new Error(`this device's video encoder returned no usable video (${stats.framesIn} frames in, ${stats.chunksOut} out, ${stats.sawDecoderConfig ? 'with' : 'without'} stream info)`);
        }

        // Sound is a bonus: if it can't be added the take still exports, without it.
        if (hasAudioTrackRef.current && audioBlob && audioBlob.size > 1000) {
          setEncodingProgress(50);
          try {
            await muxAudioBlob(audioBlob, muxer);
          } catch (err) {
            console.warn('Audio could not be added, exporting video only:', err);
          }
        }

        muxer.finalize();
        const { buffer } = muxer.target as ArrayBufferTarget;
        deliverVideo(new Blob([buffer], { type: 'video/mp4' }));
      } catch (err) {
        console.error('WebCodecs export failed:', err);
        setVideoResult({ kind: 'error', message: `The video could not be saved (${err instanceof Error ? err.message : 'unknown error'}).` });
      } finally {
        setIsEncoding(false);
        setEncodingProgress(0);
      }
    };

    if (audioRecorder && audioRecorder.state !== 'inactive') {
      audioRecorder.onstop = () => {
        const audioBlob = audioChunksRef.current.length > 0
          ? new Blob(audioChunksRef.current, { type: 'audio/webm' })
          : null;
        audioChunksRef.current = [];
        finalize(audioBlob);
      };
      audioRecorder.stop();
    } else {
      finalize(null);
    }
  }, [setIsRecording, muxAudioBlob]);

  const startRecordingFFmpeg = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    frameDataRef.current = [];
    audioChunksRef.current = [];
    isCapturingRef.current = true;
    lastFrameTimeRef.current = 0;
    isRecordingRef.current = true;
    setIsRecording(true);

    startAudioCapture();

    // Capture video frames via RAF. ffmpeg encodes this sequence of images
    // at a fixed -framerate, so frame COUNT is what determines the exported
    // duration — if draw work is heavy enough that real time between
    // captures exceeds FRAME_INTERVAL_MS, a single "if" here would silently
    // drop frames, shrinking the declared duration below the real recording
    // time and playing back faster than the live preview. The while loop
    // below pushes one duplicate capture per missed interval to keep frame
    // count in lockstep with real elapsed time (capped per tick so a long
    // stall, e.g. a backgrounded tab, catches up over a few frames instead
    // of one giant burst).
    const captureFrame = (timestamp: number) => {
      if (!isCapturingRef.current) return;
      if (lastFrameTimeRef.current === 0) lastFrameTimeRef.current = timestamp;
      let caughtUp = 0;
      while (timestamp - lastFrameTimeRef.current >= FRAME_INTERVAL_MS && caughtUp < CAPTURE_FPS) {
        lastFrameTimeRef.current += FRAME_INTERVAL_MS;
        caughtUp += 1;
        canvas.toBlob((blob) => {
          if (blob && isCapturingRef.current) {
            blob.arrayBuffer().then(buf => {
              frameDataRef.current.push(new Uint8Array(buf));
            });
          }
        }, 'image/jpeg', 0.93);
      }
      captureRafRef.current = requestAnimationFrame(captureFrame);
    };
    captureRafRef.current = requestAnimationFrame(captureFrame);
  }, [canvasRef, setIsRecording, startAudioCapture]);

  const stopRecordingFFmpeg = useCallback(() => {
    isCapturingRef.current = false;
    isRecordingRef.current = false;
    setIsRecording(false);

    if (captureRafRef.current) {
      cancelAnimationFrame(captureRafRef.current);
      captureRafRef.current = null;
    }

    // Stop audio recorder and wait for final data
    const audioRecorder = audioRecorderRef.current;
    audioRecorderRef.current = null;

    const frames = [...frameDataRef.current];
    frameDataRef.current = [];

    if (frames.length === 0) return;

    const encodeVideo = async (audioBlob: Blob | null) => {
      setIsEncoding(true);
      setEncodingProgress(0);

      const hasAudio = !!(audioBlob && audioBlob.size > 1000);
      try {
        const ffmpeg = await loadFFmpeg();

        ffmpeg.on('progress', ({ progress }: { progress: number }) => {
          setEncodingProgress(Math.round(progress * 100));
        });

        try {
          // Write video frames — parallelized since each goes to a distinct file in
          // ffmpeg's virtual FS, so there's no need to wait on them one at a time.
          await Promise.all(frames.map((frame, i) =>
            ffmpeg.writeFile(`f${String(i).padStart(5, '0')}.jpg`, frame)
          ));

          if (hasAudio) {
            const audioBuf = new Uint8Array(await audioBlob!.arrayBuffer());
            await ffmpeg.writeFile('audio.webm', audioBuf);
          }

          const outputArgs = [
            '-framerate', String(CAPTURE_FPS),
            '-i', 'f%05d.jpg',
            ...(hasAudio ? ['-i', 'audio.webm'] : []),
            '-c:v', 'libx264',
            '-crf', '20',
            '-preset', 'ultrafast',
            '-threads', '0',
            '-pix_fmt', 'yuv420p',
            ...(hasAudio ? ['-c:a', 'aac', '-b:a', '192k', '-shortest'] : []),
            '-movflags', '+faststart',
            'out.mp4',
          ];

          await ffmpeg.exec(outputArgs);

          const data = await ffmpeg.readFile('out.mp4') as Uint8Array;
          deliverVideo(new Blob([data as BlobPart], { type: 'video/mp4' }));
        } finally {
          // Clean up ffmpeg FS regardless of success or failure — this used
          // to only run after a full success, so any failure partway
          // through (a bad writeFile, a failed exec) left that recording's
          // JPEG frames orphaned in the ffmpeg instance's virtual FS, which
          // is cached and reused across recordings (loadFFmpeg above) —
          // repeated failures accumulated indefinitely for the tab's life.
          // deleteFile on a file that was never written just rejects, which
          // each inner try/catch already swallows.
          for (let i = 0; i < frames.length; i++) {
            try { await ffmpeg.deleteFile(`f${String(i).padStart(5, '0')}.jpg`); } catch { /* ok */ }
          }
          try { await ffmpeg.deleteFile('out.mp4'); } catch { /* ok */ }
          if (hasAudio) { try { await ffmpeg.deleteFile('audio.webm'); } catch { /* ok */ } }
        }
      } catch (err) {
        console.error('FFmpeg encoding failed:', err);
        setVideoResult({ kind: 'error', message: 'The video could not be saved on this device.' });
      } finally {
        setIsEncoding(false);
        setEncodingProgress(0);
      }
    };

    if (audioRecorder && audioRecorder.state !== 'inactive') {
      audioRecorder.onstop = () => {
        const audioBlob = audioChunksRef.current.length > 0
          ? new Blob(audioChunksRef.current, { type: 'audio/webm' })
          : null;
        audioChunksRef.current = [];
        encodeVideo(audioBlob);
      };
      audioRecorder.stop();
    } else {
      encodeVideo(null);
    }
  }, [setIsRecording, loadFFmpeg]);

  // WebCodecs (hardware-accelerated, encodes live during capture) is used when
  // available; ffmpeg.wasm (software, encodes after stop) is the fallback for
  // browsers without VideoEncoder/AudioEncoder support (e.g. older Safari) --
  // or, just as importantly, where the class exists but can't actually
  // deliver the config we ask for. High Profile @ Level 5.2 at 20Mbps with a
  // hardware-preferred encoder (this file's original hardcoded config) is
  // more than most mobile hardware encoders (iOS Safari, Android Chrome)
  // support in real time; calling VideoEncoder.configure() with an
  // unsupported combination throws synchronously, before setIsRecording(true)
  // ever runs, which is why the Record button previously did nothing at all
  // on phones/tablets — no error surfaced, no fallback, just silence.
  // isConfigSupported() lets us probe candidates before committing to one,
  // same feature-detect-then-fall-back shape as the WebGL Reaction-Diffusion
  // path (drawReactionDiffusionGL.ts) uses.
  const startRecording = useCallback(async () => {
    const canvas = canvasRef.current;
    let selectedConfig: VideoEncoderConfig | null = null;

    if (typeof VideoEncoder !== 'undefined' && canvas) {
      // Same ladder the Record button probed when it chose the take's size (desktop first, then what phones can do).
      const candidates = videoEncoderCandidates(canvas.width, canvas.height, CAPTURE_FPS);
      for (const config of candidates) {
        try {
          const support = await VideoEncoder.isConfigSupported(config);
          if (support.supported) { selectedConfig = config; break; }
        } catch {
          // Try the next candidate.
        }
      }
    }

    usingWebCodecsRef.current = !!selectedConfig;
    if (selectedConfig) {
      try {
        startRecordingWebCodecs(selectedConfig);
      } catch (err) {
        console.error('WebCodecs recording failed to start, falling back to ffmpeg:', err);
        usingWebCodecsRef.current = false;
        startRecordingFFmpeg();
      }
    } else {
      startRecordingFFmpeg();
    }
  }, [startRecordingWebCodecs, startRecordingFFmpeg, canvasRef]);

  const stopRecording = useCallback(() => {
    if (usingWebCodecsRef.current) {
      stopRecordingWebCodecs();
    } else {
      stopRecordingFFmpeg();
    }
  }, [stopRecordingWebCodecs, stopRecordingFFmpeg]);

  const toggleVCRRecording = useCallback(() => {
    if (isRecordingRef.current) {
      stopRecording();
      setIsVCRRecording(false);
      return;
    }
    // Still mid-start from a previous click (isRecordingRef isn't true yet
    // — see isStartingRecordingRef's declaration) — ignore this one rather
    // than racing a second startRecording() call against the first.
    if (isStartingRecordingRef.current) return;
    isStartingRecordingRef.current = true;
    setIsVCRRecording(true);
    startRecording().finally(() => { isStartingRecordingRef.current = false; });
  }, [startRecording, stopRecording]);

  const toggleVCRPlayback = useCallback(() => {
    if (isVCRPlaying || isAutoMode) {
      setIsVCRRecording(false);
      setIsVCRPlaying(false);
      setVcrPlaybackIndex(0);
      setIsAutoMode(false);
      setTargetZoom(() => 1);
    } else {
      if (vcrRecordedFrames.length > 0) {
        setIsVCRRecording(false);
        setIsVCRPlaying(true);
        setIsAutoMode(false);
      } else {
        setIsAutoMode(true);
        setIsVCRRecording(false);
        setIsVCRPlaying(false);
      }
    }
  }, [isVCRPlaying, isAutoMode, vcrRecordedFrames.length, setIsAutoMode]);

  const handleStop = useCallback(() => {
    setIsVCRRecording(false);
    setIsVCRPlaying(false);
    setVcrPlaybackIndex(0);
    setTargetZoom(() => 1);
    stopRecording();
    if (audioRef.current) {
      audioRef.current.pause();
      setIsAudioEnabled(false);
    }
  }, [stopRecording, audioRef, setIsAudioEnabled]);

  // Auto-stops a recording at MAX_RECORDING_MS instead of letting it run
  // indefinitely — see that constant's declaration for why. isVCRRecording
  // and the actual video/GIF encoder are always started/stopped together
  // (toggleVCRRecording), so gating on isVCRRecording here covers both;
  // handleStop tears down whichever encoder is actually running.
  useEffect(() => {
    if (!isVCRRecording) return;
    const timer = window.setTimeout(() => {
      console.warn(`Recording auto-stopped after reaching the ${MAX_RECORDING_MS / 60000}-minute cap.`);
      handleStop();
    }, MAX_RECORDING_MS);
    return () => window.clearTimeout(timer);
  }, [isVCRRecording, handleStop]);

  // No warning existed at all before closing/reloading the tab mid-recording
  // — every captured video frame was silently discarded. Standard
  // beforeunload confirmation; browsers ignore custom returnValue text and
  // show their own generic prompt, but the tab-close IS interceptable now.
  // GIF export has its own equivalent guard in useGifExport.ts, since its
  // recording state (isRecordingGif) lives in that separate hook.
  //
  // Also covers isEncoding, not just isVCRRecording: stopRecording flips
  // isVCRRecording off immediately, but the actual export (ffmpeg encode, or
  // WebCodecs flush+mux) keeps running for several more seconds — closing
  // the tab in that window used to lose the whole export silently, right
  // after the user had just finished waiting for the recording itself.
  useEffect(() => {
    if (!isVCRRecording && !isEncoding) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isVCRRecording, isEncoding]);

  // Unmount safety net — nothing previously cancelled the capture rAF loop
  // or closed an in-progress VideoEncoder if this component unmounted mid-
  // recording (a route change, or a remount from an error boundary above
  // it). Left running, the rAF loop keeps firing against a stale canvasRef
  // and the encoder never releases its codec resource. This only fires on
  // actual unmount (empty dep array, cleanup-only effect) — it does not
  // interrupt a normal stop-then-encode flow, which already tears down
  // captureRafRef itself in stopRecordingWebCodecs/stopRecordingFFmpeg.
  useEffect(() => {
    return () => {
      if (captureRafRef.current) {
        cancelAnimationFrame(captureRafRef.current);
        captureRafRef.current = null;
      }
      isCapturingRef.current = false;
      if (videoEncoderRef.current) {
        try {
          if (videoEncoderRef.current.state !== 'closed') videoEncoderRef.current.close();
        } catch { /* already closed/closing */ }
        videoEncoderRef.current = null;
      }
      if (audioRecorderRef.current && audioRecorderRef.current.state !== 'inactive') {
        try { audioRecorderRef.current.stop(); } catch { /* already stopped */ }
        audioRecorderRef.current = null;
      }
    };
  }, []);

  return {
    // State
    isVCRRecording, setIsVCRRecording,
    isVCRPlaying, setIsVCRPlaying,
    vcrRecordedFrames, setVcrRecordedFrames,
    vcrPlaybackSpeed, setVcrPlaybackSpeed,
    vcrPlaybackIndex, setVcrPlaybackIndex,
    isEncoding, encodingProgress,
    videoResult, clearVideoResult,
    // Refs
    mediaRecorderRef,
    recordedChunksRef,
    recordingAnimationRef,
    recordCanvasRef,
    vcrRecordingStartTime,
    vcrPlaybackStartTime,
    mp4RafRef,
    // Functions
    startRecording,
    stopRecording,
    toggleVCRRecording,
    toggleVCRPlayback,
    handleStop,
  };
}
