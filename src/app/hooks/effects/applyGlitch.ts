import type { EffectCtx } from '../canvasDrawTypes';
import { applyGlitchBlocks } from './applyGlitchBlocks';
import { applyRowSmear } from './applyRowSmear';

// Glitch is two digital-tearing effects in one: Blocks (rectangles that jump sideways with a colour split) and Rows
// (rows of held pixels dragged into streaks). Each keeps its own settings, so switching mode switches which are used.
export function applyGlitch(P: EffectCtx): void {
  if (P.glitchMode === 'rows') applyRowSmear(P); else applyGlitchBlocks(P);
}
