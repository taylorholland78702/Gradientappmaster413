// One small picture per effect for the Effects menu, each rendered from the app itself over the same Waves gradient and
// palette (see src/assets/effect-thumbs). An effect without a picture simply shows its name.
const files = import.meta.glob('../../assets/effect-thumbs/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

export const EFFECT_THUMBS: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.split('/').pop()!.replace(/\.webp$/, ''), url]),
);
