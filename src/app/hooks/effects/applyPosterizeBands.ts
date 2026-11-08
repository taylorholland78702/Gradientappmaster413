import type { EffectCtx } from '../canvasDrawTypes';
import { applyHardBands } from './applyHardBands';
import { applyPosterize } from './applyPosterize';

// Posterize is two ways of flattening colour in one: Levels (each colour channel reduced to a few steps) and Palette
// (brightness split into flat bands, each filled with one colour of the palette). Each keeps its own settings.
export function applyPosterizeBands(P: EffectCtx): void {
  if (P.posterizeMode === 'palette') applyHardBands(P); else applyPosterize(P);
}
