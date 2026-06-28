# Quick Reference - Interactive Gradient Utilities

## Import Guide

```typescript
// Canvas operations
import { getPixelData, putPixelData, createTempCanvas, rgbToHsl, hslToRgb } from './utils/canvasHelpers';

// Gradient rendering
import { renderGradient, getColorAtPosition, type GradientConfig, type GradientColor } from './utils/gradientRenderer';

// Effects
import { applyEffect, type EffectConfig } from './utils/effectsEngine';

// Audio
import { analyzeFrequencies, mapAudioToGradient, AudioSmoothing, initializeAudioContext } from './utils/audioProcessor';

// Configuration
import { type GradientConfig, type EffectParams, type AudioConfig, DEFAULT_GRADIENT_CONFIG } from './utils/configManager';

// Rendering
import { renderFrame, initializeRenderContext, RenderPerformanceMonitor, RenderScheduler } from './utils/renderPipeline';

// History
import { HistoryManager, createStateSnapshot, applyStateSnapshot } from './utils/historyManager';

// Typed arrays (performance)
import { rgbaToPixel, batchPixelOperation, boxBlurFast, createLookupTable } from './utils/typedArrayOps';
```

## Common Tasks

### 1. Initialize Canvas for Rendering

```typescript
const canvasRef = useRef<HTMLCanvasElement>(null);
const renderContextRef = useRef<RenderContext | null>(null);

useEffect(() => {
  if (!canvasRef.current) return;
  
  renderContextRef.current = initializeRenderContext(canvasRef.current);
}, []);
```

### 2. Render a Gradient

```typescript
import { renderGradient } from './utils/gradientRenderer';

const config: GradientConfig = {
  type: 'radial',
  colors: [
    { r: 255, g: 0, b: 0, position: 0 },
    { r: 0, g: 0, b: 255, position: 1 }
  ],
  angle: 45,
  zoom: 1,
  centerX: 0.5,
  centerY: 0.5,
  // ... other params
};

renderGradient(ctx, canvas, config);
```

### 3. Apply an Effect

```typescript
import { applyEffect } from './utils/effectsEngine';

const effectConfig: EffectConfig = {
  type: 'kaleidoscope',
  kaleidoscopeSegments: 8,
  audioModulation: 0 // or audioEffectParam if audio reactive
};

// Need temp canvas for effects that read/write simultaneously
const { canvas: tempCanvas, ctx: tempCtx } = createTempCanvas(canvas.width, canvas.height);

applyEffect(ctx, canvas, tempCanvas, tempCtx, effectConfig);
```

### 4. Full Frame Render (Gradient + Effects)

```typescript
import { renderFrame } from './utils/renderPipeline';

renderFrame(renderContext, {
  gradientConfig: {
    type: 'plasma',
    angle: 45,
    zoom: 1,
    plasmaComplexity: 50,
    // ...
  },
  gradientColors: [
    { r: 255, g: 0, b: 0, position: 0 },
    { r: 0, g: 255, b: 0, position: 0.5 },
    { r: 0, g: 0, b: 255, position: 1 }
  ],
  activeEffects: ['kaleidoscope', 'blur', 'vignette'],
  effectParams: {
    kaleidoscopeSegments: 8,
    blurGaussianAmount: 5,
    vignetteStrength: 30,
    // ...
  },
  audioModulation: isAudioReactive ? {
    gradientParam: audioGradientParam,
    effectParam: audioEffectParam,
    colorShift: audioColorShift
  } : undefined
});
```

### 5. Audio Analysis

```typescript
import { analyzeFrequencies, calculateFrequencyBands } from './utils/audioProcessor';

// Calculate bands once
const frequencyBands = useMemo(() => 
  calculateFrequencyBands(analyser.fftSize, audioContext.sampleRate),
  [analyser, audioContext]
);

// In animation loop
useEffect(() => {
  if (!isAudioEnabled) return;
  
  let rafId: number;
  const analyze = () => {
    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(frequencyData);
    
    const analysis = analyzeFrequencies(frequencyData, frequencyBands);
    
    setAudioGradientParam(analysis.bass * 100);
    setAudioEffectParam(analysis.mid * 20);
    setAudioColorShift(analysis.treble * 360);
    
    rafId = requestAnimationFrame(analyze);
  };
  
  rafId = requestAnimationFrame(analyze);
  return () => cancelAnimationFrame(rafId);
}, [isAudioEnabled, analyser, frequencyBands]);
```

### 6. Undo/Redo System

```typescript
import { HistoryManager, createStateSnapshot, applyStateSnapshot } from './utils/historyManager';

// Create history manager (once)
const historyRef = useRef(new HistoryManager({ maxStates: 50, debounceMs: 300 }));

// Save state (debounced automatically)
const saveState = useCallback(() => {
  const snapshot = createStateSnapshot(
    gradientType,
    gradientColors,
    gradientConfig,
    effectParams,
    activeEffects
  );
  
  historyRef.current.push(snapshot);
}, [gradientType, gradientColors, gradientConfig, effectParams, activeEffects]);

// Undo
const handleUndo = useCallback(() => {
  const previousState = historyRef.current.undo();
  
  if (previousState) {
    applyStateSnapshot(previousState, {
      setGradientType,
      setGradientColors,
      setGradientConfig,
      setEffectParams,
      setActiveEffects
    });
  }
}, []);

// Keyboard shortcut
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        // Redo
        const nextState = historyRef.current.redo();
        if (nextState) applyStateSnapshot(nextState, { ... });
      } else {
        // Undo
        handleUndo();
      }
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [handleUndo]);
```

### 7. Performance Monitoring

```typescript
import { RenderPerformanceMonitor } from './utils/renderPipeline';

const perfMonitor = useRef(new RenderPerformanceMonitor(60)); // 60 samples

// In render loop
const render = useCallback(() => {
  perfMonitor.current.startFrame();
  
  renderFrame(renderContext, config);
  
  perfMonitor.current.endFrame();
  
  // Log stats every second
  if (frameCount % 60 === 0) {
    const stats = perfMonitor.current.getStats();
    console.log(`FPS: ${stats.fps.toFixed(1)}, Avg: ${stats.avgFrameTime.toFixed(2)}ms`);
  }
}, [renderContext, config]);
```

### 8. Fast Pixel Operations

```typescript
import { getPixelData, rgbaToPixel, batchPixelOperation } from './utils/typedArrayOps';

// Get pixel data with Uint32Array view
const pixelData = getPixelData(ctx, canvas.width, canvas.height);

// Fast fill
pixelData.data32.fill(rgbaToPixel(255, 0, 0, 255)); // Fill with red

// Batch operation
batchPixelOperation(pixelData.data32, (pixel, index) => {
  // Modify each pixel
  const [r, g, b, a] = pixelToRgba(pixel);
  return rgbaToPixel(255 - r, 255 - g, 255 - b, a); // Invert
});

// Put back to canvas
putPixelData(ctx, pixelData);
```

### 9. State Consolidation Pattern

```typescript
// BEFORE: Many individual states
const [spiralTightness, setSpiralTightness] = useState(50);
const [spiralRotations, setSpiralRotations] = useState(3);
const [spiralThickness, setSpiralThickness] = useState(50);
// ... 20 more

// AFTER: Consolidated config object
const [gradientConfig, setGradientConfig] = useState<GradientConfig>(DEFAULT_GRADIENT_CONFIG);

// Update single value
setGradientConfig(prev => ({ ...prev, spiralTightness: 75 }));

// Update multiple values (single re-render!)
setGradientConfig(prev => ({
  ...prev,
  spiralTightness: 75,
  spiralRotations: 5,
  spiralThickness: 60
}));
```

### 10. Memoization Best Practices

```typescript
// Memoize expensive computations
const gradientColors = useMemo(() => 
  colors.map((c, i) => ({
    r: c.r,
    g: c.g,
    b: c.b,
    position: i / (colors.length - 1)
  })),
  [colors]
);

// Memoize callbacks
const render = useCallback(() => {
  if (!renderContext.current) return;
  renderFrame(renderContext.current, config);
}, [config]); // Only re-create when config changes

// Memoize audio band calculation
const frequencyBands = useMemo(() => 
  calculateFrequencyBands(2048, 44100),
  [] // Calculate once
);
```

## Performance Tips

### ⚡ Do's
- ✅ Use Uint32Array for pixel operations
- ✅ Memoize expensive computations
- ✅ Consolidate related state
- ✅ Use `useMemo` for derived values
- ✅ Use `useCallback` for event handlers
- ✅ Batch state updates
- ✅ Use lookup tables for color mapping
- ✅ Debounce history saves
- ✅ Profile with RenderPerformanceMonitor

### ❌ Don'ts
- ❌ Don't manipulate pixels byte-by-byte
- ❌ Don't create objects in render loops
- ❌ Don't call `getImageData` multiple times per frame
- ❌ Don't forget to clone state in history
- ❌ Don't mix Uint8Array and Uint32Array operations
- ❌ Don't skip bounds checking in pixel sampling
- ❌ Don't create new canvases every frame
- ❌ Don't save history on every state change

## Debugging

### Enable Performance Logging
```typescript
const perfMonitor = new RenderPerformanceMonitor(60);

// In render loop
perfMonitor.startFrame();
renderFrame(renderContext, config);
perfMonitor.endFrame();

// Log every second
if (frameCount % 60 === 0) {
  console.log(perfMonitor.getStats());
}
```

### Benchmark Effect
```typescript
import { benchmarkPixelOperation } from './utils/typedArrayOps';

benchmarkPixelOperation('My Effect', () => {
  applyEffect(ctx, canvas, tempCanvas, tempCtx, config);
}, 100);
```

### Verify State Changes
```typescript
const history = new HistoryManager();

// Log stats
console.log(history.getStats());
// {
//   totalStates: 25,
//   currentIndex: 24,
//   canUndo: true,
//   canRedo: false
// }
```

## TypeScript Types

All utilities are fully typed. Use TypeScript's IntelliSense for parameter suggestions:

```typescript
// Hover over function names for documentation
renderGradient(ctx, canvas, config); // Shows GradientConfig type

// Import types for your own functions
import type { GradientColor, EffectConfig, RenderContext } from './utils/...';
```

## Common Issues

### Issue: "Cannot read property 'data' of null"
**Solution**: Check that canvas context is initialized before rendering

### Issue: Effects not applying
**Solution**: Verify effect type name matches case in `applyEffect()` switch statement

### Issue: Audio not working
**Solution**: Check browser permissions, verify analyser is connected, check frequency bands calculation

### Issue: Performance degradation
**Solution**: Use `RenderPerformanceMonitor` to identify slow effects, verify memoization, check for memory leaks

### Issue: Undo not working
**Solution**: Verify history is saving states, check that `applyStateSnapshot` setters are correct

## Further Reading

- `/REFACTORING_GUIDE.md` - Complete architecture documentation
- `/REFACTORING_SUMMARY.md` - High-level overview and benefits
- Individual utility files - JSDoc comments for each function
- TypeScript definitions - Type information for all interfaces

---

**Remember**: The goal of this refactoring is performance, maintainability, and extensibility. When in doubt, refer to the utilities rather than writing custom logic!
