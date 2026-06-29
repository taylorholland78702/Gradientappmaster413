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
}

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
  } = params;

  // State
  const [isVCRRecording, setIsVCRRecording] = useState(false);
  const [isVCRPlaying, setIsVCRPlaying] = useState(false);
  const [vcrRecordedFrames, setVcrRecordedFrames] = useState<RecordingFrame[]>([]);
  const [vcrPlaybackSpeed, setVcrPlaybackSpeed] = useState(1);
  const [vcrLoop, setVcrLoop] = useState(false);
  const [vcrPlaybackIndex, setVcrPlaybackIndex] = useState(0);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingAnimationRef = useRef<number | null>(null);
  const recordCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const vcrRecordingStartTime = useRef<number>(0);
  const vcrPlaybackStartTime = useRef<number>(0);
  // MP4 encoding refs
  const mp4MuxerRef = useRef<Muxer<ArrayBufferTarget> | null>(null);
  const videoEncoderRef = useRef<VideoEncoder | null>(null);
  const mp4FrameCountRef = useRef(0);
  const mp4RafRef = useRef<number | null>(null);
  const mp4StartTimeRef = useRef<number>(0);

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

  // Functions
  const startRecording = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use WebCodecs + mp4-muxer if available (Chrome 94+, Edge 94+)
    if (typeof VideoEncoder !== 'undefined') {
      const width = canvas.width;
      const height = canvas.height;
      // Width/height must be even for H.264
      const w = width % 2 === 0 ? width : width - 1;
      const h = height % 2 === 0 ? height : height - 1;

      const target = new ArrayBufferTarget();
      const muxer = new Muxer({ target, video: { codec: 'avc', width: w, height: h }, fastStart: 'in-memory' });
      mp4MuxerRef.current = muxer;
      mp4FrameCountRef.current = 0;
      mp4StartTimeRef.current = performance.now();

      const encoder = new VideoEncoder({
        output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
        error: (e) => console.error('VideoEncoder error', e),
      });
      encoder.configure({ codec: 'avc1.42001f', width: w, height: h, bitrate: 8_000_000, framerate: 30 });
      videoEncoderRef.current = encoder;

      const captureFrame = () => {
        if (!videoEncoderRef.current || videoEncoderRef.current.state === 'closed') return;
        const timestamp = Math.round((performance.now() - mp4StartTimeRef.current) * 1000); // µs
        const frame = new VideoFrame(canvas, { timestamp });
        const keyFrame = mp4FrameCountRef.current % 60 === 0;
        videoEncoderRef.current.encode(frame, { keyFrame });
        frame.close();
        mp4FrameCountRef.current++;
        mp4RafRef.current = requestAnimationFrame(captureFrame);
      };
      mp4RafRef.current = requestAnimationFrame(captureFrame);
      setIsRecording(true);
      return;
    }

    // Fallback: WebM via MediaRecorder
    recordedChunksRef.current = [];
    const stream = canvas.captureStream(30);
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gradient-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    };
    mediaRecorder.start();
    setIsRecording(true);
  }, [canvasRef]);

  const stopRecording = useCallback(async () => {
    // MP4 path
    if (videoEncoderRef.current && videoEncoderRef.current.state !== 'closed') {
      if (mp4RafRef.current !== null) cancelAnimationFrame(mp4RafRef.current);
      await videoEncoderRef.current.flush();
      videoEncoderRef.current.close();
      videoEncoderRef.current = null;
      mp4MuxerRef.current?.finalize();
      const { buffer } = mp4MuxerRef.current!.target as ArrayBufferTarget;
      const blob = new Blob([buffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gradient-${Date.now()}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
      mp4MuxerRef.current = null;
      setIsRecording(false);
      return;
    }

    // WebM fallback path
    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
      const stream = mediaRecorder.stream;
      if (stream) stream.getTracks().forEach(track => track.stop());
    }
  }, []);

  const toggleVCRRecording = useCallback(async () => {
    if (isRecording) {
      await stopRecording();
      setIsVCRRecording(false);
    } else {
      await startRecording();
      setIsVCRRecording(true);
    }
  }, [isRecording, startRecording, stopRecording]);

  const toggleVCRPlayback = useCallback(() => {
    // Stop/Play toggle button — never touches recording state
    if (isVCRPlaying || isAutoMode) {
      setIsVCRRecording(false);
      setIsVCRPlaying(false);
      setVcrPlaybackIndex(0);
      setIsAutoMode(false);
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

  const handleStop = useCallback(async () => {
    setIsVCRRecording(false);
    setIsVCRPlaying(false);
    setVcrPlaybackIndex(0);
    await stopRecording();
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
