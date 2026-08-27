import { useState, useEffect, useCallback, useRef, type RefObject } from 'react';
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

const CAPTURE_FPS = 30;
const FRAME_INTERVAL_MS = 1000 / CAPTURE_FPS;

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
  const [vcrLoop, setVcrLoop] = useState(false);
  const [vcrPlaybackIndex, setVcrPlaybackIndex] = useState(0);
  const [isEncoding, setIsEncoding] = useState(false);
  const [encodingProgress, setEncodingProgress] = useState(0);

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ffmpegRef = useRef<any>(null);
  const frameDataRef = useRef<Uint8Array[]>([]);
  const isCapturingRef = useRef(false);
  const captureRafRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef(0);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);

  // WebCodecs capture refs — video is hardware-encoded live during recording
  // instead of relayed through JPEG frames + ffmpeg.wasm after the fact, so
  // the post-stop wait is just a quick flush instead of a full re-encode.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const videoEncoderRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const muxerRef = useRef<any>(null);
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
        if (vcrLoop && vcrRecordedFrames.length > 0) {
          vcrPlaybackStartTime.current = Date.now();
          frameIndex = 0;
        } else {
          setIsVCRPlaying(false);
          setVcrPlaybackIndex(0);
          setTargetZoom(() => 1);
          return;
        }
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
  }, [isVCRPlaying, vcrRecordedFrames, vcrPlaybackSpeed, vcrLoop]);

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
        const audioMime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm';
        const ar = new MediaRecorder(audioStream, { mimeType: audioMime });
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const muxAudioBlob = useCallback(async (audioBlob: Blob, muxer: any) => {
    const arrayBuf = await audioBlob.arrayBuffer();
    const audioCtx = new AudioContext();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuf);
    await audioCtx.close();

    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;

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
          planar.set(audioBuffer.getChannelData(ch).subarray(frameOffset, frameOffset + frames), ch * frames);
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startRecordingWebCodecs = useCallback((config: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const target = new ArrayBufferTarget();
    const muxer = new Muxer({
      target,
      video: {
        codec: 'avc',
        width: canvas.width,
        height: canvas.height,
      },
      fastStart: 'in-memory',
    });
    muxerRef.current = muxer;
    videoFrameIndexRef.current = 0;

    const encoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (err) => console.error('VideoEncoder error:', err),
    });
    encoder.configure(config);
    videoEncoderRef.current = encoder;

    audioChunksRef.current = [];
    isCapturingRef.current = true;
    lastFrameTimeRef.current = 0;
    recordingStartTimestampRef.current = 0;
    isRecordingRef.current = true;
    setIsRecording(true);

    startAudioCapture();

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
        const frame = new VideoFrame(canvas, { timestamp: frameTimestampUs });
        // Keyframe every 2 seconds so the file is seekable without being too big.
        encoder.encode(frame, { keyFrame: videoFrameIndexRef.current % (CAPTURE_FPS * 2) === 0 });
        frame.close();
        videoFrameIndexRef.current += 1;
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

    if (!encoder || !muxer || videoFrameIndexRef.current === 0) return;

    const finalize = async (audioBlob: Blob | null) => {
      setIsEncoding(true);
      setEncodingProgress(0);
      try {
        await encoder.flush();
        encoder.close();

        const hasAudio = audioBlob && audioBlob.size > 1000;
        if (hasAudio) {
          setEncodingProgress(50);
          await muxAudioBlob(audioBlob!, muxer);
        }

        muxer.finalize();
        const { buffer } = muxer.target as ArrayBufferTarget;
        const blob = new Blob([buffer], { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wav-${Date.now()}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('WebCodecs export failed:', err);
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

      try {
        const ffmpeg = await loadFFmpeg();

        ffmpeg.on('progress', ({ progress }: { progress: number }) => {
          setEncodingProgress(Math.round(progress * 100));
        });

        // Write video frames — parallelized since each goes to a distinct file in
        // ffmpeg's virtual FS, so there's no need to wait on them one at a time.
        await Promise.all(frames.map((frame, i) =>
          ffmpeg.writeFile(`f${String(i).padStart(5, '0')}.jpg`, frame)
        ));

        const hasAudio = audioBlob && audioBlob.size > 1000;
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
        const blob = new Blob([data], { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wav-${Date.now()}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Clean up ffmpeg FS
        for (let i = 0; i < frames.length; i++) {
          try { await ffmpeg.deleteFile(`f${String(i).padStart(5, '0')}.jpg`); } catch { /* ok */ }
        }
        try { await ffmpeg.deleteFile('out.mp4'); } catch { /* ok */ }
        if (hasAudio) { try { await ffmpeg.deleteFile('audio.webm'); } catch { /* ok */ } }

      } catch (err) {
        console.error('FFmpeg encoding failed:', err);
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let selectedConfig: any = null;

    if (typeof VideoEncoder !== 'undefined' && typeof AudioEncoder !== 'undefined' && canvas) {
      const candidates = [
        // Desktop-tuned: High profile, level 5.2, hardware-preferred, high
        // bitrate — the original config, kept first so desktop (where it's
        // already known to work) picks the same quality as before.
        { codec: 'avc1.640034', width: canvas.width, height: canvas.height, bitrate: 20_000_000, framerate: CAPTURE_FPS, hardwareAcceleration: 'prefer-hardware' as const },
        // Broadly-compatible fallback: Main profile, level 4.0, no hardware
        // preference (let the browser use software encoding if that's all
        // it has), lower bitrate — what mobile encoders can actually do.
        { codec: 'avc1.4d0028', width: canvas.width, height: canvas.height, bitrate: 8_000_000, framerate: CAPTURE_FPS, hardwareAcceleration: 'no-preference' as const },
      ];
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

  return {
    // State
    isVCRRecording, setIsVCRRecording,
    isVCRPlaying, setIsVCRPlaying,
    vcrRecordedFrames, setVcrRecordedFrames,
    vcrPlaybackSpeed, setVcrPlaybackSpeed,
    vcrLoop, setVcrLoop,
    vcrPlaybackIndex, setVcrPlaybackIndex,
    isEncoding, encodingProgress,
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
