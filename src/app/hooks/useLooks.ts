import { useCallback, useRef, useState, type MutableRefObject, type SetStateAction } from 'react';
import { DARK_GROUND_GRADIENTS } from '../constants/palettePresets';
import { LOOK_DEFAULTS } from '../constants/gradientLooks';
import { PALETTE_PRESETS } from '../constants/palettePresets';
import { generateFamilyPalette } from '../utils/colorFamily';
import { hexToRgb } from '../utils/color';
import { inFamily } from '../utils/colorFamily';
import { paletteFamily } from '../utils/colorFamily';
import { samplePalette } from '../utils/color';
import { startsDark } from '../constants/palettePresets';
import type { ColorBlend } from '../utils/color';
import type { ColorRGB, GradientType } from '../constants/gradientEffects';
import type { Family } from '../utils/colorFamily';
import type { GradientLook, LookParamKey } from '../constants/gradientLooks';

// Looks and palettes: applying a Look (palette plus the gradient's own sliders), a library palette, the shuffle-colors button and the Same family option. Moved out of InteractiveGradient unchanged.
export interface UseLooksParams {
  colorBlend: "linear" | "srgb" | "oklab" | "oklch";
  gradientColorsRef: MutableRefObject<ColorRGB[]>;
  gradientTypeRef: MutableRefObject<GradientType>;
  saveCurrentState: () => void;
  setAngleStartOffset: (value: SetStateAction<number>) => void;
  setAttractorPointCount: (value: SetStateAction<number>) => void;
  setAttractorScale: (value: SetStateAction<number>) => void;
  setAttractorSpeed: (value: SetStateAction<number>) => void;
  setCausticsBrightness: (value: SetStateAction<number>) => void;
  setCausticsScale: (value: SetStateAction<number>) => void;
  setColorBlend: (value: SetStateAction<ColorBlend>) => void;
  setColorsInstant: (colors: ColorRGB[]) => void;
  setFadeDirection: (value: SetStateAction<number>) => void;
  setFieldContrast: (value: SetStateAction<number>) => void;
  setFieldExposure: (value: SetStateAction<number>) => void;
  setFieldGrade: (value: SetStateAction<{ brightness: number; contrast: number; saturation: number; }>) => void;
  setFieldScale: (value: SetStateAction<number>) => void;
  setFieldShapes: (value: SetStateAction<Record<string, [number, number]>>) => void;
  setFieldSpeed: (value: SetStateAction<number>) => void;
  setFieldSwirl: (value: SetStateAction<number>) => void;
  setFieldTone: (value: SetStateAction<"off" | "aces" | "soft">) => void;
  setFlowerCircles: (value: SetStateAction<number>) => void;
  setFlowerScale: (value: SetStateAction<number>) => void;
  setFlowerSpread: (value: SetStateAction<number>) => void;
  setGridColumns: (value: SetStateAction<number>) => void;
  setGridRows: (value: SetStateAction<number>) => void;
  setHatchLayers: (value: SetStateAction<number>) => void;
  setHatchResponse: (value: SetStateAction<number>) => void;
  setHatchSpacing: (value: SetStateAction<number>) => void;
  setHatchSpeed: (value: SetStateAction<number>) => void;
  setHelixTightness: (value: SetStateAction<number>) => void;
  setHelixTurns: (value: SetStateAction<number>) => void;
  setJuliaImaginary: (value: SetStateAction<number>) => void;
  setJuliaIterations: (value: SetStateAction<number>) => void;
  setJuliaReal: (value: SetStateAction<number>) => void;
  setJuliaZoom: (value: SetStateAction<number>) => void;
  setLavaBlobCount: (value: SetStateAction<number>) => void;
  setLavaBlobSize: (value: SetStateAction<number>) => void;
  setLavaSpeed: (value: SetStateAction<number>) => void;
  setMarbleOctaves: (value: SetStateAction<number>) => void;
  setMarbleTurbulence: (value: SetStateAction<number>) => void;
  setMarbleVeinFreq: (value: SetStateAction<number>) => void;
  setMetaballCount: (value: SetStateAction<number>) => void;
  setMetaballSize: (value: SetStateAction<number>) => void;
  setMetaballSpeed: (value: SetStateAction<number>) => void;
  setNoiseOctaves: (value: SetStateAction<number>) => void;
  setNoiseScale: (value: SetStateAction<number>) => void;
  setNoiseSpeed: (value: SetStateAction<number>) => void;
  setNoiseType: (value: SetStateAction<"smooth" | "ridged" | "turbulence">) => void;
  setNoiseWarp: (value: SetStateAction<number>) => void;
  setPaletteBias: (value: SetStateAction<number>) => void;
  setPaletteSharp: (value: SetStateAction<number>) => void;
  setPaletteStops: (value: SetStateAction<number[]>) => void;
  setParticlesCount: (value: SetStateAction<number>) => void;
  setParticlesGravity: (value: SetStateAction<number>) => void;
  setParticlesSize: (value: SetStateAction<number>) => void;
  setParticlesSpeed: (value: SetStateAction<number>) => void;
  setParticlesTrail: (value: SetStateAction<number>) => void;
  setRadialBurstCount: (value: SetStateAction<number>) => void;
  setRadialBurstMode: (value: SetStateAction<"burst" | "sweep">) => void;
  setRadialBurstSize: (value: SetStateAction<number>) => void;
  setRadialBurstSpread: (value: SetStateAction<number>) => void;
  setRadialSizeScale: (value: SetStateAction<number>) => void;
  setRadialSpeed: (value: SetStateAction<number>) => void;
  setReactionDiffusionFeed: (value: SetStateAction<number>) => void;
  setReactionDiffusionKill: (value: SetStateAction<number>) => void;
  setReactionDiffusionSpeed: (value: SetStateAction<number>) => void;
  setShapesCount: (value: SetStateAction<number>) => void;
  setShapesSides: (value: SetStateAction<number>) => void;
  setStackCount: (value: SetStateAction<number>) => void;
  setStackGap: (value: SetStateAction<number>) => void;
  setStackLength: (value: SetStateAction<number>) => void;
  setStackResponse: (value: SetStateAction<number>) => void;
  setStackWidth: (value: SetStateAction<number>) => void;
  setTargetColors: (value: SetStateAction<ColorRGB[]>) => void;
  setTilingComplexity: (value: SetStateAction<number>) => void;
  setTilingRotation: (value: SetStateAction<number>) => void;
  setTilingSize: (value: SetStateAction<number>) => void;
  setTilingSymmetry: (value: SetStateAction<number>) => void;
  setTopographicBands: (value: SetStateAction<number>) => void;
  setTopographicLineWidth: (value: SetStateAction<number>) => void;
  setTopographicScale: (value: SetStateAction<number>) => void;
  setTruchetSize: (value: SetStateAction<number>) => void;
  setTruchetThickness: (value: SetStateAction<number>) => void;
  setTruchetVariation: (value: SetStateAction<number>) => void;
  setVoronoiCellCount: (value: SetStateAction<number>) => void;
  setVoronoiDistortion: (value: SetStateAction<number>) => void;
  setWindmillMode: (value: SetStateAction<"blades" | "helix">) => void;
}

export function useLooks(p: UseLooksParams) {
  const { colorBlend, gradientColorsRef, gradientTypeRef, saveCurrentState, setAngleStartOffset, setAttractorPointCount, setAttractorScale, setAttractorSpeed, setCausticsBrightness, setCausticsScale, setColorBlend, setColorsInstant, setFadeDirection, setFieldContrast, setFieldExposure, setFieldGrade, setFieldScale, setFieldShapes, setFieldSpeed, setFieldSwirl, setFieldTone, setFlowerCircles, setFlowerScale, setFlowerSpread, setGridColumns, setGridRows, setHatchLayers, setHatchResponse, setHatchSpacing, setHatchSpeed, setHelixTightness, setHelixTurns, setJuliaImaginary, setJuliaIterations, setJuliaReal, setJuliaZoom, setLavaBlobCount, setLavaBlobSize, setLavaSpeed, setMarbleOctaves, setMarbleTurbulence, setMarbleVeinFreq, setMetaballCount, setMetaballSize, setMetaballSpeed, setNoiseOctaves, setNoiseScale, setNoiseSpeed, setNoiseType, setNoiseWarp, setPaletteBias, setPaletteSharp, setPaletteStops, setParticlesCount, setParticlesGravity, setParticlesSize, setParticlesSpeed, setParticlesTrail, setRadialBurstCount, setRadialBurstMode, setRadialBurstSize, setRadialBurstSpread, setRadialSizeScale, setRadialSpeed, setReactionDiffusionFeed, setReactionDiffusionKill, setReactionDiffusionSpeed, setShapesCount, setShapesSides, setStackCount, setStackGap, setStackLength, setStackResponse, setStackWidth, setTargetColors, setTilingComplexity, setTilingRotation, setTilingSize, setTilingSymmetry, setTopographicBands, setTopographicLineWidth, setTopographicScale, setTruchetSize, setTruchetThickness, setTruchetVariation, setVoronoiCellCount, setVoronoiDistortion, setWindmillMode } = p;
  // Applies a named Look (constants/gradientLooks.ts): the palette plus whichever
  // of Scale/Speed/Bias/Sharpness/Contrast it specifies, resetting the ones it
  // doesn't to their defaults so a look always lands the same way. A palette the
  // same length as the current one eases in; a different length snaps (see
  // setColorsInstant for why a length change can't ease) — Shuffle sidesteps that
  // by passing `colorsOverride`, the look's palette resampled to the current
  // length. No undo snapshot here: callers that want one take it themselves
  // (the chips below; Shuffle already does).
  const applyLookValues = useCallback((look: GradientLook, colorsOverride?: ColorRGB[]) => {
    const colors = colorsOverride ?? look.colors.map(hexToRgb);
    if (colors.length === gradientColorsRef.current.length) setTargetColors(colors);
    else setColorsInstant(colors);
    setFieldScale(look.scale ?? LOOK_DEFAULTS.scale);
    setFieldSpeed(look.speed ?? LOOK_DEFAULTS.speed);
    setPaletteBias(look.bias ?? LOOK_DEFAULTS.bias);
    setPaletteSharp(look.sharp ?? LOOK_DEFAULTS.sharp);
    setFieldContrast(look.contrast ?? LOOK_DEFAULTS.contrast);
    setPaletteStops(null);
    if (look.blend) setColorBlend(look.blend);
    // The gradient's own sliders/modes. Only what the look lists is touched.
    if (look.params) {
      const setters: Record<LookParamKey, (v: any) => void> = { // eslint-disable-line @typescript-eslint/no-explicit-any
        causticsBrightness: setCausticsBrightness, causticsScale: setCausticsScale,
        lavaBlobCount: setLavaBlobCount, lavaBlobSize: setLavaBlobSize, lavaSpeed: setLavaSpeed,
        marbleVeinFreq: setMarbleVeinFreq, marbleTurbulence: setMarbleTurbulence, marbleOctaves: setMarbleOctaves,
        metaballCount: setMetaballCount, metaballSize: setMetaballSize, metaballSpeed: setMetaballSpeed,
        noiseScale: setNoiseScale, noiseOctaves: setNoiseOctaves, noiseWarp: setNoiseWarp, noiseSpeed: setNoiseSpeed, noiseType: setNoiseType,
        topographicScale: setTopographicScale, topographicBands: setTopographicBands, topographicLineWidth: setTopographicLineWidth,
        juliaReal: setJuliaReal, juliaImaginary: setJuliaImaginary, juliaZoom: setJuliaZoom, juliaIterations: setJuliaIterations,
        tilingSize: setTilingSize, tilingSymmetry: setTilingSymmetry, tilingComplexity: setTilingComplexity, tilingRotation: setTilingRotation,
        reactionDiffusionFeed: setReactionDiffusionFeed, reactionDiffusionKill: setReactionDiffusionKill, reactionDiffusionSpeed: setReactionDiffusionSpeed,
        voronoiCellCount: setVoronoiCellCount, voronoiDistortion: setVoronoiDistortion,
        radialSizeScale: setRadialSizeScale, radialSpeed: setRadialSpeed,
        radialBurstMode: setRadialBurstMode, radialBurstCount: setRadialBurstCount, radialBurstSize: setRadialBurstSize, radialBurstSpread: setRadialBurstSpread,
        windmillMode: setWindmillMode, helixTurns: setHelixTurns, helixTightness: setHelixTightness,
        fadeDirection: setFadeDirection, angleStartOffset: setAngleStartOffset,
        flowerCircles: setFlowerCircles, flowerScale: setFlowerScale, flowerSpread: setFlowerSpread,
        gridRows: setGridRows, gridColumns: setGridColumns, shapesCount: setShapesCount, shapesSides: setShapesSides,
        stackCount: setStackCount, stackGap: setStackGap, stackWidth: setStackWidth, stackLength: setStackLength, stackResponse: setStackResponse,
        hatchLayers: setHatchLayers, hatchSpacing: setHatchSpacing, hatchResponse: setHatchResponse, hatchSpeed: setHatchSpeed,
        truchetSize: setTruchetSize, truchetVariation: setTruchetVariation, truchetThickness: setTruchetThickness,
        particlesCount: setParticlesCount, particlesSize: setParticlesSize, particlesSpeed: setParticlesSpeed, particlesTrail: setParticlesTrail, particlesGravity: setParticlesGravity,
        attractorPointCount: setAttractorPointCount, attractorSpeed: setAttractorSpeed, attractorScale: setAttractorScale,
      };
      for (const [key, value] of Object.entries(look.params) as [LookParamKey, number | string][]) {
        setters[key](value);
      }
    }
  }, [setColorsInstant]);

  // What a Look chip does: the same, but undoable.
  const applyGradientLook = useCallback((look: GradientLook) => {
    colorFamilyRef.current.anchor = null;
    saveCurrentState();
    applyLookValues(look);
    // A Look lands the same way every time, so the gradient's shape sliders go back to 1 too.
    setFieldShapes(prev => ({ ...prev, [gradientTypeRef.current]: [1, 1] }));
    setFieldExposure(0);
    setFieldTone('off');
    setFieldGrade({ brightness: 1, contrast: 1, saturation: 1 });
    setFieldSwirl(0);
  }, [saveCurrentState, applyLookValues, setFieldShapes, setFieldExposure, setFieldTone, setFieldGrade, setFieldSwirl, gradientTypeRef]);

  // "Same family": Shuffle keeps to the color family the palette was in when this was switched on (or
  // when you last picked a palette yourself), so a run of shuffles reads as one mood.
  const [keepFamily, setKeepFamilyState] = useState(() => { try { return localStorage.getItem('wavKeepFamily') === '1'; } catch { return false; } });
  const colorFamilyRef = useRef<{ enabled: boolean; anchor: Family | null }>({ enabled: keepFamily, anchor: null });
  colorFamilyRef.current.enabled = keepFamily;
  if (keepFamily && !colorFamilyRef.current.anchor && gradientColorsRef.current.length) colorFamilyRef.current.anchor = paletteFamily(gradientColorsRef.current);
  const setKeepFamily = (v: boolean) => {
    colorFamilyRef.current.anchor = v ? paletteFamily(gradientColorsRef.current) : null;
    setKeepFamilyState(v);
    try { localStorage.setItem('wavKeepFamily', v ? '1' : '0'); } catch { /* not persisted */ }
  };

  // A colors-only palette from the library: eases in when it has as many colors as now, else
  // is re-cut to the current count (same rule as the Color tab's Start from > Palettes).
  const applyPalette = useCallback((palette: { colors: string[] }, opts?: { fromShuffle?: boolean }) => {
    if (!opts?.fromShuffle) colorFamilyRef.current.anchor = null; // your own pick re-anchors the family
    saveCurrentState();
    const colors = palette.colors.map(hexToRgb);
    const n = gradientColorsRef.current.length;
    if (colors.length === n) setTargetColors(colors);
    else setColorsInstant(samplePalette(colors, null, 0.5, 0, colorBlend, n));
    setPaletteStops(null);
  }, [saveCurrentState, setTargetColors, setColorsInstant, colorBlend, setPaletteStops]);

  // The shuffle button beside the Looks & palettes menu: a random palette from the library
  // (one that starts dark when the gradient needs a dark backdrop), never the one already showing.
  const lastShuffledPaletteRef = useRef<string | null>(null);
  const shuffleColors = useCallback(() => {
    const dark = DARK_GROUND_GRADIENTS.includes(gradientTypeRef.current);
    const fam = colorFamilyRef.current;
    const anchor = fam.enabled ? (fam.anchor ?? (fam.anchor = paletteFamily(gradientColorsRef.current))) : null;
    const n = gradientColorsRef.current.length;
    let pool = (dark ? PALETTE_PRESETS.filter(startsDark) : PALETTE_PRESETS);
    if (anchor) pool = pool.filter(p => inFamily(p.colors.map(hexToRgb), anchor));
    const live = gradientColorsRef.current;
    const liveKey = live.map(c => `${Math.round(c.r / 8)},${Math.round(c.g / 8)},${Math.round(c.b / 8)}`).join('|');
    // Also never the one picked last time: the live colors are still easing toward it for a second or two.
    const choices = pool.filter(p => p.name !== lastShuffledPaletteRef.current && p.colors.map(hexToRgb).map(c => `${Math.round(c.r / 8)},${Math.round(c.g / 8)},${Math.round(c.b / 8)}`).join('|') !== liveKey);
    if (anchor && (choices.length < 2 || Math.random() < 0.35)) {
      // Too few library palettes in this family (or just for variety): make one.
      saveCurrentState();
      setTargetColors(generateFamilyPalette(anchor, n, dark));
      setPaletteStops(null);
      lastShuffledPaletteRef.current = null;
      return;
    }
    const pick = (choices.length ? choices : pool)[Math.floor(Math.random() * (choices.length ? choices.length : pool.length))];
    if (pick) { lastShuffledPaletteRef.current = pick.name; applyPalette(pick, { fromShuffle: true }); }
  }, [applyPalette, saveCurrentState, setTargetColors, setPaletteStops]);
  return { applyGradientLook, applyLookValues, applyPalette, colorFamilyRef, keepFamily, setKeepFamily, shuffleColors };
}
