import { describe, it, expect } from 'vitest';
import { AUDIO_FEELS, matchingFeel } from './audioFeels';

const asCurrent = (f: (typeof AUDIO_FEELS)[number]) => ({ intensity: f.intensity, gains: { ...f.gains }, beatSync: { ...f.beatSync }, beatFx: { ...f.beatFx } });

describe('audio feels', () => {
  it('recognises each feel when its exact settings are in place', () => {
    for (const f of AUDIO_FEELS) expect(matchingFeel(asCurrent(f))).toBe(f.id);
  });
  it('matches nothing once any one setting is changed by hand', () => {
    const c = asCurrent(AUDIO_FEELS[1]);
    expect(matchingFeel({ ...c, intensity: c.intensity + 0.5 })).toBeNull();
    expect(matchingFeel({ ...c, gains: { ...c.gains, mids: 5 } })).toBeNull();
    expect(matchingFeel({ ...c, beatSync: { ...c.beatSync, treble: true } })).toBeNull();
    expect(matchingFeel({ ...c, beatFx: { ...c.beatFx, shake: true } })).toBeNull();
  });
  it('keeps every gain inside the 0-5 range of the band controls', () => {
    for (const f of AUDIO_FEELS) for (const g of Object.values(f.gains)) { expect(g).toBeGreaterThanOrEqual(0); expect(g).toBeLessThanOrEqual(5); }
  });
});
