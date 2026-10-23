import { useCallback, useEffect, useRef, useState } from 'react';
import type { GradientType } from '../constants/gradientEffects';
import { STYLE_FIELD_GRADIENT_TYPES } from '../constants/gradientEffects';
import {
  type ExportSize, type ExportAspect, EXPORT_SIZES, EXPORT_ASPECTS,
  type VideoSize, type VideoLength, VIDEO_SIZES, VIDEO_LENGTHS,
  type LoopSeconds, LOOP_LENGTHS, EXPORT_MAX_EDGE, EXPORT_MAX_PIXELS,
} from '../constants/exportOptions';
import { renderLoopToMp4, evenMultiplier, webCodecsAvailable } from '../utils/loopExport';
import { loopRender } from './gradients/drawStyleFieldGL';
import { exportRender } from './useCanvasDraw';
import { encodePresetData } from '../utils/presetShare';
import { haptic } from '../utils/haptics';
import type { useCanvasState } from './state/useCanvasState';
import type { useMiscState } from './state/useMiscState';

type MiscState = ReturnType<typeof useMiscState>;

// Everything behind the Save & share popout: PNG / video-take / seamless-loop export and the
// copy-to-clipboard share buttons, with their persisted settings.
export function useExportControls({
  canvasRef, drawParamsDirtyRef, buildSnapshot, isRecording, toggleVCRRecording,
  isAutoColorRef, isAutoModeRef, setIsAutoColor, setIsAutoMode, isAutoShuffleOn, setIsAutoShuffleOn,
  vcrPlaybackSpeedRef, animValuesRef, gradientType,
}: {
  canvasRef: ReturnType<typeof useCanvasState>['canvasRef'];
  drawParamsDirtyRef: MiscState['drawParamsDirtyRef'];
  buildSnapshot: () => unknown;
  isRecording: boolean;
  toggleVCRRecording: () => void;
  isAutoColorRef: MiscState['isAutoColorRef'];
  isAutoModeRef: MiscState['isAutoModeRef'];
  setIsAutoColor: MiscState['setIsAutoColor'];
  setIsAutoMode: MiscState['setIsAutoMode'];
  isAutoShuffleOn: boolean;
  setIsAutoShuffleOn: (v: boolean | ((prev: boolean) => boolean)) => void;
  vcrPlaybackSpeedRef: MiscState['vcrPlaybackSpeedRef'];
  animValuesRef: MiscState['animValuesRef'];
  gradientType: MiscState['gradientType'];
}) {
  const [exportSize, setExportSizeState] = useState<ExportSize>(() => {
    try { const v = localStorage.getItem('exportSize'); return EXPORT_SIZES.some(o => o.id === v) ? (v as ExportSize) : 'screen'; } catch { return 'screen'; }
  });
  const [exportAspect, setExportAspectState] = useState<ExportAspect>(() => {
    try { const v = localStorage.getItem('exportAspect'); return EXPORT_ASPECTS.some(o => o.id === v) ? (v as ExportAspect) : 'screen'; } catch { return 'screen'; }
  });
  const setExportSize = (v: ExportSize) => { setExportSizeState(v); try { localStorage.setItem('exportSize', v); } catch { /* not persisted */ } };
  const setExportAspect = (v: ExportAspect) => { setExportAspectState(v); try { localStorage.setItem('exportAspect', v); } catch { /* not persisted */ } };
  const exportSettingsRef = useRef({ size: exportSize, aspect: exportAspect });
  exportSettingsRef.current = { size: exportSize, aspect: exportAspect };
  const [videoSize, setVideoSizeState] = useState<VideoSize>(() => {
    try { const v = localStorage.getItem('videoSize'); return VIDEO_SIZES.some(o => o.id === v) ? (v as VideoSize) : 'screen'; } catch { return 'screen'; }
  });
  const [videoLength, setVideoLengthState] = useState<VideoLength>(() => {
    try { const v = localStorage.getItem('videoLength'); return VIDEO_LENGTHS.some(o => o.id === v) ? (v as VideoLength) : 'manual'; } catch { return 'manual'; }
  });
  const setVideoSize = (v: VideoSize) => { setVideoSizeState(v); try { localStorage.setItem('videoSize', v); } catch { /* not persisted */ } };
  const setVideoLength = (v: VideoLength) => { setVideoLengthState(v); try { localStorage.setItem('videoLength', v); } catch { /* not persisted */ } };
  // True from the moment a take is started from the Save popout until it ends, so the larger render
  // size can be put back and the length timer cleared however the take stops.
  const videoTakeRef = useRef<{ timer: ReturnType<typeof setTimeout> | null; sized: boolean } | null>(null);
  const isRecordingNowRef = useRef(false);
  isRecordingNowRef.current = isRecording;
  // "Copied" feedback for the share buttons in the Save popout: which one, for a moment.
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Older browsers / insecure contexts: fall back to a temporary textarea.
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* nothing more to try */ }
      document.body.removeChild(ta);
    }
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(k => (k === key ? null : k)), 1500);
  };
  // The player link for what is on screen right now (?display=1&preset=…: the look with no controls).
  // Numbers are rounded to 3 decimals first: the snapshot carries floats like 240.40263068951,
  // which roughly doubled the link for no visible difference.
  const currentPlayerUrl = () => {
    const compact = JSON.parse(JSON.stringify(buildSnapshot(), (_k, v) => (typeof v === 'number' ? Math.round(v * 1000) / 1000 : v)));
    return `${window.location.origin}${window.location.pathname}?display=1&preset=${encodePresetData(compact)}`;
  };

  // Export gradient as PNG. With a size picked, the artwork is re-rendered at that
  // size (full-resolution gradients, no pixel budget) for a few frames, the
  // wanted region is copied out, and normal rendering resumes. Effects that keep
  // history between frames (Feedback, Chromatic Trails, Slit-Scan) restart when
  // the canvas changes size, so they come out as a fresh frame.
  const isExportingRef = useRef(false);
  // `preview` (the three-finger tap) doesn't download: it opens a sheet showing the image, because
  // a web page can't write to the photo library. Pressing and holding the image on an iPhone or
  // Android offers Add to Photos, which the share sheet's file route (Files, Drive) does not.
  const [savePreview, setSavePreview] = useState<{ url: string; blob: Blob; name: string } | null>(null);
  const exportAsPNG = useCallback(async (mode: 'download' | 'preview' = 'download') => {
    const canvas = canvasRef.current;
    if (!canvas || isExportingRef.current) return;
    isExportingRef.current = true;
    const { size, aspect } = exportSettingsRef.current;
    const cssW = canvas.clientWidth || canvas.width;
    const cssH = canvas.clientHeight || canvas.height;
    // The region to keep, in CSS pixels, centered.
    const ratio = EXPORT_ASPECTS.find(a => a.id === aspect)?.ratio ?? 0;
    let cropW = cssW, cropH = cssH;
    if (ratio > 0) {
      if (cssW / cssH > ratio) cropW = cssH * ratio; else cropH = cssW / ratio;
    }
    const longEdge = EXPORT_SIZES.find(o => o.id === size)?.longEdge ?? 0;
    const nextFrame = () => new Promise<void>(r => requestAnimationFrame(() => r()));
    try {
      if (longEdge > 0) {
        const want = longEdge / Math.max(cropW, cropH);
        const mult = Math.min(want, EXPORT_MAX_EDGE / Math.max(cssW, cssH), Math.sqrt(EXPORT_MAX_PIXELS / (cssW * cssH)));
        exportRender.multiplier = mult;
        drawParamsDirtyRef.current = true;
        // Wait for the canvas to actually reach that size, then two more frames so
        // the render at that size is on it.
        for (let i = 0; i < 90 && canvas.width < Math.floor(cssW * mult); i++) await nextFrame();
        await nextFrame();
        await nextFrame();
      }
      const k = canvas.width / cssW;
      const outW = Math.max(1, Math.round(cropW * k));
      const outH = Math.max(1, Math.round(cropH * k));
      const out = document.createElement('canvas');
      out.width = outW;
      out.height = outH;
      const octx = out.getContext('2d');
      if (!octx) return;
      octx.drawImage(canvas, Math.round((canvas.width - outW) / 2), Math.round((canvas.height - outH) / 2), outW, outH, 0, 0, outW, outH);
      const blob = await new Promise<Blob | null>(r => out.toBlob(r, 'image/png'));
      if (blob) {
        const name = `gradient-${outW}x${outH}-${Date.now()}.png`;
        if (mode === 'preview') {
          setSavePreview(prev => { if (prev) URL.revokeObjectURL(prev.url); return { url: URL.createObjectURL(blob), blob, name }; });
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = name;
        link.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      exportRender.multiplier = 0;
      drawParamsDirtyRef.current = true;
      isExportingRef.current = false;
    }
  }, []);

  // Seamless loop: renders the shader gradient frame by frame into an MP4 whose last frame leads straight
  // back into its first (the picture is cross-faded with itself one loop earlier; see loopRender).
  const [loopSeconds, setLoopSecondsState] = useState<LoopSeconds>(() => {
    try { const v = localStorage.getItem('loopSeconds'); return LOOP_LENGTHS.some(o => o.id === v) ? (v as LoopSeconds) : '6'; } catch { return '6'; }
  });
  const setLoopSeconds = (v: LoopSeconds) => { setLoopSecondsState(v); try { localStorage.setItem('loopSeconds', v); } catch { /* not persisted */ } };
  const [loopProgress, setLoopProgress] = useState<number | null>(null);
  const [loopError, setLoopError] = useState<string | null>(null);
  const loopCancelRef = useRef(false);
  const loopable = STYLE_FIELD_GRADIENT_TYPES.includes(gradientType as GradientType);
  const exportLoop = async () => {
    if (loopProgress !== null) { loopCancelRef.current = true; return; }
    const canvas = canvasRef.current;
    if (!canvas || !loopable) return;
    setLoopError(null);
    if (!webCodecsAvailable()) { setLoopError('This browser can’t encode video (it needs WebCodecs).'); return; }
    loopCancelRef.current = false;
    setLoopProgress(0);
    // Freeze everything that drifts on its own, so the only thing moving is the loop.
    const wasAutoColor = isAutoColorRef.current, wasAuto = isAutoModeRef.current, wasShuffle = isAutoShuffleOn;
    if (wasAutoColor) setIsAutoColor(false);
    if (wasAuto) setIsAutoMode(false);
    if (wasShuffle) setIsAutoShuffleOn(false);
    const nextFrame = () => new Promise<void>(r => requestAnimationFrame(() => r()));
    try {
      await nextFrame();
      const longEdge = VIDEO_SIZES.find(o => o.id === videoSize)?.longEdge ?? 0;
      const cssW = canvas.clientWidth || canvas.width, cssH = canvas.clientHeight || canvas.height;
      const mult = evenMultiplier(cssW, cssH, longEdge || Math.max(cssW, cssH) * (canvas.width / cssW));
      exportRender.multiplier = mult;
      const seconds = Number(loopSeconds);
      // Shader time runs at (playback speed x this gradient's Speed) per real second.
      const speed = vcrPlaybackSpeedRef.current * (animValuesRef.current.fieldSpeedLive ?? 1);
      loopRender.base = animValuesRef.current.fieldAnimTime ?? 0;
      loopRender.T = Math.max(0.001, seconds * speed);
      loopRender.phase = 0;
      loopRender.active = true;
      drawParamsDirtyRef.current = true;
      for (let i = 0; i < 90 && canvas.width < Math.floor(cssW * mult); i++) await nextFrame();
      await nextFrame();
      const blob = await renderLoopToMp4({
        canvas, seconds, fps: 30,
        drawFrame: async (phase) => { loopRender.phase = phase; drawParamsDirtyRef.current = true; await nextFrame(); await nextFrame(); },
        onProgress: setLoopProgress,
        isCancelled: () => loopCancelRef.current,
      });
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `wav-loop-${canvas.width}x${canvas.height}-${seconds}s.mp4`;
        link.click();
        URL.revokeObjectURL(url);
        haptic('success');
      }
    } catch (err) {
      console.error('Loop export failed:', err);
      setLoopError(err instanceof Error ? err.message : 'The loop could not be rendered.');
    } finally {
      loopRender.active = false;
      exportRender.multiplier = 0;
      drawParamsDirtyRef.current = true;
      if (wasAutoColor) setIsAutoColor(true);
      if (wasAuto) setIsAutoMode(true);
      if (wasShuffle) setIsAutoShuffleOn(true);
      setLoopProgress(null);
    }
  };

  // Starts (or stops) a video take from the Save popout. A chosen size re-renders the artwork at that
  // size first, since the encoder is fixed to the canvas size at the moment recording begins.
  const startVideoTake = async () => {
    if (isRecording) { toggleVCRRecording(); return; }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const longEdge = VIDEO_SIZES.find(o => o.id === videoSize)?.longEdge ?? 0;
    let sized = false;
    if (longEdge > 0) {
      const cssW = canvas.clientWidth || canvas.width, cssH = canvas.clientHeight || canvas.height;
      // H.264 wants even width and height: nudge the scale until both come out even.
      let mult = Math.min(longEdge / Math.max(cssW, cssH), EXPORT_MAX_EDGE / Math.max(cssW, cssH));
      for (let k = 0; k < 60; k++, mult += 0.0007) {
        if (Math.floor(cssW * mult) % 2 === 0 && Math.floor(cssH * mult) % 2 === 0) break;
      }
      exportRender.multiplier = mult;
      drawParamsDirtyRef.current = true;
      sized = true;
      const nextFrame = () => new Promise<void>(r => requestAnimationFrame(() => r()));
      for (let i = 0; i < 90 && canvas.width < Math.floor(cssW * mult); i++) await nextFrame();
      await nextFrame();
      await nextFrame();
    }
    videoTakeRef.current = { timer: null, sized };
    toggleVCRRecording();
    const seconds = VIDEO_LENGTHS.find(o => o.id === videoLength)?.seconds ?? 0;
    if (seconds > 0) videoTakeRef.current.timer = setTimeout(() => toggleVCRRecording(), seconds * 1000);
    // If recording never actually began (encoders unavailable, permission refused), put the size back.
    setTimeout(() => {
      const take = videoTakeRef.current;
      if (take && !isRecordingNowRef.current) {
        videoTakeRef.current = null;
        if (take.timer) clearTimeout(take.timer);
        if (take.sized) { exportRender.multiplier = 0; drawParamsDirtyRef.current = true; }
      }
    }, 6000);
  };
  // Whenever recording ends (length reached, or the Record button pressed), undo the take's setup.
  useEffect(() => {
    if (isRecording || !videoTakeRef.current) return;
    const take = videoTakeRef.current;
    videoTakeRef.current = null;
    if (take.timer) clearTimeout(take.timer);
    if (take.sized) { exportRender.multiplier = 0; drawParamsDirtyRef.current = true; }
  }, [isRecording]);

  return {
    exportSize, setExportSize, exportAspect, setExportAspect,
    videoSize, setVideoSize, videoLength, setVideoLength,
    copiedKey, copyText, currentPlayerUrl,
    savePreview, setSavePreview, exportAsPNG,
    loopSeconds, setLoopSeconds, loopProgress, loopError, loopable, exportLoop,
    startVideoTake,
  };
}
