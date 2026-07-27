import { getScratchImageData } from '../../utils/scratchCanvas';

export function applyCrt(P: any): void {
  const {
    ctx,
    canvas,
    centerX,
    centerY,
    displayWidth,
    displayHeight,
    putScaledImageData,
    getDisplayImageData,
    crtIntensity,
  } = P;
            // Barrel distortion + corner vignette + RGB-subpixel/scanline
            // mask combined into one recognizable "old CRT screen" look —
            // has Scanlines and VHS (temporal/tape degradation) separately,
            // but nothing simulating a curved tube display until now.
            if (canvas.width === 0 || canvas.height === 0) return;
            const amt = Math.max(0, Math.min(1, crtIntensity ?? 0.6));
            if (amt <= 0) return;
            const src = getDisplayImageData();
            const dst = getScratchImageData('crt', ctx, displayWidth, displayHeight);
            const R = Math.min(displayWidth, displayHeight) / 2;
            // Barrel curvature — positive k bulges the center outward and
            // pulls the corners in, the classic convex-tube look.
            const k = 0.35 * amt;
            for (let y = 0; y < displayHeight; y++) {
              for (let x = 0; x < displayWidth; x++) {
                const nx = (x - centerX) / R;
                const ny = (y - centerY) / R;
                const r2 = nx * nx + ny * ny;
                const factor = 1 + k * r2;
                const sxf = centerX + nx * R * factor;
                const syf = centerY + ny * R * factor;
                const di = (y * displayWidth + x) * 4;
                if (sxf < 0 || sxf >= displayWidth - 1 || syf < 0 || syf >= displayHeight - 1) {
                  // Outside the curved tube's visible area — black bezel edge.
                  dst.data[di] = 0; dst.data[di + 1] = 0; dst.data[di + 2] = 0; dst.data[di + 3] = 255;
                  continue;
                }
                const sx = Math.round(sxf);
                const sy = Math.round(syf);
                const si = (sy * displayWidth + sx) * 4;

                // Corner vignette — radial darkening toward the bezel.
                const vig = Math.max(0, 1 - r2 * 0.5 * amt);

                // RGB subpixel triad mask — every 3rd column tints toward
                // one channel, faint scanline darkening every 2nd row.
                const col = x % 3;
                const rowDark = (y % 2 === 0) ? 1 : (1 - 0.35 * amt);
                const subR = col === 0 ? 1 : (1 - 0.5 * amt);
                const subG = col === 1 ? 1 : (1 - 0.5 * amt);
                const subB = col === 2 ? 1 : (1 - 0.5 * amt);

                dst.data[di]     = src.data[si]     * vig * rowDark * subR;
                dst.data[di + 1] = src.data[si + 1] * vig * rowDark * subG;
                dst.data[di + 2] = src.data[si + 2] * vig * rowDark * subB;
                dst.data[di + 3] = 255;
              }
            }
            putScaledImageData(dst);
}
