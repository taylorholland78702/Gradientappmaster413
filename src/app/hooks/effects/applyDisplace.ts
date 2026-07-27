import { getScratchImageData } from '../../utils/scratchCanvas';

export function applyDisplace(P: any): void {
  const {
    ctx,
    canvas,
    displayWidth,
    displayHeight,
    putScaledImageData,
    getDisplayImageData,
    displaceStrength,
    displaceScale,
  } = P;
            // Organic noise-driven pixel warp — distinct from Liquid's
            // periodic sine-wave ripple: layered, rotated-octave value noise
            // (same shape of math as the Noise gradient's domain-warp, just
            // applied here to displace existing pixels instead of generating
            // a field from scratch) gives a painterly/marbled distortion
            // rather than a rhythmic swirl. Phase comes straight from
            // performance.now() rather than a threaded anim-time ref, since
            // this is the only place that needs it.
            if (canvas.width === 0 || canvas.height === 0) return;
            const dSrc = getDisplayImageData();
            const dOut = getScratchImageData('displace', ctx, displayWidth, displayHeight);
            const dScale = (displaceScale ?? 3) * 0.004;
            const dStrength = displaceStrength ?? 30;
            const t = performance.now() * 0.0002;
            for (let y = 0; y < displayHeight; y++) {
              for (let x = 0; x < displayWidth; x++) {
                // Two rotated octaves (golden-angle offset, same trick used
                // by the Noise gradient) so the field reads as organic
                // rather than axis-aligned.
                const n1 = Math.sin(x * dScale + t) * Math.cos(y * dScale * 0.8 - t * 0.7);
                const ox = x * dScale * 2.4 - y * dScale * 0.6;
                const oy = x * dScale * 0.6 + y * dScale * 2.4;
                const n2 = Math.sin(ox + t * 1.3) * Math.cos(oy - t * 0.5) * 0.5;
                const dx = (n1 + n2) * dStrength;

                const m1 = Math.cos(x * dScale * 0.9 - t * 0.6) * Math.sin(y * dScale + t * 1.1);
                const m2 = Math.cos(ox * 0.7 + t * 0.4) * Math.sin(oy * 0.7 - t * 1.2) * 0.5;
                const dy = (m1 + m2) * dStrength;

                const sx = Math.max(0, Math.min(displayWidth - 1, Math.round(x + dx)));
                const sy = Math.max(0, Math.min(displayHeight - 1, Math.round(y + dy)));
                const di = (y * displayWidth + x) * 4;
                const si = (sy * displayWidth + sx) * 4;
                dOut.data[di] = dSrc.data[si];
                dOut.data[di + 1] = dSrc.data[si + 1];
                dOut.data[di + 2] = dSrc.data[si + 2];
                dOut.data[di + 3] = 255;
              }
            }
            putScaledImageData(dOut);
}
