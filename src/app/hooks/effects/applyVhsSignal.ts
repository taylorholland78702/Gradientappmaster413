import type { EffectCtx } from '../canvasDrawTypes';
import { smearChroma } from './analogSignal';

const clamp01 = (v: number | undefined): number => Math.max(0, Math.min(1, v ?? 0));

// The tape itself, on top of VHS's tearing and channel split: colour that smears sideways off its edges, tape snow, a
// tracking band along the bottom where the picture skews and fills with static, and short white dropout streaks.
export function applyVhsSignal(P: EffectCtx): void {
  const { getDisplayImageData, putScaledImageData } = P;
  const bleed = clamp01(P.vhsBleed), noise = clamp01(P.vhsNoise), tracking = clamp01(P.vhsTracking), dropouts = clamp01(P.vhsDropouts);
  if (bleed <= 0 && noise <= 0 && tracking <= 0 && dropouts <= 0) return;
  const img = getDisplayImageData();
  const w = img.width, h = img.height;
  if (w < 8 || h < 8) return;
  const d = img.data;

  if (bleed > 0) smearChroma(d, w, h, Math.max(1, Math.round(bleed * 14)));

  if (tracking > 0) {
    const bandH = Math.max(4, Math.floor(h * (0.04 + 0.1 * tracking)));
    const top = h - bandH - Math.floor(h * 0.01);
    const row = new Uint8ClampedArray(w * 4);
    const wobble = performance.now() * 0.01;
    for (let y = top; y < top + bandH && y < h; y++) {
      const t = (y - top) / bandH;
      const shift = Math.round((Math.sin(y * 0.35 + wobble) * 0.5 + (Math.random() - 0.5)) * tracking * 80 * t);
      const base = y * w * 4;
      row.set(d.subarray(base, base + w * 4));
      const mix = 0.5 * t * tracking;
      for (let x = 0; x < w; x++) {
        const sx = Math.min(w - 1, Math.max(0, x - shift)) * 4;
        const snow = Math.random() * 255;
        const o = base + x * 4;
        d[o] = row[sx] * (1 - mix) + snow * mix;
        d[o + 1] = row[sx + 1] * (1 - mix) + snow * mix;
        d[o + 2] = row[sx + 2] * (1 - mix) + snow * mix;
      }
    }
  }

  if (noise > 0) {
    const amp = noise * 60;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * amp;
      d[i] += n; d[i + 1] += n; d[i + 2] += n;
    }
  }

  if (dropouts > 0 && Math.random() < 0.6) {
    const count = Math.ceil(dropouts * 10);
    for (let k = 0; k < count; k++) {
      const y = Math.floor(Math.random() * h), x0 = Math.floor(Math.random() * w), len = 20 + Math.floor(Math.random() * 120);
      for (let x = x0; x < Math.min(w, x0 + len); x++) {
        const o = (y * w + x) * 4;
        d[o] = 235; d[o + 1] = 235; d[o + 2] = 235;
      }
    }
  }
  putScaledImageData(img);
}
