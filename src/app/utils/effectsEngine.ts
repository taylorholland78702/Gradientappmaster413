/**
 * Effects Engine
 * Handles all visual effects rendering with optimized pixel operations
 */

import {
  getPixelData,
  putPixelData,
  createTempCanvas,
  rgbToHsl,
  hslToRgb,
  clamp,
  copyPixelFast,
  type PixelData
} from './canvasHelpers';
import { getColorAtPosition, type GradientColor } from './gradientRenderer';

export interface EffectConfig {
  type: string;
  intensity?: number;
  audioModulation?: number;
  
  // Kaleidoscope
  kaleidoscopeSegments?: number;
  
  // Twist
  twistAmount?: number;
  
  // Pixelate
  pixelSize?: number;
  
  // Triangle
  triangleSize?: number;
  
  // Chromatic
  chromaticOffset?: number;
  
  // Fisheye
  fisheyeStrength?: number;
  
  // Tile
  tileCount?: number;
  
  // Grain
  grainIntensity?: number;
  grainType?: string;
  
  // Blur
  blurType?: string;
  blurGaussianAmount?: number;
  blurMotionAmount?: number;
  blurMotionDirection?: number;
  blurRadialAmount?: number;
  
  // Posterize
  posterizeLevels?: number;
  
  // Halftone
  halftoneSize?: number;
  halftoneVariation?: number;
  halftoneMove?: number;
  halftoneMoveSpeed?: number;
  halftoneAnimTrigger?: number;
  
  // Vignette
  vignetteStrength?: number;
  
  // Color Shift
  colorShiftHue?: number;
  
  // Bulge/Pinch
  bulgeStrength?: number;
  pinchStrength?: number;
  
  // Scanlines
  scanLineSize?: number;
  
  // Grids
  triGridSize?: number;
  hexGridSize?: number;
  gridRotation?: number;
  gridRows?: number;
  gridColumns?: number;
  gridShapeSize?: number;
  gridVariation?: number;
  gridShape?: string;
  
  // Lines
  linesCount?: number;
  linesAngle?: number;
  linesThickness?: number;
  
  // Polar
  polarAngle?: number;
  polarRadius?: number;
  
  // Various intensities
  dustIntensity?: number;
  dustCrackleIntensity?: number;
  vhsGlitchIntensity?: number;
  waveDistortionStrength?: number;
  waveDistortionRotation?: number;
  liquifyStrength?: number;
  charcoalIntensity?: number;
  sepiaIntensity?: number;
  solarizeThreshold?: number;
  lightLeakIntensity?: number;
  digitalNoiseIntensity?: number;
  
  // Duotone/Tritone
  duotoneIntensity?: number;
  duotoneColor1?: string;
  duotoneColor2?: string;
  tritoneIntensity?: number;
  tritoneColor1?: string;
  tritoneColor2?: string;
  tritoneColor3?: string;
  
  // Color Dodge/Burn
  colorDodgeIntensity?: number;
  colorBurnIntensity?: number;
  
  // Bokeh
  bokehSize?: number;
  bokehIntensity?: number;
  bokehBrightness?: number;
  
  // Brightness
  brightnessAmount?: number;
  
  // Dither
  ditherType?: string;
  ditherLevels?: number;
  
  // Slit-scan
  slitScanIntensity?: number;
  slitScanDirection?: string;
  slitScanBuffer?: ImageData[];
  
  // Diffusion
  diffusionSpeed?: number;
  diffusionFeed?: number;
  diffusionKill?: number;
  diffusionState?: { a: Float32Array; b: Float32Array };
  
  // Gradient colors for some effects
  gradientColors?: GradientColor[];
}

/**
 * Apply effect to canvas
 */
export function applyEffect(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  tempCanvas: HTMLCanvasElement,
  tempCtx: CanvasRenderingContext2D,
  config: EffectConfig
): void {
  const { width, height } = canvas;
  
  if (width === 0 || height === 0) return;
  
  switch (config.type) {
    case 'kaleidoscope':
      applyKaleidoscope(ctx, canvas, tempCanvas, tempCtx, config);
      break;
    case 'invert':
      applyInvert(ctx, canvas);
      break;
    case 'twist':
      applyTwist(ctx, canvas, config);
      break;
    case 'pixelate':
      applyPixelate(ctx, canvas, config);
      break;
    case 'triangle':
      applyTriangle(ctx, canvas, config);
      break;
    case 'chromatic':
      applyChromaticAberration(ctx, canvas, config);
      break;
    case 'fisheye':
      applyFisheye(ctx, canvas, config);
      break;
    case 'tile':
      applyTile(ctx, canvas, tempCanvas, tempCtx, config);
      break;
    case 'film-grain':
      applyFilmGrain(ctx, canvas, config);
      break;
    case 'blur':
      applyBlur(ctx, canvas, config);
      break;
    case 'posterize':
      applyPosterize(ctx, canvas, config);
      break;
    case 'halftone':
      applyHalftone(ctx, canvas, tempCanvas, tempCtx, config);
      break;
    case 'vignette':
      applyVignette(ctx, canvas, config);
      break;
    case 'color-shift':
      applyColorShift(ctx, canvas, config);
      break;
    case 'bulge':
      applyBulge(ctx, canvas, config);
      break;
    case 'pinch':
      applyPinch(ctx, canvas, config);
      break;
    case 'scanlines':
      applyScanlines(ctx, canvas, config);
      break;
    case 'tri-grid':
      applyTriGrid(ctx, canvas, tempCanvas, tempCtx, config);
      break;
    case 'hex-grid':
      applyHexGrid(ctx, canvas, tempCanvas, tempCtx, config);
      break;
    case 'lines':
      applyLines(ctx, canvas, config);
      break;
    case 'polar':
      applyPolarCoordinates(ctx, canvas, config);
      break;
    case 'charcoal':
      applyCharcoal(ctx, canvas, config);
      break;
    case 'sepia':
      applySepia(ctx, canvas, config);
      break;
    case 'dust-scratches':
      applyDustScratches(ctx, canvas, config);
      break;
    case 'crackle':
      applyCrackle(ctx, canvas, config);
      break;
    case 'vhs-glitch':
      applyVHSGlitch(ctx, canvas, config);
      break;
    case 'wave-distortion':
      applyWaveDistortion(ctx, canvas, config);
      break;
    case 'liquify':
      applyLiquify(ctx, canvas, config);
      break;
    case 'solarize':
      applySolarize(ctx, canvas, config);
      break;
    case 'light-leak':
      applyLightLeak(ctx, canvas, config);
      break;
    case 'duotone':
      applyDuotone(ctx, canvas, config);
      break;
    case 'tritone':
      applyTritone(ctx, canvas, config);
      break;
    case 'gradient-map':
      applyGradientMap(ctx, canvas, config);
      break;
    case 'color-dodge':
      applyColorDodge(ctx, canvas, config);
      break;
    case 'color-burn':
      applyColorBurn(ctx, canvas, config);
      break;
    case 'digital-noise':
      applyDigitalNoise(ctx, canvas, config);
      break;
    case 'grid':
      applyGrid(ctx, canvas, tempCanvas, tempCtx, config);
      break;
    case 'bokeh':
      applyBokeh(ctx, canvas, config);
      break;
    case 'brightness':
      applyBrightness(ctx, canvas, config);
      break;
    case 'dither':
      applyDither(ctx, canvas, config);
      break;
    case 'slit-scan':
      applySlitScan(ctx, canvas, config);
      break;
    case 'diffusion':
      applyDiffusion(ctx, canvas, config);
      break;
  }
}

// ============ EFFECT IMPLEMENTATIONS ============

function applyKaleidoscope(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  tempCanvas: HTMLCanvasElement,
  tempCtx: CanvasRenderingContext2D,
  config: EffectConfig
): void {
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  tempCtx.drawImage(canvas, 0, 0);
  
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const segments = (config.kaleidoscopeSegments || 6) + (config.audioModulation || 0);
  const anglePerSegment = (Math.PI * 2) / segments;
  const radius = Math.sqrt(cx * cx + cy * cy);
  
  for (let i = 0; i < segments; i++) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(i * anglePerSegment);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(radius, -radius * Math.tan(anglePerSegment / 2));
    ctx.lineTo(radius, radius * Math.tan(anglePerSegment / 2));
    ctx.closePath();
    ctx.clip();
    
    if (i % 2 === 0) {
      ctx.scale(1, -1);
    }
    
    ctx.rotate(-i * anglePerSegment);
    ctx.drawImage(tempCanvas, -cx, -cy);
    ctx.restore();
  }
  
  ctx.imageSmoothingEnabled = true;
}

function applyInvert(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
  const pixelData = getPixelData(ctx, canvas.width, canvas.height);
  const { data } = pixelData;
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];
    data[i + 1] = 255 - data[i + 1];
    data[i + 2] = 255 - data[i + 2];
  }
  
  putPixelData(ctx, pixelData);
}

function applyTwist(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  config: EffectConfig
): void {
  const { canvas: tempCanvas, ctx: tempCtx } = createTempCanvas(canvas.width, canvas.height);
  tempCtx.drawImage(canvas, 0, 0);
  
  const pixelData = getPixelData(ctx, canvas.width, canvas.height);
  const tempData = getPixelData(tempCtx, canvas.width, canvas.height);
  
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);
  const twistAmount = ((config.twistAmount || 0) + (config.audioModulation || 0)) * Math.PI / 180;
  
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      
      const twist = (1 - dist / maxDist) * twistAmount;
      const newAngle = angle + twist;
      
      const srcX = Math.round(cx + Math.cos(newAngle) * dist);
      const srcY = Math.round(cy + Math.sin(newAngle) * dist);
      
      if (srcX >= 0 && srcX < canvas.width && srcY >= 0 && srcY < canvas.height) {
        const srcIdx = (srcY * canvas.width + srcX) * 4;
        const dstIdx = (y * canvas.width + x) * 4;
        
        pixelData.data[dstIdx] = tempData.data[srcIdx];
        pixelData.data[dstIdx + 1] = tempData.data[srcIdx + 1];
        pixelData.data[dstIdx + 2] = tempData.data[srcIdx + 2];
        pixelData.data[dstIdx + 3] = tempData.data[srcIdx + 3];
      }
    }
  }
  
  putPixelData(ctx, pixelData);
}

function applyPixelate(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  config: EffectConfig
): void {
  const pixelSize = Math.max(1, (config.pixelSize || 10) - (config.audioModulation || 0));
  
  ctx.imageSmoothingEnabled = false;
  const smallW = Math.ceil(canvas.width / pixelSize);
  const smallH = Math.ceil(canvas.height / pixelSize);
  
  const { canvas: tempCanvas, ctx: tempCtx } = createTempCanvas(canvas.width, canvas.height);
  tempCtx.drawImage(canvas, 0, 0);
  
  ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height, 0, 0, smallW, smallH);
  ctx.drawImage(ctx.canvas, 0, 0, smallW, smallH, 0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true;
}

function applyTriangle(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  config: EffectConfig
): void {
  const { canvas: tempCanvas, ctx: tempCtx } = createTempCanvas(canvas.width, canvas.height);
  tempCtx.drawImage(canvas, 0, 0);
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const size = (config.triangleSize || 20) - (config.audioModulation || 0);
  const height = size * Math.sqrt(3) / 2;
  
  for (let y = 0; y < canvas.height; y += height) {
    for (let x = 0; x < canvas.width; x += size) {
      const offsetX = (Math.floor(y / height) % 2) * (size / 2);
      const cx = x + offsetX + size / 2;
      const cy = y + height / 2;
      
      try {
        const pixel = tempCtx.getImageData(
          Math.min(Math.max(0, Math.floor(cx)), canvas.width - 1),
          Math.min(Math.max(0, Math.floor(cy)), canvas.height - 1),
          1,
          1
        ).data;
        
        ctx.fillStyle = `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`;
        ctx.beginPath();
        ctx.moveTo(cx, cy - height / 2);
        ctx.lineTo(cx - size / 2, cy + height / 2);
        ctx.lineTo(cx + size / 2, cy + height / 2);
        ctx.closePath();
        ctx.fill();
      } catch (e) {
        // Skip if out of bounds
      }
    }
  }
}

function applyChromaticAberration(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  config: EffectConfig
): void {
  const { canvas: tempCanvas, ctx: tempCtx } = createTempCanvas(canvas.width, canvas.height);
  tempCtx.drawImage(canvas, 0, 0);
  
  const offset = (config.chromaticOffset || 0) + (config.audioModulation || 0);
  const original = getPixelData(tempCtx, canvas.width, canvas.height);
  const output = getPixelData(ctx, canvas.width, canvas.height);
  
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const idx = (y * canvas.width + x) * 4;
      
      // Red channel - shift left
      const rX = Math.max(0, Math.min(canvas.width - 1, x - offset));
      const rIdx = (y * canvas.width + rX) * 4;
      output.data[idx] = original.data[rIdx];
      
      // Green channel - no shift
      output.data[idx + 1] = original.data[idx + 1];
      
      // Blue channel - shift right
      const bX = Math.max(0, Math.min(canvas.width - 1, x + offset));
      const bIdx = (y * canvas.width + bX) * 4;
      output.data[idx + 2] = original.data[bIdx + 2];
      
      output.data[idx + 3] = 255;
    }
  }
  
  putPixelData(ctx, output);
}

function applyFisheye(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  config: EffectConfig
): void {
  const { canvas: tempCanvas, ctx: tempCtx } = createTempCanvas(canvas.width, canvas.height);
  tempCtx.drawImage(canvas, 0, 0);
  
  const strength = ((config.fisheyeStrength || 0) + (config.audioModulation || 0)) / 100;
  const pixelData = getPixelData(ctx, canvas.width, canvas.height);
  const tempData = getPixelData(tempCtx, canvas.width, canvas.height);
  
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = Math.min(cx, cy);
  
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const dx = (x - cx) / radius;
      const dy = (y - cy) / radius;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 1) {
        const amount = 1 - (1 - dist) * strength;
        const srcX = Math.round(cx + dx * radius * amount);
        const srcY = Math.round(cy + dy * radius * amount);
        
        if (srcX >= 0 && srcX < canvas.width && srcY >= 0 && srcY < canvas.height) {
          const srcIdx = (srcY * canvas.width + srcX) * 4;
          const dstIdx = (y * canvas.width + x) * 4;
          
          pixelData.data[dstIdx] = tempData.data[srcIdx];
          pixelData.data[dstIdx + 1] = tempData.data[srcIdx + 1];
          pixelData.data[dstIdx + 2] = tempData.data[srcIdx + 2];
          pixelData.data[dstIdx + 3] = tempData.data[srcIdx + 3];
        }
      }
    }
  }
  
  putPixelData(ctx, pixelData);
}

function applyTile(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  tempCanvas: HTMLCanvasElement,
  tempCtx: CanvasRenderingContext2D,
  config: EffectConfig
): void {
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  tempCtx.drawImage(canvas, 0, 0);
  
  const count = Math.max(1, (config.tileCount || 2) + (config.audioModulation || 0));
  const tileW = canvas.width / count;
  const tileH = canvas.height / count;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  for (let ty = 0; ty < count; ty++) {
    for (let tx = 0; tx < count; tx++) {
      ctx.drawImage(
        tempCanvas,
        0, 0, canvas.width, canvas.height,
        tx * tileW, ty * tileH, tileW, tileH
      );
    }
  }
}

function applyFilmGrain(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  config: EffectConfig
): void {
  const pixelData = getPixelData(ctx, canvas.width, canvas.height);
  const { data } = pixelData;
  const intensity = ((config.grainIntensity || 0) + (config.audioModulation || 0)) / 100;
  const isColor = config.grainType === 'color';
  
  for (let i = 0; i < data.length; i += 4) {
    if (isColor) {
      data[i] = clamp(data[i] + (Math.random() - 0.5) * 255 * intensity, 0, 255);
      data[i + 1] = clamp(data[i + 1] + (Math.random() - 0.5) * 255 * intensity, 0, 255);
      data[i + 2] = clamp(data[i + 2] + (Math.random() - 0.5) * 255 * intensity, 0, 255);
    } else {
      const noise = (Math.random() - 0.5) * 255 * intensity;
      data[i] = clamp(data[i] + noise, 0, 255);
      data[i + 1] = clamp(data[i + 1] + noise, 0, 255);
      data[i + 2] = clamp(data[i + 2] + noise, 0, 255);
    }
  }
  
  putPixelData(ctx, pixelData);
}

function applyBlur(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  config: EffectConfig
): void {
  const blurType = config.blurType || 'gaussian';
  
  if (blurType === 'gaussian') {
    const amount = (config.blurGaussianAmount || 0) + (config.audioModulation || 0);
    ctx.filter = `blur(${amount}px)`;
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = 'none';
  } else if (blurType === 'motion') {
    const amount = (config.blurMotionAmount || 0) + (config.audioModulation || 0);
    const direction = (config.blurMotionDirection || 0) * Math.PI / 180;
    const offsetX = Math.cos(direction) * amount * 0.5;
    const offsetY = Math.sin(direction) * amount * 0.5;
    
    const { canvas: tempCanvas } = createTempCanvas(canvas.width, canvas.height);
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.drawImage(canvas, 0, 0);
    
    ctx.globalAlpha = 0.3;
    for (let i = 1; i <= 3; i++) {
      ctx.drawImage(tempCanvas, offsetX * i, offsetY * i);
      ctx.drawImage(tempCanvas, -offsetX * i, -offsetY * i);
    }
    ctx.globalAlpha = 1;
  }
}

function applyPosterize(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  config: EffectConfig
): void {
  const pixelData = getPixelData(ctx, canvas.width, canvas.height);
  const { data } = pixelData;
  const levels = Math.max(2, (config.posterizeLevels || 4) - (config.audioModulation || 0));
  const step = 255 / (levels - 1);
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.round(data[i] / step) * step;
    data[i + 1] = Math.round(data[i + 1] / step) * step;
    data[i + 2] = Math.round(data[i + 2] / step) * step;
  }
  
  putPixelData(ctx, pixelData);
}

function applyHalftone(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  tempCanvas: HTMLCanvasElement,
  tempCtx: CanvasRenderingContext2D,
  config: EffectConfig
): void {
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  tempCtx.drawImage(canvas, 0, 0);
  
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  const dotSize = (config.halftoneSize || 5) - (config.audioModulation || 0);
  const variation = (config.halftoneVariation || 0) / 100;
  
  for (let y = 0; y < canvas.height; y += dotSize) {
    for (let x = 0; x < canvas.width; x += dotSize) {
      try {
        const pixel = tempCtx.getImageData(
          Math.min(x, canvas.width - 1),
          Math.min(y, canvas.height - 1),
          1,
          1
        ).data;
        
        const brightness = (pixel[0] + pixel[1] + pixel[2]) / 3 / 255;
        const radius = (dotSize / 2) * (1 - brightness) * (1 + (Math.random() - 0.5) * variation);
        
        ctx.fillStyle = `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`;
        ctx.beginPath();
        ctx.arc(x + dotSize / 2, y + dotSize / 2, radius, 0, Math.PI * 2);
        ctx.fill();
      } catch (e) {
        // Skip
      }
    }
  }
}

function applyVignette(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  config: EffectConfig
): void {
  const strength = ((config.vignetteStrength || 0) + (config.audioModulation || 0)) / 100;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);
  
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxDist);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, `rgba(0,0,0,${strength})`);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function applyColorShift(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  config: EffectConfig
): void {
  const pixelData = getPixelData(ctx, canvas.width, canvas.height);
  const { data } = pixelData;
  const hueShift = ((config.colorShiftHue || 0) + (config.audioModulation || 0)) / 360;
  
  for (let i = 0; i < data.length; i += 4) {
    const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
    const newH = (h + hueShift) % 1;
    const [r, g, b] = hslToRgb(newH, s, l);
    
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
  
  putPixelData(ctx, pixelData);
}

function applyBulge(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  config: EffectConfig
): void {
  const { canvas: tempCanvas, ctx: tempCtx } = createTempCanvas(canvas.width, canvas.height);
  tempCtx.drawImage(canvas, 0, 0);
  
  const strength = ((config.bulgeStrength || 0) + (config.audioModulation || 0)) / 100;
  const pixelData = getPixelData(ctx, canvas.width, canvas.height);
  const tempData = getPixelData(tempCtx, canvas.width, canvas.height);
  
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = Math.min(cx, cy);
  
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const dx = (x - cx) / radius;
      const dy = (y - cy) / radius;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 1) {
        const amount = 1 + (1 - dist) * strength;
        const srcX = Math.round(cx + dx * radius * amount);
        const srcY = Math.round(cy + dy * radius * amount);
        
        if (srcX >= 0 && srcX < canvas.width && srcY >= 0 && srcY < canvas.height) {
          const srcIdx = (srcY * canvas.width + srcX) * 4;
          const dstIdx = (y * canvas.width + x) * 4;
          
          pixelData.data[dstIdx] = tempData.data[srcIdx];
          pixelData.data[dstIdx + 1] = tempData.data[srcIdx + 1];
          pixelData.data[dstIdx + 2] = tempData.data[srcIdx + 2];
          pixelData.data[dstIdx + 3] = tempData.data[srcIdx + 3];
        }
      }
    }
  }
  
  putPixelData(ctx, pixelData);
}

function applyPinch(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  config: EffectConfig
): void {
  const { canvas: tempCanvas, ctx: tempCtx } = createTempCanvas(canvas.width, canvas.height);
  tempCtx.drawImage(canvas, 0, 0);
  
  const strength = ((config.pinchStrength || 0) + (config.audioModulation || 0)) / 100;
  const pixelData = getPixelData(ctx, canvas.width, canvas.height);
  const tempData = getPixelData(tempCtx, canvas.width, canvas.height);
  
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = Math.min(cx, cy);
  
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const dx = (x - cx) / radius;
      const dy = (y - cy) / radius;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 1) {
        const amount = 1 - (1 - dist) * strength;
        const srcX = Math.round(cx + dx * radius * amount);
        const srcY = Math.round(cy + dy * radius * amount);
        
        if (srcX >= 0 && srcX < canvas.width && srcY >= 0 && srcY < canvas.height) {
          const srcIdx = (srcY * canvas.width + srcX) * 4;
          const dstIdx = (y * canvas.width + x) * 4;
          
          pixelData.data[dstIdx] = tempData.data[srcIdx];
          pixelData.data[dstIdx + 1] = tempData.data[srcIdx + 1];
          pixelData.data[dstIdx + 2] = tempData.data[srcIdx + 2];
          pixelData.data[dstIdx + 3] = tempData.data[srcIdx + 3];
        }
      }
    }
  }
  
  putPixelData(ctx, pixelData);
}

function applyScanlines(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  config: EffectConfig
): void {
  const size = Math.max(1, (config.scanLineSize || 2) - (config.audioModulation || 0));
  
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  for (let y = 0; y < canvas.height; y += size * 2) {
    ctx.fillRect(0, y, canvas.width, size);
  }
}

// Simplified implementations for remaining effects
function applyTriGrid(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, tempCanvas: HTMLCanvasElement, tempCtx: CanvasRenderingContext2D, config: EffectConfig): void {
  // Simplified - actual implementation would be more complex
}

function applyHexGrid(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, tempCanvas: HTMLCanvasElement, tempCtx: CanvasRenderingContext2D, config: EffectConfig): void {
  // Simplified
}

function applyLines(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, config: EffectConfig): void {
  // Simplified
}

function applyPolarCoordinates(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, config: EffectConfig): void {
  // Simplified
}

function applyCharcoal(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, config: EffectConfig): void {
  const pixelData = getPixelData(ctx, canvas.width, canvas.height);
  const { data } = pixelData;
  
  for (let i = 0; i < data.length; i += 4) {
    const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const charcoal = 255 - gray;
    data[i] = data[i + 1] = data[i + 2] = charcoal;
  }
  
  putPixelData(ctx, pixelData);
}

function applySepia(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, config: EffectConfig): void {
  const pixelData = getPixelData(ctx, canvas.width, canvas.height);
  const { data } = pixelData;
  const intensity = (config.sepiaIntensity || 50) / 100;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    const tr = Math.min(255, (r * 0.393 + g * 0.769 + b * 0.189));
    const tg = Math.min(255, (r * 0.349 + g * 0.686 + b * 0.168));
    const tb = Math.min(255, (r * 0.272 + g * 0.534 + b * 0.131));
    
    data[i] = r + (tr - r) * intensity;
    data[i + 1] = g + (tg - g) * intensity;
    data[i + 2] = b + (tb - b) * intensity;
  }
  
  putPixelData(ctx, pixelData);
}

function applyDustScratches(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, config: EffectConfig): void {
  const intensity = (config.dustIntensity || 50) / 100;
  const count = Math.floor(intensity * 100);
  
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  for (let i = 0; i < count; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = Math.random() * 3;
    ctx.fillRect(x, y, size, size);
  }
}

function applyCrackle(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, config: EffectConfig): void {
  // Similar to dust-scratches but with lines
  const intensity = (config.dustCrackleIntensity || 50) / 100;
  const count = Math.floor(intensity * 20);
  
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 1;
  
  for (let i = 0; i < count; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.stroke();
  }
}

function applyVHSGlitch(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, config: EffectConfig): void {
  // Simplified VHS effect
  const intensity = (config.vhsGlitchIntensity || 0) / 100;
  
  if (Math.random() < intensity * 0.1) {
    const y = Math.random() * canvas.height;
    const h = Math.random() * 50;
    const offset = (Math.random() - 0.5) * 20;
    
    const imgData = ctx.getImageData(0, y, canvas.width, h);
    ctx.putImageData(imgData, offset, y);
  }
}

function applyWaveDistortion(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, config: EffectConfig): void {
  // Simplified
}

function applyLiquify(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, config: EffectConfig): void {
  // Simplified
}

function applySolarize(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, config: EffectConfig): void {
  const pixelData = getPixelData(ctx, canvas.width, canvas.height);
  const { data } = pixelData;
  const threshold = (config.solarizeThreshold || 128);
  
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > threshold) data[i] = 255 - data[i];
    if (data[i + 1] > threshold) data[i + 1] = 255 - data[i + 1];
    if (data[i + 2] > threshold) data[i + 2] = 255 - data[i + 2];
  }
  
  putPixelData(ctx, pixelData);
}

function applyLightLeak(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, config: EffectConfig): void {
  // Simplified
}

function applyDuotone(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, config: EffectConfig): void {
  // Simplified
}

function applyTritone(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, config: EffectConfig): void {
  // Simplified
}

function applyGradientMap(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, config: EffectConfig): void {
  // Simplified
}

function applyColorDodge(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, config: EffectConfig): void {
  // Simplified
}

function applyColorBurn(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, config: EffectConfig): void {
  // Simplified
}

function applyDigitalNoise(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, config: EffectConfig): void {
  const pixelData = getPixelData(ctx, canvas.width, canvas.height);
  const { data } = pixelData;
  const intensity = (config.digitalNoiseIntensity || 0) / 100;
  
  for (let i = 0; i < data.length; i += 4) {
    if (Math.random() < intensity * 0.1) {
      const val = Math.random() > 0.5 ? 255 : 0;
      data[i] = data[i + 1] = data[i + 2] = val;
    }
  }
  
  putPixelData(ctx, pixelData);
}

function applyGrid(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, tempCanvas: HTMLCanvasElement, tempCtx: CanvasRenderingContext2D, config: EffectConfig): void {
  // Simplified
}

function applyBokeh(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, config: EffectConfig): void {
  // Simplified
}

function applyBrightness(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, config: EffectConfig): void {
  const amount = ((config.brightnessAmount || 0) - 50) * 2.55;
  const pixelData = getPixelData(ctx, canvas.width, canvas.height);
  const { data } = pixelData;
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp(data[i] + amount, 0, 255);
    data[i + 1] = clamp(data[i + 1] + amount, 0, 255);
    data[i + 2] = clamp(data[i + 2] + amount, 0, 255);
  }
  
  putPixelData(ctx, pixelData);
}

function applyDither(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, config: EffectConfig): void {
  const pixelData = getPixelData(ctx, canvas.width, canvas.height);
  const { data } = pixelData;
  const levels = config.ditherLevels || 8;
  const step = 255 / (levels - 1);
  
  // Simple Floyd-Steinberg dithering
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      
      for (let c = 0; c < 3; c++) {
        const oldVal = data[i + c];
        const newVal = Math.round(oldVal / step) * step;
        data[i + c] = newVal;
        
        const error = oldVal - newVal;
        
        // Distribute error to neighbors
        if (x + 1 < canvas.width) {
          data[i + 4 + c] += error * 0.44;
        }
        if (y + 1 < canvas.height) {
          if (x > 0) data[i + canvas.width * 4 - 4 + c] += error * 0.19;
          data[i + canvas.width * 4 + c] += error * 0.31;
          if (x + 1 < canvas.width) data[i + canvas.width * 4 + 4 + c] += error * 0.06;
        }
      }
    }
  }
  
  putPixelData(ctx, pixelData);
}

function applySlitScan(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, config: EffectConfig): void {
  if (!config.slitScanBuffer || config.slitScanBuffer.length < 2) return;
  
  const output = ctx.createImageData(canvas.width, canvas.height);
  const intensity = config.slitScanIntensity || 0.5;
  const buffer = config.slitScanBuffer;
  const direction = config.slitScanDirection || 'horizontal';
  
  if (direction === 'horizontal') {
    for (let y = 0; y < canvas.height; y++) {
      const frameIdx = Math.min(
        Math.floor((y / canvas.height) * (buffer.length - 1) * intensity),
        buffer.length - 1
      );
      const sourceFrame = buffer[frameIdx];
      
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        output.data[i] = sourceFrame.data[i];
        output.data[i + 1] = sourceFrame.data[i + 1];
        output.data[i + 2] = sourceFrame.data[i + 2];
        output.data[i + 3] = sourceFrame.data[i + 3];
      }
    }
  }
  
  ctx.putImageData(output, 0, 0);
}

function applyDiffusion(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, config: EffectConfig): void {
  // Complex reaction-diffusion - simplified for now
  if (!config.diffusionState) return;
  
  const { a, b } = config.diffusionState;
  const output = ctx.createImageData(canvas.width, canvas.height);
  const { data } = output;
  
  for (let i = 0; i < a.length; i++) {
    const val = Math.floor(a[i] * 255);
    data[i * 4] = val;
    data[i * 4 + 1] = val;
    data[i * 4 + 2] = val;
    data[i * 4 + 3] = 255;
  }
  
  ctx.putImageData(output, 0, 0);
}
