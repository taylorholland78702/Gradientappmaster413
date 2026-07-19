import { useCallback, useRef, useState } from 'react';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';

// Downscale target for the encoded GIF — full-canvas-resolution GIFs (this
// app's canvas is often 1000px+ wide) would make quantize()/applyPalette()
// slow enough per frame to stall the capture loop, and produce multi-tens-
// of-MB files for something meant to be a quick shareable clip. 480px wide
// matches what most GIF-export tools default to; aspect ratio is preserved.
const MAX_GIF_WIDTH = 480;
const GIF_FPS = 10;
const FRAME_DELAY = 1000 / GIF_FPS;

export interface UseGifExportParams {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

// Toggle-style recording, matching Record Video's press-to-start /
// press-to-stop model rather than a fixed short duration — a fixed 3-6s
// auto-capture finished (and reverted the button to its idle state) fast
// enough that pressing it looked like it silently did nothing. Frames are
// quantized and written to the GIF incrementally as they're captured, so
// stopping just closes out the encoder rather than kicking off a separate
// heavy encoding pass.
export function useGifExport({ canvasRef }: UseGifExportParams) {
  const [isRecordingGif, setIsRecordingGif] = useState(false);
  const [isFinalizingGif, setIsFinalizingGif] = useState(false);
  // Read inside the capture loop instead of isRecordingGif directly — state
  // updates aren't synchronous with the click that requests a stop, so the
  // loop would otherwise capture at least one extra frame (or more, if
  // several frames land in the same render tick) after the user stopped it.
  const isRecordingRef = useRef(false);

  const toggleGifRecording = useCallback(async () => {
    if (isRecordingRef.current) {
      isRecordingRef.current = false;
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    isRecordingRef.current = true;
    setIsRecordingGif(true);

    try {
      const scale = Math.min(1, MAX_GIF_WIDTH / canvas.width);
      const width = Math.max(1, Math.round(canvas.width * scale));
      const height = Math.max(1, Math.round(canvas.height * scale));

      const scratch = document.createElement('canvas');
      scratch.width = width;
      scratch.height = height;
      const scratchCtx = scratch.getContext('2d', { willReadFrequently: true })!;

      const gif = GIFEncoder();
      let frameCount = 0;

      while (isRecordingRef.current) {
        await new Promise((resolve) => setTimeout(resolve, FRAME_DELAY));
        if (!isRecordingRef.current) break;
        scratchCtx.drawImage(canvas, 0, 0, width, height);
        const { data } = scratchCtx.getImageData(0, 0, width, height);
        const palette = quantize(data, 256);
        const index = applyPalette(data, palette);
        gif.writeFrame(index, width, height, { palette, delay: FRAME_DELAY });
        frameCount++;
      }

      setIsRecordingGif(false);
      setIsFinalizingGif(true);

      if (frameCount > 0) {
        gif.finish();
        const blob = new Blob([gif.bytes() as BlobPart], { type: 'image/gif' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `wav-${Date.now()}.gif`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('GIF export failed:', err);
    } finally {
      isRecordingRef.current = false;
      setIsRecordingGif(false);
      setIsFinalizingGif(false);
    }
  }, [canvasRef]);

  return { isRecordingGif, isFinalizingGif, toggleGifRecording };
}
