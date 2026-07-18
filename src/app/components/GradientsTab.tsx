import React, { useState, useCallback, useRef } from 'react';
import { Shuffle } from '@phosphor-icons/react';
import { type GradientType, FULL_GRADIENT_TYPES } from '../constants/gradientEffects';
import type { ColorPin } from './InteractiveGradient';

export interface GradientsTabProps {
  gradientType: GradientType;
  setGradientType: (t: GradientType) => void;
  getGradientDisplayName: (t: GradientType) => string;
  seedableGradientTypes: string[];
  onReroll: () => void;

  // Freeform pins
  colorPins: ColorPin[];
  setColorPins: (updater: ColorPin[] | ((prev: ColorPin[]) => ColorPin[])) => void;
  selectedPinId: string | null;
  setSelectedPinId: (id: string | null) => void;

  // Grid
  gridRows: number; setGridRows: (v: number) => void;
  gridColumns: number; setGridColumns: (v: number) => void;

  // Polar Grid
  polygon2Sides: number; setPolygon2Sides: (v: number) => void;
  concentricRingCount: number; setConcentricRingCount: (v: number) => void;

  // Iridescent
  iridescentIntensity: number; setIridescentIntensity: (v: number) => void;
  iridescentScale: number; setIridescentScale: (v: number) => void;

  // Aurora
  auroraBandCount: number; setAuroraBandCount: (v: number) => void;
  auroraBandHeight: number; setAuroraBandHeight: (v: number) => void;
  auroraWaveSpeed: number; setAuroraWaveSpeed: (v: number) => void;

  // Caustics
  causticsBrightness: number; setCausticsBrightness: (v: number) => void;
  causticsScale: number; setCausticsScale: (v: number) => void;

  // Lava Lamp
  lavaBlobCount: number; setLavaBlobCount: (v: number) => void;
  lavaBlobSize: number; setLavaBlobSize: (v: number) => void;

  // Marble
  marbleVeinFreq: number; setMarbleVeinFreq: (v: number) => void;
  marbleTurbulence: number; setMarbleTurbulence: (v: number) => void;
  marbleOctaves: number; setMarbleOctaves: (v: number) => void;

  // Metaballs
  metaballCount: number; setMetaballCount: (v: number) => void;
  metaballSize: number; setMetaballSize: (v: number) => void;
  metaballSpeed: number; setMetaballSpeed: (v: number) => void;

  // Truchet
  truchetSize: number; setTruchetSize: (v: number) => void;
  truchetVariation: number; setTruchetVariation: (v: number) => void;
  truchetThickness: number; setTruchetThickness: (v: number) => void;

  // Moire
  moireScale: number; setMoireScale: (v: number) => void;
  moireOffset: number; setMoireOffset: (v: number) => void;
  moireSpeed: number; setMoireSpeed: (v: number) => void;

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

  // Reaction-Diffusion
  reactionDiffusionFeed: number; setReactionDiffusionFeed: (v: number) => void;
  reactionDiffusionKill: number; setReactionDiffusionKill: (v: number) => void;
  reactionDiffusionSpeed: number; setReactionDiffusionSpeed: (v: number) => void;

  // Shared field mapping (Reaction-Diffusion, Marble, Caustics, Topographic, Julia, Plasma)
  fieldContrast: number; setFieldContrast: (v: number) => void;
  paletteMode: 'linear' | 'banded' | 'cyclic'; setPaletteMode: (v: 'linear' | 'banded' | 'cyclic') => void;
  paletteBands: number; setPaletteBands: (v: number) => void;

  // Topographic
  topographicScale: number; setTopographicScale: (v: number) => void;
  topographicBands: number; setTopographicBands: (v: number) => void;
  topographicLineWidth: number; setTopographicLineWidth: (v: number) => void;

  // Julia Set
  juliaReal: number; setJuliaReal: (v: number) => void;
  juliaImaginary: number; setJuliaImaginary: (v: number) => void;
  juliaZoom: number; setJuliaZoom: (v: number) => void;
  juliaIterations: number; setJuliaIterations: (v: number) => void;

  // Angle / Radial
  angleStartOffset: number; setAngleStartOffset: (v: number) => void;
  angleCenterX: number; setAngleCenterX: (v: number) => void;
  angleCenterY: number; setAngleCenterY: (v: number) => void;
  radialSizeScale: number; setRadialSizeScale: (v: number) => void;

  // Shapes
  concentricRingWidth: number; setConcentricRingWidth: (v: number) => void;
  shapesSides: number; setShapesSides: (v: number) => void;
  shapesCount: number; setShapesCount: (v: number) => void;

  // Windmill (spiral)
  windmillTightness: number; setWindmillTightness: (v: number) => void;
  windmillRotations: number; setWindmillRotations: (v: number) => void;
  windmillThickness: number; setWindmillThickness: (v: number) => void;

  // Waves
  waveAmplitude: number; setWaveAmplitude: (v: number) => void;
  waveFrequency: number; setWaveFrequency: (v: number) => void;
  waveNumber: number; setWaveNumber: (v: number) => void;
  waveNumberRef: React.MutableRefObject<number>;
  waveRotation: number; setWaveRotation: (v: number) => void;
  waveRotationRef: React.MutableRefObject<number>;
  drawParamsDirtyRef: React.MutableRefObject<boolean>;

  // Mesh
  meshGridSize: number; setMeshGridSize: (v: number) => void;
  meshJitter: number; setMeshJitter: (v: number) => void;

  // Noise
  noiseScale: number; setNoiseScale: (v: number) => void;
  noiseOctaves: number; setNoiseOctaves: (v: number) => void;
  noiseDirection: number; setNoiseDirection: (v: number) => void;
  noiseWarp: number; setNoiseWarp: (v: number) => void;
  noiseType: 'smooth' | 'ridged'; setNoiseType: (t: 'smooth' | 'ridged') => void;

  // Plasma
  plasmaComplexity: number; setPlasmaComplexity: (v: number) => void;
  plasmaZoomScale: number; setPlasmaZoomScale: (v: number) => void;

  // Radial Burst
  radialBurstCount: number; setRadialBurstCount: (v: number) => void;
  radialBurstSpread: number; setRadialBurstSpread: (v: number) => void;
  radialBurstSize: number; setRadialBurstSize: (v: number) => void;

  // Voronoi
  voronoiCellCount: number; setVoronoiCellCount: (v: number) => void;
  voronoiDistortion: number; setVoronoiDistortion: (v: number) => void;

  // Fade
  fadeDirection: number; setFadeDirection: (v: number) => void;

  // Radar
  radarFadeLength: number; setRadarFadeLength: (v: number) => void;
  radarBeamWidth: number; setRadarBeamWidth: (v: number) => void;

  // Flower
  flowerCircles: number; setFlowerCircles: (v: number) => void;
  flowerScale: number; setFlowerScale: (v: number) => void;
  flowerSpread: number; setFlowerSpread: (v: number) => void;

  // Helix (conical spiral)
  helixTurns: number; setHelixTurns: (v: number) => void;
  helixTightness: number; setHelixTightness: (v: number) => void;
}

const GradientsTabInner: React.FC<GradientsTabProps> = (props) => {
  const {
    gradientType, setGradientType, getGradientDisplayName, seedableGradientTypes, onReroll,
    colorPins, setColorPins, selectedPinId, setSelectedPinId,
    gridRows, setGridRows, gridColumns, setGridColumns,
    polygon2Sides, setPolygon2Sides, concentricRingCount, setConcentricRingCount,
    iridescentIntensity, setIridescentIntensity, iridescentScale, setIridescentScale,
    auroraBandCount, setAuroraBandCount, auroraBandHeight, setAuroraBandHeight, auroraWaveSpeed, setAuroraWaveSpeed,
    causticsBrightness, setCausticsBrightness, causticsScale, setCausticsScale,
    lavaBlobCount, setLavaBlobCount, lavaBlobSize, setLavaBlobSize,
    marbleVeinFreq, setMarbleVeinFreq, marbleTurbulence, setMarbleTurbulence, marbleOctaves, setMarbleOctaves,
    metaballCount, setMetaballCount, metaballSize, setMetaballSize, metaballSpeed, setMetaballSpeed,
    truchetSize, setTruchetSize, truchetVariation, setTruchetVariation, truchetThickness, setTruchetThickness,
    moireScale, setMoireScale, moireOffset, setMoireOffset, moireSpeed, setMoireSpeed,
    flowParticleCount, setFlowParticleCount, flowSpeed, setFlowSpeed, flowScale, setFlowScale, flowThickness, setFlowThickness,
    attractorPointCount, setAttractorPointCount, attractorSpeed, setAttractorSpeed, attractorScale, setAttractorScale, attractorDotSize, setAttractorDotSize,
    attractorTrailFade, setAttractorTrailFade,
    reactionDiffusionFeed, setReactionDiffusionFeed, reactionDiffusionKill, setReactionDiffusionKill, reactionDiffusionSpeed, setReactionDiffusionSpeed,
    fieldContrast, setFieldContrast, paletteMode, setPaletteMode, paletteBands, setPaletteBands,
    topographicScale, setTopographicScale, topographicBands, setTopographicBands, topographicLineWidth, setTopographicLineWidth,
    juliaReal, setJuliaReal, juliaImaginary, setJuliaImaginary, juliaZoom, setJuliaZoom, juliaIterations, setJuliaIterations,
    angleStartOffset, setAngleStartOffset, angleCenterX, setAngleCenterX, angleCenterY, setAngleCenterY, radialSizeScale, setRadialSizeScale,
    concentricRingWidth, setConcentricRingWidth, shapesSides, setShapesSides, shapesCount, setShapesCount,
    windmillTightness, setWindmillTightness, windmillRotations, setWindmillRotations, windmillThickness, setWindmillThickness,
    waveAmplitude, setWaveAmplitude, waveFrequency, setWaveFrequency,
    waveNumber, setWaveNumber, waveNumberRef, waveRotation, setWaveRotation, waveRotationRef, drawParamsDirtyRef,
    meshGridSize, setMeshGridSize, meshJitter, setMeshJitter,
    noiseScale, setNoiseScale, noiseOctaves, setNoiseOctaves, noiseDirection, setNoiseDirection, noiseWarp, setNoiseWarp, noiseType, setNoiseType,
    plasmaComplexity, setPlasmaComplexity, plasmaZoomScale, setPlasmaZoomScale,
    radialBurstCount, setRadialBurstCount, radialBurstSpread, setRadialBurstSpread, radialBurstSize, setRadialBurstSize,
    voronoiCellCount, setVoronoiCellCount, voronoiDistortion, setVoronoiDistortion,
    fadeDirection, setFadeDirection,
    radarFadeLength, setRadarFadeLength, radarBeamWidth, setRadarBeamWidth,
    flowerCircles, setFlowerCircles, flowerScale, setFlowerScale, flowerSpread, setFlowerSpread,
    helixTurns, setHelixTurns, helixTightness, setHelixTightness,
  } = props;

  const [rerolled, setRerolled] = useState(false);
  const rerolledTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleRerollClick = useCallback(() => {
    onReroll();
    setRerolled(true);
    if (rerolledTimeoutRef.current) clearTimeout(rerolledTimeoutRef.current);
    rerolledTimeoutRef.current = setTimeout(() => setRerolled(false), 500);
  }, [onReroll]);

  return (
    <>

        {/* Gradient Type Buttons - one rounded rectangle, 2 columns, thin dividing lines */}
        <div className="w-full">
          <div className="grid grid-cols-2 gap-0 rounded-lg overflow-hidden border border-white/10 bg-black/25" style={{ gridAutoFlow: 'column', gridTemplateRows: `repeat(${Math.ceil(FULL_GRADIENT_TYPES.length / 2)}, auto)` }}>
            {FULL_GRADIENT_TYPES.map((type, i) => {
              const rows = Math.ceil(FULL_GRADIENT_TYPES.length / 2);
              const isLastInColumn = i % rows === rows - 1;
              const isLeftColumn = i < rows;
              return (
                <button
                  key={type}
                  onClick={() => setGradientType(type)}
                  className={`px-1 py-0.5 text-[10px] capitalize transition-all whitespace-nowrap ${isLeftColumn ? 'border-r border-white/10' : ''} ${!isLastInColumn ? 'border-b border-white/10' : ''} ${
                    gradientType === type
                      ? 'bg-white text-black'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  {getGradientDisplayName(type)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Reroll — only for gradients with a structural seed to vary (see
            SEEDABLE_GRADIENT_TYPES in InteractiveGradient.tsx for why this
            list is what it is). Distinct from the whole-panel WAV/Shuffle
            randomizer: this only rerolls the current gradient's structure. */}
        {seedableGradientTypes.includes(gradientType) && (
          <button
            onClick={handleRerollClick}
            className="w-full py-1.5 text-[10px] font-semibold text-white bg-black/25 hover:bg-white/15 rounded-lg transition-all flex items-center justify-center gap-1.5"
            title="Reroll this gradient's structure"
          >
            <Shuffle weight="regular" className="w-3.5 h-3.5" />
            {rerolled ? 'Rerolled!' : 'Reroll'}
          </button>
        )}

        {/* Gradient-specific Controls */}
        {/* Grid Controls */}
        {gradientType === 'grid' && (
          <div className="w-full p-2 bg-black/25 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-white">Rows:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
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
                  className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-white">Columns:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
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
                  className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Freeform Controls */}
        {gradientType === 'freeform' && (
          <div className="w-full p-2 bg-black/25 rounded-lg">
            <div className="flex flex-col gap-1">
              <button
                onClick={(e) => {
                  // Add a new pin at center with random color
                  const newPin: ColorPin = {
                    id: Date.now().toString(),
                    x: 0.5 + (Math.random() - 0.5) * 0.3,
                    y: 0.5 + (Math.random() - 0.5) * 0.3,
                    color: {
                      r: Math.floor(Math.random() * 255),
                      g: Math.floor(Math.random() * 255),
                      b: Math.floor(Math.random() * 255),
                    },
                    radius: 300,
                  };
                  setColorPins(prev => [...prev, newPin]);
                  setSelectedPinId(newPin.id);
                }}
                className="px-2 py-1 rounded text-xs bg-white/20 text-white hover:bg-white/30 transition-all"
              >
                + Add Pin
              </button>
              
              {selectedPinId && (
                <>
                  <button
                    onClick={() => {
                      setColorPins(prev => prev.filter(p => p.id !== selectedPinId));
                      setSelectedPinId(null);
                    }}
                    className="px-2 py-1 rounded text-xs bg-red-500/50 text-white hover:bg-red-500/70 transition-all"
                  >
                    Delete Selected
                  </button>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-white">Radius:</label>
                    <div className="flex items-center gap-1 flex-1 ml-2">
                      <input
                        type="range"
                        min="100"
                        max="800"
                        value={colorPins.find(p => p.id === selectedPinId)?.radius || 300}
                        onChange={(e) => {
                          const newRadius = Number(e.target.value);
                          setColorPins(prev => prev.map(p =>
                            p.id === selectedPinId ? { ...p, radius: newRadius } : p
                          ));
                        }}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="100"
                        max="800"
                        value={colorPins.find(p => p.id === selectedPinId)?.radius || 300}
                        onChange={(e) => {
                          const newRadius = Number(e.target.value);
                          setColorPins(prev => prev.map(p =>
                            p.id === selectedPinId ? { ...p, radius: newRadius } : p
                          ));
                        }}
                        className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-white">Color:</label>
                    <input
                      type="color"
                      value={(() => {
                        const pin = colorPins.find(p => p.id === selectedPinId);
                        if (!pin) return '#000000';
                        const r = pin.color.r.toString(16).padStart(2, '0');
                        const g = pin.color.g.toString(16).padStart(2, '0');
                        const b = pin.color.b.toString(16).padStart(2, '0');
                        return `#${r}${g}${b}`;
                      })()}
                      onChange={(e) => {
                        const hex = e.target.value;
                        const r = parseInt(hex.slice(1, 3), 16);
                        const g = parseInt(hex.slice(3, 5), 16);
                        const b = parseInt(hex.slice(5, 7), 16);
                        setColorPins(prev => prev.map(p => 
                          p.id === selectedPinId ? { ...p, color: { r, g, b } } : p
                        ));
                      }}
                      className="ml-2 w-12 h-8 rounded cursor-pointer"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Polar Grid Controls */}
        {gradientType === 'polar-grid' && (
          <div className="w-full p-2 bg-black/25 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-white">Radials:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="1"
                  max="24"
                  value={polygon2Sides}
                  onChange={(e) => setPolygon2Sides(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={polygon2Sides}
                  onChange={(e) => setPolygon2Sides(Number(e.target.value))}
                  className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-white">Ring Count:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={concentricRingCount}
                  onChange={(e) => setConcentricRingCount(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={concentricRingCount}
                  onChange={(e) => setConcentricRingCount(Number(e.target.value))}
                  className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Iridescent Controls */}
        {gradientType === 'iridescent' && (
          <div className="w-full p-2 bg-black/25 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-white">Intensity:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="0.1"
                  max="2"
                  step="0.1"
                  value={iridescentIntensity}
                  onChange={(e) => setIridescentIntensity(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="0.1"
                  max="2"
                  step="0.1"
                  value={iridescentIntensity}
                  onChange={(e) => setIridescentIntensity(Number(e.target.value))}
                  className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-white">Scale:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={iridescentScale}
                  onChange={(e) => setIridescentScale(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={iridescentScale}
                  onChange={(e) => setIridescentScale(Number(e.target.value))}
                  className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Aurora Controls */}
        {gradientType === 'aurora' && (
          <div className="w-full p-2 bg-black/25 rounded-lg">
            {[
              { label: 'Bands', value: auroraBandCount, set: setAuroraBandCount, min: 2, max: 12, step: 1 },
              { label: 'Band Height', value: auroraBandHeight, set: setAuroraBandHeight, min: 0.5, max: 4, step: 0.1 },
              { label: 'Speed', value: auroraWaveSpeed, set: setAuroraWaveSpeed, min: 0.1, max: 3, step: 0.1 },
            ].map(({ label, value, set, min, max, step }, i, arr) => (
              <div key={label} className={`flex items-center justify-between ${i < arr.length - 1 ? 'mb-2' : ''}`}>
                <label className="text-[10px] text-white w-20 shrink-0">{label}:</label>
                <div className="flex items-center gap-1 flex-1 ml-2">
                  <input type="range" min={min} max={max} step={step} value={value} onChange={e => set(Number(e.target.value))} className="flex-1" />
                  <input type="number" min={min} max={max} step={step} value={value} onChange={e => set(Number(e.target.value))} className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Caustics Controls */}
        {gradientType === 'caustics' && (
          <div className="w-full p-2 bg-black/25 rounded-lg">
            {[
              { label: 'Brightness', value: causticsBrightness, set: setCausticsBrightness, min: 0.5, max: 5, step: 0.1 },
              { label: 'Scale', value: causticsScale, set: setCausticsScale, min: 1, max: 12, step: 0.5 },
            ].map(({ label, value, set, min, max, step }, i, arr) => (
              <div key={label} className={`flex items-center justify-between ${i < arr.length - 1 ? 'mb-2' : ''}`}>
                <label className="text-[10px] text-white w-20 shrink-0">{label}:</label>
                <div className="flex items-center gap-1 flex-1 ml-2">
                  <input type="range" min={min} max={max} step={step} value={value} onChange={e => set(Number(e.target.value))} className="flex-1" />
                  <input type="number" min={min} max={max} step={step} value={value} onChange={e => set(Number(e.target.value))} className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lava Lamp Controls */}
        {gradientType === 'lava-lamp' && (
          <div className="w-full p-2 bg-black/25 rounded-lg">
            {[
              { label: 'Blobs', value: lavaBlobCount, set: setLavaBlobCount, min: 2, max: 12, step: 1 },
              { label: 'Blob Size', value: lavaBlobSize, set: setLavaBlobSize, min: 0.05, max: 0.4, step: 0.01 },
            ].map(({ label, value, set, min, max, step }, i, arr) => (
              <div key={label} className={`flex items-center justify-between ${i < arr.length - 1 ? 'mb-2' : ''}`}>
                <label className="text-[10px] text-white w-20 shrink-0">{label}:</label>
                <div className="flex items-center gap-1 flex-1 ml-2">
                  <input type="range" min={min} max={max} step={step} value={value} onChange={e => set(Number(e.target.value))} className="flex-1" />
                  <input type="number" min={min} max={max} step={step} value={value} onChange={e => set(Number(e.target.value))} className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Marble Controls */}
        {gradientType === 'marble' && (
          <div className="w-full p-2 bg-black/25 rounded-lg">
            {[
              { label: 'Vein Freq', value: marbleVeinFreq, set: setMarbleVeinFreq, min: 0.5, max: 10, step: 0.5 },
              { label: 'Turbulence', value: marbleTurbulence, set: setMarbleTurbulence, min: 0, max: 5, step: 0.1 },
              { label: 'Detail', value: marbleOctaves, set: setMarbleOctaves, min: 1, max: 8, step: 1 },
            ].map(({ label, value, set, min, max, step }, i, arr) => (
              <div key={label} className={`flex items-center justify-between ${i < arr.length - 1 ? 'mb-2' : ''}`}>
                <label className="text-[10px] text-white w-20 shrink-0">{label}:</label>
                <div className="flex items-center gap-1 flex-1 ml-2">
                  <input type="range" min={min} max={max} step={step} value={value} onChange={e => set(Number(e.target.value))} className="flex-1" />
                  <input type="number" min={min} max={max} step={step} value={value} onChange={e => set(Number(e.target.value))} className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1" />
                </div>
              </div>
            ))}
          </div>
        )}

        {gradientType === 'metaballs' && (
          <div className="w-full p-2 bg-black/25 rounded-lg">
            {[
              { label: 'Count', value: metaballCount, set: setMetaballCount, min: 2, max: 14, step: 1 },
              { label: 'Size', value: metaballSize, set: setMetaballSize, min: 0.05, max: 0.4, step: 0.01 },
              { label: 'Speed', value: metaballSpeed, set: setMetaballSpeed, min: 0.1, max: 5, step: 0.1 },
            ].map(({ label, value, set, min, max, step }, i, arr) => (
              <div key={label} className={`flex items-center justify-between ${i < arr.length - 1 ? 'mb-2' : ''}`}>
                <label className="text-[10px] text-white w-20 shrink-0">{label}:</label>
                <div className="flex items-center gap-1 flex-1 ml-2">
                  <input type="range" min={min} max={max} step={step} value={value} onChange={e => set(Number(e.target.value))} className="flex-1" />
                  <input type="number" min={min} max={max} step={step} value={value} onChange={e => set(Number(e.target.value))} className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1" />
                </div>
              </div>
            ))}
          </div>
        )}

        {gradientType === 'truchet' && (
          <div className="w-full p-2 bg-black/25 rounded-lg">
            {[
              { label: 'Tile Size', value: truchetSize, set: setTruchetSize, min: 15, max: 100, step: 5 },
              { label: 'Variation', value: truchetVariation, set: setTruchetVariation, min: 0, max: 1, step: 0.05 },
              { label: 'Thickness', value: truchetThickness, set: setTruchetThickness, min: 1, max: 15, step: 1 },
            ].map(({ label, value, set, min, max, step }, i, arr) => (
              <div key={label} className={`flex items-center justify-between ${i < arr.length - 1 ? 'mb-2' : ''}`}>
                <label className="text-[10px] text-white w-20 shrink-0">{label}:</label>
                <div className="flex items-center gap-1 flex-1 ml-2">
                  <input type="range" min={min} max={max} step={step} value={value} onChange={e => set(Number(e.target.value))} className="flex-1" />
                  <input type="number" min={min} max={max} step={step} value={value} onChange={e => set(Number(e.target.value))} className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1" />
                </div>
              </div>
            ))}
          </div>
        )}

        {gradientType === 'moire' && (
          <div className="w-full p-2 bg-black/25 rounded-lg">
            {[
              { label: 'Scale', value: moireScale, set: setMoireScale, min: 3, max: 40, step: 1 },
              { label: 'Offset', value: moireOffset, set: setMoireOffset, min: 0, max: 100, step: 1 },
              { label: 'Speed', value: moireSpeed, set: setMoireSpeed, min: 0.1, max: 5, step: 0.1 },
            ].map(({ label, value, set, min, max, step }, i, arr) => (
              <div key={label} className={`flex items-center justify-between ${i < arr.length - 1 ? 'mb-2' : ''}`}>
                <label className="text-[10px] text-white w-20 shrink-0">{label}:</label>
                <div className="flex items-center gap-1 flex-1 ml-2">
                  <input type="range" min={min} max={max} step={step} value={value} onChange={e => set(Number(e.target.value))} className="flex-1" />
                  <input type="number" min={min} max={max} step={step} value={value} onChange={e => set(Number(e.target.value))} className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1" />
                </div>
              </div>
            ))}
          </div>
        )}

        {gradientType === 'flow-field' && (
          <div className="w-full p-2 bg-black/25 rounded-lg">
            {[
              { label: 'Particles', value: flowParticleCount, set: setFlowParticleCount, min: 20, max: 800, step: 10 },
              { label: 'Speed', value: flowSpeed, set: setFlowSpeed, min: 0.1, max: 5, step: 0.1 },
              { label: 'Scale', value: flowScale, set: setFlowScale, min: 0.5, max: 10, step: 0.5 },
              { label: 'Thickness', value: flowThickness, set: setFlowThickness, min: 0.5, max: 6, step: 0.5 },
            ].map(({ label, value, set, min, max, step }, i, arr) => (
              <div key={label} className={`flex items-center justify-between ${i < arr.length - 1 ? 'mb-2' : ''}`}>
                <label className="text-[10px] text-white w-20 shrink-0">{label}:</label>
                <div className="flex items-center gap-1 flex-1 ml-2">
                  <input type="range" min={min} max={max} step={step} value={value} onChange={e => set(Number(e.target.value))} className="flex-1" />
                  <input type="number" min={min} max={max} step={step} value={value} onChange={e => set(Number(e.target.value))} className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1" />
                </div>
              </div>
            ))}
          </div>
        )}

        {gradientType === 'attractor' && (
          <div className="w-full p-2 bg-black/25 rounded-lg">
            {[
              { label: 'Points', value: attractorPointCount, set: setAttractorPointCount, min: 1, max: 20, step: 1 },
              { label: 'Speed', value: attractorSpeed, set: setAttractorSpeed, min: 0.1, max: 5, step: 0.1 },
              { label: 'Scale', value: attractorScale, set: setAttractorScale, min: 0.3, max: 3, step: 0.1 },
              { label: 'Size', value: attractorDotSize, set: setAttractorDotSize, min: 0.5, max: 6, step: 0.1 },
              { label: 'Fade', value: attractorTrailFade, set: setAttractorTrailFade, min: 0.01, max: 0.3, step: 0.01 },
            ].map(({ label, value, set, min, max, step }, i, arr) => (
              <div key={label} className={`flex items-center justify-between ${i < arr.length - 1 ? 'mb-2' : ''}`}>
                <label className="text-[10px] text-white w-20 shrink-0">{label}:</label>
                <div className="flex items-center gap-1 flex-1 ml-2">
                  <input type="range" min={min} max={max} step={step} value={value} onChange={e => set(Number(e.target.value))} className="flex-1" />
                  <input type="number" min={min} max={max} step={step} value={value} onChange={e => set(Number(e.target.value))} className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1" />
                </div>
              </div>
            ))}
          </div>
        )}

        {gradientType === 'reaction-diffusion' && (
          <div className="w-full p-2 bg-black/25 rounded-lg">
            {[
              { label: 'Feed Rate', value: reactionDiffusionFeed, set: setReactionDiffusionFeed, min: 0.02, max: 0.08, step: 0.001 },
              { label: 'Kill Rate', value: reactionDiffusionKill, set: setReactionDiffusionKill, min: 0.04, max: 0.07, step: 0.001 },
              { label: 'Speed', value: reactionDiffusionSpeed, set: setReactionDiffusionSpeed, min: 0.2, max: 3, step: 0.1 },
            ].map(({ label, value, set, min, max, step }, i, arr) => (
              <div key={label} className={`flex items-center justify-between ${i < arr.length - 1 ? 'mb-2' : ''}`}>
                <label className="text-[10px] text-white w-20 shrink-0">{label}:</label>
                <div className="flex items-center gap-1 flex-1 ml-2">
                  <input type="range" min={min} max={max} step={step} value={value} onChange={e => set(Number(e.target.value))} className="flex-1" />
                  <input type="number" min={min} max={max} step={step} value={value} onChange={e => set(Number(e.target.value))} className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1" />
                </div>
              </div>
            ))}
          </div>
        )}

        {gradientType === 'topographic' && (
          <div className="w-full p-2 bg-black/25 rounded-lg">
            {[
              { label: 'Scale', value: topographicScale, set: setTopographicScale, min: 10, max: 100, step: 1 },
              { label: 'Bands', value: topographicBands, set: setTopographicBands, min: 3, max: 30, step: 1 },
              { label: 'Line Width', value: topographicLineWidth, set: setTopographicLineWidth, min: 0.01, max: 0.15, step: 0.005 },
            ].map(({ label, value, set, min, max, step }, i, arr) => (
              <div key={label} className={`flex items-center justify-between ${i < arr.length - 1 ? 'mb-2' : ''}`}>
                <label className="text-[10px] text-white w-20 shrink-0">{label}:</label>
                <div className="flex items-center gap-1 flex-1 ml-2">
                  <input type="range" min={min} max={max} step={step} value={value} onChange={e => set(Number(e.target.value))} className="flex-1" />
                  <input type="number" min={min} max={max} step={step} value={value} onChange={e => set(Number(e.target.value))} className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1" />
                </div>
              </div>
            ))}
          </div>
        )}

        {gradientType === 'julia' && (
          <div className="w-full p-2 bg-black/25 rounded-lg">
            {[
              { label: 'Real (c)', value: juliaReal, set: setJuliaReal, min: -1, max: 1, step: 0.01 },
              { label: 'Imag (c)', value: juliaImaginary, set: setJuliaImaginary, min: -1, max: 1, step: 0.01 },
              { label: 'Zoom', value: juliaZoom, set: setJuliaZoom, min: 0.3, max: 3, step: 0.1 },
              { label: 'Detail', value: juliaIterations, set: setJuliaIterations, min: 20, max: 120, step: 5 },
            ].map(({ label, value, set, min, max, step }, i, arr) => (
              <div key={label} className={`flex items-center justify-between ${i < arr.length - 1 ? 'mb-2' : ''}`}>
                <label className="text-[10px] text-white w-20 shrink-0">{label}:</label>
                <div className="flex items-center gap-1 flex-1 ml-2">
                  <input type="range" min={min} max={max} step={step} value={value} onChange={e => set(Number(e.target.value))} className="flex-1" />
                  <input type="number" min={min} max={max} step={step} value={value} onChange={e => set(Number(e.target.value))} className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Angle Gradient Controls */}
        {gradientType === 'angle' && (
          <div className="w-full p-2 bg-black/25 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-white">Start Angle:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={angleStartOffset}
                  onChange={(e) => setAngleStartOffset(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="0"
                  max="360"
                  value={angleStartOffset}
                  onChange={(e) => setAngleStartOffset(Number(e.target.value))}
                  className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-white">Center X:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={angleCenterX}
                  onChange={(e) => setAngleCenterX(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={angleCenterX}
                  onChange={(e) => setAngleCenterX(Number(e.target.value))}
                  className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-white">Center Y:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={angleCenterY}
                  onChange={(e) => setAngleCenterY(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={angleCenterY}
                  onChange={(e) => setAngleCenterY(Number(e.target.value))}
                  className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Shapes Controls */}
        {gradientType === 'shapes' && (
          <div className="w-full p-2 bg-black/25 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-white">Scale:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="10"
                  max="300"
                  value={concentricRingWidth}
                  onChange={(e) => setConcentricRingWidth(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-[10px] text-white w-10 text-right">{concentricRingWidth}</span>
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-white">Sides:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={shapesSides}
                  onChange={(e) => setShapesSides(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={shapesSides}
                  onChange={(e) => setShapesSides(Number(e.target.value))}
                  className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-white">Count:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={shapesCount}
                  onChange={(e) => setShapesCount(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={shapesCount}
                  onChange={(e) => setShapesCount(Number(e.target.value))}
                  className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Spiral Controls */}
        {gradientType === 'windmill' && (
          <div className="w-full p-2 bg-black/25 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-white">Tightness:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={windmillTightness}
                  onChange={(e) => setWindmillTightness(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={windmillTightness}
                  onChange={(e) => setWindmillTightness(Number(e.target.value))}
                  className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-white">Rotations:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={windmillRotations}
                  onChange={(e) => setWindmillRotations(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={windmillRotations}
                  onChange={(e) => setWindmillRotations(Number(e.target.value))}
                  className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-white">Thickness:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={windmillThickness}
                  onChange={(e) => setWindmillThickness(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={windmillThickness}
                  onChange={(e) => setWindmillThickness(Number(e.target.value))}
                  className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Waves Controls */}
        {gradientType === 'waves' && (
          <div className="w-full p-2 bg-black/25 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-white">Amplitude:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="10"
                  max="200"
                  value={waveAmplitude}
                  onChange={(e) => setWaveAmplitude(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="10"
                  max="200"
                  value={waveAmplitude}
                  onChange={(e) => setWaveAmplitude(Number(e.target.value))}
                  className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-white">Frequency:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={waveFrequency}
                  onChange={(e) => setWaveFrequency(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={waveFrequency}
                  onChange={(e) => setWaveFrequency(Number(e.target.value))}
                  className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-white">Number:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={waveNumber}
                  onChange={(e) => { const v = Number(e.target.value); setWaveNumber(v); waveNumberRef.current = v; drawParamsDirtyRef.current = true; }}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={waveNumber}
                  onChange={(e) => { const v = Number(e.target.value); setWaveNumber(v); waveNumberRef.current = v; drawParamsDirtyRef.current = true; }}
                  className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-white">Direction:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={waveRotation}
                  onChange={(e) => { const v = Number(e.target.value); setWaveRotation(v); waveRotationRef.current = v; drawParamsDirtyRef.current = true; }}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="0"
                  max="360"
                  value={waveRotation}
                  onChange={(e) => { const v = Number(e.target.value); setWaveRotation(v); waveRotationRef.current = v; drawParamsDirtyRef.current = true; }}
                  className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Mesh Controls */}
        {gradientType === 'mesh' && (
          <div className="w-full p-2 bg-black/25 rounded-lg">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-white">Grid Size:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={meshGridSize}
                  onChange={(e) => setMeshGridSize(Number(e.target.value))}
                  className="flex-1"
                />
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={meshGridSize}
                        onChange={(e) => setMeshGridSize(Number(e.target.value))}
                        className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1"
                      />
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <label className="text-[10px] text-white">Jitter:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input type="range" min="0" max="100" value={meshJitter} onChange={(e) => setMeshJitter(Number(e.target.value))} className="flex-1" />
                <input type="number" min="0" max="100" value={meshJitter} onChange={(e) => setMeshJitter(Number(e.target.value))} className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1" />
              </div>
            </div>
          </div>
        )}

        {/* Noise Controls */}
        {gradientType === 'noise' && (
          <div className="w-full p-2 bg-black/25 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-white">Scale:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="10"
                  max="200"
                  value={noiseScale}
                  onChange={(e) => setNoiseScale(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={noiseScale}
                  onChange={(e) => setNoiseScale(Number(e.target.value))}
                  className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-white">Detail:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={noiseOctaves}
                  onChange={(e) => setNoiseOctaves(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={noiseOctaves}
                  onChange={(e) => setNoiseOctaves(Number(e.target.value))}
                  className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-white">Direction:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input type="range" min="0" max="360" value={noiseDirection} onChange={(e) => setNoiseDirection(Number(e.target.value))} className="flex-1" />
                <input type="number" min="0" max="360" value={noiseDirection} onChange={(e) => setNoiseDirection(Number(e.target.value))} className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1" />
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-white">Warp:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input type="range" min="0" max="1" step="0.01" value={noiseWarp} onChange={(e) => setNoiseWarp(Number(e.target.value))} className="flex-1" />
                <span className="text-[10px] text-white w-10 text-right">{noiseWarp.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-white whitespace-nowrap">Type:</label>
              <div className="flex gap-1 flex-1">
                {(['smooth', 'ridged'] as const).map(t => (
                  <button key={t} onClick={() => setNoiseType(t)} className={`flex-1 px-1 py-0.5 rounded text-[10px] capitalize transition-all ${noiseType === t ? 'bg-white text-black font-bold' : 'bg-white/8 text-white hover:bg-white/15'}`}>{t}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Plasma Gradient Controls */}
        {gradientType === 'plasma' && (
          <div className="w-full p-2 bg-black/25 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-white">Complexity:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input type="range" min="1" max="10" value={plasmaComplexity} onChange={(e) => setPlasmaComplexity(Number(e.target.value))} className="flex-1" />
                <input type="number" min="1" max="10" value={plasmaComplexity} onChange={(e) => setPlasmaComplexity(Number(e.target.value))} className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-white">Scale:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input type="range" min="0.1" max="5" step="0.1" value={plasmaZoomScale} onChange={(e) => setPlasmaZoomScale(Number(e.target.value))} className="flex-1" />
                <input type="number" min="0.1" max="5" step="0.1" value={plasmaZoomScale} onChange={(e) => setPlasmaZoomScale(Number(e.target.value))} className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1" />
              </div>
            </div>
          </div>
        )}
        
        {/* Radial Controls */}
        {gradientType === 'radial' && (
          <div className="w-full p-2 bg-black/25 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-white">Center X:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={angleCenterX}
                  onChange={(e) => setAngleCenterX(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={angleCenterX}
                  onChange={(e) => setAngleCenterX(Number(e.target.value))}
                  className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-white">Center Y:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={angleCenterY}
                  onChange={(e) => setAngleCenterY(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={angleCenterY}
                  onChange={(e) => setAngleCenterY(Number(e.target.value))}
                  className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-white">Scale:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input type="range" min="0.25" max="4" step="0.05" value={radialSizeScale} onChange={(e) => setRadialSizeScale(Number(e.target.value))} className="flex-1" />
                <span className="text-[10px] text-white w-10 text-right">{radialSizeScale.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Radial Burst Controls */}
        {gradientType === 'radial-burst' && (
          <div className="w-full p-2 bg-black/25 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-white">Burst Count:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="3"
                  max="16"
                  value={radialBurstCount}
                  onChange={(e) => setRadialBurstCount(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="1"
                  max="16"
                  value={radialBurstCount}
                  onChange={(e) => setRadialBurstCount(Number(e.target.value))}
                  className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <label className="text-[10px] text-white">Spread:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={radialBurstSpread}
                  onChange={(e) => setRadialBurstSpread(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={radialBurstSpread}
                  onChange={(e) => setRadialBurstSpread(Number(e.target.value))}
                  className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <label className="text-[10px] text-white">Size:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="10"
                  max="200"
                  value={radialBurstSize}
                  onChange={(e) => setRadialBurstSize(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="10"
                  max="200"
                  value={radialBurstSize}
                  onChange={(e) => setRadialBurstSize(Number(e.target.value))}
                  className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Voronoi Controls */}
        {gradientType === 'voronoi' && (
          <div className="w-full p-2 bg-black/20 border border-white/8 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-white">Cell Count:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="3"
                  max="30"
                  value={voronoiCellCount}
                  onChange={(e) => setVoronoiCellCount(Number(e.target.value))}
                  className="flex-1"
                />
                      <input
                        type="number"
                        min="3"
                        max="30"
                        value={voronoiCellCount}
                        onChange={(e) => setVoronoiCellCount(Number(e.target.value))}
                        className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1"
                      />
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-white">Distortion:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={voronoiDistortion}
                  onChange={(e) => setVoronoiDistortion(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={voronoiDistortion}
                  onChange={(e) => setVoronoiDistortion(Number(e.target.value))}
                  className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Fade Controls */}
        {gradientType === 'fade' && (
          <div className="w-full p-2 bg-black/25 rounded-lg">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-white">Direction:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input type="range" min="0" max="360" value={fadeDirection} onChange={(e) => setFadeDirection(Number(e.target.value))} className="flex-1" />
                <input type="number" min="0" max="360" value={fadeDirection} onChange={(e) => setFadeDirection(Number(e.target.value))} className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1" />
              </div>
            </div>
          </div>
        )}

        {/* Radar Controls */}
        {gradientType === 'radar' && (
          <div className="w-full p-2 bg-black/20 border border-white/8 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-white">Fade Length:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="10"
                  max="180"
                  value={radarFadeLength}
                  onChange={(e) => setRadarFadeLength(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="10"
                  max="180"
                  value={radarFadeLength}
                  onChange={(e) => setRadarFadeLength(Number(e.target.value))}
                  className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-white">Beam Width:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input type="range" min="1" max="90" value={radarBeamWidth} onChange={(e) => setRadarBeamWidth(Number(e.target.value))} className="flex-1" />
                <input type="number" min="1" max="90" value={radarBeamWidth} onChange={(e) => setRadarBeamWidth(Number(e.target.value))} className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1" />
              </div>
            </div>
          </div>
        )}

        {/* Flower Controls */}
        {gradientType === 'flower' && (
          <div className="w-full p-2 bg-black/20 border border-white/8 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-white">Circles:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={flowerCircles}
                  onChange={(e) => setFlowerCircles(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={flowerCircles}
                  onChange={(e) => setFlowerCircles(Number(e.target.value))}
                  className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-white">Scale:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={flowerScale}
                  onChange={(e) => setFlowerScale(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={flowerScale}
                  onChange={(e) => setFlowerScale(Number(e.target.value))}
                  className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-white">Spread:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="0.3"
                  max="2.5"
                  step="0.05"
                  value={flowerSpread}
                  onChange={(e) => setFlowerSpread(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="0.3"
                  max="2.5"
                  step="0.05"
                  value={flowerSpread}
                  onChange={(e) => setFlowerSpread(Number(e.target.value))}
                  className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Conical Spiral Controls */}
        {gradientType === 'helix' && (
          <div className="w-full p-2 bg-black/25 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-white">Turns:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={helixTurns}
                  onChange={(e) => setHelixTurns(Number(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={helixTurns}
                  onChange={(e) => setHelixTurns(Number(e.target.value))}
                  className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-white">Tightness:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input
                  type="range"
                  min="0.1"
                  max="2"
                  step="0.1"
                  value={helixTightness}
                  onChange={(e) => setHelixTightness(Number(e.target.value))}
                  className="flex-1"
                />
                      <input
                        type="number"
                        min="0.1"
                        max="2"
                        step="0.1"
                        value={helixTightness}
                        onChange={(e) => setHelixTightness(Number(e.target.value))}
                        className="text-[10px] text-white w-12 text-right bg-black/25 border border-white/20 rounded px-1"
                      />
              </div>
            </div>
          </div>
        )}

        {/* Shared field-mapping controls — appear for any scalar-field gradient
            (one continuous 0-1 value mapped to the palette per pixel), reusing
            a single fieldContrast/paletteMode/paletteBands state rather than a
            near-duplicate set per gradient, since only one is ever active.
            Fade only wires up Contrast (it blends exactly 2 explicit colors
            rather than indexing the full palette, so Banded/Cyclic don't
            apply the same way). */}
        {(['reaction-diffusion', 'marble', 'caustics', 'topographic', 'julia', 'plasma', 'fade'] as GradientType[]).includes(gradientType) && (
          <div className="w-full mt-3">
            <div className="flex items-center gap-2 mb-2 pt-2 border-t border-white/10">
              <span className="text-[9px] font-bold uppercase tracking-wider text-white/50">Field Mapping</span>
            </div>
            <div className="w-full p-2 bg-black/25 rounded-lg">
            <div className={`flex items-center justify-between ${gradientType === 'fade' ? '' : 'mb-2'}`}>
              <label className="text-[10px] text-white w-20 shrink-0">Contrast:</label>
              <div className="flex items-center gap-1 flex-1 ml-2">
                <input type="range" min="0.3" max="3" step="0.1" value={fieldContrast} onChange={(e) => setFieldContrast(Number(e.target.value))} className="flex-1" />
                <input type="number" min="0.3" max="3" step="0.1" value={fieldContrast} onChange={(e) => setFieldContrast(Number(e.target.value))} className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1" />
              </div>
            </div>
            {gradientType !== 'fade' && (
            <div className="flex items-center gap-1 mb-2">
              <label className="text-[10px] text-white whitespace-nowrap">Palette:</label>
              <div className="flex gap-1 flex-1">
                {(['linear', 'banded', 'cyclic'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setPaletteMode(mode)}
                    className={`flex-1 px-1 py-0.5 rounded text-[10px] capitalize transition-all ${
                      paletteMode === mode ? 'bg-white text-black' : 'bg-black/25 text-white hover:bg-white/15'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
            )}
            {gradientType !== 'fade' && paletteMode !== 'linear' && (
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-white w-20 shrink-0">{paletteMode === 'banded' ? 'Bands:' : 'Repeats:'}</label>
                <div className="flex items-center gap-1 flex-1 ml-2">
                  <input type="range" min="2" max="16" step="1" value={paletteBands} onChange={(e) => setPaletteBands(Number(e.target.value))} className="flex-1" />
                  <input type="number" min="2" max="16" step="1" value={paletteBands} onChange={(e) => setPaletteBands(Number(e.target.value))} className="text-[10px] text-white w-10 text-right bg-black/25 border border-white/20 rounded px-1" />
                </div>
              </div>
            )}
            </div>
          </div>
        )}

    </>
  );
};

export const GradientsTab = React.memo(GradientsTabInner);
