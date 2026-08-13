import React, { useState } from 'react';
import { Shuffle, CaretDown } from '@phosphor-icons/react';
import { type EffectType } from '../constants/gradientEffects';
import { costOf, totalCost, MULTI_FX_COST_BUDGET } from '../constants/effectCost';
import { EFFECTS_UI_LIST, EFFECT_LABELS } from '../constants/effectRegistry';

// Generative effects paint their own evolving content from scratch each
// frame (an overlay, composited via their own Opacity slider) instead of
// reading and transforming whatever's already on the canvas, the way every
// other effect here does. That's a different enough mental model — they
// don't need anything else active to look interesting — that they get
// their own section below the main grid rather than sitting alphabetically
// interleaved with the transform effects. Purely a UI grouping: still
// ordinary entries in EFFECT_REGISTRY, still in the same activeEffects
// array, still in Shuffle's pool — this list only controls where their
// button renders.
// Alphabetized by label — this is the order the section's button grid
// renders in, so keep new entries sorted in by their display label.
const GENERATIVE_EFFECT_IDS: EffectType[] = ['aura-glow', 'confetti', 'fluid-field', 'lightning-web', 'particle-trails', 'starfield', 'static-field', 'triangle-field', 'voronoi-cells', 'wind-streaks'];
import { EffectSection, EMOJI_PICKER_CATEGORIES } from './InteractiveGradient';

export interface EffectsTabProps {
  isMobile: boolean;
  activeEffects: EffectType[];
  setActiveEffects: (v: EffectType[]) => void;
  isMultiFxMode: boolean; setIsMultiFxMode: (v: boolean) => void;
  expandedEffects: Set<string>;
  toggleEffectExpanded: (id: string) => void;
  randomizeEffects: () => void;

  // Kaleidoscope
  kaleidoscopeSegments: number; setKaleidoscopeSegments: (v: number) => void;
  kaleidoscopeRotateSpeed: number; setKaleidoscopeRotateSpeed: (v: number) => void;
  // Ripple
  rippleFrequency: number; setRippleFrequency: (v: number) => void;
  rippleAmplitude: number; setRippleAmplitude: (v: number) => void;
  // ASCII
  asciiSize: number; setAsciiSize: (v: number) => void;
  asciiChars: string; setAsciiChars: (v: string) => void;
  asciiColor: boolean; setAsciiColor: (v: boolean) => void;
  // Emoji
  emojiChars: string; setEmojiChars: React.Dispatch<React.SetStateAction<string>>;
  emojiSize: number; setEmojiSize: (v: number) => void;
  emojiRotateSpeed: number; setEmojiRotateSpeed: (v: number) => void;
  emojiSizeVariation: number; setEmojiSizeVariation: (v: number) => void;
  emojiOffsetX: number; setEmojiOffsetX: (v: number) => void;
  isEmojiPickerOpen: boolean; setIsEmojiPickerOpen: (v: boolean) => void;
  emojiPickerSearch: string; setEmojiPickerSearch: (v: string) => void;
  // Liquid
  liquidStrength: number; setLiquidStrength: (v: number) => void;
  liquidScale: number; setLiquidScale: (v: number) => void;
  // Displace
  // CRT
  crtIntensity: number; setCrtIntensity: (v: number) => void;
  // Photo
  handlePhotoFileClick: () => void;
  photoFileName: string;
  photoBlendMode: 'source-over' | 'multiply' | 'screen' | 'overlay'; setPhotoBlendMode: (v: 'source-over' | 'multiply' | 'screen' | 'overlay') => void;
  photoOpacity: number; setPhotoOpacity: (v: number) => void;
  // Chromatic Trails
  chromaticTrailsDecay: number; setChromaticTrailsDecay: (v: number) => void;
  chromaticTrailsOffset: number; setChromaticTrailsOffset: (v: number) => void;
  // Pixelate
  pixelSize: number; setPixelSize: (v: number) => void;
  // Triangulate
  triangleSize: number; setTriangleSize: (v: number) => void;
  triangulateVariation: number; setTriangulateVariation: (v: number) => void;
  // Chromatic
  chromaticOffset: number; setChromaticOffset: (v: number) => void;
  chromaticAngle: number; setChromaticAngle: (v: number) => void;
  // Fisheye
  fisheyeStrength: number; setFisheyeStrength: (v: number) => void;
  fisheyeCenterX: number; setFisheyeCenterX: (v: number) => void;
  fisheyeCenterY: number; setFisheyeCenterY: (v: number) => void;
  // Bloom
  bloomIntensity: number; setBloomIntensity: (v: number) => void;
  bloomRadius: number; setBloomRadius: (v: number) => void;
  // Feedback
  feedbackDecay: number; setFeedbackDecay: (v: number) => void;
  feedbackZoom: number; setFeedbackZoom: (v: number) => void;
  feedbackRotation: number; setFeedbackRotation: (v: number) => void;
  // Mirror
  mirrorMode: 'horizontal' | 'vertical' | 'grid'; setMirrorMode: (v: 'horizontal' | 'vertical' | 'grid') => void;
  mirrorTileCount: number; setMirrorTileCount: (v: number) => void;
  // Vignette
  vignetteStrength: number; setVignetteStrength: (v: number) => void;
  vignetteSoftness: number; setVignetteSoftness: (v: number) => void;
  // Scanlines
  // Shift
  colorShiftHue: number; setColorShiftHue: (v: number) => void;
  // Grain
  grainIntensity: number; setGrainIntensity: (v: number) => void;
  grainType: 'fine' | 'medium' | 'coarse' | 'film'; setGrainType: (v: 'fine' | 'medium' | 'coarse' | 'film') => void;
  // Blur
  blurType: 'gaussian' | 'motion' | 'radial' | 'zoom'; setBlurType: (v: 'gaussian' | 'motion' | 'radial' | 'zoom') => void;
  blurGaussianAmount: number; setBlurGaussianAmount: (v: number) => void;
  blurMotionAmount: number; setBlurMotionAmount: (v: number) => void;
  blurMotionDirection: number; setBlurMotionDirection: (v: number) => void;
  blurRadialAmount: number; setBlurRadialAmount: (v: number) => void;
  // Posterize
  posterizeLevels: number; setPosterizeLevels: (v: number) => void;
  // Halftone
  halftoneSize: number; setHalftoneSize: (v: number) => void;
  halftoneCMYK: boolean; setHalftoneCMYK: (v: boolean) => void;
  halftoneMove: boolean; setHalftoneMove: (v: boolean) => void;
  halftoneVariation: number; setHalftoneVariation: (v: number) => void;
  // Invert
  invertAmount: number; setInvertAmount: (v: number) => void;
  // Duotone
  duotoneColor1: string; setDuotoneColor1: (v: string) => void;
  duotoneColor2: string; setDuotoneColor2: (v: string) => void;
  duotoneColor3: string; setDuotoneColor3: (v: string) => void;
  duotoneThreeColor: boolean; setDuotoneThreeColor: (v: boolean) => void;
  duotoneIntensity: number; setDuotoneIntensity: (v: number) => void;
  // Grid (effect)
  gridRows: number; setGridRows: (v: number) => void;
  gridColumns: number; setGridColumns: (v: number) => void;
  gridSides: number; setGridSides: (v: number) => void;
  gridShapeSize: number; setGridShapeSize: (v: number) => void;
  gridVariation: number; setGridVariation: (v: number) => void;
  gridRotationDirection: 'none' | 'clockwise' | 'counterclockwise'; setGridRotationDirection: (v: 'none' | 'clockwise' | 'counterclockwise') => void;
  // VHS
  vhsGlitchIntensity: number; setVhsGlitchIntensity: (v: number) => void;
  dustCrackleIntensity: number; setDustCrackleIntensity: (v: number) => void;
  dustCrackleLength: number; setDustCrackleLength: (v: number) => void;
  dustCrackleColor: string; setDustCrackleColor: (v: string) => void;
  // Wave
  waveDistortionStrength: number; setWaveDistortionStrength: (v: number) => void;
  waveDistortionRotation: number; setWaveDistortionRotation: (v: number) => void;
  // Slit-Scan
  slitScanIntensity: number; setSlitScanIntensity: (v: number) => void;
  slitScanDirection: 'horizontal' | 'vertical' | 'radial' | 'circular'; setSlitScanDirection: (v: 'horizontal' | 'vertical' | 'radial' | 'circular') => void;
  // Dither
  ditherLevels: number; setDitherLevels: (v: number) => void;
  ditherType: 'bayer' | 'floyd-steinberg'; setDitherType: (v: 'bayer' | 'floyd-steinberg') => void;
  // Glitch
  glitchIntensity: number; setGlitchIntensity: (v: number) => void;
  glitchBlockSize: number; setGlitchBlockSize: (v: number) => void;
  glitchChromaSplit: number; setGlitchChromaSplit: (v: number) => void;
  // Triangle Field
  triangleFieldGridSize: number; setTriangleFieldGridSize: (v: number) => void;
  triangleFieldSpeed: number; setTriangleFieldSpeed: (v: number) => void;
  triangleFieldOpacity: number; setTriangleFieldOpacity: (v: number) => void;
  // Fluid Field
  fluidFieldScale: number; setFluidFieldScale: (v: number) => void;
  fluidFieldSpeed: number; setFluidFieldSpeed: (v: number) => void;
  fluidFieldOpacity: number; setFluidFieldOpacity: (v: number) => void;
  // Static Field
  staticFieldIntensity: number; setStaticFieldIntensity: (v: number) => void;
  staticFieldBarSpeed: number; setStaticFieldBarSpeed: (v: number) => void;
  staticFieldOpacity: number; setStaticFieldOpacity: (v: number) => void;
  // Particle Trails
  particleTrailsCount: number; setParticleTrailsCount: (v: number) => void;
  particleTrailsSpeed: number; setParticleTrailsSpeed: (v: number) => void;
  particleTrailsOpacity: number; setParticleTrailsOpacity: (v: number) => void;
  // Wind Streaks
  windStreaksCount: number; setWindStreaksCount: (v: number) => void;
  windStreaksSpeed: number; setWindStreaksSpeed: (v: number) => void;
  windStreaksOpacity: number; setWindStreaksOpacity: (v: number) => void;
  // Aura Glow
  auraGlowCount: number; setAuraGlowCount: (v: number) => void;
  auraGlowSpeed: number; setAuraGlowSpeed: (v: number) => void;
  auraGlowOpacity: number; setAuraGlowOpacity: (v: number) => void;
  // Starfield
  starfieldCount: number; setStarfieldCount: (v: number) => void;
  starfieldSpeed: number; setStarfieldSpeed: (v: number) => void;
  starfieldOpacity: number; setStarfieldOpacity: (v: number) => void;
  // Lightning Web
  lightningWebCount: number; setLightningWebCount: (v: number) => void;
  lightningWebSpeed: number; setLightningWebSpeed: (v: number) => void;
  lightningWebOpacity: number; setLightningWebOpacity: (v: number) => void;
  // Voronoi Cells
  voronoiCellsCount: number; setVoronoiCellsCount: (v: number) => void;
  voronoiCellsSpeed: number; setVoronoiCellsSpeed: (v: number) => void;
  voronoiCellsOpacity: number; setVoronoiCellsOpacity: (v: number) => void;
  // Confetti
  confettiCount: number; setConfettiCount: (v: number) => void;
  confettiSpeed: number; setConfettiSpeed: (v: number) => void;
  confettiOpacity: number; setConfettiOpacity: (v: number) => void;
}

const EffectsTabInner: React.FC<EffectsTabProps> = (props) => {
  const {
    isMobile,
    activeEffects, setActiveEffects, isMultiFxMode, setIsMultiFxMode, expandedEffects, toggleEffectExpanded, randomizeEffects,
    kaleidoscopeSegments, setKaleidoscopeSegments, kaleidoscopeRotateSpeed, setKaleidoscopeRotateSpeed,
    rippleFrequency, setRippleFrequency, rippleAmplitude, setRippleAmplitude,
    asciiSize, setAsciiSize, asciiChars, setAsciiChars, asciiColor, setAsciiColor,
    emojiChars, setEmojiChars, emojiSize, setEmojiSize, emojiRotateSpeed, setEmojiRotateSpeed,
    emojiSizeVariation, setEmojiSizeVariation, emojiOffsetX, setEmojiOffsetX,
    isEmojiPickerOpen, setIsEmojiPickerOpen, emojiPickerSearch, setEmojiPickerSearch,
    liquidStrength, setLiquidStrength, liquidScale, setLiquidScale,
    crtIntensity, setCrtIntensity,
    handlePhotoFileClick, photoFileName, photoBlendMode, setPhotoBlendMode, photoOpacity, setPhotoOpacity,
    chromaticTrailsDecay, setChromaticTrailsDecay, chromaticTrailsOffset, setChromaticTrailsOffset,
    pixelSize, setPixelSize, triangleSize, setTriangleSize, triangulateVariation, setTriangulateVariation,
    chromaticOffset, setChromaticOffset, chromaticAngle, setChromaticAngle,
    fisheyeStrength, setFisheyeStrength, fisheyeCenterX, setFisheyeCenterX, fisheyeCenterY, setFisheyeCenterY,
    bloomIntensity, setBloomIntensity, bloomRadius, setBloomRadius,
    feedbackDecay, setFeedbackDecay, feedbackZoom, setFeedbackZoom, feedbackRotation, setFeedbackRotation,
    mirrorMode, setMirrorMode, mirrorTileCount, setMirrorTileCount,
    vignetteStrength, setVignetteStrength, vignetteSoftness, setVignetteSoftness,
    colorShiftHue, setColorShiftHue,
    grainIntensity, setGrainIntensity, grainType, setGrainType,
    blurType, setBlurType, blurGaussianAmount, setBlurGaussianAmount, blurMotionAmount, setBlurMotionAmount,
    blurMotionDirection, setBlurMotionDirection, blurRadialAmount, setBlurRadialAmount,
    posterizeLevels, setPosterizeLevels,
    halftoneSize, setHalftoneSize, halftoneCMYK, setHalftoneCMYK, halftoneMove, setHalftoneMove, halftoneVariation, setHalftoneVariation,
    invertAmount, setInvertAmount,
    duotoneColor1, setDuotoneColor1, duotoneColor2, setDuotoneColor2, duotoneColor3, setDuotoneColor3,
    duotoneThreeColor, setDuotoneThreeColor, duotoneIntensity, setDuotoneIntensity,
    gridRows, setGridRows, gridColumns, setGridColumns, gridSides, setGridSides,
    gridShapeSize, setGridShapeSize, gridVariation, setGridVariation, gridRotationDirection, setGridRotationDirection,
    vhsGlitchIntensity, setVhsGlitchIntensity, dustCrackleIntensity, setDustCrackleIntensity,
    dustCrackleLength, setDustCrackleLength, dustCrackleColor, setDustCrackleColor,
    waveDistortionStrength, setWaveDistortionStrength, waveDistortionRotation, setWaveDistortionRotation,
    slitScanIntensity, setSlitScanIntensity, slitScanDirection, setSlitScanDirection,
    ditherLevels, setDitherLevels, ditherType, setDitherType,
    glitchIntensity, setGlitchIntensity, glitchBlockSize, setGlitchBlockSize, glitchChromaSplit, setGlitchChromaSplit,
    triangleFieldGridSize, setTriangleFieldGridSize, triangleFieldSpeed, setTriangleFieldSpeed, triangleFieldOpacity, setTriangleFieldOpacity,
    fluidFieldScale, setFluidFieldScale, fluidFieldSpeed, setFluidFieldSpeed, fluidFieldOpacity, setFluidFieldOpacity,
    staticFieldIntensity, setStaticFieldIntensity, staticFieldBarSpeed, setStaticFieldBarSpeed, staticFieldOpacity, setStaticFieldOpacity,
    particleTrailsCount, setParticleTrailsCount, particleTrailsSpeed, setParticleTrailsSpeed, particleTrailsOpacity, setParticleTrailsOpacity,
    windStreaksCount, setWindStreaksCount, windStreaksSpeed, setWindStreaksSpeed, windStreaksOpacity, setWindStreaksOpacity,
    auraGlowCount, setAuraGlowCount, auraGlowSpeed, setAuraGlowSpeed, auraGlowOpacity, setAuraGlowOpacity,
    starfieldCount, setStarfieldCount, starfieldSpeed, setStarfieldSpeed, starfieldOpacity, setStarfieldOpacity,
    lightningWebCount, setLightningWebCount, lightningWebSpeed, setLightningWebSpeed, lightningWebOpacity, setLightningWebOpacity,
    voronoiCellsCount, setVoronoiCellsCount, voronoiCellsSpeed, setVoronoiCellsSpeed, voronoiCellsOpacity, setVoronoiCellsOpacity,
    confettiCount, setConfettiCount, confettiSpeed, setConfettiSpeed, confettiOpacity, setConfettiOpacity,
  } = props;

  const [isGenerativeFxOpen, setIsGenerativeFxOpen] = useState(false);

  // Scoped to GENERATIVE_EFFECT_IDS only, unlike the main Shuffle Effects
  // button (which redraws the entire activeEffects set from all of
  // ALL_EFFECTS) — this only touches which generative effect(s) are
  // active, leaving any non-generative effects already on untouched.
  const shuffleGenerativeEffects = () => {
    const nonGenerative = activeEffects.filter((e: EffectType) => !GENERATIVE_EFFECT_IDS.includes(e));
    if (isMultiFxMode) {
      const shuffled = [...GENERATIVE_EFFECT_IDS].sort(() => Math.random() - 0.5);
      const numPicks = Math.floor(Math.random() * Math.min(3, shuffled.length)) + 1;
      const picks: EffectType[] = [];
      let cost = totalCost(nonGenerative);
      for (const id of shuffled) {
        if (picks.length >= numPicks) break;
        const c = costOf(id);
        if (cost + c > MULTI_FX_COST_BUDGET) continue;
        picks.push(id);
        cost += c;
      }
      setActiveEffects([...nonGenerative, ...picks]);
    } else {
      const pick = GENERATIVE_EFFECT_IDS[Math.floor(Math.random() * GENERATIVE_EFFECT_IDS.length)];
      setActiveEffects([pick]);
    }
  };

  return (
    <>
        <div className="w-full rounded-lg overflow-hidden border border-white/10 bg-black/25">
          {/* Top row: MULTI + Shuffle + RESET — folded into the same rounded rectangle as the effects grid below */}
          <div className="w-full flex gap-0 border-b border-white/10">
            <button
              onClick={() => { setIsMultiFxMode(!isMultiFxMode); if (!isMultiFxMode && activeEffects.length === 0) {} }}
              aria-pressed={isMultiFxMode}
              className={`flex-1 px-0.5 py-1 text-[10px] font-semibold transition-all whitespace-nowrap border-r border-white/10 ${isMultiFxMode ? 'bg-white text-black font-bold' : 'text-white hover:bg-white/10'}`}
              title="Toggle Multi-FX (M)"
            >MULTI</button>
            <button
              onClick={randomizeEffects}
              className="flex-1 px-0.5 py-1 text-[10px] font-semibold transition-all text-white hover:bg-white/10 flex items-center justify-center border-r border-white/10"
              title="Shuffle Effects (Shift+F)"
              aria-label="Shuffle Effects"
            ><Shuffle weight="regular" className="w-4 h-4" /></button>
            <button
              onClick={() => { setActiveEffects([]); setIsMultiFxMode(false); }}
              aria-pressed={activeEffects.length === 0 && !isMultiFxMode}
              className={`flex-1 px-0.5 py-1 text-[10px] font-semibold transition-all whitespace-nowrap ${activeEffects.length === 0 && !isMultiFxMode ? 'bg-white text-black font-bold' : 'text-white hover:bg-white/10'}`}
            >RESET</button>
          </div>
          {(() => {
            // Derived from the single per-effect registry (constants/effectRegistry.ts)
            // instead of a hand-maintained list — adding/removing an effect no longer
            // requires touching this array too.
            const effectsList: { value: EffectType; label: string }[] =
              EFFECTS_UI_LIST.filter((value) => !GENERATIVE_EFFECT_IDS.includes(value))
                .map((value) => ({ value, label: EFFECT_LABELS[value] }));
            const rows = Math.ceil(effectsList.length / 2);
            return (
              <div className="grid grid-cols-2 gap-0" style={{ gridAutoFlow: 'column', gridTemplateRows: `repeat(${rows}, auto)` }}>
                {effectsList.map((effect, i) => {
                  const isLastInColumn = i % rows === rows - 1;
                  const isLeftColumn = i < rows;
                  const isActive = activeEffects.includes(effect.value);
                  // Manually stacking effects in Multi-FX had no limit at all
                  // — unlike feelingLucky's remix, which is cost-budgeted
                  // (see constants/effectCost.ts). A handful of effects do
                  // full-canvas per-pixel work every frame, and stacking
                  // several of those manually was the direct cause of real,
                  // reported playback slowdowns. Once the budget's spent,
                  // remaining (not-yet-active) effects are disabled rather
                  // than silently letting the stack keep growing.
                  const wouldExceedBudget = isMultiFxMode && !isActive
                    && totalCost(activeEffects) + costOf(effect.value) > MULTI_FX_COST_BUDGET;
                  return (
                    <button
                      key={effect.value}
                      disabled={wouldExceedBudget}
                      title={wouldExceedBudget ? 'Effect stack is at its performance budget — remove one to add another' : undefined}
                      aria-pressed={isActive}
                      onClick={() => {
                        if (isMultiFxMode) {
                          // Multi-FX mode: toggle effects on/off
                          if (isActive) {
                            setActiveEffects(activeEffects.filter(e => e !== effect.value));
                          } else if (!wouldExceedBudget) {
                            setActiveEffects([...activeEffects, effect.value]);
                          }
                        } else {
                          // Single-FX mode: select only this effect
                          if (isActive && activeEffects.length === 1) {
                            // If clicking the only active effect, clear it
                            setActiveEffects([]);
                          } else {
                            // Otherwise, set only this effect
                            setActiveEffects([effect.value]);
                          }
                        }
                      }}
                      className={`px-1 py-0.5 text-[10px] transition-all whitespace-nowrap ${isLeftColumn ? 'border-r border-white/10' : ''} ${!isLastInColumn ? 'border-b border-white/10' : ''} ${
                        isActive
                          ? 'bg-white text-black font-bold'
                          : wouldExceedBudget
                            ? 'text-white/30 wav-disabled-text cursor-not-allowed'
                            : 'text-white hover:bg-white/10'
                      }`}
                    >
                      {effect.label}
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Generative FX — paint their own evolving content instead of
            transforming the frame beneath them (see GENERATIVE_EFFECT_IDS
            above). Same button/toggle behavior as the main grid, just its
            own labeled, collapsible section so it reads as a different
            kind of effect rather than being alphabetically buried among
            the transform ones. MULTI shares the same global isMultiFxMode
            as the main row (one activeEffects array, one multi-mode);
            Shuffle and Reset are scoped to just this section's effects. */}
        <div className="w-full rounded-lg overflow-hidden border border-white/10 bg-black/25">
          <button
            onClick={() => setIsGenerativeFxOpen(!isGenerativeFxOpen)}
            className="flex items-center justify-center gap-1 w-full py-1 bg-transparent outline-none hover:bg-white/5 active:bg-transparent focus:outline-none appearance-none border-b border-white/10"
          >
            <span className="text-[10px] font-semibold text-white leading-none">GENERATIVE FX</span>
            <CaretDown weight="regular" className={`w-3 h-3 text-white/40 transition-transform shrink-0 ${isGenerativeFxOpen ? 'rotate-180' : ''}`} />
          </button>
          {isGenerativeFxOpen && (
          <>
          <div className="w-full flex gap-0 border-b border-white/10">
            <button
              onClick={() => setIsMultiFxMode(!isMultiFxMode)}
              aria-pressed={isMultiFxMode}
              className={`flex-1 px-0.5 py-1 text-[10px] font-semibold transition-all whitespace-nowrap border-r border-white/10 ${isMultiFxMode ? 'bg-white text-black font-bold' : 'text-white hover:bg-white/10'}`}
              title="Toggle Multi-FX (M)"
            >MULTI</button>
            <button
              onClick={shuffleGenerativeEffects}
              className="flex-1 px-0.5 py-1 text-[10px] font-semibold transition-all text-white hover:bg-white/10 flex items-center justify-center border-r border-white/10"
              title="Shuffle Generative FX"
              aria-label="Shuffle Generative FX"
            ><Shuffle weight="regular" className="w-4 h-4" /></button>
            <button
              onClick={() => setActiveEffects(activeEffects.filter((e: EffectType) => !GENERATIVE_EFFECT_IDS.includes(e)))}
              aria-pressed={!activeEffects.some((e: EffectType) => GENERATIVE_EFFECT_IDS.includes(e))}
              className={`flex-1 px-0.5 py-1 text-[10px] font-semibold transition-all whitespace-nowrap ${!activeEffects.some((e: EffectType) => GENERATIVE_EFFECT_IDS.includes(e)) ? 'bg-white text-black font-bold' : 'text-white hover:bg-white/10'}`}
            >RESET</button>
          </div>
          <div className="grid grid-cols-2 gap-0">
            {GENERATIVE_EFFECT_IDS.map((value, i) => {
              const label = EFFECT_LABELS[value];
              const isActive = activeEffects.includes(value);
              const wouldExceedBudget = isMultiFxMode && !isActive
                && totalCost(activeEffects) + costOf(value) > MULTI_FX_COST_BUDGET;
              const rows = Math.ceil(GENERATIVE_EFFECT_IDS.length / 2);
              const isLeftColumn = i % 2 === 0;
              const isLastRow = Math.floor(i / 2) === rows - 1;
              return (
                <button
                  key={value}
                  disabled={wouldExceedBudget}
                  title={wouldExceedBudget ? 'Effect stack is at its performance budget — remove one to add another' : undefined}
                  aria-pressed={isActive}
                  onClick={() => {
                    if (isMultiFxMode) {
                      if (isActive) {
                        setActiveEffects(activeEffects.filter(e => e !== value));
                      } else if (!wouldExceedBudget) {
                        setActiveEffects([...activeEffects, value]);
                      }
                    } else {
                      if (isActive && activeEffects.length === 1) {
                        setActiveEffects([]);
                      } else {
                        setActiveEffects([value]);
                      }
                    }
                  }}
                  className={`px-1 py-0.5 text-[10px] transition-all whitespace-nowrap ${isLeftColumn ? 'border-r border-white/10' : ''} ${!isLastRow ? 'border-b border-white/10' : ''} ${
                    isActive
                      ? 'bg-white text-black font-bold'
                      : wouldExceedBudget
                        ? 'text-white/30 wav-disabled-text cursor-not-allowed'
                        : 'text-white hover:bg-white/10'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          </>
          )}
        </div>

        {activeEffects.length > 0 && (() => {
          const isMulti = activeEffects.length > 1;

          return (
          <div className={`w-full bg-black/25 px-3 py-1 rounded-lg border border-white/10 ${isMulti && !isMobile ? 'max-h-64 overflow-y-auto' : ''}`}>
            <div className={`flex flex-col ${isMulti ? 'gap-0' : 'gap-1'}`}>
              {activeEffects.includes('kaleidoscope') && (
                <EffectSection id="kaleidoscope" label="Kaleidoscope" isMulti={isMulti} expanded={expandedEffects.has('kaleidoscope')} onToggle={toggleEffectExpanded}>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Segments:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="2"
                        max="50"
                        value={kaleidoscopeSegments}
                        onChange={(e) => setKaleidoscopeSegments(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="2"
                        max="50"
                        value={kaleidoscopeSegments}
                        onChange={(e) => setKaleidoscopeSegments(Number(e.target.value))}
                        className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Speed:</label>
                    <input type="range" min="0" max="5" step="0.05" value={kaleidoscopeRotateSpeed} onChange={(e) => setKaleidoscopeRotateSpeed(Number(e.target.value))} className="flex-1" />
                    <input type="number" min="0" max="5" step="0.05" value={kaleidoscopeRotateSpeed} onChange={(e) => setKaleidoscopeRotateSpeed(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                  </div>
                </EffectSection>
              )}
              {activeEffects.includes('ascii') && (
                <EffectSection id="ascii" label="ASCII" isMulti={isMulti} expanded={expandedEffects.has('ascii')} onToggle={toggleEffectExpanded}>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Cell Size:</label>
                    <input type="range" min="6" max="40" value={asciiSize} onChange={(e) => setAsciiSize(Number(e.target.value))} className="flex-1" />
                    <input type="number" min="6" max="40" value={asciiSize} onChange={(e) => setAsciiSize(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap" title="Darkest to brightest, left to right">Chars:</label>
                    <input
                      type="text"
                      value={asciiChars}
                      onChange={(e) => setAsciiChars(e.target.value)}
                      placeholder=" .:-=+*x#%@"
                      title="Darkest to brightest, left to right"
                      className="flex-1 min-w-0 text-[10px] text-white bg-black/25 border border-white/20 rounded px-1 py-1"
                    />
                    <label className="text-[10px] text-white whitespace-nowrap">Color:</label>
                    <button
                      onClick={() => setAsciiColor(!asciiColor)}
                      aria-pressed={asciiColor}
                      className={`shrink-0 px-2 py-0.5 text-[10px] rounded transition-all ${
                        asciiColor ? 'bg-white text-black font-bold' : 'bg-black/25 text-white hover:bg-white/15'
                      }`}
                    >
                      {asciiColor ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </EffectSection>
              )}
              {activeEffects.includes('emoji') && (
                <EffectSection id="emoji" label="Emoji" isMulti={isMulti} expanded={expandedEffects.has('emoji')} onToggle={toggleEffectExpanded}>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Cell Size:</label>
                    <input type="range" min="10" max="60" value={emojiSize} onChange={(e) => setEmojiSize(Number(e.target.value))} className="flex-1" />
                    <input type="number" min="10" max="60" value={emojiSize} onChange={(e) => setEmojiSize(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Rotate:</label>
                    <input type="range" min="0" max="180" value={emojiRotateSpeed} onChange={(e) => setEmojiRotateSpeed(Number(e.target.value))} className="flex-1" />
                    <input type="number" min="0" max="180" value={emojiRotateSpeed} onChange={(e) => setEmojiRotateSpeed(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Size Var:</label>
                    <input type="range" min="0" max="100" value={emojiSizeVariation} onChange={(e) => setEmojiSizeVariation(Number(e.target.value))} className="flex-1" />
                    <input type="number" min="0" max="100" value={emojiSizeVariation} onChange={(e) => setEmojiSizeVariation(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap" title="Shifts every other row horizontally, like a brick or polka-dot pattern">Row Offset:</label>
                    <input type="range" min={-emojiSize} max={emojiSize} value={emojiOffsetX} onChange={(e) => setEmojiOffsetX(Number(e.target.value))} className="flex-1" />
                    <input type="number" value={emojiOffsetX} onChange={(e) => setEmojiOffsetX(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap" title="Darkest to brightest, left to right">Emojis:</label>
                    <input
                      type="text"
                      value={emojiChars}
                      onChange={(e) => setEmojiChars(e.target.value)}
                      onFocus={() => setIsEmojiPickerOpen(true)}
                      placeholder="😴🙂😃🤩🔥"
                      title="Darkest to brightest, left to right — click to pick from the emoji picker"
                      className="flex-1 min-w-0 text-[10px] text-white bg-black/25 border border-white/20 rounded px-1 py-1"
                    />
                    {isEmojiPickerOpen && (
                      <button
                        onClick={() => setIsEmojiPickerOpen(false)}
                        className="shrink-0 text-[10px] text-white bg-white/15 hover:bg-white/25 rounded px-1.5 py-1"
                      >Done</button>
                    )}
                  </div>
                  {isEmojiPickerOpen && (
                    <div className="mt-1 border border-white/20 rounded bg-black/40">
                      <input
                        type="text"
                        value={emojiPickerSearch}
                        onChange={(e) => setEmojiPickerSearch(e.target.value)}
                        placeholder="Search emoji…"
                        className="w-full text-[10px] text-white bg-black/25 border-b border-white/20 px-1.5 py-1 outline-none"
                      />
                      <div className="max-h-40 overflow-y-auto px-1 py-1">
                        {(() => {
                          const q = emojiPickerSearch.trim().toLowerCase();
                          const categories = q
                            ? EMOJI_PICKER_CATEGORIES.map(cat => ({ ...cat, emojis: cat.emojis.filter(em => em.name.includes(q)) })).filter(cat => cat.emojis.length > 0)
                            : EMOJI_PICKER_CATEGORIES;
                          if (categories.length === 0) {
                            return <div className="text-[10px] text-white/40 text-center py-2">No emoji match "{emojiPickerSearch}"</div>;
                          }
                          return categories.map((cat) => (
                            <div key={cat.label} className="mb-1">
                              <div className="text-[9px] text-white/50 mb-0.5">{cat.label}</div>
                              <div className="flex flex-wrap gap-0.5">
                                {cat.emojis.map((em, i) => (
                                  <button
                                    key={`${cat.label}-${i}`}
                                    onClick={() => setEmojiChars(prev => prev + em.char)}
                                    className="w-7 h-7 flex items-center justify-center text-lg rounded hover:bg-white/15 transition-all"
                                    title={em.name}
                                    aria-label={em.name}
                                  >{em.char}</button>
                                ))}
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                </EffectSection>
              )}
              {activeEffects.includes('liquid') && (
                <EffectSection id="liquid" label="Liquid" isMulti={isMulti} expanded={expandedEffects.has('liquid')} onToggle={toggleEffectExpanded}>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Strength:</label>
                    <input type="range" min="0" max="100" value={liquidStrength} onChange={(e) => setLiquidStrength(Number(e.target.value))} className="flex-1" />
                    <input type="number" min="0" max="100" value={liquidStrength} onChange={(e) => setLiquidStrength(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Scale:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input type="range" min="0.5" max="10" step="0.5" value={liquidScale} onChange={(e) => setLiquidScale(Number(e.target.value))} className="flex-1" />
                      <input type="number" min="0.5" max="10" step="0.5" value={liquidScale} onChange={(e) => setLiquidScale(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                    </div>
                  </div>
                </EffectSection>
              )}
              {activeEffects.includes('crt') && (
                <EffectSection id="crt" label="Cathode" isMulti={isMulti} expanded={expandedEffects.has('crt')} onToggle={toggleEffectExpanded}>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Intensity:</label>
                    <input type="range" min="0" max="1" step="0.05" value={crtIntensity} onChange={(e) => setCrtIntensity(Number(e.target.value))} className="flex-1" />
                    <input type="number" min="0" max="1" step="0.05" value={crtIntensity} onChange={(e) => setCrtIntensity(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                  </div>
                </EffectSection>
              )}
              {activeEffects.includes('photo') && (
                <EffectSection id="photo" label="Photo" isMulti={isMulti} expanded={expandedEffects.has('photo')} onToggle={toggleEffectExpanded}>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handlePhotoFileClick}
                      className="flex-1 px-2 py-1 rounded text-[10px] font-semibold bg-white/15 text-white hover:bg-white/25 transition-all truncate"
                      title={photoFileName || 'Upload a photo'}
                    >{photoFileName ? `📷 ${photoFileName}` : 'Upload Photo…'}</button>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Blend:</label>
                    <div className="flex-1 flex gap-0.5">
                      {(['overlay', 'multiply', 'screen', 'source-over'] as const).map(mode => (
                        <button
                          key={mode}
                          onClick={() => setPhotoBlendMode(mode)}
                          aria-pressed={photoBlendMode === mode}
                          className={`flex-1 px-1 py-0.5 text-[9px] rounded transition-all ${photoBlendMode === mode ? 'bg-white text-black font-bold' : 'bg-black/25 text-white hover:bg-white/15'}`}
                        >{mode === 'source-over' ? 'Normal' : mode[0].toUpperCase() + mode.slice(1)}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Opacity:</label>
                    <input type="range" min="0" max="100" value={photoOpacity} onChange={(e) => setPhotoOpacity(Number(e.target.value))} className="flex-1" />
                    <input type="number" min="0" max="100" value={photoOpacity} onChange={(e) => setPhotoOpacity(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                  </div>
                </EffectSection>
              )}
              {activeEffects.includes('chromatic-trails') && (
                <EffectSection id="chromatic-trails" label="Chroma Trails" isMulti={isMulti} expanded={expandedEffects.has('chromatic-trails')} onToggle={toggleEffectExpanded}>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Decay:</label>
                    <input type="range" min="0.5" max="0.99" step="0.01" value={chromaticTrailsDecay} onChange={(e) => setChromaticTrailsDecay(Number(e.target.value))} className="flex-1" />
                    <input type="number" min="0.5" max="0.99" step="0.01" value={chromaticTrailsDecay} onChange={(e) => setChromaticTrailsDecay(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Offset:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input type="range" min="1" max="30" step="1" value={chromaticTrailsOffset} onChange={(e) => setChromaticTrailsOffset(Number(e.target.value))} className="flex-1" />
                      <input type="number" min="1" max="30" step="1" value={chromaticTrailsOffset} onChange={(e) => setChromaticTrailsOffset(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                    </div>
                  </div>
                </EffectSection>
              )}
              {activeEffects.includes('pixelate') && (
                <EffectSection id="pixelate" label="Pixelate" isMulti={isMulti} expanded={expandedEffects.has('pixelate')} onToggle={toggleEffectExpanded}>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Size:</label>
                  <input type="range" min="5" max="200" value={pixelSize} onChange={(e) => setPixelSize(Number(e.target.value))} className="flex-1" />
                  <input type="number" min="5" max="200" value={pixelSize} onChange={(e) => setPixelSize(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                  </div>
                </EffectSection>
              )}
              {activeEffects.includes('triangulate') && (
                <EffectSection id="triangulate" label="Triangulate" isMulti={isMulti} expanded={expandedEffects.has('triangulate')} onToggle={toggleEffectExpanded}>
                  <div className="flex items-center gap-1">
                  <label className="text-[10px] text-white whitespace-nowrap">Size:</label>
                  <input type="range" min="10" max="200" value={triangleSize} onChange={(e) => setTriangleSize(Number(e.target.value))} className="flex-1" />
                  <input type="number" min="10" max="200" value={triangleSize} onChange={(e) => setTriangleSize(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                </div>
                <div className="flex items-center gap-1">
                  <label className="text-[10px] text-white whitespace-nowrap" title="Fraction of cells that flip to the other diagonal split, for an irregular woven look instead of a uniform pattern">Variation:</label>
                  <input type="range" min="0" max="1" step="0.05" value={triangulateVariation} onChange={(e) => setTriangulateVariation(Number(e.target.value))} className="flex-1" />
                  <input type="number" min="0" max="1" step="0.05" value={triangulateVariation} onChange={(e) => setTriangulateVariation(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                </div>
                </EffectSection>
              )}
              {activeEffects.includes('chromatic') && (
                <EffectSection id="chromatic" label="Chromatic" isMulti={isMulti} expanded={expandedEffects.has('chromatic')} onToggle={toggleEffectExpanded}>
                  <div className="flex items-center gap-1">
                  <label className="text-[10px] text-white whitespace-nowrap">Offset:</label>
                  <input type="range" min="1" max="200" value={chromaticOffset} onChange={(e) => setChromaticOffset(Number(e.target.value))} className="flex-1" />
                  <input type="number" min="1" max="200" value={chromaticOffset} onChange={(e) => setChromaticOffset(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                </div>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Angle:</label>
                    <input type="range" min="0" max="360" value={chromaticAngle} onChange={(e) => setChromaticAngle(Number(e.target.value))} className="flex-1" />
                    <input type="number" min="0" max="360" value={chromaticAngle} onChange={(e) => setChromaticAngle(Number(e.target.value))} className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1" />
                  </div>
                </EffectSection>
              )}
              {activeEffects.includes('fisheye') && (
                <EffectSection id="fisheye" label="Fisheye" isMulti={isMulti} expanded={expandedEffects.has('fisheye')} onToggle={toggleEffectExpanded}>
                  <div className="flex items-center gap-1">
                  <label className="text-[10px] text-white whitespace-nowrap">Strength:</label>
                  <input type="range" min="0" max="10" step="0.1" value={fisheyeStrength} onChange={(e) => setFisheyeStrength(Number(e.target.value))} className="flex-1" />
                  <input type="number" min="0" max="10" step="0.1" value={fisheyeStrength} onChange={(e) => setFisheyeStrength(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                </div>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Center X:</label>
                    <input type="range" min="0" max="100" value={fisheyeCenterX} onChange={(e) => setFisheyeCenterX(Number(e.target.value))} className="flex-1" />
                    <input type="number" min="0" max="100" value={fisheyeCenterX} onChange={(e) => setFisheyeCenterX(Number(e.target.value))} className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Center Y:</label>
                    <input type="range" min="0" max="100" value={fisheyeCenterY} onChange={(e) => setFisheyeCenterY(Number(e.target.value))} className="flex-1" />
                    <input type="number" min="0" max="100" value={fisheyeCenterY} onChange={(e) => setFisheyeCenterY(Number(e.target.value))} className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1" />
                  </div>
                </EffectSection>
              )}
              {activeEffects.includes('bloom') && (
                <EffectSection id="bloom" label="Bloom" isMulti={isMulti} expanded={expandedEffects.has('bloom')} onToggle={toggleEffectExpanded}>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Intensity:</label>
                    <input type="range" min="0" max="2" step="0.05" value={bloomIntensity} onChange={(e) => setBloomIntensity(Number(e.target.value))} className="flex-1" />
                    <input type="number" min="0" max="2" step="0.05" value={bloomIntensity} onChange={(e) => setBloomIntensity(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Radius:</label>
                    <input type="range" min="2" max="40" step="1" value={bloomRadius} onChange={(e) => setBloomRadius(Number(e.target.value))} className="flex-1" />
                    <input type="number" min="2" max="40" step="1" value={bloomRadius} onChange={(e) => setBloomRadius(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                  </div>
                </EffectSection>
              )}
              {activeEffects.includes('feedback') && (
                <EffectSection id="feedback" label="Feedback" isMulti={isMulti} expanded={expandedEffects.has('feedback')} onToggle={toggleEffectExpanded}>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Decay:</label>
                    <input type="range" min="0.5" max="0.97" step="0.01" value={feedbackDecay} onChange={(e) => setFeedbackDecay(Number(e.target.value))} className="flex-1" />
                    <input type="number" min="0.5" max="0.97" step="0.01" value={feedbackDecay} onChange={(e) => setFeedbackDecay(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Zoom:</label>
                    <input type="range" min="0" max="5" step="0.1" value={feedbackZoom} onChange={(e) => setFeedbackZoom(Number(e.target.value))} className="flex-1" />
                    <input type="number" min="0" max="5" step="0.1" value={feedbackZoom} onChange={(e) => setFeedbackZoom(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Spin:</label>
                    <input type="range" min="-10" max="10" step="0.5" value={feedbackRotation} onChange={(e) => setFeedbackRotation(Number(e.target.value))} className="flex-1" />
                    <input type="number" min="-10" max="10" step="0.5" value={feedbackRotation} onChange={(e) => setFeedbackRotation(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                  </div>
                </EffectSection>
              )}
              {activeEffects.includes('mirror') && (
                <EffectSection id="mirror" label="Mirror" isMulti={isMulti} expanded={expandedEffects.has('mirror')} onToggle={toggleEffectExpanded}>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Mode:</label>
                    <div className="flex gap-1 flex-1">
                      {(['horizontal', 'vertical', 'grid'] as const).map(mode => (
                        <button key={mode} onClick={() => setMirrorMode(mode)}
                          aria-pressed={mirrorMode === mode}
                          className={`flex-1 px-1 py-0.5 rounded text-[10px] transition-all ${mirrorMode === mode ? 'bg-white text-black font-bold' : 'bg-black/25 text-white hover:bg-white/15'}`}>
                          {mode === 'horizontal' ? 'H' : mode === 'vertical' ? 'V' : 'Grid'}
                        </button>
                      ))}
                    </div>
                  </div>
                  {mirrorMode === 'grid' && (
                    <div className="flex items-center gap-1">
                      <label className="text-[10px] text-white whitespace-nowrap">Tiles:</label>
                      <input type="range" min="2" max="16" step="1" value={mirrorTileCount} onChange={(e) => setMirrorTileCount(Number(e.target.value))} className="flex-1" />
                      <input type="number" min="2" max="16" step="1" value={mirrorTileCount} onChange={(e) => setMirrorTileCount(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                    </div>
                  )}
                </EffectSection>
              )}
              {activeEffects.includes('vignette') && (
                <EffectSection id="vignette" label="Vignette" isMulti={isMulti} expanded={expandedEffects.has('vignette')} onToggle={toggleEffectExpanded}>
                  <div className="flex items-center gap-1">
                  <label className="text-[10px] text-white whitespace-nowrap">Strength:</label>
                  <input type="range" min="0" max="1" step="0.05" value={vignetteStrength} onChange={(e) => setVignetteStrength(Number(e.target.value))} className="flex-1" />
                  <input type="number" min="0" max="1" step="0.05" value={vignetteStrength} onChange={(e) => setVignetteStrength(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                </div>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Softness:</label>
                    <input type="range" min="0" max="100" value={vignetteSoftness} onChange={(e) => setVignetteSoftness(Number(e.target.value))} className="flex-1" />
                    <input type="number" min="0" max="100" value={vignetteSoftness} onChange={(e) => setVignetteSoftness(Number(e.target.value))} className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1" />
                  </div>
                </EffectSection>
              )}
              {activeEffects.includes('shift') && (
                <EffectSection id="shift" label="Shift" isMulti={isMulti} expanded={expandedEffects.has('shift')} onToggle={toggleEffectExpanded}>
                  <div className="flex items-center gap-1">
                  <label className="text-[10px] text-white whitespace-nowrap">Hue:</label>
                  <input type="range" min="0" max="255" value={colorShiftHue} onChange={(e) => setColorShiftHue(Number(e.target.value))} className="flex-1" />
                  <input type="number" min="0" max="255" value={colorShiftHue} onChange={(e) => setColorShiftHue(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                </div>
                </EffectSection>
              )}
              {activeEffects.includes('grain') && (
                <EffectSection id="grain" label="Grain" isMulti={isMulti} expanded={expandedEffects.has('grain')} onToggle={toggleEffectExpanded}>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Type:</label>
                    <div className="flex gap-0.5 flex-1">
                      <button
                        onClick={() => setGrainType('fine')}
                        aria-pressed={grainType === 'fine'}
                        className={`flex-1 px-1 py-0.5 rounded text-[10px] transition-all ${
                          grainType === 'fine'
                            ? 'bg-white text-black font-bold'
                            : 'bg-black/25 text-white hover:bg-white/15'
                        }`}
                      >
                        Fine
                      </button>
                      <button
                        onClick={() => setGrainType('medium')}
                        aria-pressed={grainType === 'medium'}
                        className={`flex-1 px-1 py-0.5 rounded text-[10px] transition-all ${
                          grainType === 'medium'
                            ? 'bg-white text-black font-bold'
                            : 'bg-black/25 text-white hover:bg-white/15'
                        }`}
                      >
                        Med
                      </button>
                      <button
                        onClick={() => setGrainType('coarse')}
                        aria-pressed={grainType === 'coarse'}
                        className={`flex-1 px-1 py-0.5 rounded text-[10px] transition-all ${
                          grainType === 'coarse'
                            ? 'bg-white text-black font-bold'
                            : 'bg-black/25 text-white hover:bg-white/15'
                        }`}
                      >
                        Coarse
                      </button>
                      <button
                        onClick={() => setGrainType('film')}
                        aria-pressed={grainType === 'film'}
                        className={`flex-1 px-1 py-0.5 rounded text-[10px] transition-all ${
                          grainType === 'film'
                            ? 'bg-white text-black font-bold'
                            : 'bg-black/25 text-white hover:bg-white/15'
                        }`}
                      >
                        Film
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Intensity:</label>
                    <input type="range" min="0" max="1" step="0.01" value={grainIntensity} onChange={(e) => setGrainIntensity(Number(e.target.value))} className="flex-1" />
                    <input type="number" min="0" max="1" step="0.01" value={grainIntensity} onChange={(e) => setGrainIntensity(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Crackle:</label>
                    <input type="range" min="0" max="1" step="0.05" value={dustCrackleIntensity} onChange={(e) => setDustCrackleIntensity(Number(e.target.value))} className="flex-1" />
                    <input type="number" min="0" max="1" step="0.05" value={dustCrackleIntensity} onChange={(e) => setDustCrackleIntensity(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                  </div>
                  {dustCrackleIntensity > 0 && (
                    <>
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] text-white whitespace-nowrap">Crack Length:</label>
                        <input type="range" min="0.3" max="3" step="0.1" value={dustCrackleLength} onChange={(e) => setDustCrackleLength(Number(e.target.value))} className="flex-1" />
                        <input type="number" min="0.3" max="3" step="0.1" value={dustCrackleLength} onChange={(e) => setDustCrackleLength(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <label className="text-[10px] text-white whitespace-nowrap">Crack Color:</label>
                        <input
                          type="color"
                          value={dustCrackleColor}
                          onChange={(e) => setDustCrackleColor(e.target.value)}
                          className="w-12 h-6 rounded cursor-pointer"
                        />
                      </div>
                    </>
                  )}
                </EffectSection>
              )}
              {activeEffects.includes('blur') && (
                <EffectSection id="blur" label="Blur" isMulti={isMulti} expanded={expandedEffects.has('blur')} onToggle={toggleEffectExpanded}>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Type:</label>
                    <div className="flex gap-0.5 flex-1">
                      <button
                        onClick={() => setBlurType('gaussian')}
                        aria-pressed={blurType === 'gaussian'}
                        className={`flex-1 px-1 py-0.5 rounded text-[10px] transition-all ${
                          blurType === 'gaussian'
                            ? 'bg-white text-black font-bold'
                            : 'bg-black/25 text-white hover:bg-white/15'
                        }`}
                      >
                        Gaussian
                      </button>
                      <button
                        onClick={() => setBlurType('motion')}
                        aria-pressed={blurType === 'motion'}
                        className={`flex-1 px-1 py-0.5 rounded text-[10px] transition-all ${
                          blurType === 'motion'
                            ? 'bg-white text-black font-bold'
                            : 'bg-black/25 text-white hover:bg-white/15'
                        }`}
                      >
                        Motion
                      </button>
                      <button
                        onClick={() => setBlurType('radial')}
                        aria-pressed={blurType === 'radial'}
                        className={`flex-1 px-1 py-0.5 rounded text-[10px] transition-all ${
                          blurType === 'radial'
                            ? 'bg-white text-black font-bold'
                            : 'bg-black/25 text-white hover:bg-white/15'
                        }`}
                      >
                        Radial
                      </button>
                      <button
                        onClick={() => setBlurType('zoom')}
                        aria-pressed={blurType === 'zoom'}
                        className={`flex-1 px-1 py-0.5 rounded text-[10px] transition-all ${
                          blurType === 'zoom'
                            ? 'bg-white text-black font-bold'
                            : 'bg-black/25 text-white hover:bg-white/15'
                        }`}
                      >
                        Zoom
                      </button>
                    </div>
                  </div>
                  {blurType === 'gaussian' && (
                    <div className="flex items-center justify-between gap-1">
                      <label className="text-[10px] text-white whitespace-nowrap">Amount:</label>
                      <div className="flex items-center gap-1 flex-1">
                        <input
                          type="range"
                          min="1"
                          max="50"
                          value={blurGaussianAmount}
                          onChange={(e) => setBlurGaussianAmount(Number(e.target.value))}
                          className="flex-1"
                        />
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={blurGaussianAmount}
                        onChange={(e) => setBlurGaussianAmount(Number(e.target.value))}
                        className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1"
                      />
                      </div>
                    </div>
                  )}
                  {blurType === 'motion' && (
                    <>
                      <div className="flex items-center justify-between gap-1">
                        <label className="text-[10px] text-white whitespace-nowrap">Amount:</label>
                        <div className="flex items-center gap-1 flex-1">
                          <input
                            type="range"
                            min="1"
                            max="50"
                            value={blurMotionAmount}
                            onChange={(e) => setBlurMotionAmount(Number(e.target.value))}
                            className="flex-1"
                          />
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={blurMotionAmount}
                        onChange={(e) => setBlurMotionAmount(Number(e.target.value))}
                        className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1"
                      />
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <label className="text-[10px] text-white whitespace-nowrap">Direction:</label>
                        <div className="flex items-center gap-1 flex-1">
                          <input
                            type="range"
                            min="0"
                            max="360"
                            value={blurMotionDirection}
                            onChange={(e) => setBlurMotionDirection(Number(e.target.value))}
                            className="flex-1"
                          />
                          <input
                            type="number"
                            min="0"
                            max="360"
                            value={Math.round(blurMotionDirection)}
                            onChange={(e) => setBlurMotionDirection(Number(e.target.value))}
                            className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1"
                          />
                        </div>
                      </div>
                    </>
                  )}
                  {(blurType === 'radial' || blurType === 'zoom') && (
                    <div className="flex items-center justify-between gap-1">
                      <label className="text-[10px] text-white whitespace-nowrap">Amount:</label>
                      <div className="flex items-center gap-1 flex-1">
                        <input type="range" min="1" max="50" step="1" value={blurRadialAmount} onChange={(e) => setBlurRadialAmount(Number(e.target.value))} className="flex-1" />
                        <input type="number" min="1" max="50" step="1" value={blurRadialAmount} onChange={(e) => setBlurRadialAmount(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                      </div>
                    </div>
                  )}
                </EffectSection>
              )}
              {activeEffects.includes('posterize') && (
                <EffectSection id="posterize" label="Posterize" isMulti={isMulti} expanded={expandedEffects.has('posterize')} onToggle={toggleEffectExpanded}>
                  <div className="flex items-center gap-1">
                  <label className="text-[10px] text-white whitespace-nowrap">Levels:</label>
                  <input type="range" min="2" max="16" value={posterizeLevels} onChange={(e) => setPosterizeLevels(Number(e.target.value))} className="flex-1" />
                  <input type="number" min="2" max="16" value={posterizeLevels} onChange={(e) => setPosterizeLevels(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                </div>
                </EffectSection>
              )}
              {activeEffects.includes('halftone') && (
                <EffectSection id="halftone" label="Halftone" isMulti={isMulti} expanded={expandedEffects.has('halftone')} onToggle={toggleEffectExpanded}>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Dot Size:</label>
                    <input type="range" min="2" max="200" value={halftoneSize} onChange={(e) => setHalftoneSize(Number(e.target.value))} className="flex-1" />
                    <input type="number" min="2" max="200" value={halftoneSize} onChange={(e) => setHalftoneSize(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Variation:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={halftoneVariation}
                        onChange={(e) => setHalftoneVariation(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        value={halftoneVariation}
                        onChange={(e) => setHalftoneVariation(Number(e.target.value))}
                        className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <label className="text-[10px] text-white whitespace-nowrap">Move:</label>
                      <button
                        onClick={() => setHalftoneMove(!halftoneMove)}
                        aria-pressed={halftoneMove}
                        className={`px-2 py-0.5 text-[10px] rounded transition-all ${
                          halftoneMove
                            ? 'bg-white text-black font-bold'
                            : 'bg-black/25 text-white hover:bg-white/15'
                        }`}
                      >
                        {halftoneMove ? 'ON' : 'OFF'}
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <label className="text-[10px] text-white whitespace-nowrap">CMYK:</label>
                      <button
                        onClick={() => setHalftoneCMYK(!halftoneCMYK)}
                        aria-pressed={halftoneCMYK}
                        className={`px-2 py-0.5 text-[10px] rounded transition-all ${
                          halftoneCMYK
                            ? 'bg-white text-black font-bold'
                            : 'bg-black/25 text-white hover:bg-white/15'
                        }`}
                      >
                        {halftoneCMYK ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  </div>
                </EffectSection>
              )}
              {activeEffects.includes('invert') && (
                <EffectSection id="invert" label="Invert" isMulti={isMulti} expanded={expandedEffects.has('invert')} onToggle={toggleEffectExpanded}>
                  <div className="flex items-center gap-1">
                  <label className="text-[10px] text-white whitespace-nowrap">Amount:</label>
                  <input type="range" min="0" max="1" step="0.05" value={invertAmount} onChange={(e) => setInvertAmount(Number(e.target.value))} className="flex-1" />
                  <input type="number" min="0" max="1" step="0.05" value={invertAmount} onChange={(e) => setInvertAmount(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                  </div>
                </EffectSection>
              )}
              {activeEffects.includes('duotone') && (
                <EffectSection id="duotone" label="Duotone" isMulti={isMulti} expanded={expandedEffects.has('duotone')} onToggle={toggleEffectExpanded}>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Intensity:</label>
                    <input type="range" min="0" max="1" step="0.05" value={duotoneIntensity} onChange={(e) => setDuotoneIntensity(Number(e.target.value))} className="flex-1" />
                    <input type="number" min="0" max="1" step="0.05" value={duotoneIntensity} onChange={(e) => setDuotoneIntensity(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                    <button
                      onClick={() => {
                        const randomHex = () => {
                          const r = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
                          const g = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
                          const b = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
                          return `#${r}${g}${b}`;
                        };
                        setDuotoneColor1(randomHex());
                        setDuotoneColor2(randomHex());
                        if (duotoneThreeColor) setDuotoneColor3(randomHex());
                      }}
                      title="Shuffle Colors"
                      aria-label="Shuffle Colors"
                      className="shrink-0 p-1 rounded bg-black/25 text-white hover:bg-white/15 transition-all"
                    >
                      <Shuffle weight="regular" className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Color 1:</label>
                    <input
                      type="color"
                      value={duotoneColor1}
                      onChange={(e) => setDuotoneColor1(e.target.value)}
                      className="w-10 h-5 rounded cursor-pointer border-0 p-0"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Color 2:</label>
                    <input
                      type="color"
                      value={duotoneColor2}
                      onChange={(e) => setDuotoneColor2(e.target.value)}
                      className="w-10 h-5 rounded cursor-pointer border-0 p-0"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Tritone:</label>
                    <button
                      onClick={() => setDuotoneThreeColor(!duotoneThreeColor)}
                      aria-pressed={duotoneThreeColor}
                      className={`px-2 py-0.5 rounded text-[10px] transition-all ${
                        duotoneThreeColor ? 'bg-white text-black font-bold' : 'bg-black/25 text-white hover:bg-white/15'
                      }`}
                    >
                      {duotoneThreeColor ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  {duotoneThreeColor && (
                    <div className="flex items-center justify-between gap-1">
                      <label className="text-[10px] text-white whitespace-nowrap">Color 3:</label>
                      <input
                        type="color"
                        value={duotoneColor3}
                        onChange={(e) => setDuotoneColor3(e.target.value)}
                        className="w-10 h-5 rounded cursor-pointer border-0 p-0"
                      />
                    </div>
                  )}
                </EffectSection>
              )}
              {activeEffects.includes('grid-effect') && (
                <EffectSection id="grid-effect" label="Grid" isMulti={isMulti} expanded={expandedEffects.has('grid-effect')} onToggle={toggleEffectExpanded}>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Rotate:</label>
                    <div className="flex gap-0.5 flex-1">
                      <button
                        onClick={() => setGridRotationDirection('none')}
                        aria-pressed={gridRotationDirection === 'none'}
                        className={`flex-1 px-1 py-0.5 rounded text-[10px] transition-all ${
                          gridRotationDirection === 'none'
                            ? 'bg-white text-black font-bold'
                            : 'bg-black/25 text-white hover:bg-white/15'
                        }`}
                      >
                        OFF
                      </button>
                      <button
                        onClick={() => setGridRotationDirection('clockwise')}
                        aria-pressed={gridRotationDirection === 'clockwise'}
                        aria-label="Clockwise"
                        title="Clockwise"
                        className={`flex-1 px-1 py-0.5 rounded text-[10px] transition-all ${
                          gridRotationDirection === 'clockwise'
                            ? 'bg-white text-black font-bold'
                            : 'bg-black/25 text-white hover:bg-white/15'
                        }`}
                      >
                        ⟳
                      </button>
                      <button
                        onClick={() => setGridRotationDirection('counterclockwise')}
                        aria-pressed={gridRotationDirection === 'counterclockwise'}
                        aria-label="Counterclockwise"
                        title="Counterclockwise"
                        className={`flex-1 px-1 py-0.5 rounded text-[10px] transition-all ${
                          gridRotationDirection === 'counterclockwise'
                            ? 'bg-white text-black font-bold'
                            : 'bg-black/25 text-white hover:bg-white/15'
                        }`}
                      >
                        ⟲
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Sides:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={gridSides}
                        onChange={(e) => setGridSides(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={gridSides}
                        onChange={(e) => setGridSides(Number(e.target.value))}
                        className="text-[10px] text-white w-8 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Rows:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="2"
                        max="50"
                        value={gridRows}
                        onChange={(e) => setGridRows(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="2"
                        max="50"
                        value={gridRows}
                        onChange={(e) => setGridRows(Number(e.target.value))}
                        className="text-[10px] text-white w-8 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Columns:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="2"
                        max="50"
                        value={gridColumns}
                        onChange={(e) => setGridColumns(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="2"
                        max="50"
                        value={gridColumns}
                        onChange={(e) => setGridColumns(Number(e.target.value))}
                        className="text-[10px] text-white w-8 text-right bg-transparent border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                  {/* Grid Effect Shape Size Control */}
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[10px] text-white/80 whitespace-nowrap">Size:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min={1}
                        max={100}
                        step={1}
                        value={gridShapeSize}
                        onChange={(e) => setGridShapeSize(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={gridShapeSize}
                        onChange={(e) => setGridShapeSize(Number(e.target.value))}
                        className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Variation:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={gridVariation}
                        onChange={(e) => setGridVariation(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        value={gridVariation}
                        onChange={(e) => setGridVariation(Number(e.target.value))}
                        className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                </EffectSection>
              )}

              
              
              
              
              {activeEffects.includes('vhs') && (
                <EffectSection id="vhs" label="VHS" isMulti={isMulti} expanded={expandedEffects.has('vhs')} onToggle={toggleEffectExpanded}>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Intensity:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={vhsGlitchIntensity}
                        onChange={(e) => setVhsGlitchIntensity(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.05"
                        value={vhsGlitchIntensity}
                        onChange={(e) => setVhsGlitchIntensity(Number(e.target.value))}
                        className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                </EffectSection>
              )}
              {activeEffects.includes('wave') && (
                <EffectSection id="wave" label="Wave" isMulti={isMulti} expanded={expandedEffects.has('wave')} onToggle={toggleEffectExpanded}>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Strength:</label>
                    <input type="range" min="5" max="100" value={waveDistortionStrength} onChange={(e) => setWaveDistortionStrength(Number(e.target.value))} className="flex-1" />
                    <input type="number" min="5" max="100" value={waveDistortionStrength} onChange={(e) => setWaveDistortionStrength(Number(e.target.value))} className="text-[10px] text-white w-8 text-right bg-transparent border border-white/20 rounded px-1" />
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Rotation:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={waveDistortionRotation}
                        onChange={(e) => setWaveDistortionRotation(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="0"
                        max="360"
                        value={waveDistortionRotation}
                        onChange={(e) => setWaveDistortionRotation(Number(e.target.value))}
                        className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                </EffectSection>
              )}
              {activeEffects.includes('slit-scan') && (
                <EffectSection id="slit-scan" label="Slit-Scan" isMulti={isMulti} expanded={expandedEffects.has('slit-scan')} onToggle={toggleEffectExpanded}>
                  <div className="flex items-center gap-1">
                    <div className="flex gap-1 flex-1 min-w-0">
                      <button
                        onClick={() => setSlitScanDirection('horizontal')}
                        aria-pressed={slitScanDirection === 'horizontal'}
                        className={`flex-1 min-w-0 px-1 py-0.5 rounded text-[10px] transition-all whitespace-nowrap ${
                          slitScanDirection === 'horizontal'
                            ? 'bg-white text-black font-bold'
                            : 'bg-black/25 text-white hover:bg-white/15'
                        }`}
                      >
                        Horz
                      </button>
                      <button
                        onClick={() => setSlitScanDirection('vertical')}
                        aria-pressed={slitScanDirection === 'vertical'}
                        className={`flex-1 min-w-0 px-1 py-0.5 rounded text-[10px] transition-all whitespace-nowrap ${
                          slitScanDirection === 'vertical'
                            ? 'bg-white text-black font-bold'
                            : 'bg-black/25 text-white hover:bg-white/15'
                        }`}
                      >
                        Vert
                      </button>
                      <button
                        onClick={() => setSlitScanDirection('radial')}
                        aria-pressed={slitScanDirection === 'radial'}
                        className={`flex-1 min-w-0 px-1 py-0.5 rounded text-[10px] transition-all whitespace-nowrap ${
                          slitScanDirection === 'radial'
                            ? 'bg-white text-black font-bold'
                            : 'bg-black/25 text-white hover:bg-white/15'
                        }`}
                      >
                        Radial
                      </button>
                      <button
                        onClick={() => setSlitScanDirection('circular')}
                        aria-pressed={slitScanDirection === 'circular'}
                        className={`flex-1 min-w-0 px-1 py-0.5 rounded text-[10px] transition-all whitespace-nowrap ${
                          slitScanDirection === 'circular'
                            ? 'bg-white text-black font-bold'
                            : 'bg-black/25 text-white hover:bg-white/15'
                        }`}
                      >
                        Circle
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Intensity:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="0.1"
                        max="10"
                        step="0.1"
                        value={slitScanIntensity}
                        onChange={(e) => setSlitScanIntensity(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="0.1"
                        max="10"
                        step="0.1"
                        value={slitScanIntensity}
                        onChange={(e) => setSlitScanIntensity(Number(e.target.value))}
                        className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                </EffectSection>
              )}
              {activeEffects.includes('dither') && (
                <EffectSection id="dither" label="Dither" isMulti={isMulti} expanded={expandedEffects.has('dither')} onToggle={toggleEffectExpanded}>
                  <div className="flex items-center gap-1">
                    
                    <label className="text-[10px] text-white whitespace-nowrap">Type:</label>
                    <div className="flex gap-1 flex-1">
                      <button
                        onClick={() => setDitherType('bayer')}
                        aria-pressed={ditherType === 'bayer'}
                        className={`flex-1 px-1 py-0.5 rounded text-[10px] transition-all ${
                          ditherType === 'bayer'
                            ? 'bg-white text-black font-bold'
                            : 'bg-black/25 text-white hover:bg-white/15'
                        }`}
                      >
                        Bayer
                      </button>
                      <button
                        onClick={() => setDitherType('floyd-steinberg')}
                        aria-pressed={ditherType === 'floyd-steinberg'}
                        className={`flex-1 px-1 py-0.5 rounded text-[10px] transition-all ${
                          ditherType === 'floyd-steinberg'
                            ? 'bg-white text-black font-bold'
                            : 'bg-black/25 text-white hover:bg-white/15'
                        }`}
                      >
                        Floyd-Steinberg
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Levels:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="range"
                        min="2"
                        max="16"
                        step="1"
                        value={ditherLevels}
                        onChange={(e) => setDitherLevels(Number(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="2"
                        max="16"
                        step="1"
                        value={ditherLevels}
                        onChange={(e) => setDitherLevels(Number(e.target.value))}
                        className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                </EffectSection>
              )}
              {activeEffects.includes('glitch') && (
                <EffectSection id="glitch" label="Glitch" isMulti={isMulti} expanded={expandedEffects.has('glitch')} onToggle={toggleEffectExpanded}>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Intensity:</label>
                    <input type="range" min="0.05" max="1" step="0.05" value={glitchIntensity} onChange={(e) => setGlitchIntensity(Number(e.target.value))} className="flex-1" />
                    <input type="number" min="0.05" max="1" step="0.05" value={glitchIntensity} onChange={(e) => setGlitchIntensity(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Block Size:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input type="range" min="4" max="80" step="2" value={glitchBlockSize} onChange={(e) => setGlitchBlockSize(Number(e.target.value))} className="flex-1" />
                      <input type="number" min="4" max="80" step="2" value={glitchBlockSize} onChange={(e) => setGlitchBlockSize(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Chroma Split:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input type="range" min="0" max="20" step="1" value={glitchChromaSplit} onChange={(e) => setGlitchChromaSplit(Number(e.target.value))} className="flex-1" />
                      <input type="number" min="0" max="20" step="1" value={glitchChromaSplit} onChange={(e) => setGlitchChromaSplit(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                    </div>
                  </div>
                </EffectSection>
              )}
              {activeEffects.includes('triangle-field') && (
                <EffectSection id="triangle-field" label="Triangle Field" isMulti={isMulti} expanded={expandedEffects.has('triangle-field')} onToggle={toggleEffectExpanded}>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Density:</label>
                    <input type="range" min="4" max="24" step="1" value={triangleFieldGridSize} onChange={(e) => setTriangleFieldGridSize(Number(e.target.value))} className="flex-1" />
                    <input type="number" min="4" max="24" step="1" value={triangleFieldGridSize} onChange={(e) => setTriangleFieldGridSize(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Speed:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input type="range" min="0.1" max="3" step="0.1" value={triangleFieldSpeed} onChange={(e) => setTriangleFieldSpeed(Number(e.target.value))} className="flex-1" />
                      <input type="number" min="0.1" max="3" step="0.1" value={triangleFieldSpeed} onChange={(e) => setTriangleFieldSpeed(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Opacity:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input type="range" min="0.1" max="1" step="0.05" value={triangleFieldOpacity} onChange={(e) => setTriangleFieldOpacity(Number(e.target.value))} className="flex-1" />
                      <input type="number" min="0.1" max="1" step="0.05" value={triangleFieldOpacity} onChange={(e) => setTriangleFieldOpacity(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                    </div>
                  </div>
                </EffectSection>
              )}
              {activeEffects.includes('fluid-field') && (
                <EffectSection id="fluid-field" label="Fluid Field" isMulti={isMulti} expanded={expandedEffects.has('fluid-field')} onToggle={toggleEffectExpanded}>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Scale:</label>
                    <input type="range" min="0.5" max="10" step="0.5" value={fluidFieldScale} onChange={(e) => setFluidFieldScale(Number(e.target.value))} className="flex-1" />
                    <input type="number" min="0.5" max="10" step="0.5" value={fluidFieldScale} onChange={(e) => setFluidFieldScale(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Speed:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input type="range" min="0.1" max="3" step="0.1" value={fluidFieldSpeed} onChange={(e) => setFluidFieldSpeed(Number(e.target.value))} className="flex-1" />
                      <input type="number" min="0.1" max="3" step="0.1" value={fluidFieldSpeed} onChange={(e) => setFluidFieldSpeed(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Opacity:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input type="range" min="0.1" max="1" step="0.05" value={fluidFieldOpacity} onChange={(e) => setFluidFieldOpacity(Number(e.target.value))} className="flex-1" />
                      <input type="number" min="0.1" max="1" step="0.05" value={fluidFieldOpacity} onChange={(e) => setFluidFieldOpacity(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                    </div>
                  </div>
                </EffectSection>
              )}
              {activeEffects.includes('static-field') && (
                <EffectSection id="static-field" label="Static Field" isMulti={isMulti} expanded={expandedEffects.has('static-field')} onToggle={toggleEffectExpanded}>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Intensity:</label>
                    <input type="range" min="0.05" max="1" step="0.05" value={staticFieldIntensity} onChange={(e) => setStaticFieldIntensity(Number(e.target.value))} className="flex-1" />
                    <input type="number" min="0.05" max="1" step="0.05" value={staticFieldIntensity} onChange={(e) => setStaticFieldIntensity(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Bar Speed:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input type="range" min="0.1" max="3" step="0.1" value={staticFieldBarSpeed} onChange={(e) => setStaticFieldBarSpeed(Number(e.target.value))} className="flex-1" />
                      <input type="number" min="0.1" max="3" step="0.1" value={staticFieldBarSpeed} onChange={(e) => setStaticFieldBarSpeed(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Opacity:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input type="range" min="0.1" max="1" step="0.05" value={staticFieldOpacity} onChange={(e) => setStaticFieldOpacity(Number(e.target.value))} className="flex-1" />
                      <input type="number" min="0.1" max="1" step="0.05" value={staticFieldOpacity} onChange={(e) => setStaticFieldOpacity(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                    </div>
                  </div>
                </EffectSection>
              )}
              {activeEffects.includes('particle-trails') && (
                <EffectSection id="particle-trails" label="Particle Trails" isMulti={isMulti} expanded={expandedEffects.has('particle-trails')} onToggle={toggleEffectExpanded}>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Count:</label>
                    <input type="range" min="10" max="150" step="5" value={particleTrailsCount} onChange={(e) => setParticleTrailsCount(Number(e.target.value))} className="flex-1" />
                    <input type="number" min="10" max="150" step="5" value={particleTrailsCount} onChange={(e) => setParticleTrailsCount(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Speed:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input type="range" min="0.1" max="3" step="0.1" value={particleTrailsSpeed} onChange={(e) => setParticleTrailsSpeed(Number(e.target.value))} className="flex-1" />
                      <input type="number" min="0.1" max="3" step="0.1" value={particleTrailsSpeed} onChange={(e) => setParticleTrailsSpeed(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Opacity:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input type="range" min="0.1" max="1" step="0.05" value={particleTrailsOpacity} onChange={(e) => setParticleTrailsOpacity(Number(e.target.value))} className="flex-1" />
                      <input type="number" min="0.1" max="1" step="0.05" value={particleTrailsOpacity} onChange={(e) => setParticleTrailsOpacity(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                    </div>
                  </div>
                </EffectSection>
              )}
              {activeEffects.includes('wind-streaks') && (
                <EffectSection id="wind-streaks" label="Wind Streaks" isMulti={isMulti} expanded={expandedEffects.has('wind-streaks')} onToggle={toggleEffectExpanded}>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Count:</label>
                    <input type="range" min="15" max="150" step="5" value={windStreaksCount} onChange={(e) => setWindStreaksCount(Number(e.target.value))} className="flex-1" />
                    <input type="number" min="15" max="150" step="5" value={windStreaksCount} onChange={(e) => setWindStreaksCount(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Speed:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input type="range" min="0.2" max="4" step="0.1" value={windStreaksSpeed} onChange={(e) => setWindStreaksSpeed(Number(e.target.value))} className="flex-1" />
                      <input type="number" min="0.2" max="4" step="0.1" value={windStreaksSpeed} onChange={(e) => setWindStreaksSpeed(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Opacity:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input type="range" min="0.1" max="1" step="0.05" value={windStreaksOpacity} onChange={(e) => setWindStreaksOpacity(Number(e.target.value))} className="flex-1" />
                      <input type="number" min="0.1" max="1" step="0.05" value={windStreaksOpacity} onChange={(e) => setWindStreaksOpacity(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                    </div>
                  </div>
                </EffectSection>
              )}
              {activeEffects.includes('aura-glow') && (
                <EffectSection id="aura-glow" label="Aura Glow" isMulti={isMulti} expanded={expandedEffects.has('aura-glow')} onToggle={toggleEffectExpanded}>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Lights:</label>
                    <input type="range" min="1" max="6" step="1" value={auraGlowCount} onChange={(e) => setAuraGlowCount(Number(e.target.value))} className="flex-1" />
                    <input type="number" min="1" max="6" step="1" value={auraGlowCount} onChange={(e) => setAuraGlowCount(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Speed:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input type="range" min="0.1" max="3" step="0.1" value={auraGlowSpeed} onChange={(e) => setAuraGlowSpeed(Number(e.target.value))} className="flex-1" />
                      <input type="number" min="0.1" max="3" step="0.1" value={auraGlowSpeed} onChange={(e) => setAuraGlowSpeed(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Opacity:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input type="range" min="0.1" max="1" step="0.05" value={auraGlowOpacity} onChange={(e) => setAuraGlowOpacity(Number(e.target.value))} className="flex-1" />
                      <input type="number" min="0.1" max="1" step="0.05" value={auraGlowOpacity} onChange={(e) => setAuraGlowOpacity(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                    </div>
                  </div>
                </EffectSection>
              )}
              {activeEffects.includes('starfield') && (
                <EffectSection id="starfield" label="Starfield" isMulti={isMulti} expanded={expandedEffects.has('starfield')} onToggle={toggleEffectExpanded}>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Count:</label>
                    <input type="range" min="30" max="250" step="10" value={starfieldCount} onChange={(e) => setStarfieldCount(Number(e.target.value))} className="flex-1" />
                    <input type="number" min="30" max="250" step="10" value={starfieldCount} onChange={(e) => setStarfieldCount(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Speed:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input type="range" min="0.2" max="4" step="0.1" value={starfieldSpeed} onChange={(e) => setStarfieldSpeed(Number(e.target.value))} className="flex-1" />
                      <input type="number" min="0.2" max="4" step="0.1" value={starfieldSpeed} onChange={(e) => setStarfieldSpeed(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Opacity:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input type="range" min="0.1" max="1" step="0.05" value={starfieldOpacity} onChange={(e) => setStarfieldOpacity(Number(e.target.value))} className="flex-1" />
                      <input type="number" min="0.1" max="1" step="0.05" value={starfieldOpacity} onChange={(e) => setStarfieldOpacity(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                    </div>
                  </div>
                </EffectSection>
              )}
              {activeEffects.includes('lightning-web') && (
                <EffectSection id="lightning-web" label="Lightning Web" isMulti={isMulti} expanded={expandedEffects.has('lightning-web')} onToggle={toggleEffectExpanded}>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Nodes:</label>
                    <input type="range" min="4" max="20" step="1" value={lightningWebCount} onChange={(e) => setLightningWebCount(Number(e.target.value))} className="flex-1" />
                    <input type="number" min="4" max="20" step="1" value={lightningWebCount} onChange={(e) => setLightningWebCount(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Speed:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input type="range" min="0.2" max="3" step="0.1" value={lightningWebSpeed} onChange={(e) => setLightningWebSpeed(Number(e.target.value))} className="flex-1" />
                      <input type="number" min="0.2" max="3" step="0.1" value={lightningWebSpeed} onChange={(e) => setLightningWebSpeed(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Opacity:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input type="range" min="0.1" max="1" step="0.05" value={lightningWebOpacity} onChange={(e) => setLightningWebOpacity(Number(e.target.value))} className="flex-1" />
                      <input type="number" min="0.1" max="1" step="0.05" value={lightningWebOpacity} onChange={(e) => setLightningWebOpacity(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                    </div>
                  </div>
                </EffectSection>
              )}
              {activeEffects.includes('voronoi-cells') && (
                <EffectSection id="voronoi-cells" label="Voronoi Cells" isMulti={isMulti} expanded={expandedEffects.has('voronoi-cells')} onToggle={toggleEffectExpanded}>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Seeds:</label>
                    <input type="range" min="3" max="14" step="1" value={voronoiCellsCount} onChange={(e) => setVoronoiCellsCount(Number(e.target.value))} className="flex-1" />
                    <input type="number" min="3" max="14" step="1" value={voronoiCellsCount} onChange={(e) => setVoronoiCellsCount(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Speed:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input type="range" min="0.1" max="3" step="0.1" value={voronoiCellsSpeed} onChange={(e) => setVoronoiCellsSpeed(Number(e.target.value))} className="flex-1" />
                      <input type="number" min="0.1" max="3" step="0.1" value={voronoiCellsSpeed} onChange={(e) => setVoronoiCellsSpeed(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Opacity:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input type="range" min="0.1" max="1" step="0.05" value={voronoiCellsOpacity} onChange={(e) => setVoronoiCellsOpacity(Number(e.target.value))} className="flex-1" />
                      <input type="number" min="0.1" max="1" step="0.05" value={voronoiCellsOpacity} onChange={(e) => setVoronoiCellsOpacity(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                    </div>
                  </div>
                </EffectSection>
              )}
              {activeEffects.includes('confetti') && (
                <EffectSection id="confetti" label="Confetti" isMulti={isMulti} expanded={expandedEffects.has('confetti')} onToggle={toggleEffectExpanded}>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Count:</label>
                    <input type="range" min="20" max="200" step="10" value={confettiCount} onChange={(e) => setConfettiCount(Number(e.target.value))} className="flex-1" />
                    <input type="number" min="20" max="200" step="10" value={confettiCount} onChange={(e) => setConfettiCount(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Speed:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input type="range" min="0.2" max="3" step="0.1" value={confettiSpeed} onChange={(e) => setConfettiSpeed(Number(e.target.value))} className="flex-1" />
                      <input type="number" min="0.2" max="3" step="0.1" value={confettiSpeed} onChange={(e) => setConfettiSpeed(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Opacity:</label>
                    <div className="flex items-center gap-1 flex-1">
                      <input type="range" min="0.1" max="1" step="0.05" value={confettiOpacity} onChange={(e) => setConfettiOpacity(Number(e.target.value))} className="flex-1" />
                      <input type="number" min="0.1" max="1" step="0.05" value={confettiOpacity} onChange={(e) => setConfettiOpacity(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
                    </div>
                  </div>
                </EffectSection>
              )}
            </div>
          </div>
          );
        })()}

    </>
  );
};

export const EffectsTab = React.memo(EffectsTabInner);
