import { useState, useEffect, useCallback, useRef, type RefObject } from 'react';

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

  // ffmpeg frame capture refs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ffmpegRef = useRef<any>(null);
  const frameDataRef = useRef<Uint8Array[]>([]);
  const isCapturingRef = useRef(false);
  const captureRafRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef(0);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);

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
    const base = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    ffmpegRef.current = ffmpeg;
    return ffmpeg;
  }, []);

  const startRecording = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    frameDataRef.current = [];
    audioChunksRef.current = [];
    isCapturingRef.current = true;
    lastFrameTimeRef.current = 0;
    isRecordingRef.current = true;
    setIsRecording(true);

    // Capture audio separately via MediaRecorder (audio-only stream)
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
      }
    } catch (err) {
      console.warn('Audio capture init failed, video only:', err);
    }

    // Capture video frames via RAF
    const captureFrame = (timestamp: number) => {
      if (!isCapturingRef.current) return;
      if (timestamp - lastFrameTimeRef.current >= FRAME_INTERVAL_MS) {
        lastFrameTimeRef.current = timestamp;
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
  }, [canvasRef, setIsRecording, audioFile, audioContextRef, analyserRef, streamRef]);

  const stopRecording = useCallback(() => {
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

  const toggleVCRRecording = useCallback(() => {
    if (isRecordingRef.current) {
      stopRecording();
      setIsVCRRecording(false);
    } else {
      startRecording();
      setIsVCRRecording(true);
    }
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
