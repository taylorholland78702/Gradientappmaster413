import { describe, it, expect } from 'vitest';

// Keeps `any` from creeping back in. The draw pipeline, snapshots and component props are typed
// (see hooks/canvasDrawTypes.ts, snapshotTypes.ts, randomizationTypes.ts); this reads the source
// and fails on an explicit `any` outside the short list below.
const raw = import.meta.glob(['./**/*.ts', './**/*.tsx', '!./**/*.test.ts', '!./**/*.test.tsx'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const ALLOWED: Record<string, number> = {
  // Look setters take a number or a string depending on the key; the map is indexed by LookParamKey.
  './hooks/useLooks.ts': 1,
};

const ANY = /(?::\s*any\b|=>\s*any\b|\bas any\b|<any>|\bany\[\])/g;

describe('type rules', () => {
  it('is looking at the source', () => {
    expect(Object.keys(raw).length).toBeGreaterThan(100);
  });

  it('has no explicit any outside the allowed list', () => {
    const counts = Object.entries(raw)
      .map(([path, src]) => [path, src.split('\n').filter(l => !l.trim().startsWith('//') && !l.trim().startsWith('{/*') && !l.trim().startsWith('*')).join('\n').match(ANY)?.length ?? 0] as const)
      .filter(([, n]) => n > 0);
    const unexpected = counts.filter(([path, n]) => n > (ALLOWED[path] ?? 0)).map(([path, n]) => `${path}: ${n}`);
    expect(unexpected).toEqual([]);
  });
});
