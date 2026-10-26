import { describe, it, expect } from 'vitest';
import { resolveParam } from './modResolve';

describe('resolveParam', () => {
  it('finds a setting from its slider label inside the gradient or effect it belongs to', () => {
    expect(resolveParam('Scale:', ['Noise'])).toBe('noiseScale');
    expect(resolveParam('Intensity:', ['Cathode'])).toBe('crtIntensity');
    expect(resolveParam('Speed:', ['Slit-Scan'])).toBe('slitScanSpeed');
  });
  it('reads the slider names that differ from the setting name', () => {
    expect(resolveParam('Intensity:', ['Aura Glow'])).toBe('auraGlowOpacity');
    expect(resolveParam('Lights:', ['Aura Glow'])).toBe('auraGlowCount');
    expect(resolveParam('Crackle:', ['Grain'])).toBe('dustCrackleIntensity');
    expect(resolveParam('Strength:', ['Slit-Scan'])).toBe('slitScanIntensity');
    expect(resolveParam('Intensity:', ['Vignette'])).toBe('vignetteStrength');
    expect(resolveParam('Points:', ['Attractor'])).toBe('attractorPointCount');
    expect(resolveParam('Tile Size:', ['Tiling'])).toBe('tilingSize');
    expect(resolveParam('Tile Size:', ['Truchet'])).toBe('truchetSize');
  });
  it('gives null for a slider with no setting, and never invents one from another category', () => {
    expect(resolveParam('Speed:', ['Angle'])).toBeNull();
    expect(resolveParam('Nonsense:', ['Noise'])).toBeNull();
    expect(resolveParam('Scale:', [])).toBeNull();
  });
});
