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
  const startRecording = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
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

  const stopRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
      const stream = mediaRecorder.stream;
      if (stream) stream.getTracks().forEach(track => track.stop());
    }
  }, []);

  const toggleVCRRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
      setIsVCRRecording(false);
    } else {
      startRecording();
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

  const handleStop = useCallback(() => {
    setIsVCRRecording(false);
    setIsVCRPlaying(false);
    setVcrPlaybackIndex(0);
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
    // Refs
    mediaRecorderRef,
    recordedChunksRef,
    recordingAnimationRef,
    recordCanvasRef,
    vcrRecordingStartTime,
    vcrPlaybackStartTime,
    // Functions
    startRecording,
    stopRecording,
    toggleVCRRecording,
    toggleVCRPlayback,
    handleStop,
  };
}
