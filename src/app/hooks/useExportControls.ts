import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type ExportSize, type ExportAspect, EXPORT_SIZES, EXPORT_ASPECTS,
  EXPORT_MAX_EDGE, EXPORT_MAX_PIXELS, wallpaperTarget,
} from '../constants/exportOptions';
import { exportRender } from './useCanvasDraw';
import { videoEncoderCandidates, pickVideoMultiplier, VIDEO_FPS, PHONE_VIDEO_MAX_EDGE } from '../utils/videoEncoding';
import { isTouchPlatform } from '../utils/touchPlatform';
import { shareParam } from '../utils/shareLink';
import { shuffleLearning } from '../utils/shuffleLearning';
import type { useCanvasState } from './state/useCanvasState';
import type { useMiscState } from './state/useMiscState';

type MiscState = ReturnType<typeof useMiscState>;

// Everything behind the Save & share popout: PNG / video-take export and the
// copy-to-clipboard share buttons, with their persisted settings.
export function useExportControls({
  canvasRef, drawParamsDirtyRef, buildSnapshot, isRecording, toggleVCRRecording,
}: {
  canvasRef: ReturnType<typeof useCanvasState>['canvasRef'];
  drawParamsDirtyRef: MiscState['drawParamsDirtyRef'];
  buildSnapshot: () => unknown;
  isRecording: boolean;
  toggleVCRRecording: () => void;
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
  // True from the moment a take is started from the Save popout until it ends, so the larger render
  // size can be put back and the length timer cleared however the take stops.
  const videoTakeRef = useRef<{ sized: boolean } | null>(null);
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
  // shareParam keeps only what the look needs, compressed (utils/shareLink.ts).
  const currentPlayerUrl = () =>
    `${window.location.origin}${window.location.pathname}?display=1&preset=${shareParam(buildSnapshot() as Record<string, unknown>)}`;

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
  const exportAsPNG = useCallback(async (mode: 'download' | 'preview' = 'download', exact?: { w: number; h: number; name: string }) => {
    const canvas = canvasRef.current;
    if (!canvas || isExportingRef.current) return;
    isExportingRef.current = true;
    // Exporting a look is a sign it was wanted (a preview alone is not).
    if (mode === 'download') shuffleLearning.like(1);
    const { size, aspect } = exportSettingsRef.current;
    const cssW = canvas.clientWidth || canvas.width;
    const cssH = canvas.clientHeight || canvas.height;
    // The region to keep, in CSS pixels, centered.
    const ratio = exact ? exact.w / exact.h : EXPORT_ASPECTS.find(a => a.id === aspect)?.ratio ?? 0;
    let cropW = cssW, cropH = cssH;
    if (ratio > 0) {
      if (cssW / cssH > ratio) cropW = cssH * ratio; else cropH = cssW / ratio;
    }
    const longEdge = exact ? Math.max(exact.w, exact.h) : EXPORT_SIZES.find(o => o.id === size)?.longEdge ?? 0;
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
      // A wallpaper is written at exactly the screen's pixel size (the crop above only has its shape).
      out.width = exact ? exact.w : outW;
      out.height = exact ? exact.h : outH;
      const octx = out.getContext('2d');
      if (!octx) return;
      octx.drawImage(canvas, Math.round((canvas.width - outW) / 2), Math.round((canvas.height - outH) / 2), outW, outH, 0, 0, out.width, out.height);
      const blob = await new Promise<Blob | null>(r => out.toBlob(r, 'image/png'));
      if (blob) {
        const name = exact ? `${exact.name}-${out.width}x${out.height}-${Date.now()}.png` : `gradient-${outW}x${outH}-${Date.now()}.png`;
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

  // Saves the look as an 8K PNG shaped like this device's screen. This is the only PNG the Save button writes.
  const saveWallpaper = useCallback(() => {
    const { w, h } = wallpaperTarget(window.screen.width, window.screen.height);
    return exportAsPNG('download', { w, h, name: 'wallpaper' });
  }, [exportAsPNG]);

  // Starts (or stops) a video take. It always records at 4K, so the artwork is re-rendered at that size first,
  // since the encoder is fixed to the canvas size at the moment recording begins.
  const startVideoTake = async () => {
    if (isRecording) { toggleVCRRecording(); return; }
    const canvas = canvasRef.current;
    if (!canvas) return;
    let sized = false;
    {
      const cssW = canvas.clientWidth || canvas.width, cssH = canvas.clientHeight || canvas.height;
      // 4K where the device's encoder takes it; phones step down to the biggest size theirs can really do.
      const supports = typeof VideoEncoder !== 'undefined'
        ? async (w: number, h: number) => {
            for (const config of videoEncoderCandidates(w, h, VIDEO_FPS)) {
              try { if ((await VideoEncoder.isConfigSupported(config)).supported) return true; } catch { /* next */ }
            }
            return false;
          }
        : null;
      const mult = await pickVideoMultiplier(cssW, cssH, supports, isTouchPlatform() ? PHONE_VIDEO_MAX_EDGE : Infinity);
      exportRender.multiplier = mult;
      drawParamsDirtyRef.current = true;
      sized = true;
      const nextFrame = () => new Promise<void>(r => requestAnimationFrame(() => r()));
      for (let i = 0; i < 90 && canvas.width < Math.floor(cssW * mult); i++) await nextFrame();
      await nextFrame();
      await nextFrame();
    }
    videoTakeRef.current = { sized };
    toggleVCRRecording();
    // If recording never actually began (encoders unavailable, permission refused), put the size back.
    setTimeout(() => {
      const take = videoTakeRef.current;
      if (take && !isRecordingNowRef.current) {
        videoTakeRef.current = null;
        if (take.sized) { exportRender.multiplier = 0; drawParamsDirtyRef.current = true; }
      }
    }, 6000);
  };
  // Whenever recording ends (length reached, or the Record button pressed), undo the take's setup.
  useEffect(() => {
    if (isRecording || !videoTakeRef.current) return;
    const take = videoTakeRef.current;
    videoTakeRef.current = null;
    if (take.sized) { exportRender.multiplier = 0; drawParamsDirtyRef.current = true; }
  }, [isRecording]);

  return {
    exportSize, setExportSize, exportAspect, setExportAspect,
    copiedKey, copyText, currentPlayerUrl,
    savePreview, setSavePreview, exportAsPNG, saveWallpaper,
    startVideoTake,
  };
}
