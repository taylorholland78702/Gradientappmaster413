/**
 * Canvas Helper Utilities
 * Common operations for canvas manipulation and pixel data processing
 */

export interface PixelData {
  imageData: ImageData;
  data: Uint8ClampedArray;
  data32: Uint32Array;
  width: number;
  height: number;
}

/**
 * Get pixel data with optimized Uint32Array view for fast pixel manipulation
 */
export function getPixelData(ctx: CanvasRenderingContext2D, width: number, height: number): PixelData {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data32 = new Uint32Array(imageData.data.buffer);
  
  return {
    imageData,
    data: imageData.data,
    data32,
    width,
    height
  };
}

/**
 * Put pixel data back to canvas
 */
export function putPixelData(ctx: CanvasRenderingContext2D, pixelData: PixelData): void {
  ctx.putImageData(pixelData.imageData, 0, 0);
}

/**
 * Create a temporary canvas for double-buffering operations
 */
export function createTempCanvas(width: number, height: number): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  if (!ctx) {
    throw new Error('Failed to create temp canvas context');
  }
  
  return { canvas, ctx };
}

/**
 * RGB to HSL conversion
 */
export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  
  if (max === min) {
    return [0, 0, l];
  }
  
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  
  let h = 0;
  if (max === r) {
    h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  } else if (max === g) {
    h = ((b - r) / d + 2) / 6;
  } else {
    h = ((r - g) / d + 4) / 6;
  }
  
  return [h, s, l];
}

/**
 * HSL to RGB conversion
 */
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const val = Math.round(l * 255);
    return [val, val, val];
  }
  
  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  
  const r = hue2rgb(p, q, h + 1/3);
  const g = hue2rgb(p, q, h);
  const b = hue2rgb(p, q, h - 1/3);
  
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Map value from one range to another
 */
export function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  return outMin + ((value - inMin) * (outMax - outMin)) / (inMax - inMin);
}

/**
 * Sample pixel with bounds checking
 */
export function samplePixel(
  data: Uint8ClampedArray,
  x: number,
  y: number,
  width: number,
  height: number
): [number, number, number, number] {
  const clampedX = Math.min(Math.max(0, Math.floor(x)), width - 1);
  const clampedY = Math.min(Math.max(0, Math.floor(y)), height - 1);
  const idx = (clampedY * width + clampedX) * 4;
  
  return [
    data[idx],
    data[idx + 1],
    data[idx + 2],
    data[idx + 3]
  ];
}

/**
 * Fast pixel copy using Uint32Array
 */
export function copyPixelFast(
  src: Uint32Array,
  dst: Uint32Array,
  srcIdx: number,
  dstIdx: number
): void {
  dst[dstIdx] = src[srcIdx];
}
