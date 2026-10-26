import React, { useMemo, useState } from 'react';
import { Shuffle } from '@phosphor-icons/react';
import { type EffectType } from '../constants/gradientEffects';
import { costOf, totalCost, MULTI_FX_COST_BUDGET } from '../constants/effectCost';
import { EFFECTS_UI_LIST, EFFECT_LABELS } from '../constants/effectRegistry';
import { EffectSection } from './EffectSection';
import { EMOJI_PICKER_CATEGORIES, isEmojiRenderable, pickRandomEmojiSet } from '../constants/emojiPicker';
import { SliderRow } from './SliderRow';
import { AngleDial } from './AngleDial';
import { decayToPosition, positionToDecay } from '../utils/trailScale';
import { StepperRow } from './StepperRow';
import { HueStrip } from './HueStrip';
import { PointPad } from './PointPad';
import { Switch } from './Switch';
import { choice } from './choice';

export interface EffectsTabProps {
  isMobile: boolean;
  activeEffects: EffectType[];
  setActiveEffects: (v: EffectType[]) => void;
  isMultiFxMode: boolean; setIsMultiFxMode: (v: boolean) => void;
  collapsedEffects: Set<string>;
  toggleEffectCollapsed: (id: string) => void;
  randomizeEffects: () => void;

  // Kaleidoscope
  kaleidoscopeSegments: number; setKaleidoscopeSegments: (v: number) => void;
  kaleidoscopeRotateSpeed: number; setKaleidoscopeRotateSpeed: (v: number) => void;
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
  crtScanlineSpacing: number; setCrtScanlineSpacing: (v: number) => void;
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
  grainSize: number; setGrainSize: (v: number) => void;
  grainType: 'fine' | 'medium' | 'coarse' | 'film'; setGrainType: (v: 'fine' | 'medium' | 'coarse' | 'film') => void;
  // Gesso
  gessoWhiteness: number; setGessoWhiteness: (v: number) => void;
  gessoTexture: number; setGessoTexture: (v: number) => void;
  gessoResponse: number; setGessoResponse: (v: number) => void;
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
  vhsJitterAmount: number; setVhsJitterAmount: (v: number) => void;
  dustCrackleIntensity: number; setDustCrackleIntensity: (v: number) => void;
  dustCrackleLength: number; setDustCrackleLength: (v: number) => void;
  dustCrackleColor: string; setDustCrackleColor: (v: string) => void;
  // Wave
  waveDistortionStrength: number; setWaveDistortionStrength: (v: number) => void;
  waveDistortionRotation: number; setWaveDistortionRotation: (v: number) => void;
  // Slit-Scan
  slitScanIntensity: number; setSlitScanIntensity: (v: number) => void;
  slitScanHistory: number; setSlitScanHistory: (v: number) => void;
  slitScanDirection: 'horizontal' | 'vertical' | 'radial' | 'circular'; setSlitScanDirection: (v: 'horizontal' | 'vertical' | 'radial' | 'circular') => void;
  // Dither
  ditherLevels: number; setDitherLevels: (v: number) => void;
  ditherScale: number; setDitherScale: (v: number) => void;
  ditherType: 'bayer' | 'floyd-steinberg'; setDitherType: (v: 'bayer' | 'floyd-steinberg') => void;
  // Oil Paint
  oilPaintRadius: number; setOilPaintRadius: (v: number) => void;
  oilPaintLevels: number; setOilPaintLevels: (v: number) => void;
  // Impasto
  impastoStrength: number; setImpastoStrength: (v: number) => void;
  impastoLightAngle: number; setImpastoLightAngle: (v: number) => void;
  // Brush Strokes
  // Watercolor
  watercolorBleed: number; setWatercolorBleed: (v: number) => void;
  watercolorGrain: number; setWatercolorGrain: (v: number) => void;
  watercolorStyle: 'watercolor' | 'gouache' | 'ink-wash'; setWatercolorStyle: (v: 'watercolor' | 'gouache' | 'ink-wash') => void;
  // Dada
  dadaPanels: number; setDadaPanels: (v: number) => void;
  dadaChaos: number; setDadaChaos: (v: number) => void;
  // Aura Glow
  auraGlowCount: number; setAuraGlowCount: (v: number) => void;
  auraGlowSpeed: number; setAuraGlowSpeed: (v: number) => void;
  auraGlowOpacity: number; setAuraGlowOpacity: (v: number) => void;
}

const EffectsTabInner: React.FC<EffectsTabProps> = (props) => {
  const {
    isMobile,
    activeEffects, setActiveEffects, isMultiFxMode, setIsMultiFxMode, collapsedEffects, toggleEffectCollapsed, randomizeEffects,
    kaleidoscopeSegments, setKaleidoscopeSegments, kaleidoscopeRotateSpeed, setKaleidoscopeRotateSpeed,
    asciiSize, setAsciiSize, asciiChars, setAsciiChars, asciiColor, setAsciiColor,
    emojiChars, setEmojiChars, emojiSize, setEmojiSize, emojiRotateSpeed, setEmojiRotateSpeed,
    emojiSizeVariation, setEmojiSizeVariation, emojiOffsetX, setEmojiOffsetX,
    isEmojiPickerOpen, setIsEmojiPickerOpen, emojiPickerSearch, setEmojiPickerSearch,
    liquidStrength, setLiquidStrength, liquidScale, setLiquidScale,
    crtIntensity, setCrtIntensity, crtScanlineSpacing, setCrtScanlineSpacing,
    handlePhotoFileClick, photoFileName, photoBlendMode, setPhotoBlendMode, photoOpacity, setPhotoOpacity,
    chromaticTrailsDecay, setChromaticTrailsDecay, chromaticTrailsOffset, setChromaticTrailsOffset,
    pixelSize, setPixelSize, triangleSize, setTriangleSize, triangulateVariation, setTriangulateVariation,
    chromaticOffset, setChromaticOffset, chromaticAngle, setChromaticAngle,
    bloomIntensity, setBloomIntensity, bloomRadius, setBloomRadius,
    feedbackDecay, setFeedbackDecay, feedbackZoom, setFeedbackZoom, feedbackRotation, setFeedbackRotation,
    mirrorMode, setMirrorMode, mirrorTileCount, setMirrorTileCount,
    vignetteStrength, setVignetteStrength, vignetteSoftness, setVignetteSoftness,
    colorShiftHue, setColorShiftHue,
    grainIntensity, setGrainIntensity, grainSize, setGrainSize, grainType, setGrainType,
    gessoWhiteness, setGessoWhiteness, gessoTexture, setGessoTexture, gessoResponse, setGessoResponse,
    blurType, setBlurType, blurGaussianAmount, setBlurGaussianAmount, blurMotionAmount, setBlurMotionAmount,
    blurMotionDirection, setBlurMotionDirection, blurRadialAmount, setBlurRadialAmount,
    posterizeLevels, setPosterizeLevels,
    halftoneSize, setHalftoneSize, halftoneCMYK, setHalftoneCMYK, halftoneMove, setHalftoneMove, halftoneVariation, setHalftoneVariation,
    duotoneColor1, setDuotoneColor1, duotoneColor2, setDuotoneColor2, duotoneColor3, setDuotoneColor3,
    duotoneThreeColor, setDuotoneThreeColor, duotoneIntensity, setDuotoneIntensity,
    gridRows, setGridRows, gridColumns, setGridColumns, gridSides, setGridSides,
    gridShapeSize, setGridShapeSize, gridVariation, setGridVariation, gridRotationDirection, setGridRotationDirection,
    vhsGlitchIntensity, setVhsGlitchIntensity, vhsJitterAmount, setVhsJitterAmount, dustCrackleIntensity, setDustCrackleIntensity,
    dustCrackleLength, setDustCrackleLength, dustCrackleColor, setDustCrackleColor,
    waveDistortionStrength, setWaveDistortionStrength, waveDistortionRotation, setWaveDistortionRotation,
    slitScanIntensity, setSlitScanIntensity, slitScanHistory, setSlitScanHistory, slitScanDirection, setSlitScanDirection,
    ditherLevels, setDitherLevels, ditherScale, setDitherScale, ditherType, setDitherType,
    oilPaintRadius, setOilPaintRadius, oilPaintLevels, setOilPaintLevels,
    impastoStrength, setImpastoStrength, impastoLightAngle, setImpastoLightAngle,
    watercolorBleed, setWatercolorBleed, watercolorGrain, setWatercolorGrain, watercolorStyle, setWatercolorStyle,
    dadaPanels, setDadaPanels, dadaChaos, setDadaChaos,
    auraGlowCount, setAuraGlowCount, auraGlowSpeed, setAuraGlowSpeed, auraGlowOpacity, setAuraGlowOpacity,
  } = props;

  // Was recomputed inline on every render this component made (including
  // ones triggered by unrelated effect state elsewhere in the tab), not
  // just when the emoji picker's search query actually changed.
  const emojiPickerCategories = useMemo(() => {
    // Checked only while the picker is open: each emoji is tested once on this device, and only drawable ones show.
    if (!isEmojiPickerOpen) return [];
    const q = emojiPickerSearch.trim().toLowerCase();
    return EMOJI_PICKER_CATEGORIES
      .map(cat => ({ ...cat, emojis: cat.emojis.filter(em => (!q || em.name.includes(q)) && isEmojiRenderable(em.char)) }))
      .filter(cat => cat.emojis.length > 0);
  }, [emojiPickerSearch, isEmojiPickerOpen]);

  return (
    <>
        {/* No own card chrome (bg/border/rounded/overflow-hidden) here —
            this renders inside ControlDrawer's own card now, which already
            provides that surface. Used to double up into a visible
            card-in-a-card when the drawer wrapped this component. */}
        <div className="w-full">
          {/* Top row: MULTI + Shuffle + RESET — folded into the same rounded rectangle as the effects grid below */}
          <div className="w-full flex gap-0 border-b border-wav-line-strong">
            <button
              onClick={() => {
                const next = !isMultiFxMode;
                setIsMultiFxMode(next);
                // Turning Multi-FX off while several effects are stacked left
                // activeEffects out of sync with what single-select mode can
                // represent — the effect grid kept showing the whole stack
                // highlighted, and the next click on any of them silently
                // collapsed everything down to just that one (single-select's
                // own click handler below always replaces). That read as an
                // effect click randomly "wiping out" the others for no
                // visible reason. Collapse right here, at the moment of the
                // mode switch, so the highlighted state always matches what
                // the current mode can actually do.
                if (!next && activeEffects.length > 1) {
                  setActiveEffects([activeEffects[0]]);
                }
              }}
              aria-pressed={isMultiFxMode}
              className={`wav-choice flex-1 px-0.5 py-1.5 text-[10px] font-semibold transition-all whitespace-nowrap border-r border-wav-line-strong ${isMultiFxMode ? 'bg-white text-black font-bold' : 'text-white hover:bg-wav-hover'}`}
              title="Toggle Multi-FX (M)"
            >Multi</button>
            <button
              onClick={randomizeEffects}
              className="wav-choice flex-1 px-0.5 py-1.5 text-[10px] font-semibold transition-all text-white hover:bg-wav-hover flex items-center justify-center border-r border-wav-line-strong"
              title="Shuffle Effects (Shift+F)"
              aria-label="Shuffle Effects"
            ><Shuffle weight="regular" className="w-4 h-4" /></button>
            <button
              onClick={() => { setActiveEffects([]); setIsMultiFxMode(false); }}
              aria-pressed={activeEffects.length === 0 && !isMultiFxMode}
              className={`wav-choice flex-1 px-0.5 py-1.5 text-[10px] font-semibold transition-all whitespace-nowrap ${activeEffects.length === 0 && !isMultiFxMode ? 'bg-white text-black font-bold' : 'text-white hover:bg-wav-hover'}`}
            >Reset</button>
          </div>
          {(() => {
            // Derived from the single per-effect registry (constants/effectRegistry.ts)
            // instead of a hand-maintained list — adding/removing an effect no longer
            // requires touching this array too.
            const effectsList: { value: EffectType; label: string }[] =
              EFFECTS_UI_LIST.map((value) => ({ value, label: EFFECT_LABELS[value] }));
            const rows = Math.ceil(effectsList.length / 2);
            return (
              <div className="grid grid-cols-2 gap-0" style={{ gridAutoFlow: 'column', gridTemplateRows: `repeat(${rows}, auto)` }}>
                {effectsList.map((effect, i) => {
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
                        // Turning Emoji on draws a fresh random set each time.
                        if (effect.value === 'emoji' && !isActive && (isMultiFxMode ? !wouldExceedBudget : true)) setEmojiChars(pickRandomEmojiSet(5));
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
                      className={`wav-choice px-1 py-1.5 lg:py-1 text-[10px] transition-all whitespace-nowrap border-b border-wav-line-strong ${isLeftColumn ? 'border-r border-wav-line-strong' : ''} ${
                        isActive
                          ? 'bg-white text-black font-bold'
                          : wouldExceedBudget
                            ? 'text-wav-text-3 wav-disabled-text cursor-not-allowed'
                            : 'text-white hover:bg-wav-hover'
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

        {activeEffects.length > 0 && (() => {
          const isMulti = activeEffects.length > 1;

          return (
          <div className="w-full px-1.5 pt-0 pb-1">
            <div className={`flex flex-col ${isMulti ? 'gap-0' : 'gap-2'}`}>
              {activeEffects.includes('ascii') && (
                <EffectSection id="ascii" label="ASCII" isMulti={isMulti} expanded={!collapsedEffects.has('ascii')} onToggle={toggleEffectCollapsed}>
                  <SliderRow label="Cell Size:" value={asciiSize} onChange={setAsciiSize} min="6" max="40" />
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap" title="Darkest to brightest, left to right">Chars:</label>
                    <input
                      type="text"
                      value={asciiChars}
                      onChange={(e) => setAsciiChars(e.target.value)}
                      placeholder=" .:-=+*x#%@"
                      title="Darkest to brightest, left to right"
                      className="flex-1 min-w-0 text-[10px] text-white bg-wav-field border border-wav-line rounded px-1 py-1"
                    />
                    <label className="text-[10px] text-white whitespace-nowrap">Color:</label>
                    <Switch on={asciiColor} onChange={setAsciiColor} label="ASCII color" />
                  </div>
                </EffectSection>
              )}
              {activeEffects.includes('aura-glow') && (
                <EffectSection id="aura-glow" label="Aura Glow" isMulti={isMulti} expanded={!collapsedEffects.has('aura-glow')} onToggle={toggleEffectCollapsed}>
                  <SliderRow label="Lights:" value={auraGlowCount} onChange={setAuraGlowCount} min="1" max="6" step="1" />
                  <SliderRow label="Intensity:" value={auraGlowOpacity} onChange={setAuraGlowOpacity} min="0.1" max="1" step="0.05" />
                </EffectSection>
              )}
              {activeEffects.includes('bloom') && (
                <EffectSection id="bloom" label="Bloom" isMulti={isMulti} expanded={!collapsedEffects.has('bloom')} onToggle={toggleEffectCollapsed}>
                  <SliderRow label="Intensity:" value={bloomIntensity} onChange={setBloomIntensity} min="0" max="2" step="0.05" />
                  <SliderRow label="Radius:" value={bloomRadius} onChange={setBloomRadius} min="2" max="40" step="1" />
                </EffectSection>
              )}
              {activeEffects.includes('blur') && (
                <EffectSection id="blur" label="Blur" isMulti={isMulti} expanded={!collapsedEffects.has('blur')} onToggle={toggleEffectCollapsed}>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Type:</label>
                    <div className="flex gap-1 flex-1">
                      <button
                        onClick={() => setBlurType('gaussian')}
                        aria-pressed={blurType === 'gaussian'}
                        className={choice(blurType === 'gaussian', 'flex-1')}
                      >
                        Gaussian
                      </button>
                      <button
                        onClick={() => setBlurType('motion')}
                        aria-pressed={blurType === 'motion'}
                        className={choice(blurType === 'motion', 'flex-1')}
                      >
                        Motion
                      </button>
                      <button
                        onClick={() => setBlurType('radial')}
                        aria-pressed={blurType === 'radial'}
                        className={choice(blurType === 'radial', 'flex-1')}
                      >
                        Radial
                      </button>
                      <button
                        onClick={() => setBlurType('zoom')}
                        aria-pressed={blurType === 'zoom'}
                        className={choice(blurType === 'zoom', 'flex-1')}
                      >
                        Zoom
                      </button>
                    </div>
                  </div>
                  {blurType === 'gaussian' && (
                    <SliderRow label="Strength:" value={blurGaussianAmount} onChange={setBlurGaussianAmount} min="1" max="50" />
                  )}
                  {blurType === 'motion' && (
                    <>
                      <SliderRow label="Strength:" value={blurMotionAmount} onChange={setBlurMotionAmount} min="1" max="50" />
                      <AngleDial label="Direction" value={blurMotionDirection} onChange={setBlurMotionDirection} />
                    </>
                  )}
                  {(blurType === 'radial' || blurType === 'zoom') && (
                    <SliderRow label="Strength:" value={blurRadialAmount} onChange={setBlurRadialAmount} min="1" max="50" step="1" />
                  )}
                </EffectSection>
              )}
              {activeEffects.includes('chromatic') && (
                <EffectSection id="chromatic" label="Chromatic" isMulti={isMulti} expanded={!collapsedEffects.has('chromatic')} onToggle={toggleEffectCollapsed}>
                  <SliderRow label="Offset:" value={chromaticOffset} onChange={setChromaticOffset} min="1" max="200" />
                  <AngleDial label="Angle" value={chromaticAngle} onChange={setChromaticAngle} />
                </EffectSection>
              )}
              {activeEffects.includes('chromatic-trails') && (
                <EffectSection id="chromatic-trails" label="Chroma Trails" isMulti={isMulti} expanded={!collapsedEffects.has('chromatic-trails')} onToggle={toggleEffectCollapsed}>
                  <SliderRow label="Decay:" title="How long the trails linger. Each step lengthens them by the same amount, so the subtle end gets as much room as the long end." value={decayToPosition(chromaticTrailsDecay)} onChange={(t) => setChromaticTrailsDecay(positionToDecay(t))} min="0" max="1" step="0.01" />
                </EffectSection>
              )}
              {activeEffects.includes('crt') && (
                <EffectSection id="crt" label="Cathode" isMulti={isMulti} expanded={!collapsedEffects.has('crt')} onToggle={toggleEffectCollapsed}>
                  <SliderRow label="Intensity:" value={crtIntensity} onChange={setCrtIntensity} min="0" max="1" step="0.05" />
                </EffectSection>
              )}
              {activeEffects.includes('dada') && (
                <EffectSection id="dada" label="Dada" isMulti={isMulti} expanded={!collapsedEffects.has('dada')} onToggle={toggleEffectCollapsed}>
                  <SliderRow label="Panels:" value={dadaPanels} onChange={setDadaPanels} min="2" max="8" step="1" />
                  <SliderRow label="Chaos:" value={dadaChaos} onChange={setDadaChaos} min="0" max="1" step="0.05" />
                </EffectSection>
              )}
              {activeEffects.includes('dither') && (
                <EffectSection id="dither" label="Dither" isMulti={isMulti} expanded={!collapsedEffects.has('dither')} onToggle={toggleEffectCollapsed}>
                  <div className="flex items-center gap-1">
                    
                    <label className="text-[10px] text-white whitespace-nowrap">Type:</label>
                    <div className="flex gap-1 flex-1">
                      <button
                        onClick={() => setDitherType('bayer')}
                        aria-pressed={ditherType === 'bayer'}
                        className={choice(ditherType === 'bayer', 'flex-1')}
                      >
                        Bayer
                      </button>
                      <button
                        onClick={() => setDitherType('floyd-steinberg')}
                        aria-pressed={ditherType === 'floyd-steinberg'}
                        className={choice(ditherType === 'floyd-steinberg', 'flex-1')}
                      >
                        Floyd-Steinberg
                      </button>
                    </div>
                  </div>
                  <SliderRow label="Levels:" title="How many shades each color channel is reduced to. Both dither types use it." value={ditherLevels} onChange={setDitherLevels} min="2" max="16" step="1" />
                  <SliderRow label="Scale:" title="How big each dither dot is, in pixels. Both dither types use it." value={ditherScale} onChange={setDitherScale} min="1" max="8" step="1" />
                </EffectSection>
              )}
              {activeEffects.includes('duotone') && (
                <EffectSection id="duotone" label="Duotone" isMulti={isMulti} expanded={!collapsedEffects.has('duotone')} onToggle={toggleEffectCollapsed}>
                  <SliderRow label="Intensity:" value={duotoneIntensity} onChange={setDuotoneIntensity} min="0" max="1" step="0.05">
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
                      className="shrink-0 p-1 rounded bg-wav-field text-white hover:bg-wav-hover transition-all"
                    >
                      <Shuffle weight="regular" className="w-3 h-3" />
                    </button>
                  </SliderRow>
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
                    <Switch on={duotoneThreeColor} onChange={setDuotoneThreeColor} label="Tritone" />
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
              {activeEffects.includes('emoji') && (
                <EffectSection id="emoji" label="Emoji" isMulti={isMulti} expanded={!collapsedEffects.has('emoji')} onToggle={toggleEffectCollapsed}>
                  <SliderRow label="Cell Size:" value={emojiSize} onChange={setEmojiSize} min="10" max="60" />
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap" title="Darkest to brightest, left to right">Emojis:</label>
                    <input
                      type="text"
                      value={emojiChars}
                      onChange={(e) => setEmojiChars(e.target.value)}
                      onFocus={() => setIsEmojiPickerOpen(true)}
                      placeholder="😴🙂😃🤩🔥"
                      title="Darkest to brightest, left to right — click to pick from the emoji picker"
                      className="flex-1 min-w-0 text-[10px] text-white bg-wav-field border border-wav-line rounded px-1 py-1"
                    />
                    {isEmojiPickerOpen && (
                      <button
                        onClick={() => setIsEmojiPickerOpen(false)}
                        className="shrink-0 text-[10px] text-white bg-wav-hover hover:bg-wav-active px-1.5 py-1"
                      >Done</button>
                    )}
                  </div>
                  {isEmojiPickerOpen && (
                    <div className="mt-1 border border-wav-line bg-wav-field">
                      <input
                        type="text"
                        value={emojiPickerSearch}
                        onChange={(e) => setEmojiPickerSearch(e.target.value)}
                        placeholder="Search emoji…"
                        className="w-full text-[10px] text-white bg-wav-field border-b border-wav-line px-1.5 py-1 outline-none"
                      />
                      <div className="max-h-40 overflow-y-auto px-1 py-1">
                        {(() => {
                          const categories = emojiPickerCategories;
                          if (categories.length === 0) {
                            return <div className="text-[10px] text-wav-text-3 text-center py-2">No emoji match "{emojiPickerSearch}"</div>;
                          }
                          return categories.map((cat) => (
                            <div key={cat.label} className="mb-1">
                              <div className="text-[9px] text-wav-text-3 mb-0.5">{cat.label}</div>
                              <div className="flex flex-wrap gap-0.5">
                                {cat.emojis.map((em, i) => (
                                  <button
                                    key={`${cat.label}-${i}`}
                                    onClick={() => setEmojiChars(prev => prev + em.char)}
                                    className="w-7 h-7 flex items-center justify-center text-lg hover:bg-wav-hover transition-all"
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
              {activeEffects.includes('feedback') && (
                <EffectSection id="feedback" label="Feedback" isMulti={isMulti} expanded={!collapsedEffects.has('feedback')} onToggle={toggleEffectCollapsed}>
                  <SliderRow label="Decay:" value={feedbackDecay} onChange={setFeedbackDecay} min="0.5" max="0.97" step="0.01" />
                  <span className="text-[10px] text-white">Spin (across) and zoom (down):</span>
                  <PointPad label="Zoom and spin" x={((feedbackRotation + 10) / 20) * 100} y={(feedbackZoom / 5) * 100} onChange={(x, y) => { setFeedbackRotation(Math.round(((x / 100) * 20 - 10) * 2) / 2); setFeedbackZoom(Math.round((y / 100) * 50) / 10); }} />
                </EffectSection>
              )}
              {activeEffects.includes('gesso') && (
                <EffectSection id="gesso" label="Gesso" isMulti={isMulti} expanded={!collapsedEffects.has('gesso')} onToggle={toggleEffectCollapsed}>
                  <SliderRow label="Whiteness:" value={gessoWhiteness} onChange={setGessoWhiteness} min="0" max="0.94" step="0.01" />
                </EffectSection>
              )}
              {activeEffects.includes('grain') && (
                <EffectSection id="grain" label="Grain" isMulti={isMulti} expanded={!collapsedEffects.has('grain')} onToggle={toggleEffectCollapsed}>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Type:</label>
                    <div className="flex gap-1 flex-1">
                      <button
                        onClick={() => setGrainType('fine')}
                        aria-pressed={grainType === 'fine'}
                        className={choice(grainType === 'fine', 'flex-1')}
                      >
                        Fine
                      </button>
                      <button
                        onClick={() => setGrainType('medium')}
                        aria-pressed={grainType === 'medium'}
                        className={choice(grainType === 'medium', 'flex-1')}
                      >
                        Med
                      </button>
                      <button
                        onClick={() => setGrainType('coarse')}
                        aria-pressed={grainType === 'coarse'}
                        className={choice(grainType === 'coarse', 'flex-1')}
                      >
                        Coarse
                      </button>
                      <button
                        onClick={() => setGrainType('film')}
                        aria-pressed={grainType === 'film'}
                        className={choice(grainType === 'film', 'flex-1')}
                      >
                        Film
                      </button>
                    </div>
                  </div>
                  <SliderRow label="Intensity:" value={grainIntensity} onChange={setGrainIntensity} min="0" max="1" step="0.01" />
                  <SliderRow label="Size:" value={grainSize} onChange={setGrainSize} min="1" max="6" step="1" />
                  <SliderRow label="Crackle:" value={dustCrackleIntensity} onChange={setDustCrackleIntensity} min="0" max="1" step="0.05" />
                  {dustCrackleIntensity > 0 && (
                    <>
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
              {activeEffects.includes('grid-effect') && (
                <EffectSection id="grid-effect" label="Grid" isMulti={isMulti} expanded={!collapsedEffects.has('grid-effect')} onToggle={toggleEffectCollapsed}>
                  <div className="flex items-center justify-between gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Rotate:</label>
                    <div className="flex gap-1 flex-1">
                      <button
                        onClick={() => setGridRotationDirection('none')}
                        aria-pressed={gridRotationDirection === 'none'}
                        className={choice(gridRotationDirection === 'none', 'flex-1')}
                      >
                        OFF
                      </button>
                      <button
                        onClick={() => setGridRotationDirection('clockwise')}
                        aria-pressed={gridRotationDirection === 'clockwise'}
                        aria-label="Clockwise"
                        title="Clockwise"
                        className={choice(gridRotationDirection === 'clockwise', 'flex-1')}
                      >
                        ⟳
                      </button>
                      <button
                        onClick={() => setGridRotationDirection('counterclockwise')}
                        aria-pressed={gridRotationDirection === 'counterclockwise'}
                        aria-label="Counterclockwise"
                        title="Counterclockwise"
                        className={choice(gridRotationDirection === 'counterclockwise', 'flex-1')}
                      >
                        ⟲
                      </button>
                    </div>
                  </div>
                  <StepperRow label="Sides" value={gridSides} onChange={setGridSides} min={1} max={10} />
                  <SliderRow label="Rows:" value={gridRows} onChange={setGridRows} min="2" max="50" />
                  <SliderRow label="Columns:" value={gridColumns} onChange={setGridColumns} min="2" max="50" />
                  {/* Grid Effect Shape Size Control */}
                  <SliderRow label="Size:" value={gridShapeSize} onChange={setGridShapeSize} min={1} max={100} step={1} />
                </EffectSection>
              )}

              
              
              
              
              {activeEffects.includes('halftone') && (
                <EffectSection id="halftone" label="Halftone" isMulti={isMulti} expanded={!collapsedEffects.has('halftone')} onToggle={toggleEffectCollapsed}>
                  <SliderRow label="Dot Size:" value={halftoneSize} onChange={setHalftoneSize} min="2" max="200" />
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <label className="text-[10px] text-white whitespace-nowrap">Move:</label>
                      <Switch on={halftoneMove} onChange={setHalftoneMove} label="Halftone move" />
                    </div>
                    <div className="flex items-center gap-1">
                      <label className="text-[10px] text-white whitespace-nowrap">CMYK:</label>
                      <Switch on={halftoneCMYK} onChange={setHalftoneCMYK} label="Halftone CMYK" />
                    </div>
                  </div>
                </EffectSection>
              )}
              {activeEffects.includes('impasto') && (
                <EffectSection id="impasto" label="Impasto" isMulti={isMulti} expanded={!collapsedEffects.has('impasto')} onToggle={toggleEffectCollapsed}>
                  <SliderRow label="Strength:" value={impastoStrength} onChange={setImpastoStrength} min="1" max="7" step="0.1" />
                  <AngleDial label="Light Angle" value={impastoLightAngle} onChange={setImpastoLightAngle} max={359} />
                </EffectSection>
              )}
              {activeEffects.includes('kaleidoscope') && (
                <EffectSection id="kaleidoscope" label="Kaleido" isMulti={isMulti} expanded={!collapsedEffects.has('kaleidoscope')} onToggle={toggleEffectCollapsed}>
                  <SliderRow label="Segments:" value={kaleidoscopeSegments} onChange={setKaleidoscopeSegments} min="2" max="50" />
                </EffectSection>
              )}
              {activeEffects.includes('liquid') && (
                <EffectSection id="liquid" label="Liquid" isMulti={isMulti} expanded={!collapsedEffects.has('liquid')} onToggle={toggleEffectCollapsed}>
                  <SliderRow label="Strength:" value={liquidStrength} onChange={setLiquidStrength} min="0" max="100" />
                  <SliderRow label="Scale:" value={liquidScale} onChange={setLiquidScale} min="0.5" max="10" step="0.5" />
                </EffectSection>
              )}
              {activeEffects.includes('mirror') && (
                <EffectSection id="mirror" label="Mirror" isMulti={isMulti} expanded={!collapsedEffects.has('mirror')} onToggle={toggleEffectCollapsed}>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Mode:</label>
                    <div className="flex gap-1 flex-1">
                      {(['horizontal', 'vertical', 'grid'] as const).map(mode => (
                        <button key={mode} onClick={() => setMirrorMode(mode)}
                          aria-pressed={mirrorMode === mode}
                          className={choice(mirrorMode === mode, 'flex-1')}>
                          {mode === 'horizontal' ? 'H' : mode === 'vertical' ? 'V' : 'Grid'}
                        </button>
                      ))}
                    </div>
                  </div>
                  {mirrorMode === 'grid' && (
                    <StepperRow label="Tiles" value={mirrorTileCount} onChange={setMirrorTileCount} min={2} max={16} />
                  )}
                </EffectSection>
              )}
              {activeEffects.includes('oil-paint') && (
                <EffectSection id="oil-paint" label="Oil Paint" isMulti={isMulti} expanded={!collapsedEffects.has('oil-paint')} onToggle={toggleEffectCollapsed}>
                  <SliderRow label="Brush Size:" value={oilPaintRadius} onChange={setOilPaintRadius} min="1" max="6" step="1" />
                  <SliderRow label="Detail:" value={oilPaintLevels} onChange={setOilPaintLevels} min="8" max="40" step="1" />
                </EffectSection>
              )}
              {activeEffects.includes('photo') && (
                <EffectSection id="photo" label="Photo" isMulti={isMulti} expanded={!collapsedEffects.has('photo')} onToggle={toggleEffectCollapsed}>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handlePhotoFileClick}
                      className="flex-1 px-2 py-1 text-[10px] font-semibold bg-wav-hover text-white hover:bg-wav-active transition-all truncate"
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
                          className={choice(photoBlendMode === mode, 'flex-1')}
                        >{mode === 'source-over' ? 'Normal' : mode[0].toUpperCase() + mode.slice(1)}</button>
                      ))}
                    </div>
                  </div>
                  <SliderRow label="Opacity:" value={photoOpacity} onChange={setPhotoOpacity} min="0" max="100" />
                </EffectSection>
              )}
              {activeEffects.includes('pixelate') && (
                <EffectSection id="pixelate" label="Pixelate" isMulti={isMulti} expanded={!collapsedEffects.has('pixelate')} onToggle={toggleEffectCollapsed}>
                  <SliderRow label="Size:" value={pixelSize} onChange={setPixelSize} min="5" max="200" />
                </EffectSection>
              )}
              {activeEffects.includes('posterize') && (
                <EffectSection id="posterize" label="Posterize" isMulti={isMulti} expanded={!collapsedEffects.has('posterize')} onToggle={toggleEffectCollapsed}>
                  <StepperRow label="Levels" value={posterizeLevels} onChange={setPosterizeLevels} min={2} max={16} />
                </EffectSection>
              )}
              {activeEffects.includes('shift') && (
                <EffectSection id="shift" label="Shift" isMulti={isMulti} expanded={!collapsedEffects.has('shift')} onToggle={toggleEffectCollapsed}>
                  <HueStrip label="Hue" value={colorShiftHue} onChange={setColorShiftHue} />
                </EffectSection>
              )}
              {activeEffects.includes('slit-scan') && (
                <EffectSection id="slit-scan" label="Slit-Scan" isMulti={isMulti} expanded={!collapsedEffects.has('slit-scan')} onToggle={toggleEffectCollapsed}>
                  <div className="flex items-center gap-1">
                    <div className="flex gap-1 flex-1 min-w-0">
                      <button
                        onClick={() => setSlitScanDirection('horizontal')}
                        aria-pressed={slitScanDirection === 'horizontal'}
                        className={choice(slitScanDirection === 'horizontal', 'flex-1 min-w-0 whitespace-nowrap')}
                      >
                        Horz
                      </button>
                      <button
                        onClick={() => setSlitScanDirection('vertical')}
                        aria-pressed={slitScanDirection === 'vertical'}
                        className={choice(slitScanDirection === 'vertical', 'flex-1 min-w-0 whitespace-nowrap')}
                      >
                        Vert
                      </button>
                      <button
                        onClick={() => setSlitScanDirection('radial')}
                        aria-pressed={slitScanDirection === 'radial'}
                        className={choice(slitScanDirection === 'radial', 'flex-1 min-w-0 whitespace-nowrap')}
                      >
                        Radial
                      </button>
                      <button
                        onClick={() => setSlitScanDirection('circular')}
                        aria-pressed={slitScanDirection === 'circular'}
                        className={choice(slitScanDirection === 'circular', 'flex-1 min-w-0 whitespace-nowrap')}
                      >
                        Circle
                      </button>
                    </div>
                  </div>
                  <SliderRow label="Strength:" value={slitScanIntensity} onChange={setSlitScanIntensity} min="0.1" max="10" step="0.1" />
                </EffectSection>
              )}
              {activeEffects.includes('triangulate') && (
                <EffectSection id="triangulate" label="Triangulate" isMulti={isMulti} expanded={!collapsedEffects.has('triangulate')} onToggle={toggleEffectCollapsed}>
                  <SliderRow label="Size:" value={triangleSize} onChange={setTriangleSize} min="10" max="200" />
                </EffectSection>
              )}
              {activeEffects.includes('vhs') && (
                <EffectSection id="vhs" label="VHS" isMulti={isMulti} expanded={!collapsedEffects.has('vhs')} onToggle={toggleEffectCollapsed}>
                  <SliderRow label="Intensity:" value={vhsGlitchIntensity} onChange={setVhsGlitchIntensity} min="0" max="1" step="0.05" />
                </EffectSection>
              )}
              {activeEffects.includes('vignette') && (
                <EffectSection id="vignette" label="Vignette" isMulti={isMulti} expanded={!collapsedEffects.has('vignette')} onToggle={toggleEffectCollapsed}>
                  <SliderRow label="Intensity:" value={vignetteStrength} onChange={setVignetteStrength} min="0" max="1" step="0.05" />
                </EffectSection>
              )}
              {activeEffects.includes('watercolor') && (
                <EffectSection id="watercolor" label="Watercolor" isMulti={isMulti} expanded={!collapsedEffects.has('watercolor')} onToggle={toggleEffectCollapsed}>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-white whitespace-nowrap">Style:</label>
                    <div className="flex gap-1 flex-1">
                      {([
                        { id: 'watercolor', label: 'Watercolor', bleed: 3, grain: 0.4 },
                        { id: 'gouache', label: 'Gouache', bleed: 1.5, grain: 0.25 },
                        { id: 'ink-wash', label: 'Ink Wash', bleed: 6, grain: 0.3 },
                      ] as const).map((s) => (
                        <button
                          key={s.id}
                          onClick={() => { setWatercolorStyle(s.id); setWatercolorBleed(s.bleed); setWatercolorGrain(s.grain); }}
                          aria-pressed={watercolorStyle === s.id}
                          className={choice(watercolorStyle === s.id, 'flex-1')}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <SliderRow label="Bleed:" value={watercolorBleed} onChange={setWatercolorBleed} min="0" max="10" step="0.5" />
                  <SliderRow label="Grain:" value={watercolorGrain} onChange={setWatercolorGrain} min="0" max="1" step="0.05" />
                </EffectSection>
              )}
              {activeEffects.includes('wave') && (
                <EffectSection id="wave" label="Wave" isMulti={isMulti} expanded={!collapsedEffects.has('wave')} onToggle={toggleEffectCollapsed}>
                  <SliderRow label="Strength:" value={waveDistortionStrength} onChange={setWaveDistortionStrength} min="5" max="100" />
                  <AngleDial label="Rotation" value={waveDistortionRotation} onChange={setWaveDistortionRotation} />
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
