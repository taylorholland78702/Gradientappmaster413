// One small picture per gradient for the Gradients menu, rendered from the app itself with the same palette (see
// src/assets/gradient-thumbs). A gradient without a picture simply shows its name.
const files = import.meta.glob('../../assets/gradient-thumbs/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

export const GRADIENT_THUMBS: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.split('/').pop()!.replace(/\.webp$/, ''), url]),
);
