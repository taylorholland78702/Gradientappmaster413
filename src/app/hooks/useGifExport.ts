import { useCallback, useRef, useState } from 'react';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';

// Downscale target for the encoded GIF — full-canvas-resolution GIFs (this
// app's canvas is often 1000px+ wide) would make quantize()/applyPalette()
// slow enough per frame to stall the capture loop, and produce multi-tens-
// of-MB files for something meant to be a quick shareable clip. 480px wide
// matches what most GIF-export tools default to; aspect ratio is preserved.
const MAX_GIF_WIDTH = 480;
const GIF_FPS = 10;

export interface UseGifExportParams {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  // Reuses the same seamless-loop duration convention as the VCR/video
  // export path (6s for a full rotation vs 3s otherwise) rather than
  // inventing a separate GIF-specific duration control.
  vcrLoop: boolean;
}

export function useGifExport({ canvasRef, vcrLoop }: UseGifExportParams) {
  const [isCapturingGif, setIsCapturingGif] = useState(false);
  const [gifProgress, setGifProgress] = useState(0);
  // Guards against a second click re-entering the capture loop while one
  // is already in flight — isCapturingGif itself is fine for the UI, but
  // state updates inside the async loop below are not synchronous with a
  // rapid double-click, so a plain ref check up front closes that gap.
  const isCapturingRef = useRef(false);

  const exportAsGIF = useCallback(async () => {
    if (isCapturingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    isCapturingRef.current = true;
    setIsCapturingGif(true);
    setGifProgress(0);

    try {
      const duration = vcrLoop ? 6000 : 3000;
      const frameCount = Math.round((duration / 1000) * GIF_FPS);
      const frameDelay = 1000 / GIF_FPS;

      const scale = Math.min(1, MAX_GIF_WIDTH / canvas.width);
      const width = Math.max(1, Math.round(canvas.width * scale));
      const height = Math.max(1, Math.round(canvas.height * scale));

      const scratch = document.createElement('canvas');
      scratch.width = width;
      scratch.height = height;
      const scratchCtx = scratch.getContext('2d', { willReadFrequently: true })!;

      const gif = GIFEncoder();

      for (let i = 0; i < frameCount; i++) {
        await new Promise((resolve) => setTimeout(resolve, frameDelay));
        scratchCtx.drawImage(canvas, 0, 0, width, height);
        const { data } = scratchCtx.getImageData(0, 0, width, height);
        const palette = quantize(data, 256);
        const index = applyPalette(data, palette);
        gif.writeFrame(index, width, height, { palette, delay: frameDelay });
        setGifProgress(Math.round(((i + 1) / frameCount) * 100));
      }

      gif.finish();
      const blob = new Blob([gif.bytes() as BlobPart], { type: 'image/gif' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `wav-${Date.now()}.gif`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('GIF export failed:', err);
    } finally {
      isCapturingRef.current = false;
      setIsCapturingGif(false);
      setGifProgress(0);
    }
  }, [canvasRef, vcrLoop]);

  return { isCapturingGif, gifProgress, exportAsGIF };
}
