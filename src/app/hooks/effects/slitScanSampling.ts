// Slit-Scan's per-pixel sampling, split into the part that depends only on the settings (which buffered frame each
// output pixel reads, and where in that frame) and the part that depends on the frames (copying the pixel).
// The first is a lookup table that is rebuilt only when the settings or canvas size change; every frame is then
// one gather. The arithmetic below is the same as the per-pixel loops it replaced.

export type SlitScanDirection = 'horizontal' | 'vertical' | 'radial' | 'circular';

export interface SlitScanSettings {
  direction: SlitScanDirection | string;
  width: number; height: number;          // output (display) size
  bufLen: number;                          // number of buffered frames
  intensity: number;                       // raw Intensity slider value
  bufW: number; bufH: number;              // size of a buffered frame
  downsample: number;                      // buffered frames are captured at this fraction of the display size
}

export interface SlitScanMap {
  key: string;
  offset: Uint32Array;  // pixel index inside the chosen buffered frame, per output pixel
  // Which buffered frame each output pixel reads. Horizontal and vertical know it up front (it depends on the
  // buffer length, so those maps are keyed by it); radial and circular store the 0..1 position instead and pick
  // the frame per pixel, so the expensive trigonometry is not redone while the buffer is still filling.
  frame: Uint16Array | null;
  position: Float64Array | null;
}

const usesPosition = (direction: string) => direction !== 'horizontal' && direction !== 'vertical';

export const slitScanMapKey = (s: SlitScanSettings) =>
  `${s.direction}|${s.width}x${s.height}|${usesPosition(s.direction) ? '*' : s.bufLen}|${s.intensity}|${s.bufW}x${s.bufH}|${s.downsample}`;

export function buildSlitScanMap(s: SlitScanSettings): SlitScanMap {
  const { width: W, height: H, bufLen, intensity: int, bufW, bufH, downsample } = s;
  const positional = usesPosition(s.direction);
  const frame = positional ? null : new Uint16Array(W * H);
  const position = positional ? new Float64Array(W * H) : null;
  const offset = new Uint32Array(W * H);
  const frameSel = Math.min(int, 1);
  const midBuf = (bufLen - 1) / 2;
  const at = (sx: number, sy: number) => {
    const bx = Math.max(0, Math.min(bufW - 1, Math.round(sx * downsample)));
    const by = Math.max(0, Math.min(bufH - 1, Math.round(sy * downsample)));
    return by * bufW + bx;
  };

  if (s.direction === 'horizontal') {
    for (let y = 0; y < H; y++) {
      const fi = Math.min(Math.floor((y / H) * (bufLen - 1) * frameSel), bufLen - 1);
      const shift = Math.round(((fi - midBuf) / midBuf) * int * W * 0.35);
      for (let x = 0; x < W; x++) {
        const sx = ((x + shift) % W + W) % W;
        const i = y * W + x;
        frame![i] = fi; offset[i] = at(sx, y);
      }
    }
  } else if (s.direction === 'vertical') {
    for (let x = 0; x < W; x++) {
      const fi = Math.min(Math.floor((x / W) * (bufLen - 1) * frameSel), bufLen - 1);
      const shift = Math.round(((fi - midBuf) / midBuf) * int * H * 0.35);
      for (let y = 0; y < H; y++) {
        const sy = ((y + shift) % H + H) % H;
        const i = y * W + x;
        frame![i] = fi; offset[i] = at(x, sy);
      }
    }
  } else if (s.direction === 'radial') {
    // Concentric rings: each ring reads an older frame the further out it is, and is pulled in or out along the
    // radius only. There is no sideways twist; that is what turned the centre into a pinwheel.
    const cx = W / 2, cy = H / 2;
    const md = Math.sqrt(cx * cx + cy * cy);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const dx = x - cx, dy = y - cy;
        const d = Math.sqrt(dx * dx + dy * dy);
        const t = d / md;
        // Continuous (not bucketed) offset for the displacement, so the innermost bucket has no hard edge.
        const normOffset = Math.min(t * frameSel, 1) * 2 - 1;
        const shift = normOffset * int * md * 0.35;
        // Wrap rather than reflect, so no ring of pixels collapses onto one source pixel.
        const sd = ((d + shift) % md + md) % md;
        const k = d > 0 ? sd / d : 0;
        const sx = Math.max(0, Math.min(W - 1, Math.round(cx + dx * k)));
        const sy = Math.max(0, Math.min(H - 1, Math.round(cy + dy * k)));
        const i = y * W + x;
        position![i] = t; offset[i] = at(sx, sy);
      }
    }
  } else {
    // circular: frame chosen by angle around the centre, with the sample point rotated and pulled in or out.
    const cx = W / 2, cy = H / 2;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const angle = Math.atan2(y - cy, x - cx);
        const norm = (angle + Math.PI) / (Math.PI * 2);
        const d = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
        const normOffset = Math.min(norm * frameSel, 1) * 2 - 1;
        const sAngle = angle + normOffset * int * 1.6;
        let sd = d * (1 - normOffset * int * 0.25);
        if (sd < 0) sd = -sd;
        const sx = Math.max(0, Math.min(W - 1, Math.round(cx + Math.cos(sAngle) * sd)));
        const sy = Math.max(0, Math.min(H - 1, Math.round(cy + Math.sin(sAngle) * sd)));
        const i = y * W + x;
        position![i] = norm; offset[i] = at(sx, sy);
      }
    }
  }
  return { key: slitScanMapKey(s), frame, position, offset };
}

// Copies each output pixel from its buffered frame. `frames` are the buffered frames viewed as 32-bit pixels.
export function gatherSlitScan(out: Uint32Array, frames: Uint32Array[], map: SlitScanMap, intensity: number): void {
  const { frame, position, offset } = map;
  if (frame) {
    for (let i = 0; i < out.length; i++) out[i] = frames[frame[i]][offset[i]];
    return;
  }
  const last = frames.length - 1;
  for (let i = 0; i < out.length; i++) {
    // same expression as the original per-pixel loop, so every pixel lands on the same frame
    const fi = Math.min(Math.floor(position![i] * last * Math.min(intensity, 1)), last);
    out[i] = frames[fi][offset[i]];
  }
}
