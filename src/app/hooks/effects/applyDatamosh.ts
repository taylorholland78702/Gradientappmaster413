import { hash2 } from '../../utils/valueNoise';

// P-frame-corruption glitch: block-shaped patches of the canvas are
// replaced with a spatially-jittered patch from the PREVIOUS frame instead
// of the current one — the classic "datamosh" smear where motion drags old
// pixel data across a scene instead of updating cleanly. Fully synchronous
// (a plain module-level canvas holding last call's content, updated at the
// end of every call), deliberately not Worker-backed — Oil Paint's
// original Worker version raced the main draw loop's "skip drawing once
// converged" idle optimization and could freeze; this avoids that whole
// class of bug by never going async. Block content is drawn via Canvas 2D
// drawImage (GPU compositing), not per-pixel math, so no working-
// resolution cap is needed either, same reasoning as applyFuturism.ts.
//
// On a perfectly static gradient with nothing else animating, "previous
// frame" and "current frame" are nearly identical, so the effect reads as
// a subtle spatial displacement glitch rather than dramatic smearing —
// that's correct: real datamoshing has nothing to corrupt without motion
// to begin with. It gets much more dramatic once Auto Mode, VCR, or audio
// reactivity is actually changing the frame, and compounds over repeated
// calls the same way Feedback does.
let prevFrame: HTMLCanvasElement | null = null;

export function applyDatamosh(P: any): void { // eslint-disable-line @typescript-eslint/no-explicit-any
  const { displayWidth, displayHeight, datamoshBlockSize, datamoshAmount, ctx, canvas } = P;
  if (canvas.width === 0 || canvas.height === 0) return;

  const blockSize = Math.max(4, Math.round(datamoshBlockSize));
  const cols = Math.ceil(displayWidth / blockSize);
  const rows = Math.ceil(displayHeight / blockSize);

  if (prevFrame && prevFrame.width === canvas.width && prevFrame.height === canvas.height) {
    ctx.save();
    for (let by = 0; by < rows; by++) {
      for (let bx = 0; bx < cols; bx++) {
        if (hash2(bx, by) >= datamoshAmount) continue;
        const bw = Math.min(blockSize, displayWidth - bx * blockSize);
        const bh = Math.min(blockSize, displayHeight - by * blockSize);
        if (bw <= 0 || bh <= 0) continue;

        const jitterX = (hash2(bx + 500, by + 500) - 0.5) * 2 * blockSize * 2;
        const jitterY = (hash2(bx + 900, by + 900) - 0.5) * 2 * blockSize * 2;
        const sx = Math.max(0, Math.min(displayWidth - bw, bx * blockSize + jitterX));
        const sy = Math.max(0, Math.min(displayHeight - bh, by * blockSize + jitterY));

        ctx.drawImage(prevFrame, sx, sy, bw, bh, bx * blockSize, by * blockSize, bw, bh);
      }
    }
    ctx.restore();
  }

  // Snapshot the (now possibly corrupted) canvas as next call's "previous
  // frame" — deliberately taken AFTER compositing above, not before, so
  // corruption compounds across repeated calls instead of always reading
  // from a clean source.
  if (!prevFrame) prevFrame = document.createElement('canvas');
  if (prevFrame.width !== canvas.width || prevFrame.height !== canvas.height) {
    prevFrame.width = canvas.width;
    prevFrame.height = canvas.height;
  }
  (prevFrame.getContext('2d') as CanvasRenderingContext2D).drawImage(canvas, 0, 0);
}
