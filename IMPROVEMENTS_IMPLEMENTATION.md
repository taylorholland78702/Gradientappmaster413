# Interactive Gradient Improvements Implementation

## Summary of Changes Needed

### 1. Make all effect values clickable for manual input
- Convert all `<span>` value displays to `<input type="number">` fields
- This applies to ALL effect sliders across the entire effects panel
- Example pattern to replace:
```tsx
// FROM:
<span className="text-xs text-white w-8 text-right">{someValue}</span>

// TO:
<input
  type="number"
  value={someValue}
  onChange={(e) => setSomeValue(Number(e.target.value))}
  className="text-xs text-white w-8 text-right bg-transparent border border-white/20 rounded px-1"
/>
```

### 2. Grain Effect Improvements
#### Change intensity range for gradual scaling
- Current: min="10" max="100"
- New: min="0" max="1" step="0.01"
- Also update grainIntensity state default from 0.05 to 0.3
- Update in the film-grain effect rendering to scale properly

#### Add Grain Type Selector (UI Only - state already exists)
Add after the Intensity slider:
```tsx
<div className="flex items-center justify-between gap-1">
  <label className="text-xs text-white whitespace-nowrap">Type:</label>
  <div className="flex gap-0.5 flex-1">
    <button
      onClick={() => setGrainType('fine')}
      className={`flex-1 px-1 py-0.5 rounded text-[10px] transition-all ${
        grainType === 'fine' ? 'bg-white text-black' : 'bg-black/30 text-white hover:bg-black/40'
      }`}
    >
      Fine
    </button>
    <button
      onClick={() => setGrainType('medium')}
      className={`flex-1 px-1 py-0.5 rounded text-[10px] transition-all ${
        grainType === 'medium' ? 'bg-white text-black' : 'bg-black/30 text-white hover:bg-black/40'
      }`}
    >
      Medium
    </button>
    <button
      onClick={() => setGrainType('coarse')}
      className={`flex-1 px-1 py-0.5 rounded text-[10px] transition-all ${
        grainType === 'coarse' ? 'bg-white text-black' : 'bg-black/30 text-white hover:bg-black/40'
      }`}
    >
      Coarse
    </button>
    <button
      onClick={() => setGrainType('film')}
      className={`flex-1 px-1 py-0.5 rounded text-[10px] transition-all ${
        grainType === 'film' ? 'bg-white text-black' : 'bg-black/30 text-white hover:bg-black/40'
      }`}
    >
      Film
    </button>
  </div>
</div>
```

#### Update film-grain rendering logic (around line 3168)
Update the grain application to use grainType:
```tsx
case 'film-grain':
  if (!imageData) break;
  const grainData = imageData.data;
  const audioGrainBoost = isFirstEffect ? audioModulation * 0.3 : 0;
  const effectiveGrainIntensity = grainIntensity + audioGrainBoost;
  
  // Grain type multipliers
  const grainSizeMap = {
    'fine': 0.5,
    'medium': 1,
    'coarse': 2,
    'film': 1.5
  };
  const grainSize = grainSizeMap[grainType];
  
  for (let i = 0; i < grainData.length; i += 4) {
    const noise = (Math.random() - 0.5) * effectiveGrainIntensity * 255 * grainSize;
    grainData[i] += noise;
    grainData[i + 1] += noise;
    grainData[i + 2] += noise;
  }
  ctx.putImageData(imageData, 0, 0);
  break;
```

### 3. Grid Effect - Add Variation and Size Sliders
Add after the Columns slider (around line 6993):
```tsx
<div className="flex items-center justify-between gap-1">
  <label className="text-xs text-white whitespace-nowrap">Size:</label>
  <div className="flex items-center gap-1 flex-1">
    <input
      type="range"
      min="5"
      max="100"
      value={gridShapeSize}
      onChange={(e) => setGridShapeSize(Number(e.target.value))}
      className="flex-1 gradient-slider"
    />
    <input
      type="number"
      value={gridShapeSize}
      onChange={(e) => setGridShapeSize(Number(e.target.value))}
      className="text-xs text-white w-8 text-right bg-transparent border border-white/20 rounded px-1"
    />
  </div>
</div>
<div className="flex items-center justify-between gap-1">
  <label className="text-xs text-white whitespace-nowrap">Variation:</label>
  <div className="flex items-center gap-1 flex-1">
    <input
      type="range"
      min="0"
      max="1"
      step="0.01"
      value={gridVariation}
      onChange={(e) => setGridVariation(Number(e.target.value))}
      className="flex-1 gradient-slider"
    />
    <input
      type="number"
      value={gridVariation}
      step="0.01"
      onChange={(e) => setGridVariation(Number(e.target.value))}
      className="text-xs text-white w-8 text-right bg-transparent border border-white/20 rounded px-1"
    />
  </div>
</div>
```

### 4. Wave Distortion - Add Rotation Wheel
State already added: `waveDistortionRotation`
Add after the Strength slider (around line 7520):
```tsx
<div className="flex items-center justify-between gap-1">
  <label className="text-xs text-white whitespace-nowrap">Rotation:</label>
  <div className="flex items-center gap-1 flex-1">
    <div className="relative w-16 h-16 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
        <circle cx="50" cy="50" r="40" fill="rgba(0,0,0,0.3)" />
        <line
          x1="50"
          y1="50"
          x2={50 + 35 * Math.cos((waveDistortionRotation - 90) * Math.PI / 180)}
          y2={50 + 35 * Math.sin((waveDistortionRotation - 90) * Math.PI / 180)}
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <input
        type="range"
        min="0"
        max="360"
        value={waveDistortionRotation}
        onChange={(e) => setWaveDistortionRotation(Number(e.target.value))}
        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        style={{ WebkitAppearance: 'none' }}
      />
    </div>
    <input
      type="number"
      value={waveDistortionRotation}
      onChange={(e) => setWaveDistortionRotation(Number(e.target.value))}
      className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
    />
  </div>
</div>
```

### 5. Tritone - Remove Labels, Show Only Color Bars
Replace the tritone controls section (around line 7403-7456):
```tsx
{activeEffects.includes('tritone') && (
  <>
    {isMultiFxMode && activeEffects.length > 1 && (
      <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Tritone</div>
    )}
    <div className="flex items-center justify-between gap-1">
      <label className="text-xs text-white whitespace-nowrap">Intensity:</label>
      <div className="flex items-center gap-1 flex-1">
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={tritoneIntensity}
          onChange={(e) => setTritoneIntensity(Number(e.target.value))}
          className="flex-1 gradient-slider"
        />
        <input
          type="number"
          value={tritoneIntensity}
          step="0.05"
          onChange={(e) => setTritoneIntensity(Number(e.target.value))}
          className="text-xs text-white w-8 text-right bg-transparent border border-white/20 rounded px-1"
        />
      </div>
    </div>
    <div className="flex items-center gap-1">
      <input
        type="color"
        value={tritoneColor1}
        onChange={(e) => setTritoneColor1(e.target.value)}
        className="flex-1 h-8 rounded cursor-pointer"
      />
      <input
        type="color"
        value={tritoneColor2}
        onChange={(e) => setTritoneColor2(e.target.value)}
        className="flex-1 h-8 rounded cursor-pointer"
      />
      <input
        type="color"
        value={tritoneColor3}
        onChange={(e) => setTritoneColor3(e.target.value)}
        className="flex-1 h-8 rounded cursor-pointer"
      />
    </div>
  </>
)}
```

### 6. Add "Hue" Button (New Effect)
This requires adding a new effect type that applies hue rotation to all gradient colors.

#### Add to EffectType:
```tsx
type EffectType = '...' | 'hue-rotate' | '...';
```

#### Add to effect buttons list (in sorted position):
```tsx
{ value: 'hue-rotate', label: 'Hue' },
```

#### Add hue rotation state:
```tsx
const [hueRotateAmount, setHueRotateAmount] = useState(0);
```

#### Add UI controls for hue-rotate effect:
```tsx
{activeEffects.includes('hue-rotate') && (
  <>
    {isMultiFxMode && activeEffects.length > 1 && (
      <div className="text-xs font-semibold text-purple-300 mt-1 mb-0.5">Hue</div>
    )}
    <div className="flex items-center justify-between gap-1">
      <label className="text-xs text-white whitespace-nowrap">Rotation:</label>
      <div className="flex items-center gap-1 flex-1">
        <input
          type="range"
          min="0"
          max="360"
          value={hueRotateAmount}
          onChange={(e) => setHueRotateAmount(Number(e.target.value))}
          className="flex-1 gradient-slider"
        />
        <input
          type="number"
          value={hueRotateAmount}
          onChange={(e) => setHueRotateAmount(Number(e.target.value))}
          className="text-xs text-white w-12 text-right bg-transparent border border-white/20 rounded px-1"
        />
      </div>
    </div>
  </>
)}
```

#### Add hue-rotate effect rendering:
```tsx
case 'hue-rotate':
  if (!imageData) break;
  const hueData = imageData.data;
  for (let i = 0; i < hueData.length; i += 4) {
    const r = hueData[i];
    const g = hueData[i + 1];
    const b = hueData[i + 2];
    
    // Convert RGB to HSL
    const max = Math.max(r, g, b) / 255;
    const min = Math.min(r, g, b) / 255;
    const l = (max + min) / 2;
    let h = 0, s = 0;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      if (max === r / 255) h = ((g / 255 - b / 255) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g / 255) h = ((b / 255 - r / 255) / d + 2) / 6;
      else h = ((r / 255 - g / 255) / d + 4) / 6;
    }
    
    // Apply hue rotation
    h = (h + hueRotateAmount / 360) % 1;
    
    // Convert back to RGB
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    if (s === 0) {
      hueData[i] = hueData[i + 1] = hueData[i + 2] = l * 255;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      hueData[i] = hue2rgb(p, q, h + 1/3) * 255;
      hueData[i + 1] = hue2rgb(p, q, h) * 255;
      hueData[i + 2] = hue2rgb(p, q, h - 1/3) * 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  break;
```

## Files to Update
1. `/src/app/components/InteractiveGradient.tsx` - Main component file

## Testing
After implementation, test:
1. All slider values can be clicked and manually edited
2. Grain effect has smoother intensity scaling and type selection works
3. Grid effect has Size and Variation controls
4. Wave effect has rotation wheel
5. Tritone shows three color bars without labels
6. New "Hue" button applies hue rotation to the gradient
7. "Shift" button renamed from "Hue"
