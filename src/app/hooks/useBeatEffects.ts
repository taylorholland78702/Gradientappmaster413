import type { MutableRefObject, SetStateAction } from 'react';
import { useEffect } from 'react';
import type { ColorRGB } from '../constants/gradientEffects';

// Audio beat reactions: contrast/saturation pulse, canvas shake, palette snap and structural reseed. Moved out of InteractiveGradient unchanged.
export interface UseBeatEffectsParams {
  isAudioEnabled: boolean;
  isAudioReactive: boolean;
  contrastBeatEnabled: boolean;
  canvasRef: MutableRefObject<HTMLCanvasElement>;
  contrastPulseRef: MutableRefObject<number>;
  saturationPulseRef: MutableRefObject<number>;
  audioSubBassLevel: number;
  shakeBeatEnabled: boolean;
  subBassOnsetTick: number;
  shakeWrapperRef: MutableRefObject<HTMLDivElement>;
  shakeRef: MutableRefObject<{ x: number; y: number; }>;
  paletteBeatEnabled: boolean;
  bassOnsetTick: number;
  gradientColors: ColorRGB[];
  setGradientColors: (value: SetStateAction<ColorRGB[]>) => void;
  setTargetColors: (value: SetStateAction<ColorRGB[]>) => void;
  audioEnergy: number;
  musicIntensityRef: MutableRefObject<number>;
  lastReseedTimeRef: MutableRefObject<number>;
  setStructuralSeed: (value: SetStateAction<number>) => void;
}

// How far to scale the shaken wrapper so the canvas still covers its own area: a nudge of `dx`,`dy` px would otherwise
// leave a strip of background along one edge. Scaling about the wrapper's centre grows each canvas edge by
// (scale - 1) times its distance from that centre, so the scale follows the shake and there is no pop when it ends.
export function shakeCoverScale(dx: number, dy: number, canvas: HTMLElement | null, wrapper: HTMLElement): number {
  const w = wrapper.getBoundingClientRect(), c = (canvas ?? wrapper).getBoundingClientRect();
  const cx = w.left + w.width / 2, cy = w.top + w.height / 2;
  const halfX = Math.max(1, Math.min(cx - c.left, c.right - cx)), halfY = Math.max(1, Math.min(cy - c.top, c.bottom - cy));
  return 1 + Math.max(Math.abs(dx) / halfX, Math.abs(dy) / halfY);
}

export function useBeatEffects(p: UseBeatEffectsParams) {
  const { isAudioEnabled, isAudioReactive, contrastBeatEnabled, canvasRef, contrastPulseRef, saturationPulseRef, audioSubBassLevel, shakeBeatEnabled, subBassOnsetTick, shakeWrapperRef, shakeRef, paletteBeatEnabled, bassOnsetTick, gradientColors, setGradientColors, setTargetColors, audioEnergy, musicIntensityRef, lastReseedTimeRef, setStructuralSeed } = p;
  // Contrast + saturation pulse — bass hits spike both, decay via RAF
  useEffect(() => {
    if (!isAudioEnabled || !isAudioReactive || !contrastBeatEnabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let rafId: number;
    const animate = () => {
      contrastPulseRef.current *= 0.82;
      saturationPulseRef.current *= 0.80;
      const contrast = 1 + contrastPulseRef.current * 2.0;
      const saturate = 1 + saturationPulseRef.current * 3.5;
      const active = contrastPulseRef.current > 0.01 || saturationPulseRef.current > 0.01;
      canvas.style.filter = active ? `contrast(${contrast.toFixed(2)}) saturate(${saturate.toFixed(2)})` : '';
      if (active) rafId = requestAnimationFrame(animate);
    };
    if (audioSubBassLevel > 0.3) {
      const strength = Math.min(1, audioSubBassLevel / 5);
      contrastPulseRef.current = strength;
      saturationPulseRef.current = strength;
      rafId = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(rafId);
  }, [audioSubBassLevel, isAudioEnabled, isAudioReactive, contrastBeatEnabled]);

  // Canvas shake — sub-bass onset triggers a quick x/y rumble
  useEffect(() => {
    if (!isAudioEnabled || !isAudioReactive || !shakeBeatEnabled || subBassOnsetTick === 0) return;
    const wrapper = shakeWrapperRef.current;
    if (!wrapper) return;
    let rafId: number;
    shakeRef.current = { x: (Math.random() - 0.5) * 12, y: (Math.random() - 0.5) * 8 };
    const animate = () => {
      shakeRef.current.x *= 0.65;
      shakeRef.current.y *= 0.65;
      if (Math.abs(shakeRef.current.x) < 0.3 && Math.abs(shakeRef.current.y) < 0.3) {
        wrapper.style.transform = '';
        return;
      }
      const { x, y } = shakeRef.current;
      wrapper.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${shakeCoverScale(x, y, canvasRef.current, wrapper).toFixed(4)})`;
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(rafId); wrapper.style.transform = ''; };
  }, [subBassOnsetTick, isAudioEnabled, isAudioReactive, shakeBeatEnabled]);

  // Palette snap — on bass beat, jump to a vivid complementary palette instantly
  useEffect(() => {
    if (!paletteBeatEnabled || !isAudioEnabled || !isAudioReactive || bassOnsetTick === 0) return;
    const hslToRgb = (h: number, s: number, l: number) => {
      s /= 100; l /= 100;
      const k = (n: number) => (n + h / 30) % 12;
      const a = s * Math.min(l, 1 - l);
      const f = (n: number) => Math.round((l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))) * 255);
      return { r: f(0), g: f(8), b: f(4) };
    };
    const count = gradientColors.length || 4;
    const baseHue = Math.random() * 360;
    const newColors = Array.from({ length: count }, (_, i) => {
      const hue = (baseHue + (360 / count) * i + (Math.random() * 20 - 10)) % 360;
      return hslToRgb(hue, 85 + Math.random() * 15, 48 + Math.random() * 14);
    });
    setGradientColors(() => newColors);
    setTargetColors(() => newColors);
  }, [bassOnsetTick, paletteBeatEnabled, isAudioEnabled, isAudioReactive, gradientColors.length]);

  // Structural reseed — a big, energetic hit (not just any beat) rerolls
  // structuralSeed, which Caustics/Voronoi/Marble/Metaballs/
  // Topographic use to vary their underlying pattern structure, not just
  // brightness/scale. Rate-limited to ~once per 4s so a track's drop reads
  // as "the pattern itself just changed" rather than constant reshuffling.
  useEffect(() => {
    if (!isAudioEnabled || !isAudioReactive || bassOnsetTick === 0) return;
    // Scaled by the track's own recent dynamics (musicIntensityRef): a real
    // "drop" (intensity well above 1) lowers the energy bar and shortens the
    // cooldown so reseeds actually land on the big moments; a quiet stretch
    // (intensity below 1) raises both so nothing reseeds during a breakdown.
    const intensity = musicIntensityRef.current ?? 1;
    const energyBar = 0.72 / intensity;
    const cooldown = 4000 / Math.max(0.6, intensity);
    if (audioEnergy < energyBar) return;
    const now = performance.now();
    if (now - lastReseedTimeRef.current < cooldown) return;
    lastReseedTimeRef.current = now;
    setStructuralSeed(s => s + 1);
  }, [bassOnsetTick, isAudioEnabled, isAudioReactive, audioEnergy]);
}
