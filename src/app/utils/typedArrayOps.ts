/**
 * Typed Array Operations
 * Optimized pixel manipulation using Uint32Array and other typed arrays
 * 
 * Performance Note: Uint32Array operations are 2-3x faster than byte-level manipulation
 * because they operate on 32-bit words instead of individual bytes.
 */

/**
 * Fast pixel fill using Uint32Array
 * @param data32 - Uint32Array view of pixel data
 * @param color - RGBA color as 32-bit integer (AABBGGRR format)
 */
export function fillPixelsFast(data32: Uint32Array, color: number): void {
  data32.fill(color);
}

/**
 * Convert RGBA components to 32-bit pixel value
 * @param r - Red (0-255)
 * @param g - Green (0-255)
 * @param b - Blue (0-255)
 * @param a - Alpha (0-255)
 * @returns 32-bit pixel value in AABBGGRR format
 */
export function rgbaToPixel(r: number, g: number, b: number, a: number = 255): number {
  return (a << 24) | (b << 16) | (g << 8) | r;
}

/**
 * Extract RGBA components from 32-bit pixel value
 * @param pixel - 32-bit pixel value
 * @returns [r, g, b, a]
 */
export function pixelToRgba(pixel: number): [number, number, number, number] {
  return [
    pixel & 0xFF,           // Red
    (pixel >> 8) & 0xFF,    // Green
    (pixel >> 16) & 0xFF,   // Blue
    (pixel >> 24) & 0xFF    // Alpha
  ];
}

/**
 * Copy pixels from source to destination using Uint32Array
 * Much faster than copying byte-by-byte
 */
export function copyPixelsFast(
  src: Uint32Array,
  dst: Uint32Array,
  srcOffset: number = 0,
  dstOffset: number = 0,
  length?: number
): void {
  const copyLength = length ?? Math.min(src.length - srcOffset, dst.length - dstOffset);
  const srcView = src.subarray(srcOffset, srcOffset + copyLength);
  dst.set(srcView, dstOffset);
}

/**
 * Blend two pixel values with alpha
 * @param bottom - Bottom pixel
 * @param top - Top pixel
 * @param alpha - Blend alpha (0-1)
 * @returns Blended pixel value
 */
export function blendPixels(bottom: number, top: number, alpha: number): number {
  const [br, bg, bb, ba] = pixelToRgba(bottom);
  const [tr, tg, tb, ta] = pixelToRgba(top);
  
  const a = alpha * (ta / 255);
  const r = Math.round(tr * a + br * (1 - a));
  const g = Math.round(tg * a + bg * (1 - a));
  const b = Math.round(tb * a + bb * (1 - a));
  const finalA = Math.round(ta * alpha + ba * (1 - alpha));
  
  return rgbaToPixel(r, g, b, finalA);
}

/**
 * Apply brightness to pixel
 * @param pixel - Original pixel
 * @param brightness - Brightness adjustment (-255 to 255)
 * @returns Modified pixel
 */
export function adjustBrightness(pixel: number, brightness: number): number {
  const [r, g, b, a] = pixelToRgba(pixel);
  
  return rgbaToPixel(
    Math.max(0, Math.min(255, r + brightness)),
    Math.max(0, Math.min(255, g + brightness)),
    Math.max(0, Math.min(255, b + brightness)),
    a
  );
}

/**
 * Apply contrast to pixel
 * @param pixel - Original pixel
 * @param contrast - Contrast multiplier (0-2, where 1 is no change)
 * @returns Modified pixel
 */
export function adjustContrast(pixel: number, contrast: number): number {
  const [r, g, b, a] = pixelToRgba(pixel);
  const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
  
  return rgbaToPixel(
    Math.max(0, Math.min(255, factor * (r - 128) + 128)),
    Math.max(0, Math.min(255, factor * (g - 128) + 128)),
    Math.max(0, Math.min(255, factor * (b - 128) + 128)),
    a
  );
}

/**
 * Invert pixel colors
 */
export function invertPixel(pixel: number): number {
  const [r, g, b, a] = pixelToRgba(pixel);
  return rgbaToPixel(255 - r, 255 - g, 255 - b, a);
}

/**
 * Convert pixel to grayscale
 * @param pixel - Original pixel
 * @param method - 'average', 'luminosity', or 'lightness'
 * @returns Grayscale pixel
 */
export function grayscalePixel(
  pixel: number,
  method: 'average' | 'luminosity' | 'lightness' = 'luminosity'
): number {
  const [r, g, b, a] = pixelToRgba(pixel);
  
  let gray: number;
  switch (method) {
    case 'average':
      gray = (r + g + b) / 3;
      break;
    case 'luminosity':
      gray = 0.299 * r + 0.587 * g + 0.114 * b;
      break;
    case 'lightness':
      gray = (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
      break;
  }
  
  gray = Math.round(gray);
  return rgbaToPixel(gray, gray, gray, a);
}

/**
 * Apply sepia tone to pixel
 */
export function sepiaPixel(pixel: number, intensity: number = 1): number {
  const [r, g, b, a] = pixelToRgba(pixel);
  
  const tr = Math.min(255, (r * 0.393 + g * 0.769 + b * 0.189));
  const tg = Math.min(255, (r * 0.349 + g * 0.686 + b * 0.168));
  const tb = Math.min(255, (r * 0.272 + g * 0.534 + b * 0.131));
  
  return rgbaToPixel(
    Math.round(r + (tr - r) * intensity),
    Math.round(g + (tg - g) * intensity),
    Math.round(b + (tb - b) * intensity),
    a
  );
}

/**
 * Batch pixel operations - applies function to all pixels
 */
export function batchPixelOperation(
  data32: Uint32Array,
  operation: (pixel: number, index: number) => number
): void {
  for (let i = 0; i < data32.length; i++) {
    data32[i] = operation(data32[i], i);
  }
}

/**
 * Parallel pixel operation (chunks for multi-threading potential)
 */
export function* chunkPixels(
  data32: Uint32Array,
  chunkSize: number = 1024
): Generator<{ chunk: Uint32Array; offset: number }, void, unknown> {
  for (let i = 0; i < data32.length; i += chunkSize) {
    const end = Math.min(i + chunkSize, data32.length);
    yield {
      chunk: data32.subarray(i, end),
      offset: i
    };
  }
}

/**
 * Fast box blur using separable convolution
 * Much faster than naive 2D convolution
 */
export function boxBlurFast(
  data32: Uint32Array,
  width: number,
  height: number,
  radius: number
): void {
  const temp = new Uint32Array(data32.length);
  
  // Horizontal pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, count = 0;
      
      for (let kx = -radius; kx <= radius; kx++) {
        const sx = x + kx;
        if (sx >= 0 && sx < width) {
          const pixel = data32[y * width + sx];
          const [pr, pg, pb] = pixelToRgba(pixel);
          r += pr;
          g += pg;
          b += pb;
          count++;
        }
      }
      
      temp[y * width + x] = rgbaToPixel(
        Math.round(r / count),
        Math.round(g / count),
        Math.round(b / count),
        255
      );
    }
  }
  
  // Vertical pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, count = 0;
      
      for (let ky = -radius; ky <= radius; ky++) {
        const sy = y + ky;
        if (sy >= 0 && sy < height) {
          const pixel = temp[sy * width + x];
          const [pr, pg, pb] = pixelToRgba(pixel);
          r += pr;
          g += pg;
          b += pb;
          count++;
        }
      }
      
      data32[y * width + x] = rgbaToPixel(
        Math.round(r / count),
        Math.round(g / count),
        Math.round(b / count),
        255
      );
    }
  }
}

/**
 * Sample pixel with bilinear interpolation
 * Useful for smooth image transformations
 */
export function sampleBilinear(
  data32: Uint32Array,
  width: number,
  height: number,
  x: number,
  y: number
): number {
  const x1 = Math.floor(x);
  const y1 = Math.floor(y);
  const x2 = Math.min(x1 + 1, width - 1);
  const y2 = Math.min(y1 + 1, height - 1);
  
  const fx = x - x1;
  const fy = y - y1;
  
  const p11 = data32[y1 * width + x1];
  const p21 = data32[y1 * width + x2];
  const p12 = data32[y2 * width + x1];
  const p22 = data32[y2 * width + x2];
  
  const [r11, g11, b11] = pixelToRgba(p11);
  const [r21, g21, b21] = pixelToRgba(p21);
  const [r12, g12, b12] = pixelToRgba(p12);
  const [r22, g22, b22] = pixelToRgba(p22);
  
  const r1 = r11 * (1 - fx) + r21 * fx;
  const g1 = g11 * (1 - fx) + g21 * fx;
  const b1 = b11 * (1 - fx) + b21 * fx;
  
  const r2 = r12 * (1 - fx) + r22 * fx;
  const g2 = g12 * (1 - fx) + g22 * fx;
  const b2 = b12 * (1 - fx) + b22 * fx;
  
  const r = r1 * (1 - fy) + r2 * fy;
  const g = g1 * (1 - fy) + g2 * fy;
  const b = b1 * (1 - fy) + b2 * fy;
  
  return rgbaToPixel(Math.round(r), Math.round(g), Math.round(b), 255);
}

/**
 * Edge detection (Sobel operator)
 * Returns edge intensity (0-255)
 */
export function detectEdges(
  data32: Uint32Array,
  width: number,
  height: number
): Uint8Array {
  const edges = new Uint8Array(width * height);
  
  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0, gy = 0;
      
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pixel = data32[(y + ky) * width + (x + kx)];
          const gray = (pixelToRgba(pixel)[0] + pixelToRgba(pixel)[1] + pixelToRgba(pixel)[2]) / 3;
          
          const kidx = (ky + 1) * 3 + (kx + 1);
          gx += gray * sobelX[kidx];
          gy += gray * sobelY[kidx];
        }
      }
      
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      edges[y * width + x] = Math.min(255, magnitude);
    }
  }
  
  return edges;
}

/**
 * Create lookup table for fast color mapping
 * Useful for effects like posterize, threshold, etc.
 */
export function createLookupTable(
  fn: (value: number) => number
): Uint8Array {
  const lut = new Uint8Array(256);
  
  for (let i = 0; i < 256; i++) {
    lut[i] = Math.max(0, Math.min(255, fn(i)));
  }
  
  return lut;
}

/**
 * Apply lookup table to pixels
 * Extremely fast for effects that map colors independently
 */
export function applyLookupTable(
  data32: Uint32Array,
  lutR: Uint8Array,
  lutG: Uint8Array,
  lutB: Uint8Array
): void {
  for (let i = 0; i < data32.length; i++) {
    const [r, g, b, a] = pixelToRgba(data32[i]);
    data32[i] = rgbaToPixel(lutR[r], lutG[g], lutB[b], a);
  }
}

/**
 * Premultiply alpha (for proper blending)
 */
export function premultiplyAlpha(pixel: number): number {
  const [r, g, b, a] = pixelToRgba(pixel);
  const alpha = a / 255;
  
  return rgbaToPixel(
    Math.round(r * alpha),
    Math.round(g * alpha),
    Math.round(b * alpha),
    a
  );
}

/**
 * Unpremultiply alpha
 */
export function unpremultiplyAlpha(pixel: number): number {
  const [r, g, b, a] = pixelToRgba(pixel);
  
  if (a === 0) return pixel;
  
  const alpha = a / 255;
  
  return rgbaToPixel(
    Math.round(r / alpha),
    Math.round(g / alpha),
    Math.round(b / alpha),
    a
  );
}

/**
 * Performance comparison utilities
 */
export function benchmarkPixelOperation(
  name: string,
  operation: () => void,
  iterations: number = 100
): number {
  const start = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    operation();
  }
  
  const end = performance.now();
  const avgTime = (end - start) / iterations;
  
  console.log(`[Benchmark] ${name}: ${avgTime.toFixed(3)}ms average (${iterations} iterations)`);
  
  return avgTime;
}
