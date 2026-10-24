import { useCallback, useEffect, type MutableRefObject } from 'react';
import { totalCost, costOf, MULTI_FX_COST_BUDGET } from '../constants/effectCost';
import { notify } from '../utils/notify';
import type { EffectType } from '../constants/gradientEffects';

// Photo upload: file picker change, drag-and-drop anywhere on the window, downscaling and auto-activating the Photo effect.
// Moved out of InteractiveGradient unchanged.
export function usePhotoUpload({ photoFileName, setPhotoFileName, setPhotoVersion, photoImageRef, setActiveEffects, isMultiFxMode }: {
  photoFileName: string;
  setPhotoFileName: (name: string) => void;
  setPhotoVersion: (update: (v: number) => number) => void;
  photoImageRef: MutableRefObject<CanvasImageSource | null>;
  setActiveEffects: (update: (prev: EffectType[]) => EffectType[]) => void;
  isMultiFxMode: boolean;
}) {
  // A phone photo commonly runs 4000-8000px on the long edge — used at
  // native resolution, applyPhoto.ts's ctx.drawImage() call would composite
  // that many source pixels into the effect stack every single frame
  // regardless of what's actually visible on screen. Downscaling once here
  // (rather than leaving it to whatever the browser's drawImage
  // downsampling does per-frame) caps that cost permanently at upload time.
  // MAX_DIMENSION is comfortably above typical display resolution (most
  // screens/canvases stay under ~2560px on their long edge even at 2x DPR)
  // while still a small fraction of what a modern camera produces.
  const MAX_PHOTO_DIMENSION = 2048;
  // Shared by both entry points — the hidden file-input's onChange and the
  // canvas's onDrop — so drag-and-drop isn't a second, divergent upload
  // path with its own bugs.
  const loadPhotoFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.width <= MAX_PHOTO_DIMENSION && img.height <= MAX_PHOTO_DIMENSION) {
        photoImageRef.current = img;
        setPhotoVersion(v => v + 1);
        return;
      }
      const scale = MAX_PHOTO_DIMENSION / Math.max(img.width, img.height);
      const scaledCanvas = document.createElement('canvas');
      scaledCanvas.width = Math.max(1, Math.round(img.width * scale));
      scaledCanvas.height = Math.max(1, Math.round(img.height * scale));
      const scaledCtx = scaledCanvas.getContext('2d');
      if (!scaledCtx) {
        // Fall back to the native-resolution image rather than dropping
        // the upload entirely — this path should be unreachable in any
        // real browser, but a slow frame beats a silently-ignored upload.
        photoImageRef.current = img;
        setPhotoVersion(v => v + 1);
        return;
      }
      scaledCtx.drawImage(img, 0, 0, scaledCanvas.width, scaledCanvas.height);
      photoImageRef.current = scaledCanvas;
      setPhotoVersion(v => v + 1);
    };
    const previousName = photoFileName;
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setPhotoFileName(photoImageRef.current ? previousName : '');
      if (!photoImageRef.current) setActiveEffects(prev => prev.filter(e => e !== 'photo'));
      notify(`Couldn't open "${file.name}" — it isn't a readable image.`);
    };
    img.src = url;
    setPhotoFileName(file.name);
    // Auto-activate the Photo effect so a drop (or a picker upload) shows
    // up immediately instead of needing a separate trip to the Effects tab
    // to turn it on — in Multi-FX mode it's added alongside whatever's
    // already active (if the cost budget allows), otherwise it becomes the
    // sole active effect like any other single-FX selection.
    setActiveEffects(prev => {
      if (prev.includes('photo')) return prev;
      if (isMultiFxMode) {
        return totalCost(prev) + costOf('photo') > MULTI_FX_COST_BUDGET ? prev : [...prev, 'photo'];
      }
      return ['photo'];
    });
  }, [isMultiFxMode, photoFileName]);
  const handlePhotoFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadPhotoFile(file);
  }, [loadPhotoFile]);
  // Window-level drag-and-drop rather than a handler on one specific
  // element — a React onDrop/onDragOver pair scoped to the canvas wrapper
  // div wasn't reliably catching the browser's default action (dropping a
  // file anywhere the listener wasn't attached, or during the split second
  // before an event finished bubbling, fell through to the browser's own
  // "navigate to this file" behavior instead of being caught). Listening
  // on window and preventing default on EVERY dragover unconditionally
  // (not just when a file is present) is what actually suppresses that
  // reliably — matches the standard pattern for whole-page drop zones.
  useEffect(() => {
    const onDragOver = (e: DragEvent) => e.preventDefault();
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer?.files?.[0];
      if (file) loadPhotoFile(file);
    };
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', onDrop);
    };
  }, [loadPhotoFile]);
  return { loadPhotoFile, handlePhotoFileChange };
}
