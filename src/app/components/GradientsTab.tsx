import React from 'react';
import { ArrowClockwise, ArrowCounterClockwise, Shuffle } from '@phosphor-icons/react';
import { type ColorRGB, type GradientType, FULL_GRADIENT_TYPES, STYLE_FIELD_GRADIENT_TYPES, GRADIENT_FAMILIES, familyOf } from '../constants/gradientEffects';
import { GRADIENT_LOOKS, type GradientLook } from '../constants/gradientLooks';
import { LooksMenu } from './LooksMenu';
import { type PalettePreset } from '../constants/palettePresets';
import { STYLE_SHAPE_CONTROLS, SHAPE_MIN, SHAPE_MAX } from '../constants/styleShapeControls';
import { SliderRow } from './SliderRow';
import { PointPad } from './PointPad';
import { Switch } from './Switch';
import { choice } from './choice';

// Gradients (besides the styled-field ones) that move, so show the shared Speed slider.
const ANIMATED_GRADIENTS: string[] = ['stack', 'hatch', 'caustics', 'lava-lamp', 'marble', 'metaballs', 'truchet', 'attractor', 'particles', 'reaction-diffusion', 'julia', 'shapes', 'noise', 'radial', 'voronoi', 'flower'];

export interface GradientsTabProps {
  gradientType: GradientType;
  setGradientType: (t: GradientType) => void;
  getGradientDisplayName: (t: GradientType) => string;
  shuffleGradientType: () => void;

  // Auto-rotate direction — shared across most gradient types (whichever
  // ones animate gradientAngle on their own); previously only reachable
  // via the D keyboard shortcut with no visible control anywhere.
  rotationDirection: 'clockwise' | 'counter';
  setRotationDirection: (dir: 'clockwise' | 'counter') => void;

  // Grid
  gridRows: number; setGridRows: (v: number) => void;
  gridColumns: number; setGridColumns: (v: number) => void;
  gridCellAngleStep: number; setGridCellAngleStep: (v: number) => void;
  gridHardEdge: boolean; setGridHardEdge: (v: boolean) => void;

  // Polar Grid
  polygon2Sides: number; setPolygon2Sides: (v: number) => void;
  concentricRingCount: number; setConcentricRingCount: (v: number) => void;

  // Iridescent

  // Aurora
  auroraBandCount: number; setAuroraBandCount: (v: number) => void;
  auroraBandHeight: number; setAuroraBandHeight: (v: number) => void;
  auroraWaveSpeed: number; setAuroraWaveSpeed: (v: number) => void;

  // Fade — 'light' mode folds in the former standalone Turrell gradient.
  fadeMode: 'angle' | 'light'; setFadeMode: (v: 'angle' | 'light') => void;
  turrellSpeed: number; setTurrellSpeed: (v: number) => void;
  turrellGlow: number; setTurrellGlow: (v: number) => void;

  // Stack
  stackCount: number; setStackCount: (v: number) => void;
  stackGap: number; setStackGap: (v: number) => void;
  stackWidth: number; setStackWidth: (v: number) => void;
  stackLength: number; setStackLength: (v: number) => void;
  stackResponse: number; setStackResponse: (v: number) => void;
  stackSpeed: number; setStackSpeed: (v: number) => void;

  // Hatch
  hatchLayers: number; setHatchLayers: (v: number) => void;
  hatchSpacing: number; setHatchSpacing: (v: number) => void;
  hatchResponse: number; setHatchResponse: (v: number) => void;
  hatchSpeed: number; setHatchSpeed: (v: number) => void;

  // Caustics
  causticsBrightness: number; setCausticsBrightness: (v: number) => void;
  causticsScale: number; setCausticsScale: (v: number) => void;
  causticsSpeed: number; setCausticsSpeed: (v: number) => void;

  // Lava Lamp
  lavaBlobCount: number; setLavaBlobCount: (v: number) => void;
  lavaBlobSize: number; setLavaBlobSize: (v: number) => void;
  lavaSpeed: number; setLavaSpeed: (v: number) => void;

  // Marble
  marbleVeinFreq: number; setMarbleVeinFreq: (v: number) => void;
  marbleTurbulence: number; setMarbleTurbulence: (v: number) => void;
  marbleOctaves: number; setMarbleOctaves: (v: number) => void;
  marbleSpeed: number; setMarbleSpeed: (v: number) => void;

  // Metaballs
  metaballCount: number; setMetaballCount: (v: number) => void;
  metaballSize: number; setMetaballSize: (v: number) => void;
  metaballSpeed: number; setMetaballSpeed: (v: number) => void;

  // Truchet
  truchetSize: number; setTruchetSize: (v: number) => void;
  truchetVariation: number; setTruchetVariation: (v: number) => void;
  truchetThickness: number; setTruchetThickness: (v: number) => void;
  truchetSpeed: number; setTruchetSpeed: (v: number) => void;


  // Flow Field
  flowParticleCount: number; setFlowParticleCount: (v: number) => void;
  flowSpeed: number; setFlowSpeed: (v: number) => void;
  flowScale: number; setFlowScale: (v: number) => void;
  flowThickness: number; setFlowThickness: (v: number) => void;

  // Attractor
  attractorPointCount: number; setAttractorPointCount: (v: number) => void;
  attractorSpeed: number; setAttractorSpeed: (v: number) => void;
  attractorScale: number; setAttractorScale: (v: number) => void;
  attractorDotSize: number; setAttractorDotSize: (v: number) => void;
  attractorTrailFade: number; setAttractorTrailFade: (v: number) => void;

  // Particles
  particlesCount: number; setParticlesCount: (v: number) => void;
  particlesSpeed: number; setParticlesSpeed: (v: number) => void;
  particlesSize: number; setParticlesSize: (v: number) => void;
  particlesTrail: number; setParticlesTrail: (v: number) => void;
  particlesGravity: number; setParticlesGravity: (v: number) => void;
  particlesSides: number; setParticlesSides: (v: number) => void;
  particlesMode: 'drift' | 'flow-field' | 'marks'; setParticlesMode: (v: 'drift' | 'flow-field' | 'marks') => void;
  marksCount: number; setMarksCount: (v: number) => void;
  marksSize: number; setMarksSize: (v: number) => void;
  marksDecay: number; setMarksDecay: (v: number) => void;
  // Tiling
  tilingSize: number; setTilingSize: (v: number) => void;
  tilingSymmetry: number; setTilingSymmetry: (v: number) => void;
  tilingComplexity: number; setTilingComplexity: (v: number) => void;
  tilingRotation: number; setTilingRotation: (v: number) => void;
  tilingRowOffset: number; setTilingRowOffset: (v: number) => void;

  // Fireworks
  fireworksCount: number; setFireworksCount: (v: number) => void;
  fireworksParticleCount: number; setFireworksParticleCount: (v: number) => void;
  fireworksTrailFade: number; setFireworksTrailFade: (v: number) => void;

  // Lightning
  lightningBoltCount: number; setLightningBoltCount: (v: number) => void;
  lightningJitter: number; setLightningJitter: (v: number) => void;
  lightningBranchiness: number; setLightningBranchiness: (v: number) => void;

  // Reaction-Diffusion
  reactionDiffusionFeed: number; setReactionDiffusionFeed: (v: number) => void;
  reactionDiffusionKill: number; setReactionDiffusionKill: (v: number) => void;
  reactionDiffusionSpeed: number; setReactionDiffusionSpeed: (v: number) => void;

  // Shared field mapping (Reaction-Diffusion, Marble, Caustics, Topographic, Julia, Wave Interference, Mesh Wireframe)
  fieldContrast: number; setFieldContrast: (v: number) => void;
  paletteMode: 'linear' | 'banded' | 'cyclic'; setPaletteMode: (v: 'linear' | 'banded' | 'cyclic') => void;
  paletteBands: number; setPaletteBands: (v: number) => void;

  // Shared Scale/Speed for the styled-field gradients (Smoke, Glass, Mesh, ...)
  fieldScale: number; setFieldScale: (v: number) => void;
  fieldSpeed: number; setFieldSpeed: (v: number) => void;
  // The one Speed for every animated gradient (the app's playback rate; the [ and ] keys step it too).
  vcrPlaybackSpeed: number; setVcrPlaybackSpeed: (v: number) => void;
  fieldSwirl: number; setFieldSwirl: (v: number) => void;
  fieldShapeA: number; setFieldShapeA: (v: number) => void;
  fieldShapeB: number; setFieldShapeB: (v: number) => void;
  // Applies a named Look (palette + Scale/Speed/...) for the styled-field gradients
  applyGradientLook: (look: GradientLook) => void;
  applyPalette: (palette: PalettePreset) => void;
  shuffleColors: () => void;
  gradientColors: ColorRGB[];
  structuralSeed: number;
  setStructuralSeed: (v: number) => void;

  // Wave Interference
  waveInterferenceSourceCount: number; setWaveInterferenceSourceCount: (v: number) => void;
  waveInterferenceFrequency: number; setWaveInterferenceFrequency: (v: number) => void;
  waveInterferenceSpeed: number; setWaveInterferenceSpeed: (v: number) => void;

  // Mesh Wireframe
  meshWireframeGridSize: number; setMeshWireframeGridSize: (v: number) => void;
  meshWireframeJitter: number; setMeshWireframeJitter: (v: number) => void;
  meshWireframeLineWidth: number; setMeshWireframeLineWidth: (v: number) => void;

  // Topographic
  topographicScale: number; setTopographicScale: (v: number) => void;
  topographicBands: number; setTopographicBands: (v: number) => void;
  topographicLineWidth: number; setTopographicLineWidth: (v: number) => void;

  // Julia Set
  juliaReal: number; setJuliaReal: (v: number) => void;
  juliaImaginary: number; setJuliaImaginary: (v: number) => void;
  juliaZoom: number; setJuliaZoom: (v: number) => void;
  juliaIterations: number; setJuliaIterations: (v: number) => void;
  juliaSpeed: number; setJuliaSpeed: (v: number) => void;

  // Angle / Radial
  angleStartOffset: number; setAngleStartOffset: (v: number) => void;
  angleCenterX: number; setAngleCenterX: (v: number) => void;
  angleCenterY: number; setAngleCenterY: (v: number) => void;
  angleHardEdge: boolean; setAngleHardEdge: (v: boolean) => void;
  radialSizeScale: number; setRadialSizeScale: (v: number) => void;
  radialHardEdge: boolean; setRadialHardEdge: (v: boolean) => void;
  radialSpeed: number; setRadialSpeed: (v: number) => void;

  // Shapes
  concentricRingWidth: number; setConcentricRingWidth: (v: number) => void;
  shapesSides: number; setShapesSides: (v: number) => void;
  shapesMode: 'polygon' | 'polar-grid'; setShapesMode: (v: 'polygon' | 'polar-grid') => void;
  shapesCount: number; setShapesCount: (v: number) => void;
  shapesSpeed: number; setShapesSpeed: (v: number) => void;

  // Windmill (spiral)
  windmillTightness: number; setWindmillTightness: (v: number) => void;
  windmillRotations: number; setWindmillRotations: (v: number) => void;
  windmillThickness: number; setWindmillThickness: (v: number) => void;
  windmillZoomResponse: number; setWindmillZoomResponse: (v: number) => void;
  windmillMode: 'blades' | 'helix'; setWindmillMode: (v: 'blades' | 'helix') => void;

  // Waves
  drawParamsDirtyRef: React.MutableRefObject<boolean>;


  // Noise
  noiseScale: number; setNoiseScale: (v: number) => void;
  noiseOctaves: number; setNoiseOctaves: (v: number) => void;
  noiseDirection: number; setNoiseDirection: (v: number) => void;
  noiseWarp: number; setNoiseWarp: (v: number) => void;
  noiseType: 'smooth' | 'ridged' | 'turbulence'; setNoiseType: (t: 'smooth' | 'ridged' | 'turbulence') => void;
  noiseSpeed: number; setNoiseSpeed: (v: number) => void;

  // Radial Burst
  radialBurstCount: number; setRadialBurstCount: (v: number) => void;
  radialBurstSpread: number; setRadialBurstSpread: (v: number) => void;
  radialBurstSize: number; setRadialBurstSize: (v: number) => void;

  // Voronoi
  voronoiCellCount: number; setVoronoiCellCount: (v: number) => void;
  voronoiDistortion: number; setVoronoiDistortion: (v: number) => void;
  voronoiSpeed: number; setVoronoiSpeed: (v: number) => void;

  // Fade
  fadeDirection: number; setFadeDirection: (v: number) => void;

  // Radar

  // Flower
  flowerCircles: number; setFlowerCircles: (v: number) => void;
  flowerScale: number; setFlowerScale: (v: number) => void;
  flowerSpread: number; setFlowerSpread: (v: number) => void;
  flowerSymmetry: number; setFlowerSymmetry: (v: number) => void;
  flowerOpacity: number; setFlowerOpacity: (v: number) => void;
  flowerSpeed: number; setFlowerSpeed: (v: number) => void;

  // Helix (conical spiral)
  helixTurns: number; setHelixTurns: (v: number) => void;
  helixTightness: number; setHelixTightness: (v: number) => void;
}

const GradientsTabInner: React.FC<GradientsTabProps> = (props) => {
  const {
    gradientType, setGradientType, getGradientDisplayName, shuffleGradientType,
    rotationDirection, setRotationDirection,
    gridRows, setGridRows, gridColumns, setGridColumns, gridCellAngleStep, setGridCellAngleStep, gridHardEdge, setGridHardEdge,
    polygon2Sides, setPolygon2Sides, concentricRingCount, setConcentricRingCount,
    auroraBandCount, setAuroraBandCount, auroraBandHeight, setAuroraBandHeight, auroraWaveSpeed, setAuroraWaveSpeed,
    fadeMode, setFadeMode, turrellSpeed, setTurrellSpeed, turrellGlow, setTurrellGlow,
    stackCount, setStackCount, stackGap, setStackGap, stackWidth, setStackWidth, stackLength, setStackLength, stackResponse, stackSpeed, setStackResponse, setStackSpeed,
    hatchLayers, setHatchLayers, hatchSpacing, setHatchSpacing, hatchResponse, setHatchResponse, hatchSpeed, setHatchSpeed,
    causticsBrightness, setCausticsBrightness, causticsScale, causticsSpeed, setCausticsScale, setCausticsSpeed,
    lavaBlobCount, setLavaBlobCount, lavaBlobSize, setLavaBlobSize, lavaSpeed, setLavaSpeed,
    marbleVeinFreq, setMarbleVeinFreq, marbleTurbulence, setMarbleTurbulence, marbleOctaves, marbleSpeed, setMarbleOctaves, setMarbleSpeed,
    metaballCount, setMetaballCount, metaballSize, setMetaballSize, metaballSpeed, setMetaballSpeed,
    truchetSize, setTruchetSize, truchetVariation, setTruchetVariation, truchetThickness, truchetSpeed, setTruchetThickness, setTruchetSpeed,
    flowParticleCount, setFlowParticleCount, flowSpeed, setFlowSpeed, flowScale, setFlowScale, flowThickness, setFlowThickness,
    attractorPointCount, setAttractorPointCount, attractorSpeed, setAttractorSpeed, attractorScale, setAttractorScale, attractorDotSize, setAttractorDotSize,
    attractorTrailFade, setAttractorTrailFade,
    particlesCount, setParticlesCount, particlesSpeed, setParticlesSpeed, particlesSize, setParticlesSize, particlesTrail, setParticlesTrail, particlesGravity, setParticlesGravity, particlesSides, setParticlesSides, particlesMode, setParticlesMode,
    marksCount, setMarksCount, marksSize, setMarksSize, marksDecay, setMarksDecay,
    tilingSize, setTilingSize, tilingSymmetry, setTilingSymmetry, tilingComplexity, setTilingComplexity, tilingRotation, setTilingRotation, tilingRowOffset, setTilingRowOffset,
    fireworksCount, setFireworksCount, fireworksParticleCount, setFireworksParticleCount, fireworksTrailFade, setFireworksTrailFade,
    lightningBoltCount, setLightningBoltCount, lightningJitter, setLightningJitter, lightningBranchiness, setLightningBranchiness,
    reactionDiffusionFeed, setReactionDiffusionFeed, reactionDiffusionKill, setReactionDiffusionKill, reactionDiffusionSpeed, setReactionDiffusionSpeed,
    fieldContrast, setFieldContrast, paletteMode, setPaletteMode, paletteBands, setPaletteBands,
    fieldScale, setFieldScale, fieldSpeed, setFieldSpeed, vcrPlaybackSpeed, setVcrPlaybackSpeed, fieldShapeA, setFieldShapeA, fieldShapeB, setFieldShapeB, fieldSwirl, setFieldSwirl, applyGradientLook, applyPalette, shuffleColors, gradientColors,
    topographicScale, setTopographicScale, topographicBands, setTopographicBands, topographicLineWidth, setTopographicLineWidth,
    waveInterferenceSourceCount, setWaveInterferenceSourceCount, waveInterferenceFrequency, setWaveInterferenceFrequency, waveInterferenceSpeed, setWaveInterferenceSpeed,
    meshWireframeGridSize, setMeshWireframeGridSize, meshWireframeJitter, setMeshWireframeJitter, meshWireframeLineWidth, setMeshWireframeLineWidth,
    juliaReal, setJuliaReal, juliaImaginary, setJuliaImaginary, juliaZoom, setJuliaZoom, juliaIterations, juliaSpeed, setJuliaIterations, setJuliaSpeed,
    angleStartOffset, setAngleStartOffset, angleCenterX, setAngleCenterX, angleCenterY, setAngleCenterY, angleHardEdge, setAngleHardEdge,
    radialSizeScale, setRadialSizeScale, radialHardEdge, setRadialHardEdge, radialSpeed, setRadialSpeed,
    concentricRingWidth, setConcentricRingWidth, shapesSides, setShapesSides, shapesCount, shapesSpeed, setShapesCount, setShapesSpeed, shapesMode, setShapesMode,
    windmillTightness, setWindmillTightness, windmillRotations, setWindmillRotations, windmillThickness, setWindmillThickness,
    windmillZoomResponse, setWindmillZoomResponse, windmillMode, setWindmillMode,
    drawParamsDirtyRef,
    noiseScale, setNoiseScale, noiseOctaves, setNoiseOctaves, noiseDirection, setNoiseDirection, noiseWarp, setNoiseWarp, noiseType, setNoiseType, noiseSpeed, setNoiseSpeed,
    radialBurstCount, setRadialBurstCount, radialBurstSpread, setRadialBurstSpread, radialBurstSize, setRadialBurstSize,
    
    voronoiCellCount, setVoronoiCellCount, voronoiDistortion, voronoiSpeed, setVoronoiDistortion, setVoronoiSpeed,
    fadeDirection, setFadeDirection,
    
    flowerCircles, setFlowerCircles, flowerScale, setFlowerScale, flowerSpread, setFlowerSpread,
    flowerSymmetry, setFlowerSymmetry, flowerOpacity, flowerSpeed, setFlowerOpacity, setFlowerSpeed,
    helixTurns, setHelixTurns, helixTightness, setHelixTightness,
  } = props;

  // Shared field-mapping controls — appear for any scalar-field gradient
  // (one continuous 0-1 value mapped to the palette per pixel), reusing a
  // single fieldContrast/paletteMode/paletteBands state rather than a
  // near-duplicate set per gradient, since only one is ever active.
  // Rendered as a Fragment (no wrapping box) directly inside each
  // gradient's own control card, ABOVE that gradient's own sliders — same
  // "mode button leads" convention as Windmill/Radial Burst, since Palette
  // is a structural choice (it gates whether Bands/Repeats even appears)
  // rather than a fine-tune value. Fade only wires up Contrast (it blends
  // exactly 2 explicit colors rather than indexing the full palette, so
  // Banded/Cyclic don't apply the same way).
  const renderFieldMappingRows = () => (
    <>
      {(
        <div className="flex items-center gap-1">
          <label className="text-[10px] text-white whitespace-nowrap">Palette:</label>
          <div className="flex gap-1 flex-1">
            {(['linear', 'banded', 'cyclic'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setPaletteMode(mode)}
                aria-pressed={paletteMode === mode}
                className={choice(paletteMode === mode, 'flex-1 capitalize')}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      )}
      <SliderRow label="Contrast:" value={fieldContrast} onChange={setFieldContrast} min="0.3" max="3" step="0.1" />
      {paletteMode !== 'linear' && (
        <SliderRow label={paletteMode === 'banded' ? 'Bands:' : 'Repeats:'} value={paletteBands} onChange={setPaletteBands} min="2" max="16" step="1" />
      )}
    </>
  );

  // Hard Edge toggle — rendered inline inside a gradient type's own control
  // block (Radial/Angle/Grid) rather than as one global switch, so it's a
  // per-gradient setting: each type remembers its own on/off state and the
  // control only ever appears alongside that type's own sliders.
  const renderHardEdgeToggle = (value: boolean, setValue: (v: boolean) => void) => (
    <div className="flex items-center justify-between">
      <label className="text-[10px] text-white whitespace-nowrap" title="Flat solid bands with hard cuts instead of a smooth blend">Hard Edge:</label>
      <Switch on={value} onChange={setValue} label="Hard edge" />
    </div>
  );

  // Which member of a merged gradient (Mesh: Soft / Flow, ...) was on last, so clicking the entry again
  // returns to it rather than always to the first.
  const lastFamilyMember = React.useRef<Record<string, GradientType>>({});
  const currentFamily = familyOf(gradientType);
  if (currentFamily) lastFamilyMember.current[currentFamily.id] = gradientType;

  return (
    <>

        {/* Gradient Type Buttons - one rounded rectangle, 2 columns, thin dividing lines */}
        <div className="w-full">
          {/* Shuffle — picks a random type and randomizes its own shape
              params too (same shuffleGradientType used by the Shift+G
              shortcut), matching Effects' own Shuffle button. */}
          <button
            onClick={shuffleGradientType}
            className="wav-choice w-full px-1 py-1.5 text-[10px] font-semibold transition-all text-white hover:bg-wav-hover flex items-center justify-center gap-1.5 border-b border-wav-line-strong"
            title="Shuffle Gradient Type"
            aria-label="Shuffle Gradient Type"
          ><Shuffle weight="regular" className="w-4 h-4" /></button>
          {(() => {
            const COLS = 2;
            // One entry per family (its Mode switch lives below), one per gradient otherwise,
            // alphabetical by what's shown.
            const entries = FULL_GRADIENT_TYPES.reduce<{ key: string; label: string; types: GradientType[] }[]>((acc, type) => {
              const fam = familyOf(type);
              if (!fam) { acc.push({ key: type, label: getGradientDisplayName(type), types: [type] }); return acc; }
              if (!acc.some(e => e.key === fam.id)) acc.push({ key: fam.id, label: fam.label, types: fam.members.map(m => m.type) });
              return acc;
            }, []).sort((a, b) => a.label.localeCompare(b.label));
            const rows = Math.ceil(entries.length / COLS);
            return (
              <div className="grid grid-cols-2 gap-0" style={{ gridAutoFlow: 'column', gridTemplateRows: `repeat(${rows}, auto)` }}>
                {entries.map((entry, i) => {
                  const columnIndex = Math.floor(i / rows);
                  const isLastColumn = columnIndex === COLS - 1;
                  const active = entry.types.includes(gradientType);
                  const fam = GRADIENT_FAMILIES.find(f => f.id === entry.key);
                  return (
                    <button
                      key={entry.key}
                      onClick={() => setGradientType(fam ? (lastFamilyMember.current[fam.id] ?? fam.members[0].type) : entry.types[0])}
                      aria-pressed={active}
                      className={`wav-choice px-1 py-1.5 lg:py-1 text-[10px] capitalize transition-all whitespace-nowrap border-b border-wav-line-strong ${!isLastColumn ? 'border-r border-wav-line-strong' : ''} ${
                        active
                          ? 'bg-white text-black font-bold'
                          : 'text-white hover:bg-wav-hover'
                      }`}
                    >
                      {entry.label}
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Auto-rotate direction — shared across most gradient types
            (whichever ones animate gradientAngle on their own), so this
            sits above the per-type blocks rather than duplicated inside
            each one. Previously only reachable via the D key. */}
        <div className="w-full flex items-center justify-between px-1.5 py-1">
          <label className="text-[10px] text-white">Rotate Direction:</label>
          <div className="flex gap-1">
            {(['clockwise', 'counter'] as const).map((dir) => (
              <button
                key={dir}
                onClick={() => setRotationDirection(dir)}
                aria-pressed={rotationDirection === dir}
                title={dir === 'clockwise' ? 'Clockwise' : 'Counter-clockwise'}
                aria-label={dir === 'clockwise' ? 'Clockwise' : 'Counter-clockwise'}
                className={choice(rotationDirection === dir, 'flex items-center justify-center')}
              >
                {dir === 'clockwise' ? <ArrowClockwise weight="bold" className="w-3.5 h-3.5" /> : <ArrowCounterClockwise weight="bold" className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </div>

        {/* Gradient-specific Controls */}
        {/* Grid Controls */}
        {currentFamily && (
          <div className="w-full flex items-center justify-between gap-2 px-1.5 py-1">
            <label className="text-[10px] text-white">Mode:</label>
            <div className="flex flex-1 gap-1" role="group" aria-label={`${currentFamily.label} mode`}>
              {currentFamily.members.map(m => (
                <button
                  key={m.type}
                  onClick={() => setGradientType(m.type)}
                  aria-pressed={gradientType === m.type}
                  className={choice(gradientType === m.type, 'flex-1')}
                >{m.label}</button>
              ))}
            </div>
          </div>
        )}
        {/* Looks and palettes, one dropdown: this gradient's own Looks (a palette plus a few
            of its settings, constants/gradientLooks.ts) first, then a large library of
            colors-only palettes (constants/palettePresets.ts) that works with every gradient. */}
        <div className="w-full flex flex-col gap-1 px-1.5 py-1">
          <label className="text-[10px] text-wav-text-2 font-medium">Looks &amp; palettes</label>
          <div className="flex items-stretch gap-1">
            <div className="flex-1 min-w-0">
              <LooksMenu
                gradientName={getGradientDisplayName(gradientType)}
                looks={GRADIENT_LOOKS[gradientType] ?? []}
                gradientColors={gradientColors}
                onLook={applyGradientLook}
                onPalette={applyPalette}
              />
            </div>
            <button
              onClick={shuffleColors}
              title="Shuffle colors — a random palette from the library"
              aria-label="Shuffle colors"
              className="px-2.5 flex items-center justify-center text-white bg-wav-field hover:bg-wav-hover border border-wav-line transition-all"
            ><Shuffle weight="regular" className="w-4 h-4" /></button>
          </div>
        </div>
        {/* One Speed for every animated gradient. */}
        {(STYLE_FIELD_GRADIENT_TYPES.includes(gradientType) || ANIMATED_GRADIENTS.includes(gradientType)) && (
          <div className="w-full flex flex-col gap-2 px-1.5 py-1">
            <SliderRow label="Speed:" title="How fast the gradient animates. The [ and ] keys step it too." value={vcrPlaybackSpeed} onChange={setVcrPlaybackSpeed} min="0.1" max="4" step="0.1" />
          </div>
        )}
        {gradientType === 'grid' && (
          <div className="w-full flex flex-col gap-2 px-1.5 py-1 [&>*:last-child]:mb-0">
            {renderHardEdgeToggle(gridHardEdge, setGridHardEdge)}
            <SliderRow label="Rows:" value={gridRows} onChange={setGridRows} min="2" max="50" />
            <SliderRow label="Columns:" value={gridColumns} onChange={setGridColumns} min="2" max="50" />
            <SliderRow label="Cell Angle Step:" title="Rotation added per row/column — 30° gives the default herringbone look, 0° gives uniform bands, 90° gives a checkerboard-like alternation" value={gridCellAngleStep} onChange={setGridCellAngleStep} min="0" max="90" />
          </div>
        )}

        {/* Iridescent Controls */}

        {/* Stack Controls — identical hard-edged bars at regular intervals;
            orientation reuses the shared Angle control below. */}
        {gradientType === 'stack' && (
          <div className="w-full flex flex-col gap-2 px-1.5 py-1 [&>*:last-child]:mb-0">
            {[
              { label: 'Count', value: stackCount, set: setStackCount, min: 2, max: 40, step: 1 },
              { label: 'Gap', value: stackGap, set: setStackGap, min: 0, max: 0.8, step: 0.05 },
              { label: 'Width', value: stackWidth, set: setStackWidth, min: 0.1, max: 2, step: 0.05 },
              { label: 'Length', value: stackLength, set: setStackLength, min: 0.1, max: 2, step: 0.05 },
            ].map(({ label, value, set, min, max, step }, i, arr) => (
              <SliderRow key={label} label={`${label}:`} value={value} onChange={set} min={min} max={max} step={step} />
            ))}
          </div>
        )}

        {/* Hatch Controls — 1-4 layers of straight parallel lines, one
            direction per layer, evenly spread around the shared Angle
            control below. */}
        {gradientType === 'hatch' && (
          <div className="w-full flex flex-col gap-2 px-1.5 py-1 [&>*:last-child]:mb-0">
            {[
              { label: 'Layers', value: hatchLayers, set: setHatchLayers, min: 1, max: 4, step: 1 },
              { label: 'Spacing', value: hatchSpacing, set: setHatchSpacing, min: 3, max: 40, step: 1 },
            ].map(({ label, value, set, min, max, step }, i, arr) => (
              <SliderRow key={label} label={`${label}:`} value={value} onChange={set} min={min} max={max} step={step} />
            ))}
          </div>
        )}

        {/* Caustics Controls */}
        {gradientType === 'caustics' && (
          <div className="w-full flex flex-col gap-2 px-1.5 py-1 [&>*:last-child]:mb-0">
            {renderFieldMappingRows()}
            {[
              { label: 'Brightness', value: causticsBrightness, set: setCausticsBrightness, min: 0.5, max: 5, step: 0.1 },
              { label: 'Scale', value: causticsScale, causticsSpeed, set: setCausticsScale, min: 1, max: 12, step: 0.5 },
            ].map(({ label, value, set, min, max, step }, i, arr) => (
              <SliderRow key={label} label={`${label}:`} value={value} onChange={set} min={min} max={max} step={step} />
            ))}
          </div>
        )}

        {/* Lava Lamp Controls */}
        {gradientType === 'lava-lamp' && (
          <div className="w-full flex flex-col gap-2 px-1.5 py-1 [&>*:last-child]:mb-0">
            {[
              { label: 'Blobs', value: lavaBlobCount, set: setLavaBlobCount, min: 2, max: 12, step: 1 },
              { label: 'Blob Size', value: lavaBlobSize, set: setLavaBlobSize, min: 0.05, max: 0.4, step: 0.01 },
            ].map(({ label, value, set, min, max, step }, i, arr) => (
              <SliderRow key={label} label={`${label}:`} value={value} onChange={set} min={min} max={max} step={step} />
            ))}
          </div>
        )}

        {/* Styled-field gradients (Smoke, Glass, Mesh, ...) — one shared Scale/Speed pair */}
        {STYLE_FIELD_GRADIENT_TYPES.includes(gradientType) && (
          <div className="w-full flex flex-col gap-2 px-1.5 py-1 [&>*:last-child]:mb-0">
            {renderFieldMappingRows()}
            {[
              { label: 'Scale', value: fieldScale, set: setFieldScale, min: 0.3, max: 3, step: 0.05 },
              { label: 'Swirl', value: fieldSwirl, set: setFieldSwirl, min: 0, max: 2, step: 0.05, hint: 'Twists the pattern around the center, more toward the edges (the Mesh gradients and Tunnel ignore it)' },
              // Two extra sliders specific to the gradient (constants/styleShapeControls.ts).
              ...((STYLE_SHAPE_CONTROLS[gradientType] ?? []).map((c, i) => ({
                label: c.label, hint: c.hint,
                value: i === 0 ? fieldShapeA : fieldShapeB, set: i === 0 ? setFieldShapeA : setFieldShapeB,
                min: SHAPE_MIN, max: SHAPE_MAX, step: 0.05,
              }))),
            ].map(({ label, value, set, min, max, step, hint }: { label: string; value: number; set: (v: number) => void; min: number; max: number; step: number; hint?: string }, i) => (
              <SliderRow key={`${label}-${i}`} label={`${label}:`} title={hint} value={value} onChange={set} min={min} max={max} step={step} />
            ))}
          </div>
        )}

        {/* Marble Controls */}
        {gradientType === 'marble' && (
          <div className="w-full flex flex-col gap-2 px-1.5 py-1 [&>*:last-child]:mb-0">
            {renderFieldMappingRows()}
            {[
              { label: 'Vein Freq', value: marbleVeinFreq, set: setMarbleVeinFreq, min: 0.5, max: 10, step: 0.5 },
              { label: 'Turbulence', value: marbleTurbulence, set: setMarbleTurbulence, min: 0, max: 5, step: 0.1 },
              { label: 'Detail', value: marbleOctaves, marbleSpeed, set: setMarbleOctaves, min: 1, max: 8, step: 1 },
            ].map(({ label, value, set, min, max, step }, i, arr) => (
              <SliderRow key={label} label={`${label}:`} value={value} onChange={set} min={min} max={max} step={step} />
            ))}
          </div>
        )}

        {gradientType === 'metaballs' && (
          <div className="w-full flex flex-col gap-2 px-1.5 py-1 [&>*:last-child]:mb-0">
            {[
              { label: 'Count', value: metaballCount, set: setMetaballCount, min: 2, max: 14, step: 1 },
              { label: 'Size', value: metaballSize, set: setMetaballSize, min: 0.05, max: 0.4, step: 0.01 },
            ].map(({ label, value, set, min, max, step }, i, arr) => (
              <SliderRow key={label} label={`${label}:`} value={value} onChange={set} min={min} max={max} step={step} />
            ))}
          </div>
        )}

        {gradientType === 'truchet' && (
          <div className="w-full flex flex-col gap-2 px-1.5 py-1 [&>*:last-child]:mb-0">
            {[
              { label: 'Tile Size', value: truchetSize, set: setTruchetSize, min: 15, max: 100, step: 5 },
              { label: 'Variation', value: truchetVariation, set: setTruchetVariation, min: 0, max: 1, step: 0.05 },
              { label: 'Thickness', value: truchetThickness, truchetSpeed, set: setTruchetThickness, min: 1, max: 15, step: 1 },
            ].map(({ label, value, set, min, max, step }, i, arr) => (
              <SliderRow key={label} label={`${label}:`} value={value} onChange={set} min={min} max={max} step={step} />
            ))}
          </div>
        )}

        {gradientType === 'attractor' && (
          <div className="w-full flex flex-col gap-2 px-1.5 py-1 [&>*:last-child]:mb-0">
            {[
              { label: 'Points', value: attractorPointCount, set: setAttractorPointCount, min: 1, max: 20, step: 1 },
              { label: 'Scale', value: attractorScale, set: setAttractorScale, min: 0.3, max: 3, step: 0.1 },
              { label: 'Size', value: attractorDotSize, set: setAttractorDotSize, min: 0.5, max: 6, step: 0.1 },
              { label: 'Fade', value: attractorTrailFade, set: setAttractorTrailFade, min: 0.01, max: 0.3, step: 0.01 },
            ].map(({ label, value, set, min, max, step }, i, arr) => (
              <SliderRow key={label} label={`${label}:`} value={value} onChange={set} min={min} max={max} step={step} />
            ))}
          </div>
        )}

        {/* Particles Controls — 'flow-field' mode folds in the former
            standalone Flow Field gradient (noise-driven drifting particle
            trails) as an alternate mode, same precedent as Helix merging
            into Windmill. 'marks' is a Lee Ufan-inspired treatment: a
            handful of fixed marks that bloom on an audio onset and decay,
            instead of continuous drift or density. */}
        {gradientType === 'particles' && (
          <div className="w-full flex flex-col gap-2 px-1.5 py-1 [&>*:last-child]:mb-0">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-white">Mode:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <button
                  onClick={() => setParticlesMode('drift')}
                  aria-pressed={particlesMode === 'drift'}
                  className={choice(particlesMode === 'drift', 'flex-1')}
                >
                  Drift
                </button>
                <button
                  onClick={() => setParticlesMode('flow-field')}
                  aria-pressed={particlesMode === 'flow-field'}
                  className={choice(particlesMode === 'flow-field', 'flex-1')}
                >
                  Flow Field
                </button>
                <button
                  onClick={() => setParticlesMode('marks')}
                  aria-pressed={particlesMode === 'marks'}
                  className={choice(particlesMode === 'marks', 'flex-1')}
                >
                  Marks
                </button>
              </div>
            </div>
            {(particlesMode === 'flow-field'
              ? [
                  { label: 'Particles', value: flowParticleCount, set: setFlowParticleCount, min: 20, max: 800, step: 10 },
                  { label: 'Scale', value: flowScale, set: setFlowScale, min: 0.5, max: 10, step: 0.5 },
                  { label: 'Thickness', value: flowThickness, set: setFlowThickness, min: 0.5, max: 6, step: 0.5 },
                ]
              : particlesMode === 'marks'
              ? [
                  { label: 'Count', value: marksCount, set: setMarksCount, min: 1, max: 16, step: 1 },
                  { label: 'Size', value: marksSize, set: setMarksSize, min: 10, max: 80, step: 5 },
                  { label: 'Decay', value: marksDecay, set: setMarksDecay, min: 0.5, max: 0.99, step: 0.01 },
                ]
              : [
                  { label: 'Count', value: particlesCount, set: setParticlesCount, min: 10, max: 500, step: 10 },
                  { label: 'Size', value: particlesSize, set: setParticlesSize, min: 0.5, max: 10, step: 0.5 },
                  { label: 'Sides', value: particlesSides, set: setParticlesSides, min: 1, max: 8, step: 1 },
                  { label: 'Trail', value: particlesTrail, set: setParticlesTrail, min: 0.02, max: 0.5, step: 0.01 },
                  { label: 'Gravity', value: particlesGravity, set: setParticlesGravity, min: 0, max: 3, step: 0.1 },
                ]
            ).map(({ label, value, set, min, max, step }, i, arr) => (
              <SliderRow key={label} label={`${label}:`} value={value} onChange={set} min={min} max={max} step={step} />
            ))}
          </div>
        )}

        {gradientType === 'tiling' && (
          <div className="w-full flex flex-col gap-2 px-1.5 py-1 [&>*:last-child]:mb-0">
            {[
              { label: 'Tile Size', value: tilingSize, set: setTilingSize, min: 30, max: 300, step: 10 },
              { label: 'Symmetry', value: tilingSymmetry, set: setTilingSymmetry, min: 2, max: 12, step: 1 },
              { label: 'Complexity', value: tilingComplexity, set: setTilingComplexity, min: 0.5, max: 10, step: 0.5 },
              { label: 'Rotation', value: tilingRotation, set: setTilingRotation, min: 0, max: 360, step: 1 },
            ].map(({ label, value, set, min, max, step }, i, arr) => (
              <SliderRow key={label} label={`${label}:`} value={value} onChange={set} min={min} max={max} step={step} />
            ))}
            <SliderRow label="Row Offset:" title="Shifts every other tile row horizontally, like a brick or polka-dot pattern" value={tilingRowOffset} onChange={setTilingRowOffset} min={-tilingSize} max={tilingSize} />
          </div>
        )}

        {gradientType === 'fireworks' && (
          <div className="w-full flex flex-col gap-2 px-1.5 py-1 [&>*:last-child]:mb-0">
            {[
              { label: 'Rocket Slots', value: fireworksCount, set: setFireworksCount, min: 1, max: 30, step: 1 },
              { label: 'Particles', value: fireworksParticleCount, set: setFireworksParticleCount, min: 8, max: 400, step: 1 },
              { label: 'Trail Fade', value: fireworksTrailFade, set: setFireworksTrailFade, min: 0.02, max: 0.5, step: 0.01 },
            ].map(({ label, value, set, min, max, step }) => (
              <SliderRow key={label} label={`${label}:`} value={value} onChange={set} min={min} max={max} step={step} />
            ))}
          </div>
        )}

        {gradientType === 'lightning' && (
          <div className="w-full flex flex-col gap-2 px-1.5 py-1 [&>*:last-child]:mb-0">
            {[
              { label: 'Bolt Slots', value: lightningBoltCount, set: setLightningBoltCount, min: 1, max: 8, step: 1 },
              { label: 'Jitter', value: lightningJitter, set: setLightningJitter, min: 0.1, max: 1, step: 0.05 },
              { label: 'Branching', value: lightningBranchiness, set: setLightningBranchiness, min: 0, max: 0.85, step: 0.05 },
            ].map(({ label, value, set, min, max, step }) => (
              <SliderRow key={label} label={`${label}:`} value={value} onChange={set} min={min} max={max} step={step} />
            ))}
          </div>
        )}

        {gradientType === 'reaction-diffusion' && (
          <div className="w-full flex flex-col gap-2 px-1.5 py-1 [&>*:last-child]:mb-0">
            {renderFieldMappingRows()}
            {[
              { label: 'Feed Rate', value: reactionDiffusionFeed, set: setReactionDiffusionFeed, min: 0.02, max: 0.08, step: 0.001 },
              { label: 'Kill Rate', value: reactionDiffusionKill, set: setReactionDiffusionKill, min: 0.04, max: 0.07, step: 0.001 },
            ].map(({ label, value, set, min, max, step }, i, arr) => (
              <SliderRow key={label} label={`${label}:`} value={value} onChange={set} min={min} max={max} step={step} />
            ))}
          </div>
        )}

        {gradientType === 'topographic' && (
          <div className="w-full flex flex-col gap-2 px-1.5 py-1 [&>*:last-child]:mb-0">
            {renderFieldMappingRows()}
            {[
              { label: 'Scale', value: topographicScale, set: setTopographicScale, min: 10, max: 100, step: 1 },
              { label: 'Bands', value: topographicBands, set: setTopographicBands, min: 3, max: 30, step: 1 },
              { label: 'Line Width', value: topographicLineWidth, set: setTopographicLineWidth, min: 0.01, max: 0.15, step: 0.005 },
            ].map(({ label, value, set, min, max, step }, i, arr) => (
              <SliderRow key={label} label={`${label}:`} value={value} onChange={set} min={min} max={max} step={step} />
            ))}
          </div>
        )}



        {gradientType === 'julia' && (
          <div className="w-full flex flex-col gap-2 px-1.5 py-1 [&>*:last-child]:mb-0">
            {renderFieldMappingRows()}
            {[
              { label: 'Real (c)', value: juliaReal, set: setJuliaReal, min: -1, max: 1, step: 0.01 },
              { label: 'Imag (c)', value: juliaImaginary, set: setJuliaImaginary, min: -1, max: 1, step: 0.01 },
              { label: 'Zoom', value: juliaZoom, set: setJuliaZoom, min: 0.3, max: 3, step: 0.1 },
              { label: 'Detail', value: juliaIterations, juliaSpeed, set: setJuliaIterations, min: 20, max: 120, step: 5 },
            ].map(({ label, value, set, min, max, step }, i, arr) => (
              <SliderRow key={label} label={`${label}:`} value={value} onChange={set} min={min} max={max} step={step} />
            ))}
          </div>
        )}

        {/* Angle Gradient Controls */}
        {gradientType === 'angle' && (
          <div className="w-full flex flex-col gap-2 px-1.5 py-1 [&>*:last-child]:mb-0">
            {renderHardEdgeToggle(angleHardEdge, setAngleHardEdge)}
            <PointPad label="Center" x={angleCenterX} y={angleCenterY} onChange={(x, y) => { setAngleCenterX(x); setAngleCenterY(y); }} />
          </div>
        )}
        
        {/* Shapes Controls — 'polar-grid' mode folds in the former standalone
            Polar Grid gradient (angular sector rings) as an alternate mode,
            same precedent as Helix merging into Windmill. */}
        {gradientType === 'shapes' && (
          <div className="w-full flex flex-col gap-2 px-1.5 py-1 [&>*:last-child]:mb-0">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-white">Mode:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <button
                  onClick={() => setShapesMode('polygon')}
                  aria-pressed={shapesMode === 'polygon'}
                  className={choice(shapesMode === 'polygon', 'flex-1')}
                >
                  Polygon
                </button>
                <button
                  onClick={() => setShapesMode('polar-grid')}
                  aria-pressed={shapesMode === 'polar-grid'}
                  className={choice(shapesMode === 'polar-grid', 'flex-1')}
                >
                  Polar Grid
                </button>
              </div>
            </div>
            {shapesMode === 'polygon' ? (
              <>
                <SliderRow label="Scale:" value={concentricRingWidth} onChange={setConcentricRingWidth} min="10" max="300" />
                <SliderRow label="Sides:" value={shapesSides} onChange={setShapesSides} min="1" max="10" />
                <SliderRow label="Count:" value={shapesCount} onChange={setShapesCount} min="1" max="50" />
              </>
            ) : (
              <>
                <SliderRow label="Radials:" value={polygon2Sides} onChange={setPolygon2Sides} min="1" max="24" />
                <SliderRow label="Ring Count:" value={concentricRingCount} onChange={setConcentricRingCount} min="1" max="30" />
              </>
            )}
          </div>
        )}

        {/* Spiral Controls — 'helix' mode folds in the former standalone
            Helix gradient (continuous conical spiral) as an alternate mode,
            same precedent as Radar merging into Radial Burst. */}
        {gradientType === 'windmill' && (
          <div className="w-full flex flex-col gap-2 px-1.5 py-1 [&>*:last-child]:mb-0">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-white">Mode:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <button
                  onClick={() => setWindmillMode('blades')}
                  aria-pressed={windmillMode === 'blades'}
                  className={choice(windmillMode === 'blades', 'flex-1')}
                >
                  Blades
                </button>
                <button
                  onClick={() => setWindmillMode('helix')}
                  aria-pressed={windmillMode === 'helix'}
                  className={choice(windmillMode === 'helix', 'flex-1')}
                >
                  Helix
                </button>
              </div>
            </div>
            {windmillMode === 'blades' ? (
              <>
                <SliderRow label="Rotations:" value={windmillRotations} onChange={setWindmillRotations} min="1" max="10" />
                <SliderRow label="Tightness:" value={windmillTightness} onChange={setWindmillTightness} min="1" max="20" />
                <SliderRow label="Thickness:" value={windmillThickness} onChange={setWindmillThickness} min="5" max="100" />
                <SliderRow label="Zoom Response:" title="How strongly the global zoom control (audio-reactive pulsing) affects the spiral's rotation count — 0 ignores zoom entirely, 1 responds as strongly as other gradients" value={windmillZoomResponse} onChange={setWindmillZoomResponse} min="0" max="1" step="0.05" />
              </>
            ) : (
              <>
                <SliderRow label="Turns:" value={helixTurns} onChange={setHelixTurns} min="1" max="20" />
                <SliderRow label="Tightness:" value={helixTightness} onChange={setHelixTightness} min="0.1" max="2" step="0.1" />
              </>
            )}
          </div>
        )}

        {/* Noise Controls */}
        {gradientType === 'noise' && (
          <div className="w-full flex flex-col gap-2 px-1.5 py-1 [&>*:last-child]:mb-0">
            <div className="flex items-center gap-1">
              <label className="text-[10px] text-white whitespace-nowrap">Type:</label>
              <div className="flex gap-1 flex-1">
                {(['smooth', 'ridged'] as const).map(t => (
                  <button key={t} onClick={() => setNoiseType(t)} aria-pressed={noiseType === t} className={choice(noiseType === t, 'flex-1 capitalize')}>{t}</button>
                ))}
              </div>
            </div>
            <SliderRow label="Scale:" value={noiseScale} onChange={setNoiseScale} min="10" max="200" />
            <SliderRow label="Detail:" value={noiseOctaves} onChange={setNoiseOctaves} min="1" max="8" />
            <SliderRow label="Direction:" value={noiseDirection} onChange={setNoiseDirection} min="0" max="360" />
            <SliderRow label="Warp:" value={noiseWarp} onChange={setNoiseWarp} min="0" max="1" step="0.01" />
          </div>
        )}

        
        {/* Radial Controls */}
        {gradientType === 'radial' && (
          <div className="w-full flex flex-col gap-2 px-1.5 py-1 [&>*:last-child]:mb-0">
            {renderHardEdgeToggle(radialHardEdge, setRadialHardEdge)}
            <PointPad label="Center" x={angleCenterX} y={angleCenterY} onChange={(x, y) => { setAngleCenterX(x); setAngleCenterY(y); }} />
            <SliderRow label="Scale:" value={radialSizeScale} onChange={setRadialSizeScale} min="0.25" max="4" step="0.05" />
          </div>
        )}

        {/* Radial Burst Controls */}
        {gradientType === 'radial-burst' && (
          <div className="w-full flex flex-col gap-2 px-1.5 py-1 [&>*:last-child]:mb-0">
            <SliderRow label="Burst Count:" value={radialBurstCount} onChange={setRadialBurstCount} min="3" max="16" />
            <SliderRow label="Spread:" value={radialBurstSpread} onChange={setRadialBurstSpread} min="10" max="100" />
            <SliderRow label="Size:" value={radialBurstSize} onChange={setRadialBurstSize} min="10" max="200" />
          </div>
        )}

        {/* Voronoi Controls */}
        {gradientType === 'voronoi' && (
          <div className="w-full flex flex-col gap-2 px-1.5 py-1 [&>*:last-child]:mb-0">
            <SliderRow label="Cell Count:" value={voronoiCellCount} onChange={setVoronoiCellCount} min="3" max="30" />
            <SliderRow label="Distortion:" value={voronoiDistortion} onChange={setVoronoiDistortion} min="0" max="100" />
          </div>
        )}

        {/* Flower Controls */}
        {gradientType === 'flower' && (
          <div className="w-full flex flex-col gap-2 px-1.5 py-1 [&>*:last-child]:mb-0">
            <SliderRow label="Circles:" value={flowerCircles} onChange={setFlowerCircles} min="1" max="12" />
            <SliderRow label="Scale:" value={flowerScale} onChange={setFlowerScale} min="0.1" max="3" step="0.1" />
            <SliderRow label="Spread:" value={flowerSpread} onChange={setFlowerSpread} min="0.3" max="2.5" step="0.05" />
            <SliderRow label="Symmetry:" title="Circles per layer — 6 gives the default hexagonal pattern, 4/8/12 give square/octagonal/dodecagonal lattices" value={flowerSymmetry} onChange={setFlowerSymmetry} min="3" max="12" step="1" />
            <SliderRow label="Opacity:" value={flowerOpacity} onChange={setFlowerOpacity} min="0.2" max="1.5" step="0.05" />
          </div>
        )}


    </>
  );
};

export const GradientsTab = React.memo(GradientsTabInner);
