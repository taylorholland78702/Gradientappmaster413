/**
 * Render Pipeline
 * Unified rendering system with optimized frame drawing
 */

import { renderGradient, type GradientConfig, type GradientColor } from './gradientRenderer';
import { applyEffect, type EffectConfig } from './effectsEngine';
import { createTempCanvas } from './canvasHelpers';

export interface RenderContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  tempCanvas: HTMLCanvasElement;
  tempCtx: CanvasRenderingContext2D;
  width: number;
  height: number;
}

export interface RenderConfig {
  gradientConfig: GradientConfig;
  gradientColors: GradientColor[];
  activeEffects: string[];
  effectParams: Record<string, any>;
  audioModulation?: {
    gradientParam: number;
    effectParam: number;
    colorShift: number;
  };
}

/**
 * Initialize render context with optimized canvas settings
 */
export function initializeRenderContext(canvas: HTMLCanvasElement): RenderContext {
  const ctx = canvas.getContext('2d', { 
    willReadFrequently: true,
    alpha: false
  });
  
  if (!ctx) {
    throw new Error('Failed to get canvas 2D context');
  }
  
  const { canvas: tempCanvas, ctx: tempCtx } = createTempCanvas(canvas.width, canvas.height);
  
  return {
    canvas,
    ctx,
    tempCanvas,
    tempCtx,
    width: canvas.width,
    height: canvas.height
  };
}

/**
 * Update render context dimensions
 */
export function updateRenderContextSize(
  renderContext: RenderContext,
  width: number,
  height: number
): void {
  renderContext.width = width;
  renderContext.height = height;
  renderContext.canvas.width = width;
  renderContext.canvas.height = height;
  renderContext.tempCanvas.width = width;
  renderContext.tempCanvas.height = height;
}

/**
 * Main render frame function - draws gradient and applies all effects
 */
export function renderFrame(
  renderContext: RenderContext,
  config: RenderConfig
): void {
  const { ctx, canvas, tempCanvas, tempCtx } = renderContext;
  
  // Guard against invalid dimensions
  if (canvas.width === 0 || canvas.height === 0) {
    return;
  }
  
  // Step 1: Render gradient
  const gradientConfig: GradientConfig = {
    ...config.gradientConfig,
    colors: config.gradientColors
  };
  
  // Apply audio reactivity to gradient if enabled
  if (config.audioModulation) {
    gradientConfig.angle = (gradientConfig.angle + config.audioModulation.gradientParam) % 360;
  }
  
  renderGradient(ctx, canvas, gradientConfig);
  
  // Step 2: Apply effects in sequence
  config.activeEffects.forEach((effectType, index) => {
    // Guard check before each effect
    if (canvas.width === 0 || canvas.height === 0) {
      return;
    }
    
    const isFirstEffect = index === 0;
    const audioModulation = config.audioModulation && isFirstEffect
      ? config.audioModulation.effectParam
      : 0;
    
    const effectConfig: EffectConfig = {
      type: effectType,
      audioModulation,
      ...config.effectParams
    };
    
    try {
      applyEffect(ctx, canvas, tempCanvas, tempCtx, effectConfig);
    } catch (error) {
      console.error(`Error applying effect ${effectType}:`, error);
    }
  });
}

/**
 * Batch render multiple frames (for recording/export)
 */
export function* renderFrameSequence(
  renderContext: RenderContext,
  configs: RenderConfig[],
  onProgress?: (current: number, total: number) => void
): Generator<ImageData, void, unknown> {
  const { ctx, canvas } = renderContext;
  
  for (let i = 0; i < configs.length; i++) {
    renderFrame(renderContext, configs[i]);
    
    if (onProgress) {
      onProgress(i + 1, configs.length);
    }
    
    yield ctx.getImageData(0, 0, canvas.width, canvas.height);
  }
}

/**
 * Clear canvas
 */
export function clearCanvas(renderContext: RenderContext, color: string = '#000'): void {
  const { ctx, canvas } = renderContext;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

/**
 * Performance monitoring for render pipeline
 */
export class RenderPerformanceMonitor {
  private frameTimes: number[] = [];
  private maxSamples: number;
  private lastFrameTime: number = 0;
  
  constructor(maxSamples: number = 60) {
    this.maxSamples = maxSamples;
  }
  
  startFrame(): void {
    this.lastFrameTime = performance.now();
  }
  
  endFrame(): void {
    const frameTime = performance.now() - this.lastFrameTime;
    this.frameTimes.push(frameTime);
    
    if (this.frameTimes.length > this.maxSamples) {
      this.frameTimes.shift();
    }
  }
  
  getAverageFrameTime(): number {
    if (this.frameTimes.length === 0) return 0;
    
    const sum = this.frameTimes.reduce((a, b) => a + b, 0);
    return sum / this.frameTimes.length;
  }
  
  getFPS(): number {
    const avgFrameTime = this.getAverageFrameTime();
    return avgFrameTime > 0 ? 1000 / avgFrameTime : 0;
  }
  
  getStats(): {
    avgFrameTime: number;
    fps: number;
    minFrameTime: number;
    maxFrameTime: number;
  } {
    return {
      avgFrameTime: this.getAverageFrameTime(),
      fps: this.getFPS(),
      minFrameTime: Math.min(...this.frameTimes),
      maxFrameTime: Math.max(...this.frameTimes)
    };
  }
  
  reset(): void {
    this.frameTimes = [];
  }
}

/**
 * Debounced render scheduler
 */
export class RenderScheduler {
  private rafId: number | null = null;
  private renderCallback: (() => void) | null = null;
  
  schedule(callback: () => void): void {
    this.renderCallback = callback;
    
    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(() => {
        if (this.renderCallback) {
          this.renderCallback();
        }
        this.rafId = null;
      });
    }
  }
  
  cancel(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}
