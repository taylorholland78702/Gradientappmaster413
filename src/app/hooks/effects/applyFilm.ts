import type { EffectCtx } from '../canvasDrawTypes';
import { applyFilmBurn } from './applyFilmBurn';
import { applyFilmStock } from './applyFilmStock';

// Film is two film looks in one: Stock (the colour response, highlight roll-off, grain and halation of a film print)
// and Burn (burn glows, dust, scratches, flicker and hot frames). Each keeps its own settings.
export function applyFilm(P: EffectCtx): void {
  if (P.filmMode === 'burn') applyFilmBurn(P); else applyFilmStock(P);
}
