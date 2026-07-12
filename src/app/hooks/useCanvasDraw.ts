import { useEffect } from 'react';
import {
  ALL_EFFECTS, AUDIO_GRADIENTS, AUDIO_EFFECTS, FULL_GRADIENT_TYPES,
  DEG_TO_RAD, TWO_PI, NO_DRAG_TYPES,
} from '../constants/gradientEffects';
import { pickRandomEmojiSet, splitGraphemes, EMOJI_PICKER_CATEGORIES } from '../components/InteractiveGradient';

// Loosely typed for the same reason as useRandomization.ts/useSnapshot.ts's
// params: this hook wires together ~180 values/refs/setters spanning
// nearly every piece of gradient/effect state plus live audio levels and
// animation refs, since the draw function reads all of it. The build
// doesn't type-check (esbuild transpile only) — matches the existing
// PresetData = Record<string, any> convention in usePresets.ts.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CanvasDrawParams = Record<string, any>;

// Draw gradient on canvas — stored imperatively in drawRef so the master RAF
// can call it without triggering React reconciliation. Only re-assigned
// when non-animated params change (see the drawParams useMemo in
// InteractiveGradient.tsx, passed through here as a single param so this
// hook's useEffect depends on it exactly as it did before extraction —
// preserves the original memoization/redraw-trigger timing exactly rather
// than reconstructing a ~150-item dependency array by hand).
export function useCanvasDraw(params: CanvasDrawParams) {
  const {
    activeEffects, addGradientStops, angleCenterX, angleCenterY, angleStartOffset, asciiChars,
    asciiColor, asciiSize, attractorAnimTime, attractorBufferRef, attractorPointCount, attractorPointsRef,
    attractorScale, audioMidsLevel, audioSubBassLevel, audioTrebleLevel, auroraAnimTime,
    auroraBandCount, auroraBandHeight, auroraWaveSpeed, bassThreshold, bloomIntensity, bloomRadius,
    blurGaussianAmount, blurMotionAmount, blurMotionDirection, blurRadialAmount, blurType, canvasRef,
    causticsAnimTime, causticsBrightness, causticsScale, charcoalIntensity, chromaticAngle, chromaticOffset,
    chromaticTrailsBufferRef, chromaticTrailsDecay, chromaticTrailsOffset, colorPins, colorShiftHue, concentricRingCount,
    concentricRingWidth, helixTightness, helixTurns, ditherLevels, ditherType, drawParams,
    glitchIntensity, glitchBlockSize,
    drawParamsDirtyRef, drawRef, duotoneColor1, duotoneColor2, duotoneColor3, duotoneIntensity,
    duotoneThreeColor, dustCrackleIntensity, emojiAnimTime, emojiChars, emojiOffsetX, emojiSize,
    emojiSizeVariation, fadeDirection, feedbackBufferRef, feedbackDecay, feedbackRotation, feedbackZoom,
    fisheyeCenterX, fisheyeCenterY, fisheyeStrength, flowAnimTime, flowBufferRef, flowParticleCount,
    flowParticlesRef, flowScale, flowThickness, flowerAnimTime, flowerCircles, flowerRotation,
    flowerScale, flowerSpread,
    gradientAngle, gradientAngleRef, gradientColors, gradientColorsRef,
    gradientType, grainIntensity, grainType, gridColumns, gridRotation, gridRows,
    gridShapeSize, gridSides, gridVariation, halftoneCMYK, halftoneMove, halftoneSize,
    halftoneTimeRef, halftoneVariation, iridescentAngle, iridescentIntensity, iridescentScale, isAudioEnabled,
    isAudioReactive, isAutoModeRef, isVCRPlayingRef, kaleidoAngleRef, kaleidoscopeRotateSpeed, kaleidoscopeSegments,
    lavaAnimTime, lavaBlobCount, lavaBlobSize, lavaSpeed, liquidAnimTime, liquidScale,
    liquidStrength, marbleAnimTime, marbleOctaves, marbleTurbulence, marbleVeinFreq, meshGridSize,
    meshJitter, metaballAnimTime, metaballCount, metaballSize, mirrorMode, mirrorTileCount,
    moireAnimTime, moireOffset, moireScale, noiseDirection, noiseOctaves, noiseScale,
    noiseType, noiseWarp, photoBlendMode, photoImageRef, photoOpacity, pixelSize,
    plasmaComplexity, plasmaZoomScale, polygon2Sides, posterizeLevels, prevBassForRippleRef,
    radarBeamWidth, radarFadeLength, radarSweepAngle, radialBurstCount, radialBurstSize, radialBurstSpread,
    radialSizeScale, reactionDiffusionFeed, reactionDiffusionGridRef, reactionDiffusionKill, reactionDiffusionSpeed,
    resolutionMultiplier, rippleAmplitude, rippleAutoFrameRef, rippleRingsRef, scanlineIntensity,
    scanlineSpacing, scanlineSpeed, shapesCount, shapesSides, slitScanBufferRef, slitScanDirection,
    slitScanIntensity, windmillRotations, windmillThickness, windmillTightness, windmillZoom, triangleSize,
    topographicBands, topographicLineWidth, topographicScale,
    truchetSize, truchetThickness, truchetVariation, vhsGlitchIntensity, vignetteSoftness, vignetteStrength,
    voronoiAnimTime, voronoiCellCount, voronoiDistortion, waveAmplitude, waveDistortionRotation, waveDistortionStrength,
    waveFrequency, waveNumberRef, waveRotationRef, waveScale, zoom, zoomRef,
  } = params;

  useEffect(() => {
    drawParamsDirtyRef.current = true; // signal RAF to redraw with new params
    drawRef.current = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // willReadFrequently forces the whole context onto a software (non-GPU) rendering
    // path — getImageData is only used by specific effects (VHS, dither, slit-scan,
    // ripple, etc.), not the base gradient draw, so leave GPU acceleration on by default.
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Read animated values from refs (updated every frame without React state changes)
    const gradientColors = gradientColorsRef.current;
    const gradientAngle = gradientAngleRef.current;
    const zoom = zoomRef.current;

    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;
    const targetWidth = displayWidth * resolutionMultiplier;
    const targetHeight = displayHeight * resolutionMultiplier;
    // Assigning canvas.width/height forces a full reallocation + clear of the backing
    // store, even when the value is unchanged. Only touch it when the size actually
    // changed (window resize, DPR change) — doing this unconditionally every frame was
    // reallocating the entire canvas 60x/sec and was the dominant cause of jank.
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;
    }

    // Scale context for high-resolution rendering
    // resetTransform first — some browsers skip the state reset when canvas.width
    // hasn't changed, causing ctx.scale to compound across frames (2→4→8→…)
    // which shrinks the CSS coordinate space and moves everything toward (0,0).
    ctx.resetTransform();
    ctx.scale(resolutionMultiplier, resolutionMultiplier);

    // putImageData ignores ctx transforms, so route through drawImage to respect DPR scale
    const putScaledImageData = (imgData: ImageData, dx = 0, dy = 0) => {
      if (resolutionMultiplier === 1) {
        ctx.putImageData(imgData, dx, dy);
      } else {
        const tmp = new OffscreenCanvas(imgData.width, imgData.height);
        (tmp.getContext('2d') as OffscreenCanvasRenderingContext2D).putImageData(imgData, 0, 0);
        ctx.save();
        ctx.resetTransform();
        ctx.drawImage(tmp, dx * resolutionMultiplier, dy * resolutionMultiplier,
          imgData.width * resolutionMultiplier, imgData.height * resolutionMultiplier);
        ctx.restore();
      }
    };

    // ctx.getImageData ignores transforms and reads physical pixels.
    // On Retina (2× DPI), getImageData(0,0,displayWidth,displayHeight) captures only
    // the top-left quarter of the physical canvas — centering the gradient at the
    // captured region's bottom-right edge, which maps to the canvas bottom-right corner
    // after putScaledImageData upscales it. This helper downsamples the full physical
    // canvas to CSS-pixel resolution so effects always capture the complete image.
    const getDisplayImageData = (): ImageData => {
      if (resolutionMultiplier === 1) {
        return ctx.getImageData(0, 0, displayWidth, displayHeight);
      }
      const tmp = new OffscreenCanvas(displayWidth, displayHeight);
      (tmp.getContext('2d') as OffscreenCanvasRenderingContext2D).drawImage(canvas, 0, 0, displayWidth, displayHeight);
      return (tmp.getContext('2d') as OffscreenCanvasRenderingContext2D).getImageData(0, 0, displayWidth, displayHeight);
    };

    // Safety check: require a gradient type to be selected
    if (!gradientType) {
      // Clear canvas and show nothing until Randomize is clicked
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, displayWidth, displayHeight);
      return;
    }

    // Safety check: ensure we have valid colors
    if (!gradientColors || gradientColors.length === 0) {
      return;
    }

    // Pre-calculate common values using display dimensions
    const centerX = displayWidth / 2;
    const centerY = displayHeight / 2;
    const maxRadius = Math.max(displayWidth, displayHeight);
    const fitRadius = Math.min(displayWidth, displayHeight) / 2;
    
    // Apply audio reactivity to gradient angle if enabled. audioSubBassLevel
    // isn't naturally 0-1 — its range depends on the Sub multiplier slider
    // (0-5) and master sensitivity — so without the clamp this could add
    // several multiples of 360° in a single frame on loud sub-bass, an
    // unbounded snap that fights the smooth autonomous rotation happening
    // in the same frame rather than the intended "up to one full turn"
    // wobble on top of it.
    const audioAdjustedAngle = (isAudioEnabled && isAudioReactive)
      ? gradientAngle + (Math.min(1, audioSubBassLevel) * 360)
      : gradientAngle;
    
    const angleRad = audioAdjustedAngle * DEG_TO_RAD;
    const cosAngle = Math.cos(angleRad);
    const sinAngle = Math.sin(angleRad);

    // Fill canvas with black background before drawing
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    // Audio transformations are applied to specific gradient/effect parameters
    // rather than global canvas transformations

    let gradient: CanvasGradient | undefined;

    switch (gradientType) {
      case 'linear':
        // Invert zoom so zooming out expands the gradient (divide by zoom)
        const linearScale = 1 / zoom;
        const halfWidth = displayWidth / 2 * linearScale;
        const halfHeight = displayHeight / 2 * linearScale;
        gradient = ctx.createLinearGradient(
          centerX + cosAngle * halfWidth,
          centerY + sinAngle * halfHeight,
          centerX - cosAngle * halfWidth,
          centerY - sinAngle * halfHeight
        );
        break;

      case 'radial': {
        const radialAudioActive = isAudioEnabled && isAudioReactive;
        const radialDampening = 0.2;
        const dampenedRadialZoom = radialAudioActive ? 1 : 1 + (zoom - 1) * radialDampening;
        // Bass makes ring breathe — larger pulse on strong hits, decays between
        const audioRadiusScale = radialAudioActive ? 1 + audioSubBassLevel * 0.8 : 1;
        const radialScale = (1 / dampenedRadialZoom) * audioRadiusScale * radialSizeScale;
        const radialCenterX = (displayWidth * angleCenterX) / 100;
        const radialCenterY = (displayHeight * angleCenterY) / 100;
        const radialRadius = Math.max(0, Math.min(displayWidth, displayHeight) / 2 * radialScale);
        gradient = ctx.createRadialGradient(radialCenterX, radialCenterY, 0, radialCenterX, radialCenterY, radialRadius);
        break;
      }

      case 'angle': {
        // Very subtle audio: slight angle shimmer, no center drift
        const audioConicAngleOffset = (isAudioEnabled && isAudioReactive) ? audioTrebleLevel * Math.PI * 0.004 : 0;
        const conicCenterX = (displayWidth * angleCenterX) / 100;
        const conicCenterY = (displayHeight * angleCenterY) / 100;
        const conicZoom = (isAudioEnabled && isAudioReactive) ? 1 : Math.max(1, zoom);
        const conicStartAngle = angleRad + (angleStartOffset * Math.PI) / 180 + audioConicAngleOffset;

        // createConicGradient (and even a cached-bitmap + rotated drawImage blit) both
        // route through the canvas compositing pipeline, which is the slow path on this
        // GPU. Radar proves the fix: skip the pipeline entirely and write pixels directly
        // via putImageData, exactly like the radar sweep already does successfully.
        const angleImageData = ctx.createImageData(displayWidth, displayHeight);
        const angleData = angleImageData.data;
        const angleNumColors = gradientColors.length;

        for (let ry = 0; ry < displayHeight; ry++) {
          for (let rx = 0; rx < displayWidth; rx++) {
            const dx = (rx - conicCenterX) / conicZoom;
            const dy = (ry - conicCenterY) / conicZoom;
            let pixelAngle = Math.atan2(dy, dx) - conicStartAngle;
            pixelAngle = ((pixelAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
            const t = pixelAngle / (2 * Math.PI);

            const colorPos = t * (angleNumColors - 1);
            const colorIdx = Math.floor(colorPos);
            const colorFrac = colorPos - colorIdx;
            const color1 = gradientColors[colorIdx % angleNumColors];
            const color2 = gradientColors[(colorIdx + 1) % angleNumColors];
            if (!color1 || !color2) continue;

            const idx = (ry * displayWidth + rx) * 4;
            angleData[idx] = color1.r + (color2.r - color1.r) * colorFrac;
            angleData[idx + 1] = color1.g + (color2.g - color1.g) * colorFrac;
            angleData[idx + 2] = color1.b + (color2.b - color1.b) * colorFrac;
            angleData[idx + 3] = 255;
          }
        }

        putScaledImageData(angleImageData);
        gradient = undefined;
        break;
      }



      case 'polar-grid':
        // Create a polygon pattern with solid colors and concentric rings - centered and sized to fit window on load
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, displayWidth, displayHeight);

        const polygonSolidScale = 1 / zoom;
        const polygonSolidRadius = fitRadius; // Use fitRadius to ensure shape fits

        // Audio reactivity: very subtle brightness/color shift only, no geometry changes
        const audioRadialBoost = 0;
        const audioRingBoost = 0;
        const audioRotation = (isAudioEnabled && isAudioReactive)
          ? audioTrebleLevel * 5 // Treble barely rotates (±5°)
          : 0;

        const solidSides = Math.max(1, polygon2Sides + audioRadialBoost); // Use polygon2Sides for this gradient type
        const solidAnglePerSide = 360 / solidSides;
        const solidSectorHalf = Math.PI / solidSides;
        const polygonRingCount = concentricRingCount + audioRingBoost;
        
        const drawPolygonSolid = () => {
          // Draw from outside in for proper layering
          for (let ring = polygonRingCount; ring >= 0; ring--) {
            const ringRadius = maxRadius * (ring / polygonRingCount);

            for (let i = 0; i < solidSides; i++) {
              const angle = (i * solidAnglePerSide + gradientAngle + audioRotation) * DEG_TO_RAD;
              
              // Color based on ring and side
              const colorIndex = (i + ring) % gradientColors.length;
              const color = gradientColors[colorIndex];
              
              // Safety check
              if (!color) continue;
              
              ctx.save();
              ctx.beginPath();
              ctx.moveTo(centerX, centerY);
              // Extend the arc to overlap slightly and prevent gaps
              const angleStart = angle - solidSectorHalf - 0.01;
              const angleEnd = angle + solidSectorHalf + 0.01;
              ctx.arc(centerX, centerY, ringRadius, angleStart, angleEnd);
              ctx.closePath();
              ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
              ctx.fill();
              ctx.restore();
            }
          }
        };
        
        drawPolygonSolid();
        break;

      case 'windmill': {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, displayWidth, displayHeight);

        const spiralAudioActive = isAudioEnabled && isAudioReactive;

        // 1. Bass pulses blade thickness
        const audioThickness = spiralAudioActive ? windmillThickness + audioSubBassLevel * windmillThickness * 1.2 : windmillThickness;
        // 2. Mids boost rotation speed (angle offset accumulates via gradientAngle state externally; here we add a per-frame visual offset)
        const audioAngleOffset = spiralAudioActive ? audioMidsLevel * 120 : 0;
        // 4. Treble cycles color palette position
        const audioColorCycle = spiralAudioActive ? audioTrebleLevel * gradientColors.length : 0;

        const zoomDampening = 0.3;
        const dampenedZoom = 1 + (zoom - 1) * zoomDampening;
        const spiralScale = 1 / dampenedZoom;
        const spiralSegments = 60 * windmillTightness / 5;
        const effectiveSpiralRotations = windmillRotations * spiralScale;

        // windmillZoom scales the whole pattern — higher = zoomed in (fewer bands visible)
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(windmillZoom, windmillZoom);
        ctx.translate(-centerX, -centerY);

        for (let i = 0; i < spiralSegments; i++) {
          const t = i / spiralSegments;
          const angle = (t * 360 * effectiveSpiralRotations + gradientAngle + audioAngleOffset) * DEG_TO_RAD;

          // 4. Shift color index by treble amount
          const shiftedT = ((t * (gradientColors.length - 1) + audioColorCycle) % (gradientColors.length - 1 || 1));
          const colorIndex = Math.floor(shiftedT) % gradientColors.length;
          const nextColorIndex = (colorIndex + 1) % gradientColors.length;
          const localT = shiftedT - Math.floor(shiftedT);

          const color = gradientColors[colorIndex];
          const nextColor = gradientColors[nextColorIndex];
          if (!color || !nextColor) continue;

          const r = color.r + (nextColor.r - color.r) * localT;
          const g = color.g + (nextColor.g - color.g) * localT;
          const b = color.b + (nextColor.b - color.b) * localT;

          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.rotate(angle);
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fillRect(-maxRadius, -audioThickness / 2, maxRadius * 2, audioThickness);
          ctx.restore();
        }
        ctx.restore(); // undo windmillZoom scale
        break;
      }

      case 'waves':
        // Create horizontal wave pattern with infinite width coverage
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, displayWidth, displayHeight);

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((waveRotationRef.current * Math.PI) / 180);
        const waveZoom = (isAudioEnabled && isAudioReactive) ? 1 / waveScale : zoom / waveScale;
        ctx.scale(waveZoom, waveZoom);
        ctx.translate(-centerX, -centerY);

        const waveScaleForWave = 1 / waveZoom;
        const waveWidth = (displayWidth / waveNumberRef.current) * waveScaleForWave;
        // Audio reactivity: bass affects wave amplitude
        const audioWaveAmplitude = (isAudioEnabled && isAudioReactive)
          ? audioSubBassLevel * 8 // Very subtle amplitude nudge on bass
          : 0;
        const amplitude = (waveAmplitude + audioWaveAmplitude) * waveScaleForWave;
        const frequency = waveFrequency * 0.0033;
        
        // Coverage must account for rotation (diagonal at 45°) and amplitude overshoot
        const waveDiagonal = Math.sqrt(displayWidth * displayWidth + displayHeight * displayHeight);
        const visibleWidth = (waveDiagonal * 2) / waveZoom;
        const numWavesForWave = Math.ceil(visibleWidth / waveWidth) + 4;
        const startOffset = Math.floor(numWavesForWave / 2);
        
        // Treble shifts which colors the waves use
        const waveColorShiftAmt = (isAudioEnabled && isAudioReactive) ? audioTrebleLevel * gradientColors.length * 0.3 : 0;

        // Cache one tiny horizontal gradient bitmap per color pair (there are only
        // gradientColors.length of them) so the per-scanline fill below can blit a
        // cheap bitmap instead of allocating a CanvasGradient on every row — that's
        // what makes riding the gradient along the wave's curve affordable per-frame.
        const waveStripCache: HTMLCanvasElement[] = [];
        for (let c = 0; c < gradientColors.length; c++) {
          const color = gradientColors[c];
          const nextColor = gradientColors[(c + 1) % gradientColors.length];
          if (!color || !nextColor) continue;
          const strip = document.createElement('canvas');
          strip.width = 64; strip.height = 1;
          const sCtx = strip.getContext('2d')!;
          const sGrad = sCtx.createLinearGradient(0, 0, 64, 0);
          sGrad.addColorStop(0, `rgb(${color.r}, ${color.g}, ${color.b})`);
          sGrad.addColorStop(1, `rgb(${nextColor.r}, ${nextColor.g}, ${nextColor.b})`);
          sCtx.fillStyle = sGrad;
          sCtx.fillRect(0, 0, 64, 1);
          waveStripCache[c] = strip;
        }

        const waveRowStep = 8;
        for (let i = -startOffset; i < numWavesForWave - startOffset; i++) {
          const baseX = i * waveWidth;
          const shiftedI = i + waveColorShiftAmt;
          const colorIndex = ((Math.floor(shiftedI) % gradientColors.length) + gradientColors.length) % gradientColors.length;
          const strip = waveStripCache[colorIndex];
          if (!strip) continue;

          // Fill scanline-by-scanline so the gradient's left/right edges follow the
          // same sine offset as the stripe's own wavy boundary at that row — the
          // gradient rides inside the curve instead of sitting as a straight band
          // laid over it.
          for (let y = -displayHeight * 3; y <= displayHeight * 3; y += waveRowStep) {
            const waveX = baseX + Math.sin(y * frequency) * amplitude;
            ctx.drawImage(strip, 0, 0, 64, 1, waveX, y, waveWidth, waveRowStep + 1);
          }
        }

        ctx.restore();

        // Bass radial brightness pulse — drawn on top after restoring transform
        if (isAudioEnabled && isAudioReactive && audioSubBassLevel > 0.05) {
          const waveMaxR = Math.sqrt(displayWidth ** 2 + displayHeight ** 2) / 2;
          const pulseR = waveMaxR * (1 - audioSubBassLevel * 0.3);
          const waveGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseR);
          waveGlow.addColorStop(0, `rgba(255,255,255,${audioSubBassLevel * 0.35})`);
          waveGlow.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = waveGlow;
          ctx.fillRect(0, 0, displayWidth, displayHeight);
        }
        break;

      case 'shapes': {
        // Create concentric polygons with variable sides
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        const shapesScale = (isAudioEnabled && isAudioReactive) ? 1 : 1 / zoom;
        // Bass pulses ring width slightly; cap so count and rotate sliders stay effective
        const audioShapeRingWidth = (isAudioEnabled && isAudioReactive)
          ? audioSubBassLevel * 20
          : 0;
        const shapeRingWidth = (concentricRingWidth + audioShapeRingWidth) * shapesScale;
        // Always respect shapesCount slider regardless of audio
        const numShapeRings = shapesCount;
        
        for (let i = numShapeRings - 1; i >= 0; i--) {
          const radius = i * shapeRingWidth;
          if (radius <= 0) continue;
          
          // Static color assignment based on ring index
          const colorIndex = i % gradientColors.length;
          const color = gradientColors[colorIndex];
          
          // Safety check
          if (!color) continue;
          
          // Draw solid color polygon
          ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
          ctx.beginPath();
          
          if (shapesSides === 1) {
            // Dot (circle)
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          } else if (shapesSides === 2) {
            // Line (vertical line with thickness = radius)
            ctx.rect(centerX - radius, centerY - displayHeight * 2, radius * 2, displayHeight * 4);
          } else {
            // Polygon (3+ sides) — rotation follows the same playhead-driven
            // angle every other gradient type uses, instead of its own
            // redundant rotation state/direction controls.
            const angleStep = (Math.PI * 2) / shapesSides;
            const rotationRadians = (gradientAngle * Math.PI) / 180;
            const startAngle = -Math.PI / 2 + rotationRadians; // Start from top + rotation

            for (let j = 0; j <= shapesSides; j++) {
              const angle = startAngle + angleStep * j;
              const x = centerX + Math.cos(angle) * radius;
              const y = centerY + Math.sin(angle) * radius;
              
              if (j === 0) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }
            }
            ctx.closePath();
          }
          
          ctx.fill();
        }
        break;
      }

      case 'fade': {
        const fadeAudioActive = isAudioEnabled && isAudioReactive;
        const totalColors = gradientColors.length;
        const normalizedAngle = gradientAngle / 360;
        // Treble shifts the blend midpoint between colors
        const audioMidpointShift = fadeAudioActive ? audioTrebleLevel * 0.6 : 0;
        const exactPosition = (normalizedAngle * totalColors + audioMidpointShift) % totalColors;
        const currentColorIndex = Math.floor(exactPosition) % totalColors;
        const nextColorIndex = (currentColorIndex + 1) % totalColors;
        // Bass pulses the blend amount toward the next color
        const baseBlend = exactPosition - Math.floor(exactPosition);
        const blendAmount = fadeAudioActive ? Math.min(1, baseBlend + audioSubBassLevel * 0.4) : baseBlend;

        const currentColor = gradientColors[currentColorIndex];
        const nextColor = gradientColors[nextColorIndex];
        if (!currentColor || !nextColor) break;

        const r = Math.round(currentColor.r + (nextColor.r - currentColor.r) * blendAmount);
        const g = Math.round(currentColor.g + (nextColor.g - currentColor.g) * blendAmount);
        const b = Math.round(currentColor.b + (nextColor.b - currentColor.b) * blendAmount);

        if (gradientColors.length >= 2 && fadeDirection !== 0) {
          const fadeRad = fadeDirection * Math.PI / 180;
          const fadeCx = displayWidth / 2, fadeCy = displayHeight / 2;
          const fadeHalfDiag = Math.sqrt(fadeCx * fadeCx + fadeCy * fadeCy);
          const fx0 = fadeCx - Math.cos(fadeRad) * fadeHalfDiag;
          const fy0 = fadeCy - Math.sin(fadeRad) * fadeHalfDiag;
          const fx1 = fadeCx + Math.cos(fadeRad) * fadeHalfDiag;
          const fy1 = fadeCy + Math.sin(fadeRad) * fadeHalfDiag;
          const fadeLinGrad = ctx.createLinearGradient(fx0, fy0, fx1, fy1);
          fadeLinGrad.addColorStop(0, `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})`);
          fadeLinGrad.addColorStop(1, `rgb(${nextColor.r}, ${nextColor.g}, ${nextColor.b})`);
          ctx.fillStyle = fadeLinGrad;
        } else {
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        }
        ctx.fillRect(0, 0, displayWidth, displayHeight);

        // Mids: radial pulse from center
        if (fadeAudioActive && audioMidsLevel > 0.05) {
          const pulseRadius = Math.min(displayWidth, displayHeight) * audioMidsLevel * 0.7;
          const pulseGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseRadius);
          pulseGrad.addColorStop(0, `rgba(255,255,255,${audioMidsLevel * 0.4})`);
          pulseGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = pulseGrad;
          ctx.fillRect(0, 0, displayWidth, displayHeight);
        }
        break;
      }
      
      case 'mesh':
        // Multi-point gradient mesh - centered and sized to fit window on load
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        const meshPoints = meshGridSize;
        const meshScale = 1 / zoom;
        // Audio reactivity: bass affects mesh point spread
        const audioMeshScale = (isAudioEnabled && isAudioReactive) 
          ? 1 + (audioSubBassLevel * 0.5) // Up to 50% larger spread
          : 1;
        for (let i = 0; i < meshPoints; i++) {
          const meshAngle = (i * 360 / meshPoints + gradientAngle) * DEG_TO_RAD;
          const jitterAmount = (meshJitter / 100) * fitRadius * 0.3;
          const jx = (Math.sin(i * 127.1) * 0.5 + 0.5) * 2 - 1;
          const jy = (Math.sin(i * 269.5) * 0.5 + 0.5) * 2 - 1;
          const meshX = centerX + Math.cos(meshAngle) * fitRadius * 0.6 * meshScale * audioMeshScale + jx * jitterAmount;
          const meshY = centerY + Math.sin(meshAngle) * fitRadius * 0.6 * meshScale * audioMeshScale + jy * jitterAmount;
          const meshRadius = Math.max(0, fitRadius * 0.8 * meshScale * audioMeshScale);
          const meshGrad = ctx.createRadialGradient(meshX, meshY, 0, meshX, meshY, meshRadius);
          const colorIndex = i % gradientColors.length;
          const meshColor = gradientColors[colorIndex];
          if (!meshColor) continue;
          meshGrad.addColorStop(0, `rgb(${meshColor.r}, ${meshColor.g}, ${meshColor.b})`);
          meshGrad.addColorStop(0.6, `rgba(${meshColor.r}, ${meshColor.g}, ${meshColor.b}, 0.5)`);
          meshGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = meshGrad;
          ctx.fillRect(0, 0, displayWidth, displayHeight);
        }
        ctx.globalCompositeOperation = 'source-over';
        break;
      
      case 'noise':
        // Perlin-style noise gradient
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        const noiseImageData = ctx.createImageData(displayWidth, displayHeight);
        const noiseData = noiseImageData.data;

        const audioActive = isAudioEnabled && isAudioReactive;
        const noiseZoom = audioActive ? 1 : zoom;
        // Static spatial pattern — no positional changes on audio
        const baseNoiseScale = (noiseScale * 0.001) / noiseZoom;
        const noiseRotCos = Math.cos(noiseDirection * 0.01);
        const noiseRotSin = Math.sin(noiseDirection * 0.01);
        // Audio: color shift cycles through palette, bass pulse brightens from center
        const noiseColorShift = audioActive ? audioTrebleLevel * 0.6 : 0;
        const noiseBassBoost = audioActive ? audioSubBassLevel : 0;
        const maxNoiseDist = Math.sqrt(displayWidth ** 2 + displayHeight ** 2) / 2;

        const noiseCX = displayWidth / 2;
        const noiseCY = displayHeight / 2;
        const warpStrength = noiseWarp * baseNoiseScale * 300;

        for (let ny = 0; ny < displayHeight; ny++) {
          for (let nx = 0; nx < displayWidth; nx++) {
            const ndx = nx - noiseCX;
            const ndy = ny - noiseCY;
            let rx = ndx * noiseRotCos - ndy * noiseRotSin;
            let ry = ndx * noiseRotSin + ndy * noiseRotCos;

            // Domain warp: displace coordinates by a low-frequency noise layer
            if (noiseWarp > 0) {
              const ws = baseNoiseScale * 0.7;
              rx += warpStrength * Math.sin(rx * ws + ry * ws * 0.3);
              ry += warpStrength * Math.cos(rx * ws * 0.3 + ry * ws);
            }

            let combinedNoise = 0;
            let amplitude = 1;
            let totalAmplitude = 0;

            for (let octave = 0; octave < noiseOctaves; octave++) {
              const frequency = Math.pow(2, octave);
              const scale = baseNoiseScale * frequency;
              // Rotate each octave's basis by a fixed offset (~137.5°, the golden
              // angle) so added octaves reshape the pattern instead of just
              // layering finer detail onto the same axis-aligned grid — this is
              // what makes each Detail value look like a genuinely different
              // shape rather than a sharper version of Detail=1.
              const octAngle = octave * 2.4;
              const oCos = Math.cos(octAngle);
              const oSin = Math.sin(octAngle);
              const orx = rx * oCos - ry * oSin;
              const ory = rx * oSin + ry * oCos;
              const raw = Math.sin(orx * scale + noiseDirection * 0.1 * frequency) *
                          Math.cos(ory * scale + noiseDirection * 0.1 * frequency);
              const n = noiseType === 'ridged'      ? 1 - Math.abs(raw)
                      : noiseType === 'turbulence'  ? Math.abs(raw)
                      : raw;
              combinedNoise += n * amplitude;
              totalAmplitude += amplitude;
              amplitude *= 0.5;
            }

            // Normalize to 0-1 (ridged/turbulence already 0-1 range, smooth is -1 to 1)
            combinedNoise = noiseType === 'smooth'
              ? (combinedNoise / totalAmplitude + 1) / 2
              : combinedNoise / totalAmplitude;

            // Shift color position with treble so palette rotates on audio
            const shiftedPos = (combinedNoise + noiseColorShift) % 1;
            const colorPos = shiftedPos * (gradientColors.length - 1);
            const colorIdx = Math.floor(colorPos);
            const colorFrac = colorPos - colorIdx;
            const color1 = gradientColors[colorIdx % gradientColors.length];
            const color2 = gradientColors[(colorIdx + 1) % gradientColors.length];

            if (!color1 || !color2) continue;

            // Radial brightness pulse from center on bass
            const dist = Math.sqrt(ndx * ndx + ndy * ndy);
            const radialPulse = noiseBassBoost * (1 - dist / maxNoiseDist) * 0.8;
            const boost = 1 + radialPulse;

            const idx = (ny * displayWidth + nx) * 4;
            noiseData[idx]     = Math.min(255, Math.round((color1.r + (color2.r - color1.r) * colorFrac) * boost));
            noiseData[idx + 1] = Math.min(255, Math.round((color1.g + (color2.g - color1.g) * colorFrac) * boost));
            noiseData[idx + 2] = Math.min(255, Math.round((color1.b + (color2.b - color1.b) * colorFrac) * boost));
            noiseData[idx + 3] = 255;
          }
        }
        putScaledImageData(noiseImageData);
        break;

      case 'topographic': {
        // Posterized noise field with a dark contour line drawn at every band
        // boundary — same idea as elevation-line maps. Deliberately a
        // simpler, self-contained noise formula (not sharing Noise's own
        // sliders) so Topographic has its own independent Scale/Bands/Line
        // controls rather than fighting over shared state.
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        const topoImageData = ctx.createImageData(displayWidth, displayHeight);
        const topoData = topoImageData.data;
        const topoCX = displayWidth / 2, topoCY = displayHeight / 2;
        const topoScaleFactor = topographicScale * 0.001;
        const topoBands = Math.max(2, Math.round(topographicBands));
        const topoLineWidth = topographicLineWidth;
        const topoAudioActive = isAudioEnabled && isAudioReactive;
        const topoColorShift = topoAudioActive ? audioTrebleLevel * 0.4 : 0;
        // A slow drift tied to gradientAngle so the field isn't perfectly
        // static — matches how other gradients keep moving under auto-play.
        const topoPhase = gradientAngle * 0.01;

        for (let ty = 0; ty < displayHeight; ty++) {
          for (let tx = 0; tx < displayWidth; tx++) {
            const dx = tx - topoCX, dy = ty - topoCY;
            const n1 = Math.sin(dx * topoScaleFactor + topoPhase) * Math.cos(dy * topoScaleFactor * 1.15 - topoPhase);
            const n2 = Math.sin((dx + dy) * topoScaleFactor * 0.5) * 0.5;
            const n3 = Math.cos((dx - dy) * topoScaleFactor * 0.37) * 0.35;
            const raw = (n1 + n2 + n3) / 1.85;
            const elevation = (raw + 1) / 2;

            const bandPos = elevation * topoBands;
            const bandIdx = Math.floor(bandPos);
            const bandFrac = bandPos - bandIdx;
            const distToLine = Math.min(bandFrac, 1 - bandFrac);

            const t = ((bandIdx / topoBands) + topoColorShift) % 1;
            const colorPos = t * (gradientColors.length - 1);
            const colorIdx = Math.floor(colorPos);
            const colorFrac = colorPos - colorIdx;
            const c1 = gradientColors[colorIdx] || gradientColors[0];
            const c2 = gradientColors[Math.min(colorIdx + 1, gradientColors.length - 1)] || c1;
            let r = c1.r + (c2.r - c1.r) * colorFrac;
            let g = c1.g + (c2.g - c1.g) * colorFrac;
            let b = c1.b + (c2.b - c1.b) * colorFrac;

            if (distToLine < topoLineWidth) {
              const lineMix = 1 - (distToLine / topoLineWidth);
              r *= (1 - lineMix * 0.85);
              g *= (1 - lineMix * 0.85);
              b *= (1 - lineMix * 0.85);
            }

            const idx = (ty * displayWidth + tx) * 4;
            topoData[idx] = Math.round(Math.min(255, Math.max(0, r)));
            topoData[idx + 1] = Math.round(Math.min(255, Math.max(0, g)));
            topoData[idx + 2] = Math.round(Math.min(255, Math.max(0, b)));
            topoData[idx + 3] = 255;
          }
        }
        putScaledImageData(topoImageData);
        break;
      }

      case 'plasma':
        // Animated plasma effect - smooth rendering
        const plasmaImageData = ctx.createImageData(displayWidth, displayHeight);
        const plasmaData = plasmaImageData.data;

        const plasmaAudioActive = isAudioEnabled && isAudioReactive;
        const audioPlasmaComplexity = plasmaAudioActive ? audioSubBassLevel * 50 : 0;
        const plasmaZoom = plasmaAudioActive ? 1 : zoom;
        const plasmaScale = ((plasmaComplexity + audioPlasmaComplexity) * 0.004) / (plasmaZoom * plasmaZoomScale);
        // Treble shifts color palette; bass radial pulse from center
        const plasmaColorShift = plasmaAudioActive ? audioTrebleLevel * 0.6 : 0;
        const plasmaBassPulse = plasmaAudioActive ? audioSubBassLevel : 0;
        const plasmaMaxDist = Math.sqrt(centerX ** 2 + centerY ** 2);

        const plasmaCX = displayWidth / 2;
        const plasmaCY = displayHeight / 2;
        for (let py = 0; py < displayHeight; py++) {
          for (let px = 0; px < displayWidth; px++) {
            const dx = px - plasmaCX;
            const dy = py - plasmaCY;
            const value = (
              Math.sin(px * plasmaScale + gradientAngle * 0.05) +
              Math.sin(py * plasmaScale + gradientAngle * 0.05) +
              Math.sin((px + py) * plasmaScale * 0.75) +
              Math.sin(Math.sqrt(dx * dx + dy * dy) * plasmaScale + gradientAngle * 0.05)
            ) / 4 + 0.5;

            const shiftedValue = (value + plasmaColorShift) % 1;
            const colorPos = shiftedValue * (gradientColors.length - 1);
            const colorIdx = Math.floor(colorPos);
            const colorFrac = colorPos - colorIdx;
            const color1 = gradientColors[colorIdx % gradientColors.length];
            const color2 = gradientColors[(colorIdx + 1) % gradientColors.length];
            if (!color1 || !color2) continue;

            const dist = Math.sqrt(dx * dx + dy * dy);
            const radialBoost = 1 + plasmaBassPulse * (1 - dist / plasmaMaxDist) * 0.8;
            const idx = (py * displayWidth + px) * 4;
            plasmaData[idx]     = Math.min(255, Math.round((color1.r + (color2.r - color1.r) * colorFrac) * radialBoost));
            plasmaData[idx + 1] = Math.min(255, Math.round((color1.g + (color2.g - color1.g) * colorFrac) * radialBoost));
            plasmaData[idx + 2] = Math.min(255, Math.round((color1.b + (color2.b - color1.b) * colorFrac) * radialBoost));
            plasmaData[idx + 3] = 255;
          }
        }
        putScaledImageData(plasmaImageData);
        break;
      
      case 'grid': {
        // Grid pattern with customizable rows and columns
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, displayWidth, displayHeight);

        ctx.save();
        ctx.translate(centerX, centerY);
        const gridZoom = (isAudioEnabled && isAudioReactive) ? 1 : zoom;
        ctx.scale(gridZoom, gridZoom);
        ctx.translate(-centerX, -centerY);

        // Audio reactivity: bass affects gradient animation in cells.
        // Clamped for the same reason as audioAdjustedAngle above —
        // audioSubBassLevel isn't naturally 0-1.
        const audioGridOffset = (isAudioEnabled && isAudioReactive)
          ? Math.min(1, audioSubBassLevel) * 360 : 0;

        // Expand draw area to cover canvas when zoomed out
        const gridOverdraw = Math.max(1, 1 / gridZoom);
        const gridDrawW = displayWidth * gridOverdraw;
        const gridDrawH = displayHeight * gridOverdraw;
        const gridOffX = (displayWidth - gridDrawW) / 2;
        const gridOffY = (displayHeight - gridDrawH) / 2;
        // Clamp to 2+ — 1x1 degenerates into a single full-canvas cell
        // that's visually indistinguishable from the Linear gradient type,
        // wasting the slider on a redundant look. Guards old saved
        // presets/localStorage from before this floor existed too.
        const gridRowsSafe = Math.max(2, gridRows);
        const gridColumnsSafe = Math.max(2, gridColumns);
        const cellWidth = gridDrawW / gridColumnsSafe;
        const cellHeight = gridDrawH / gridRowsSafe;

        for (let row = 0; row < gridRowsSafe; row++) {
          for (let col = 0; col < gridColumnsSafe; col++) {
            const cellAngle = (gradientAngle + row * 30 + col * 30 + audioGridOffset) % 360;
            const angleRad = (cellAngle * Math.PI) / 180;
            const cellCenterX = gridOffX + col * cellWidth + cellWidth / 2;
            const cellCenterY = gridOffY + row * cellHeight + cellHeight / 2;
            const gradLength = Math.max(cellWidth, cellHeight);
            const x1 = cellCenterX - Math.cos(angleRad) * gradLength / 2;
            const y1 = cellCenterY - Math.sin(angleRad) * gradLength / 2;
            const x2 = cellCenterX + Math.cos(angleRad) * gradLength / 2;
            const y2 = cellCenterY + Math.sin(angleRad) * gradLength / 2;
            const cellGrad = ctx.createLinearGradient(x1, y1, x2, y2);
            for (let j = 0; j < gradientColors.length; j++) {
              const cellColor = gradientColors[(j + row + col) % gradientColors.length];
              if (!cellColor) continue;
              cellGrad.addColorStop(j / (gradientColors.length - 1),
                `rgb(${cellColor.r}, ${cellColor.g}, ${cellColor.b})`);
            }
            ctx.fillStyle = cellGrad;
            ctx.fillRect(gridOffX + col * cellWidth, gridOffY + row * cellHeight, Math.ceil(cellWidth) + 1, Math.ceil(cellHeight) + 1);
          }
        }
        ctx.restore();
        break;
      }
      
      case 'helix':
        // Conical gradient with spiral
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        const spiralImageData = ctx.createImageData(displayWidth, displayHeight);
        const spiralData = spiralImageData.data;
        
        const conicalAudioActive = isAudioEnabled && isAudioReactive;
        // Bass pulses tightness (spiral density)
        const audioConicalTightness = conicalAudioActive ? audioSubBassLevel * 4 : 0;
        // Mids change turn count
        const audioConicalTurns = conicalAudioActive ? audioMidsLevel * 3 : 0;
        const conicalZoom = conicalAudioActive ? 1 : zoom;
        // Treble shifts color palette; bass radial pulse
        const conicalColorShift = conicalAudioActive ? audioTrebleLevel * 0.6 : 0;
        const conicalBassPulse = conicalAudioActive ? audioSubBassLevel : 0;
        const conicalMaxDist = Math.sqrt(centerX ** 2 + centerY ** 2);

        for (let sy = 0; sy < displayHeight; sy++) {
          for (let sx = 0; sx < displayWidth; sx++) {
            const dx = sx - centerX;
            const dy = sy - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const spiralAngle = Math.atan2(dy, dx);
            const rawAngle = spiralAngle + (dist * (helixTightness + audioConicalTightness) * 0.01) * (helixTurns + audioConicalTurns) / conicalZoom + gradientAngle * DEG_TO_RAD;
            const finalAngle = ((rawAngle % TWO_PI) + TWO_PI) % TWO_PI;
            const normalizedAngle = finalAngle / TWO_PI;

            const shiftedAngle = (normalizedAngle + conicalColorShift) % 1;
            const colorPos = shiftedAngle * (gradientColors.length - 1);
            const colorIdx = Math.floor(colorPos);
            const colorFrac = colorPos - colorIdx;
            const color1 = gradientColors[colorIdx % gradientColors.length];
            const color2 = gradientColors[(colorIdx + 1) % gradientColors.length];
            if (!color1 || !color2) continue;

            const radialBoost = 1 + conicalBassPulse * (1 - dist / conicalMaxDist) * 0.8;
            const pixelIndex = (sy * displayWidth + sx) * 4;
            spiralData[pixelIndex]     = Math.min(255, Math.round((color1.r + (color2.r - color1.r) * colorFrac) * radialBoost));
            spiralData[pixelIndex + 1] = Math.min(255, Math.round((color1.g + (color2.g - color1.g) * colorFrac) * radialBoost));
            spiralData[pixelIndex + 2] = Math.min(255, Math.round((color1.b + (color2.b - color1.b) * colorFrac) * radialBoost));
            spiralData[pixelIndex + 3] = 255;
          }
        }
        putScaledImageData(spiralImageData);
        break;
      
      case 'radial-burst': {
        // Multiple radial gradients - centered and sized to fit window on load
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        const burstCount = radialBurstCount;
        // When audio active, skip 1/zoom so sub-bass pulse doesn't shrink bursts
        const burstScale = (isAudioEnabled && isAudioReactive) ? 1 : 1 / zoom;
        const sizeScale = radialBurstSize / 100;
        const burstRadius = fitRadius * 0.7;
        const isAudioActive = isAudioEnabled && isAudioReactive;
        const audioBass = isAudioActive ? audioSubBassLevel : 0;
        const audioMids = isAudioActive ? audioMidsLevel : 0;
        // Bass expands spread, mids boost brightness, both scale burst size
        const audioBurstSpread = audioBass * 120;
        const spreadFactor = (radialBurstSpread + audioBurstSpread) * 0.01;
        const audioSizeBoost = 1 + audioBass * 1.2 + audioMids * 0.4;
        const audioBrightness = 1 + audioBass * 1.5 + audioMids * 0.8;

        for (let i = 0; i < burstCount; i++) {
          const burstAngle = (i * 360 / burstCount + gradientAngle) * DEG_TO_RAD;
          const offsetDist = fitRadius * spreadFactor * burstScale * sizeScale;
          const burstX = centerX + Math.cos(burstAngle) * offsetDist;
          const burstY = centerY + Math.sin(burstAngle) * offsetDist;
          const burstRadiusValue = Math.max(0, burstRadius * burstScale * sizeScale * audioSizeBoost);
          const burstGrad = ctx.createRadialGradient(burstX, burstY, 0, burstX, burstY, burstRadiusValue);
          const burstColor = gradientColors[i % gradientColors.length];
          if (!burstColor) continue;
          const br = Math.min(255, Math.round(burstColor.r * audioBrightness));
          const bg = Math.min(255, Math.round(burstColor.g * audioBrightness));
          const bb = Math.min(255, Math.round(burstColor.b * audioBrightness));
          burstGrad.addColorStop(0, `rgb(${br}, ${bg}, ${bb})`);
          burstGrad.addColorStop(0.5, `rgba(${br}, ${bg}, ${bb}, 0.6)`);
          burstGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = burstGrad;
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillRect(0, 0, displayWidth, displayHeight);
        }
        ctx.globalCompositeOperation = 'source-over';
        break;
      }

      case 'freeform':
        // Freeform gradient with color pins
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        
        // Audio reactivity: bass affects pin radius
        const audioFreeformRadius = (isAudioEnabled && isAudioReactive) 
          ? audioSubBassLevel * 200 // Up to 200 extra radius
          : 0;
        
        // Create a pixel-based blend using distance to each pin
        const imageData = ctx.createImageData(displayWidth, displayHeight);
        const data = imageData.data;
        
        for (let y = 0; y < displayHeight; y++) {
          for (let x = 0; x < displayWidth; x++) {
            let totalWeight = 0;
            let r = 0, g = 0, b = 0;
            
            // Calculate influence from each pin
            colorPins.forEach(pin => {
              const pinX = pin.x * displayWidth;
              const pinY = pin.y * displayHeight;
              const dx = x - pinX;
              const dy = y - pinY;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              // Use inverse distance squared for smooth falloff, with audio reactivity
              const effectiveRadius = pin.radius + audioFreeformRadius;
              const influence = effectiveRadius / (distance + 1);
              const weight = Math.pow(influence, 2);
              
              r += pin.color.r * weight;
              g += pin.color.g * weight;
              b += pin.color.b * weight;
              totalWeight += weight;
            });
            
            // Normalize colors
            if (totalWeight > 0) {
              const idx = (y * displayWidth + x) * 4;
              data[idx] = Math.min(255, r / totalWeight);
              data[idx + 1] = Math.min(255, g / totalWeight);
              data[idx + 2] = Math.min(255, b / totalWeight);
              data[idx + 3] = 255;
            }
          }
        }
        
        putScaledImageData(imageData);
        break;

      case 'voronoi':
        // Voronoi (Cellular) gradient - creates stained glass/cell structure effect
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, displayWidth, displayHeight);

        const voronoiImageData = ctx.createImageData(displayWidth, displayHeight);
        const voronoiData = voronoiImageData.data;

        // Seeded random number generator for animated pattern
        const voronoiSeed = (x: number) => {
          const s = Math.sin(x * 12.9898 + voronoiCellCount * 78.233) * 43758.5453;
          return s - Math.floor(s);
        };

        // Generate seed points with animated positions
        const voronoiSeeds: Array<{x: number, y: number, colorIndex: number}> = [];
        const voronoiAudioActive = isAudioEnabled && isAudioReactive;
        // Bass adds extra cells, treble shifts color assignment, mids add extra movement
        const audioVoronoiCount = voronoiAudioActive ? Math.floor(audioSubBassLevel * 15) : 0;
        const totalVoronoiCells = voronoiCellCount + audioVoronoiCount;
        // Treble: integer offset into palette so each beat can assign different colors
        const voronoiColorOffset = voronoiAudioActive
          ? Math.floor(audioTrebleLevel * gradientColors.length * 3) % gradientColors.length
          : 0;

        for (let i = 0; i < totalVoronoiCells; i++) {
          const baseX = voronoiSeed(i * 2) * displayWidth;
          const baseY = voronoiSeed(i * 2 + 1) * displayHeight;

          // Bass gently accelerates morph, mids add subtle extra movement
          const audioMorphBoost = voronoiAudioActive ? 1 + audioSubBassLevel * 3 : 1;
          const audioMidShift = voronoiAudioActive ? audioMidsLevel * 0.1 : 0;
          const offsetX = Math.sin(voronoiAnimTime * audioMorphBoost + i * 0.5 + audioMidShift) * displayWidth * 0.18;
          const offsetY = Math.cos(voronoiAnimTime * audioMorphBoost + i * 0.7 + audioMidShift) * displayHeight * 0.18;

          voronoiSeeds.push({
            x: baseX + offsetX,
            y: baseY + offsetY,
            colorIndex: i % gradientColors.length
          });
        }

        const audioVoronoiDistortion = voronoiAudioActive ? audioSubBassLevel * 80 : 0;
        const totalVoronoiDistortion = (voronoiDistortion + audioVoronoiDistortion) * 0.01;
        const vMaxDist = Math.sqrt(centerX ** 2 + centerY ** 2);
        const voronoiBassPulse = voronoiAudioActive ? audioSubBassLevel : 0;

        for (let vy = 0; vy < displayHeight; vy++) {
          for (let vx = 0; vx < displayWidth; vx++) {
            let minDist = Infinity;
            let nearestSeed = voronoiSeeds[0];

            voronoiSeeds.forEach(seed => {
              const dx = vx - seed.x;
              const dy = vy - seed.y;
              const distortion = totalVoronoiDistortion * (Math.sin(dx * 0.01) * Math.cos(dy * 0.01)) * 100;
              const dist = Math.sqrt(dx * dx + dy * dy) + distortion;
              if (dist < minDist) { minDist = dist; nearestSeed = seed; }
            });

            // Use solid palette colors — shift index on treble for color cycling
            const vColorIdx = (nearestSeed.colorIndex + voronoiColorOffset) % gradientColors.length;
            const color = gradientColors[vColorIdx];
            if (!color) continue;

            const vdx = vx - centerX, vdy = vy - centerY;
            const vDist = Math.sqrt(vdx * vdx + vdy * vdy);
            // Radial pulse + uniform flash on strong bass hits
            const vBoost = 1 + voronoiBassPulse * (1 - vDist / vMaxDist) * 0.9;

            const idx = (vy * displayWidth + vx) * 4;
            voronoiData[idx]     = Math.min(255, Math.round(color.r * vBoost));
            voronoiData[idx + 1] = Math.min(255, Math.round(color.g * vBoost));
            voronoiData[idx + 2] = Math.min(255, Math.round(color.b * vBoost));
            voronoiData[idx + 3] = 255;
          }
        }
        
        putScaledImageData(voronoiImageData);
        break;

      case 'iridescent':
        // Iridescent (Spectral) gradient - thin-film interference effect
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        
        const iridescentImageData = ctx.createImageData(displayWidth, displayHeight);
        const iridescentData = iridescentImageData.data;
        
        // Audio reactivity: bass affects interference angle
        const audioIridescentAngle = (isAudioEnabled && isAudioReactive) 
          ? audioSubBassLevel * 180 // Up to 180 degree shift
          : 0;
        const totalIridescentAngle = (iridescentAngle + gradientAngle + audioIridescentAngle) * DEG_TO_RAD;
        
        // Audio reactivity: mids affect intensity
        const audioIridescentIntensity = (isAudioEnabled && isAudioReactive) 
          ? audioSubBassLevel * 0.5 // Up to 0.5 extra intensity
          : 0;
        const totalIridescentIntensity = iridescentIntensity + audioIridescentIntensity;
        
        for (let iy = 0; iy < displayHeight; iy++) {
          for (let ix = 0; ix < displayWidth; ix++) {
            const dx = ix - centerX;
            const dy = iy - centerY;
            
            // Calculate viewing angle (simulates looking at surface from different angles)
            const angle = Math.atan2(dy, dx);
            const iridescentZoom = (isAudioEnabled && isAudioReactive) ? 1 : zoom;
            const dist = Math.sqrt(dx * dx + dy * dy) / iridescentZoom;
            
            // Thin-film interference calculation
            // Creates rainbow-like color shifts based on angle and distance
            const interference = Math.sin(angle * 3 + totalIridescentAngle) * 
                               Math.cos(dist * 0.01 * iridescentScale) * 
                               totalIridescentIntensity;
            
            // Map interference to color spectrum
            const hue = ((interference + 1) * 0.5 * 360) % 360;
            
            // Convert HSV to RGB for spectral effect
            const h = hue / 60;
            const c = totalIridescentIntensity;
            const x = c * (1 - Math.abs((h % 2) - 1));
            
            let r = 0, g = 0, b = 0;
            if (h >= 0 && h < 1) { r = c; g = x; b = 0; }
            else if (h >= 1 && h < 2) { r = x; g = c; b = 0; }
            else if (h >= 2 && h < 3) { r = 0; g = c; b = x; }
            else if (h >= 3 && h < 4) { r = 0; g = x; b = c; }
            else if (h >= 4 && h < 5) { r = x; g = 0; b = c; }
            else if (h >= 5 && h < 6) { r = c; g = 0; b = x; }
            
            // Treble shifts color palette; bass radial pulse from center
            const iriColorShift = (isAudioEnabled && isAudioReactive) ? audioTrebleLevel * 0.6 : 0;
            const iriBassPulse = (isAudioEnabled && isAudioReactive) ? audioSubBassLevel : 0;
            const iriMaxDist = Math.sqrt(centerX ** 2 + centerY ** 2);
            const iriDist2 = Math.sqrt(dx * dx + dy * dy);
            const iriRadialBoost = 1 + iriBassPulse * (1 - iriDist2 / iriMaxDist) * 0.8;

            const rawColorPos = ((interference + 1) * 0.5 + iriColorShift) % 1;
            const colorPos = rawColorPos * (gradientColors.length - 1);
            const colorIdx = Math.floor(colorPos);
            const colorFrac = colorPos - colorIdx;
            const color1 = gradientColors[colorIdx % gradientColors.length];
            const color2 = gradientColors[(colorIdx + 1) % gradientColors.length];
            if (!color1 || !color2) continue;

            const baseR = (color1.r + (color2.r - color1.r) * colorFrac) * iriRadialBoost;
            const baseG = (color1.g + (color2.g - color1.g) * colorFrac) * iriRadialBoost;
            const baseB = (color1.b + (color2.b - color1.b) * colorFrac) * iriRadialBoost;

            const idx = (iy * displayWidth + ix) * 4;
            iridescentData[idx]     = Math.min(255, baseR * (1 - totalIridescentIntensity * 0.5) + r * 255 * totalIridescentIntensity);
            iridescentData[idx + 1] = Math.min(255, baseG * (1 - totalIridescentIntensity * 0.5) + g * 255 * totalIridescentIntensity);
            iridescentData[idx + 2] = Math.min(255, baseB * (1 - totalIridescentIntensity * 0.5) + b * 255 * totalIridescentIntensity);
            iridescentData[idx + 3] = 255;
          }
        }
        
        putScaledImageData(iridescentImageData);
        break;

      case 'aurora': {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        const auroraAudio = isAudioEnabled && isAudioReactive;
        const audioBassA = auroraAudio ? audioSubBassLevel / 5 : 0;   // 0-1
        const audioMidsA = auroraAudio ? audioMidsLevel / 5 : 0;
        const auroraTime = auroraAnimTime * (auroraWaveSpeed + audioMidsA * 4) + gradientAngle * 0.01;
        const auroraAudioBoost = 1 + audioBassA * 3.0;           // bands expand on bass
        const auroraWaveAmp  = 1 + audioBassA * 2.5;             // wave ripples harder
        const auroraAlphaBoost = 1 + audioBassA * 1.5;           // brightness flares
        const auroraColorShift = auroraAudio ? audioTrebleLevel * 0.8 : 0;
        const numBands = auroraBandCount;
        for (let b = 0; b < numBands; b++) {
          const bandY = (displayHeight * (b + 0.5)) / numBands;
          const bandHeight = (displayHeight / numBands) * auroraBandHeight * auroraAudioBoost;
          const colorIdx = ((b + Math.floor(auroraColorShift * gradientColors.length)) % gradientColors.length + gradientColors.length) % gradientColors.length;
          const color = gradientColors[colorIdx] || gradientColors[0];
          if (!color) continue;
          for (let x = 0; x < displayWidth; x++) {
            const nx = x / displayWidth;
            const wave = Math.sin(nx * 4 + auroraTime + b * 1.3) * 0.5 * auroraWaveAmp +
                         Math.sin(nx * 7 - auroraTime * 1.4 + b * 0.9) * 0.25 * auroraWaveAmp +
                         Math.sin(nx * 2 + auroraTime * 0.7) * 0.25;
            const cy = bandY + wave * bandHeight * 0.4;
            const nextColorIdx = ((colorIdx + 1) % gradientColors.length + gradientColors.length) % gradientColors.length;
            const nextColor = gradientColors[nextColorIdx] || color;
            const blend = (Math.sin(nx * Math.PI * 2 + auroraTime * 0.3 + b) * 0.5 + 0.5);
            const mixR = Math.round(color.r + (nextColor.r - color.r) * blend);
            const mixG = Math.round(color.g + (nextColor.g - color.g) * blend);
            const mixB = Math.round(color.b + (nextColor.b - color.b) * blend);
            const grad = ctx.createLinearGradient(x, cy - bandHeight * 0.5, x, cy + bandHeight * 0.5);
            const alpha = Math.min(1, (0.55 + Math.abs(wave) * 0.3) * auroraAlphaBoost);
            grad.addColorStop(0, `rgba(${mixR},${mixG},${mixB},0)`);
            grad.addColorStop(0.4, `rgba(${mixR},${mixG},${mixB},${alpha})`);
            grad.addColorStop(0.6, `rgba(${mixR},${mixG},${mixB},${alpha})`);
            grad.addColorStop(1, `rgba(${mixR},${mixG},${mixB},0)`);
            ctx.fillStyle = grad;
            ctx.fillRect(x, cy - bandHeight * 0.5, 1, bandHeight);
          }
        }
        break;
      }

      case 'caustics': {
        ctx.fillStyle = '#000814';
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        const causticsAudio = isAudioEnabled && isAudioReactive;
        const audioBassC = causticsAudio ? audioSubBassLevel / 5 : 0;   // 0-1
        const audioMidsC = causticsAudio ? audioMidsLevel / 5 : 0;
        const ct = causticsAnimTime + gradientAngle * 0.02;
        // Bass drives brightness + freq distortion; mids warps phase
        const causticsFreqBoost = 1 + audioBassC * 1.8;
        const causticsBrightnessExp = Math.max(0.3, causticsBrightness - audioBassC * 1.2);
        const causticsPhaseWarp = audioMidsC * 2.5;
        const causticsColorShift = causticsAudio ? audioTrebleLevel * 0.7 : 0;
        const causticsLightFloor = 0.1 + audioBassC * 0.4;  // black areas light up on bass
        const imageData = ctx.createImageData(displayWidth, displayHeight);
        const d = imageData.data;
        const cScaleXY = causticsScale / displayWidth;
        const scaleX = cScaleXY * 4 / zoom;
        const scaleY = (causticsScale / displayHeight) * 4 / zoom;
        const cFreq = causticsFreqBoost;
        for (let y = 0; y < displayHeight; y++) {
          for (let x = 0; x < displayWidth; x++) {
            const nx = (x - centerX) * scaleX;
            const ny = (y - centerY) * scaleY;
            const w1 = Math.sin(nx * 2.1 * cFreq + Math.sin(ny * 1.3 * cFreq + ct + causticsPhaseWarp) + ct * 0.7);
            const w2 = Math.sin(ny * 2.3 * cFreq + Math.sin(nx * 1.7 * cFreq - ct * 0.8 + causticsPhaseWarp) - ct * 0.5);
            const w3 = Math.sin((nx + ny) * 1.5 * cFreq + ct * 1.1);
            const v = Math.min(1, Math.pow(Math.abs(w1 + w2 + w3) / 3, causticsBrightnessExp) + causticsLightFloor);
            const tVal = (Math.sin(v * Math.PI) * 0.5 + 0.5 + causticsColorShift) % 1;
            const ci = Math.floor(tVal * (gradientColors.length - 1));
            const ci2 = (ci + 1) % gradientColors.length;
            const lt = tVal * (gradientColors.length - 1) - ci;
            const c1 = gradientColors[ci] || { r: 0, g: 100, b: 200 };
            const c2 = gradientColors[ci2] || c1;
            const idx = (y * displayWidth + x) * 4;
            d[idx]     = Math.min(255, Math.round((c1.r + (c2.r - c1.r) * lt) * (0.3 + v * 0.7)));
            d[idx + 1] = Math.min(255, Math.round((c1.g + (c2.g - c1.g) * lt) * (0.3 + v * 0.7)));
            d[idx + 2] = Math.min(255, Math.round((c1.b + (c2.b - c1.b) * lt) * (0.3 + v * 0.7)));
            d[idx + 3] = 255;
          }
        }
        putScaledImageData(imageData);
        break;
      }

      case 'lava-lamp': {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        const lavaAudio = isAudioEnabled && isAudioReactive;
        const audioBassL = lavaAudio ? audioSubBassLevel / 5 : 0;   // 0-1
        const audioMidsL = lavaAudio ? audioMidsLevel / 5 : 0;
        const lt = lavaAnimTime + gradientAngle * 0.02;
        // Bass pulses blob size hard; mids speeds orbit; both boost brightness
        const lavaAudioScale = 1 + audioBassL * 3.0;         // blobs expand on bass
        const lavaOrbitBoost = 1 + audioMidsL * 3.0;         // orbit speed up on mids
        const lavaBrightBoost = 1 + audioBassL * 2.0;        // brightness flares
        const lavaColorShift = lavaAudio ? audioTrebleLevel * 0.8 : 0;
        const imageData2 = ctx.createImageData(displayWidth, displayHeight);
        const d2 = imageData2.data;
        const lavaTime = lt * lavaSpeed * lavaOrbitBoost;
        const numBlobs = Math.max(2, Math.min(lavaBlobCount, 12));
        const blobs: Array<{x: number, y: number, r: number}> = [];
        for (let i = 0; i < numBlobs; i++) {
          const angle = (i / numBlobs) * Math.PI * 2 + lavaTime * (0.3 + i * 0.07);
          const orbitR = 0.25 + 0.15 * Math.sin(lavaTime * 0.4 + i * 1.1);
          blobs.push({
            x: centerX + displayWidth * orbitR * Math.cos(angle),
            y: centerY + displayHeight * orbitR * Math.sin(angle * 0.7 + lavaTime * 0.2),
            r: (Math.min(displayWidth, displayHeight) * lavaBlobSize + Math.sin(lavaTime + i) * 0.04 * displayWidth) * lavaAudioScale,
          });
        }
        const scaleF = 1 / zoom;
        for (let y = 0; y < displayHeight; y++) {
          for (let x = 0; x < displayWidth; x++) {
            const px2 = centerX + (x - centerX) * scaleF;
            const py2 = centerY + (y - centerY) * scaleF;
            let field = 0;
            let colorR = 0, colorG = 0, colorB = 0, colorW = 0;
            for (let b = 0; b < blobs.length; b++) {
              const dx2 = px2 - blobs[b].x;
              const dy2 = py2 - blobs[b].y;
              const dist2 = dx2 * dx2 + dy2 * dy2;
              const influence = (blobs[b].r * blobs[b].r) / (dist2 + 1);
              field += influence;
              const ci3 = ((b + Math.floor(lavaColorShift * gradientColors.length)) % gradientColors.length + gradientColors.length) % gradientColors.length;
              const c = gradientColors[ci3] || { r: 255, g: 80, b: 20 };
              colorR += c.r * influence;
              colorG += c.g * influence;
              colorB += c.b * influence;
              colorW += influence;
            }
            const t3 = Math.min(1, Math.max(0, (field - 0.7) * 3));
            const brightness = (t3 > 0 ? 1 : Math.min(1, field * 0.3)) * lavaBrightBoost;
            const idx2 = (y * displayWidth + x) * 4;
            const fr = colorW > 0 ? colorR / colorW : 0;
            const fg = colorW > 0 ? colorG / colorW : 0;
            const fb = colorW > 0 ? colorB / colorW : 0;
            d2[idx2]     = Math.round(fr * brightness);
            d2[idx2 + 1] = Math.round(fg * brightness);
            d2[idx2 + 2] = Math.round(fb * brightness);
            d2[idx2 + 3] = 255;
          }
        }
        putScaledImageData(imageData2);
        break;
      }

      case 'marble': {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        const marbleAudio = isAudioEnabled && isAudioReactive;
        const mt = marbleAnimTime + gradientAngle * 0.015;
        const audioBassM = marbleAudio ? audioSubBassLevel / 5 : 0;   // 0-1
        const audioMidsM = marbleAudio ? audioMidsLevel / 5 : 0;
        // Bass cranks turbulence + vein frequency; mids boosts octave richness
        const marbleAudioFreq = 1 + audioBassM * 2.5;
        const marbleTurbBoost = 1 + audioBassM * 4.0;      // veins writhe on bass
        const marbleVeinBoost = 1 + audioBassM * 3.0;      // vein spacing tightens
        const marbleOctAmpBoost = 1 + audioMidsM * 2.0;    // richer texture on mids
        const marbleColorShift = marbleAudio ? audioTrebleLevel * 0.8 : 0;
        const imageData3 = ctx.createImageData(displayWidth, displayHeight);
        const d3 = imageData3.data;
        const mScale = (1 / zoom) * 3;
        const mOctaves = Math.round(marbleOctaves);
        for (let y = 0; y < displayHeight; y++) {
          for (let x = 0; x < displayWidth; x++) {
            const nx2 = (x - centerX) / displayWidth * mScale;
            const ny2 = (y - centerY) / displayHeight * mScale;
            let turb = 0;
            let freq = 1 * marbleAudioFreq;
            let amp = 1;
            for (let oct = 0; oct < mOctaves; oct++) {
              turb += Math.sin(nx2 * freq + mt * 0.3) * Math.cos(ny2 * freq * 0.8 - mt * 0.2) * amp * marbleOctAmpBoost;
              turb += Math.sin((nx2 + ny2) * freq * 0.7 + mt * 0.5) * amp * 0.5;
              freq *= 2.1;
              amp *= 0.5;
            }
            const vein = Math.sin(nx2 * marbleVeinFreq * marbleVeinBoost + turb * marbleTurbulence * marbleTurbBoost + mt * 0.1) * 0.5 + 0.5;
            const tVal2 = (vein + marbleColorShift) % 1;
            const ci4 = Math.floor(tVal2 * (gradientColors.length - 1));
            const ci5 = (ci4 + 1) % gradientColors.length;
            const lt2 = tVal2 * (gradientColors.length - 1) - ci4;
            const c4 = gradientColors[ci4] || { r: 200, g: 200, b: 200 };
            const c5 = gradientColors[ci5] || c4;
            const idx3 = (y * displayWidth + x) * 4;
            d3[idx3]     = Math.round(c4.r + (c5.r - c4.r) * lt2);
            d3[idx3 + 1] = Math.round(c4.g + (c5.g - c4.g) * lt2);
            d3[idx3 + 2] = Math.round(c4.b + (c5.b - c4.b) * lt2);
            d3[idx3 + 3] = 255;
          }
        }
        putScaledImageData(imageData3);
        break;
      }

      case 'metaballs': {
        // Like Lava Lamp's field-function blobs, but colored continuously
        // across the whole field (no on/off brightness threshold) so
        // overlapping blobs actually blend into each other rather than
        // reading as separate glowing shapes on a black background.
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        const metaAudio = isAudioEnabled && isAudioReactive;
        const audioBassMb = metaAudio ? audioSubBassLevel / 5 : 0;
        const audioMidsMb = metaAudio ? audioMidsLevel / 5 : 0;
        const mbTime = (metaballAnimTime + gradientAngle * 0.02) * (1 + audioMidsMb * 2);
        const mbScaleBoost = 1 + audioBassMb * 2.0;
        const mbColorShift = metaAudio ? audioTrebleLevel * 0.8 : 0;
        const imageDataMb = ctx.createImageData(displayWidth, displayHeight);
        const dMb = imageDataMb.data;
        const numBalls = Math.max(2, Math.min(metaballCount, 14));
        const balls: Array<{x: number, y: number, r: number}> = [];
        for (let i = 0; i < numBalls; i++) {
          const angle = (i / numBalls) * Math.PI * 2 + mbTime * (0.25 + i * 0.05);
          const orbitR = 0.2 + 0.18 * Math.sin(mbTime * 0.3 + i * 1.3);
          balls.push({
            x: centerX + displayWidth * orbitR * Math.cos(angle),
            y: centerY + displayHeight * orbitR * Math.sin(angle * 0.8 + mbTime * 0.15),
            r: Math.min(displayWidth, displayHeight) * metaballSize * mbScaleBoost,
          });
        }
        const mbZoomScale = 1 / zoom;
        for (let y = 0; y < displayHeight; y++) {
          for (let x = 0; x < displayWidth; x++) {
            const px = centerX + (x - centerX) * mbZoomScale;
            const py = centerY + (y - centerY) * mbZoomScale;
            let field = 0;
            for (let b = 0; b < balls.length; b++) {
              const dx = px - balls[b].x, dy = py - balls[b].y;
              const dist2 = dx * dx + dy * dy;
              field += (balls[b].r * balls[b].r) / (dist2 + 1);
            }
            const tValMb = (1 - 1 / (1 + field * 0.6)) * (1 - mbColorShift) + mbColorShift;
            const colorPosMb = tValMb * (gradientColors.length - 1);
            const ciMb = Math.floor(colorPosMb);
            const cfMb = colorPosMb - ciMb;
            const c1Mb = gradientColors[ciMb] || { r: 0, g: 0, b: 0 };
            const c2Mb = gradientColors[(ciMb + 1) % gradientColors.length] || c1Mb;
            const brightnessMb = Math.min(1, field * 0.9);
            const idxMb = (y * displayWidth + x) * 4;
            dMb[idxMb]     = Math.round((c1Mb.r + (c2Mb.r - c1Mb.r) * cfMb) * brightnessMb);
            dMb[idxMb + 1] = Math.round((c1Mb.g + (c2Mb.g - c1Mb.g) * cfMb) * brightnessMb);
            dMb[idxMb + 2] = Math.round((c1Mb.b + (c2Mb.b - c1Mb.b) * cfMb) * brightnessMb);
            dMb[idxMb + 3] = 255;
          }
        }
        putScaledImageData(imageDataMb);
        break;
      }

      case 'truchet': {
        // Grid of tiles, each with one of two quarter-circle-arc orientations
        // chosen by a per-cell hash (stable across frames) — forms continuous
        // maze-like curves. Drawn with vector arcs, not a pixel loop, so it's
        // cheap regardless of canvas resolution.
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        const tSize = Math.max(10, truchetSize) / zoom;
        const cols = Math.ceil(displayWidth / tSize) + 2;
        const rows = Math.ceil(displayHeight / tSize) + 2;
        ctx.lineWidth = Math.max(1, truchetThickness);
        ctx.lineCap = 'round';
        // Color drift AND the tile pattern itself both track the shared
        // playhead angle (instead of just color before) — the seed's phase
        // shifts as the playhead advances, so tiles progressively re-flip
        // and the maze visibly evolves rather than only recoloring in place.
        const trAngleOffset = gradientAngle * 0.3;
        for (let row = -1; row < rows; row++) {
          for (let col = -1; col < cols; col++) {
            const seed = Math.sin(col * 127.1 + row * 311.7 + 43.7 + trAngleOffset * 0.6) * 43758.5453;
            const seedFrac = seed - Math.floor(seed);
            const flip = seedFrac < truchetVariation;
            const cx0 = col * tSize, cy0 = row * tSize;
            const colorPos = (((row + col) / 6 + trAngleOffset / 360) % 1 + 1) % 1;
            const cIdx = Math.floor(((colorPos * gradientColors.length) % gradientColors.length + gradientColors.length) % gradientColors.length);
            const color = gradientColors[cIdx] || { r: 255, g: 255, b: 255 };
            ctx.strokeStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
            if (!flip) {
              ctx.beginPath();
              ctx.arc(cx0, cy0, tSize / 2, 0, Math.PI / 2);
              ctx.stroke();
              ctx.beginPath();
              ctx.arc(cx0 + tSize, cy0 + tSize, tSize / 2, Math.PI, Math.PI * 1.5);
              ctx.stroke();
            } else {
              ctx.beginPath();
              ctx.arc(cx0 + tSize, cy0, tSize / 2, Math.PI / 2, Math.PI);
              ctx.stroke();
              ctx.beginPath();
              ctx.arc(cx0, cy0 + tSize, tSize / 2, Math.PI * 1.5, Math.PI * 2);
              ctx.stroke();
            }
          }
        }
        break;
      }

      case 'moire': {
        // Two sets of concentric rings with offset centers, blended with
        // 'lighten' — classic moiré interference technique.
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        const mrTime = moireAnimTime;
        const spacing = Math.max(2, moireScale) / zoom;
        const maxR = Math.sqrt(displayWidth * displayWidth + displayHeight * displayHeight) / 2 + spacing;
        const offsetX = Math.cos(mrTime) * moireOffset;
        const offsetY = Math.sin(mrTime * 0.7) * moireOffset;
        const drawRings = (cx: number, cy: number, colorOffset: number) => {
          const ringCount = Math.ceil(maxR / spacing);
          ctx.lineWidth = Math.max(1, spacing * 0.35);
          for (let i = 0; i < ringCount; i++) {
            const r = i * spacing;
            const colorIdx = (i + colorOffset) % gradientColors.length;
            const color = gradientColors[colorIdx] || { r: 255, g: 255, b: 255 };
            ctx.strokeStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
          }
        };
        ctx.save();
        ctx.globalCompositeOperation = 'lighten';
        drawRings(centerX, centerY, 0);
        drawRings(centerX + offsetX, centerY + offsetY, Math.floor(gradientColors.length / 2));
        ctx.restore();
        break;
      }

      case 'flow-field': {
        // Particles drift along a smoothly-varying pseudo-noise direction
        // field, leaving fading trails in a persistent buffer — the only
        // gradient in the app whose motion drifts rather than rotates/pulses.
        if (canvas.width === 0 || canvas.height === 0) break;
        if (!flowBufferRef.current || flowBufferRef.current.width !== displayWidth || flowBufferRef.current.height !== displayHeight) {
          flowBufferRef.current = document.createElement('canvas');
          flowBufferRef.current.width = displayWidth;
          flowBufferRef.current.height = displayHeight;
          flowParticlesRef.current = [];
        }
        const fbCtx = flowBufferRef.current.getContext('2d')!;
        const targetCount = Math.max(10, Math.min(1000, flowParticleCount));
        const particles = flowParticlesRef.current;
        while (particles.length < targetCount) {
          particles.push({ x: Math.random() * displayWidth, y: Math.random() * displayHeight });
        }
        if (particles.length > targetCount) particles.length = targetCount;

        fbCtx.fillStyle = 'rgba(0,0,0,0.06)';
        fbCtx.fillRect(0, 0, displayWidth, displayHeight);
        const fScale = flowScale * 0.004;
        const fTime = flowAnimTime;
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const angle = (Math.sin(p.x * fScale + fTime) * Math.cos(p.y * fScale - fTime * 0.8)
            + Math.sin((p.x + p.y) * fScale * 0.5 + fTime * 0.5)) * Math.PI;
          const nx = p.x + Math.cos(angle) * 1.5;
          const ny = p.y + Math.sin(angle) * 1.5;
          const color = gradientColors[i % gradientColors.length] || { r: 255, g: 255, b: 255 };
          fbCtx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`;
          fbCtx.lineWidth = flowThickness;
          fbCtx.beginPath();
          fbCtx.moveTo(p.x, p.y);
          fbCtx.lineTo(nx, ny);
          fbCtx.stroke();
          p.x = nx < 0 ? displayWidth : nx > displayWidth ? 0 : nx;
          p.y = ny < 0 ? displayHeight : ny > displayHeight ? 0 : ny;
        }
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        ctx.drawImage(flowBufferRef.current, 0, 0);
        break;
      }

      case 'attractor': {
        // De Jong strange attractor: a handful of independent walkers each
        // iterate the same 2D map many times per frame, scattering points
        // into a persistent fading-trail buffer (same buffer/fade mechanic
        // as Flow Field above). The map's a/b/c/d parameters drift slowly
        // via attractorAnimTime so the lace pattern keeps morphing rather
        // than settling into one static shape.
        if (canvas.width === 0 || canvas.height === 0) break;
        if (!attractorBufferRef.current || attractorBufferRef.current.width !== displayWidth || attractorBufferRef.current.height !== displayHeight) {
          attractorBufferRef.current = document.createElement('canvas');
          attractorBufferRef.current.width = displayWidth;
          attractorBufferRef.current.height = displayHeight;
          attractorPointsRef.current = [];
        }
        const abCtx = attractorBufferRef.current.getContext('2d')!;
        const targetPoints = Math.max(1, Math.min(20, Math.round(attractorPointCount)));
        const points = attractorPointsRef.current;
        while (points.length < targetPoints) {
          points.push({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1 });
        }
        if (points.length > targetPoints) points.length = targetPoints;

        const at = attractorAnimTime;
        const pa = 1.4 + Math.sin(at * 0.13) * 0.9;
        const pb = -2.3 + Math.cos(at * 0.09) * 0.9;
        const pc = 2.4 + Math.sin(at * 0.07) * 0.9;
        const pd = -2.1 + Math.cos(at * 0.11) * 0.9;

        abCtx.fillStyle = 'rgba(0,0,0,0.04)';
        abCtx.fillRect(0, 0, displayWidth, displayHeight);

        const attractorCenterX = displayWidth / 2;
        const attractorCenterY = displayHeight / 2;
        const scaleFactor = (Math.min(displayWidth, displayHeight) / 4.2) * attractorScale;
        const stepsPerFrame = 150;
        for (let i = 0; i < points.length; i++) {
          const p = points[i];
          const color = gradientColors[i % gradientColors.length] || { r: 255, g: 255, b: 255 };
          abCtx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`;
          let px = p.x, py = p.y;
          for (let s = 0; s < stepsPerFrame; s++) {
            const nx = Math.sin(pa * py) - Math.cos(pb * px);
            const ny = Math.sin(pc * px) - Math.cos(pd * py);
            px = nx; py = ny;
            abCtx.fillRect(attractorCenterX + px * scaleFactor, attractorCenterY + py * scaleFactor, 1, 1);
          }
          p.x = px; p.y = py;
        }

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        ctx.drawImage(attractorBufferRef.current, 0, 0);
        break;
      }

      case 'reaction-diffusion': {
        // Gray-Scott reaction-diffusion simulation on a fixed coarse grid,
        // independent of canvas resolution — running the simulation at full
        // display resolution would be far too slow for 60fps. Feed/Kill are
        // the two classic Gray-Scott parameters that determine the pattern
        // family (spots vs stripes vs coral/maze), matching how Marble
        // exposes physically-meaningful sliders rather than abstract ones.
        if (canvas.width === 0 || canvas.height === 0) break;
        const RD_W = 220, RD_H = 140;
        if (!reactionDiffusionGridRef.current) {
          const u = new Float32Array(RD_W * RD_H).fill(1);
          const v = new Float32Array(RD_W * RD_H).fill(0);
          for (let b = 0; b < 6; b++) {
            const bcx = Math.floor(Math.random() * RD_W);
            const bcy = Math.floor(Math.random() * RD_H);
            for (let dy = -3; dy <= 3; dy++) {
              for (let dx = -3; dx <= 3; dx++) {
                if (dx * dx + dy * dy > 9) continue;
                const x = (bcx + dx + RD_W) % RD_W;
                const y = (bcy + dy + RD_H) % RD_H;
                v[y * RD_W + x] = 1;
              }
            }
          }
          const gridCanvas = document.createElement('canvas');
          gridCanvas.width = RD_W;
          gridCanvas.height = RD_H;
          reactionDiffusionGridRef.current = { u, v, u2: new Float32Array(RD_W * RD_H), v2: new Float32Array(RD_W * RD_H), canvas: gridCanvas };
        }
        const rd = reactionDiffusionGridRef.current;
        let { u, v, u2, v2 } = rd;
        const Du = 1.0, Dv = 0.5;
        const feed = reactionDiffusionFeed, kill = reactionDiffusionKill;
        const steps = Math.max(1, Math.round(reactionDiffusionSpeed * 6));
        const idx = (x: number, y: number) => ((y + RD_H) % RD_H) * RD_W + ((x + RD_W) % RD_W);

        // Gray-Scott is a fully deterministic PDE on a wrapped (toroidal)
        // grid with no boundary noise — once it settles into a local
        // equilibrium there is nothing left to perturb it, so it goes
        // completely and permanently static within a few seconds (this is
        // correct PDE behavior, not a bug, but reads as "broken" for a
        // live visual). Periodically injecting a fresh seed blob — same
        // shape as the initial seeding — keeps the system perpetually
        // disturbed so it never fully locks up, similar to how real
        // Gray-Scott art demos stay alive via continuous small perturbations.
        if (Math.random() < 0.004 * reactionDiffusionSpeed) {
          const bcx = Math.floor(Math.random() * RD_W);
          const bcy = Math.floor(Math.random() * RD_H);
          for (let dy = -3; dy <= 3; dy++) {
            for (let dx = -3; dx <= 3; dx++) {
              if (dx * dx + dy * dy > 9) continue;
              v[idx(bcx + dx, bcy + dy)] = 1;
            }
          }
        }

        for (let s = 0; s < steps; s++) {
          for (let y = 0; y < RD_H; y++) {
            for (let x = 0; x < RD_W; x++) {
              const i = y * RD_W + x;
              const lapU = u[idx(x - 1, y)] + u[idx(x + 1, y)] + u[idx(x, y - 1)] + u[idx(x, y + 1)] - 4 * u[i];
              const lapV = v[idx(x - 1, y)] + v[idx(x + 1, y)] + v[idx(x, y - 1)] + v[idx(x, y + 1)] - 4 * v[i];
              const uu = u[i], vv = v[i];
              const reaction = uu * vv * vv;
              u2[i] = Math.min(1, Math.max(0, uu + (Du * lapU - reaction + feed * (1 - uu))));
              v2[i] = Math.min(1, Math.max(0, vv + (Dv * lapV + reaction - (kill + feed) * vv)));
            }
          }
          [u, u2] = [u2, u];
          [v, v2] = [v2, v];
        }
        rd.u = u; rd.v = v; rd.u2 = u2; rd.v2 = v2;

        const rdImageData = new ImageData(RD_W, RD_H);
        const rdData = rdImageData.data;
        for (let i = 0; i < RD_W * RD_H; i++) {
          const t = Math.min(1, Math.max(0, v[i] * 3));
          const colorPos = t * (gradientColors.length - 1);
          const colorIdx = Math.floor(colorPos);
          const colorFrac = colorPos - colorIdx;
          const c1 = gradientColors[colorIdx] || gradientColors[0];
          const c2 = gradientColors[Math.min(colorIdx + 1, gradientColors.length - 1)] || c1;
          const di = i * 4;
          rdData[di] = Math.round(c1.r + (c2.r - c1.r) * colorFrac);
          rdData[di + 1] = Math.round(c1.g + (c2.g - c1.g) * colorFrac);
          rdData[di + 2] = Math.round(c1.b + (c2.b - c1.b) * colorFrac);
          rdData[di + 3] = 255;
        }
        const rdCtx = rd.canvas.getContext('2d')!;
        rdCtx.putImageData(rdImageData, 0, 0);
        // Explicit smoothing + a light blur on the upscale draw — the sim
        // grid is coarse relative to display resolution, so bilinear
        // interpolation alone still shows a faint grid; the blur hides the
        // remainder for a soft, painterly result instead of a visible mesh.
        ctx.imageSmoothingEnabled = true;
        ctx.filter = 'blur(1.5px)';
        ctx.drawImage(rd.canvas, 0, 0, RD_W, RD_H, 0, 0, displayWidth, displayHeight);
        ctx.filter = 'none';
        break;
      }

      case 'radar': {
        // Radar sweep gradient - rotating scan line with fade trail
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, displayWidth, displayHeight);

        // Bass extends trail length; mids flash a bright ring at the sweep head
        const audioRadarTrail = (isAudioEnabled && isAudioReactive) ? audioSubBassLevel * 120 : 0;
        const audioRadarFlash = (isAudioEnabled && isAudioReactive) ? audioMidsLevel : 0;
        const effectiveRadarFadeLength = Math.min(360, radarFadeLength + audioRadarTrail);

        const radarImageData = ctx.createImageData(displayWidth, displayHeight);
        const radarData = radarImageData.data;

        for (let ry = 0; ry < displayHeight; ry++) {
          for (let rx = 0; rx < displayWidth; rx++) {
            const dx = rx - centerX;
            const dy = ry - centerY;
            const pixelAngle = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;

            let angleDiff = (radarSweepAngle - pixelAngle + 360) % 360;

            let brightness = 0;
            const beamHalf = radarBeamWidth / 2;
            if (angleDiff <= beamHalf) {
              brightness = 1;
            } else if (angleDiff <= beamHalf + effectiveRadarFadeLength) {
              brightness = 1 - ((angleDiff - beamHalf) / effectiveRadarFadeLength);
            }
            // Mids: bright flash at the sweep head
            if (angleDiff <= beamHalf + 3) brightness = Math.max(brightness, audioRadarFlash);

            // Get color from gradient
            const colorPos = (pixelAngle / 360) * (gradientColors.length - 1);
            const colorIdx = Math.floor(colorPos);
            const colorFrac = colorPos - colorIdx;
            const color1 = gradientColors[colorIdx % gradientColors.length];
            const color2 = gradientColors[(colorIdx + 1) % gradientColors.length];

            if (!color1 || !color2) continue;

            const r = color1.r + (color2.r - color1.r) * colorFrac;
            const g = color1.g + (color2.g - color1.g) * colorFrac;
            const b = color1.b + (color2.b - color1.b) * colorFrac;

            const idx = (ry * displayWidth + rx) * 4;
            radarData[idx] = r * brightness;
            radarData[idx + 1] = g * brightness;
            radarData[idx + 2] = b * brightness;
            radarData[idx + 3] = 255;
          }
        }

        putScaledImageData(radarImageData);
        break;
      }

      case 'flower': {
        // Flower of Life - sacred geometry pattern with overlapping circles
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, displayWidth, displayHeight);

        ctx.save();
        // Treble spins the flower; bass pulses the radius; mids add extra layers
        const audioFlowerRotationBoost = (isAudioEnabled && isAudioReactive) ? audioTrebleLevel * 8 : 0;
        ctx.translate(centerX, centerY);
        ctx.rotate(((flowerRotation + flowerAnimTime + audioFlowerRotationBoost) * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);

        const audioFlowerScale = (isAudioEnabled && isAudioReactive) ? 1 + audioSubBassLevel * 0.12 : 1;
        const baseRadius = Math.min(displayWidth, displayHeight) / 6 * flowerScale * audioFlowerScale;
        const circles: Array<{x: number, y: number, colorIndex: number}> = [];

        // Center circle
        circles.push({x: centerX, y: centerY, colorIndex: 0});

        // Bass beats add an extra layer temporarily
        const audioLayerBoost = (isAudioEnabled && isAudioReactive) && audioSubBassLevel > 0.65 ? 1 : 0;
        // Create hexagonal pattern of overlapping circles
        const layers = flowerCircles + audioLayerBoost;
        for (let layer = 1; layer <= layers; layer++) {
          const circlesInLayer = layer * 6;
          const angleStep = (Math.PI * 2) / circlesInLayer;
          const layerRadius = baseRadius * layer * flowerSpread;

          for (let i = 0; i < circlesInLayer; i++) {
            const angle = angleStep * i;
            const x = centerX + Math.cos(angle) * layerRadius;
            const y = centerY + Math.sin(angle) * layerRadius;
            circles.push({x, y, colorIndex: (layer + i) % gradientColors.length});
          }
        }

        // Draw all circles with gradient colors
        circles.forEach((circle, idx) => {
          const color = gradientColors[circle.colorIndex % gradientColors.length];
          if (!color) return;

          // Create radial gradient for each circle
          const grad = ctx.createRadialGradient(circle.x, circle.y, 0, circle.x, circle.y, baseRadius);
          grad.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`);
          grad.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0.2)`);

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(circle.x, circle.y, baseRadius, 0, Math.PI * 2);
          ctx.fill();

          // Draw circle outline
          ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`;
          ctx.lineWidth = 2;
          ctx.stroke();
        });

        ctx.restore();
        break;
      }


      default:
        break;
    }

    // For gradients that use the gradient variable (not direct pixel manipulation)
    const directRenderTypes = ['mesh', 'voronoi', 'iridescent', 'noise', 'plasma', 'waves', 'zigzag', 'tunnel', 'helix', 'radial-burst', 'freeform', 'flower', 'radar'];
    if (!directRenderTypes.includes(gradientType)) {
      if (gradient) {
        addGradientStops(gradient, gradientColors);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, displayWidth, displayHeight);
      }
    }

    // Vocal shimmer — treble energy scatters bright sparkle pixels
    if (isAudioEnabled && isAudioReactive && audioTrebleLevel > 4) {
      const shimmer = Math.min(1, audioTrebleLevel / 90);
      const count = Math.floor(shimmer * shimmer * 400);
      ctx.save();
      for (let i = 0; i < count; i++) {
        const sx = Math.random() * displayWidth;
        const sy = Math.random() * displayHeight;
        const alpha = (0.4 + Math.random() * 0.6) * shimmer;
        const size = Math.random() < 0.75 ? 1 : 2;
        const hue = (Math.random() * 60 + audioTrebleLevel * 3) % 360;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = `hsl(${hue}, 100%, 88%)`;
        ctx.fillRect(sx, sy, size, size);
      }
      ctx.restore();
    }

    // Apply visual effects after gradient is rendered
    // Apply each active effect in sequence
    // Guard against invalid canvas dimensions
    if (canvas.width === 0 || canvas.height === 0) {
      return;
    }
    
    activeEffects.forEach((effectType, index) => {
      // Additional safety check before each effect
      if (canvas.width === 0 || canvas.height === 0) {
        return;
      }
      ctx.save();
      
      // Check if this is the first effect and audio reactivity is enabled
      const isFirstEffect = index === 0;
      const audioModulation = (isAudioEnabled && isAudioReactive && isFirstEffect) 
        ? audioMidsLevel 
        : 0;
      
      // Get imageData only for effects that need it
      const needsImageData = ['invert', 'grain', 'charcoal', 'posterize', 'halftone', 'shift', 'duotone', 'ascii', 'emoji'].includes(effectType);
      let imageData: ImageData | null = null;
      
      if (needsImageData) {
        try {
          imageData = getDisplayImageData();
        } catch (e) {
          console.error('Failed to get image data:', e);
          return;
        }
      }
      
      try { switch (effectType) {
        case 'kaleidoscope': {
          const tmp = document.createElement('canvas');
          tmp.width = displayWidth;
          tmp.height = displayHeight;
          const tc = tmp.getContext('2d');
          if (tc) {
            tc.drawImage(canvas, 0, 0, displayWidth, displayHeight);
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, displayWidth, displayHeight);
            ctx.imageSmoothingEnabled = true;
            const cx = displayWidth / 2, cy = displayHeight / 2;
            const seg = Math.max(1, kaleidoscopeSegments + (isFirstEffect ? Math.floor(audioModulation * 8) : 0));
            const aps = (Math.PI * 2) / seg;
            // Use diagonal so segments always reach every corner
            const r = Math.sqrt(cx * cx + cy * cy) * 1.5;
            // Accumulate rotation each frame
            kaleidoAngleRef.current += (kaleidoscopeRotateSpeed / 200) * (1 + (isAudioReactive ? audioMidsLevel * 3 : 0));
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(kaleidoAngleRef.current);
            ctx.translate(-cx, -cy);
            for (let i = 0; i < seg; i++) {
              ctx.save();
              ctx.translate(cx, cy);
              ctx.rotate(i * aps);
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.lineTo(r, -r);
              ctx.lineTo(r, r);
              ctx.closePath();
              ctx.clip();
              if (i % 2 === 0) ctx.scale(1, -1);
              ctx.rotate(-i * aps);
              // Scale source up so it fills beyond edges
              const scale = r / Math.max(cx, cy);
              ctx.drawImage(tmp, -cx * scale, -cy * scale, displayWidth * scale, displayHeight * scale);
              ctx.restore();
            }
            ctx.restore(); // undo kaleidoscope rotation
            ctx.imageSmoothingEnabled = true;
          }
          break;
        }

        case 'glitch': {
          // Block-shuffle/datamosh: occasional full-row tears (classic
          // datamoshing look) plus individually displaced blocks, each with
          // a chance of a faint RGB-offset ghost copy for extra bite.
          // Distinct from VHS (continuous scanline wobble) and Slit-Scan
          // (temporal buffer scan) — this is spatial displacement, not a
          // wobble or time-based effect.
          if (canvas.width === 0 || canvas.height === 0) break;
          const glitchTmp = document.createElement('canvas');
          glitchTmp.width = displayWidth;
          glitchTmp.height = displayHeight;
          const gtc = glitchTmp.getContext('2d');
          if (gtc) {
            gtc.drawImage(canvas, 0, 0, displayWidth, displayHeight);
            const gBlock = Math.max(4, Math.round(glitchBlockSize));
            const gAmt = Math.max(0, Math.min(1, glitchIntensity));
            const gRows = Math.ceil(displayHeight / gBlock);
            const gCols = Math.ceil(displayWidth / gBlock);

            for (let r = 0; r < gRows; r++) {
              if (Math.random() < gAmt * 0.15) {
                const rowShift = (Math.random() - 0.5) * displayWidth * 0.15;
                const sy = r * gBlock;
                const sh = Math.min(gBlock, displayHeight - sy);
                ctx.drawImage(glitchTmp, 0, sy, displayWidth, sh, rowShift, sy, displayWidth, sh);
              }
            }
            for (let r = 0; r < gRows; r++) {
              for (let c = 0; c < gCols; c++) {
                if (Math.random() < gAmt * 0.06) {
                  const sx = c * gBlock, sy = r * gBlock;
                  const sw = Math.min(gBlock, displayWidth - sx);
                  const sh = Math.min(gBlock, displayHeight - sy);
                  const dx = Math.max(0, Math.min(displayWidth - sw, sx + (Math.random() - 0.5) * gBlock * 4));
                  ctx.drawImage(glitchTmp, sx, sy, sw, sh, dx, sy, sw, sh);
                  if (Math.random() < 0.3) {
                    ctx.save();
                    ctx.globalCompositeOperation = 'lighten';
                    ctx.globalAlpha = 0.5;
                    ctx.drawImage(glitchTmp, sx, sy, sw, sh, dx + 3, sy, sw, sh);
                    ctx.restore();
                  }
                }
              }
            }
          }
          break;
        }
          
        case 'invert':
          // Invert colors
          if (!imageData) break;
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i];         // Red
            data[i + 1] = 255 - data[i + 1]; // Green
            data[i + 2] = 255 - data[i + 2]; // Blue
          }
          putScaledImageData(imageData);
          break;
          
        case 'pixelate': {
          const pxTmp = document.createElement('canvas');
          // Audio makes pixels SMALLER on beat (more detail = louder signal)
          const audioPixelReduction = isFirstEffect ? Math.floor(audioModulation * pixelSize * 0.85) : 0;
          const pxSize = Math.max(1, pixelSize - audioPixelReduction);
          pxTmp.width = Math.max(1, Math.floor(displayWidth / pxSize));
          pxTmp.height = Math.max(1, Math.floor(displayHeight / pxSize));
          const pxCtx = pxTmp.getContext('2d');
          if (pxCtx) {
            pxCtx.drawImage(canvas, 0, 0, pxTmp.width, pxTmp.height);
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(pxTmp, 0, 0, displayWidth, displayHeight);
            ctx.imageSmoothingEnabled = true;
          }
          break;
        }
          
        case 'triangulate': {
          const tCtx = document.createElement('canvas').getContext('2d');
          if (!tCtx) break;
          tCtx.canvas.width = canvas.width;
          tCtx.canvas.height = canvas.height;
          tCtx.drawImage(canvas, 0, 0);
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, displayWidth, displayHeight);
          const tSz = Math.max(10, triangleSize + (isFirstEffect ? Math.floor(audioModulation * 40) : 0));
          // Center the grid so pattern emanates from canvas center
          const tHalfCols = Math.ceil(displayWidth / tSz / 2) + 1;
          const tHalfRows = Math.ceil(displayHeight / tSz / 2) + 1;
          for (let r = -tHalfRows; r <= tHalfRows; r++) {
            for (let c = -tHalfCols; c <= tHalfCols; c++) {
              const x = centerX + c * tSz - tSz / 2;
              const y = centerY + r * tSz - tSz / 2;
              const sx1 = Math.max(0, Math.min(displayWidth - 1, x + tSz / 2)) * resolutionMultiplier;
              const sy1 = Math.max(0, Math.min(displayHeight - 1, y + tSz / 2)) * resolutionMultiplier;
              const d1 = tCtx.getImageData(sx1, sy1, 1, 1).data;
              ctx.fillStyle = `rgb(${d1[0]},${d1[1]},${d1[2]})`;
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(x + tSz, y);
              ctx.lineTo(x + tSz, y + tSz);
              ctx.fill();
              const sx2 = Math.max(0, Math.min(displayWidth - 1, x + tSz / 3)) * resolutionMultiplier;
              const sy2 = Math.max(0, Math.min(displayHeight - 1, y + tSz / 3)) * resolutionMultiplier;
              const d2 = tCtx.getImageData(sx2, sy2, 1, 1).data;
              ctx.fillStyle = `rgb(${d2[0]},${d2[1]},${d2[2]})`;
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(x, y + tSz);
              ctx.lineTo(x + tSz, y + tSz);
              ctx.fill();
            }
          }
          break;
        }
          
        case 'chromatic': {
          if (displayWidth <= 1 || displayHeight <= 1) break;
          const src = getDisplayImageData();
          const dst = ctx.createImageData(displayWidth, displayHeight);
          // True 2D RGB split: R→upper-left, G stays, B→lower-right
          // Spikes on treble via audioTrebleLevel
          const trebleSpike = isFirstEffect && isAudioReactive ? (audioTrebleLevel / 90) * chromaticOffset * 1.5 : 0;
          const off = Math.min(Math.abs(chromaticOffset) + trebleSpike, displayWidth / 3);
          const offInt = Math.round(off);
          const chromRad = chromaticAngle * Math.PI / 180;
          const chromDx = Math.round(Math.cos(chromRad) * offInt);
          const chromDy = Math.round(Math.sin(chromRad) * offInt);
          for (let y = 0; y < displayHeight; y++) {
            for (let x = 0; x < displayWidth; x++) {
              const i = (y * displayWidth + x) * 4;
              // R channel: shift in negative direction
              const rx = Math.max(0, Math.min(displayWidth - 1, x - chromDx));
              const ry = Math.max(0, Math.min(displayHeight - 1, y - chromDy));
              // B channel: shift in positive direction
              const bx = Math.max(0, Math.min(displayWidth - 1, x + chromDx));
              const by = Math.max(0, Math.min(displayHeight - 1, y + chromDy));
              dst.data[i]     = src.data[(ry * displayWidth + rx) * 4];
              dst.data[i + 1] = src.data[i + 1]; // G unchanged
              dst.data[i + 2] = src.data[(by * displayWidth + bx) * 4 + 2];
              dst.data[i + 3] = 255;
            }
          }
          putScaledImageData(dst);
          break;
        }
          
        case 'fisheye': {
          const w = displayWidth, h = displayHeight;
          const src = getDisplayImageData();
          const dst = ctx.createImageData(w, h);
          const cx = (fisheyeCenterX / 100) * w, cy = (fisheyeCenterY / 100) * h;
          const R = Math.min(w / 2, h / 2);
          const str = Math.max(0.01, fisheyeStrength + (isFirstEffect ? audioModulation : 0));
          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const nx = (x - cx) / R, ny = (y - cy) / R;
              const r = Math.sqrt(nx * nx + ny * ny);
              if (r >= 1) {
                // Outside lens — copy original pixel
                const si = (y * w + x) * 4;
                const di = si;
                dst.data[di] = src.data[si];
                dst.data[di + 1] = src.data[si + 1];
                dst.data[di + 2] = src.data[si + 2];
                dst.data[di + 3] = 255;
                continue;
              }
              // Spherical fisheye remap
              const theta = Math.atan2(ny, nx);
              const rDist = Math.pow(r, 1 + str);
              const sxf = cx + rDist * Math.cos(theta) * R;
              const syf = cy + rDist * Math.sin(theta) * R;
              // Bilinear interpolation
              const x0 = Math.floor(sxf), y0 = Math.floor(syf);
              const x1 = x0 + 1, y1 = y0 + 1;
              const fx = sxf - x0, fy = syf - y0;
              const di = (y * w + x) * 4;
              if (x0 >= 0 && x1 < w && y0 >= 0 && y1 < h) {
                const i00 = (y0 * w + x0) * 4;
                const i10 = (y0 * w + x1) * 4;
                const i01 = (y1 * w + x0) * 4;
                const i11 = (y1 * w + x1) * 4;
                const w00 = (1 - fx) * (1 - fy), w10 = fx * (1 - fy);
                const w01 = (1 - fx) * fy,       w11 = fx * fy;
                dst.data[di]     = w00*src.data[i00]   + w10*src.data[i10]   + w01*src.data[i01]   + w11*src.data[i11];
                dst.data[di + 1] = w00*src.data[i00+1] + w10*src.data[i10+1] + w01*src.data[i01+1] + w11*src.data[i11+1];
                dst.data[di + 2] = w00*src.data[i00+2] + w10*src.data[i10+2] + w01*src.data[i01+2] + w11*src.data[i11+2];
                dst.data[di + 3] = 255;
              }
            }
          }
          putScaledImageData(dst);
          break;
        }
        
        // New effects - basic implementations
        case 'grain': {
          // Dust-scratches was merged in here as an optional Crackle layer —
          // its noise component was the identical additive-noise loop as grain
          // itself, just with different constants, so the only distinct piece
          // worth keeping was the crackle lines, which can now be dialed in
          // alongside grain instead of needing a separate effect.
          if (!imageData) break;
          const d = imageData.data;
          const int = grainIntensity + (isFirstEffect ? audioModulation * 0.3 : 0);
          const sz = { 'fine': 0.5, 'medium': 1, 'coarse': 2, 'film': 1.5 }[grainType];
          for (let i = 0; i < d.length; i += 4) {
            const n = (Math.random() - 0.5) * int * 255 * sz;
            d[i] += n; d[i + 1] += n; d[i + 2] += n;
          }
          putScaledImageData(imageData);

          if (dustCrackleIntensity > 0) {
            ctx.strokeStyle = `rgba(0,0,0,${dustCrackleIntensity * 0.3})`;
            ctx.lineWidth = 1;
            const numCracks = Math.floor(20 * dustCrackleIntensity);
            for (let i = 0; i < numCracks; i++) {
              ctx.beginPath();
              let x = Math.random() * displayWidth;
              let y = Math.random() * displayHeight;
              ctx.moveTo(x, y);
              const steps = Math.floor(10 + Math.random() * 30);
              for (let j = 0; j < steps; j++) {
                x += (Math.random() - 0.5) * 20;
                y += (Math.random() - 0.5) * 20;
                ctx.lineTo(x, y);
              }
              ctx.stroke();
            }
          }
          break;
        }

        case 'oil-paint':
          ctx.filter = `blur(5px)`;
          ctx.drawImage(canvas, 0, 0, displayWidth, displayHeight);
          ctx.filter = 'none';
          break;


        
        case 'charcoal': {
          if (!imageData) break;
          const d = imageData.data;
          for (let i = 0; i < d.length; i += 4) {
            const g = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11;
            if (charcoalIntensity < 0.5) {
              const a = 1 - (charcoalIntensity * 2);
              d[i] = d[i] * (1 - a) + g * a;
              d[i + 1] = d[i + 1] * (1 - a) + g * a;
              d[i + 2] = d[i + 2] * (1 - a) + g * a;
            } else {
              const b = (charcoalIntensity - 0.5) * 4;
              d[i] = Math.min(255, Math.max(0, d[i] + (d[i] - g) * b));
              d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + (d[i + 1] - g) * b));
              d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + (d[i + 2] - g) * b));
            }
          }
          putScaledImageData(imageData);
          break;
        }
        
        case 'posterize': {
          if (!imageData) break;
          const d = imageData.data, lv = posterizeLevels, s = 256 / lv;
          for (let i = 0; i < d.length; i += 4) {
            d[i] = Math.floor(d[i] / 256 * lv) * s;
            d[i + 1] = Math.floor(d[i + 1] / 256 * lv) * s;
            d[i + 2] = Math.floor(d[i + 2] / 256 * lv) * s;
          }
          putScaledImageData(imageData);
          break;
        }
        
        case 'halftone': {
          if (!imageData) break;
          const sz = halftoneSize;
          const idat = imageData.data;
          const getHTPixel = (px: number, py: number) => {
            const ix = Math.max(0, Math.min(displayWidth - 1, Math.round(px)));
            const iy = Math.max(0, Math.min(displayHeight - 1, Math.round(py)));
            const idx = (iy * displayWidth + ix) * 4;
            return [idat[idx], idat[idx+1], idat[idx+2]] as [number, number, number];
          };

          if (halftoneCMYK) {
            // CMYK halftone: 4 rotated dot grids, multiply blend
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, displayWidth, displayHeight);
            ctx.globalCompositeOperation = 'multiply';
            const diag = Math.sqrt(displayWidth * displayWidth + displayHeight * displayHeight) / 2 + sz * 2;
            const steps = Math.ceil(diag * 2 / sz);
            const cmykChannels = [
              { angle: 15,  color: 'rgba(0,255,255,1)'   }, // Cyan
              { angle: 75,  color: 'rgba(255,0,255,1)'   }, // Magenta
              { angle: 0,   color: 'rgba(255,255,0,1)'   }, // Yellow
              { angle: 45,  color: 'rgba(0,0,0,1)'       }, // Key (black)
            ];
            for (let ci = 0; ci < cmykChannels.length; ci++) {
              const ch = cmykChannels[ci];
              // Move drives per-dot variation over time (below), not the grid's
              // orientation — spinning the whole lattice read as the entire
              // canvas rotating rather than the dots themselves moving.
              const angleRad = ch.angle * Math.PI / 180;
              const cosA = Math.cos(angleRad), sinA = Math.sin(angleRad);
              ctx.fillStyle = ch.color;
              for (let gi = -steps; gi <= steps; gi++) {
                for (let gj = -steps; gj <= steps; gj++) {
                  const rx = gi * sz, ry = gj * sz;
                  let px = centerX + rx * cosA - ry * sinA;
                  let py = centerY + rx * sinA + ry * cosA;
                  if (halftoneMove) {
                    // Each dot wobbles around its own lattice position instead of
                    // the whole grid spinning — the motion reads as belonging to
                    // the dots themselves, not the canvas.
                    const seed = Math.sin(gi * 127.1 + gj * 311.7 + ci * 7.31) * 43758.5453;
                    const seedFrac = seed - Math.floor(seed);
                    const jAngle = seedFrac * Math.PI * 2;
                    const jAmt = Math.sin(halftoneTimeRef.current * 2 + seedFrac * 20) * sz * 0.18;
                    px += Math.cos(jAngle) * jAmt;
                    py += Math.sin(jAngle) * jAmt;
                  }
                  if (px < -sz || px > displayWidth + sz || py < -sz || py > displayHeight + sz) continue;
                  const [r, g, b] = getHTPixel(px, py);
                  const rn = r/255, gn = g/255, bn = b/255;
                  const k = 1 - Math.max(rn, gn, bn);
                  const denom = k === 1 ? 1 : (1 - k);
                  const c = k === 1 ? 0 : (1 - rn - k) / denom;
                  const m = k === 1 ? 0 : (1 - gn - k) / denom;
                  const y = k === 1 ? 0 : (1 - bn - k) / denom;
                  const channelVal = ci === 0 ? c : ci === 1 ? m : ci === 2 ? y : k;
                  const s2 = Math.sin(px * 12.9898 + py * 78.233 + (halftoneMove ? halftoneTimeRef.current * 1000 : 0)) * 43758.5453;
                  const vf = 1 + ((s2 - Math.floor(s2)) - 0.5) * halftoneVariation;
                  const dotR = channelVal * (sz / 2) * 0.95 * vf;
                  if (dotR < 0.3) continue;
                  ctx.beginPath();
                  ctx.arc(px, py, dotR, 0, Math.PI * 2);
                  ctx.fill();
                }
              }
            }
            ctx.globalCompositeOperation = 'source-over';
          } else {
            // Standard halftone
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, displayWidth, displayHeight);
            const htHalfCols = Math.ceil(displayWidth / sz / 2) + 1;
            const htHalfRows = Math.ceil(displayHeight / sz / 2) + 1;
            for (let hr = -htHalfRows; hr <= htHalfRows; hr++) {
              for (let hc = -htHalfCols; hc <= htHalfCols; hc++) {
                let x = centerX + hc * sz;
                let y = centerY + hr * sz;
                if (halftoneMove) {
                  // Per-dot wobble around its own lattice position — see CMYK
                  // branch above for why this replaces whole-grid rotation.
                  const seed = Math.sin(hc * 127.1 + hr * 311.7) * 43758.5453;
                  const seedFrac = seed - Math.floor(seed);
                  const jAngle = seedFrac * Math.PI * 2;
                  const jAmt = Math.sin(halftoneTimeRef.current * 2 + seedFrac * 20) * sz * 0.18;
                  x += Math.cos(jAngle) * jAmt;
                  y += Math.sin(jAngle) * jAmt;
                }
                const [pr, pg, pb] = getHTPixel(x, y);
                const br = (pr + pg + pb) / 3;
                const s = Math.sin(x * 12.9898 + y * 78.233 + (halftoneMove ? halftoneTimeRef.current * 1000 : 0)) * 43758.5453;
                const vf = 1 + ((s - Math.floor(s)) - 0.5) * halftoneVariation;
                const dotR = (br / 255) * (sz / 2) * vf;
                ctx.fillStyle = `rgb(${pr},${pg},${pb})`;
                ctx.beginPath();
                ctx.arc(x, y, dotR, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }
          break;
        }

        case 'vhs': {
          // VHS effect with horizontal disruption — spikes on bass beats
          if (canvas.width === 0 || canvas.height === 0) break;
          const bassBoost = isAudioReactive ? (audioSubBassLevel / 5) * 0.9 : 0;
          const effectiveVhsIntensity = Math.min(1, vhsGlitchIntensity + bassBoost);

          // Apply horizontal blur first for VHS tape tracking blur
          const blurStrength = Math.floor(2 + effectiveVhsIntensity * 3);
          ctx.filter = `blur(${blurStrength}px)`;
          // Explicit CSS destination size avoids the physical-pixel intrinsic size
          // being scaled up 4× by ctx.scale on Retina displays
          ctx.drawImage(canvas, 0, 0, displayWidth, displayHeight);
          ctx.filter = 'none';

          // More horizontal glitches with varying sizes
          // Capture one CSS-pixel snapshot so slice extraction works at CSS coords
          const vhsFullImg = getDisplayImageData();
          const numGlitches = Math.floor(15 + effectiveVhsIntensity * 50);
          for (let i = 0; i < numGlitches; i++) {
            const y = Math.random() * displayHeight;
            const h = Math.max(2, Math.min(60, Math.random() * 60 * effectiveVhsIntensity));
            const offset = (Math.random() - 0.5) * 300 * effectiveVhsIntensity;
            const yInt = Math.floor(y);
            const hInt = Math.max(2, Math.ceil(h));
            if (yInt >= 0 && yInt + hInt <= displayHeight && displayWidth > 0) {
              try {
                const slice = ctx.createImageData(displayWidth, hInt);
                for (let row = 0; row < hInt; row++) {
                  const srcRow = Math.min(yInt + row, displayHeight - 1);
                  const srcOff = srcRow * displayWidth * 4;
                  slice.data.set(vhsFullImg.data.subarray(srcOff, srcOff + displayWidth * 4), row * displayWidth * 4);
                }
                ctx.filter = `blur(${blurStrength * 1.5}px)`;
                putScaledImageData(slice, offset, yInt);
                ctx.filter = 'none';
              } catch (e) {
                // Skip if slice extraction fails
              }
            }
          }

          // Add strong RGB channel shift for VHS chromatic aberration
          if (imageData) {
            const shiftAmount = Math.floor(effectiveVhsIntensity * 8);
            const data = imageData.data;
            const tempData = new Uint8ClampedArray(data);
            
            // Shift red and blue channels
            for (let y = 0; y < displayHeight; y++) {
              for (let x = 0; x < displayWidth; x++) {
                const i = (y * displayWidth + x) * 4;
                
                // Red channel shift right
                const redSourceX = Math.max(0, x - shiftAmount);
                const redSourceI = (y * displayWidth + redSourceX) * 4;
                data[i] = tempData[redSourceI];
                
                // Blue channel shift left
                const blueSourceX = Math.min(displayWidth - 1, x + shiftAmount);
                const blueSourceI = (y * displayWidth + blueSourceX) * 4;
                data[i + 2] = tempData[blueSourceI + 2];
              }
            }
            putScaledImageData(imageData);
          }
          break;
        }

        case 'zoom-blur': {
          // True zoom blur: per-pixel multi-sample toward center (flying-toward-camera look)
          if (canvas.width === 0 || canvas.height === 0) break;
          try {
            const zbSrc = getDisplayImageData();
            const zbDst = ctx.createImageData(displayWidth, displayHeight);
            const zbCx = displayWidth / 2, zbCy = displayHeight / 2;
            const zbAmt = Math.min(0.5, (blurRadialAmount / 100) * (isAudioReactive ? 1 + audioMidsLevel * 2 : 1));
            const zbSteps = 10;
            for (let y = 0; y < displayHeight; y++) {
              for (let x = 0; x < displayWidth; x++) {
                let r = 0, g = 0, b = 0;
                for (let s = 0; s < zbSteps; s++) {
                  const t = 1 - zbAmt * (s / zbSteps);
                  const sx = Math.max(0, Math.min(displayWidth - 1, Math.round(zbCx + (x - zbCx) * t)));
                  const sy = Math.max(0, Math.min(displayHeight - 1, Math.round(zbCy + (y - zbCy) * t)));
                  const si = (sy * displayWidth + sx) * 4;
                  r += zbSrc.data[si]; g += zbSrc.data[si+1]; b += zbSrc.data[si+2];
                }
                const di = (y * displayWidth + x) * 4;
                zbDst.data[di] = r / zbSteps; zbDst.data[di+1] = g / zbSteps;
                zbDst.data[di+2] = b / zbSteps; zbDst.data[di+3] = 255;
              }
            }
            putScaledImageData(zbDst);
          } catch(e) { /* skip */ }
          break;
        }

        case 'mirror': {
          if (canvas.width === 0 || canvas.height === 0) break;
          const mw = displayWidth, mh = displayHeight;
          // canvas.width/height are physical pixels (CSS size × resolutionMultiplier
          // on Retina). drawImage's source rect is always in the source's native
          // pixel space, so passing CSS-pixel-sized rects (mw, mh, tileW, tileH…)
          // straight against `canvas` only sampled a top-left fraction of the real
          // image — the smaller the requested region, the smaller a corner it grabbed
          // (visibly "coming from the corner", and at high grid tile counts, too tiny
          // a sliver to read as anything). Downsample to display resolution once and
          // mirror from that instead, matching getDisplayImageData's approach.
          const mirrorSrc = document.createElement('canvas');
          mirrorSrc.width = mw; mirrorSrc.height = mh;
          mirrorSrc.getContext('2d')!.drawImage(canvas, 0, 0, mw, mh);
          const mirrorTemp = document.createElement('canvas');
          mirrorTemp.width = mw; mirrorTemp.height = mh;
          const mCtx = mirrorTemp.getContext('2d')!;
          if (mirrorMode === 'horizontal') {
            mCtx.drawImage(mirrorSrc, 0, 0, mw/2, mh, 0, 0, mw/2, mh);
            mCtx.save(); mCtx.scale(-1, 1); mCtx.drawImage(mirrorSrc, 0, 0, mw/2, mh, -mw, 0, mw/2, mh); mCtx.restore();
          } else if (mirrorMode === 'vertical') {
            mCtx.drawImage(mirrorSrc, 0, 0, mw, mh/2, 0, 0, mw, mh/2);
            mCtx.save(); mCtx.scale(1, -1); mCtx.drawImage(mirrorSrc, 0, 0, mw, mh/2, 0, -mh, mw, mh/2); mCtx.restore();
          } else {
            // Generalized N×N mirrored tiling (quad was the fixed N=2 case) — samples
            // the top-left corner of the source and tiles it across an N×N grid,
            // flipping alternate rows/columns so every seam lines up seamlessly.
            const n = Math.max(2, Math.min(16, Math.round(mirrorTileCount)));
            const tileW = mw / n, tileH = mh / n;
            // Round tile boundaries to whole pixels and overdraw by 1px so
            // adjacent tiles overlap slightly instead of leaving hairline gaps
            // from sub-pixel rounding in drawImage.
            for (let row = 0; row < n; row++) {
              for (let col = 0; col < n; col++) {
                const flipX = col % 2 === 1;
                const flipY = row % 2 === 1;
                const x0 = Math.round(col * tileW);
                const x1 = Math.round((col + 1) * tileW);
                const y0 = Math.round(row * tileH);
                const y1 = Math.round((row + 1) * tileH);
                const w = x1 - x0 + 1;
                const h = y1 - y0 + 1;
                mCtx.save();
                mCtx.translate(x0 + (flipX ? w - 1 : 0), y0 + (flipY ? h - 1 : 0));
                mCtx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
                mCtx.drawImage(mirrorSrc, 0, 0, tileW, tileH, 0, 0, w, h);
                mCtx.restore();
              }
            }
          }
          ctx.clearRect(0, 0, mw, mh);
          ctx.drawImage(mirrorTemp, 0, 0);
          break;
        }

        case 'wave':
          // Wave distortion with rotation and wrapped edges to prevent white gaps
          if (canvas.width === 0 || canvas.height === 0) break;
          try {
            const waveData = getDisplayImageData();
            const tempWave = ctx.createImageData(displayWidth, displayHeight);
            const angleRad = waveDistortionRotation * Math.PI / 180;
            // Audio: bass boosts amplitude, mids boost frequency
            const audioWaveAmp = isAudioReactive ? (audioSubBassLevel / 5) * 80 : 0;
            const audioWaveFreqMult = isAudioReactive ? 1 + audioMidsLevel * 3 : 1;
            const effectiveWaveStrength = waveDistortionStrength + audioWaveAmp;
          for (let y = 0; y < displayHeight; y++) {
            for (let x = 0; x < displayWidth; x++) {
              // Apply wave in the direction of rotation
              const waveOffset = Math.sin((y * Math.cos(angleRad) + x * Math.sin(angleRad)) * 0.05 * audioWaveFreqMult) * effectiveWaveStrength;
              const sourceX = x + waveOffset * Math.cos(angleRad);
              const sourceY = y + waveOffset * Math.sin(angleRad);
              // Wrap coordinates to prevent white gaps at edges
              const wrappedX = ((Math.floor(sourceX) % displayWidth) + displayWidth) % displayWidth;
              const wrappedY = ((Math.floor(sourceY) % displayHeight) + displayHeight) % displayHeight;
              const destIdx = (y * displayWidth + x) * 4;
              const srcIdx = (wrappedY * displayWidth + wrappedX) * 4;
              tempWave.data[destIdx] = waveData.data[srcIdx];
              tempWave.data[destIdx + 1] = waveData.data[srcIdx + 1];
              tempWave.data[destIdx + 2] = waveData.data[srcIdx + 2];
              tempWave.data[destIdx + 3] = 255;
            }
          }
          putScaledImageData(tempWave);
          } catch (e) {
            console.error('Wave distortion error:', e);
          }
          break;
        


        case 'shift': {
          if (!imageData) break;
          const d = imageData.data;
          for (let i = 0; i < d.length; i += 4) {
            d[i] = (d[i] + colorShiftHue) % 256;
            d[i + 1] = (d[i + 1] + colorShiftHue) % 256;
            d[i + 2] = (d[i + 2] + colorShiftHue) % 256;
          }
          putScaledImageData(imageData);
          break;
        }
        
        case 'duotone': {
          // Tritone was merged in here as an optional 3rd color stop rather
          // than a separate effect — same luminance-to-gradient-map algorithm.
          if (!imageData) break;
          const d = imageData.data;
          const h2r = (h: string) => {
            const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
            return r ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) } : { r: 0, g: 0, b: 0 };
          };
          const c0 = h2r(duotoneColor1), c1 = h2r(duotoneColor2);
          if (duotoneThreeColor) {
            const c2 = h2r(duotoneColor3);
            for (let i = 0; i < d.length; i += 4) {
              const g = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11, t = g / 255;
              let r, gr, b;
              if (t < 0.5) {
                const lt = t * 2;
                r = c0.r * (1 - lt) + c1.r * lt;
                gr = c0.g * (1 - lt) + c1.g * lt;
                b = c0.b * (1 - lt) + c1.b * lt;
              } else {
                const lt = (t - 0.5) * 2;
                r = c1.r * (1 - lt) + c2.r * lt;
                gr = c1.g * (1 - lt) + c2.g * lt;
                b = c1.b * (1 - lt) + c2.b * lt;
              }
              d[i] = r * duotoneIntensity + d[i] * (1 - duotoneIntensity);
              d[i + 1] = gr * duotoneIntensity + d[i + 1] * (1 - duotoneIntensity);
              d[i + 2] = b * duotoneIntensity + d[i + 2] * (1 - duotoneIntensity);
            }
          } else {
            for (let i = 0; i < d.length; i += 4) {
              const g = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11, t = g / 255;
              d[i] = (c0.r * (1 - t) + c1.r * t) * duotoneIntensity + d[i] * (1 - duotoneIntensity);
              d[i + 1] = (c0.g * (1 - t) + c1.g * t) * duotoneIntensity + d[i + 1] * (1 - duotoneIntensity);
              d[i + 2] = (c0.b * (1 - t) + c1.b * t) * duotoneIntensity + d[i + 2] * (1 - duotoneIntensity);
            }
          }
          putScaledImageData(imageData);
          break;
        }

        case 'vignette': {
          // Darken edges
          const vigRadius = Math.max(0, Math.max(displayWidth, displayHeight) / 1.5);
          const vigInnerRadius = vigRadius * (vignetteSoftness / 100);
          const vigGrad = ctx.createRadialGradient(centerX, centerY, vigInnerRadius, centerX, centerY, vigRadius);
          vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
          // Audio modulation affects vignette strength
          const audioVignetteStrength = isFirstEffect ? audioModulation * 0.5 : 0;
          const effectiveVignetteStrength = Math.min(1, vignetteStrength + audioVignetteStrength);
          vigGrad.addColorStop(1, `rgba(0,0,0,${effectiveVignetteStrength})`);
          ctx.fillStyle = vigGrad;
          ctx.fillRect(0, 0, displayWidth, displayHeight);
          break;
        }

        case 'scanlines': {
          // CRT-style horizontal scanlines that scroll downward over time;
          // bass hits punch up the darkness so they feel like they "react to the beat"
          const spacing = Math.max(2, scanlineSpacing);
          const audioScanBoost = isFirstEffect && isAudioReactive ? (audioSubBassLevel / 5) * 0.4 : 0;
          const effectiveScanlineIntensity = Math.min(1, scanlineIntensity + audioScanBoost);
          const scroll = (Date.now() / 1000) * scanlineSpeed * 20;
          ctx.fillStyle = `rgba(0,0,0,${effectiveScanlineIntensity})`;
          for (let y = -spacing + (scroll % spacing); y < displayHeight; y += spacing) {
            ctx.fillRect(0, y, displayWidth, Math.max(1, spacing / 2));
          }
          break;
        }

        case 'grid-effect': {
          if (canvas.width === 0 || canvas.height === 0) break;
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = displayWidth;
          tempCanvas.height = displayHeight;
          const gCtx = tempCanvas.getContext('2d');
          if (!gCtx) break;
          gCtx.drawImage(canvas, 0, 0, displayWidth, displayHeight);
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, displayWidth, displayHeight);
          const gridRowsSafeFx = Math.max(2, gridRows);
          const gridColumnsSafeFx = Math.max(2, gridColumns);
          const cw = displayWidth / gridColumnsSafeFx, ch = displayHeight / gridRowsSafeFx;
          for (let r = 0; r < gridRowsSafeFx + 1; r++) {
            for (let c = 0; c < gridColumnsSafeFx + 1; c++) {
              const x = c * cw, y = r * ch;
              const vx = gridVariation > 0 ? (Math.random() - 0.5) * cw * gridVariation : 0;
              const vy = gridVariation > 0 ? (Math.random() - 0.5) * ch * gridVariation : 0;
              const cx = x + cw / 2 + vx, cy = y + ch / 2 + vy;
              const rad = Math.min(cw, ch) / 2 * (gridShapeSize / 25) * (gridVariation > 0 ? 1 + (Math.random() - 0.5) * gridVariation * 0.5 : 1);
              const scx = Math.min(Math.max(0, cx), displayWidth - 1);
              const scy = Math.min(Math.max(0, cy), displayHeight - 1);
              const sex = Math.min(Math.max(0, x), displayWidth - 1);
              const sey = Math.min(Math.max(0, y), displayHeight - 1);
              let cc = '#000', ec = '#000';
              try {
                const cp = gCtx.getImageData(scx, scy, 1, 1).data;
                cc = `rgb(${cp[0]},${cp[1]},${cp[2]})`;
                const ep = gCtx.getImageData(sex, sey, 1, 1).data;
                ec = `rgb(${ep[0]},${ep[1]},${ep[2]})`;
              } catch (e) { cc = '#000'; ec = '#333'; }
              const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
              g.addColorStop(0, cc);
              g.addColorStop(1, ec);
              ctx.fillStyle = g;
              ctx.save();
              ctx.translate(cx, cy);
              ctx.rotate((gridRotation * Math.PI) / 180 + (gridVariation > 0 ? Math.random() * gridVariation * Math.PI : 0));
              ctx.translate(-cx, -cy);
              ctx.beginPath();
              if (gridSides === 1) {
                // Dot (circle)
                ctx.arc(cx, cy, rad, 0, Math.PI * 2);
              } else if (gridSides === 2) {
                // Line (vertical line with thickness = rad)
                ctx.rect(cx - rad, cy - displayHeight * 2, rad * 2, displayHeight * 4);
              } else if (gridSides > 2) {
                // Polygon (3+ sides)
                for (let i = 0; i < gridSides; i++) {
                  const a = (i * 2 * Math.PI / gridSides) - (gridSides % 2 === 1 ? Math.PI / 2 : 0);
                  const px = cx + rad * Math.cos(a), py = cy + rad * Math.sin(a);
                  if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                }
              }
              ctx.closePath();
              ctx.fill();
              ctx.restore();
            }
          }
          break;
        }
        
        case 'blur': {
          if (blurType === 'gaussian') {
            // Canvas filter-blur samples transparency beyond the source's
            // edges, so drawing the source at its native size leaves a thin
            // unblurred/faded seam right at the border. Overdrawing slightly
            // past the edges (a tiny zoom of the same source) gives the blur
            // kernel real pixel data out there instead, so the visible frame
            // is blurred edge-to-edge with no seam.
            const gaussAmt = blurGaussianAmount + (isFirstEffect ? audioModulation * 10 : 0);
            const gaussPad = gaussAmt * 2;
            ctx.filter = `blur(${gaussAmt}px)`;
            ctx.drawImage(canvas, -gaussPad, -gaussPad, displayWidth + gaussPad * 2, displayHeight + gaussPad * 2);
            ctx.filter = 'none';
          } else if (blurType === 'motion') {
            const amt = blurMotionAmount + (isFirstEffect ? audioModulation * 10 : 0);
            const rad = (blurMotionDirection * Math.PI) / 180;
            const iterations = Math.max(10, Math.floor(10 + amt / 2));
            const ox = Math.cos(rad) * amt, oy = Math.sin(rad) * amt;
            ctx.filter = `blur(${amt * 0.2}px)`;
            ctx.globalAlpha = 0.8 / iterations;
            for (let i = 1; i <= iterations; i++) {
              ctx.drawImage(canvas, ox * (i / iterations), oy * (i / iterations), displayWidth, displayHeight);
            }
            ctx.globalAlpha = 1.0;
            ctx.filter = 'none';
          } else if (blurType === 'radial') {
            // True rotational ("spin") blur: samples an arc around the
            // center at a fixed radius, sweeping angle each step, instead of
            // sampling along the radius toward center (that's a zoom blur —
            // covered by Bloom/Zoom Blur elsewhere and wasn't distinct here,
            // plus its effect was capped tiny enough at typical slider
            // values to look like it barely did anything).
            if (canvas.width > 0 && canvas.height > 0) {
              try {
                const zbSrc = getDisplayImageData();
                const zbDst = ctx.createImageData(displayWidth, displayHeight);
                const zbCx = displayWidth / 2, zbCy = displayHeight / 2;
                // Up to ~45 degrees of total sweep at max slider value.
                const spinSweep = (blurRadialAmount / 50) * (Math.PI / 4) * (isFirstEffect && isAudioReactive ? 1 + audioMidsLevel * 2 : 1);
                const zbSteps = 12;
                for (let y = 0; y < displayHeight; y++) {
                  for (let x = 0; x < displayWidth; x++) {
                    const dx = x - zbCx, dy = y - zbCy;
                    const r = Math.sqrt(dx * dx + dy * dy);
                    const baseAngle = Math.atan2(dy, dx);
                    let rr = 0, gg = 0, bb = 0;
                    for (let s = 0; s < zbSteps; s++) {
                      const t = (s / (zbSteps - 1)) - 0.5;
                      const a = baseAngle + t * spinSweep;
                      const sx = Math.max(0, Math.min(displayWidth - 1, Math.round(zbCx + Math.cos(a) * r)));
                      const sy = Math.max(0, Math.min(displayHeight - 1, Math.round(zbCy + Math.sin(a) * r)));
                      const si = (sy * displayWidth + sx) * 4;
                      rr += zbSrc.data[si]; gg += zbSrc.data[si+1]; bb += zbSrc.data[si+2];
                    }
                    const di = (y * displayWidth + x) * 4;
                    zbDst.data[di] = rr / zbSteps; zbDst.data[di+1] = gg / zbSteps;
                    zbDst.data[di+2] = bb / zbSteps; zbDst.data[di+3] = 255;
                  }
                }
                putScaledImageData(zbDst);
              } catch(e) { /* skip */ }
            }
          }
          break;
        }
        
        case 'dither':
          // Dither effect
          const ditherImageData = getDisplayImageData();
          const ditherData = ditherImageData.data;
          
          const bayer = [[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
          const lv = Math.max(2, ditherLevels);
          const st = 255 / (lv - 1);
          
          if (ditherType === 'bayer') {
            for (let y = 0; y < displayHeight; y++) {
              for (let x = 0; x < displayWidth; x++) {
                const i = (y * displayWidth + x) * 4;
                const t = (bayer[y % 4][x % 4] / 16) * st;
                for (let c = 0; c < 3; c++) {
                  const v = Math.round(ditherData[i+c] / st) * st;
                  ditherData[i+c] = ditherData[i+c] + t > v + st/2 ? Math.min(255, v+st) : v;
                }
              }
            }
          } else {
            for (let y = 0; y < displayHeight; y++) {
              for (let x = 0; x < displayWidth; x++) {
                const i = (y * displayWidth + x) * 4;
                for (let c = 0; c < 3; c++) {
                  const old = ditherData[i+c];
                  const nv = Math.round(old / st) * st;
                  ditherData[i+c] = nv;
                  const e = old - nv;
                  if (x+1 < displayWidth) ditherData[i+4+c] += e*.44;
                  if (y+1 < displayHeight) {
                    if (x > 0) ditherData[i+displayWidth*4-4+c] += e*.19;
                    ditherData[i+displayWidth*4+c] += e*.31;
                    if (x+1 < displayWidth) ditherData[i+displayWidth*4+4+c] += e*.06;
                  }
                }
              }
            }
          }
          
          putScaledImageData(ditherImageData);
          break;

        case 'slit-scan':
          // Temporal pixel stretching
          const ssImg = getDisplayImageData();
          slitScanBufferRef.current.push(ssImg);
          if (slitScanBufferRef.current.length > 60) slitScanBufferRef.current.shift();

          if (slitScanBufferRef.current.length > 1) {
            const out = ctx.createImageData(displayWidth, displayHeight);
            const int = slitScanIntensity;
            const buf = slitScanBufferRef.current;

            // Frame selection stays bounded to the buffer's actual range (raising
            // Intensity past 1 would otherwise make fi blow past buf.length and
            // clamp to the same last frame across the whole screen, collapsing
            // the banding). The raw (uncapped) intensity is used separately below
            // for the shift/twist magnitude, which is what "Intensity" now scales.
            const frameSel = Math.min(int, 1);
            const midBuf = (buf.length - 1) / 2;

            if (slitScanDirection === 'horizontal') {
              for (let y = 0; y < displayHeight; y++) {
                const fi = Math.min(Math.floor((y / displayHeight) * (buf.length - 1) * frameSel), buf.length - 1);
                const sf = buf[fi];
                // Shift scales with canvas width (not a fixed px amount) and the
                // slider's full range now maps to a much larger max displacement
                // so Intensity actually feels intense at the high end.
                const shift = Math.round(((fi - midBuf) / midBuf) * int * displayWidth * 0.35);
                for (let x = 0; x < displayWidth; x++) {
                  // Wrap instead of clamp — clamping collapsed many source columns
                  // onto the same edge pixel, producing a solid stripe artifact.
                  const sx = ((x + shift) % displayWidth + displayWidth) % displayWidth;
                  const i = (y * displayWidth + x) * 4;
                  const si = (y * displayWidth + sx) * 4;
                  out.data[i] = sf.data[si];
                  out.data[i+1] = sf.data[si+1];
                  out.data[i+2] = sf.data[si+2];
                  out.data[i+3] = sf.data[si+3];
                }
              }
            } else if (slitScanDirection === 'vertical') {
              for (let x = 0; x < displayWidth; x++) {
                const fi = Math.min(Math.floor((x / displayWidth) * (buf.length - 1) * frameSel), buf.length - 1);
                const sf = buf[fi];
                const shift = Math.round(((fi - midBuf) / midBuf) * int * displayHeight * 0.35);
                for (let y = 0; y < displayHeight; y++) {
                  const sy = ((y + shift) % displayHeight + displayHeight) % displayHeight;
                  const i = (y * displayWidth + x) * 4;
                  const si = (sy * displayWidth + x) * 4;
                  out.data[i] = sf.data[si];
                  out.data[i+1] = sf.data[si+1];
                  out.data[i+2] = sf.data[si+2];
                  out.data[i+3] = sf.data[si+3];
                }
              }
            } else if (slitScanDirection === 'radial') {
              // Rings that expand/contract in radius AND twist tangentially, so
              // at higher intensity they read as spiraling/folding in on
              // themselves instead of just breathing in and out.
              const cx = displayWidth / 2, cy = displayHeight / 2;
              const md = Math.sqrt(cx*cx + cy*cy);
              for (let y = 0; y < displayHeight; y++) {
                for (let x = 0; x < displayWidth; x++) {
                  const d = Math.sqrt((x-cx)*(x-cx) + (y-cy)*(y-cy));
                  const fi = Math.min(Math.floor((d / md) * (buf.length - 1) * frameSel), buf.length - 1);
                  const sf = buf[fi];
                  const normOffset = (fi - midBuf) / midBuf;
                  const shift = normOffset * int * md * 0.35;
                  // Reflect instead of clamping to 0 — clamping collapsed every
                  // pixel within |shift| of center onto the exact same source
                  // pixel, producing a solid-color disc in the middle of the canvas.
                  let sd = d + shift;
                  if (sd < 0) sd = -sd;
                  const angle = Math.atan2(y - cy, x - cx);
                  const twist = normOffset * int * 1.4;
                  const sAngle = angle + twist;
                  const sx = Math.max(0, Math.min(displayWidth - 1, Math.round(cx + Math.cos(sAngle) * sd)));
                  const sy = Math.max(0, Math.min(displayHeight - 1, Math.round(cy + Math.sin(sAngle) * sd)));
                  const i = (y * displayWidth + x) * 4;
                  const si = (sy * displayWidth + sx) * 4;
                  out.data[i] = sf.data[si];
                  out.data[i+1] = sf.data[si+1];
                  out.data[i+2] = sf.data[si+2];
                  out.data[i+3] = sf.data[si+3];
                }
              }
            } else {
              // circular: sample frame based on angle around center, with the
              // sample point itself rotated AND pulled toward/away from center by
              // the assigned frame's time offset — at high intensity this reads
              // as rings spinning and folding inward rather than a flat rotation.
              const cx = displayWidth / 2, cy = displayHeight / 2;
              for (let y = 0; y < displayHeight; y++) {
                for (let x = 0; x < displayWidth; x++) {
                  const angle = Math.atan2(y - cy, x - cx); // -PI to PI
                  const norm = (angle + Math.PI) / (Math.PI * 2); // 0..1
                  const fi = Math.min(Math.floor(norm * (buf.length - 1) * frameSel), buf.length - 1);
                  const sf = buf[fi];
                  const d = Math.sqrt((x-cx)*(x-cx) + (y-cy)*(y-cy));
                  const normOffset = (fi - midBuf) / midBuf;
                  const angleShift = normOffset * int * 1.6;
                  const sAngle = angle + angleShift;
                  let sd = d * (1 - normOffset * int * 0.25);
                  if (sd < 0) sd = -sd;
                  const sx = Math.max(0, Math.min(displayWidth - 1, Math.round(cx + Math.cos(sAngle) * sd)));
                  const sy = Math.max(0, Math.min(displayHeight - 1, Math.round(cy + Math.sin(sAngle) * sd)));
                  const i = (y * displayWidth + x) * 4;
                  const si = (sy * displayWidth + sx) * 4;
                  out.data[i] = sf.data[si];
                  out.data[i+1] = sf.data[si+1];
                  out.data[i+2] = sf.data[si+2];
                  out.data[i+3] = sf.data[si+3];
                }
              }
            }
            putScaledImageData(out);
          }
          break;

        case 'bloom': {
          // Blur a copy and composite back with screen blend — bright areas glow
          const bloomTmp = document.createElement('canvas');
          bloomTmp.width = displayWidth;
          bloomTmp.height = displayHeight;
          const bloomCtx = bloomTmp.getContext('2d');
          if (bloomCtx) {
            const audioBloomBoost = isAudioReactive ? audioSubBassLevel / 5 * 20 : 0;
            const effectiveRadius = bloomRadius + audioBloomBoost;
            bloomCtx.filter = `blur(${effectiveRadius}px)`;
            bloomCtx.drawImage(canvas, 0, 0, displayWidth, displayHeight);
            bloomCtx.filter = 'none';
            const audioBloomAlpha = isAudioReactive ? Math.min(2, bloomIntensity + audioSubBassLevel / 5 * 0.5) : bloomIntensity;
            ctx.save();
            ctx.globalAlpha = Math.min(1, audioBloomAlpha);
            ctx.globalCompositeOperation = 'screen';
            ctx.drawImage(bloomTmp, 0, 0);
            ctx.restore();
          }
          break;
        }

        case 'feedback': {
          // Trails: composite previous frame (zoomed+rotated+faded) behind current
          const fbTmp = document.createElement('canvas');
          fbTmp.width = displayWidth;
          fbTmp.height = displayHeight;
          const fbTmpCtx = fbTmp.getContext('2d');
          if (fbTmpCtx) fbTmpCtx.drawImage(canvas, 0, 0, displayWidth, displayHeight); // snapshot current

          const fb = feedbackBufferRef.current;
          if (fb && fb.width === displayWidth && fb.height === displayHeight) {
            const audioFbDecay = isAudioReactive
              ? Math.min(0.98, feedbackDecay + audioSubBassLevel / 5 * 0.08)
              : feedbackDecay;
            const audioFbZoom = feedbackZoom * (1 + (isAudioReactive ? audioSubBassLevel / 5 * 0.3 : 0));
            // Clear canvas and draw feedback behind current frame
            ctx.clearRect(0, 0, displayWidth, displayHeight);
            ctx.save();
            ctx.globalAlpha = Math.min(0.98, audioFbDecay);
            ctx.translate(centerX, centerY);
            // Rotation/zoom multipliers bumped 4x — at the old scale the sliders'
            // full range barely moved the trail per frame, reading as inert.
            ctx.rotate(feedbackRotation * 0.02);
            const zs = 1 + audioFbZoom * 0.02;
            ctx.scale(zs, zs);
            ctx.translate(-centerX, -centerY);
            ctx.drawImage(fb, 0, 0);
            ctx.restore();
            // Blend the current (fully opaque) frame over the trail instead of a
            // plain source-over draw — at alpha 1 that would completely erase the
            // trail underneath every frame, which is why no trail was ever visible.
            // 'lighten' lets the brighter of (trail, current) win per-pixel so the
            // decaying echo actually shows through.
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'lighten';
            ctx.drawImage(fbTmp, 0, 0);
            ctx.globalCompositeOperation = 'source-over';
          }
          // Update feedback buffer
          if (!feedbackBufferRef.current || feedbackBufferRef.current.width !== displayWidth) {
            feedbackBufferRef.current = document.createElement('canvas');
            feedbackBufferRef.current.width = displayWidth;
            feedbackBufferRef.current.height = displayHeight;
          }
          const updateCtx = feedbackBufferRef.current.getContext('2d');
          if (updateCtx) { updateCtx.clearRect(0, 0, displayWidth, displayHeight); updateCtx.drawImage(canvas, 0, 0, displayWidth, displayHeight); }
          break;
        }

        case 'ripple': {
          // Beat-triggered expanding circular wave distortion
          if (canvas.width === 0 || canvas.height === 0) break;
          try {
            const bassSig = isAudioReactive ? audioSubBassLevel / 5 : 0;
            const bassThreshold = 0.35;
            if (isAudioReactive) {
              if (bassSig > bassThreshold && prevBassForRippleRef.current <= bassThreshold) {
                rippleRingsRef.current.push({ phase: 0, strength: bassSig });
                if (rippleRingsRef.current.length > 6) rippleRingsRef.current.shift();
              }
              prevBassForRippleRef.current = bassSig;
            } else if (isAutoModeRef.current || isVCRPlayingRef.current) {
              // No audio to drive this off of — pulse rings on a fixed interval
              // instead, so the effect isn't completely inert without audio input.
              rippleAutoFrameRef.current += 1;
              if (rippleAutoFrameRef.current > 90) {
                rippleAutoFrameRef.current = 0;
                rippleRingsRef.current.push({ phase: 0, strength: 0.6 });
                if (rippleRingsRef.current.length > 6) rippleRingsRef.current.shift();
              }
            }
            rippleRingsRef.current.forEach(r => { r.phase += 0.018; });
            rippleRingsRef.current = rippleRingsRef.current.filter(r => r.phase < 1.0);

            if (rippleRingsRef.current.length === 0) break;
            const ripSrc = getDisplayImageData();
            const ripOut = ctx.createImageData(displayWidth, displayHeight);
            const ripCx = displayWidth / 2, ripCy = displayHeight / 2;
            const ripMaxR = Math.sqrt(ripCx * ripCx + ripCy * ripCy);
            for (let y = 0; y < displayHeight; y++) {
              for (let x = 0; x < displayWidth; x++) {
                const dx = x - ripCx, dy = y - ripCy;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const norm = dist / ripMaxR;
                let totalOffset = 0;
                for (const ring of rippleRingsRef.current) {
                  const ringDist = norm - ring.phase;
                  const ringWidth = 0.1;
                  if (Math.abs(ringDist) < ringWidth) {
                    const profile = Math.cos((ringDist / ringWidth) * Math.PI * 0.5);
                    totalOffset += profile * ring.strength * rippleAmplitude * (1 - ring.phase * 0.9);
                  }
                }
                let srcX = x, srcY = y;
                if (totalOffset !== 0 && dist > 1) {
                  // Radial displacement alone is invisible on gradients whose color
                  // only varies with angle (e.g. Angle/Fade) since moving a pixel
                  // along its own radius doesn't change its color at all. Adding a
                  // tangential (perpendicular) component makes the ripple visible
                  // on angle-based gradients too, not just radially-varying ones.
                  const tx = -dy / dist, ty = dx / dist;
                  srcX = x + (dx / dist) * totalOffset + tx * totalOffset * 0.6;
                  srcY = y + (dy / dist) * totalOffset + ty * totalOffset * 0.6;
                }
                const clampedX = Math.max(0, Math.min(displayWidth - 1, Math.round(srcX)));
                const clampedY = Math.max(0, Math.min(displayHeight - 1, Math.round(srcY)));
                const di = (y * displayWidth + x) * 4;
                const si = (clampedY * displayWidth + clampedX) * 4;
                ripOut.data[di] = ripSrc.data[si]; ripOut.data[di+1] = ripSrc.data[si+1];
                ripOut.data[di+2] = ripSrc.data[si+2]; ripOut.data[di+3] = 255;
              }
            }
            putScaledImageData(ripOut);
          } catch(e) { /* skip */ }
          break;
        }

        case 'ascii': {
          // Halftone's sibling — brightness maps to a character ramp instead
          // of dot size.
          if (!imageData) break;
          const aSize = Math.max(6, asciiSize);
          const chars = asciiChars.length > 0 ? asciiChars : ' .:-=+*x#%@';
          const colsA = Math.ceil(displayWidth / aSize);
          const rowsA = Math.ceil(displayHeight / aSize);
          const idatA = imageData.data;
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, displayWidth, displayHeight);
          ctx.font = `${aSize}px monospace`;
          ctx.textBaseline = 'top';
          for (let r = 0; r < rowsA; r++) {
            for (let c = 0; c < colsA; c++) {
              const px = Math.min(displayWidth - 1, c * aSize + Math.floor(aSize / 2));
              const py = Math.min(displayHeight - 1, r * aSize + Math.floor(aSize / 2));
              const pIdx = (py * displayWidth + px) * 4;
              const pr = idatA[pIdx], pg = idatA[pIdx + 1], pb = idatA[pIdx + 2];
              const brightness = (pr + pg + pb) / 3 / 255;
              const charIdx = Math.min(chars.length - 1, Math.floor(brightness * chars.length));
              const ch = chars[charIdx];
              if (ch === ' ') continue;
              ctx.fillStyle = asciiColor ? `rgb(${pr},${pg},${pb})` : '#ffffff';
              ctx.fillText(ch, c * aSize, r * aSize);
            }
          }
          break;
        }

        case 'emoji': {
          // ASCII's sibling — brightness maps to an emoji ramp instead of a
          // character ramp, with each cell spinning about its own center.
          // Rotation only advances while Play is active (emojiAnimTime is
          // gated the same way as flowAnimTime/liquidAnimTime/etc.), so the
          // cells freeze in place when paused instead of a wall-clock spin.
          if (!imageData) break;
          const eSize = Math.max(10, emojiSize);
          const emojis = splitGraphemes(emojiChars.trim().length > 0 ? emojiChars : '😴🙂😃🤩🔥');
          // "Offset" means a brick/halftone-style stagger: every other row is
          // shifted horizontally (like the classic polka-dot pattern), not a
          // uniform pan of the whole grid. Offset sliders are bounded to
          // ±eSize, so one extra row/col of margin on each side is always
          // enough to keep the grid fully covering the canvas at any stagger
          // amount — no modulo wrapping needed.
          const colsE = Math.ceil(displayWidth / eSize) + 2;
          const rowsE = Math.ceil(displayHeight / eSize) + 2;
          const idatE = imageData.data;
          const baseAngle = emojiAnimTime * (Math.PI / 180);
          const rowStaggerX = emojiOffsetX;
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, displayWidth, displayHeight);
          ctx.font = `${eSize}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          // Auto-level pass: with many emoji in the ramp, a straight 0-255
          // linear split meant most of them never got picked unless the
          // current gradient's brightness happened to span the full range —
          // typical smooth gradients only cover a narrow band, so entries
          // near the ramp's ends (often exactly the ones just added from the
          // picker) silently never appeared. Stretching the actual observed
          // min-max range of THIS frame to fill 0-1 guarantees every entry in
          // the ramp gets used somewhere, the same idea as the audio Auto Gain.
          const cellBrightness: number[] = [];
          let minBrightness = Infinity, maxBrightness = -Infinity;
          for (let r = -1; r < rowsE; r++) {
            for (let c = -1; c < colsE; c++) {
              const cellCx = c * eSize + Math.floor(eSize / 2) + (((r % 2) + 2) % 2 === 1 ? rowStaggerX : 0);
              const cellCy = r * eSize + Math.floor(eSize / 2);
              if (cellCx < 0 || cellCx >= displayWidth || cellCy < 0 || cellCy >= displayHeight) {
                cellBrightness.push(-1);
                continue;
              }
              const pIdx = (Math.floor(cellCy) * displayWidth + Math.floor(cellCx)) * 4;
              const b = (idatE[pIdx] + idatE[pIdx + 1] + idatE[pIdx + 2]) / 3 / 255;
              cellBrightness.push(b);
              if (b < minBrightness) minBrightness = b;
              if (b > maxBrightness) maxBrightness = b;
            }
          }
          const brightnessRange = Math.max(0.001, maxBrightness - minBrightness);
          let cellIdx = 0;
          for (let r = -1; r < rowsE; r++) {
            for (let c = -1; c < colsE; c++) {
              const brightness = cellBrightness[cellIdx++];
              if (brightness < 0) continue;
              const cellCx = c * eSize + Math.floor(eSize / 2) + (((r % 2) + 2) % 2 === 1 ? rowStaggerX : 0);
              const cellCy = r * eSize + Math.floor(eSize / 2);
              const normalizedBrightness = (brightness - minBrightness) / brightnessRange;
              const emojiIdx = Math.min(emojis.length - 1, Math.floor(normalizedBrightness * emojis.length));
              const glyph = emojis[emojiIdx];
              if (!glyph || glyph === ' ') continue;
              // Deterministic per-cell jitter (stable across frames, no time
              // dependency) so "variable size" reads as a fixed organic mosaic
              // instead of flickering — same (row,col) always gets the same size.
              const jitter = emojiSizeVariation > 0
                ? Math.abs(Math.sin(r * 12.9898 + c * 78.233) * 43758.5453) % 1
                : 0;
              const sizeScale = 1 + (jitter * 2 - 1) * (emojiSizeVariation / 100) * 0.8;
              ctx.save();
              ctx.translate(cellCx, cellCy);
              ctx.rotate(baseAngle);
              if (sizeScale !== 1) ctx.scale(sizeScale, sizeScale);
              ctx.fillText(glyph, 0, 0);
              ctx.restore();
            }
          }
          break;
        }

        case 'photo': {
          // Blends the user-uploaded photo over the gradient. Cover-fit
          // (scale to fill, center-cropped) like a CSS background-size:cover,
          // rather than stretching to the canvas's aspect ratio. A no-op
          // until an image has actually been uploaded — see photoImageRef.
          if (canvas.width === 0 || canvas.height === 0) break;
          const photoImg = photoImageRef.current;
          if (!photoImg) break;
          ctx.save();
          ctx.globalAlpha = Math.max(0, Math.min(1, photoOpacity / 100));
          ctx.globalCompositeOperation = photoBlendMode;
          const canvasAspect = displayWidth / displayHeight;
          const imgAspect = photoImg.width / photoImg.height;
          let dw, dh, dx, dy;
          if (imgAspect > canvasAspect) {
            dh = displayHeight;
            dw = dh * imgAspect;
            dx = (displayWidth - dw) / 2;
            dy = 0;
          } else {
            dw = displayWidth;
            dh = dw / imgAspect;
            dx = 0;
            dy = (displayHeight - dh) / 2;
          }
          ctx.drawImage(photoImg, dx, dy, dw, dh);
          ctx.restore();
          break;
        }

        case 'liquid': {
          // Turbulent noise-driven refraction — sits between Fisheye (radial
          // warp) and Wave-Distortion (directional wave), but organic/swirly
          // like real liquid refraction instead of a single wave direction.
          if (canvas.width === 0 || canvas.height === 0) break;
          const liqSrc = getDisplayImageData();
          const liqOut = ctx.createImageData(displayWidth, displayHeight);
          const lScale = liquidScale * 0.006;
          const lTime = liquidAnimTime;
          const lStrength = liquidStrength;
          for (let y = 0; y < displayHeight; y++) {
            for (let x = 0; x < displayWidth; x++) {
              const n1 = Math.sin(x * lScale + lTime) * Math.cos(y * lScale * 1.3 - lTime * 0.7);
              const n2 = Math.sin((x + y) * lScale * 0.6 - lTime * 1.2) * 0.5;
              const dx = (n1 + n2) * lStrength;
              const n3 = Math.cos(x * lScale * 1.1 - lTime * 0.9) * Math.sin(y * lScale + lTime * 0.6);
              const n4 = Math.cos((x - y) * lScale * 0.7 + lTime * 1.1) * 0.5;
              const dy = (n3 + n4) * lStrength;
              const sx = Math.max(0, Math.min(displayWidth - 1, Math.round(x + dx)));
              const sy = Math.max(0, Math.min(displayHeight - 1, Math.round(y + dy)));
              const di = (y * displayWidth + x) * 4;
              const si = (sy * displayWidth + sx) * 4;
              liqOut.data[di] = liqSrc.data[si];
              liqOut.data[di + 1] = liqSrc.data[si + 1];
              liqOut.data[di + 2] = liqSrc.data[si + 2];
              liqOut.data[di + 3] = 255;
            }
          }
          putScaledImageData(liqOut);
          break;
        }

        case 'chromatic-trails': {
          // Feedback's echo-trail mechanic, plus a per-channel spatial offset
          // on the decaying trail so echoes separate into RGB fringes as they
          // fade — distinct from Feedback (no fringing) and from Chromatic
          // (no trail/decay).
          if (canvas.width === 0 || canvas.height === 0) break;
          if (!chromaticTrailsBufferRef.current || chromaticTrailsBufferRef.current.width !== displayWidth || chromaticTrailsBufferRef.current.height !== displayHeight) {
            chromaticTrailsBufferRef.current = document.createElement('canvas');
            chromaticTrailsBufferRef.current.width = displayWidth;
            chromaticTrailsBufferRef.current.height = displayHeight;
          }
          const ctBuf = chromaticTrailsBufferRef.current;
          const ctBufCtx = ctBuf.getContext('2d', { willReadFrequently: true })!;
          const ctBufData = ctBufCtx.getImageData(0, 0, displayWidth, displayHeight);
          const ctBd = ctBufData.data;
          const ctOff = Math.round(chromaticTrailsOffset);

          // Fringe + decay the trail: R sampled from the left, B from the
          // right, G stays put, alpha scaled down by the decay factor.
          const ctFringed = ctx.createImageData(displayWidth, displayHeight);
          const ctFd = ctFringed.data;
          for (let y = 0; y < displayHeight; y++) {
            for (let x = 0; x < displayWidth; x++) {
              const i = (y * displayWidth + x) * 4;
              const rx = Math.max(0, Math.min(displayWidth - 1, x - ctOff));
              const bx = Math.max(0, Math.min(displayWidth - 1, x + ctOff));
              const ri = (y * displayWidth + rx) * 4;
              const bi = (y * displayWidth + bx) * 4;
              ctFd[i] = ctBd[ri];
              ctFd[i + 1] = ctBd[i + 1];
              ctFd[i + 2] = ctBd[bi + 2];
              ctFd[i + 3] = Math.round(ctBd[i + 3] * chromaticTrailsDecay);
            }
          }
          ctBufCtx.putImageData(ctFringed, 0, 0);

          const ctTmp = document.createElement('canvas');
          ctTmp.width = displayWidth; ctTmp.height = displayHeight;
          ctTmp.getContext('2d')!.drawImage(canvas, 0, 0, displayWidth, displayHeight);

          ctx.clearRect(0, 0, displayWidth, displayHeight);
          ctx.drawImage(ctBuf, 0, 0);
          ctx.globalCompositeOperation = 'lighten';
          ctx.drawImage(ctTmp, 0, 0);
          ctx.globalCompositeOperation = 'source-over';

          // Feed the fresh (undecayed) frame back into the trail buffer.
          ctBufCtx.globalCompositeOperation = 'lighten';
          ctBufCtx.drawImage(ctTmp, 0, 0);
          ctBufCtx.globalCompositeOperation = 'source-over';
          break;
        }

      } } catch (err) {
        console.error(`Effect "${effectType}" failed:`, err);
        ctx.restore();
      }
      ctx.restore();
    });

    }; // end drawRef.current assignment

    const handleResize = () => {
      // Force re-assignment of drawRef on resize so new dimensions are captured
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawParams]);
}
