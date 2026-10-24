import { describe, it, expect } from 'vitest';

// Guards for the design system (see styles/theme.css). These read the component source, so a stray
// off-ladder value fails here instead of drifting back in.
const raw = import.meta.glob('./*.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const files = Object.entries(raw).map(([path, src]) => ({ name: path.replace('./', ''), src }));
const offenders = (re: RegExp) => files.flatMap(f => [...f.src.matchAll(re)].map(m => `${f.name}: ${m[0]}`));

describe('design rules', () => {
  it('is looking at the components', () => {
    expect(files.length).toBeGreaterThan(10);
    expect(files.map(f => f.name)).toContain('SliderRow.tsx');
  });

  it('uses named opacity steps instead of raw alphas for text, borders and fills', () => {
    // bg-white/90 is the primary button hover; everything else goes through a wav-* token.
    const bad = offenders(/(?<![\w-])(?:[a-z]+:)*(?:text|border|bg)-(?:white|black)\/(?!90\b)\d+/g);
    expect(bad).toEqual([]);
  });

  it('keeps surfaces and buttons square: no large radii', () => {
    expect(offenders(/rounded-(?:md|lg|xl|2xl|3xl)\b/g)).toEqual([]);
  });

  it('takes status colours from the tokens', () => {
    expect(offenders(/(?:text|bg|border)-(?:red|green|yellow|purple|pink|emerald|amber)-\d+/g)).toEqual([]);
  });

  it('draws horizontal slider rows with SliderRow, not by hand', () => {
    const ranges = files.filter(f => f.name !== 'SliderRow.tsx').reduce((n, f) => n + (f.src.match(/<input\b[^>]*?type="range"/g)?.length ?? 0), 0);
    // Four vertical audio faders, the Auto Shuffle interval in About and in its popout.
    expect(ranges).toBeLessThanOrEqual(6);
  });

  it('builds single-choice buttons with choice(), not per-site class strings', () => {
    const bad = offenders(/aria-pressed=\{[^}]*\}[^>]*className="[^"]*\bpx-\d/g);
    expect(bad).toEqual([]);
  });

  it('shows on/off settings as a Switch, not as an ON/OFF text button', () => {
    expect(offenders(/\?\s*'(?:ON|OFF|On|Off)'\s*:\s*'(?:ON|OFF|On|Off)'/g)).toEqual([]);
  });
});
