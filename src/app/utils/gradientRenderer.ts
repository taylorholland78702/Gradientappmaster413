/**
 * Gradient Rendering Engine
 * Handles all gradient type rendering logic
 */

import { createTempCanvas, clamp } from './canvasHelpers';

export interface GradientColor {
  r: number;
  g: number;
  b: number;
  position: number;
}

export interface GradientConfig {
  type: string;
  colors: GradientColor[];
  angle: number;
  zoom: number;
  
  // Positioning
  centerX: number;
  centerY: number;
  
  // Type-specific parameters
  spiralTightness?: number;
  spiralRotations?: number;
  spiralThickness?: number;
  spiralZoom?: number;
  shapesSides?: number;
  shapesCount?: number;
  concentricRingWidth?: number;
  concentricRingCount?: number;
  waveAmplitude?: number;
  waveFrequency?: number;
  meshGridSize?: number;
  noiseScale?: number;
  noiseOctaves?: number;
  plasmaSpeed?: number;
  plasmaComplexity?: number;
  radialBurstCount?: number;
  radialBurstSpread?: number;
  voronoiCellCount?: number;
  voronoiDistortion?: number;
  conicalSpiralTurns?: number;
  conicalSpiralTightness?: number;
  windmillBlades?: number;
  windmillRotation?: number;
  iridescentAngle?: number;
  iridescentIntensity?: number;
  iridescentScale?: number;
  
  // Audio reactivity
  audioGradientParam?: number;
  isAudioReactive?: boolean;
}

/**
 * Get color at position from gradient stops
 */
export function getColorAtPosition(colors: GradientColor[], position: number): { r: number; g: number; b: number } {
  const clampedPos = clamp(position, 0, 1);
  
  // Find the two colors to interpolate between
  let color1 = colors[0];
  let color2 = colors[colors.length - 1];
  
  for (let i = 0; i < colors.length - 1; i++) {
    if (clampedPos >= colors[i].position && clampedPos <= colors[i + 1].position) {
      color1 = colors[i];
      color2 = colors[i + 1];
      break;
    }
  }
  
  // Interpolate
  const range = color2.position - color1.position;
  const t = range === 0 ? 0 : (clampedPos - color1.position) / range;
  
  return {
    r: Math.round(color1.r + (color2.r - color1.r) * t),
    g: Math.round(color1.g + (color2.g - color1.g) * t),
    b: Math.round(color1.b + (color2.b - color1.b) * t)
  };
}

/**
 * Simplex noise implementation for procedural gradients
 */
class SimplexNoise {
  private grad3 = [
    [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
    [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
    [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
  ];
  
  private p: number[] = [];
  private perm: number[] = [];
  
  constructor(seed = 0) {
    // Initialize permutation table
    for (let i = 0; i < 256; i++) {
      this.p[i] = Math.floor(Math.random() * 256);
    }
    
    for (let i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
    }
  }
  
  private dot(g: number[], x: number, y: number): number {
    return g[0] * x + g[1] * y;
  }
  
  noise2D(xin: number, yin: number): number {
    const F2 = 0.5 * (Math.sqrt(3) - 1);
    const G2 = (3 - Math.sqrt(3)) / 6;
    
    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    
    const t = (i + j) * G2;
    const X0 = i - t;
    const Y0 = j - t;
    const x0 = xin - X0;
    const y0 = yin - Y0;
    
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;
    
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;
    
    const ii = i & 255;
    const jj = j & 255;
    const gi0 = this.perm[ii + this.perm[jj]] % 12;
    const gi1 = this.perm[ii + i1 + this.perm[jj + j1]] % 12;
    const gi2 = this.perm[ii + 1 + this.perm[jj + 1]] % 12;
    
    let n0 = 0, n1 = 0, n2 = 0;
    
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
      t0 *= t0;
      n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0);
    }
    
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) {
      t1 *= t1;
      n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1);
    }
    
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) {
      t2 *= t2;
      n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2);
    }
    
    return 70 * (n0 + n1 + n2);
  }
}

const globalNoise = new SimplexNoise();

/**
 * Render gradient to canvas based on type
 */
export function renderGradient(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  config: GradientConfig
): void {
  const { width, height } = canvas;
  const cx = width * config.centerX;
  const cy = height * config.centerY;
  
  switch (config.type) {
    case 'linear':
      renderLinearGradient(ctx, canvas, config, cx, cy);
      break;
    case 'radial':
      renderRadialGradient(ctx, canvas, config, cx, cy);
      break;
    case 'conic':
      renderConicGradient(ctx, canvas, config, cx, cy);
      break;
    case 'diamond':
      renderDiamondGradient(ctx, canvas, config, cx, cy);
      break;
    case 'spiral':
      renderSpiralGradient(ctx, canvas, config, cx, cy);
      break;
    case 'starburst':
      renderStarburstGradient(ctx, canvas, config, cx, cy);
      break;
    case 'angular':
      renderAngularGradient(ctx, canvas, config, cx, cy);
      break;
    case 'reflected':
      renderReflectedGradient(ctx, canvas, config, cx, cy);
      break;
    case 'shapes':
      renderShapesGradient(ctx, canvas, config, cx, cy);
      break;
    case 'concentric':
      renderConcentricGradient(ctx, canvas, config, cx, cy);
      break;
    case 'wave':
      renderWaveGradient(ctx, canvas, config, cx, cy);
      break;
    case 'mesh':
      renderMeshGradient(ctx, canvas, config, cx, cy);
      break;
    case 'noise':
      renderNoiseGradient(ctx, canvas, config);
      break;
    case 'plasma':
      renderPlasmaGradient(ctx, canvas, config);
      break;
    case 'radial-burst':
      renderRadialBurstGradient(ctx, canvas, config, cx, cy);
      break;
    case 'voronoi':
      renderVoronoiGradient(ctx, canvas, config);
      break;
    case 'conical-spiral':
      renderConicalSpiralGradient(ctx, canvas, config, cx, cy);
      break;
    case 'windmill':
      renderWindmillGradient(ctx, canvas, config, cx, cy);
      break;
    case 'iridescent':
      renderIridescentGradient(ctx, canvas, config);
      break;
    default:
      renderLinearGradient(ctx, canvas, config, cx, cy);
  }
}

function renderLinearGradient(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  config: GradientConfig,
  cx: number,
  cy: number
): void {
  const rad = (config.angle * Math.PI) / 180;
  const dist = Math.max(canvas.width, canvas.height) / config.zoom;
  
  const x1 = cx - Math.cos(rad) * dist;
  const y1 = cy - Math.sin(rad) * dist;
  const x2 = cx + Math.cos(rad) * dist;
  const y2 = cy + Math.sin(rad) * dist;
  
  const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
  config.colors.forEach(color => {
    gradient.addColorStop(color.position, `rgb(${color.r},${color.g},${color.b})`);
  });
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function renderRadialGradient(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  config: GradientConfig,
  cx: number,
  cy: number
): void {
  const maxDist = Math.sqrt(
    Math.max(cx, canvas.width - cx) ** 2 + Math.max(cy, canvas.height - cy) ** 2
  );
  const radius = maxDist / config.zoom;
  
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  config.colors.forEach(color => {
    gradient.addColorStop(color.position, `rgb(${color.r},${color.g},${color.b})`);
  });
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function renderConicGradient(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  config: GradientConfig,
  cx: number,
  cy: number
): void {
  const gradient = ctx.createConicGradient((config.angle * Math.PI) / 180, cx, cy);
  config.colors.forEach(color => {
    gradient.addColorStop(color.position, `rgb(${color.r},${color.g},${color.b})`);
  });
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function renderDiamondGradient(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  config: GradientConfig,
  cx: number,
  cy: number
): void {
  const imageData = ctx.createImageData(canvas.width, canvas.height);
  const data = imageData.data;
  const maxDist = Math.max(cx, canvas.width - cx, cy, canvas.height - cy) / config.zoom;
  
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const dist = (Math.abs(x - cx) + Math.abs(y - cy)) / maxDist;
      const color = getColorAtPosition(config.colors, dist);
      const idx = (y * canvas.width + x) * 4;
      data[idx] = color.r;
      data[idx + 1] = color.g;
      data[idx + 2] = color.b;
      data[idx + 3] = 255;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

function renderSpiralGradient(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  config: GradientConfig,
  cx: number,
  cy: number
): void {
  const imageData = ctx.createImageData(canvas.width, canvas.height);
  const data = imageData.data;
  const tightness = (config.spiralTightness || 50) / 10;
  const rotations = config.spiralRotations || 3;
  const thickness = (config.spiralThickness || 50) / 50;
  const spiralZoom = (config.spiralZoom || 50) / 50;
  
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const dx = (x - cx) / config.zoom;
      const dy = (y - cy) / config.zoom;
      const dist = Math.sqrt(dx * dx + dy * dy) * spiralZoom;
      let angle = Math.atan2(dy, dx);
      
      const spiralAngle = dist * tightness + angle * rotations;
      const t = ((spiralAngle % (Math.PI * 2)) / (Math.PI * 2) + thickness * Math.sin(dist * 0.1)) % 1;
      
      const color = getColorAtPosition(config.colors, t);
      const idx = (y * canvas.width + x) * 4;
      data[idx] = color.r;
      data[idx + 1] = color.g;
      data[idx + 2] = color.b;
      data[idx + 3] = 255;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

function renderStarburstGradient(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  config: GradientConfig,
  cx: number,
  cy: number
): void {
  const imageData = ctx.createImageData(canvas.width, canvas.height);
  const data = imageData.data;
  const rays = Math.floor((config.radialBurstCount || 12) / 2) * 2;
  
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const angle = Math.atan2(dy, dx);
      const normalizedAngle = (angle + Math.PI) / (2 * Math.PI);
      const t = (Math.sin(normalizedAngle * rays * Math.PI) + 1) / 2;
      
      const color = getColorAtPosition(config.colors, t);
      const idx = (y * canvas.width + x) * 4;
      data[idx] = color.r;
      data[idx + 1] = color.g;
      data[idx + 2] = color.b;
      data[idx + 3] = 255;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

function renderAngularGradient(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  config: GradientConfig,
  cx: number,
  cy: number
): void {
  const imageData = ctx.createImageData(canvas.width, canvas.height);
  const data = imageData.data;
  
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const angle = Math.atan2(y - cy, x - cx);
      const t = (angle + Math.PI + (config.angle * Math.PI) / 180) / (2 * Math.PI);
      const color = getColorAtPosition(config.colors, t % 1);
      
      const idx = (y * canvas.width + x) * 4;
      data[idx] = color.r;
      data[idx + 1] = color.g;
      data[idx + 2] = color.b;
      data[idx + 3] = 255;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

function renderReflectedGradient(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  config: GradientConfig,
  cx: number,
  cy: number
): void {
  const rad = (config.angle * Math.PI) / 180;
  const dist = Math.max(canvas.width, canvas.height) / config.zoom;
  
  const imageData = ctx.createImageData(canvas.width, canvas.height);
  const data = imageData.data;
  
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const projected = dx * Math.cos(rad) + dy * Math.sin(rad);
      const t = Math.abs((projected / dist + 1) % 2 - 1);
      
      const color = getColorAtPosition(config.colors, t);
      const idx = (y * canvas.width + x) * 4;
      data[idx] = color.r;
      data[idx + 1] = color.g;
      data[idx + 2] = color.b;
      data[idx + 3] = 255;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

function renderShapesGradient(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  config: GradientConfig,
  cx: number,
  cy: number
): void {
  // Simplified shapes implementation
  ctx.fillStyle = `rgb(${config.colors[0].r},${config.colors[0].g},${config.colors[0].b})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function renderConcentricGradient(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  config: GradientConfig,
  cx: number,
  cy: number
): void {
  const imageData = ctx.createImageData(canvas.width, canvas.height);
  const data = imageData.data;
  const ringWidth = (config.concentricRingWidth || 50) / config.zoom;
  
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const t = (dist / ringWidth) % 1;
      
      const color = getColorAtPosition(config.colors, t);
      const idx = (y * canvas.width + x) * 4;
      data[idx] = color.r;
      data[idx + 1] = color.g;
      data[idx + 2] = color.b;
      data[idx + 3] = 255;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

function renderWaveGradient(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  config: GradientConfig,
  cx: number,
  cy: number
): void {
  const imageData = ctx.createImageData(canvas.width, canvas.height);
  const data = imageData.data;
  const amplitude = (config.waveAmplitude || 50) / 100;
  const frequency = (config.waveFrequency || 50) / 10;
  
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const waveOffset = Math.sin(x * frequency / canvas.width * Math.PI * 2) * amplitude;
      const t = ((y / canvas.height) + waveOffset) % 1;
      
      const color = getColorAtPosition(config.colors, Math.abs(t));
      const idx = (y * canvas.width + x) * 4;
      data[idx] = color.r;
      data[idx + 1] = color.g;
      data[idx + 2] = color.b;
      data[idx + 3] = 255;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

function renderMeshGradient(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  config: GradientConfig,
  cx: number,
  cy: number
): void {
  // Simplified mesh - use radial as fallback
  renderRadialGradient(ctx, canvas, config, cx, cy);
}

function renderNoiseGradient(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  config: GradientConfig
): void {
  const imageData = ctx.createImageData(canvas.width, canvas.height);
  const data = imageData.data;
  const scale = (config.noiseScale || 50) / 100 / config.zoom;
  const octaves = config.noiseOctaves || 4;
  
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      let value = 0;
      let amplitude = 1;
      let frequency = 1;
      let maxValue = 0;
      
      for (let i = 0; i < octaves; i++) {
        value += globalNoise.noise2D(x * scale * frequency, y * scale * frequency) * amplitude;
        maxValue += amplitude;
        amplitude *= 0.5;
        frequency *= 2;
      }
      
      value = (value / maxValue + 1) / 2;
      const color = getColorAtPosition(config.colors, value);
      
      const idx = (y * canvas.width + x) * 4;
      data[idx] = color.r;
      data[idx + 1] = color.g;
      data[idx + 2] = color.b;
      data[idx + 3] = 255;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

function renderPlasmaGradient(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  config: GradientConfig
): void {
  const imageData = ctx.createImageData(canvas.width, canvas.height);
  const data = imageData.data;
  const complexity = (config.plasmaComplexity || 50) * 0.004 / config.zoom;
  
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const value = (
        Math.sin(x * complexity + config.angle * 0.05) +
        Math.sin(y * complexity + config.angle * 0.05) +
        Math.sin((x + y) * complexity * 0.5) +
        Math.sin(Math.sqrt(x * x + y * y) * complexity)
      ) / 4;
      
      const t = (value + 1) / 2;
      const color = getColorAtPosition(config.colors, t);
      
      const idx = (y * canvas.width + x) * 4;
      data[idx] = color.r;
      data[idx + 1] = color.g;
      data[idx + 2] = color.b;
      data[idx + 3] = 255;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

function renderRadialBurstGradient(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  config: GradientConfig,
  cx: number,
  cy: number
): void {
  const imageData = ctx.createImageData(canvas.width, canvas.height);
  const data = imageData.data;
  const count = config.radialBurstCount || 12;
  const spread = (config.radialBurstSpread || 50) / 50;
  
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const angle = Math.atan2(y - cy, x - cx);
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / config.zoom;
      const burstValue = Math.abs(Math.sin(angle * count)) * spread;
      const t = ((dist * 0.01 + burstValue) % 1);
      
      const color = getColorAtPosition(config.colors, t);
      const idx = (y * canvas.width + x) * 4;
      data[idx] = color.r;
      data[idx + 1] = color.g;
      data[idx + 2] = color.b;
      data[idx + 3] = 255;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

function renderVoronoiGradient(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  config: GradientConfig
): void {
  const cellCount = config.voronoiCellCount || 10;
  const distortion = (config.voronoiDistortion || 0) / 100;
  
  // Generate random points
  const points: Array<{ x: number; y: number; colorIdx: number }> = [];
  for (let i = 0; i < cellCount; i++) {
    points.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      colorIdx: i % config.colors.length
    });
  }
  
  const imageData = ctx.createImageData(canvas.width, canvas.height);
  const data = imageData.data;
  
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      let minDist = Infinity;
      let closestPoint = points[0];
      
      for (const point of points) {
        const dx = x - point.x;
        const dy = y - point.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < minDist) {
          minDist = dist;
          closestPoint = point;
        }
      }
      
      const t = (closestPoint.colorIdx / config.colors.length + distortion * (minDist / canvas.width)) % 1;
      const color = getColorAtPosition(config.colors, t);
      
      const idx = (y * canvas.width + x) * 4;
      data[idx] = color.r;
      data[idx + 1] = color.g;
      data[idx + 2] = color.b;
      data[idx + 3] = 255;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

function renderConicalSpiralGradient(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  config: GradientConfig,
  cx: number,
  cy: number
): void {
  const imageData = ctx.createImageData(canvas.width, canvas.height);
  const data = imageData.data;
  const turns = config.conicalSpiralTurns || 5;
  const tightness = (config.conicalSpiralTightness || 50) / 50;
  
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const dx = (x - cx) / config.zoom;
      const dy = (y - cy) / config.zoom;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      
      const t = ((angle / (Math.PI * 2) + dist * tightness * 0.01) * turns) % 1;
      const color = getColorAtPosition(config.colors, Math.abs(t));
      
      const idx = (y * canvas.width + x) * 4;
      data[idx] = color.r;
      data[idx + 1] = color.g;
      data[idx + 2] = color.b;
      data[idx + 3] = 255;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

function renderWindmillGradient(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  config: GradientConfig,
  cx: number,
  cy: number
): void {
  const imageData = ctx.createImageData(canvas.width, canvas.height);
  const data = imageData.data;
  const blades = config.windmillBlades || 6;
  const rotation = (config.windmillRotation || 0) * Math.PI / 180;
  
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const angle = Math.atan2(y - cy, x - cx) + rotation;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / config.zoom;
      const bladeAngle = ((angle + Math.PI) / (Math.PI * 2)) * blades;
      const t = ((bladeAngle % 1) + dist * 0.01) % 1;
      
      const color = getColorAtPosition(config.colors, t);
      const idx = (y * canvas.width + x) * 4;
      data[idx] = color.r;
      data[idx + 1] = color.g;
      data[idx + 2] = color.b;
      data[idx + 3] = 255;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

function renderIridescentGradient(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  config: GradientConfig
): void {
  const imageData = ctx.createImageData(canvas.width, canvas.height);
  const data = imageData.data;
  const angle = (config.iridescentAngle || 0) * Math.PI / 180;
  const intensity = (config.iridescentIntensity || 50) / 100;
  const scale = (config.iridescentScale || 50) / 50 / config.zoom;
  
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const projected = x * Math.cos(angle) + y * Math.sin(angle);
      const interference = Math.sin(projected * scale * Math.PI * 2) * intensity;
      const t = ((y / canvas.height) + interference) % 1;
      
      const color = getColorAtPosition(config.colors, Math.abs(t));
      const idx = (y * canvas.width + x) * 4;
      data[idx] = color.r;
      data[idx + 1] = color.g;
      data[idx + 2] = color.b;
      data[idx + 3] = 255;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}
